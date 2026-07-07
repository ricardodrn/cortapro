import type { Rect } from '../types.ts'

/** A single piece instance handed to a packer (dimensions already kerf-inflated). */
export interface PackUnit {
  pieceId: string
  code: string
  width: number
  height: number
  rotatable: boolean
}

export interface PackedUnit {
  unit: PackUnit
  x: number
  y: number
  rotated: boolean
}

/** Packs units into a single bin. Stateful: one instance per panel. */
export interface Packer {
  /** Returns the placement, or null if the unit does not fit anywhere. */
  insert(unit: PackUnit): PackedUnit | null
  readonly freeRects: readonly Rect[]
}

export type PackerFactory = (binWidth: number, binHeight: number) => Packer

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

/** Remove free rects fully contained in another (MaxRects pruning step). */
export function pruneContained(rects: Rect[]): Rect[] {
  return rects.filter(
    (r, i) => !rects.some((other, j) => j !== i && rectContains(other, r) && !(rectContains(r, other) && j > i)),
  )
}
