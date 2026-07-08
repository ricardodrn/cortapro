import { useAppStore } from '../state/store.ts'
import type { PieceSpec } from '../core/types.ts'

/** Resets the (module-global) zustand store between tests. */
export function resetStore() {
  useAppStore.setState({
    panel: { width: 2300, height: 1800, material: 'MDF' },
    pieces: [],
    kerf: 0,
    packer: 'auto',
    result: null,
    optimizing: false,
  })
}

export function testPiece(partial: Partial<PieceSpec> = {}): PieceSpec {
  return {
    id: crypto.randomUUID(),
    code: '01',
    description: '',
    width: 500,
    height: 400,
    quantity: 1,
    rotatable: true,
    ...partial,
  }
}
