#!/usr/bin/env node
/** Export unverified ONI world-art candidates for visual review; does not edit icon-index.json. */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetRipper = process.env.ASSETRIPPER_URL ?? 'http://127.0.0.1:56047'
const output = path.join(root, 'tmp/oni-world-candidates')
const candidates = [
  'asteroid_classic_ceres_0',
  'asteroid_classic_mini_ceres_so_0',
  'prehistoric_asteroid_classic_0',
  'asteroid_moonlet_top_0',
  'asteroid_moonlet_middle_0',
  'asteroid_moonlet_bottom_0',
  'asteroid_flame_inner_0',
  'asteroid_flame_outer_0',
]

async function imageUrl(name) {
  const search = new URL('/Search/View', assetRipper)
  search.searchParams.set('q', name)
  const searchHtml = await (await fetch(search)).text()
  const assetHref = [...searchHtml.matchAll(/href="([^"?]+\?Path=[^"]+)"[^>]*>[^<]*<\/a>/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .find((href) => href.startsWith('/Assets/View?'))
  if (!assetHref) throw new Error(`${name}: not found`)
  const assetHtml = await (await fetch(new URL(assetHref, assetRipper))).text()
  const href = assetHtml.match(/href="([^"?]+\?Path=[^"]+&(?:amp;)?Extension=png)"/i)?.[1]?.replaceAll('&amp;', '&')
  if (!href) throw new Error(`${name}: no PNG export`)
  return new URL(href, assetRipper)
}

await mkdir(output, { recursive: true })
for (const name of candidates) {
  const response = await fetch(await imageUrl(name))
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  await writeFile(path.join(output, `${name}.png`), new Uint8Array(await response.arrayBuffer()))
  console.log(`${name}.png`)
}
