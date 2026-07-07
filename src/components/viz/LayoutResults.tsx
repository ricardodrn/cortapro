import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../state/store.ts'
import { FALLBACK_COLOR, pieceColorMap } from '../../utils/pieceColors.ts'
import PanelView from './PanelView.tsx'

export default function LayoutResults() {
  const { t } = useTranslation()
  const result = useAppStore((s) => s.result)
  const pieces = useAppStore((s) => s.pieces)

  if (!result || result.layouts.length === 0) return null

  const colors = pieceColorMap(pieces)
  const pieceById = new Map(pieces.map((p) => [p.id, p]))

  const placedCounts = new Map<string, number>()
  for (const layout of result.layouts) {
    for (const p of layout.placements) {
      placedCounts.set(p.pieceId, (placedCounts.get(p.pieceId) ?? 0) + 1)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm print:break-inside-avoid print:border-0 print:px-0 print:shadow-none">
        <h2 className="text-sm font-semibold text-slate-700">{t('layout.title')}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {pieces
            .filter((p) => placedCounts.has(p.id))
            .map((p) => (
              <li key={p.id} className="flex items-center gap-1.5">
                <span
                  className="inline-block size-3 rounded-sm"
                  style={{ backgroundColor: colors.get(p.id) ?? FALLBACK_COLOR }}
                />
                <span className="font-medium">{p.code}</span>
                {p.description && <span className="text-slate-400">{p.description}</span>}
                <span className="text-slate-400">×{placedCounts.get(p.id)}</span>
              </li>
            ))}
        </ul>
      </div>

      {result.layouts.map((layout, i) => (
        <PanelView
          key={`${result.panel.width}x${result.panel.height}-${i}`}
          panel={result.panel}
          layout={layout}
          index={i}
          colors={colors}
          pieceById={pieceById}
        />
      ))}
    </section>
  )
}
