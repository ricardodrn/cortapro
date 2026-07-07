/// <reference lib="webworker" />
import { optimize } from './optimizer.ts'
import type { OptimizeOptions, PanelSpec, PieceSpec } from './types.ts'

export interface OptimizeRequest {
  id: number
  panel: PanelSpec
  pieces: PieceSpec[]
  options: OptimizeOptions
}

self.onmessage = (e: MessageEvent<OptimizeRequest>) => {
  const { id, panel, pieces, options } = e.data
  self.postMessage({ id, result: optimize(panel, pieces, options) })
}
