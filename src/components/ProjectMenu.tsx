import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../state/store.ts'
import { parseProject, serializeProject } from '../core/project.ts'
import { useMsg } from '../i18n/useMsg.ts'
import { downloadTextFile } from '../utils/file.ts'

const buttonClass =
  'rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100'

export default function ProjectMenu() {
  const { t } = useTranslation()
  const { tMsg } = useMsg()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const exportProject = () => {
    const { panel, pieces, kerf, packer } = useAppStore.getState()
    downloadTextFile('cortapro-project.json', serializeProject({ panel, pieces, kerf, packer }))
  }

  const importProject = async (file: File) => {
    const parsed = parseProject(await file.text())
    if (!parsed.ok) {
      setError(tMsg(parsed.error) ?? null)
      return
    }
    setError(null)
    useAppStore.getState().loadProject(parsed.project)
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="button" onClick={exportProject} className={buttonClass}>
        {t('project.export')}
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null)
          fileInput.current?.click()
        }}
        className={buttonClass}
      >
        {t('project.import')}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importProject(file)
          e.target.value = '' // allow re-importing the same file
        }}
      />
    </div>
  )
}
