import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';

export function CardiovascularMetrics() {
  const { snapshot, activeParams, heartRate, setEdvEsv, setHeartRate } = useSimulationStore();

  const edv = Math.round(activeParams.edv);
  const esv = Math.round(activeParams.esv);
  const efPct = Math.max(0, Math.min(100, snapshot.ejectionFraction));
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - efPct / 100);

  // Instantaneous chamber fill ratio normalized between ESV and EDV
  const fillPct = Math.max(
    0,
    Math.min(100, ((snapshot.lvVolume - snapshot.esv) / Math.max(1, snapshot.edv - snapshot.esv)) * 100)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Stroke Volume &amp; Ejection Fraction Analysis
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Mathematically coupled ventricular volume, systolic ejection, cardiac output, and arterial pressure analysis.
          </p>
        </div>
        <span className="font-mono text-xs text-amber-300/90">
          Simulated Educational Calculations (Not Clinical Measurements)
        </span>
      </div>

      {/* Top KPI Grid (8 core metrics) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Heart Rate', val: Math.round(snapshot.heartRate).toString(), unit: 'BPM', color: 'text-rose-400' },
          { label: 'Stroke Volume', val: snapshot.strokeVolume.toFixed(1), unit: 'mL/beat', color: 'text-cyan-300' },
          { label: 'End-Diastolic Vol (EDV)', val: snapshot.edv.toFixed(1), unit: 'mL', color: 'text-slate-100' },
          { label: 'End-Systolic Vol (ESV)', val: snapshot.esv.toFixed(1), unit: 'mL', color: 'text-slate-100' },
          { label: 'Ejection Fraction', val: snapshot.ejectionFraction.toFixed(2), unit: '%', color: 'text-emerald-400' },
          { label: 'Cardiac Output', val: snapshot.cardiacOutput.toFixed(2), unit: 'L/min', color: 'text-cyan-300' },
          { label: 'Simulated BP', val: `${snapshot.systolicBp}/${snapshot.diastolicBp}`, unit: 'mmHg', color: 'text-slate-100' },
          { label: 'Mean Arterial Pressure', val: snapshot.map.toFixed(1), unit: 'mmHg', color: 'text-amber-300' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
            <div className="text-xs text-slate-400">{kpi.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className={`font-mono text-2xl font-bold ${kpi.color}`}>{kpi.val}</span>
              <span className="font-mono text-xs text-slate-500">{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Gauge, Live Ventricular Filling Indicator & Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Ejection Fraction Circular Gauge */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0B111E] p-6 lg:col-span-4">
          <div className="text-xs font-medium text-slate-400">Simulated Ejection Fraction</div>
          <div className="relative mt-4 flex h-36 w-36 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={efPct < 45 ? '#f43f5e' : '#06b6d4'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 180ms ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold text-white">{efPct.toFixed(1)}%</span>
              <span className="text-[11px] text-slate-400">
                {efPct >= 55 ? 'Normal Range' : efPct >= 40 ? 'Borderline' : 'Reduced'}
              </span>
            </div>
          </div>

          <div className="mt-4 w-full space-y-1 border-t border-slate-800/80 pt-3 font-mono text-[11px] text-slate-400">
            <div>SV = EDV − ESV = {snapshot.edv.toFixed(0)} − {snapshot.esv.toFixed(0)} = {snapshot.strokeVolume.toFixed(1)} mL</div>
            <div>EF = (SV / EDV) × 100 = {snapshot.ejectionFraction.toFixed(2)}%</div>
            <div>CO = (HR × SV) / 1000 = {snapshot.cardiacOutput.toFixed(2)} L/min</div>
          </div>
        </div>

        {/* Live Ventricular Diastole/Systole Volume Indicator */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Left Ventricular Cycle Volume</h3>
            <span className="font-mono text-xs text-cyan-300">{snapshot.cardiacPhaseLabel}</span>
          </div>

          <div className="mt-5 flex items-end gap-5">
            <div className="relative h-44 w-24 overflow-hidden rounded-lg border border-slate-700 bg-[#060A13]">
              {/* Residual ESV floor */}
              <div
                className="absolute inset-x-0 bottom-0 bg-rose-950/80"
                style={{ height: `${Math.min(100, (snapshot.esv / 220) * 100)}%` }}
              />
              {/* Active dynamic ventricular volume */}
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-rose-600/85 to-rose-400/75 transition-all duration-75"
                style={{ height: `${Math.min(100, (snapshot.lvVolume / 220) * 100)}%` }}
              />
              <div className="absolute inset-0 flex flex-col justify-between p-2 font-mono text-[10px] text-slate-300">
                <span>220 mL</span>
                <span>110 mL</span>
                <span>0 mL</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 text-xs">
              <div>
                <div className="text-slate-400">Instantaneous Volume</div>
                <div className="font-mono text-xl font-bold text-white">
                  {snapshot.lvVolume.toFixed(1)} <span className="text-xs font-normal text-slate-400">mL</span>
                </div>
              </div>
              <div>
                <div className="text-slate-400">Instantaneous Pressure</div>
                <div className="font-mono text-xl font-bold text-rose-400">
                  {snapshot.lvPressure.toFixed(1)} <span className="text-xs font-normal text-slate-400">mmHg</span>
                </div>
              </div>
              <div>
                <div className="text-slate-400">Ejection Excursion</div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive EDV / ESV / HR Parameter Controls */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Ventricular Volume Controls</h3>
            <button
              type="button"
              onClick={() => {
                setHeartRate(72);
                setEdvEsv(120, 50);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Restore Baseline (72 / 120 / 50)
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-300">End-Diastolic Volume (EDV)</span>
                <span className="font-mono font-semibold text-cyan-300">{edv} mL</span>
              </div>
              <input
                type="range"
                min={60}
                max={200}
                step={1}
                value={edv}
                onChange={(e) => setEdvEsv(parseInt(e.target.value, 10), esv)}
                className="lab-slider w-full"
              />
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-300">End-Systolic Volume (ESV)</span>
                <span className="font-mono font-semibold text-rose-400">{esv} mL</span>
              </div>
              <input
                type="range"
                min={15}
                max={Math.max(20, edv - 10)}
                step={1}
                value={Math.min(esv, edv - 10)}
                onChange={(e) => setEdvEsv(edv, parseInt(e.target.value, 10))}
                className="lab-slider w-full"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Constrained strictly below EDV (ESV &le; EDV − 10 mL) to maintain physical validity.
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-slate-300">Heart Rate (HR)</span>
                <span className="font-mono font-semibold text-white">{Math.round(heartRate)} BPM</span>
              </div>
              <input
                type="range"
                min={35}
                max={200}
                step={1}
                value={Math.round(heartRate)}
                onChange={(e) => setHeartRate(parseInt(e.target.value, 10))}
                className="lab-slider w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
