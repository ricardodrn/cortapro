import { describe, expect, it } from 'vitest'
import { panelBreakdown, placementSummary } from './reporting.ts'
import { optimize } from './optimizer.ts'
import type { PieceSpec } from './types.ts'

const piece = (id: string, code: string, w: number, h: number, qty: number): PieceSpec => ({
  id,
  code,
  description: `Piece ${code}`,
  width: w,
  height: h,
  quantity: qty,
  rotatable: true,
})

describe('placementSummary', () => {
  it('accounts for every requested instance across panels and unplaced', () => {
    // 3 half-panel pieces on a 1000×1000 panel → 2 per panel, 1 overflows to panel 2
    const pieces = [piece('a', '01', 1000, 500, 3), piece('b', '02', 2000, 2000, 1)]
    const result = optimize({ width: 1000, height: 1000 }, pieces)

    const rows = placementSummary(result, pieces)
    expect(rows).toHaveLength(2)

    const a = rows[0]
    expect(a.code).toBe('01')
    expect(a.placedTotal).toBe(3)
    expect(a.perPanel.reduce((s, n) => s + n, 0)).toBe(3)
    expect(a.perPanel.length).toBe(result.layouts.length)
    expect(a.unplacedCount).toBe(0)

    const b = rows[1]
    expect(b.placedTotal).toBe(0)
    expect(b.unplacedCount).toBe(1) // too large for the panel
  })

  it('keeps piece input order', () => {
    const pieces = [piece('z', '09', 100, 100, 1), piece('a', '01', 100, 100, 1)]
    const result = optimize({ width: 1000, height: 1000 }, pieces)
    expect(placementSummary(result, pieces).map((r) => r.code)).toEqual(['09', '01'])
  })
})

describe('panelBreakdown', () => {
  it('reports per-panel usage that sums to the overall stats', () => {
    const pieces = [piece('a', '01', 1000, 500, 3)]
    const result = optimize({ width: 1000, height: 1000 }, pieces)
    const rows = panelBreakdown(result)

    expect(rows).toHaveLength(result.layouts.length)
    const usedSum = rows.reduce((s, r) => s + r.usedArea, 0)
    expect(usedSum).toBe(result.stats.usedArea)
    for (const row of rows) {
      expect(row.usedArea + row.wasteArea).toBe(1000 * 1000)
      expect(row.utilization).toBeCloseTo(row.usedArea / 1_000_000)
    }
  })

  it('finds the largest free rect of each panel', () => {
    const pieces = [piece('a', '01', 1000, 400, 1)]
    const result = optimize({ width: 1000, height: 1000 }, pieces)
    const [row] = panelBreakdown(result)
    expect(row.largestFreeRect).not.toBeNull()
    expect(row.largestFreeRect!.width * row.largestFreeRect!.height).toBe(1000 * 600)
  })
})
