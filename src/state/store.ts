import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizeResult, PackerKind, PanelSpec, PieceSpec } from '../core/types.ts'
import { optimize } from '../core/optimizer.ts'

const newId = () => crypto.randomUUID()

function examplePieces(): PieceSpec[] {
  const rows: Array<[string, string, number, number, number]> = [
    ['01', 'Divider', 580, 310, 10],
    ['02', 'Top Base', 1000, 310, 1],
    ['03', 'Left Side', 650, 310, 2],
    ['04', 'Right Side', 650, 310, 2],
    ['05', 'Back Panel', 676, 298, 3],
    ['06', 'Small Shelf', 326, 264, 10],
    ['07', 'Large Shelf', 661, 264, 1],
    ['08', 'Door', 619, 333, 3],
    ['09', 'Bottom Base', 1000, 310, 1],
    ['10', 'Side Back', 628, 322, 3],
    ['11', 'Crossbar', 1000, 45, 1],
  ]
  return rows.map(([code, description, width, height, quantity]) => ({
    id: newId(),
    code,
    description,
    width,
    height,
    quantity,
    rotatable: true,
  }))
}

/** Next free zero-padded numeric code, e.g. pieces 01..11 present → '12'. */
function nextCode(pieces: PieceSpec[]): string {
  const used = new Set(pieces.map((p) => p.code.trim()))
  for (let n = 1; ; n++) {
    const code = String(n).padStart(2, '0')
    if (!used.has(code)) return code
  }
}

interface AppState {
  panel: PanelSpec
  pieces: PieceSpec[]
  kerf: number
  packer: PackerKind
  /** Last optimizer run; cleared whenever inputs change. Not persisted. */
  result: OptimizeResult | null

  setPanel: (patch: Partial<PanelSpec>) => void
  setKerf: (kerf: number) => void
  setPacker: (packer: PackerKind) => void
  addPiece: () => void
  updatePiece: (id: string, patch: Partial<Omit<PieceSpec, 'id'>>) => void
  removePiece: (id: string) => void
  duplicatePiece: (id: string) => void
  clearPieces: () => void
  loadExample: () => void
  runOptimize: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      panel: { width: 2300, height: 1800, material: 'MDF' },
      pieces: examplePieces(),
      kerf: 0,
      packer: 'auto',
      result: null,

      setPanel: (patch) => set({ panel: { ...get().panel, ...patch }, result: null }),
      setKerf: (kerf) => set({ kerf, result: null }),
      setPacker: (packer) => set({ packer, result: null }),

      addPiece: () =>
        set((s) => ({
          pieces: [
            ...s.pieces,
            {
              id: newId(),
              code: nextCode(s.pieces),
              description: '',
              width: 0,
              height: 0,
              quantity: 1,
              rotatable: true,
            },
          ],
          result: null,
        })),

      updatePiece: (id, patch) =>
        set((s) => ({
          pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          result: null,
        })),

      removePiece: (id) =>
        set((s) => ({ pieces: s.pieces.filter((p) => p.id !== id), result: null })),

      duplicatePiece: (id) =>
        set((s) => {
          const index = s.pieces.findIndex((p) => p.id === id)
          if (index === -1) return s
          const source = s.pieces[index]
          const copy = { ...source, id: newId(), code: nextCode(s.pieces) }
          const pieces = [...s.pieces]
          pieces.splice(index + 1, 0, copy)
          return { pieces, result: null }
        }),

      clearPieces: () => set({ pieces: [], result: null }),
      loadExample: () =>
        set({ panel: { width: 2300, height: 1800, material: 'MDF' }, pieces: examplePieces(), result: null }),

      runOptimize: () => {
        const { panel, pieces, kerf, packer } = get()
        set({ result: optimize(panel, pieces, { kerf, packer }) })
      },
    }),
    {
      name: 'cortapro-inputs',
      version: 1,
      partialize: ({ panel, pieces, kerf, packer }) => ({ panel, pieces, kerf, packer }),
    },
  ),
)
