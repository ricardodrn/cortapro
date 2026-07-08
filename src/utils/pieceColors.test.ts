import { describe, expect, it } from 'vitest'
import type { PieceSpec } from '../core/types.ts'
import { PIECE_PALETTE, pieceColorMap } from './pieceColors.ts'

function pieces(n: number): PieceSpec[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    code: String(i + 1).padStart(2, '0'),
    description: '',
    width: 100,
    height: 100,
    quantity: 1,
    rotatable: true,
  }))
}

describe('pieceColorMap', () => {
  it('assigns palette colors in table order', () => {
    const map = pieceColorMap(pieces(3))
    expect(map.get('id-0')).toBe(PIECE_PALETTE[0])
    expect(map.get('id-1')).toBe(PIECE_PALETTE[1])
    expect(map.get('id-2')).toBe(PIECE_PALETTE[2])
  })

  it('cycles the palette beyond its length', () => {
    const map = pieceColorMap(pieces(PIECE_PALETTE.length + 2))
    expect(map.get(`id-${PIECE_PALETTE.length}`)).toBe(PIECE_PALETTE[0])
    expect(map.get(`id-${PIECE_PALETTE.length + 1}`)).toBe(PIECE_PALETTE[1])
  })

  it('a piece keeps its color when a later piece is removed', () => {
    const all = pieces(4)
    const before = pieceColorMap(all)
    const after = pieceColorMap(all.slice(0, 3)) // last piece removed
    for (const p of all.slice(0, 3)) {
      expect(after.get(p.id)).toBe(before.get(p.id))
    }
  })

  it('returns an empty map for no pieces', () => {
    expect(pieceColorMap([]).size).toBe(0)
  })
})
