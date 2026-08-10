import { ui } from '../i18n'
import type { Locale, SettlementAnalysis, SettlementOperationMode } from '../types'

interface Props {
  analysis: SettlementAnalysis
  locale: Locale
}

const operationIcon: Record<SettlementOperationMode, string> = {
  settlement: '🏠',
  'conditional-settlement': '🛠️',
  'extract-and-leave': '🚀',
  'automated-outpost': '⚙️',
  'managed-outpost': '👷',
  avoid: '⛔',
}

export function SettlementPanel({ analysis, locale }: Props) {
  const t = ui[locale]
  const strengths = locale === 'zh' ? analysis.strengths_zh : analysis.strengths_en
  const risks = locale === 'zh' ? analysis.risks_zh : analysis.risks_en
  const summary = locale === 'zh' ? analysis.summary_zh : analysis.summary_en
  const lifeSupport = [
    [t.waterSupply, analysis.metrics.hasWater],
    [t.oxygenSupply, analysis.metrics.hasOxygen],
    [t.foodSupply, analysis.metrics.hasFood],
    [t.powerSupply, analysis.metrics.hasPower],
  ] as const

  return (
    <section className={`settlement-panel settlement-${analysis.classification}`}>
      <div className="settlement-heading">
        <div>
          <span className="eyebrow">SETTLEMENT</span>
          <h2>{t.settlementAnalysis}</h2>
        </div>
        <div className="settlement-verdict">
          <strong>{t.settlementLabels[analysis.classification]}</strong>
          <span>{t.settlementScore} {analysis.score}/100</span>
        </div>
      </div>

      <div className="operation-banner">
        <span aria-hidden="true">{operationIcon[analysis.operationMode]}</span>
        <div>
          <strong>{t.operationLabels[analysis.operationMode]}</strong>
          <p>{summary}</p>
        </div>
      </div>

      <div className="life-support-row" aria-label={t.lifeSupportSnapshot}>
        <strong>{t.lifeSupportSnapshot}</strong>
        {lifeSupport.map(([label, available]) => (
          <span className={available ? 'available' : 'missing'} key={label}>
            {available ? '✓' : '×'} {label} · {available ? t.available : t.missing}
          </span>
        ))}
      </div>

      <div className="settlement-detail-grid">
        <section>
          <h3>{t.suitabilityStrengths}</h3>
          <ul>{strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="settlement-risks">
          <h3>{t.suitabilityRisks}</h3>
          <ul>{risks.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>

      {analysis.specialOperations.length > 0 && (
        <div className="operation-plans">
          <h3>{t.specialOperations}</h3>
          <div>
            {analysis.specialOperations.map((operation) => (
              <article className={`operation-plan operation-${operation.mode}`} key={`${operation.routeId}-${operation.mode}`}>
                <span aria-hidden="true">{operationIcon[operation.mode]}</span>
                <div>
                  <small>{locale === 'zh' ? operation.routeName_zh : operation.routeName_en}</small>
                  <strong>{locale === 'zh' ? operation.label_zh : operation.label_en}</strong>
                  <p>{locale === 'zh' ? operation.detail_zh : operation.detail_en}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
