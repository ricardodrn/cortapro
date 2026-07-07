import { useAppStore } from '../state/store.ts'

/**
 * Text-only summary of the last optimizer run.
 * Placeholder until the SVG layout view (Phase 3) and stats panel (Phase 4).
 */
export default function ResultsPreview({ inputsValid }: { inputsValid: boolean }) {
  const result = useAppStore((s) => s.result)
  const pieces = useAppStore((s) => s.pieces)
  const runOptimize = useAppStore((s) => s.runOptimize)

  const canRun = inputsValid && pieces.length > 0

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Optimization</h2>
        <button
          type="button"
          onClick={runOptimize}
          disabled={!canRun}
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Optimize cuts
        </button>
      </div>

      {!canRun && (
        <p className="mt-3 text-xs text-slate-400">
          {pieces.length === 0
            ? 'Add at least one piece to optimize.'
            : 'Fix the highlighted input errors to optimize.'}
        </p>
      )}

      {result && (
        <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold">{result.stats.panelCount}</span>{' '}
            {result.stats.panelCount === 1 ? 'panel' : 'panels'} ·{' '}
            <span className="font-semibold">{result.stats.utilizationPct.toFixed(1)}%</span>{' '}
            utilization · {result.stats.wastePct.toFixed(1)}% waste
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {result.layouts.map((layout, i) => (
              <li key={i}>
                Panel {i + 1}: {layout.placements.length} pieces,{' '}
                {(layout.utilization * 100).toFixed(1)}% used
              </li>
            ))}
            {result.stats.largestFreeRect && (
              <li>
                Largest reusable offcut: {result.stats.largestFreeRect.width} ×{' '}
                {result.stats.largestFreeRect.height} mm
              </li>
            )}
            <li className="text-slate-400">Strategy: {result.strategy}</li>
          </ul>
          {result.unplaced.length > 0 && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {result.unplaced.length} piece{result.unplaced.length === 1 ? '' : 's'} could
              not be placed: {result.unplaced.map((u) => u.code).join(', ')}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400 italic">
            Visual cutting layout arrives in Phase 3.
          </p>
        </div>
      )}
    </section>
  )
}
