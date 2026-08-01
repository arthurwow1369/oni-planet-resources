import assert from 'node:assert/strict'
import test from 'node:test'

import {
  accessApplicationPayload,
  accessPolicyPayload,
  configFor,
  ensureAccessProtection,
  ensureCustomDomain,
  ensurePagesProject,
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
