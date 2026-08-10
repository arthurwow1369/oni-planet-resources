#!/usr/bin/env node
/** Download verified local ONI icons from the wiki.gg MediaWiki API (no game install used). */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = path.join(root, 'public/data')
const outputDirectory = path.join(root, 'public/assets/oni-icons')
const api = 'https://oxygennotincluded.wiki.gg/api.php'
const wiki = 'https://oxygennotincluded.wiki.gg/wiki/'
const concurrency = 4

// Only display names which differ from the wiki's file naming need aliases.
const resourceAliases = {
  'Alveo Vera': ['Bluegrass'],
  'Alveo Vera Seed': ['Bluegrass Seed'],
  'Beeta (via Beeta Hive)': ['Beeta'],
  'Bluff Briar Seed': ['Bluff Briar'],
  'Bristle Blossom Seed': ['Bristle Blossom'],
  'Dusk Cap Spore': ['Dusk Cap'],
  'Jumping Joya Seed': ['Jumping Joya'],
  'Large Fossil Fragment': ['Fossil'],
  'Mellow Mallow Seed': ['Mellow Mallow'],
  'Ovagro': ['Ovagro Node'],
  'Ovagro Seed': ['Ovagro Node Seed', 'Ovagro'],
  'Puft Prince': ['Puft Prince'],
  'Puft Alpha': ['Puft Alpha'],
  'Rhexes': ['Rhex'],
  'Ring Rose Seed': ['Rosebush Seed', 'Ring Rose'],
  'Small Fossil Fragment': ['Fossil'],
  'Spindly Grubfruit Seed': ['Spindly Grubfruit'],
  'Swamp Chard Plant': ['Swamp Chard'],
  'Tranquil Toes Seed': ['Tranquil Toes'],
  'Wheezewort Seed': ['Wheezewort'],
}
// World and geyser artwork deliberately has no fuzzy aliases. A world alias may
// be added only for a documented one-to-one ONI naming difference after the API
// confirms its exact PNG; geyser variants never borrow generic vent artwork.
const worldAliases = {}
const fileName = (group, id) => `${group}-${id.replaceAll(/[^a-zA-Z0-9_-]/g, '_')}.png`
const fileTitle = (name) => `File:${name.replaceAll(' ', '_')}.png`
const sourcePageUrl = (title) => `${wiki}${encodeURIComponent(title).replaceAll('%3A', ':')}`

function retryDelay(response, attempt) {
  const retryAfter = response?.headers?.get('retry-after')
  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const retryAt = retryAfter ? Date.parse(retryAfter) : NaN
  if (Number.isFinite(retryAt)) return Math.max(0, retryAt - Date.now())
  return (attempt + 1) * 1000
}

async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    let response
    try {
      response = await fetch(url, { headers: { 'user-agent': 'oni-planet-resources icon downloader/1.0' } })
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, retryDelay(undefined, attempt)))
      continue
    }
    if (response.ok) return response
    if ((response.status !== 429 && response.status < 500) || attempt === 3) throw new Error(`HTTP ${response.status}`)
    await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)))
  }
  throw new Error('unreachable')
}

async function fetchJson(url) {
  return (await fetchWithRetry(url)).json()
}

/** Query files in 50-title batches, well below MediaWiki's API limit. */
async function resolveFiles(candidates) {
  const resolved = new Map()
  const unique = [...new Set(candidates)]
  for (let start = 0; start < unique.length; start += 50) {
    const batch = unique.slice(start, start + 50)
    const url = new URL(api)
    url.search = new URLSearchParams({
      action: 'query', titles: batch.map(fileTitle).join('|'), prop: 'imageinfo', iiprop: 'url|size|mime', format: 'json',
    }).toString()
    const json = await fetchJson(url)
    for (const [pageId, page] of Object.entries(json.query?.pages ?? {})) {
      const info = page.imageinfo?.[0]
      if (pageId === '-1' || !info || info.mime !== 'image/png' || !info.url) continue
      const candidate = batch.find((item) => fileTitle(item).replaceAll('_', ' ').toLowerCase() === page.title.toLowerCase())
      if (candidate) resolved.set(candidate, { title: page.title, url: info.url, sourcePageUrl: info.descriptionurl })
    }
  }
  return resolved
}

