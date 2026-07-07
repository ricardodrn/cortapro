import type { OptimizeResult, PieceSpec, Rect } from './types.ts'

/** Where the instances of one piece type ended up. */
export interface PlacementSummaryRow {
  pieceId: string
  code: string
  description: string
  width: number
  height: number
  quantity: number
  /** Placed count per panel index (same length as result.layouts). */
  perPanel: number[]
  placedTotal: number
  unplacedCount: number
}

/** One row per piece type, in the order the pieces were entered. */
export function placementSummary(
  result: OptimizeResult,
  pieces: PieceSpec[],
): PlacementSummaryRow[] {
  const rows = new Map<string, PlacementSummaryRow>(
    pieces.map((p) => [
      p.id,
      {
        pieceId: p.id,
        code: p.code,
        description: p.description,
        width: p.width,
        height: p.height,
        quantity: p.quantity,
        perPanel: result.layouts.map(() => 0),
        placedTotal: 0,
        unplacedCount: 0,
      },
    ]),
  )

  result.layouts.forEach((layout, panelIndex) => {
    for (const placement of layout.placements) {
      const row = rows.get(placement.pieceId)
      if (!row) continue
      row.perPanel[panelIndex]++
      row.placedTotal++
    }
  })
  for (const u of result.unplaced) {
    const row = rows.get(u.pieceId)
    if (row) row.unplacedCount++
  }

  return [...rows.values()]
}

export interface PanelBreakdownRow {
  panelIndex: number
  pieceCount: number
  usedArea: number
  wasteArea: number
  utilization: number
  largestFreeRect: Rect | null
}

export function panelBreakdown(result: OptimizeResult): PanelBreakdownRow[] {
  const panelArea = result.panel.width * result.panel.height
  return result.layouts.map((layout, panelIndex) => {
    let largestFreeRect: Rect | null = null
    for (const r of layout.freeRects) {
      if (!largestFreeRect || r.width * r.height > largestFreeRect.width * largestFreeRect.height) {
        largestFreeRect = r
      }
    }
    return {
      panelIndex,
      pieceCount: layout.placements.length,
      usedArea: layout.usedArea,
      wasteArea: panelArea - layout.usedArea,
      utilization: layout.utilization,
      largestFreeRect,
    }
  })
}
