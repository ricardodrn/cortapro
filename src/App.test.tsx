// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import './i18n/index.ts'
import { useAppStore } from './state/store.ts'
import { resetStore } from './test/storeUtils.ts'
import App from './App.tsx'

beforeEach(resetStore)

describe('App', () => {
  it('renders the header and the empty state', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'CortaPro' })).toBeInTheDocument()
    expect(screen.getByText(/No pieces yet/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Optimize cuts' })).toBeDisabled()
  })

  it('runs the full flow: load example → optimize → results', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Load example' }))
    expect(screen.getAllByLabelText('Piece code')).toHaveLength(11)

    await user.click(screen.getByRole('button', { name: 'Optimize cuts' }))
    await waitFor(() => expect(useAppStore.getState().result).not.toBeNull())

    // Stats section and one SVG per panel appear.
    expect(await screen.findByRole('heading', { name: 'Results' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cutting layout' })).toBeInTheDocument()
    const panelCount = useAppStore.getState().result!.stats.panelCount
    expect(panelCount).toBe(2)
    for (let n = 1; n <= panelCount; n++) {
      expect(screen.getByRole('img', { name: `Cutting layout for panel ${n}` })).toBeInTheDocument()
    }
  })

  it('surfaces validation errors and blocks optimization', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '+ Add piece' }))
    // New piece has 0 × 0 dimensions → invalid inputs.
    expect(screen.getByRole('button', { name: 'Optimize cuts' })).toBeDisabled()
    expect(screen.getByText('Fix the highlighted input errors to optimize.')).toBeInTheDocument()
    expect(screen.getByText(/01: Width must be a positive number/)).toBeInTheDocument()
  })
})
