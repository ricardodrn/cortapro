// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../../i18n/index.ts'
import type { PanelLayout, PanelSpec, PieceSpec } from '../../core/types.ts'
import PanelView from './PanelView.tsx'

const panel: PanelSpec = { width: 1000, height: 800 }

const pieces: PieceSpec[] = [
  { id: 'a', code: '01', description: 'Shelf', width: 600, height: 400, quantity: 1, rotatable: true },
  { id: 'b', code: '02', description: '', width: 400, height: 400, quantity: 1, rotatable: true },
]

const layout: PanelLayout = {
  placements: [
    { pieceId: 'a', code: '01', x: 0, y: 0, width: 600, height: 400, rotated: false },
    { pieceId: 'b', code: '02', x: 600, y: 0, width: 400, height: 400, rotated: true },
  ],
  freeRects: [{ x: 0, y: 400, width: 1000, height: 400 }],
  usedArea: 400_000,
  utilization: 0.5,
}

function renderPanel() {
  return render(
    <PanelView
      panel={panel}
      layout={layout}
      index={0}
      colors={new Map([['a', '#2a78d6'], ['b', '#1baf7a']])}
      pieceById={new Map(pieces.map((p) => [p.id, p]))}
    />,
  )
}

describe('PanelView', () => {
  it('renders the heading with size, piece count and utilization', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: /Panel 1/ })).toBeInTheDocument()
    expect(screen.getByText(/1000 × 800 mm · 2 pieces · 50.0% used/)).toBeInTheDocument()
  })

  it('draws each placement with its code label', () => {
    renderPanel()
    const svg = screen.getByRole('img', { name: 'Cutting layout for panel 1' })
    expect(svg).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    // Rotated piece is marked in its dimension label.
    expect(screen.getByText('400 × 400 ⟳')).toBeInTheDocument()
  })

  it('shows a tooltip with piece details on hover', () => {
    const { container } = renderPanel()
    // Rects per piece group: opaque underlay then the tinted hover target.
    const pieceRects = container.querySelectorAll('g > rect:nth-of-type(2)')
    fireEvent.pointerMove(pieceRects[0], { clientX: 10, clientY: 10 })
    expect(screen.getByText('Shelf')).toBeInTheDocument()
    expect(screen.getByText('600 × 400 mm')).toBeInTheDocument()
    expect(screen.getByText('at x 0, y 0')).toBeInTheDocument()
    fireEvent.pointerLeave(pieceRects[0])
    expect(screen.queryByText('at x 0, y 0')).not.toBeInTheDocument()
  })

  it('offers reset zoom only after zooming in', async () => {
    const user = userEvent.setup()
    renderPanel()
    const svg = screen.getByRole('img', { name: 'Cutting layout for panel 1' })
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
    fireEvent.wheel(svg, { deltaY: -3, clientX: 0, clientY: 0 })
    const reset = await screen.findByRole('button', { name: 'Reset zoom' })
    await user.click(reset)
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
  })
})
