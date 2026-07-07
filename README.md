# CortaPro

Optimizador de cortes para planchas rectangulares. Usa una serie de algoritmos de empaque para minimizar desperdicio de material.

---

# 📖 ESPAÑOL

## Descripción
Minimizar el desperdicio de madera al dimensionar piezas para muebles. El sistema busca el mejor orden para usar lo máximo posible de la plancha y así ahorrar en madera y piezas a comprar.

### Características
- **Optimización multi-panel** - usa la menor cantidad de paneles posibles.
- **Rotación** - las piezas pueden ser cortadas en cualquier posición (configurable por pieza)
- **Grosor de sierra** - Se puede agregar el grosor (en mm) de la sierra para aumentar precisión
- **Visualización** - SVG escalados con colores, etiquetas y zoom interactivo
- **Estadísticas** - Porcentajes de utilización y de merma

### ¿Cómo funciona la optimización?

El programa usa dos estrategias principales para empacar las piezas:

#### 1. **MaxRects** (Mejor para la mayoría de casos)
Imagina que tienes una plancha vacía. El sistema dibuja "rectángulos imaginarios" de los espacios libres. Cada vez que coloca una pieza, actualiza estos rectángulos. Cuando necesita colocar la siguiente pieza, elige el lugar donde mejor encaje según una de estas estrategias:

- **BSSF** (Best Short Side Fit): Busca dejar el hueco más pequeño en un lado. Es como encajar un puzzle donde priorizas no desperdiciar espacio horizontal ni vertical.
- **BAF** (Best Area Fit): Elige el espacio libre más pequeño que quepa la pieza. Es como buscar el "casillero justo" para no desperdiciar.
- **BL** (Bottom-Left): Coloca todo lo más abajo y a la izquierda posible, similar a cómo llenarías una caja.

#### 2. **Guillotine** (Más simple, buenos resultados)
Funciona como si usaras una cuchilla para cortar. Cada corte divide la plancha en dos rectángulos más pequeños. Se repite hasta que todas las piezas quepan. Es rápido y predecible, aunque a veces menos óptimo que MaxRects.

### Por qué esto importa
Sin optimización, desperdicias 20-40% del material. Con CortaPro, logras 85-95% de utilización.

---

# 📖 ENGLISH

## Description
Minimize wood waste when cutting pieces for furniture. The system finds the best arrangement to use the maximum of each panel and save on materials and purchases.

### Features
- **Multi-panel optimization** - uses the fewest panels possible.
- **Rotation** - pieces can be cut in any position (configurable per piece)
- **Kerf (saw thickness)** - add saw blade thickness in mm for accuracy
- **Visualization** - scaled SVG with colors, labels and interactive zoom
- **Statistics** - utilization percentages and waste metrics

### How does the optimization work?

The program uses two main strategies to pack pieces:

#### 1. **MaxRects** (Best for most cases)
Imagine an empty panel. The system tracks "invisible rectangles" of free spaces. Each time it places a piece, it updates these rectangles. When placing the next piece, it chooses the best spot using one of these strategies:

- **BSSF** (Best Short Side Fit): Finds a spot that leaves the smallest gap on one side. Like a puzzle where you prioritize not wasting horizontal or vertical space.
- **BAF** (Best Area Fit): Chooses the smallest free space that fits the piece. Like finding the "right slot" to minimize waste.
- **BL** (Bottom-Left): Places everything as low and left as possible, similar to filling a box from bottom-left.

#### 2. **Guillotine** (Simpler, good results)
Works like using a blade to cut. Each cut divides the panel into two smaller rectangles. Repeats until all pieces fit. It's fast and predictable, though sometimes less optimal than MaxRects.

### Why this matters
Without optimization, you waste 20-40% of material. With CortaPro, you achieve 85-95% utilization.


---

## 🚀 Quick Start / Inicio Rápido

### Prerequisites / Requisitos
- **Node.js** 18+ and **pnpm**
- A modern browser / Un navegador moderno

### Install & Run / Instalar y Ejecutar

```bash
cd cortapro
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
/ Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

For production build / Para build de producción:
```bash
pnpm build
pnpm preview
```

## Project Structure

```
cortapro/
├── src/
│   ├── core/              # Pure logic, fully tested, no React
│   │   ├── types.ts
│   │   ├── optimizer.ts        # Main packing orchestrator
│   │   ├── optimizer.worker.ts # Web Worker entry point
│   │   ├── optimizeAsync.ts    # Promise wrapper, run counter, fallback
│   │   ├── packers/
│   │   │   ├── maxrects.ts     # MaxRects heuristics (BSSF, BAF, BL)
│   │   │   ├── guillotine.ts   # Edge-to-edge guillotine variant
│   │   │   └── packer.ts       # Common interfaces
│   │   ├── inputValidation.ts  # Piece & panel validation
│   │   ├── csv.ts              # CSV parser (auto-delimiter, BOM, quoted fields)
│   │   ├── project.ts          # Save/load project JSON
│   │   ├── reporting.ts        # Aggregate stats & per-panel breakdown
│   │   ├── validate.ts         # Layout sanity checks (no overlap, all placed)
│   │   └── [test files]        # 43 tests across core modules
│   ├── state/
│   │   └── store.ts            # Zustand store with localStorage
│   ├── components/
│   │   ├── PanelForm.tsx       # Stock panel & cutting settings
│   │   ├── PieceTable.tsx      # Editable piece rows + CSV/example buttons
│   │   ├── ProjectMenu.tsx     # Export/import project + error display
│   │   ├── ResultsPreview.tsx  # Optimization headline + unplaced warning
│   │   ├── NumberField.tsx     # Number input with local text state
│   │   ├── results/
│   │   │   └── ResultsStats.tsx # Summary tiles + per-panel + placement tables
│   │   └── viz/
│   │       ├── PanelView.tsx   # Scaled SVG renderer, zoom/pan/tooltips
│   │       └── LayoutResults.tsx # Legend + multi-panel stack
│   ├── utils/
│   │   ├── pieceColors.ts      # CVD-safe categorical palette
│   │   ├── format.ts           # Formatting helpers (mm² → m², percents)
│   │   └── file.ts             # Download helper
│   ├── App.tsx                 # Main layout
│   ├── main.tsx                # Entry point
│   └── index.css               # Print stylesheet + Tailwind imports
├── public/
│   └── favicon.svg             # Stylized cut panel icon
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── tailwind.config.ts
└── vitest.config.ts
```
