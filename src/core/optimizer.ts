import type {
  OptimizeOptions,
  OptimizeResult,
  PanelLayout,
  PanelSpec,
  PieceSpec,
  Placement,
  Rect,
  Stats,
  UnplacedPiece,
} from './types.ts'
import type { PackUnit, PackerFactory } from './packers/packer.ts'
import { maxRectsFactory, type MaxRectsHeuristic } from './packers/maxrects.ts'
import { guillotineFactory } from './packers/guillotine.ts'

interface SortOrder {
  name: string
  compare: (a: PackUnit, b: PackUnit) => number
}

const SORT_ORDERS: SortOrder[] = [
  { name: 'area-desc', compare: (a, b) => b.width * b.height - a.width * a.height },
  {
    name: 'longest-side-desc',
    compare: (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height),
  },
  { name: 'perimeter-desc', compare: (a, b) => b.width + b.height - (a.width + a.height) },
  { name: 'height-desc', compare: (a, b) => b.height - a.height },
  { name: 'width-desc', compare: (a, b) => b.width - a.width },
]

const MAXRECTS_HEURISTICS: MaxRectsHeuristic[] = ['best-short-side', 'best-area', 'bottom-left']

interface Strategy {
  name: string
  factory: PackerFactory
}

function strategies(packer: OptimizeOptions['packer']): Strategy[] {
  const out: Strategy[] = []
  if (packer === 'maxrects' || packer === 'auto' || packer === undefined) {
    for (const h of MAXRECTS_HEURISTICS) {
      out.push({ name: `maxrects/${h}`, factory: maxRectsFactory(h) })
    }
  }
  if (packer === 'guillotine' || packer === 'auto' || packer === undefined) {
    out.push({ name: 'guillotine/best-area', factory: guillotineFactory() })
  }
  return out
}

/**
 * Packs all pieces onto as many panels as needed, trying every
 * strategy × sort-order combination and returning the best result.
 * Best = fewest unplaced pieces, then fewest panels, then largest reusable offcut.
 */
export function optimize(
  panel: PanelSpec,
  pieces: PieceSpec[],
  options: OptimizeOptions = {},
): OptimizeResult {
  const kerf = options.kerf ?? 0

  const units: PackUnit[] = pieces.flatMap((p) =>
    Array.from({ length: p.quantity }, () => ({
      pieceId: p.id,
      code: p.code,
      width: p.width + kerf,
      height: p.height + kerf,
      rotatable: p.rotatable,
    })),
  )

  // The bin is inflated by one kerf so pieces touching the far edges don't
  // pay for a cut that falls outside the panel.
  const binW = panel.width + kerf
  const binH = panel.height + kerf

  const fitsPanel = (u: PackUnit) =>
    (u.width <= binW && u.height <= binH) || (u.rotatable && u.height <= binW && u.width <= binH)

  const tooLarge = units.filter((u) => !fitsPanel(u))
  const packable = units.filter(fitsPanel)

  let best: OptimizeResult | null = null
  for (const strategy of strategies(options.packer)) {
    for (const order of SORT_ORDERS) {
      const sorted = [...packable].sort(order.compare)
      const candidate = runStrategy(panel, sorted, strategy, order.name, kerf, binW, binH)
      best = pickBetter(best, candidate)
    }
  }

  const result = best ?? emptyResult(panel)
  result.unplaced.push(
    ...tooLarge.map((u) => ({
      pieceId: u.pieceId,
      code: u.code,
      width: u.width - kerf,
      height: u.height - kerf,
      reason: 'too-large' as const,
    })),
  )
  return result
}

function runStrategy(
  panel: PanelSpec,
  sortedUnits: PackUnit[],
  strategy: Strategy,
  orderName: string,
  kerf: number,
  binW: number,
  binH: number,
): OptimizeResult {
  const layouts: PanelLayout[] = []
  let remaining = sortedUnits

  while (remaining.length > 0) {
    const packer = strategy.factory(binW, binH)
    const placements: Placement[] = []
    const leftover: PackUnit[] = []

    for (const unit of remaining) {
      const packed = packer.insert(unit)
      if (!packed) {
        leftover.push(unit)
        continue
      }
      placements.push({
        pieceId: unit.pieceId,
        code: unit.code,
        x: packed.x,
        y: packed.y,
        width: (packed.rotated ? unit.height : unit.width) - kerf,
        height: (packed.rotated ? unit.width : unit.height) - kerf,
        rotated: packed.rotated,
      })
    }

    if (placements.length === 0) break // nothing fit an empty panel; avoid infinite loop

    const usedArea = placements.reduce((sum, p) => sum + p.width * p.height, 0)
    layouts.push({
      placements,
      freeRects: clampFreeRects(packer.freeRects, panel),
      usedArea,
      utilization: usedArea / (panel.width * panel.height),
    })
    remaining = leftover
  }

  const unplaced: UnplacedPiece[] = remaining.map((u) => ({
    pieceId: u.pieceId,
    code: u.code,
    width: u.width - kerf,
    height: u.height - kerf,
    reason: 'no-space',
  }))

  return {
    panel,
    layouts,
    unplaced,
    stats: computeStats(panel, layouts),
    strategy: `${strategy.name} sort=${orderName}`,
  }
}

/** Free rects live in the kerf-inflated bin; clip them back to the real panel. */
function clampFreeRects(rects: readonly Rect[], panel: PanelSpec): Rect[] {
  return rects
    .map((r) => ({
      x: r.x,
      y: r.y,
      width: Math.min(r.width, panel.width - r.x),
      height: Math.min(r.height, panel.height - r.y),
    }))
    .filter((r) => r.width > 0 && r.height > 0)
}

function computeStats(panel: PanelSpec, layouts: PanelLayout[]): Stats {
  const panelArea = panel.width * panel.height
  const totalPanelArea = panelArea * layouts.length
  const usedArea = layouts.reduce((sum, l) => sum + l.usedArea, 0)
  const wasteArea = totalPanelArea - usedArea

  let largestFreeRect: Rect | null = null
  for (const layout of layouts) {
    for (const r of layout.freeRects) {
      if (!largestFreeRect || r.width * r.height > largestFreeRect.width * largestFreeRect.height) {
        largestFreeRect = r
      }
    }
  }

  return {
    panelCount: layouts.length,
    totalPanelArea,
    usedArea,
    wasteArea,
    utilizationPct: totalPanelArea > 0 ? (usedArea / totalPanelArea) * 100 : 0,
    wastePct: totalPanelArea > 0 ? (wasteArea / totalPanelArea) * 100 : 0,
    largestFreeRect,
  }
}

function pickBetter(a: OptimizeResult | null, b: OptimizeResult): OptimizeResult {
  if (!a) return b
  if (a.unplaced.length !== b.unplaced.length) {
    return a.unplaced.length < b.unplaced.length ? a : b
  }
  if (a.stats.panelCount !== b.stats.panelCount) {
    return a.stats.panelCount < b.stats.panelCount ? a : b
  }
  const areaOf = (r: Rect | null) => (r ? r.width * r.height : 0)
  return areaOf(a.stats.largestFreeRect) >= areaOf(b.stats.largestFreeRect) ? a : b
}

function emptyResult(panel: PanelSpec): OptimizeResult {
  return {
    panel,
    layouts: [],
    unplaced: [],
    stats: computeStats(panel, []),
    strategy: 'none',
  }
}
