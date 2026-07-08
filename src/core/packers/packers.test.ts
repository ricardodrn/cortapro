import { describe, expect, it } from 'vitest'
import type { Rect } from '../types.ts'
import type { PackUnit, Packer } from './packer.ts'
import { pruneContained, rectContains, rectsIntersect } from './packer.ts'
import { MaxRectsPacker, maxRectsFactory, type MaxRectsHeuristic } from './maxrects.ts'
import { GuillotinePacker, guillotineFactory } from './guillotine.ts'

const rect = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height })

let unitSeq = 0
function unit(width: number, height: number, rotatable = true): PackUnit {
  return { pieceId: `p${unitSeq}`, code: `u${unitSeq++}`, width, height, rotatable }
}

/** Placed rect in bin coordinates, accounting for rotation. */
function placedRect(packer: Packer, u: PackUnit): Rect | null {
  const placed = packer.insert(u)
  if (!placed) return null
  return {
    x: placed.x,
    y: placed.y,
    width: placed.rotated ? u.height : u.width,
    height: placed.rotated ? u.width : u.height,
  }
}

describe('rectsIntersect', () => {
  it('detects overlap', () => {
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(true)
  })

  it('treats edge-touching rects as non-intersecting', () => {
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(false)
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(0, 10, 10, 10))).toBe(false)
  })

  it('detects disjoint rects', () => {
    expect(rectsIntersect(rect(0, 0, 10, 10), rect(20, 20, 5, 5))).toBe(false)
  })
})

describe('rectContains', () => {
  it('detects full containment', () => {
    expect(rectContains(rect(0, 0, 10, 10), rect(2, 2, 5, 5))).toBe(true)
  })

  it('a rect contains itself', () => {
    expect(rectContains(rect(1, 1, 5, 5), rect(1, 1, 5, 5))).toBe(true)
  })

  it('rejects partial overlap', () => {
    expect(rectContains(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(false)
  })
})

describe('pruneContained', () => {
  it('removes rects contained in another', () => {
    const outer = rect(0, 0, 10, 10)
    const inner = rect(2, 2, 3, 3)
    expect(pruneContained([outer, inner])).toEqual([outer])
    expect(pruneContained([inner, outer])).toEqual([outer])
  })

  it('keeps exactly one of two identical rects', () => {
    const a = rect(0, 0, 10, 10)
    expect(pruneContained([a, { ...a }])).toHaveLength(1)
  })

  it('keeps overlapping rects that are not contained', () => {
    const a = rect(0, 0, 10, 10)
    const b = rect(5, 5, 10, 10)
    expect(pruneContained([a, b])).toEqual([a, b])
  })
})

const HEURISTICS: MaxRectsHeuristic[] = ['best-short-side', 'best-area', 'bottom-left']

describe.each(HEURISTICS)('MaxRectsPacker (%s)', (heuristic) => {
  const packer = () => new MaxRectsPacker(100, 100, heuristic)

  it('places the first unit at the origin', () => {
    expect(packer().insert(unit(40, 30))).toMatchObject({ x: 0, y: 0, rotated: false })
  })

  it('returns null when the unit does not fit', () => {
    expect(packer().insert(unit(101, 10, false))).toBeNull()
  })

  it('rotates a unit that only fits rotated', () => {
    const p = new MaxRectsPacker(100, 50, heuristic)
    expect(p.insert(unit(40, 90))).toMatchObject({ rotated: true })
  })

  it('never rotates a non-rotatable unit', () => {
    const p = new MaxRectsPacker(100, 50, heuristic)
    expect(p.insert(unit(40, 90, false))).toBeNull()
  })

  it('fills the bin exactly with a 2×2 grid, leaving no free rects', () => {
    const p = packer()
    for (let i = 0; i < 4; i++) expect(p.insert(unit(50, 50))).not.toBeNull()
    expect(p.insert(unit(1, 1))).toBeNull()
    expect(p.freeRects).toEqual([])
  })

  it('keeps placements in bounds and non-overlapping', () => {
    const p = packer()
    const placed: Rect[] = []
    for (const [w, h] of [[60, 40], [40, 40], [30, 55], [25, 25], [70, 20], [20, 20]]) {
      const r = placedRect(p, unit(w, h))
      if (r) placed.push(r)
    }
    expect(placed.length).toBeGreaterThanOrEqual(5)
    for (const r of placed) {
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.width).toBeLessThanOrEqual(100)
      expect(r.y + r.height).toBeLessThanOrEqual(100)
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(rectsIntersect(placed[i], placed[j])).toBe(false)
      }
    }
  })

  it('free rects always stay inside the bin and cover the unplaced unit', () => {
    const p = packer()
    p.insert(unit(80, 30))
    p.insert(unit(30, 60))
    const bin = rect(0, 0, 100, 100)
    for (const fr of p.freeRects) expect(rectContains(bin, fr)).toBe(true)
    // A 60×30 unit still fits in the remaining space.
    expect(p.insert(unit(60, 30))).not.toBeNull()
  })
})

