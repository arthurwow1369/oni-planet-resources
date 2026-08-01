import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CloudflareClient,
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

  async requestAll(path) {
    this.calls.push(['ALL', path])
    if (this.requestResults.length === 0) {
      throw new Error(`No fake result available for GET ALL ${path}`)
    }
    return this.requestResults.shift()
  }

  async request(method, path, body) {
    this.calls.push([method, path, body])
    if (this.requestResults.length === 0) {
      throw new Error(`No fake result available for ${method} ${path}`)
    }
    return this.requestResults.shift()
  }
}

test('CloudflareClient consumes every API page', async () => {
  const pages = [[{ id: 'one' }, { id: 'two' }], [{ id: 'three' }]]
  const urls = []
  const client = new CloudflareClient({
    accountId: 'account-id',
    apiToken: 'test-token',
    fetchImpl: async (url) => {
      urls.push(url)
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ result: pages.shift(), success: true }),
      }
    },
    zoneId: 'zone-id',
  })

  const results = await client.requestAll('/accounts/account-id/access/apps', 2)

  assert.deepEqual(
    results.map(({ id }) => id),
    ['one', 'two', 'three'],
  )
  assert.deepEqual(urls, [
    'https://api.cloudflare.com/client/v4/accounts/account-id/access/apps?page=1&per_page=2',
    'https://api.cloudflare.com/client/v4/accounts/account-id/access/apps?page=2&per_page=2',
  ])
})

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
      { id: 'pages-app-id', domain: 'oni-planet-resources-dev.pages.dev' },
      [],
      { id: 'pages-policy-id' },
      { id: 'preview-app-id', domain: '*.oni-planet-resources-dev.pages.dev' },
      [],
      { id: 'preview-policy-id' },
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
  assert.equal(client.calls[5][2].domain, 'oni-planet-resources-dev.pages.dev')
  assert.equal(client.calls[8][2].domain, '*.oni-planet-resources-dev.pages.dev')
})

test('production setup never creates an Access application', async () => {
  const client = new FakeClient({ requestResults: [[]] })
  const result = await ensureAccessProtection(client, configFor('prod'), undefined)
  assert.deepEqual(result, [])
  assert.deepEqual(client.calls, [['ALL', '/accounts/account-id/access/apps']])
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
      { id: 'pages-app-id', domain: 'oni-planet-resources-dev.pages.dev' },
      [],
      { id: 'pages-policy-id' },
      { id: 'preview-app-id', domain: '*.oni-planet-resources-dev.pages.dev' },
      [],
      { id: 'preview-policy-id' },
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

test('rerun updates all three dev Access applications and exclusive policies', async () => {
  const apps = [
    { id: 'custom-app', domain: 'game-dev.kingdom-innovator.com', type: 'self_hosted' },
    { id: 'pages-app', domain: 'oni-planet-resources-dev.pages.dev', type: 'self_hosted' },
    { id: 'preview-app', domain: '*.oni-planet-resources-dev.pages.dev', type: 'self_hosted' },
  ]
  const managedPolicy = { id: 'managed-policy', name: 'Allow authorized Google account' }
  const client = new FakeClient({
    requestResults: [
      apps,
      [{ id: 'google-idp', name: 'Google', type: 'google-apps' }],
      apps[0],
      [managedPolicy],
      managedPolicy,
      apps[1],
      [managedPolicy],
      managedPolicy,
      apps[2],
      [managedPolicy],
      managedPolicy,
    ],
  })

  await ensureAccessProtection(client, configFor('dev'), 'arthur@example.com')

  for (const index of [2, 5, 8]) {
    assert.equal(client.calls[index][0], 'PUT')
    assert.deepEqual(client.calls[index][2].allowed_idps, ['google-idp'])
  }
  for (const index of [4, 7, 10]) {
    assert.equal(client.calls[index][0], 'PUT')
    assert.deepEqual(client.calls[index][2].include, [
      { email: { email: 'arthur@example.com' } },
    ])
  }
})

test('production rejects Access protection on every public target', async () => {
  const domains = [
    'game.kingdom-innovator.com',
    'oni-planet-resources-prod.pages.dev',
    '*.oni-planet-resources-prod.pages.dev',
  ]
  for (const domain of domains) {
    const client = new FakeClient({
      requestResults: [[{ domain, id: 'app-id', type: 'self_hosted' }]],
    })
    await assert.rejects(
      () => ensureAccessProtection(client, configFor('prod'), undefined),
      /production must remain public/,
    )
    assert.deepEqual(client.calls, [['ALL', '/accounts/account-id/access/apps']])
  }
})

test('duplicate Access applications fail preflight before any mutation', async () => {
  const domain = 'oni-planet-resources-dev.pages.dev'
  const client = new FakeClient({
    requestResults: [
      [
        { domain, id: 'duplicate-one', type: 'self_hosted' },
        { domain, id: 'duplicate-two', type: 'self_hosted' },
      ],
    ],
  })

  await assert.rejects(
    () => ensureAccessProtection(client, configFor('dev'), 'arthur@example.com'),
    /Multiple Access applications/,
  )
  assert.deepEqual(client.calls, [['ALL', '/accounts/account-id/access/apps']])
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
