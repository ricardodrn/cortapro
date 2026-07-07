import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../state/store.ts'
import { panelBreakdown, placementSummary } from '../../core/reporting.ts'
import { formatArea, formatPct, formatSize } from '../../utils/format.ts'
import { FALLBACK_COLOR, pieceColorMap } from '../../utils/pieceColors.ts'

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-800">{value}</p>
      {detail && <p className="text-xs text-slate-400">{detail}</p>}
    </div>
  )
}

const th = 'px-3 pb-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase'
const td = 'px-3 py-2 text-sm whitespace-nowrap text-slate-700'
const num = `${td} tabular-nums text-right`

export default function ResultsStats() {
  const { t } = useTranslation()
  const result = useAppStore((s) => s.result)
  const pieces = useAppStore((s) => s.pieces)

  if (!result || result.layouts.length === 0) return null

  const { stats } = result
  const panels = panelBreakdown(result)
  const placements = placementSummary(result, pieces)
  const colors = pieceColorMap(pieces)

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">{t('results.title')}</h2>
        <div className="flex items-baseline gap-3">
          <p className="text-xs text-slate-400">{t('results.strategy', { strategy: result.strategy })}</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 print:hidden"
          >
            {t('results.print')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label={t('results.tile.panels')}
          value={String(stats.panelCount)}
          detail={`${result.panel.width} × ${result.panel.height} mm`}
        />
        <StatTile label={t('results.tile.utilization')} value={formatPct(stats.utilizationPct)} />
        <StatTile
          label={t('results.tile.waste')}
          value={formatPct(stats.wastePct)}
          detail={formatArea(stats.wasteArea)}
        />
        <StatTile
          label={t('results.tile.usedArea')}
          value={formatArea(stats.usedArea)}
          detail={t('results.tile.usedAreaDetail', { total: formatArea(stats.totalPanelArea) })}
        />
        <StatTile
          label={t('results.tile.largestOffcut')}
          value={
            stats.largestFreeRect
              ? `${stats.largestFreeRect.width} × ${stats.largestFreeRect.height}`
              : '—'
          }
          detail={stats.largestFreeRect ? formatArea(
            stats.largestFreeRect.width * stats.largestFreeRect.height,
          ) : undefined}
        />
        <StatTile
          label={t('results.tile.piecesPlaced')}
          value={`${placements.reduce((s, r) => s + r.placedTotal, 0)} / ${placements.reduce(
            (s, r) => s + r.quantity,
            0,
          )}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold text-slate-500">{t('results.perPanel')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t('results.col.panel')}</th>
                  <th className={`${th} text-right`}>{t('results.col.pieces')}</th>
                  <th className={`${th} text-right`}>{t('results.col.used')}</th>
                  <th className={`${th} text-right`}>{t('results.col.waste')}</th>
                  <th className={`${th} text-right`}>{t('results.col.utilization')}</th>
                  <th className={`${th} text-right`}>{t('results.col.largestOffcut')}</th>
                </tr>
              </thead>
              <tbody>
                {panels.map((p) => (
                  <tr key={p.panelIndex} className="border-t border-slate-100">
                    <td className={td}>{t('results.panelNumber', { n: p.panelIndex + 1 })}</td>
                    <td className={num}>{p.pieceCount}</td>
                    <td className={num}>{formatArea(p.usedArea)}</td>
                    <td className={num}>{formatArea(p.wasteArea)}</td>
                    <td className={num}>{formatPct(p.utilization * 100)}</td>
                    <td className={num}>
                      {p.largestFreeRect
                        ? `${p.largestFreeRect.width} × ${p.largestFreeRect.height}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold text-slate-500">{t('results.piecePlacement')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>{t('results.col.piece')}</th>
                  <th className={th}>{t('results.col.size')}</th>
                  <th className={`${th} text-right`}>{t('results.col.qty')}</th>
                  <th className={th}>{t('results.col.placement')}</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((row) => (
                  <tr key={row.pieceId} className="border-t border-slate-100">
                    <td className={td}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: colors.get(row.pieceId) ?? FALLBACK_COLOR }}
                        />
                        <span className="font-medium">{row.code}</span>
                        {row.description && (
                          <span className="text-slate-400">{row.description}</span>
                        )}
                      </span>
                    </td>
                    <td className={`${td} tabular-nums whitespace-nowrap`}>
                      {formatSize(row.width, row.height)}
                    </td>
                    <td className={num}>{row.quantity}</td>
                    <td className={`${td} text-xs`}>
                      {row.perPanel
                        .map((n, i) => (n > 0 ? t('results.placementEntry', { n: i + 1, count: n }) : null))
                        .filter(Boolean)
                        .join(', ') || '—'}
                      {row.unplacedCount > 0 && (
                        <span className="ml-1 font-medium text-amber-600">
                          ({t('results.unplacedCount', { count: row.unplacedCount })})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
