import { useAppStore } from '../state/store.ts'
import type { PanelIssues } from '../core/inputValidation.ts'
import type { PackerKind } from '../core/types.ts'
import NumberField from './NumberField.tsx'

const PACKER_LABELS: Record<PackerKind, string> = {
  auto: 'Auto (best result)',
  maxrects: 'MaxRects (max utilization)',
  guillotine: 'Guillotine (edge-to-edge cuts)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

export default function PanelForm({ issues }: { issues: PanelIssues }) {
  const panel = useAppStore((s) => s.panel)
  const kerf = useAppStore((s) => s.kerf)
  const packer = useAppStore((s) => s.packer)
  const setPanel = useAppStore((s) => s.setPanel)
  const setKerf = useAppStore((s) => s.setKerf)
  const setPacker = useAppStore((s) => s.setPacker)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Stock panel</h2>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Width (mm)">
          <NumberField
            value={panel.width}
            onCommit={(width) => setPanel({ width })}
            error={issues.width}
            aria-label="Panel width in mm"
          />
        </Field>
        <Field label="Height (mm)">
          <NumberField
            value={panel.height}
            onCommit={(height) => setPanel({ height })}
            error={issues.height}
            aria-label="Panel height in mm"
          />
        </Field>
        <Field label="Material">
          <input
            type="text"
            value={panel.material ?? ''}
            placeholder="MDF, plywood…"
            onChange={(e) => setPanel({ material: e.target.value || undefined })}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </Field>
        <Field label="Thickness (mm, optional)">
          <NumberField
            value={panel.thickness ?? 0}
            onCommit={(t) => setPanel({ thickness: t > 0 ? t : undefined })}
            zeroAsEmpty
            error={issues.thickness}
            aria-label="Panel thickness in mm"
          />
        </Field>
      </div>

      <h2 className="mt-6 mb-4 text-sm font-semibold text-slate-700">Cutting settings</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kerf / blade (mm)">
          <NumberField value={kerf} onCommit={setKerf} aria-label="Saw kerf in mm" />
        </Field>
        <Field label="Algorithm">
          <select
            value={packer}
            onChange={(e) => setPacker(e.target.value as PackerKind)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {(Object.keys(PACKER_LABELS) as PackerKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {PACKER_LABELS[kind]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  )
}
