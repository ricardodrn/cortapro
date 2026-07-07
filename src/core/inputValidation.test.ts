import { describe, expect, it } from 'vitest'
import { pieceFitsPanel, validateInputs, validatePanel, validatePiece } from './inputValidation.ts'
import type { PanelSpec, PieceSpec } from './types.ts'

const panel: PanelSpec = { width: 2300, height: 1800 }

const piece = (patch: Partial<PieceSpec> = {}): PieceSpec => ({
  id: 'p1',
  code: '01',
  description: 'Test',
  width: 580,
  height: 310,
  quantity: 1,
  rotatable: true,
  ...patch,
})

describe('validatePanel', () => {
  it('accepts a valid panel', () => {
    expect(validatePanel(panel)).toEqual({})
  })

  it('rejects non-positive dimensions', () => {
    expect(validatePanel({ width: 0, height: -5 })).toMatchObject({
      width: expect.any(String),
      height: expect.any(String),
    })
  })

  it('rejects non-positive thickness but allows it to be absent', () => {
    expect(validatePanel({ ...panel, thickness: 0 }).thickness).toBeDefined()
    expect(validatePanel({ ...panel, thickness: 18 })).toEqual({})
    expect(validatePanel(panel)).toEqual({})
  })
})

describe('pieceFitsPanel', () => {
  it('fits directly', () => {
    expect(pieceFitsPanel(piece(), panel)).toBe(true)
  })

  it('fits only rotated when rotation is allowed', () => {
    const tall = piece({ width: 1000, height: 2300, rotatable: true })
    expect(pieceFitsPanel(tall, panel)).toBe(true)
    expect(pieceFitsPanel({ ...tall, rotatable: false }, panel)).toBe(false)
  })

  it('rejects a piece larger than the panel in both orientations', () => {
    expect(pieceFitsPanel(piece({ width: 2400, height: 1900 }), panel)).toBe(false)
  })

  it('accepts an exact fit', () => {
    expect(pieceFitsPanel(piece({ width: 2300, height: 1800 }), panel)).toBe(true)
  })
})

describe('validatePiece', () => {
  it('accepts a valid piece', () => {
    expect(validatePiece(piece(), panel, [piece()])).toEqual({})
  })

  it('requires a code and flags duplicates', () => {
    expect(validatePiece(piece({ code: '  ' }), panel, []).code).toBeDefined()
    const a = piece({ id: 'a', code: '01' })
    const b = piece({ id: 'b', code: '01' })
    expect(validatePiece(a, panel, [a, b]).code).toContain('Duplicate')
  })

  it('rejects non-positive dimensions and fractional or zero quantity', () => {
    const issues = validatePiece(piece({ width: 0, height: -1, quantity: 1.5 }), panel, [])
    expect(issues.width).toBeDefined()
    expect(issues.height).toBeDefined()
    expect(issues.quantity).toBeDefined()
  })

  it('reports fit errors only when size fields are otherwise valid', () => {
    expect(validatePiece(piece({ width: 3000, rotatable: false }), panel, []).fit).toBeDefined()
    expect(validatePiece(piece({ width: 0 }), panel, []).fit).toBeUndefined()
  })

  it('skips the fit check when the panel itself is invalid', () => {
    const badPanel: PanelSpec = { width: 0, height: 1800 }
    expect(validatePiece(piece(), badPanel, []).fit).toBeUndefined()
  })
})

describe('validateInputs', () => {
  it('is valid for the example-style input', () => {
    const result = validateInputs(panel, [piece()])
    expect(result.valid).toBe(true)
    expect(result.pieces).toEqual({})
  })

  it('collects issues per piece id and reports invalid overall', () => {
    const bad = piece({ id: 'bad', code: '02', width: 0 })
    const result = validateInputs(panel, [piece(), bad])
    expect(result.valid).toBe(false)
    expect(Object.keys(result.pieces)).toEqual(['bad'])
  })
})
