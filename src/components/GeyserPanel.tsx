import { localName, secondaryName, ui } from '../i18n'
import type { Geyser, GeyserShape, Locale, WorldGeyserPool, WorldGeysers } from '../types'
import { OniIcon } from '../oniIcon'

interface Props {
  geysers: WorldGeysers | undefined
  catalog: Geyser[]
  locale: Locale
}

const shapeIcon: Record<GeyserShape, string> = {
  gas: '☁️',
  liquid: '💧',
  molten: '🌋',
}

function GeyserCard({ geyser, locale, count }: { geyser: Geyser; locale: Locale; count?: number }) {
  const t = ui[locale]
  return (
    <article className={`resource-card resource-card-material geyser-card geyser-${geyser.shape}`}>
      <div className="resource-title">
        <OniIcon className="geyser-icon" group="geysers" id={geyser.id} alt={localName(geyser, locale)} fallback={shapeIcon[geyser.shape]} />
        <div>
          <strong>{localName(geyser, locale)}</strong>
          <small>{secondaryName(geyser, locale)}</small>
        </div>
        <span className={`type-chip type-${geyser.shape}`}>
          <span aria-hidden="true">{shapeIcon[geyser.shape]}</span> {t.geyserShapeLabels[geyser.shape]}
        </span>
      </div>

      <div className="geyser-facts">
        <span>{t.geyserOutput} <strong>{localName({ name_en: geyser.elementName_en, name_zh: geyser.elementName_zh }, locale)}</strong></span>
        <span>{t.geyserRate} {geyser.rateKgPerCycle.min}–{geyser.rateKgPerCycle.max} {t.geyserPerCycle}</span>
        <span>{t.geyserTemperature} {geyser.temperatureC}°C</span>
        <span>{t.geyserPressure} {geyser.maxPressureKg} kg</span>
      </div>

      {count !== undefined && count > 1 && <span className="geyser-count-badge">×{count}</span>}
    </article>
  )
}

function PoolSection({ pool, catalog, locale, index }: { pool: WorldGeyserPool; catalog: Geyser[]; locale: Locale; index: number }) {
  const t = ui[locale]
  const byId = new Map(catalog.map((geyser) => [geyser.id, geyser]))
  const members = pool.geyserIds.map((id) => byId.get(id)).filter((geyser): geyser is Geyser => Boolean(geyser))

  return (
    <section className="geyser-pool" key={index}>
      <div className="geyser-pool-heading">
        <h4>
          {pool.isRandomSpawner ? t.geyserRandomPool : t.geyserPool}
          <span className="geyser-pool-size">{members.length} {t.geyserCount}</span>
        </h4>
        <div className="geyser-pool-meta">
          <span>{t.geyserDraws} <strong>×{pool.draws}</strong></span>
          {pool.allowDuplicates && <span>{t.geyserAllowDuplicates}</span>}
          {pool.guaranteed && <span className="geyser-guaranteed">{t.geyserGuaranteed}</span>}
        </div>
      </div>
      <div className="resource-grid">
        {members.map((geyser) => <GeyserCard geyser={geyser} locale={locale} key={geyser.id} />)}
      </div>
    </section>
  )
}

export function GeyserPanel({ geysers, catalog, locale }: Props) {
  const t = ui[locale]
  const byId = new Map(catalog.map((geyser) => [geyser.id, geyser]))
  const fixed = (geysers?.fixed ?? [])
    .map((entry) => ({ geyser: byId.get(entry.geyserId), count: entry.count }))
    .filter((entry): entry is { geyser: Geyser; count: number } => Boolean(entry.geyser))
  const pools = geysers?.pools ?? []
  const total = fixed.reduce((sum, entry) => sum + entry.count, 0) + pools.reduce((sum, pool) => sum + pool.draws, 0)

  return (
    <section className="panel resource-panel geyser-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">GEYSERS</span>
          <h2>{t.geysers}</h2>
        </div>
        <span className="count-chip" title={t.geyserCount}>{total}</span>
      </div>
      <p className="geyser-subtitle">{t.geyserSubtitle}</p>

      {fixed.length === 0 && pools.length === 0 && <p className="space-poi-empty">{t.geyserNone}</p>}

      {fixed.length > 0 && (
        <section className="geyser-section geyser-section-fixed">
          <div className="geyser-pool-heading">
            <h4>{t.geyserFixed}<span className="geyser-pool-size">{fixed.length} {t.geyserCount}</span></h4>
            <div className="geyser-pool-meta"><span>{t.geyserFixedNote}</span></div>
          </div>
          <div className="resource-grid">
            {fixed.map(({ geyser, count }) => (
              <GeyserCard geyser={geyser} locale={locale} count={count} key={geyser.id} />
            ))}
          </div>
        </section>
      )}

      {pools.length > 0 && (
        <section className="geyser-section">
          <p className="geyser-pool-note">{t.geyserPoolNote}</p>
          {pools.map((pool, index) => (
            <PoolSection pool={pool} catalog={catalog} locale={locale} index={index} key={index} />
          ))}
        </section>
      )}
    </section>
  )
}
