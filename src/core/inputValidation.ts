import type { PanelSpec, PieceSpec } from './types.ts'

/** Per-field error messages for the panel form. Absent key = valid. */
export interface PanelIssues {
  width?: string
  height?: string
  thickness?: string
}

/** Per-field error messages for one piece row. Absent key = valid. */
export interface PieceIssues {
  code?: string
  width?: string
  height?: string
  quantity?: string
  /** Piece cannot be cut from the panel in any allowed orientation. */
  fit?: string
}

const isPositive = (n: number) => Number.isFinite(n) && n > 0

export function validatePanel(panel: PanelSpec): PanelIssues {
  const issues: PanelIssues = {}
  if (!isPositive(panel.width)) issues.width = 'Width must be a positive number'
  if (!isPositive(panel.height)) issues.height = 'Height must be a positive number'
  if (panel.thickness !== undefined && !isPositive(panel.thickness)) {
    issues.thickness = 'Thickness must be a positive number'
  }
  return issues
}

/** True when the piece fits the panel in its given or (if allowed) rotated orientation. */
export function pieceFitsPanel(piece: PieceSpec, panel: PanelSpec): boolean {
  const direct = piece.width <= panel.width && piece.height <= panel.height
  const rotated =
    piece.rotatable && piece.height <= panel.width && piece.width <= panel.height
  return direct || rotated
}

export function validatePiece(
  piece: PieceSpec,
  panel: PanelSpec,
  allPieces: PieceSpec[],
): PieceIssues {
  const issues: PieceIssues = {}

  if (piece.code.trim() === '') {
    issues.code = 'Code is required'
  } else if (
    allPieces.some((p) => p.id !== piece.id && p.code.trim() === piece.code.trim())
  ) {
    issues.code = `Duplicate code "${piece.code.trim()}"`
  }

  if (!isPositive(piece.width)) issues.width = 'Width must be a positive number'
  if (!isPositive(piece.height)) issues.height = 'Height must be a positive number'
  if (!Number.isInteger(piece.quantity) || piece.quantity < 1) {
    issues.quantity = 'Quantity must be a whole number ≥ 1'
  }

  const panelValid = Object.keys(validatePanel(panel)).length === 0
  const sizeValid = !issues.width && !issues.height
  if (panelValid && sizeValid && !pieceFitsPanel(piece, panel)) {
    issues.fit = piece.rotatable
      ? `${piece.width} × ${piece.height} does not fit the ${panel.width} × ${panel.height} panel in any orientation`
      : `${piece.width} × ${piece.height} does not fit the ${panel.width} × ${panel.height} panel (rotation is off)`
  }

  return issues
}

export interface InputValidation {
  panel: PanelIssues
  /** Keyed by piece id. Only pieces with at least one issue appear. */
  pieces: Record<string, PieceIssues>
  valid: boolean
}

export function validateInputs(panel: PanelSpec, pieces: PieceSpec[]): InputValidation {
  const panelIssues = validatePanel(panel)
  const pieceIssues: Record<string, PieceIssues> = {}
  for (const piece of pieces) {
    const issues = validatePiece(piece, panel, pieces)
    if (Object.keys(issues).length > 0) pieceIssues[piece.id] = issues
  }
  return {
    panel: panelIssues,
    pieces: pieceIssues,
    valid: Object.keys(panelIssues).length === 0 && Object.keys(pieceIssues).length === 0,
  }
}
