import { useMemo } from 'react'
import { categoryMeta, localName, ui } from '../i18n'
import { buildMainSourceRecommendations } from '../recommendations'
import type { Locale, Subworld } from '../types'

interface Props {
  terrains: Subworld[]
  locale: Locale
}

export function MainSourceRecommendations({ terrains, locale }: Props) {
  const t = ui[locale]
  const recommendations = useMemo(() => buildMainSourceRecommendations(terrains), [terrains])
  const terrainById = useMemo(() => new Map(terrains.map((terrain) => [terrain.id, terrain])), [terrains])

  return (
    <section className="main-source-section" aria-labelledby="main-source-title">
      <div className="main-source-heading">
        <div>
          <span className="eyebrow">SURVIVAL PRIORITIES</span>
          <h3 id="main-source-title">{t.mainSources}</h3>
          <p>{t.mainSourcesSubtitle}</p>
        </div>
        <span className="candidate-badge">{t.planningCandidate}</span>
      </div>

      <p className="main-source-note">ℹ️ {t.mainSourceNote}</p>

      <div className="main-source-grid">
        {recommendations.map((recommendation) => {
          const meta = categoryMeta[recommendation.category]
          const title = locale === 'zh' ? recommendation.title_zh : recommendation.title_en
          const description = locale === 'zh' ? recommendation.description_zh : recommendation.description_en
          const terrainNames = [...new Set(recommendation.terrainIds.flatMap((id) => {
            const terrain = terrainById.get(id)
            return terrain ? [localName(terrain, locale)] : []
          }))]
          return (
            <article className={`main-source-card ${recommendation.available ? '' : 'unavailable'}`} key={recommendation.category}>
              <div className="main-source-card-header">
                <span className="main-source-icon">{meta.icon}</span>
                <div>
                  <small>{locale === 'zh' ? meta.zh : meta.en}</small>
                  <h4>{recommendation.available ? title : t.noMappedMainSource}</h4>
                </div>
              </div>

              <p>{recommendation.available ? description : t.noMappedMainSourceDescription}</p>

              {recommendation.available && (
                <>
                  <div className="main-source-resources">
                    <span>{t.matchedResources}</span>
                    <div>{recommendation.matchedResources.map((resource) => (
                      <em key={resource.simhash}>{localName(resource, locale)}</em>
                    ))}</div>
                  </div>
                  <div className="source-list main-source-terrains">
                    <span>{t.sourceTerrains}</span>
                    <div>{terrainNames.map((name) => <em key={name}>{name}</em>)}</div>
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
