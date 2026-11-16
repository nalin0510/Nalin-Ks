import React, { useState } from 'react';
import { Save, Trash2, Check } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { AgeCategory } from '../types/cardio';

export function SettingsPanel() {
  const {
    baseParams,
    updateBaseParams,
    setAgeCategory,
    reducedMotion,
    setReducedMotion,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  } = useSimulationStore();

  const [presetName, setPresetName] = useState('');

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800/80 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Digital Twin Personalization &amp; Mathematical Settings
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Adjust hypothetical lumped-parameter cardiovascular constants, manage local configuration snapshots, and review mathematical architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Hypothetical Parameter Configuration */}
        <div className="space-y-5 rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Hypothetical Model Parameters</h3>
            <span className="font-mono text-[11px] text-amber-300/90">
              Educational Inputs Only · Not Clinical Risk Scoring
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { id: 'young-adult', label: 'Young Adult (18–29)' },
                { id: 'adult', label: 'Adult (30–44)' },
                { id: 'middle-aged', label: 'Middle-Aged (45–64)' },
                { id: 'older-adult', label: 'Older Adult (65+)' },
              ] as Array<{ id: AgeCategory; label: string }>
            ).map((age) => (
              <button
                key={age.id}
                type="button"
                onClick={() => setAgeCategory(age.id)}
                className={`rounded-md border px-2.5 py-2 text-xs font-medium transition-colors ${
                  baseParams.ageCategory === age.id
                    ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-[#070B14] text-slate-300 hover:border-slate-700'
                }`}
              >
                {age.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">Resting Heart Rate</span>
                <span className="font-mono text-cyan-300">{baseParams.restingHeartRate} BPM</span>
              </div>
              <input
                type="range"
                min={40}
                max={130}
                step={1}
                value={baseParams.restingHeartRate}
                onChange={(e) => updateBaseParams({ restingHeartRate: parseInt(e.target.value, 10) })}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">Peak Ventricular Elastance (E_max)</span>
                <span className="font-mono text-cyan-300">{baseParams.eMax.toFixed(2)} mmHg/mL</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={4.0}
                step={0.05}
                value={baseParams.eMax}
                onChange={(e) => updateBaseParams({ eMax: parseFloat(e.target.value) })}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">Systemic Vascular Resistance (R_sys)</span>
                <span className="font-mono text-cyan-300">{baseParams.rSys.toFixed(2)} mmHg·s/mL</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.2}
                step={0.05}
                value={baseParams.rSys}
                onChange={(e) => updateBaseParams({ rSys: parseFloat(e.target.value) })}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">Arterial Compliance (C_art)</span>
                <span className="font-mono text-cyan-300">{baseParams.cArt.toFixed(2)} mL/mmHg</span>
              </div>
              <input
                type="range"
                min={0.6}
                max={2.6}
                step={0.05}
                value={baseParams.cArt}
                onChange={(e) => updateBaseParams({ cArt: parseFloat(e.target.value) })}
                className="lab-slider w-full"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <label className="flex cursor-pointer items-center justify-between text-xs text-slate-300">
              <span>Reduced-Motion Accessibility Mode (Pauses idle rotations &amp; particle travel)</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="accent-cyan-400"
              />
            </label>
          </div>
        </div>

        {/* Local Preset Management */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-5">
          <h3 className="text-sm font-semibold text-slate-100">Save &amp; Compare Local Configurations</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              savePreset(presetName);
              setPresetName('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset label (e.g. Endurance Athlete)"
              className="flex-1 rounded-md border border-slate-700 bg-[#070B14] px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          </form>

          <div className="max-h-60 space-y-2 overflow-y-auto">
            {presets.length === 0 ? (
              <p className="text-xs text-slate-500">
                No local presets saved yet. Save the current simulation parameters to compare configurations later.
              </p>
            ) : (
              presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#070B14] p-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-100">{p.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                      HR {Math.round(p.summary.heartRate)} · SV {p.summary.strokeVolume.toFixed(0)} mL · EF{' '}
                      {p.summary.ejectionFraction.toFixed(1)}% · CO {p.summary.cardiacOutput.toFixed(2)} L/min
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => loadPreset(p.id)}
                      className="rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-500/25"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePreset(p.id)}
                      className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-rose-300 hover:border-rose-500/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mathematical Model Architecture & Python FastAPI Backend Status */}
      <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
        <h3 className="text-sm font-semibold text-slate-100">
          Lumped-Parameter Mathematical Engine &amp; Python FastAPI Scaffold
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-lg border border-slate-800 bg-[#070B14] p-3.5">
            <div className="font-mono text-cyan-300">P_ventricle(t) = E(t) · (V(t) − V0)</div>
            <p className="mt-1.5 text-slate-400">
              Double-Hill time-varying elastance governing systolic pressure generation and diastolic relaxation.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#070B14] p-3.5">
            <div className="font-mono text-cyan-300">Q = ΔP / R &amp; Q = C · dP/dt</div>
            <p className="mt-1.5 text-slate-400">
              Unidirectional valve resistances paired with 2-element Windkessel systemic arterial compliance.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#070B14] p-3.5">
            <div className="font-mono text-amber-300">Runtime Engine Status</div>
            <p className="mt-1.5 text-slate-400">
              Active in browser: TypeScript ODE demonstration engine. External Python FastAPI + NumPy/SciPy scaffold is documented in <code className="text-slate-200">backend/main.py</code> (not deployed in this Node.js runtime).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
