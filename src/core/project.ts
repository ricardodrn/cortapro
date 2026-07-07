import { msg, type TransMsg } from './i18nMsg.ts'
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

export type ParseProjectResult =
  | { ok: true; project: ProjectData }
  | { ok: false; error: TransMsg }

const isPos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

/** Validates and normalizes a project file; never trusts the input shape. */
export function parseProject(text: string): ParseProjectResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: msg('projectError.notJson') }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: msg('projectError.notCortaPro') }
  }
  const file = raw as Record<string, unknown>
  if (file.app !== 'cortapro') {
    return { ok: false, error: msg('projectError.notCortaPro') }
  }

  const panelRaw = file.panel as Record<string, unknown> | undefined
  if (!panelRaw || !isPos(panelRaw.width) || !isPos(panelRaw.height)) {
    return { ok: false, error: msg('projectError.noPanel') }
  }
  const panel: PanelSpec = {
    width: panelRaw.width,
    height: panelRaw.height,
    material: typeof panelRaw.material === 'string' ? panelRaw.material : undefined,
    thickness: isPos(panelRaw.thickness) ? panelRaw.thickness : undefined,
  }

  if (!Array.isArray(file.pieces)) {
    return { ok: false, error: msg('projectError.noPieceList') }
  }
  const pieces: PieceSpec[] = []
  for (const [i, entry] of (file.pieces as unknown[]).entries()) {
    const p = entry as Record<string, unknown>
    if (typeof p !== 'object' || p === null || !isPos(p.width) || !isPos(p.height)) {
      return { ok: false, error: msg('projectError.pieceDimensions', { index: i + 1 }) }
    }
    const quantity = p.quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, error: msg('projectError.pieceQuantity', { index: i + 1 }) }
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
