import React from 'react';
import { Pause, Play, RotateCcw, Radio } from 'lucide-react';
import { SimulationMode, useSimulationStore } from '../store/useSimulationStore';

export function SimulationControls() {
  const {
    isRunning,
    isMonitoring,
    simSpeed,
    mode,
    snapshot,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSimSpeed,
    setMode,
    toggleMonitoring,
    setActiveSection,
  } = useSimulationStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#090E1A] px-4 py-2.5 lg:px-6">
      {/* Playback Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {isRunning ? (
          <button
            type="button"
            onClick={pauseSimulation}
            className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 whitespace-nowrap"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startSimulation}
            className="flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 whitespace-nowrap"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Resume</span>
          </button>
        )}

        <button
          type="button"
          onClick={resetSimulation}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#060A13] px-2 py-1 text-[11px]">
          <span className="text-slate-400 mr-1">Speed</span>
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSimSpeed(s)}
              className={`rounded px-1.5 py-0.5 font-mono transition-colors ${
                Math.abs(simSpeed - s) < 0.05
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#060A13] p-1">
        {(
          [
            { id: 'normal', label: 'Normal Mode' },
            { id: 'exercise', label: 'Exercise Mode' },
            { id: 'disease', label: 'Disease Mode' },
          ] as Array<{ id: SimulationMode; label: string }>
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              if (m.id === 'exercise') setActiveSection('exercise-sim');
              if (m.id === 'disease') setActiveSection('disease-sim');
            }}
            className={`rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              mode === m.id
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Synchronized Telemetry Readout & Monitor Toggle */}
      <div className="flex items-center gap-4 font-mono text-xs">
        {isMonitoring && (
          <div className="hidden items-center gap-3 text-slate-300 xl:flex">
            <span>HR <strong className="text-rose-400">{Math.round(snapshot.heartRate)}</strong> BPM</span>
            <span className="text-slate-600">·</span>
            <span>SV <strong className="text-cyan-300">{snapshot.strokeVolume.toFixed(1)}</strong> mL</span>
            <span className="text-slate-600">·</span>
            <span>EF <strong className="text-emerald-400">{snapshot.ejectionFraction.toFixed(1)}%</strong></span>
            <span className="text-slate-600">·</span>
            <span>CO <strong className="text-white">{snapshot.cardiacOutput.toFixed(2)}</strong> L/min</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleMonitoring}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            isMonitoring
              ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
              : 'border-slate-700 bg-slate-800 text-slate-400'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>{isMonitoring ? 'Telemetry On' : 'Telemetry Off'}</span>
        </button>
      </div>
    </div>
  );
}
