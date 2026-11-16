import React from 'react';
import { ANATOMY_LIST, ANATOMY_STRUCTURES } from '../data/anatomyData';
import { useSimulationStore } from '../store/useSimulationStore';
import { Heart3DViewer } from './Heart3DViewer';

export function HeartLabView() {
  const { selectedStructure, setSelectedStructure, snapshot } = useSimulationStore();
  const activeInfo = ANATOMY_STRUCTURES[selectedStructure ?? 'left-ventricle'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">3D Heart Anatomy Laboratory</h2>
          <p className="mt-1 text-sm text-slate-400">
            Click any structure directly on the 3D myocardium or select from the anatomical index to inspect chamber geometry, valves, and hemodynamic pressures.
          </p>
        </div>
        <div className="font-mono text-xs text-cyan-300">
          Phase: {snapshot.cardiacPhaseLabel} · {Math.round(snapshot.heartRate)} BPM
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 3D Interactive Heart Viewport */}
        <div className="lg:col-span-8">
          <Heart3DViewer initialShowLabels />
        </div>

        {/* Selected Structure Inspector & Structure Index */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 uppercase">{activeInfo.category.replace('-', ' ')}</span>
              <span
                className={
                  activeInfo.oxygenation === 'oxygenated'
                    ? 'text-rose-400'
                    : activeInfo.oxygenation === 'deoxygenated'
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }
              >
                {activeInfo.oxygenation === 'oxygenated'
                  ? 'Oxygenated Blood'
                  : activeInfo.oxygenation === 'deoxygenated'
                  ? 'Deoxygenated Blood'
                  : 'Fibrous / Muscular Structure'}
              </span>
            </div>

            <h3 className="mt-2 text-lg font-bold text-white">{activeInfo.name}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{activeInfo.description}</p>

            <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
              <div>
                <span className="font-semibold text-slate-200">Hemodynamic Role: </span>
                <span className="text-slate-400">{activeInfo.hemodynamicRole}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Morphology: </span>
                <span className="text-slate-400">{activeInfo.wallThicknessNote}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200">Typical Pressure: </span>
                <span className="font-mono text-cyan-300">{activeInfo.normalPressureMmHg}</span>
              </div>
            </div>
          </div>

          {/* 15-Structure Quick Selector */}
          <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
            <h4 className="mb-2.5 text-xs font-semibold text-slate-200">
              Identifiable Anatomical Structures (15)
            </h4>
            <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto pr-1">
              {ANATOMY_LIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedStructure(item.id)}
                  className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                    activeInfo.id === item.id
                      ? 'bg-cyan-500/15 font-semibold text-cyan-300 ring-1 ring-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="ml-2 shrink-0 font-mono text-[10px] text-slate-500">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
