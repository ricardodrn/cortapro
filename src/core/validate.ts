import type { OptimizeResult, PieceSpec } from './types.ts'

export interface ValidationIssue {
  panelIndex: number
  message: string
}

/**
 * Sanity-checks an optimizer result: pieces stay in bounds, never overlap,
 * and every requested piece is either placed or reported as unplaced.
 * `kerf` is the gap that must separate pieces (0 = touching allowed).
 */
export function validateResult(
  result: OptimizeResult,
  pieces: PieceSpec[],
  kerf = 0,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { panel } = result

  result.layouts.forEach((layout, panelIndex) => {
    for (const p of layout.placements) {
      if (p.x < 0 || p.y < 0 || p.x + p.width > panel.width || p.y + p.height > panel.height) {
        issues.push({ panelIndex, message: `piece ${p.code} out of bounds at (${p.x}, ${p.y})` })
      }
    }

    for (let i = 0; i < layout.placements.length; i++) {
      for (let j = i + 1; j < layout.placements.length; j++) {
        const a = layout.placements[i]
        const b = layout.placements[j]
        const gapX = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width))
        const gapY = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height))
        if (gapX < 0 && gapY < 0) {
          issues.push({ panelIndex, message: `pieces ${a.code} and ${b.code} overlap` })
        } else if (kerf > 0 && Math.max(gapX, gapY) < kerf) {
          issues.push({
            panelIndex,
            message: `pieces ${a.code} and ${b.code} closer than kerf (${kerf}mm)`,
          })
        }
      }
    }
  })

  const accounted = new Map<string, number>()
  for (const layout of result.layouts) {
    for (const p of layout.placements) {
      accounted.set(p.pieceId, (accounted.get(p.pieceId) ?? 0) + 1)
    }
  }
  for (const u of result.unplaced) {
    accounted.set(u.pieceId, (accounted.get(u.pieceId) ?? 0) + 1)
  }
  for (const piece of pieces) {
    const count = accounted.get(piece.id) ?? 0
    if (count !== piece.quantity) {
      issues.push({
        panelIndex: -1,
        message: `piece ${piece.code}: requested ${piece.quantity}, accounted for ${count}`,
      })
    }
  }

  return issues
}
