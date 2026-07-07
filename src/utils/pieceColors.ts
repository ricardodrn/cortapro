import type { PieceSpec } from '../core/types.ts'

/**
 * Categorical palette (validated: CVD-safe adjacent ΔE 24.2, light surface).
 * Slots are assigned in fixed table order, never re-sorted, so a piece keeps
 * its color when others are added or removed after it. Beyond 8 types the
 * palette cycles — acceptable here because every rect is direct-labeled with
 * its code, so color is never the only identity channel.
 */
export const PIECE_PALETTE = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
] as const

export const FALLBACK_COLOR = '#64748b'

/** Piece id → hex, keyed by the piece's position in the (stable) table order. */
export function pieceColorMap(pieces: PieceSpec[]): Map<string, string> {
  const map = new Map<string, string>()
  pieces.forEach((piece, i) => {
    map.set(piece.id, PIECE_PALETTE[i % PIECE_PALETTE.length])
  })
  return map
}
