/** mm² rendered as m² with two decimals, e.g. 4140000 → "4.14 m²". */
export function formatArea(mm2: number): string {
  return `${(mm2 / 1_000_000).toFixed(2)} m²`
}

export function formatPct(fraction0to100: number): string {
  return `${fraction0to100.toFixed(1)}%`
}

export function formatMm(mm: number): string {
  return Number.isInteger(mm) ? String(mm) : mm.toFixed(1)
}

export function formatSize(width: number, height: number): string {
  return `${formatMm(width)} × ${formatMm(height)} mm`
}
