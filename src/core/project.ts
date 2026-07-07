import type { PackerKind, PanelSpec, PieceSpec } from './types.ts'

/** Everything needed to restore a working session. */
export interface ProjectData {
  panel: PanelSpec
  pieces: PieceSpec[]
  kerf: number
  packer: PackerKind
}

interface ProjectFile extends ProjectData {
  app: 'cortapro'
  version: 1
}

export function serializeProject(data: ProjectData): string {
  const file: ProjectFile = { app: 'cortapro', version: 1, ...data }
  return JSON.stringify(file, null, 2)
}

export type ParseProjectResult = { ok: true; project: ProjectData } | { ok: false; error: string }

const isPos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

/** Validates and normalizes a project file; never trusts the input shape. */
export function parseProject(text: string): ParseProjectResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Not a valid JSON file' }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Not a CortaPro project file' }
  }
  const file = raw as Record<string, unknown>
  if (file.app !== 'cortapro') {
    return { ok: false, error: 'Not a CortaPro project file' }
  }

  const panelRaw = file.panel as Record<string, unknown> | undefined
  if (!panelRaw || !isPos(panelRaw.width) || !isPos(panelRaw.height)) {
    return { ok: false, error: 'Project has no valid panel size' }
  }
  const panel: PanelSpec = {
    width: panelRaw.width,
    height: panelRaw.height,
    material: typeof panelRaw.material === 'string' ? panelRaw.material : undefined,
    thickness: isPos(panelRaw.thickness) ? panelRaw.thickness : undefined,
  }

  if (!Array.isArray(file.pieces)) {
    return { ok: false, error: 'Project has no piece list' }
  }
  const pieces: PieceSpec[] = []
  for (const [i, entry] of (file.pieces as unknown[]).entries()) {
    const p = entry as Record<string, unknown>
    if (typeof p !== 'object' || p === null || !isPos(p.width) || !isPos(p.height)) {
      return { ok: false, error: `Piece ${i + 1} has invalid dimensions` }
    }
    const quantity = p.quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, error: `Piece ${i + 1} has an invalid quantity` }
    }
    pieces.push({
      id: typeof p.id === 'string' && p.id !== '' ? p.id : crypto.randomUUID(),
      code: typeof p.code === 'string' ? p.code : String(i + 1).padStart(2, '0'),
      description: typeof p.description === 'string' ? p.description : '',
      width: p.width,
      height: p.height,
      quantity,
      rotatable: p.rotatable !== false,
    })
  }

  const kerf = typeof file.kerf === 'number' && file.kerf >= 0 ? file.kerf : 0
  const packer: PackerKind =
    file.packer === 'maxrects' || file.packer === 'guillotine' ? file.packer : 'auto'

  return { ok: true, project: { panel, pieces, kerf, packer } }
}
