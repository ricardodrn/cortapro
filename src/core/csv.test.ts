import { describe, expect, it } from 'vitest'
import { parsePiecesCsv } from './csv.ts'

describe('parsePiecesCsv', () => {
  it('parses comma-separated rows with a header', () => {
    const { pieces, errors } = parsePiecesCsv(
      'code,description,width,height,quantity,rotatable\n01,Divider,580,310,10,yes\n02,Top Base,1000,310,1,no\n',
    )
    expect(errors).toEqual([])
    expect(pieces).toHaveLength(2)
    expect(pieces[0]).toMatchObject({
      code: '01',
      description: 'Divider',
      width: 580,
      height: 310,
      quantity: 10,
      rotatable: true,
    })
    expect(pieces[1].rotatable).toBe(false)
    expect(pieces[0].id).not.toBe(pieces[1].id)
  })

  it('parses semicolon delimiter with decimal commas and no header', () => {
    const { pieces, errors } = parsePiecesCsv('01;Divider;580,5;310;10\r\n')
    expect(errors).toEqual([])
    expect(pieces[0].width).toBeCloseTo(580.5)
    expect(pieces[0].rotatable).toBe(true) // defaults to yes when column absent
  })

  it('handles quoted fields containing the delimiter', () => {
    const { pieces } = parsePiecesCsv('01,"Shelf, small",326,264,10')
    expect(pieces[0].description).toBe('Shelf, small')
  })

  it('strips a BOM and skips blank lines', () => {
    const { pieces, errors } = parsePiecesCsv('﻿01,Divider,580,310,10\n\n\n')
    expect(errors).toEqual([])
    expect(pieces).toHaveLength(1)
  })

  it('reports bad rows with line numbers and keeps good ones', () => {
    const { pieces, errors } = parsePiecesCsv(
      '01,Good,580,310,10\n02,Short,580\n03,BadSize,0,310,5\n04,BadQty,580,310,1.5\n05,Good2,100,100,1',
    )
    expect(pieces.map((p) => p.code)).toEqual(['01', '05'])
    expect(errors).toHaveLength(3)
    expect(errors[0].values?.line).toBe(2)
    expect(errors[1].values?.line).toBe(3)
    expect(errors[2].values?.line).toBe(4)
  })

  it('rejects numeric fields with trailing garbage', () => {
    const { pieces, errors } = parsePiecesCsv('01,X,580mm,310,10')
    expect(pieces).toHaveLength(0)
    expect(errors).toHaveLength(1)
  })
})
