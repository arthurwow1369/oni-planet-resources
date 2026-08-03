import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { LocaleToggle } from './components/LocaleToggle'
import { PlanetSelector } from './components/PlanetSelector'
import { ResourceDashboard } from './components/ResourceDashboard'
import { TerrainPicker } from './components/TerrainPicker'
import { dataUrl } from './dataUrl'
import { ui } from './i18n'
import type { GameCategory, Locale, SpecialResourceData, Stats, Subworld, TerrainResearchData, World } from './types'

const preferredWorld = 'dlc5::worlds/AquaticSpacedOutAsteroid'

function App() {
  const [locale, setLocale] = useState<Locale>('zh')
  const [worlds, setWorlds] = useState<World[]>([])
  const [subworlds, setSubworlds] = useState<Subworld[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [terrainResearch, setTerrainResearch] = useState<TerrainResearchData | null>(null)
  const [specialResourceData, setSpecialResourceData] = useState<SpecialResourceData | null>(null)
  const [gameCategories, setGameCategories] = useState<GameCategory[]>([])
  const [worldId, setWorldId] = useState('')
  const [selectedTerrainIds, setSelectedTerrainIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const t = ui[locale]

  useEffect(() => {
    Promise.all([
      fetch(dataUrl('worlds.json')).then((response) => response.json()),
      fetch(dataUrl('subworlds.json')).then((response) => response.json()),
      fetch(dataUrl('stats.json')).then((response) => response.json()),
      fetch(dataUrl('terrain-research.json')).then((response) => response.json()),
      fetch(dataUrl('game-categories.json')).then((response) => response.json()),
      fetch(dataUrl('special-resources.json')).then((response) => response.json()),
    ]).then(([worldData, terrainData, statsData, researchData, categoryData, specialData]: [World[], Subworld[], Stats, TerrainResearchData, GameCategory[], SpecialResourceData]) => {
      setWorlds(worldData)
      setSubworlds(terrainData)
      setStats(statsData)
      setTerrainResearch(researchData)
      setGameCategories(categoryData)
      setSpecialResourceData(specialData)
      const initial = worldData.find((world) => world.id === preferredWorld) ?? worldData[0]
      if (initial) {
        setWorldId(initial.id)
        setSelectedTerrainIds(new Set(initial.subworldIds))
      }
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [])

  const activeWorld = worlds.find((world) => world.id === worldId)
  const subworldById = useMemo(() => new Map(subworlds.map((terrain) => [terrain.id, terrain])), [subworlds])
  const activeTerrains = useMemo(() => activeWorld?.subworldIds.map((id) => subworldById.get(id)).filter((item): item is Subworld => Boolean(item)) ?? [], [activeWorld, subworldById])
  const selectedTerrains = useMemo(() => activeTerrains.filter((terrain) => selectedTerrainIds.has(terrain.id)), [activeTerrains, selectedTerrainIds])
  const specialResources = activeWorld && specialResourceData
    ? activeWorld.specialResourceIds
      .map((id) => specialResourceData.routes.find((route) => route.id === id))
      .filter((route): route is SpecialResourceData['routes'][number] => Boolean(route))
    : []
  const specialResourceNames = specialResourceData
    ? Object.fromEntries(specialResourceData.routes.map((route) => [route.id, locale === 'zh' ? route.name_zh : route.name_en]))
    : {}

  const selectWorld = (id: string) => {
    const world = worlds.find((item) => item.id === id)
    setWorldId(id)
    setSelectedTerrainIds(new Set(world?.subworldIds ?? []))
  }

  const toggleTerrainGroup = (ids: string[]) => setSelectedTerrainIds((current) => {
    const next = new Set(current)
    const shouldSelect = ids.some((id) => !next.has(id))
    ids.forEach((id) => {
      if (shouldSelect) next.add(id)
      else next.delete(id)
    })
    return next
  })

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><span>O₂</span><i></i></div>
        <div className="brand-copy">
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <LocaleToggle locale={locale} onChange={setLocale} />
      </header>

      {error && <div className="error-banner">Data error: {error}. Run <code>python3 scripts/extract_data.py</code>.</div>}

      <main className="planner-layout">
        <PlanetSelector worlds={worlds} selectedId={worldId} locale={locale} onSelect={selectWorld} specialResourceNames={specialResourceNames} />
        <div className="workspace">
          <TerrainPicker
            world={activeWorld}
            terrains={activeTerrains}
            selected={selectedTerrainIds}
            locale={locale}
            onToggle={toggleTerrainGroup}
            onSelectAll={() => setSelectedTerrainIds(new Set(activeTerrains.map((terrain) => terrain.id)))}
            onClear={() => setSelectedTerrainIds(new Set())}
          />
          <ResourceDashboard
            terrains={selectedTerrains}
            research={terrainResearch}
            categories={gameCategories}
            locale={locale}
            specialResources={specialResources}
            specialResourceSources={specialResourceData?.sources}
            specialResourceBaseline={specialResourceData?.baseline}
          />
        </div>
      </main>

      <footer>
        <span>{t.extracted}</span>
        {stats && <span>{t.dataCoverage}: {stats.worlds} worlds · {stats.subworlds} terrains · {stats.resources} resources · {stats.translations.toLocaleString()} translations</span>}
      </footer>
    </div>
  )
}

export default App
