import assert from 'node:assert/strict'
import test from 'node:test'

import {
  accessApplicationPayload,
  accessPolicyPayload,
  configFor,
  ensureAccessProtection,
  ensureCustomDomain,
  ensureDnsRecord,
  ensurePagesProject,
  finalizeDeployment,
} from './configure_cloudflare.mjs'

class FakeClient {
  constructor({ optionalResults = [], requestResults = [] } = {}) {
    this.accountId = 'account-id'
    this.zoneId = 'zone-id'
    this.optionalResults = [...optionalResults]
    this.requestResults = [...requestResults]
    this.calls = []
  }

  async optional(path) {
    this.calls.push(['OPTIONAL', path])
    return this.optionalResults.shift() ?? null
  }

  async request(method, path, body) {
    this.calls.push([method, path, body])
    if (this.requestResults.length === 0) {
      throw new Error(`No fake result available for ${method} ${path}`)
    }
    return this.requestResults.shift()
  }
}

test('deployment stages have isolated projects and expected branches', () => {
  assert.deepEqual(configFor('dev'), {
    branch: 'dev',
    domain: 'game-dev.kingdom-innovator.com',
    project: 'oni-planet-resources-dev',
    protectWithAccess: true,
  })
  assert.deepEqual(configFor('prod'), {
    branch: 'main',
    domain: 'game.kingdom-innovator.com',
    project: 'oni-planet-resources-prod',
    protectWithAccess: false,
  })
  assert.throws(() => configFor('preview'), /Unknown deployment stage/)
})

test('creates a Pages project only when it does not exist', async () => {
  const config = configFor('dev')
  const client = new FakeClient({ requestResults: [{ name: config.project }] })

  const project = await ensurePagesProject(client, config)

  assert.equal(project.name, config.project)
  assert.deepEqual(client.calls, [
    ['OPTIONAL', '/accounts/account-id/pages/projects/oni-planet-resources-dev'],
    [
      'POST',
      '/accounts/account-id/pages/projects',
      { name: 'oni-planet-resources-dev', production_branch: 'dev' },
    ],
  ])
})

test('rejects an existing Pages project with the wrong production branch', async () => {
  const client = new FakeClient({ optionalResults: [{ production_branch: 'main' }] })
  await assert.rejects(() => ensurePagesProject(client, configFor('dev')), /expected dev/)
})

test('creates Google-only Access application and email allow policy', async () => {
  const client = new FakeClient({
    requestResults: [
      [],
      [{ id: 'google-idp', name: 'Google', type: 'google-apps' }],
      { id: 'app-id', domain: 'game-dev.kingdom-innovator.com' },
      [],
      { id: 'policy-id' },
    ],
  })

  await ensureAccessProtection(client, configFor('dev'), 'arthur@example.com')

  assert.deepEqual(client.calls[2], [
    'POST',
    '/accounts/account-id/access/apps',
    accessApplicationPayload(configFor('dev'), 'google-idp'),
  ])
  assert.deepEqual(client.calls[4], [
    'POST',
    '/accounts/account-id/access/apps/app-id/policies',
    accessPolicyPayload('arthur@example.com'),
  ])
})

test('production setup never creates an Access application', async () => {
  const client = new FakeClient({ requestResults: [[]] })
  const result = await ensureAccessProtection(client, configFor('prod'), undefined)
  assert.equal(result, null)
  assert.deepEqual(client.calls, [
    ['GET', '/accounts/account-id/access/apps?per_page=100', undefined],
  ])
})

test('dev setup removes every unmanaged Access policy', async () => {
  const client = new FakeClient({
    requestResults: [
      [{ id: 'app-id', domain: 'game-dev.kingdom-innovator.com', type: 'self_hosted' }],
      [{ id: 'google-idp', name: 'Google', type: 'google-apps' }],
      { id: 'app-id', domain: 'game-dev.kingdom-innovator.com' },
      [
        { id: 'managed-id', name: 'Allow authorized Google account' },
        { id: 'bypass-id', name: 'Temporary bypass' },
      ],
      {},
      { id: 'managed-id' },
    ],
  })

  await ensureAccessProtection(client, configFor('dev'), 'arthur@example.com')

  assert.deepEqual(client.calls[4], [
    'DELETE',
    '/accounts/account-id/access/apps/app-id/policies/bypass-id',
    undefined,
  ])
  assert.equal(client.calls[5][0], 'PUT')
})

test('creates a missing Pages custom domain', async () => {
  const client = new FakeClient({
    requestResults: [{ name: 'game-dev.kingdom-innovator.com', status: 'pending' }],
  })

  await ensureCustomDomain(client, configFor('dev'))

  assert.deepEqual(client.calls, [
    [
      'OPTIONAL',
      '/accounts/account-id/pages/projects/oni-planet-resources-dev/domains/game-dev.kingdom-innovator.com',
    ],
    [
      'POST',
      '/accounts/account-id/pages/projects/oni-planet-resources-dev/domains',
      { name: 'game-dev.kingdom-innovator.com' },
    ],
  ])
})

