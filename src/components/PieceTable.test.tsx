// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../i18n/index.ts'
import { useAppStore } from '../state/store.ts'
import { resetStore, testPiece } from '../test/storeUtils.ts'
import PieceTable from './PieceTable.tsx'

const renderTable = (issues = {}) => render(<PieceTable issues={issues} />)

beforeEach(resetStore)

describe('PieceTable', () => {
  it('shows the empty state when there are no pieces', () => {
    renderTable()
    expect(screen.getByText(/No pieces yet/)).toBeInTheDocument()
  })

  it('adds an editable row via "+ Add piece"', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: '+ Add piece' }))
    expect(screen.getByLabelText('Piece code')).toHaveValue('01')
    expect(useAppStore.getState().pieces).toHaveLength(1)
  })

  it('loads the example cut list', async () => {
    const user = userEvent.setup()
    renderTable()
    await user.click(screen.getByRole('button', { name: 'Load example' }))
    expect(screen.getAllByLabelText('Piece code')).toHaveLength(11)
    expect(screen.getByText('11 types · 37 total')).toBeInTheDocument()
  })

  it('clears all pieces', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ pieces: [testPiece()] })
    renderTable()
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText(/No pieces yet/)).toBeInTheDocument()
  })

  it('edits a piece through the row inputs', async () => {
    const user = userEvent.setup()
    const piece = testPiece({ description: '' })
    useAppStore.setState({ pieces: [piece] })
    renderTable()
    await user.type(screen.getByLabelText('Piece description'), 'Shelf')
    await user.click(screen.getByLabelText('Allow 90° rotation'))
    const updated = useAppStore.getState().pieces[0]
    expect(updated.description).toBe('Shelf')
    expect(updated.rotatable).toBe(false)
  })

  it('duplicates and deletes rows', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ pieces: [testPiece({ code: '01' })] })
    renderTable()
    await user.click(screen.getByTitle('Duplicate row'))
    expect(useAppStore.getState().pieces.map((p) => p.code)).toEqual(['01', '02'])
    await user.click(screen.getAllByTitle('Delete row')[0])
    expect(useAppStore.getState().pieces.map((p) => p.code)).toEqual(['02'])
  })

  it('lists validation issues under the table', () => {
    const piece = testPiece({ code: '01', width: 0 })
    useAppStore.setState({ pieces: [piece] })
    renderTable({ [piece.id]: { width: { key: 'validation.pieceWidthPositive' } } })
    expect(screen.getByText('01: Width must be a positive number')).toBeInTheDocument()
    expect(screen.getByLabelText('Piece width in mm')).toHaveAttribute('aria-invalid', 'true')
  })

  it('imports pieces from a CSV file', async () => {
    const { container } = renderTable()
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const csv = 'code,description,width,height,quantity\n01,Divider,580,310,10\n02,Door,619,333,3\n'
    const file = new File([csv], 'pieces.csv', { type: 'text/csv' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() =>
      expect(screen.getByText(/Imported 2 piece types/)).toBeInTheDocument(),
    )
    expect(useAppStore.getState().pieces.map((p) => p.code)).toEqual(['01', '02'])
  })

  it('reports CSV rows that failed to parse', async () => {
    const { container } = renderTable()
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(['01,Bad,0,310,5\n'], 'pieces.csv', { type: 'text/csv' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/invalid size/)).toBeInTheDocument())
    expect(useAppStore.getState().pieces).toEqual([])
  })
})
