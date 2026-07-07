import type { OptimizeOptions, OptimizeResult, PanelSpec, PieceSpec } from './types.ts'
import type { OptimizeRequest } from './optimizer.worker.ts'
import { optimize } from './optimizer.ts'

interface OptimizeResponse {
  id: number
  result: OptimizeResult
}

let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, (result: OptimizeResult) => void>()

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (!worker) {
    worker = new Worker(new URL('./optimizer.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (e: MessageEvent<OptimizeResponse>) => {
      pending.get(e.data.id)?.(e.data.result)
      pending.delete(e.data.id)
    }
  }
  return worker
}

/**
 * Runs the optimizer off the main thread so large inputs don't freeze the UI.
 * Falls back to a synchronous run where Workers don't exist (tests, SSR).
 */
export function optimizeAsync(
  panel: PanelSpec,
  pieces: PieceSpec[],
  options: OptimizeOptions = {},
): Promise<OptimizeResult> {
  const w = getWorker()
  if (!w) return Promise.resolve(optimize(panel, pieces, options))
  return new Promise((resolve) => {
    const id = nextId++
    pending.set(id, resolve)
    const request: OptimizeRequest = { id, panel, pieces, options }
    w.postMessage(request)
  })
}
