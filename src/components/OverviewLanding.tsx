import React from 'react';
import { ArrowRight, Activity, HeartPulse, PersonStanding, BarChart3 } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import { HeroEcgStrip } from './ECGMonitor';
import { Heart3DViewer } from './Heart3DViewer';

export function OverviewLanding() {
  const { setActiveSection, snapshot, startSimulation, setMode } = useSimulationStore();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-[#070B14] scientific-grid-bg">
        <div className="grid grid-cols-1 items-stretch gap-6 p-6 lg:grid-cols-12 lg:p-10">
          {/* Left Narrative & CTAs */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-6">
            <div>
              <div className="text-xs font-mono tracking-wide text-cyan-400">
                Cardiovascular Computational Research Prototype
              </div>
              <h1
                className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                DIGITAL TWIN OF THE HUMAN HEART
              </h1>
              <p className="mt-3 text-base font-medium text-cyan-300">
                Explore. Simulate. Analyze. Understand.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                An advanced interactive platform for exploring human cardiovascular anatomy, physiology, exercise response, and hemodynamic behavior through 3D visualization and computational simulation.
              </p>

              {/* Four Action Buttons */}
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    startSimulation();
                    setMode('normal');
                    setActiveSection('analysis');
                  }}
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 whitespace-nowrap"
                >
                  <Activity className="h-4 w-4" />
                  <span>Launch Simulation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('heart-lab')}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B111E] px-4 py-2.5 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-500/60 hover:text-cyan-300 whitespace-nowrap"
                >
                  <HeartPulse className="h-4 w-4 text-rose-400" />
                  <span>Explore Anatomy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('exercise-sim')}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B111E] px-4 py-2.5 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-500/60 hover:text-cyan-300 whitespace-nowrap"
                >
                  <PersonStanding className="h-4 w-4 text-cyan-400" />
                  <span>Exercise Laboratory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('analytics')}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B111E] px-4 py-2.5 text-xs font-semibold text-slate-100 transition-colors hover:border-cyan-500/60 hover:text-cyan-300 whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  <span>Research Dashboard</span>
                </button>
              </div>
            </div>

            {/* Live Cardiovascular Metrics Strip */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-5 sm:grid-cols-4">
              <div>
                <div className="text-[11px] text-slate-400">Heart Rate</div>
                <div className="mt-1 font-mono text-xl font-bold text-rose-400">
                  {Math.round(snapshot.heartRate)} <span className="text-[11px] font-normal text-slate-500">BPM</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Stroke Volume</div>
                <div className="mt-1 font-mono text-xl font-bold text-cyan-300">
                  {snapshot.strokeVolume.toFixed(1)} <span className="text-[11px] font-normal text-slate-500">mL</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Ejection Fraction</div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
                  {snapshot.ejectionFraction.toFixed(1)} <span className="text-[11px] font-normal text-slate-500">%</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Cardiac Output</div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  {snapshot.cardiacOutput.toFixed(2)} <span className="text-[11px] font-normal text-slate-500">L/min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Centerpiece 3D Rotating Anatomical Heart */}
          <div className="lg:col-span-6">
            <Heart3DViewer heroMode />
          </div>
        </div>

        {/* Continuous Animated ECG Waveform Across Bottom of Hero */}
        <div className="border-t border-slate-800/90 bg-[#050810]/90 px-4 pt-2 pb-1">
          <div className="mb-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Synchronized Lead II ECG Synthesis · Cycle Phase: {snapshot.cardiacPhaseLabel}</span>
            <span>Simulated BP: {snapshot.systolicBp}/{snapshot.diastolicBp} mmHg (MAP {snapshot.map.toFixed(0)} mmHg)</span>
          </div>
          <HeroEcgStrip />
        </div>
      </section>

      {/* Capabilities & Scientific Foundations */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
          <div className="font-mono text-xs text-cyan-400">01. Anatomical Precision</div>
          <h3 className="mt-1.5 text-base font-bold text-white">15-Part Interactive 3D Heart</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Inspect all four chambers, great vessels, coronary arteries, interventricular septum, and articulated valves with transparent, isolated, and exploded dissection modes.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
          <div className="font-mono text-xs text-rose-400">02. Hemodynamic Coupling</div>
          <h3 className="mt-1.5 text-base font-bold text-white">Time-Varying Elastance &amp; Windkessel</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Computes P_LV(t) = E(t)·(V(t) − V0) and arterial compliance Q = C·dP/dt with strict SV, EF, and CO mathematical consistency across rest, exercise, and 10 disease scenarios.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5">
          <div className="font-mono text-xs text-emerald-400">03. Research &amp; Education</div>
          <h3 className="mt-1.5 text-base font-bold text-white">Synchronized Labs &amp; Analytics</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Compare simulation runs on Pressure-Volume loops, trace a red blood cell through dual circulation, export CSV/PNG data, and query the biomedical AI tutor.
          </p>
        </div>
      </section>
    </div>
  );
}