describe('maxRectsFactory', () => {
  it('builds a packer with the given bin size', () => {
    const p = maxRectsFactory('best-area')(50, 40)
    expect(p.insert(unit(50, 40))).toMatchObject({ x: 0, y: 0 })
    expect(p.freeRects).toEqual([])
  })
})

describe('GuillotinePacker', () => {
  it('places the first unit at the origin', () => {
    const p = new GuillotinePacker(100, 100)
    expect(p.insert(unit(40, 30))).toMatchObject({ x: 0, y: 0, rotated: false })
  })

  it('returns null when the unit does not fit', () => {
    const p = new GuillotinePacker(100, 100)
    expect(p.insert(unit(101, 10, false))).toBeNull()
  })

  it('rotates a unit that only fits rotated', () => {
    const p = new GuillotinePacker(100, 50)
    expect(p.insert(unit(40, 90))).toMatchObject({ rotated: true })
  })

  it('never rotates a non-rotatable unit', () => {
    const p = new GuillotinePacker(100, 50)
    expect(p.insert(unit(40, 90, false))).toBeNull()
  })

  it('fills the bin exactly, leaving no free rects', () => {
    const p = new GuillotinePacker(100, 100)
    expect(p.insert(unit(100, 60, false))).not.toBeNull()
    expect(p.insert(unit(100, 40, false))).not.toBeNull()
    expect(p.freeRects).toEqual([])
  })

  it('prefers the tighter free rect (best area fit)', () => {
    const p = new GuillotinePacker(100, 100)
    // Splits the bin into a 60×100 right strip and a 40×60 bottom strip.
    p.insert(unit(40, 40, false))
    // 38×58 fits both strips; best-area-fit picks the smaller bottom strip.
    expect(p.insert(unit(38, 58, false))).toMatchObject({ x: 0, y: 40 })
  })

  it('keeps free rects disjoint (single guillotine cuts)', () => {
    const p = new GuillotinePacker(100, 100)
    for (const [w, h] of [[60, 40], [30, 30], [40, 55], [20, 20]]) p.insert(unit(w, h))
    const free = p.freeRects
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        expect(rectsIntersect(free[i], free[j])).toBe(false)
      }
    }
  })

  it('keeps placements in bounds and non-overlapping', () => {
    const p = new GuillotinePacker(100, 100)
    const placed: Rect[] = []
    for (const [w, h] of [[60, 40], [40, 40], [30, 55], [25, 25], [70, 20], [20, 20]]) {
      const r = placedRect(p, unit(w, h))
      if (r) placed.push(r)
    }
    expect(placed.length).toBeGreaterThanOrEqual(4)
    for (const r of placed) {
      expect(r.x + r.width).toBeLessThanOrEqual(100)
      expect(r.y + r.height).toBeLessThanOrEqual(100)
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        expect(rectsIntersect(placed[i], placed[j])).toBe(false)
      }
    }
  })
})

describe('guillotineFactory', () => {
  it('builds a packer with the given bin size', () => {
    const p = guillotineFactory()(50, 40)
    expect(p.insert(unit(50, 40))).toMatchObject({ x: 0, y: 0 })
    expect(p.freeRects).toEqual([])
  })
})
