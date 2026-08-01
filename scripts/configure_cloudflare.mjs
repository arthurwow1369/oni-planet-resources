const API_BASE = 'https://api.cloudflare.com/client/v4'

const STAGES = Object.freeze({
  dev: Object.freeze({
    branch: 'dev',
    domain: 'game-dev.kingdom-innovator.com',
    project: 'oni-planet-resources-dev',
    protectWithAccess: true,
  }),
  prod: Object.freeze({
    branch: 'main',
    domain: 'game.kingdom-innovator.com',
    project: 'oni-planet-resources-prod',
    protectWithAccess: false,
  }),
})

export class CloudflareApiError extends Error {
  constructor(message, status, errors = []) {
    super(message)
    this.name = 'CloudflareApiError'
    this.status = status
    this.errors = errors
  }
}

export class CloudflareClient {
  constructor({ accountId, apiToken, zoneId, fetchImpl = fetch }) {
    this.accountId = accountId
    this.apiToken = apiToken
    this.zoneId = zoneId
    this.fetchImpl = fetchImpl
  }

  async request(method, path, body) {
    const response = await this.fetchImpl(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const text = await response.text()
    const payload = text ? JSON.parse(text) : {}
    if (!response.ok || payload.success === false) {
      const errors = payload.errors ?? []
      throw new CloudflareApiError(
        `${method} ${path} failed (${response.status}): ${JSON.stringify(errors)}`,
        response.status,
        errors,
      )
    }
    return payload.result
  }

  async optional(path) {
    try {
      return await this.request('GET', path)
    } catch (error) {
      if (error instanceof CloudflareApiError && error.status === 404) return null
      throw error
    }
  }
}

export function configFor(stage) {
  const config = STAGES[stage]
  if (!config) throw new Error(`Unknown deployment stage: ${stage}`)
  return config
}

export function accessApplicationPayload(config, identityProviderId) {
  return {
    allowed_idps: [identityProviderId],
    app_launcher_visible: false,
    auto_redirect_to_identity: true,
    domain: config.domain,
    enable_binding_cookie: true,
    http_only_cookie_attribute: true,
    name: 'ONI Planet Resources Dev',
    session_duration: '24h',
    type: 'self_hosted',
  }
}

export function accessPolicyPayload(email) {
  return {
    decision: 'allow',
    exclude: [],
    include: [{ email: { email } }],
    name: 'Allow authorized Google account',
    precedence: 1,
    require: [],
    session_duration: '24h',
  }
}

export async function ensurePagesProject(client, config) {
  const account = encodeURIComponent(client.accountId)
  const project = encodeURIComponent(config.project)
  const path = `/accounts/${account}/pages/projects/${project}`
  const existing = await client.optional(path)
  if (existing) {
    if (existing.production_branch !== config.branch) {
      throw new Error(
        `Pages project ${config.project} uses production branch ${existing.production_branch}, expected ${config.branch}`,
      )
    }
    console.log(`Pages project: existing (${config.project})`)
    return existing
  }

  const created = await client.request('POST', `/accounts/${account}/pages/projects`, {
    name: config.project,
    production_branch: config.branch,
  })
  console.log(`Pages project: created (${config.project})`)
  return created
}

function isGoogleIdentityProvider(provider) {
  return `${provider.name ?? ''} ${provider.type ?? ''}`.toLowerCase().includes('google')
}

export async function ensureAccessProtection(client, config, email) {
  const account = encodeURIComponent(client.accountId)
  const apps = await client.request('GET', `/accounts/${account}/access/apps?per_page=100`)
  const matchingApps = apps.filter(
    (candidate) => candidate.type === 'self_hosted' && candidate.domain === config.domain,
  )

  if (!config.protectWithAccess) {
    if (matchingApps.length > 0) {
      throw new Error(
        `Production hostname ${config.domain} is protected by an Access application; production must remain public`,
      )
    }
    console.log(`Access application: absent as required (${config.domain})`)
    return null
  }

  if (!email) throw new Error('CLOUDFLARE_ACCESS_EMAIL is required for the dev deployment')
  if (matchingApps.length > 1) {
    throw new Error(`Multiple Access applications protect ${config.domain}; refusing ambiguous policy changes`)
  }

  const providers = await client.request(
    'GET',
    `/accounts/${account}/access/identity_providers`,
  )
  const googleProvider = providers.find(isGoogleIdentityProvider)
  if (!googleProvider) throw new Error('No Google identity provider is configured in Cloudflare Access')

  let app = matchingApps[0]
  const appPayload = accessApplicationPayload(config, googleProvider.id)
  if (app) {
    app = await client.request(
      'PUT',
      `/accounts/${account}/access/apps/${encodeURIComponent(app.id)}`,
      appPayload,
    )
    console.log(`Access application: updated (${config.domain})`)
  } else {
    app = await client.request('POST', `/accounts/${account}/access/apps`, appPayload)
    console.log(`Access application: created (${config.domain})`)
  }

  const policiesPath = `/accounts/${account}/access/apps/${encodeURIComponent(app.id)}/policies`
  const policies = await client.request('GET', `${policiesPath}?per_page=100`)
  const policyPayload = accessPolicyPayload(email)
  const existingPolicy = policies.find((candidate) => candidate.name === policyPayload.name)
  for (const policy of policies) {
    if (policy.id !== existingPolicy?.id) {
      await client.request('DELETE', `${policiesPath}/${encodeURIComponent(policy.id)}`)
      console.log(`Access policy: removed unmanaged policy (${policy.name ?? policy.id})`)
    }
  }
  if (existingPolicy) {
    await client.request(
      'PUT',
      `${policiesPath}/${encodeURIComponent(existingPolicy.id)}`,
      policyPayload,
    )
    console.log('Access policy: updated')
  } else {
    await client.request('POST', policiesPath, policyPayload)
    console.log('Access policy: created')
  }

  return app
}

export async function ensureCustomDomain(client, config) {
  const account = encodeURIComponent(client.accountId)
  const project = encodeURIComponent(config.project)
  const domain = encodeURIComponent(config.domain)
  const path = `/accounts/${account}/pages/projects/${project}/domains/${domain}`
  let result = await client.optional(path)
  if (!result) {
    result = await client.request(
      'POST',
      `/accounts/${account}/pages/projects/${project}/domains`,
      { name: config.domain },
    )
    console.log(`Pages custom domain: created (${config.domain})`)
  } else {
    console.log(`Pages custom domain: existing (${config.domain})`)
  }
  return result
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function waitForCustomDomain(client, config, attempts = 30, delayMs = 10_000) {
  const account = encodeURIComponent(client.accountId)
  const project = encodeURIComponent(config.project)
  const domain = encodeURIComponent(config.domain)
  const path = `/accounts/${account}/pages/projects/${project}/domains/${domain}`

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await client.request('GET', path)
    if (result.status === 'active') {
      console.log(`Pages custom domain: active (${config.domain})`)
      return result
    }
    if (result.status === 'deactivated' || result.status === 'error') {
      throw new Error(`Pages custom domain entered ${result.status}: ${JSON.stringify(result)}`)
    }
    console.log(`Pages custom domain: ${result.status ?? 'pending'} (${attempt}/${attempts})`)
    if (attempt < attempts) await sleep(delayMs)
  }
  throw new Error(`Timed out waiting for ${config.domain} to become active`)
}

export async function verifyDns(client, config) {
  const zone = encodeURIComponent(client.zoneId)
  const records = await client.request(
    'GET',
    `/zones/${zone}/dns_records?name=${encodeURIComponent(config.domain)}&per_page=100`,
  )
  if (records.length === 0) throw new Error(`No DNS record exists for ${config.domain}`)
  if (!records.some((record) => record.proxied === true)) {
    throw new Error(`DNS record for ${config.domain} is not proxied through Cloudflare`)
  }
  console.log(`DNS: proxied (${config.domain})`)
  return records
}

function requiredEnvironment(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export async function main(argv = process.argv.slice(2)) {
  const [phase, stage] = argv
  if (!['bootstrap', 'finalize'].includes(phase)) {
    throw new Error('Usage: node scripts/configure_cloudflare.mjs <bootstrap|finalize> <dev|prod>')
  }

  const config = configFor(stage)
  const client = new CloudflareClient({
    accountId: requiredEnvironment('CLOUDFLARE_ACCOUNT_ID'),
    apiToken: requiredEnvironment('CLOUDFLARE_API_TOKEN'),
    zoneId: requiredEnvironment('CLOUDFLARE_ZONE_ID'),
  })

  if (phase === 'bootstrap') {
    await ensurePagesProject(client, config)
    await ensureAccessProtection(client, config, process.env.CLOUDFLARE_ACCESS_EMAIL)
    return
  }

  await ensureCustomDomain(client, config)
  await waitForCustomDomain(client, config)
  await verifyDns(client, config)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
