import { useMemo } from 'react'
import { localName, secondaryName, ui } from '../i18n'
import { categoryIcon } from '../resourcePresentation'
import { filterResources, usedCategoryIds, type IndexedResource } from '../resourceIndex'
import type { BrowseMode, GameCategory, GameCategoryId, Locale } from '../types'
import { BrowseModeToggle } from './BrowseModeToggle'

interface Props {
  resources: IndexedResource[]
  categories: GameCategory[]
  selectedId: string
  locale: Locale
  mode: BrowseMode
  query: string
  category: GameCategoryId | 'all'
  onSelect: (id: string) => void
  onModeChange: (mode: BrowseMode) => void
  onQueryChange: (query: string) => void
  onCategoryChange: (category: GameCategoryId | 'all') => void
}

export function ResourceSelector({
  resources, categories, selectedId, locale, mode, query, category,
  onSelect, onModeChange, onQueryChange, onCategoryChange,
}: Props) {
  const t = ui[locale]
  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories])
  const pickableCategories = useMemo(() => usedCategoryIds(resources)
    .map((id) => categoryById.get(id) ?? { id, name_en: id, name_zh: id })
    .sort((a, b) => localName(a, locale).localeCompare(localName(b, locale), locale === 'zh' ? 'zh-Hant' : 'en')),
    [resources, categoryById, locale])
  const visible = useMemo(
    () => filterResources(resources, { query, category, locale }),
    [resources, query, category, locale],
  )

  return (
    <section className="panel planet-panel">
      <BrowseModeToggle mode={mode} locale={locale} onChange={onModeChange} />

      <div className="section-heading">
        <div>
          <span className="eyebrow">RESOURCE</span>
          <h2>{t.resourceSelect}</h2>
        </div>
        <span className="count-chip" title={t.resourceCount}>{visible.length}</span>
      </div>

      <div className="planet-filters">
        <label>
          <span>{t.resourceCategoryFilter}</span>
          <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="all">{t.allCategories}</option>
            {pickableCategories.map((item) => (
              <option key={item.id} value={item.id}>{categoryIcon(item.id)} {localName(item, locale)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t.resourceSearch}</span>
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t.resourceSearch} />
        </label>
      </div>

      <div className="planet-list" aria-label={t.resourceSelect}>
        {visible.length === 0 && <p className="empty">{t.noResources}</p>}
        {visible.map((resource) => (
          <button
            type="button"
            key={resource.id}
            className={`poi-option ${resource.id === selectedId ? 'selected' : ''}`}
            aria-pressed={resource.id === selectedId}
            onClick={() => onSelect(resource.id)}
          >
            <span className="poi-option-icon" aria-hidden="true">{categoryIcon(resource.primaryCategory)}</span>
            <span className="poi-option-copy">
              <strong>{localName(resource, locale)}</strong>
              <small>{secondaryName(resource, locale)}</small>
              <span className="poi-option-meta">
                {resource.worldIds.length > 0 && <em>🪐 {resource.worldIds.length}</em>}
                {resource.poiIds.length > 0 && <em>⛏️ {resource.poiIds.length}</em>}
                {resource.guaranteedWorldIds.length > 0 && (
                  <em className="poi-option-guaranteed">✓ {resource.guaranteedWorldIds.length}</em>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
