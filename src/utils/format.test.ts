import { describe, expect, it } from 'vitest'
import { formatArea, formatMm, formatPct, formatSize } from './format.ts'

describe('formatArea', () => {
  it('renders mm² as m² with two decimals', () => {
    expect(formatArea(4_140_000)).toBe('4.14 m²')
    expect(formatArea(0)).toBe('0.00 m²')
    expect(formatArea(8_280_000)).toBe('8.28 m²')
  })
})

describe('formatPct', () => {
  it('renders one decimal', () => {
    expect(formatPct(74.07387)).toBe('74.1%')
    expect(formatPct(100)).toBe('100.0%')
    expect(formatPct(0)).toBe('0.0%')
  })
})

describe('formatMm', () => {
  it('keeps integers without decimals', () => {
    expect(formatMm(2300)).toBe('2300')
    expect(formatMm(0)).toBe('0')
  })

  it('rounds fractional values to one decimal', () => {
    expect(formatMm(12.25)).toBe('12.3')
    expect(formatMm(0.5)).toBe('0.5')
  })
})

describe('formatSize', () => {
  it('renders width × height in mm', () => {
    expect(formatSize(2300, 1800)).toBe('2300 × 1800 mm')
    expect(formatSize(10.5, 20)).toBe('10.5 × 20 mm')
  })
})