async function download(url, destination) {
  const response = await fetchWithRetry(url)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  if (bytes.length < 8 || !bytes.slice(0, 8).every((value, index) => value === signature[index])) throw new Error('download was not a PNG')
  await writeFile(destination, bytes)
}

function firstResolved(candidates, resolvedFiles) {
  for (const candidate of [...new Set(candidates)]) {
    const result = resolvedFiles.get(candidate)
    if (result) return { candidate, ...result }
  }
  return null
}

async function main() {
  const resources = JSON.parse(await readFile(path.join(dataDirectory, 'resources.json'), 'utf8'))
  const poiData = JSON.parse(await readFile(path.join(dataDirectory, 'space-pois.json'), 'utf8'))
  const worlds = JSON.parse(await readFile(path.join(dataDirectory, 'worlds.json'), 'utf8'))
  const geysers = JSON.parse(await readFile(path.join(dataDirectory, 'geysers.json'), 'utf8'))
  const entries = [
    ...resources.map((resource) => ({ group: 'resources', id: resource.simhash, name: resource.name_en, candidates: [resource.name_en, ...(resourceAliases[resource.name_en] ?? [])] })),
    // Artifact artwork must resolve to its own named file. A generic artifact
    // marker would falsely appear to be art for a specific Space POI.
    ...poiData.pois.map((poi) => ({ group: 'pois', id: poi.id, name: poi.name_en, candidates: [poi.name_en] })),
    // Use only the exact named world PNG, with explicitly documented aliases.
    ...worlds.map((world) => ({ group: 'worlds', id: world.id, name: world.name_en, candidates: [world.name_en, ...(worldAliases[world.name_en] ?? [])] })),
    // Do not substitute a generic gas/liquid/volcano icon for a specific vent.
    ...geysers.map((geyser) => ({ group: 'geysers', id: geyser.id, name: geyser.name_en, candidates: [geyser.name_en] })),
  ]
  const resolvedFiles = await resolveFiles(entries.flatMap((entry) => entry.candidates))
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(outputDirectory, { recursive: true })
  const index = {
    schema_version: 1,
    generated_by: 'scripts/download_oni_icons.mjs',
    mediawiki_api: api,
    resources: {},
    pois: {},
    worlds: {},
    geysers: {},
    misses: { resources: [], pois: [], worlds: [], geysers: [] },
  }
  let cursor = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < entries.length) {
      const entry = entries[cursor++]
      const resolved = firstResolved(entry.candidates, resolvedFiles)
      if (!resolved) {
        index.misses[entry.group].push({ id: entry.id, name_en: entry.name, reason: 'no exact PNG file' })
        continue
      }
      const name = fileName(entry.group.slice(0, -1), entry.id)
      try {
        await download(resolved.url, path.join(outputDirectory, name))
        index[entry.group][entry.id] = { path: `assets/oni-icons/${name}`, source_page_url: resolved.sourcePageUrl ?? sourcePageUrl(resolved.title), file_title: resolved.title }
      } catch (error) {
        console.warn(`Download failed for ${entry.name}: ${error.message}`)
        index.misses[entry.group].push({ id: entry.id, name_en: entry.name, reason: `download failed: ${error.message}` })
      }
    }
  })
  await Promise.all(workers)
  await writeFile(path.join(dataDirectory, 'icon-index.json'), `${JSON.stringify(index, null, 2)}\n`)
  console.log(`Resources: ${Object.keys(index.resources).length}/${resources.length} resolved; ${index.misses.resources.length} missed`)
  console.log(`POIs: ${Object.keys(index.pois).length}/${poiData.pois.length} resolved; ${index.misses.pois.length} missed`)
  console.log(`Worlds: ${Object.keys(index.worlds).length}/${worlds.length} resolved; ${index.misses.worlds.length} missed`)
  console.log(`Geysers: ${Object.keys(index.geysers).length}/${geysers.length} resolved; ${index.misses.geysers.length} missed`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
