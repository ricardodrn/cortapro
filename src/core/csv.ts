import { msg, type TransMsg } from './i18nMsg.ts'
import type { PieceSpec } from './types.ts'

export interface CsvImportResult {
  pieces: PieceSpec[]
  /** Translatable problems, one per skipped line. */
  errors: TransMsg[]
}

/**
 * Parses a piece list CSV with columns:
 *   code, description, width, height, quantity [, rotatable]
 * A header row is detected and skipped. Delimiter is auto-detected
 * (comma, semicolon, or tab); with a semicolon delimiter, decimal
 * commas ("580,5") are accepted. Rotatable accepts yes/no/true/false/
 * 1/0/si/sí and defaults to yes.
 */
export function parsePiecesCsv(text: string): CsvImportResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
  const firstDataLine = lines.find((l) => l.length > 0) ?? ''
  const delimiter = detectDelimiter(firstDataLine)

  const pieces: PieceSpec[] = []
  const errors: TransMsg[] = []

  lines.forEach((line, i) => {
    if (line.length === 0) return
    const fields = splitLine(line, delimiter).map((f) => f.trim())
    if (isHeaderRow(fields)) return

    const lineNo = i + 1
    if (fields.length < 5) {
      errors.push(msg('csv.missingColumns', { line: lineNo }))
      return
    }

    const [code, description, widthRaw, heightRaw, quantityRaw, rotatableRaw] = fields
    const width = parseNumber(widthRaw, delimiter)
    const height = parseNumber(heightRaw, delimiter)
    const quantity = parseNumber(quantityRaw, delimiter)

    if (code === '') {
      errors.push(msg('csv.missingCode', { line: lineNo }))
      return
    }
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      errors.push(msg('csv.invalidSize', { line: lineNo, width: widthRaw, height: heightRaw }))
      return
    }
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
      errors.push(msg('csv.invalidQuantity', { line: lineNo, quantity: quantityRaw }))
      return
    }

    pieces.push({
      id: crypto.randomUUID(),
      code,
      description: description ?? '',
      width,
      height,
      quantity,
      rotatable: parseRotatable(rotatableRaw),
    })
  })

  return { pieces, errors }
}

function detectDelimiter(line: string): string {
  const counts: Array<[string, number]> = [
    [';', (line.match(/;/g) ?? []).length],
    ['\t', (line.match(/\t/g) ?? []).length],
    [',', (line.match(/,/g) ?? []).length],
  ]
  counts.sort((a, b) => b[1] - a[1])
  return counts[0][1] > 0 ? counts[0][0] : ','
}

/** Minimal CSV field splitter with support for double-quoted fields. */
function splitLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function isHeaderRow(fields: string[]): boolean {
  const [, , width, height] = fields
  const nonNumeric = (s: string | undefined) =>
    s !== undefined && s !== '' && !Number.isFinite(parseFloat(s.replace(',', '.')))
  return nonNumeric(width) && nonNumeric(height)
}

function parseNumber(raw: string, delimiter: string): number {
  const normalized = delimiter === ';' ? raw.replace(',', '.') : raw
  // reject trailing garbage that parseFloat would silently ignore
  return /^-?\d+(\.\d+)?$/.test(normalized) ? parseFloat(normalized) : NaN
}

const NO_VALUES = new Set(['no', 'n', 'false', '0'])

function parseRotatable(raw: string | undefined): boolean {
  if (raw === undefined || raw === '') return true
  return !NO_VALUES.has(raw.toLowerCase())
}
