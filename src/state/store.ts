import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizeResult, PackerKind, PanelSpec, PieceSpec } from '../core/types.ts'
import type { ProjectData } from '../core/project.ts'
import { optimizeAsync } from '../core/optimizeAsync.ts'

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

/** Bumped on every input change so a worker reply for stale inputs is dropped. */
let optimizeRun = 0

/** Spread into any input mutation: clears the result and cancels an in-flight run. */
function invalidate() {
  optimizeRun++
  return { result: null, optimizing: false }
}

interface AppState {
  panel: PanelSpec
  pieces: PieceSpec[]
  kerf: number
  packer: PackerKind
  /** Last optimizer run; cleared whenever inputs change. Not persisted. */
  result: OptimizeResult | null
  /** True while the optimizer worker is running. Not persisted. */
  optimizing: boolean

  setPanel: (patch: Partial<PanelSpec>) => void
  setKerf: (kerf: number) => void
  setPacker: (packer: PackerKind) => void
  addPiece: () => void
  /** Appends imported pieces (CSV import). */
  addPieces: (pieces: PieceSpec[]) => void
  /** Replaces the whole session with a loaded project file. */
  loadProject: (project: ProjectData) => void
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
      optimizing: false,

      setPanel: (patch) => set({ panel: { ...get().panel, ...patch }, ...invalidate() }),
      setKerf: (kerf) => set({ kerf, ...invalidate() }),
      setPacker: (packer) => set({ packer, ...invalidate() }),

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
          ...invalidate(),
        })),

      addPieces: (pieces) =>
        set((s) => ({ pieces: [...s.pieces, ...pieces], ...invalidate() })),

      loadProject: (project) => set({ ...project, ...invalidate() }),

      updatePiece: (id, patch) =>
        set((s) => ({
          pieces: s.pieces.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          ...invalidate(),
        })),

      removePiece: (id) =>
        set((s) => ({ pieces: s.pieces.filter((p) => p.id !== id), ...invalidate() })),

      duplicatePiece: (id) =>
        set((s) => {
          const index = s.pieces.findIndex((p) => p.id === id)
          if (index === -1) return s
          const source = s.pieces[index]
          const copy = { ...source, id: newId(), code: nextCode(s.pieces) }
          const pieces = [...s.pieces]
          pieces.splice(index + 1, 0, copy)
          return { pieces, ...invalidate() }
        }),

      clearPieces: () => set({ pieces: [], ...invalidate() }),
      loadExample: () =>
        set({
          panel: { width: 2300, height: 1800, material: 'MDF' },
          pieces: examplePieces(),
          ...invalidate(),
        }),

      runOptimize: () => {
        const { panel, pieces, kerf, packer } = get()
        const run = ++optimizeRun
        set({ result: null, optimizing: true })
        void optimizeAsync(panel, pieces, { kerf, packer }).then((result) => {
          if (run !== optimizeRun) return // inputs changed or a newer run started
          set({ result, optimizing: false })
        })
      },
    }),
    {
      name: 'cortapro-inputs',
      version: 1,
      partialize: ({ panel, pieces, kerf, packer }) => ({ panel, pieces, kerf, packer }),
    },
  ),
)
