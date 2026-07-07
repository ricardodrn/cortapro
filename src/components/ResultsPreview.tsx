import { useTranslation } from 'react-i18next'
import { useAppStore } from '../state/store.ts'

/**
 * Text-only summary of the last optimizer run.
 * Placeholder until the SVG layout view (Phase 3) and stats panel (Phase 4).
 */
export default function ResultsPreview({ inputsValid }: { inputsValid: boolean }) {
  const { t } = useTranslation()
  const result = useAppStore((s) => s.result)
  const pieces = useAppStore((s) => s.pieces)
  const optimizing = useAppStore((s) => s.optimizing)
  const runOptimize = useAppStore((s) => s.runOptimize)

  const canRun = inputsValid && pieces.length > 0 && !optimizing

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{t('optimization.title')}</h2>
        <button
          type="button"
          onClick={runOptimize}
          disabled={!canRun}
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {optimizing ? t('optimization.optimizing') : t('optimization.optimize')}
        </button>
      </div>

      {!canRun && !optimizing && (
        <p className="mt-3 text-xs text-slate-400">
          {pieces.length === 0 ? t('optimization.addToOptimize') : t('optimization.fixToOptimize')}
        </p>
      )}

      {result && (
        <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold">{result.stats.panelCount}</span>{' '}
            {t('optimization.panelCount', { count: result.stats.panelCount })} ·{' '}
            <span className="font-semibold">{result.stats.utilizationPct.toFixed(1)}%</span>{' '}
            {t('optimization.summary', {
              panels: t('optimization.panelCount', { count: result.stats.panelCount }),
              utilization: `${result.stats.utilizationPct.toFixed(1)}%`,
              waste: `${result.stats.wastePct.toFixed(1)}%`,
            })}
          </p>
          {result.unplaced.length > 0 && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {t('optimization.unplaced', {
                count: result.unplaced.length,
                codes: result.unplaced.map((u) => u.code).join(', '),
              })}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
