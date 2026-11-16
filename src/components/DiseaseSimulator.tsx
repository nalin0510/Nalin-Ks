import React from 'react';
import { ANATOMY_STRUCTURES } from '../data/anatomyData';
import { DISEASE_LIST, DISEASE_SCENARIOS } from '../data/diseaseData';
import { computeSteadyStateHemodynamics } from '../simulation/cardioModel';
import { useSimulationStore } from '../store/useSimulationStore';
import { Heart3DViewer } from './Heart3DViewer';

export function DiseaseSimulator() {
  const { activeDiseaseId, selectDiseaseScenario, snapshot } = useSimulationStore();
  const scenario = DISEASE_SCENARIOS[activeDiseaseId];
  const normalBaseline = DISEASE_SCENARIOS.normal;

  const baselineSnap = computeSteadyStateHemodynamics(
    normalBaseline.overrides.heartRate,
    {
      ageCategory: 'adult',
      restingHeartRate: normalBaseline.overrides.heartRate,
      edv: normalBaseline.overrides.edv,
      esv: normalBaseline.overrides.esv,
      eMax: normalBaseline.overrides.eMax,
      rSys: normalBaseline.overrides.rSys,
      cArt: normalBaseline.overrides.cArt,
      aorticValveR: normalBaseline.overrides.aorticValveR,
      mitralRegurgFraction: normalBaseline.overrides.mitralRegurgFraction,
      coronaryPerfusionFactor: normalBaseline.overrides.coronaryPerfusionFactor,
    },
    0.2,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Cardiovascular Disease Simulation</h2>
          <p className="mt-1 text-sm text-slate-400">
            Educational scenarios illustrating how valvular, vascular, contractile, and electrical perturbations alter simulated hemodynamics.
          </p>
        </div>
        <span className="font-mono text-xs text-amber-300/90">
          Educational Model Only · Does Not Diagnose or Predict Patient Risk
        </span>
      </div>

      {/* Scenario Selector Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {DISEASE_LIST.map((item) => {
          const active = item.id === activeDiseaseId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectDiseaseScenario(item.id)}
              className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                active
                  ? 'border-rose-500/70 bg-rose-500/15 text-rose-200'
                  : 'border-slate-800 bg-[#0B111E] text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="truncate font-semibold">{item.shortLabel}</div>
              <div className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                HR {item.overrides.heartRate} · EF {(((item.overrides.edv - item.overrides.esv) / item.overrides.edv) * 100).toFixed(0)}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive 3D Anatomical Highlight + Physiological Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Heart3DViewer compact />
          <div className="mt-3 rounded-lg border border-slate-800 bg-[#0B111E] p-3 text-xs">
            <span className="text-slate-400">Affected Anatomical Region: </span>
            <span className="font-medium text-rose-300">{scenario.affectedRegionLabel}</span>
            {scenario.affectedStructures.length > 0 && (
              <div className="mt-1.5 text-[11px] text-slate-400">
                Highlighted in 3D:{' '}
                {scenario.affectedStructures.map((id) => ANATOMY_STRUCTURES[id].name).join(' · ')}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-7">
          <div>
            <div className="text-xs font-mono text-rose-400">Active Scenario</div>
            <h3 className="mt-1 text-xl font-bold text-white">{scenario.name}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{scenario.summary}</p>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-4">
            <div className="text-xs font-semibold text-cyan-300">Physiological Mechanism</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{scenario.physiologicalMechanism}</p>
          </div>

          {/* Before vs After Baseline Comparison Table */}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-slate-200">
              Before (Normal Baseline) vs. Active Scenario Comparison
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#070B14] text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Parameter</th>
                    <th className="px-3 py-2">Normal Baseline</th>
                    <th className="px-3 py-2">Active ({scenario.shortLabel})</th>
                    <th className="px-3 py-2">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {[
                    {
                      label: 'Heart Rate (BPM)',
                      base: baselineSnap.heartRate,
                      curr: snapshot.heartRate,
                      dec: 0,
                    },
                    {
                      label: 'Forward Stroke Vol (mL)',
                      base: baselineSnap.strokeVolume,
                      curr: snapshot.strokeVolume,
                      dec: 1,
                    },
                    {
                      label: 'Ejection Fraction (%)',
                      base: baselineSnap.ejectionFraction,
                      curr: snapshot.ejectionFraction,
                      dec: 1,
                    },
                    {
                      label: 'Cardiac Output (L/min)',
                      base: baselineSnap.cardiacOutput,
                      curr: snapshot.cardiacOutput,
                      dec: 2,
                    },
                    {
                      label: 'Systolic BP (mmHg)',
                      base: baselineSnap.systolicBp,
                      curr: snapshot.systolicBp,
                      dec: 0,
                    },
                    {
                      label: 'Diastolic BP (mmHg)',
                      base: baselineSnap.diastolicBp,
                      curr: snapshot.diastolicBp,
                      dec: 0,
                    },
                  ].map((row) => {
                    const diff = row.curr - row.base;
                    const diffStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(row.dec)}`;
                    return (
                      <tr key={row.label} className="text-slate-200">
                        <td className="px-3 py-2 font-sans text-slate-300">{row.label}</td>
                        <td className="px-3 py-2 text-slate-400">{row.base.toFixed(row.dec)}</td>
                        <td className="px-3 py-2 font-semibold text-white">{row.curr.toFixed(row.dec)}</td>
                        <td
                          className={`px-3 py-2 ${
                            Math.abs(diff) < 0.05
                              ? 'text-slate-500'
                              : diff > 0
                              ? 'text-cyan-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {diffStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical Effects vs Illustrative Animations */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-3.5">
              <div className="text-xs font-semibold text-cyan-300">Implemented Mathematical Effects</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {scenario.mathEffects.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-3.5">
              <div className="text-xs font-semibold text-rose-300">Illustrative Visual &amp; ECG Notes</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {scenario.illustrativeEffects.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
                <li>• ECG: {scenario.ecgNote}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
