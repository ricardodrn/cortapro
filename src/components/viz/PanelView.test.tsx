// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../../i18n/index.ts'
import type { PanelLayout, PanelSpec, PieceSpec } from '../../core/types.ts'
import PanelView from './PanelView.tsx'

/** jsdom has no layout engine: give every element a stable, non-zero box. */
function stubBoundingClientRect() {
  Element.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 500,
      bottom: 400,
      width: 500,
      height: 400,
      toJSON() {},
    }) as DOMRect
}

function readViewBox(svg: SVGSVGElement) {
  const [x, y, w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number)
  return { x, y, w, h }
}

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
  beforeEach(() => {
    stubBoundingClientRect()
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('zooming all the way back out clamps exactly to the initial viewBox', async () => {
    renderPanel()
    const svg = screen.getByRole('img', { name: 'Cutting layout for panel 1' }) as unknown as SVGSVGElement
    const initial = readViewBox(svg)
    fireEvent.wheel(svg, { deltaY: -3, clientX: 250, clientY: 200 })
    expect(await screen.findByRole('button', { name: 'Reset zoom' })).toBeInTheDocument()
    // Scroll out far enough to hit the upper clamp (w === initial.w).
    for (let i = 0; i < 10; i++) fireEvent.wheel(svg, { deltaY: 3, clientX: 250, clientY: 200 })
    expect(readViewBox(svg)).toEqual(initial)
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
  })

  it('pans the view by dragging once zoomed in', () => {
    const { container } = renderPanel()
    const svg = screen.getByRole('img', { name: 'Cutting layout for panel 1' }) as unknown as SVGSVGElement
    fireEvent.wheel(svg, { deltaY: -3, clientX: 250, clientY: 200 })
    const zoomedVb = readViewBox(svg)

    fireEvent.pointerDown(svg, { button: 0, clientX: 100, clientY: 100, pointerId: 1 })
    expect(svg.setPointerCapture).toHaveBeenCalledWith(1)
    // Hovering a piece while a drag is in flight must not surface a tooltip.
    const pieceRect = container.querySelectorAll('g > rect:nth-of-type(2)')[0]
    fireEvent.pointerMove(pieceRect, { clientX: 100, clientY: 100 })
    expect(screen.queryByText(/^at x /)).not.toBeInTheDocument()

    fireEvent.pointerMove(svg, { clientX: 150, clientY: 140, pointerId: 1 })
    const draggedVb = readViewBox(svg)
    expect(draggedVb.x).not.toBeCloseTo(zoomedVb.x)
    expect(draggedVb.y).not.toBeCloseTo(zoomedVb.y)

    fireEvent.pointerUp(svg, { pointerId: 1 })
    expect(svg.releasePointerCapture).toHaveBeenCalledWith(1)
    // Further movement after pointer-up no longer pans.
    fireEvent.pointerMove(svg, { clientX: 400, clientY: 400, pointerId: 1 })
    expect(readViewBox(svg)).toEqual(draggedVb)
  })

  it('ignores non-primary-button pointer-down and pointer-down while not zoomed', () => {
    renderPanel()
    const svg = screen.getByRole('img', { name: 'Cutting layout for panel 1' }) as unknown as SVGSVGElement
    const before = readViewBox(svg)

    // Not zoomed yet: drag must be a no-op.
    fireEvent.pointerDown(svg, { button: 0, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 200, clientY: 200, pointerId: 1 })
    expect(readViewBox(svg)).toEqual(before)

    fireEvent.wheel(svg, { deltaY: -3, clientX: 250, clientY: 200 })
    // Right-click (button !== 0) must not start a drag even when zoomed.
    const zoomedVb = readViewBox(svg)
    fireEvent.pointerDown(svg, { button: 2, clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 200, clientY: 200, pointerId: 1 })
    expect(readViewBox(svg)).toEqual(zoomedVb)
  })

  it('resets zoom on the browser "beforeprint" event', async () => {
    renderPanel()
    const svg = screen.getByRole('img', { name: 'Cutting layout for panel 1' }) as unknown as SVGSVGElement
    const initial = readViewBox(svg)
    fireEvent.wheel(svg, { deltaY: -3, clientX: 250, clientY: 200 })
    expect(await screen.findByRole('button', { name: 'Reset zoom' })).toBeInTheDocument()

    fireEvent(window, new Event('beforeprint'))
    expect(readViewBox(svg)).toEqual(initial)
    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument()
  })
})
