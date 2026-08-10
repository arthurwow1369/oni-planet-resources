import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { GeyserPanel } from './components/GeyserPanel'
import { LocaleToggle } from './components/LocaleToggle'
import { PlanetSelector } from './components/PlanetSelector'
import { ResourceDashboard } from './components/ResourceDashboard'
import { ResourceDetail } from './components/ResourceDetail'
import { ResourceSelector } from './components/ResourceSelector'
import { SpacePoiDetail } from './components/SpacePoiDetail'
import { SpacePoiSelector } from './components/SpacePoiSelector'
import { TerrainPicker } from './components/TerrainPicker'
import { dataUrl } from './dataUrl'
import { buildResourceIndex, GEYSER_CATEGORY_ID, sourceDlcTags } from './resourceIndex'
import { ui } from './i18n'
import type { BrowseMode, GameCategory, GameCategoryId, Geyser, Locale, SpacePoiData, SpecialResourceData, Stats, Subworld, TerrainResearchData, World } from './types'

const preferredWorld = 'dlc5::worlds/AquaticSpacedOutAsteroid'

function App() {
  const [locale, setLocale] = useState<Locale>('zh')
  const [worlds, setWorlds] = useState<World[]>([])
  const [subworlds, setSubworlds] = useState<Subworld[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [terrainResearch, setTerrainResearch] = useState<TerrainResearchData | null>(null)
  const [specialResourceData, setSpecialResourceData] = useState<SpecialResourceData | null>(null)
  const [spacePoiData, setSpacePoiData] = useState<SpacePoiData | null>(null)
  const [gameCategories, setGameCategories] = useState<GameCategory[]>([])
  const [geyserCatalog, setGeyserCatalog] = useState<Geyser[]>([])
  const [worldId, setWorldId] = useState('')
  const [browseMode, setBrowseMode] = useState<BrowseMode>('planets')
  const [spacePoiId, setSpacePoiId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [resourceQuery, setResourceQuery] = useState('')
  const [resourceCategory, setResourceCategory] = useState<GameCategoryId | 'all'>('all')
  const [excludedSourceKinds, setExcludedSourceKinds] = useState<Set<string>>(new Set())
  const [excludedSourceDlcTags, setExcludedSourceDlcTags] = useState<Set<string>>(new Set())
  // Set when the user drills into a planet/POI from a resource, so the header
  // can offer a way back to the same resource list without losing its filters.
  const [returnToResourceId, setReturnToResourceId] = useState('')
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
      fetch(dataUrl('space-pois.json')).then((response) => response.json()),
      fetch(dataUrl('geysers.json')).then((response) => response.json()),
    ]).then(([worldData, terrainData, statsData, researchData, categoryData, specialData, spacePoiPayload, geyserPayload]: [World[], Subworld[], Stats, TerrainResearchData, GameCategory[], SpecialResourceData, SpacePoiData, Geyser[]]) => {
      setWorlds(worldData)
      setSubworlds(terrainData)
      setStats(statsData)
      setTerrainResearch(researchData)
      setGameCategories(categoryData)
      setSpecialResourceData(specialData)
      setSpacePoiData(spacePoiPayload)
      setGeyserCatalog(geyserPayload)
      if (spacePoiPayload.pois[0]) setSpacePoiId(spacePoiPayload.pois[0].id)
      const initial = worldData.find((world) => world.id === preferredWorld) ?? worldData[0]
      if (initial) {
        setWorldId(initial.id)
        setSelectedTerrainIds(new Set(initial.subworldIds))
      }
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)))
  }, [])

  const activeWorld = worlds.find((world) => world.id === worldId)
  const activeSpacePoi = spacePoiData?.pois.find((poi) => poi.id === spacePoiId)
  const resourceEntries = useMemo(
    () => buildResourceIndex(worlds, subworlds, spacePoiData?.pois ?? [], geyserCatalog),
    [worlds, subworlds, spacePoiData, geyserCatalog],
  )
  // Geysers have no game-taxonomy category, so the picker gets a synthetic one.
  const resourceCategories = useMemo(
    () => [...gameCategories, { id: GEYSER_CATEGORY_ID, name_en: 'Geysers & volcanoes', name_zh: '間歇泉與火山' }],
    [gameCategories],
  )
  const activeResource = resourceEntries.find((entry) => entry.id === resourceId)
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

  // Switching modes from the toggle is a deliberate move, so it drops any
  // pending "back to resource" trail; drilling in from a resource keeps it.
  const changeBrowseMode = (next: BrowseMode) => {
    setReturnToResourceId('')
    setBrowseMode(next)
  }

  const openWorldFromResource = (id: string) => {
    setReturnToResourceId(resourceId)
    selectWorld(id)
    setBrowseMode('planets')
  }

  const openPoiFromResource = (id: string) => {
    setReturnToResourceId(resourceId)
    setSpacePoiId(id)
    setBrowseMode('pois')
  }

  const returnToResourceList = () => {
    setResourceId(returnToResourceId)
    setReturnToResourceId('')
    setBrowseMode('resources')
  }

  const returnResource = resourceEntries.find((entry) => entry.id === returnToResourceId)

  const toggleExcluded = (setter: typeof setExcludedSourceKinds) => (value: string) => setter((current) => {
    const next = new Set(current)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })

  const resetSourceFilters = (excludeAll: boolean) => setExcludedSourceDlcTags(
    excludeAll ? new Set(sourceDlcTags(worlds, spacePoiData?.pois ?? [])) : new Set(),
  )

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

      {returnResource && browseMode !== 'resources' && (
        <div className="return-bar">
          <button type="button" onClick={returnToResourceList}>
            ← {t.backToResource}<strong>{locale === 'zh' ? returnResource.name_zh : returnResource.name_en}</strong>
          </button>
        </div>
      )}

      <main className="planner-layout">
        {browseMode === 'resources'
          ? (
            <ResourceSelector
              resources={resourceEntries}
              categories={resourceCategories}
              selectedId={resourceId}
              locale={locale}
              mode={browseMode}
              query={resourceQuery}
              category={resourceCategory}
              onSelect={setResourceId}
              onModeChange={changeBrowseMode}
              onQueryChange={setResourceQuery}
              onCategoryChange={setResourceCategory}
            />
          )
          : browseMode === 'pois' && spacePoiData
            ? (
              <SpacePoiSelector
                pois={spacePoiData.pois}
                selectedId={spacePoiId}
                locale={locale}
                mode={browseMode}
                onSelect={setSpacePoiId}
                onModeChange={changeBrowseMode}
              />
            )
            : (
              <PlanetSelector
                worlds={worlds}
                selectedId={worldId}
                locale={locale}
                onSelect={selectWorld}
                specialResourceNames={specialResourceNames}
                mode={spacePoiData ? browseMode : undefined}
                onModeChange={spacePoiData ? changeBrowseMode : undefined}
              />
            )}
        <div className="workspace">
          {browseMode === 'resources'
            ? (
              <ResourceDetail
                resource={activeResource}
                worlds={worlds}
                pois={spacePoiData?.pois ?? []}
                categories={resourceCategories}
                locale={locale}
                selection={{ excludedKinds: excludedSourceKinds, excludedDlcTags: excludedSourceDlcTags }}
                onToggleKind={toggleExcluded(setExcludedSourceKinds)}
                onToggleDlcTag={toggleExcluded(setExcludedSourceDlcTags)}
                onResetSources={resetSourceFilters}
                onOpenWorld={openWorldFromResource}
                onOpenPoi={openPoiFromResource}
              />
            )
            : browseMode === 'pois' && spacePoiData
            ? <SpacePoiDetail data={spacePoiData} poi={activeSpacePoi} locale={locale} categories={gameCategories} />
            : (
              <>
                <TerrainPicker
                  world={activeWorld}
                  terrains={activeTerrains}
                  selected={selectedTerrainIds}
                  locale={locale}
                  onToggle={toggleTerrainGroup}
                  onSelectAll={() => setSelectedTerrainIds(new Set(activeTerrains.map((terrain) => terrain.id)))}
                  onClear={() => setSelectedTerrainIds(new Set())}
                />
                <GeyserPanel geysers={activeWorld?.geysers} catalog={geyserCatalog} locale={locale} />
                <ResourceDashboard
                  terrains={selectedTerrains}
                  research={terrainResearch}
                  categories={gameCategories}
                  locale={locale}
                  specialResources={specialResources}
                  specialResourceSources={specialResourceData?.sources}
                  specialResourceBaseline={specialResourceData?.baseline}
                />
              </>
            )}
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
