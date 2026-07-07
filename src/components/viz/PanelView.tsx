import { useEffect, useRef, useState } from 'react'
import type { PanelLayout, PanelSpec, PieceSpec, Placement } from '../../core/types.ts'
import { FALLBACK_COLOR } from '../../utils/pieceColors.ts'

interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

interface TooltipState {
  left: number
  top: number
  placement: Placement
}

const MAX_ZOOM = 12
const ZOOM_STEP = 1.18

/** Piece label, sized in panel units (mm). Hidden when it wouldn't fit. */
function PieceLabel({ p }: { p: Placement }) {
  const fitWidth = (text: string, factor: number) => (p.width * 0.85) / (text.length * factor)
  const codeSize = Math.min(p.height * 0.55, fitWidth(p.code, 0.62), 64)
  if (codeSize < 24) return null

  const dims = `${p.width} × ${p.height}${p.rotated ? ' ⟳' : ''}`
  const dimSize = Math.min(p.height * 0.28, fitWidth(dims, 0.58), 40)
  const showDims = dimSize >= 20 && p.height > codeSize * 1.1 + dimSize * 1.6

  const cx = p.x + p.width / 2
  const cy = p.y + p.height / 2
  return (
    <g pointerEvents="none" fill="#1e293b" textAnchor="middle" fontFamily="system-ui, sans-serif">
      <text
        x={cx}
        y={showDims ? cy - dimSize * 0.55 : cy}
        fontSize={codeSize}
        fontWeight={600}
        dominantBaseline="central"
      >
        {p.code}
      </text>
      {showDims && (
        <text x={cx} y={cy + dimSize * 1.1} fontSize={dimSize} dominantBaseline="central">
          {dims}
        </text>
      )}
    </g>
  )
}

interface PanelViewProps {
  panel: PanelSpec
  layout: PanelLayout
  index: number
  colors: Map<string, string>
  pieceById: Map<string, PieceSpec>
}

export default function PanelView({ panel, layout, index, colors, pieceById }: PanelViewProps) {
  const margin = Math.max(panel.width, panel.height) * 0.015
  const initial: ViewBox = {
    x: -margin,
    y: -margin,
    w: panel.width + margin * 2,
    h: panel.height + margin * 2,
  }

  const [vb, setVb] = useState<ViewBox>(initial)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  // Wheel zoom needs a non-passive listener to preventDefault page scroll.
  // (The parent keys this component by panel size, so `initial` is stable
  // for the lifetime of an instance.)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      const fx = (e.clientX - rect.left) / rect.width
      const fy = (e.clientY - rect.top) / rect.height
      setVb((cur) => {
        const factor = e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP
        const w = Math.min(Math.max(cur.w * factor, initial.w / MAX_ZOOM), initial.w)
        if (w === initial.w) return initial
        const h = w * (initial.h / initial.w)
        return {
          x: cur.x + fx * (cur.w - w),
          y: cur.y + fy * (cur.h - h),
          w,
          h,
        }
      })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    // A zoomed panel would print cropped; snap back to the full view.
    const onBeforePrint = () => setVb(initial)
    window.addEventListener('beforeprint', onBeforePrint)
    return () => {
      svg.removeEventListener('wheel', onWheel)
      window.removeEventListener('beforeprint', onBeforePrint)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const zoomed = vb.w < initial.w - 0.5 || vb.x !== initial.x || vb.y !== initial.y

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 || !zoomed) return
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setTooltip(null)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.x) / rect.width) * vb.w
    const dy = ((e.clientY - drag.current.y) / rect.height) * vb.h
    drag.current = { x: e.clientX, y: e.clientY }
    setVb((cur) => ({ ...cur, x: cur.x - dx, y: cur.y - dy }))
  }

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const showTooltip = (e: React.PointerEvent, placement: Placement) => {
    if (drag.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({
      left: e.clientX - rect.left + 14,
      top: e.clientY - rect.top + 14,
      placement,
    })
  }

  const hatchId = `waste-hatch-${index}`
  const tooltipPiece = tooltip ? pieceById.get(tooltip.placement.pieceId) : undefined

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
      <div className="mb-3 flex items-center justify-between text-sm">
        <h3 className="font-semibold text-slate-700">
          Panel {index + 1}
          <span className="ml-2 font-normal text-slate-400">
            {panel.width} × {panel.height} mm · {layout.placements.length} pieces ·{' '}
            {(layout.utilization * 100).toFixed(1)}% used
          </span>
        </h3>
        {zoomed && (
          <button
            type="button"
            onClick={() => setVb(initial)}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 print:hidden"
          >
            Reset zoom
          </button>
        )}
      </div>

      <div ref={containerRef} className="relative">
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          style={{ aspectRatio: `${initial.w} / ${initial.h}` }}
          className={`w-full touch-none select-none ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setTooltip(null)}
          role="img"
          aria-label={`Cutting layout for panel ${index + 1}`}
        >
          <defs>
            <pattern
              id={hatchId}
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="60" height="60" fill="#eef1f5" />
              <line x1="0" y1="0" x2="0" y2="60" stroke="#d9dfe7" strokeWidth="16" />
            </pattern>
          </defs>

          {/* Waste: anything not covered by a piece shows the hatch. */}
          <rect
            x={0}
            y={0}
            width={panel.width}
            height={panel.height}
            fill={`url(#${hatchId})`}
            stroke="#94a3b8"
            strokeWidth={4}
          />

          {layout.placements.map((p, i) => {
            const color = colors.get(p.pieceId) ?? FALLBACK_COLOR
            return (
              <g key={i}>
                {/* Opaque underlay so the waste hatch never shows through the tint. */}
                <rect x={p.x} y={p.y} width={p.width} height={p.height} fill="#ffffff" />
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  fill={color}
                  fillOpacity={0.22}
                  stroke={color}
                  strokeWidth={3}
                  onPointerMove={(e) => showTooltip(e, p)}
                  onPointerLeave={() => setTooltip(null)}
                />
                <PieceLabel p={p} />
              </g>
            )
          })}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-64 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: tooltip.left, top: tooltip.top }}
          >
            <p className="font-semibold">
              {tooltip.placement.code}
              {tooltipPiece?.description && (
                <span className="ml-1 font-normal text-slate-300">
                  {tooltipPiece.description}
                </span>
              )}
            </p>
            <p className="mt-1 text-slate-300">
              {tooltip.placement.width} × {tooltip.placement.height} mm
              {tooltip.placement.rotated && ' (rotated 90°)'}
            </p>
            <p className="text-slate-400">
              at x {tooltip.placement.x}, y {tooltip.placement.y}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
