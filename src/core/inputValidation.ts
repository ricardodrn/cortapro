import { msg, type TransMsg } from './i18nMsg.ts'
import type { PanelSpec, PieceSpec } from './types.ts'

/** Per-field error messages for the panel form. Absent key = valid. */
export interface PanelIssues {
  width?: TransMsg
  height?: TransMsg
  thickness?: TransMsg
}

/** Per-field error messages for one piece row. Absent key = valid. */
export interface PieceIssues {
  code?: TransMsg
  width?: TransMsg
  height?: TransMsg
  quantity?: TransMsg
  /** Piece cannot be cut from the panel in any allowed orientation. */
  fit?: TransMsg
}

const isPositive = (n: number) => Number.isFinite(n) && n > 0

export function validatePanel(panel: PanelSpec): PanelIssues {
  const issues: PanelIssues = {}
  if (!isPositive(panel.width)) issues.width = msg('validation.panelWidthPositive')
  if (!isPositive(panel.height)) issues.height = msg('validation.panelHeightPositive')
  if (panel.thickness !== undefined && !isPositive(panel.thickness)) {
    issues.thickness = msg('validation.panelThicknessPositive')
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
    issues.code = msg('validation.pieceCodeRequired')
  } else if (
    allPieces.some((p) => p.id !== piece.id && p.code.trim() === piece.code.trim())
  ) {
    issues.code = msg('validation.pieceCodeDuplicate', { code: piece.code.trim() })
  }

  if (!isPositive(piece.width)) issues.width = msg('validation.pieceWidthPositive')
  if (!isPositive(piece.height)) issues.height = msg('validation.pieceHeightPositive')
  if (!Number.isInteger(piece.quantity) || piece.quantity < 1) {
    issues.quantity = msg('validation.pieceQuantityWhole')
  }

  const panelValid = Object.keys(validatePanel(panel)).length === 0
  const sizeValid = !issues.width && !issues.height
  if (panelValid && sizeValid && !pieceFitsPanel(piece, panel)) {
    const values = {
      pw: piece.width,
      ph: piece.height,
      panelW: panel.width,
      panelH: panel.height,
    }
    issues.fit = piece.rotatable
      ? msg('validation.pieceFitRotatable', values)
      : msg('validation.pieceFitFixed', values)
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
