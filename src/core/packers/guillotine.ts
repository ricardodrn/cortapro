import type { Rect } from '../types.ts'
import type { PackUnit, Packer, PackedUnit } from './packer.ts'

/**
 * Guillotine bin packer: every placement splits its free rect with a single
 * edge-to-edge cut, so the resulting layout is always cuttable on a panel saw.
 * Free rect choice: Best Area Fit. Split axis: Shorter Axis Split (SAS).
 */
export class GuillotinePacker implements Packer {
  private free: Rect[]

  constructor(binWidth: number, binHeight: number) {
    this.free = [{ x: 0, y: 0, width: binWidth, height: binHeight }]
  }

  get freeRects(): readonly Rect[] {
    return this.free
  }

  insert(unit: PackUnit): PackedUnit | null {
    let bestIndex = -1
    let bestRotated = false
    let bestScore = Infinity

    for (let i = 0; i < this.free.length; i++) {
      const fr = this.free[i]
      const area = fr.width * fr.height
      if (unit.width <= fr.width && unit.height <= fr.height) {
        const score = area - unit.width * unit.height
        if (score < bestScore) {
          bestScore = score
          bestIndex = i
          bestRotated = false
        }
      }
      if (unit.rotatable && unit.height <= fr.width && unit.width <= fr.height) {
        const score = area - unit.width * unit.height
        if (score < bestScore) {
          bestScore = score
          bestIndex = i
          bestRotated = true
        }
      }
    }

    if (bestIndex === -1) return null

    const fr = this.free[bestIndex]
    const w = bestRotated ? unit.height : unit.width
    const h = bestRotated ? unit.width : unit.height
    this.free.splice(bestIndex, 1)
    this.split(fr, w, h)
    return { unit, x: fr.x, y: fr.y, rotated: bestRotated }
  }

  private split(fr: Rect, w: number, h: number) {
    const leftoverW = fr.width - w
    const leftoverH = fr.height - h

    // SAS: cut along the axis with the smaller leftover, keeping the bigger
    // leftover as one full-length strip.
    let right: Rect
    let bottom: Rect
    if (leftoverW < leftoverH) {
      // Horizontal cut first: bottom strip spans the full width.
      right = { x: fr.x + w, y: fr.y, width: leftoverW, height: h }
      bottom = { x: fr.x, y: fr.y + h, width: fr.width, height: leftoverH }
    } else {
      // Vertical cut first: right strip spans the full height.
      right = { x: fr.x + w, y: fr.y, width: leftoverW, height: fr.height }
      bottom = { x: fr.x, y: fr.y + h, width: w, height: leftoverH }
    }

    if (right.width > 0 && right.height > 0) this.free.push(right)
    if (bottom.width > 0 && bottom.height > 0) this.free.push(bottom)
  }
}

export function guillotineFactory() {
  return (w: number, h: number) => new GuillotinePacker(w, h)
}
