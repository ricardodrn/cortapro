import { useAppStore } from './state/store.ts'
import { validateInputs } from './core/inputValidation.ts'
import PanelForm from './components/PanelForm.tsx'
import PieceTable from './components/PieceTable.tsx'
import ResultsPreview from './components/ResultsPreview.tsx'

export default function App() {
  const panel = useAppStore((s) => s.panel)
  const pieces = useAppStore((s) => s.pieces)
  const validation = validateInputs(panel, pieces)

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800">CortaPro</h1>
        <p className="text-xs text-slate-500">Cut list optimizer — dimensions in mm</p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-6">
          <PanelForm issues={validation.panel} />
          <ResultsPreview inputsValid={validation.valid} />
        </div>
        <PieceTable issues={validation.pieces} />
      </div>
    </main>
  )
}
