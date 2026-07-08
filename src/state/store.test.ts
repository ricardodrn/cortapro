import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from './store.ts'
import type { OptimizeResult, PieceSpec } from '../core/types.ts'

const store = () => useAppStore.getState()

function piece(partial: Partial<PieceSpec> = {}): PieceSpec {
  return {
    id: crypto.randomUUID(),
    code: '01',
    description: '',
    width: 100,
    height: 100,
    quantity: 1,
    rotatable: true,
    ...partial,
  }
}

/** Marker used to assert that an action cleared the result. */
const FAKE_RESULT = { layouts: [], unplaced: [] } as unknown as OptimizeResult

beforeEach(() => {
  useAppStore.setState({
    panel: { width: 2300, height: 1800, material: 'MDF' },
    pieces: [],
    kerf: 0,
    packer: 'auto',
    result: null,
    optimizing: false,
  })
})

describe('initial state', () => {
  it('starts with no pieces (new users enter their own)', () => {
    expect(store().pieces).toEqual([])
    expect(store().result).toBeNull()
  })
})

describe('addPiece', () => {
  it('appends an empty piece with the next free code', () => {
    store().addPiece()
    store().addPiece()
    const codes = store().pieces.map((p) => p.code)
    expect(codes).toEqual(['01', '02'])
    expect(store().pieces[0]).toMatchObject({ width: 0, height: 0, quantity: 1, rotatable: true })
  })

  it('fills gaps in the code sequence', () => {
    useAppStore.setState({ pieces: [piece({ code: '01' }), piece({ code: '03' })] })
    store().addPiece()
    expect(store().pieces[2].code).toBe('02')
  })
})

describe('updatePiece', () => {
  it('patches only the targeted piece and clears the result', () => {
    const a = piece({ code: '01' })
    const b = piece({ code: '02' })
    useAppStore.setState({ pieces: [a, b], result: FAKE_RESULT })
    store().updatePiece(b.id, { width: 555 })
    expect(store().pieces[0].width).toBe(100)
    expect(store().pieces[1].width).toBe(555)
    expect(store().result).toBeNull()
  })
})

describe('duplicatePiece', () => {
  it('inserts a copy right after the source with a fresh id and code', () => {
    const a = piece({ code: '01', width: 580 })
    const b = piece({ code: '02' })
    useAppStore.setState({ pieces: [a, b] })
    store().duplicatePiece(a.id)
    const pieces = store().pieces
    expect(pieces).toHaveLength(3)
    expect(pieces[1]).toMatchObject({ code: '03', width: 580 })
    expect(pieces[1].id).not.toBe(a.id)
    expect(pieces[2].id).toBe(b.id)
  })

  it('ignores unknown ids', () => {
    useAppStore.setState({ pieces: [piece()] })
    store().duplicatePiece('missing')
    expect(store().pieces).toHaveLength(1)
  })
})

describe('removePiece / clearPieces', () => {
  it('removes only the targeted piece', () => {
    const a = piece({ code: '01' })
    const b = piece({ code: '02' })
    useAppStore.setState({ pieces: [a, b] })
    store().removePiece(a.id)
    expect(store().pieces.map((p) => p.id)).toEqual([b.id])
  })

  it('clearPieces empties the list and the result', () => {
    useAppStore.setState({ pieces: [piece()], result: FAKE_RESULT })
    store().clearPieces()
    expect(store().pieces).toEqual([])
    expect(store().result).toBeNull()
  })
})

describe('addPieces (CSV import)', () => {
  it('appends imported pieces after the existing ones', () => {
    const existing = piece({ code: '01' })
    useAppStore.setState({ pieces: [existing] })
    store().addPieces([piece({ code: '02' }), piece({ code: '03' })])
    expect(store().pieces.map((p) => p.code)).toEqual(['01', '02', '03'])
  })
})

describe('loadExample', () => {
  it('loads the demo project: 11 piece types, 37 pieces total', () => {
    store().loadExample()
    const pieces = store().pieces
    expect(pieces).toHaveLength(11)
    expect(pieces.reduce((sum, p) => sum + p.quantity, 0)).toBe(37)
    expect(store().panel).toEqual({ width: 2300, height: 1800, material: 'MDF' })
  })
})

describe('loadProject', () => {
  it('replaces the whole session and clears the result', () => {
    useAppStore.setState({ pieces: [piece()], result: FAKE_RESULT })
    store().loadProject({
      panel: { width: 1220, height: 2440, material: 'Plywood' },
      pieces: [piece({ code: '07', width: 300 })],
      kerf: 3,
      packer: 'guillotine',
    })
    expect(store().panel.material).toBe('Plywood')
    expect(store().pieces).toHaveLength(1)
    expect(store().kerf).toBe(3)
    expect(store().packer).toBe('guillotine')
    expect(store().result).toBeNull()
  })
})

describe('setPanel / setKerf / setPacker', () => {
  it('each input change invalidates the current result', () => {
    for (const change of [
      () => store().setPanel({ width: 2000 }),
      () => store().setKerf(3),
      () => store().setPacker('maxrects'),
    ]) {
      useAppStore.setState({ result: FAKE_RESULT })
      change()
      expect(store().result).toBeNull()
    }
    expect(store().panel.width).toBe(2000)
    expect(store().kerf).toBe(3)
    expect(store().packer).toBe('maxrects')
  })
})

describe('runOptimize', () => {
  it('produces a result for the current inputs', async () => {
    useAppStore.setState({ pieces: [piece({ width: 500, height: 400, quantity: 4 })] })
    store().runOptimize()
    expect(store().optimizing).toBe(true)
    await vi.waitFor(() => expect(store().optimizing).toBe(false))
    const result = store().result
    expect(result).not.toBeNull()
    expect(result!.stats.panelCount).toBe(1)
    expect(result!.unplaced).toEqual([])
  })

  it('drops a stale result when inputs change mid-run', async () => {
    useAppStore.setState({ pieces: [piece({ width: 500, height: 400 })] })
    store().runOptimize()
    store().setKerf(5) // invalidates before the (async) result lands
    await new Promise((r) => setTimeout(r, 10))
    expect(store().result).toBeNull()
    expect(store().optimizing).toBe(false)
  })
})
