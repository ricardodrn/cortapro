// import { useTranslation } from 'react-i18next'
import { useAppStore } from '../state/store.ts'
import type { PanelIssues } from '../core/inputValidation.ts'
import type { PackerKind } from '../core/types.ts'
import { useMsg } from '../i18n/useMsg.ts'
import NumberField from './NumberField.tsx'

const PACKER_KINDS: PackerKind[] = ['auto', 'maxrects', 'guillotine']

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
  const { t, tMsg } = useMsg()
  const panel = useAppStore((s) => s.panel)
  const kerf = useAppStore((s) => s.kerf)
  const packer = useAppStore((s) => s.packer)
  const setPanel = useAppStore((s) => s.setPanel)
  const setKerf = useAppStore((s) => s.setKerf)
  const setPacker = useAppStore((s) => s.setPacker)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">{t('panel.stock')}</h2>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('panel.width')}>
          <NumberField
            value={panel.width}
            onCommit={(width) => setPanel({ width })}
            error={tMsg(issues.width)}
            aria-label={t('panel.aria.width')}
          />
        </Field>
        <Field label={t('panel.height')}>
          <NumberField
            value={panel.height}
            onCommit={(height) => setPanel({ height })}
            error={tMsg(issues.height)}
            aria-label={t('panel.aria.height')}
          />
        </Field>
        <Field label={t('panel.material')}>
          <input
            type="text"
            value={panel.material ?? ''}
            placeholder={t('panel.materialPlaceholder')}
            onChange={(e) => setPanel({ material: e.target.value || undefined })}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </Field>
        <Field label={t('panel.thickness')}>
          <NumberField
            value={panel.thickness ?? 0}
            onCommit={(th) => setPanel({ thickness: th > 0 ? th : undefined })}
            zeroAsEmpty
            error={tMsg(issues.thickness)}
            aria-label={t('panel.aria.thickness')}
          />
        </Field>
      </div>

      <h2 className="mt-6 mb-4 text-sm font-semibold text-slate-700">
        {t('panel.cuttingSettings')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('panel.kerf')}>
          <NumberField value={kerf} onCommit={setKerf} aria-label={t('panel.aria.kerf')} />
        </Field>
        <Field label={t('panel.algorithm')}>
          <select
            value={packer}
            onChange={(e) => setPacker(e.target.value as PackerKind)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {PACKER_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`packer.${kind}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  )
}
