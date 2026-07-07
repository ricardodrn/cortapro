import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../state/store.ts'
import type { PieceIssues } from '../core/inputValidation.ts'
import type { PieceSpec } from '../core/types.ts'
import { parsePiecesCsv } from '../core/csv.ts'
import { useMsg } from '../i18n/useMsg.ts'
import NumberField from './NumberField.tsx'

const textInputClass =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100'

function PieceRow({ piece, issues }: { piece: PieceSpec; issues: PieceIssues }) {
  const { t, tMsg } = useMsg()
  const updatePiece = useAppStore((s) => s.updatePiece)
  const removePiece = useAppStore((s) => s.removePiece)
  const duplicatePiece = useAppStore((s) => s.duplicatePiece)

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="w-20 px-1.5 py-1.5">
        <input
          type="text"
          value={piece.code}
          aria-label={t('pieces.aria.code')}
          aria-invalid={issues.code ? true : undefined}
          title={tMsg(issues.code)}
          onChange={(e) => updatePiece(piece.id, { code: e.target.value })}
          className={
            issues.code
              ? textInputClass.replace(
                  'border-slate-300',
                  'border-red-400 focus:ring-red-200',
                )
              : textInputClass
          }
        />
      </td>
      <td className="min-w-36 px-1.5 py-1.5">
        <input
          type="text"
          value={piece.description}
          aria-label={t('pieces.aria.description')}
          placeholder={t('pieces.placeholder.description')}
          onChange={(e) => updatePiece(piece.id, { description: e.target.value })}
          className={textInputClass}
        />
      </td>
      <td className="w-24 px-1.5 py-1.5">
        <NumberField
          value={piece.width}
          onCommit={(width) => updatePiece(piece.id, { width })}
          error={tMsg(issues.width ?? issues.fit)}
          aria-label={t('pieces.aria.width')}
        />
      </td>
      <td className="w-24 px-1.5 py-1.5">
        <NumberField
          value={piece.height}
          onCommit={(height) => updatePiece(piece.id, { height })}
          error={tMsg(issues.height ?? issues.fit)}
          aria-label={t('pieces.aria.height')}
        />
      </td>
      <td className="w-20 px-1.5 py-1.5">
        <NumberField
          value={piece.quantity}
          onCommit={(quantity) => updatePiece(piece.id, { quantity })}
          integer
          error={tMsg(issues.quantity)}
          aria-label={t('pieces.aria.quantity')}
        />
      </td>
      <td className="w-16 px-1.5 py-1.5 text-center">
        <input
          type="checkbox"
          checked={piece.rotatable}
          aria-label={t('pieces.aria.rotatable')}
          onChange={(e) => updatePiece(piece.id, { rotatable: e.target.checked })}
          className="size-4 accent-sky-600"
        />
      </td>
      <td className="w-20 px-1.5 py-1.5">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => duplicatePiece(piece.id)}
            title={t('pieces.action.duplicate')}
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            ⧉
          </button>
          <button
            type="button"
            onClick={() => removePiece(piece.id)}
            title={t('pieces.action.delete')}
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function PieceTable({ issues }: { issues: Record<string, PieceIssues> }) {
  const { t } = useTranslation()
  const pieces = useAppStore((s) => s.pieces)
  const addPiece = useAppStore((s) => s.addPiece)
  const addPieces = useAppStore((s) => s.addPieces)
  const clearPieces = useAppStore((s) => s.clearPieces)
  const loadExample = useAppStore((s) => s.loadExample)

  const csvInput = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{ ok: boolean; text: string } | null>(null)

  const importCsv = async (file: File) => {
    const { pieces: imported, errors } = parsePiecesCsv(await file.text())
    if (imported.length > 0) addPieces(imported)
    const parts = []
    if (imported.length > 0) parts.push(t('pieces.imported', { count: imported.length }))
    if (errors.length > 0) {
      parts.push(errors.slice(0, 3).map((e) => t(e.key, e.values)).join(' · '))
    }
    if (errors.length > 3) parts.push(t('pieces.moreErrors', { count: errors.length - 3 }))
    setImportStatus({
      ok: errors.length === 0 && imported.length > 0,
      text: parts.join(' — ') || t('pieces.noPiecesInFile'),
    })
  }

  const errorMessages = pieces.flatMap((p) => {
    const rowIssues = issues[p.id]
    if (!rowIssues) return []
    const code = p.code.trim() || t('pieces.noCode')
    return Object.values(rowIssues).map((m) => `${code}: ${t(m.key, m.values)}`)
  })

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">
          {t('pieces.title')}
          <span className="ml-2 font-normal text-slate-400">
            {t('pieces.typeCount', { count: pieces.length })} ·{' '}
            {t('pieces.total', { count: pieces.reduce((sum, p) => sum + p.quantity, 0) })}
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => csvInput.current?.click()}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {t('pieces.importCsv')}
          </button>
          <input
            ref={csvInput}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importCsv(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={loadExample}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {t('pieces.loadExample')}
          </button>
          <button
            type="button"
            onClick={clearPieces}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {t('pieces.clearAll')}
          </button>
          <button
            type="button"
            onClick={addPiece}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700"
          >
            {t('pieces.addPiece')}
          </button>
        </div>
      </div>

      {importStatus && (
        <p
          className={`mb-3 rounded-md px-3 py-2 text-xs ${
            importStatus.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {importStatus.text}
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="ml-2 font-medium underline"
          >
            {t('pieces.dismiss')}
          </button>
        </p>
      )}

      {pieces.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
          {t('pieces.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                <th className="px-1.5 pb-2">{t('pieces.col.code')}</th>
                <th className="px-1.5 pb-2">{t('pieces.col.description')}</th>
                <th className="px-1.5 pb-2">{t('pieces.col.width')}</th>
                <th className="px-1.5 pb-2">{t('pieces.col.height')}</th>
                <th className="px-1.5 pb-2">{t('pieces.col.qty')}</th>
                <th className="px-1.5 pb-2 text-center">{t('pieces.col.rotate')}</th>
                <th className="px-1.5 pb-2" />
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece) => (
                <PieceRow key={piece.id} piece={piece} issues={issues[piece.id] ?? {}} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errorMessages.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-md bg-red-50 px-4 py-3 text-xs text-red-700">
          {errorMessages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
