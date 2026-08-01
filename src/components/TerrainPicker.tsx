import { dlcLabel } from '../dlc'
import { localName, secondaryName, ui } from '../i18n'
import type { Locale, Subworld, World } from '../types'

interface Props {
  world: World | undefined
  terrains: Subworld[]
  selected: Set<string>
  locale: Locale
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
}

const prettyRule = (rule: string) => rule.split('/').pop()?.replace(/^poi_/, '').replace(/^med_/, '').replaceAll('_', ' ') ?? rule

export function TerrainPicker({ world, terrains, selected, locale, onToggle, onSelectAll, onClear }: Props) {
  const t = ui[locale]
  if (!world) return <section className="panel"><p className="empty">{t.noPlanet}</p></section>

  return (
    <section className="panel terrain-panel">
      <div className="world-summary">
        <div className="world-orbit"><span>◉</span></div>
        <div>
          <span className="eyebrow">{dlcLabel(world.dlcTag)}</span>
          <h1>{localName(world, locale)}</h1>
          <p className="secondary-title">{secondaryName(world, locale)}</p>
          {(locale === 'zh' ? world.desc_zh : world.desc_en) && <p className="world-description">{locale === 'zh' ? world.desc_zh : world.desc_en}</p>}
        </div>
      </div>

      <div className="section-heading terrain-title">
        <div>
          <span className="eyebrow">TERRAINS</span>
          <h2>{t.terrain}</h2>
        </div>
        <div className="button-row">
          <button className="text-button" onClick={onSelectAll}>{t.selectAll}</button>
          <button className="text-button" onClick={onClear}>{t.clearAll}</button>
        </div>
      </div>
      <p className="selection-summary">{t.selected} {selected.size} / {terrains.length} {t.terrainCount}</p>
      {terrains.length === 0 ? <p className="empty">{t.noTerrain}</p> : (
        <div className="terrain-grid">
          {terrains.map((terrain) => {
            const isExtra = world.clusterExtensionSubworldIds.includes(terrain.id)
            return (
              <label className={`terrain-card ${selected.has(terrain.id) ? 'checked' : ''}`} key={terrain.id}>
                <input type="checkbox" checked={selected.has(terrain.id)} onChange={() => onToggle(terrain.id)} />
                <span className="checkbox-ui">✓</span>
                <span className="terrain-copy">
                  <strong>{localName(terrain, locale)}</strong>
                  {locale === 'en' && <small>{terrain.variant_en}</small>}
                  <span>{terrain.resources.length} {t.resourceCount}</span>
                </span>
                {isExtra && <span className="extra-badge">{t.dlcExtra}</span>}
              </label>
            )
          })}
        </div>
      )}

      {world.guarantees.length > 0 && (
        <details className="guarantees">
          <summary>{t.guarantees} <span>{world.guarantees.length}</span></summary>
          <div className="guarantee-tags">
            {world.guarantees.map((rule) => <code key={rule} title={rule}>{prettyRule(rule)}</code>)}
          </div>
        </details>
      )}
    </section>
  )
}
