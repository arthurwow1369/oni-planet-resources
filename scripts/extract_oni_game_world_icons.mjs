#!/usr/bin/env node
/** Export explicitly verified ONI world artwork from a locally loaded AssetRipper instance. */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetRipper = process.env.ASSETRIPPER_URL ?? 'http://127.0.0.1:56047'
const iconDirectory = path.join(root, 'public/assets/oni-icons')
const indexPath = path.join(root, 'public/data/icon-index.json')

// World ID → exact Texture2D name from the owned game's loaded asset index.
const worlds = [
  ['worlds/ForestHot', 'Asteroid_hotforest'],
  ['worlds/Badlands', 'Asteroid_badlands'],
  ['worlds/Volcanic', 'Asteroid_volcanic'],
  ['worlds/Oceania', 'Asteroid_oceania'],
  ['worlds/Oasis', 'Asteroid_oasis'],
  ['worlds/SandstoneDefault', 'Asteroid_sandstone'],
  ['dlc2::worlds/CeresBaseGameShatteredAsteroid', 'asteroid_base_ceres_shattered_0'],
  ['dlc2::worlds/CeresClassicShatteredAsteroid', 'asteroid_classic_ceres_shattered_0'],
  ['dlc4::worlds/PrehistoricBaseGameAsteroid', 'prehistoric_asteroid_base_0'],
  ['dlc4::worlds/MixingPrehistoricAsteroid', 'asteroid_prehistoric_0'],
  ['dlc4::worlds/PrehistoricSpacedOutAsteroid', 'prehistoric_asteroid_so_0'],
  ['expansion1::worlds/OilyMoonlet', 'asteroid_oil_planet_0'],
]

const fileName = (id) => `world-${id.replaceAll(/[^a-zA-Z0-9_-]/g, '_')}.png`
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]

async function assetImage(textureName) {
  const search = new URL('/Search/View', assetRipper)
  search.searchParams.set('q', textureName)
  const html = await (await fetch(search)).text()
  const assetHref = [...html.matchAll(/href="([^"?]+\?Path=[^"]+)"[^>]*>[^<]*<\/a>/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .find((href) => href.startsWith('/Assets/View?'))
  if (!assetHref) throw new Error(`${textureName}: not found in AssetRipper`)
  const assetHtml = await (await fetch(new URL(assetHref, assetRipper))).text()
  const imageHref = assetHtml.match(/href="([^"?]+\?Path=[^"]+&(?:amp;)?Extension=png)"/i)?.[1]?.replaceAll('&amp;', '&')
  if (!imageHref) throw new Error(`${textureName}: no PNG export`)
  return new URL(imageHref, assetRipper)
}

async function main() {
  await mkdir(iconDirectory, { recursive: true })
  const index = JSON.parse(await readFile(indexPath, 'utf8'))
  for (const [id, textureName] of worlds) {
    const response = await fetch(await assetImage(textureName))
    if (!response.ok) throw new Error(`${textureName}: AssetRipper returned HTTP ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.length < 8 || !bytes.slice(0, 8).every((value, position) => value === pngSignature[position])) throw new Error(`${textureName}: export is not PNG`)
    const name = fileName(id)
    await writeFile(path.join(iconDirectory, name), bytes)
    index.worlds[id] = { path: `assets/oni-icons/${name}`, source: 'local-owned-game', local_asset: `Texture2D ${textureName}` }
    index.misses.worlds = index.misses.worlds.filter((item) => item.id !== id)
    console.log(`Exported ${id} from ${textureName}`)
  }
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`)
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