test('creates a proxied CNAME for the Pages custom domain', async () => {
  const client = new FakeClient({
    requestResults: [
      { subdomain: 'oni-planet-resources-dev.pages.dev' },
      [],
      { id: 'dns-id', proxied: true },
    ],
  })

  await ensureDnsRecord(client, configFor('dev'))

  assert.deepEqual(client.calls, [
    [
      'GET',
      '/accounts/account-id/pages/projects/oni-planet-resources-dev',
      undefined,
    ],
    [
      'GET',
      '/zones/zone-id/dns_records?name=game-dev.kingdom-innovator.com&per_page=100',
      undefined,
    ],
    [
      'POST',
      '/zones/zone-id/dns_records',
      {
        comment: 'Managed by oni-planet-resources-dev deployment workflow',
        content: 'oni-planet-resources-dev.pages.dev',
        name: 'game-dev.kingdom-innovator.com',
        proxied: true,
        ttl: 1,
        type: 'CNAME',
      },
    ],
  ])
})

test('keeps an already-correct Pages CNAME unchanged', async () => {
  const record = {
    content: 'oni-planet-resources-dev.pages.dev',
    id: 'dns-id',
    proxied: true,
    type: 'CNAME',
  }
  const client = new FakeClient({
    requestResults: [{ subdomain: record.content }, [record]],
  })

  const result = await ensureDnsRecord(client, configFor('dev'))

  assert.equal(result, record)
  assert.equal(client.calls.length, 2)
})

test('updates stale and unproxied Pages CNAMEs independently', async () => {
  const target = 'oni-planet-resources-dev.pages.dev'
  const cases = [
    { content: 'old.pages.dev', id: 'stale-id', proxied: true, type: 'CNAME' },
    { content: target, id: 'unproxied-id', proxied: false, type: 'CNAME' },
  ]

  for (const record of cases) {
    const client = new FakeClient({
      requestResults: [
        { subdomain: target },
        [record],
        { id: record.id, proxied: true },
      ],
    })

    await ensureDnsRecord(client, configFor('dev'))

    assert.deepEqual(client.calls[2], [
      'PUT',
      `/zones/zone-id/dns_records/${record.id}`,
      {
        comment: 'Managed by oni-planet-resources-dev deployment workflow',
        content: target,
        name: 'game-dev.kingdom-innovator.com',
        proxied: true,
        ttl: 1,
        type: 'CNAME',
      },
    ])
  }
})

test('refuses non-CNAME and ambiguous DNS collisions', async () => {
  const nonCname = new FakeClient({
    requestResults: [
      { subdomain: 'oni-planet-resources-dev.pages.dev' },
      [{ id: 'dns-id', type: 'A' }],
    ],
  })
  await assert.rejects(() => ensureDnsRecord(nonCname, configFor('dev')), /non-CNAME/)

  const multiple = new FakeClient({
    requestResults: [
      { subdomain: 'oni-planet-resources-dev.pages.dev' },
      [
        { id: 'one', type: 'CNAME' },
        { id: 'two', type: 'CNAME' },
      ],
    ],
  })
  await assert.rejects(() => ensureDnsRecord(multiple, configFor('dev')), /Multiple DNS records/)
})

test('finalization reconciles DNS before domain activation and verification', async () => {
  const record = {
    content: 'oni-planet-resources-dev.pages.dev',
    id: 'dns-id',
    proxied: true,
    type: 'CNAME',
  }
  const client = new FakeClient({
    optionalResults: [{ name: 'game-dev.kingdom-innovator.com', status: 'active' }],
    requestResults: [
      { subdomain: record.content },
      [record],
      { name: 'game-dev.kingdom-innovator.com', status: 'active' },
      [record],
    ],
  })

  await finalizeDeployment(client, configFor('dev'))

  assert.deepEqual(
    client.calls.map(([method, path]) => [method, path]),
    [
      ['GET', '/accounts/account-id/pages/projects/oni-planet-resources-dev'],
      ['GET', '/zones/zone-id/dns_records?name=game-dev.kingdom-innovator.com&per_page=100'],
      [
        'OPTIONAL',
        '/accounts/account-id/pages/projects/oni-planet-resources-dev/domains/game-dev.kingdom-innovator.com',
      ],
      [
        'GET',
        '/accounts/account-id/pages/projects/oni-planet-resources-dev/domains/game-dev.kingdom-innovator.com',
      ],
      ['GET', '/zones/zone-id/dns_records?name=game-dev.kingdom-innovator.com&per_page=100'],
    ],
  )
})
