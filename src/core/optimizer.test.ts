import { describe, expect, it } from 'vitest'
import { optimize } from './optimizer.ts'
import { validateResult } from './validate.ts'
import type { PanelSpec, PieceSpec } from './types.ts'

function piece(partial: Partial<PieceSpec> & Pick<PieceSpec, 'id' | 'width' | 'height'>): PieceSpec {
  return {
    code: partial.id,
    description: partial.id,
    quantity: 1,
    rotatable: true,
    ...partial,
  }
}

const EXAMPLE_PANEL: PanelSpec = { width: 2300, height: 1800, material: 'MDF' }

// Example input from CLAUDE.md: 37 pieces, 6,133,517 mm² of parts (panel = 4,140,000 mm²).
const EXAMPLE_PIECES: PieceSpec[] = [
  piece({ id: '01', description: 'Divider', width: 580, height: 310, quantity: 10 }),
  piece({ id: '02', description: 'Top Base', width: 1000, height: 310 }),
  piece({ id: '03', description: 'Left Side', width: 650, height: 310, quantity: 2 }),
  piece({ id: '04', description: 'Right Side', width: 650, height: 310, quantity: 2 }),
  piece({ id: '05', description: 'Back Panel', width: 676, height: 298, quantity: 3 }),
  piece({ id: '06', description: 'Small Shelf', width: 326, height: 264, quantity: 10 }),
  piece({ id: '07', description: 'Large Shelf', width: 661, height: 264 }),
  piece({ id: '08', description: 'Door', width: 619, height: 333, quantity: 3 }),
  piece({ id: '09', description: 'Bottom Base', width: 1000, height: 310 }),
  piece({ id: '10', description: 'Side Back', width: 628, height: 322, quantity: 3 }),
  piece({ id: '11', description: 'Crossbar', width: 1000, height: 45 }),
]

describe('optimize — CLAUDE.md example', () => {
  const result = optimize(EXAMPLE_PANEL, EXAMPLE_PIECES)

  it('places all 37 pieces', () => {
    const placed = result.layouts.reduce((n, l) => n + l.placements.length, 0)
    expect(result.unplaced).toEqual([])
    expect(placed).toBe(37)
  })

  it('uses the minimum of 2 panels', () => {
    // Total piece area 6,133,817 mm² > one panel (4,140,000 mm²), so 2 is optimal.
    expect(result.stats.panelCount).toBe(2)
  })

  it('produces a valid layout', () => {
    expect(validateResult(result, EXAMPLE_PIECES)).toEqual([])
  })

  it('reports consistent stats', () => {
    expect(result.stats.usedArea).toBe(6_133_517)
    expect(result.stats.totalPanelArea).toBe(2 * 2300 * 1800)
    expect(result.stats.usedArea + result.stats.wasteArea).toBe(result.stats.totalPanelArea)
    expect(result.stats.utilizationPct).toBeCloseTo((6_133_517 / 8_280_000) * 100, 5)
    expect(result.stats.largestFreeRect).not.toBeNull()
  })
})

describe('optimize — edge cases', () => {
  it('reports pieces larger than the panel as unplaced', () => {
    const result = optimize({ width: 100, height: 100 }, [
      piece({ id: 'big', width: 200, height: 50, rotatable: false }),
      piece({ id: 'ok', width: 50, height: 50 }),
    ])
    expect(result.unplaced).toHaveLength(1)
    expect(result.unplaced[0]).toMatchObject({ pieceId: 'big', reason: 'too-large' })
    expect(result.layouts).toHaveLength(1)
  })

  it('handles zero quantity', () => {
    const result = optimize({ width: 100, height: 100 }, [
      piece({ id: 'none', width: 50, height: 50, quantity: 0 }),
    ])
    expect(result.layouts).toEqual([])
    expect(result.unplaced).toEqual([])
  })

  it('achieves 100% utilization on an exact fit', () => {
    const result = optimize({ width: 100, height: 100 }, [
      piece({ id: 'half', width: 100, height: 50, quantity: 2 }),
    ])
    expect(result.stats.panelCount).toBe(1)
    expect(result.stats.utilizationPct).toBe(100)
    expect(result.stats.wasteArea).toBe(0)
  })

  it('rotates a piece when allowed', () => {
    const result = optimize({ width: 100, height: 50 }, [
      piece({ id: 'tall', width: 50, height: 100, rotatable: true }),
    ])
    expect(result.unplaced).toEqual([])
    expect(result.layouts[0].placements[0]).toMatchObject({ rotated: true, width: 100, height: 50 })
  })

  it('does not rotate a piece when forbidden', () => {
    const result = optimize({ width: 100, height: 50 }, [
      piece({ id: 'tall', width: 50, height: 100, rotatable: false }),
    ])
    expect(result.unplaced).toHaveLength(1)
    expect(result.unplaced[0].reason).toBe('too-large')
  })

  it('overflows onto additional panels', () => {
    const result = optimize({ width: 100, height: 100 }, [
      piece({ id: 'q', width: 60, height: 60, quantity: 3 }),
    ])
    expect(result.unplaced).toEqual([])
    expect(result.stats.panelCount).toBe(3)
  })

  it('respects kerf spacing between pieces', () => {
    const pieces = [piece({ id: 'k', width: 45, height: 45, quantity: 4 })]
    const result = optimize({ width: 100, height: 100 }, pieces, { kerf: 5 })
    expect(result.unplaced).toEqual([])
    expect(result.stats.panelCount).toBe(1)
    expect(validateResult(result, pieces, 5)).toEqual([])
  })

  it('kerf can push pieces onto another panel', () => {
    // Two 50-wide pieces fit a 100-wide panel only with zero kerf.
    const pieces = [piece({ id: 'k', width: 50, height: 100, quantity: 2, rotatable: false })]
    expect(optimize({ width: 100, height: 100 }, pieces).stats.panelCount).toBe(1)
    expect(optimize({ width: 100, height: 100 }, pieces, { kerf: 3 }).stats.panelCount).toBe(2)
  })

  it('guillotine-only packing also places everything', () => {
    const result = optimize(EXAMPLE_PANEL, EXAMPLE_PIECES, { packer: 'guillotine' })
    expect(result.unplaced).toEqual([])
    expect(validateResult(result, EXAMPLE_PIECES)).toEqual([])
    expect(result.strategy).toContain('guillotine')
  })
})

describe('validateResult', () => {
  it('detects overlapping placements', () => {
    const result = optimize({ width: 100, height: 100 }, [
      piece({ id: 'a', width: 60, height: 60 }),
    ])
    // Corrupt the layout: duplicate the placement on top of itself.
    result.layouts[0].placements.push({ ...result.layouts[0].placements[0] })
    const issues = validateResult(result, [piece({ id: 'a', width: 60, height: 60 })])
    expect(issues.some((i) => i.message.includes('overlap'))).toBe(true)
  })

  it('detects out-of-bounds placements', () => {
    const result = optimize({ width: 100, height: 100 }, [
      piece({ id: 'a', width: 60, height: 60 }),
    ])
    result.layouts[0].placements[0].x = 80
    const issues = validateResult(result, [piece({ id: 'a', width: 60, height: 60 })])
    expect(issues.some((i) => i.message.includes('out of bounds'))).toBe(true)
  })
})
