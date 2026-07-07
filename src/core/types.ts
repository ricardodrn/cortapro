/** Raw stock panel the pieces are cut from. Dimensions in mm. */
export interface PanelSpec {
  width: number
  height: number
  material?: string
  thickness?: number
}

/** A required piece as entered by the user. */
export interface PieceSpec {
  id: string
  code: string
  description: string
  width: number
  height: number
  quantity: number
  rotatable: boolean
}

/** Axis-aligned rectangle, origin at panel top-left. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** One placed piece instance on a specific panel. */
export interface Placement {
  pieceId: string
  code: string
  x: number
  y: number
  /** Actual placed width (already swapped if rotated). */
  width: number
  /** Actual placed height (already swapped if rotated). */
  height: number
  rotated: boolean
}

/** Result for a single stock panel. */
export interface PanelLayout {
  placements: Placement[]
  /** Leftover free rectangles (waste / usable offcuts). */
  freeRects: Rect[]
  usedArea: number
  /** 0–1 fraction of panel area covered by pieces. */
  utilization: number
}

export interface Stats {
  panelCount: number
  totalPanelArea: number
  usedArea: number
  wasteArea: number
  utilizationPct: number
  wastePct: number
  /** Biggest single reusable offcut across all panels, or null if none. */
  largestFreeRect: Rect | null
}

/** A piece instance that could not be placed on any panel. */
export interface UnplacedPiece {
  pieceId: string
  code: string
  width: number
  height: number
  reason: 'too-large' | 'no-space'
}

export interface OptimizeResult {
  panel: PanelSpec
  layouts: PanelLayout[]
  unplaced: UnplacedPiece[]
  stats: Stats
  /** Which packer/heuristic/sort combination produced this result. */
  strategy: string
}

export type PackerKind = 'maxrects' | 'guillotine' | 'auto'

export interface OptimizeOptions {
  /** Saw blade thickness in mm added between pieces. Default 0. */
  kerf?: number
  /** 'auto' tries every packer and keeps the best result. Default 'auto'. */
  packer?: PackerKind
}
