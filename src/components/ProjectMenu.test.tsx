// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../i18n/index.ts'
import { useAppStore } from '../state/store.ts'
import { resetStore, testPiece } from '../test/storeUtils.ts'
import { downloadTextFile } from '../utils/file.ts'
import ProjectMenu from './ProjectMenu.tsx'

vi.mock('../utils/file.ts', () => ({ downloadTextFile: vi.fn() }))

const projectJson = (overrides: Partial<Record<string, unknown>> = {}) =>
  JSON.stringify({
    app: 'cortapro',
    version: 1,
    panel: { width: 1220, height: 2440, material: 'Plywood' },
    pieces: [
      { id: 'x', code: '07', description: 'Shelf', width: 300, height: 200, quantity: 2, rotatable: true },
    ],
    kerf: 3,
    packer: 'guillotine',
    ...overrides,
  })

beforeEach(() => {
  resetStore()
  vi.mocked(downloadTextFile).mockClear()
})

describe('ProjectMenu', () => {
  it('exports the current session as a JSON download', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      panel: { width: 2300, height: 1800, material: 'MDF' },
      pieces: [testPiece({ code: '01' })],
      kerf: 2,
      packer: 'maxrects',
    })
    render(<ProjectMenu />)
    await user.click(screen.getByRole('button', { name: 'Export project' }))

    expect(downloadTextFile).toHaveBeenCalledTimes(1)
    const [filename, text] = vi.mocked(downloadTextFile).mock.calls[0]
    expect(filename).toBe('cortapro-project.json')
    const parsed = JSON.parse(text)
    expect(parsed).toMatchObject({
      app: 'cortapro',
      panel: { width: 2300, height: 1800, material: 'MDF' },
      kerf: 2,
      packer: 'maxrects',
    })
    expect(parsed.pieces).toHaveLength(1)
  })

  it('imports a valid project file and replaces the session', async () => {
    const { container } = render(<ProjectMenu />)
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File([projectJson()], 'project.json', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => expect(useAppStore.getState().panel.material).toBe('Plywood'))
    expect(useAppStore.getState().pieces).toHaveLength(1)
    expect(useAppStore.getState().kerf).toBe(3)
    expect(useAppStore.getState().packer).toBe('guillotine')
  })

  it('shows an error and keeps the session unchanged for an invalid file', async () => {
    useAppStore.setState({ pieces: [testPiece({ code: '01' })] })
    const { container } = render(<ProjectMenu />)
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(['not json'], 'project.json', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText('Not a valid JSON file')).toBeInTheDocument()
    expect(useAppStore.getState().pieces).toHaveLength(1)
  })

  it('clears a previous error once a valid file is imported', async () => {
    const { container } = render(<ProjectMenu />)
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!

    fireEvent.change(fileInput, {
      target: { files: [new File(['not json'], 'bad.json', { type: 'application/json' })] },
    })
    expect(await screen.findByText('Not a valid JSON file')).toBeInTheDocument()

    fireEvent.change(fileInput, {
      target: { files: [new File([projectJson()], 'project.json', { type: 'application/json' })] },
    })
    await waitFor(() => expect(useAppStore.getState().kerf).toBe(3))
    expect(screen.queryByText('Not a valid JSON file')).not.toBeInTheDocument()
  })
})
