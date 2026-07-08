// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../i18n/index.ts'
import { useAppStore } from '../state/store.ts'
import { resetStore, testPiece } from '../test/storeUtils.ts'
import ResultsPreview from './ResultsPreview.tsx'

beforeEach(resetStore)

describe('ResultsPreview', () => {
  it('disables the button and hints when there are no pieces', () => {
    render(<ResultsPreview inputsValid={true} />)
    expect(screen.getByRole('button', { name: 'Optimize cuts' })).toBeDisabled()
    expect(screen.getByText('Add at least one piece to optimize.')).toBeInTheDocument()
  })

  it('disables the button and hints when inputs are invalid', () => {
    useAppStore.setState({ pieces: [testPiece()] })
    render(<ResultsPreview inputsValid={false} />)
    expect(screen.getByRole('button', { name: 'Optimize cuts' })).toBeDisabled()
    expect(screen.getByText('Fix the highlighted input errors to optimize.')).toBeInTheDocument()
  })

  it('runs the optimizer and shows a summary', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ pieces: [testPiece({ width: 500, height: 400, quantity: 4 })] })
    render(<ResultsPreview inputsValid={true} />)
    await user.click(screen.getByRole('button', { name: 'Optimize cuts' }))
    expect(await screen.findByText(/1 panel · .* utilization/)).toBeInTheDocument()
    expect(useAppStore.getState().result).not.toBeNull()
  })

  it('warns about unplaced pieces', async () => {
    const user = userEvent.setup()
    // 3000 mm piece cannot fit the 2300 × 1800 panel in any orientation.
    useAppStore.setState({
      pieces: [testPiece({ code: '01' }), testPiece({ code: '99', width: 3000, height: 100 })],
    })
    render(<ResultsPreview inputsValid={true} />)
    await user.click(screen.getByRole('button', { name: 'Optimize cuts' }))
    expect(await screen.findByText('1 piece could not be placed: 99')).toBeInTheDocument()
  })
})
