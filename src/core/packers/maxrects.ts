import type { Rect } from '../types.ts'
import type { PackUnit, Packer, PackedUnit } from './packer.ts'
import { pruneContained, rectsIntersect } from './packer.ts'

export type MaxRectsHeuristic = 'best-short-side' | 'best-area' | 'bottom-left'

interface Candidate {
  x: number
  y: number
  rotated: boolean
  score1: number
  score2: number
}

/**
 * MaxRects bin packer (Jylänki, "A Thousand Ways to Pack the Bin").
 * Tracks maximal free rectangles; placed rects split every overlapping free rect.
 */
export class MaxRectsPacker implements Packer {
  private free: Rect[]

  constructor(
    binWidth: number,
    binHeight: number,
    private readonly heuristic: MaxRectsHeuristic,
  ) {
    this.free = [{ x: 0, y: 0, width: binWidth, height: binHeight }]
  }

  get freeRects(): readonly Rect[] {
    return this.free
  }

  insert(unit: PackUnit): PackedUnit | null {
    const best = this.findBest(unit)
    if (!best) return null

    const width = best.rotated ? unit.height : unit.width
    const height = best.rotated ? unit.width : unit.height
    this.place({ x: best.x, y: best.y, width, height })
    return { unit, x: best.x, y: best.y, rotated: best.rotated }
  }

  private findBest(unit: PackUnit): Candidate | null {
    let best: Candidate | null = null
    for (const fr of this.free) {
      best = this.better(best, this.score(fr, unit.width, unit.height, false))
      if (unit.rotatable && unit.width !== unit.height) {
        best = this.better(best, this.score(fr, unit.height, unit.width, true))
      }
    }
    return best
  }

  private score(fr: Rect, w: number, h: number, rotated: boolean): Candidate | null {
    if (w > fr.width || h > fr.height) return null
    const leftoverW = fr.width - w
    const leftoverH = fr.height - h
    switch (this.heuristic) {
      case 'best-short-side':
        return {
          x: fr.x,
          y: fr.y,
          rotated,
          score1: Math.min(leftoverW, leftoverH),
          score2: Math.max(leftoverW, leftoverH),
        }
      case 'best-area':
        return {
          x: fr.x,
          y: fr.y,
          rotated,
          score1: fr.width * fr.height - w * h,
          score2: Math.min(leftoverW, leftoverH),
        }
      case 'bottom-left':
        return { x: fr.x, y: fr.y, rotated, score1: fr.y + h, score2: fr.x }
    }
  }

  private better(a: Candidate | null, b: Candidate | null): Candidate | null {
    if (!a) return b
    if (!b) return a
    if (b.score1 !== a.score1) return b.score1 < a.score1 ? b : a
    return b.score2 < a.score2 ? b : a
  }

  private place(used: Rect) {
    const next: Rect[] = []
    for (const fr of this.free) {
      if (!rectsIntersect(fr, used)) {
        next.push(fr)
        continue
      }
      // Split the free rect into up to four maximal sub-rects around `used`.
      if (used.x > fr.x) {
        next.push({ x: fr.x, y: fr.y, width: used.x - fr.x, height: fr.height })
      }
      if (used.x + used.width < fr.x + fr.width) {
        next.push({
          x: used.x + used.width,
          y: fr.y,
          width: fr.x + fr.width - (used.x + used.width),
          height: fr.height,
        })
      }
      if (used.y > fr.y) {
        next.push({ x: fr.x, y: fr.y, width: fr.width, height: used.y - fr.y })
      }
      if (used.y + used.height < fr.y + fr.height) {
        next.push({
          x: fr.x,
          y: used.y + used.height,
          width: fr.width,
          height: fr.y + fr.height - (used.y + used.height),
        })
      }
    }
    this.free = pruneContained(next)
  }
}

export function maxRectsFactory(heuristic: MaxRectsHeuristic) {
  return (w: number, h: number) => new MaxRectsPacker(w, h, heuristic)
}
