import { describe, expect, it } from 'vitest'
import { parseProject, serializeProject, type ProjectData } from './project.ts'

const sample: ProjectData = {
  panel: { width: 2300, height: 1800, material: 'MDF' },
  pieces: [
    {
      id: 'a',
      code: '01',
      description: 'Divider',
      width: 580,
      height: 310,
      quantity: 10,
      rotatable: true,
    },
  ],
  kerf: 3,
  packer: 'auto',
}

describe('project round trip', () => {
  it('serializes and parses back losslessly', () => {
    const parsed = parseProject(serializeProject(sample))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.project).toEqual(sample)
  })
})

describe('parseProject validation', () => {
  it('rejects non-JSON and foreign files', () => {
    expect(parseProject('not json').ok).toBe(false)
    expect(parseProject('{"foo": 1}').ok).toBe(false)
    expect(parseProject('[1,2]').ok).toBe(false)
  })

  it('rejects a project with a broken panel or piece', () => {
    const noPanel = parseProject(JSON.stringify({ app: 'cortapro', version: 1, pieces: [] }))
    expect(noPanel.ok).toBe(false)

    const badPiece = parseProject(
      JSON.stringify({
        app: 'cortapro',
        version: 1,
        panel: { width: 100, height: 100 },
        pieces: [{ width: -5, height: 10, quantity: 1 }],
      }),
    )
    expect(badPiece.ok).toBe(false)
    if (!badPiece.ok) expect(badPiece.error).toContain('Piece 1')
  })

  it('fills defaults for missing optional fields', () => {
    const parsed = parseProject(
      JSON.stringify({
        app: 'cortapro',
        panel: { width: 100, height: 100 },
        pieces: [{ width: 10, height: 10, quantity: 2 }],
      }),
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const [p] = parsed.project.pieces
    expect(p.id).toBeTruthy()
    expect(p.code).toBe('01')
    expect(p.rotatable).toBe(true)
    expect(parsed.project.kerf).toBe(0)
    expect(parsed.project.packer).toBe('auto')
  })
})
