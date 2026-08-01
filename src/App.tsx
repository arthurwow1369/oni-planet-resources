import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { LocaleToggle } from './components/LocaleToggle'
import { PlanetSelector } from './components/PlanetSelector'
import { ResourceDashboard } from './components/ResourceDashboard'
import { TerrainPicker } from './components/TerrainPicker'
import { dataUrl } from './dataUrl'
import { ui } from './i18n'
import type { Locale, Stats, Subworld, TerrainResearchData, World } from './types'

const preferredWorld = 'dlc5::worlds/AquaticSpacedOutAsteroid'

function App() {
  const [locale, setLocale] = useState<Locale>('zh')
  const [worlds, setWorlds] = useState<World[]>([])
  const [subworlds, setSubworlds] = useState<Subworld[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [terrainResearch, setTerrainResearch] = useState<TerrainResearchData | null>(null)
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
    ]).then(([worldData, terrainData, statsData, researchData]: [World[], Subworld[], Stats, TerrainResearchData]) => {
      setWorlds(worldData)
      setSubworlds(terrainData)
      setStats(statsData)
      setTerrainResearch(researchData)
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
        <PlanetSelector worlds={worlds} selectedId={worldId} locale={locale} onSelect={selectWorld} />
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
          <ResourceDashboard terrains={selectedTerrains} research={terrainResearch} locale={locale} />
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
