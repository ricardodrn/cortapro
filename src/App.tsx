import { useAppStore } from './state/store.ts'
import { validateInputs } from './core/inputValidation.ts'
import PanelForm from './components/PanelForm.tsx'
import PieceTable from './components/PieceTable.tsx'
import ResultsPreview from './components/ResultsPreview.tsx'
import LayoutResults from './components/viz/LayoutResults.tsx'
import ResultsStats from './components/results/ResultsStats.tsx'
import ProjectMenu from './components/ProjectMenu.tsx'

export default function App() {
  const panel = useAppStore((s) => s.panel)
  const pieces = useAppStore((s) => s.pieces)
  const validation = validateInputs(panel, pieces)

  return (
    <main className="min-h-screen bg-slate-100 print:bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-6 py-4 print:border-0 print:px-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">CortaPro</h1>
          <p className="text-xs text-slate-500">Cut list optimizer — dimensions in mm</p>
        </div>
        <div className="print:hidden">
          <ProjectMenu />
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 p-6 print:max-w-none print:space-y-4 print:p-0 print:pt-4">
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr] print:hidden">
          <div className="space-y-6">
            <PanelForm issues={validation.panel} />
            <ResultsPreview inputsValid={validation.valid} />
          </div>
          <PieceTable issues={validation.pieces} />
        </div>
        <ResultsStats />
        <LayoutResults />
      </div>
    </main>
  )
}
