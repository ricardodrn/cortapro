// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadTextFile } from './file.ts'

describe('downloadTextFile', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let click: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    click = vi.fn()
    HTMLAnchorElement.prototype.click = click
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a blob URL from the given text and mime type', () => {
    downloadTextFile('cortapro-project.json', '{"a":1}', 'application/json')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
  })

  it('defaults the mime type to application/json', () => {
    downloadTextFile('data.json', '{}')
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
  })

  it('clicks a temporary anchor with the given filename and href', () => {
    downloadTextFile('cortapro-project.json', '{}')
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('revokes the object URL after triggering the download', () => {
    downloadTextFile('cortapro-project.json', '{}')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
