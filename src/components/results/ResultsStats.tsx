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
        <h2 className="text-sm font-semibold text-slate-700">Results</h2>
        <div className="flex items-baseline gap-3">
          <p className="text-xs text-slate-400">Strategy: {result.strategy}</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 print:hidden"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Panels"
          value={String(stats.panelCount)}
          detail={`${result.panel.width} × ${result.panel.height} mm`}
        />
        <StatTile label="Utilization" value={formatPct(stats.utilizationPct)} />
        <StatTile
          label="Waste"
          value={formatPct(stats.wastePct)}
          detail={formatArea(stats.wasteArea)}
        />
        <StatTile
          label="Used area"
          value={formatArea(stats.usedArea)}
          detail={`of ${formatArea(stats.totalPanelArea)}`}
        />
        <StatTile
          label="Largest offcut"
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
          label="Pieces placed"
          value={`${placements.reduce((s, r) => s + r.placedTotal, 0)} / ${placements.reduce(
            (s, r) => s + r.quantity,
            0,
          )}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-2 text-xs font-semibold text-slate-500">Per-panel breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Panel</th>
                  <th className={`${th} text-right`}>Pieces</th>
                  <th className={`${th} text-right`}>Used</th>
                  <th className={`${th} text-right`}>Waste</th>
                  <th className={`${th} text-right`}>Utilization</th>
                  <th className={`${th} text-right`}>Largest offcut</th>
                </tr>
              </thead>
              <tbody>
                {panels.map((p) => (
                  <tr key={p.panelIndex} className="border-t border-slate-100">
                    <td className={td}>Panel {p.panelIndex + 1}</td>
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
          <h3 className="mb-2 text-xs font-semibold text-slate-500">Piece placement</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>Piece</th>
                  <th className={th}>Size</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={th}>Placement</th>
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
                        .map((n, i) => (n > 0 ? `Panel ${i + 1} ×${n}` : null))
                        .filter(Boolean)
                        .join(', ') || '—'}
                      {row.unplacedCount > 0 && (
                        <span className="ml-1 font-medium text-amber-600">
                          ({row.unplacedCount} unplaced)
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
