import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Info } from 'lucide-react';
import { synthesizeEcgSampleMv } from '../simulation/cardioModel';
import { useSimulationStore } from '../store/useSimulationStore';
import { EcgRhythmType } from '../types/cardio';

const RHYTHM_INFO: Record<
  EcgRhythmType,
  { label: string; summary: string; limitations: string }
> = {
  'normal-sinus': {
    label: 'Normal Sinus Rhythm',
    summary: 'SA node pacemaker initiates regular P waves followed 1:1 by narrow QRS complexes and upright T waves.',
    limitations: 'Representative single-lead (Lead II-like) educational synthesis; not a 12-lead clinical ECG.',
  },
  'sinus-tachycardia': {
    label: 'Sinus Tachycardia',
    summary: 'Elevated sinoatrial firing rate (>100 BPM) compressing the diastolic T-to-P interval while preserving P-QRS-T sequence.',
    limitations: 'Does not model rate-related aberrant conduction or ischemia unless selected separately.',
  },
  'sinus-bradycardia': {
    label: 'Sinus Bradycardia',
    summary: 'Slow sinoatrial automaticity (<60 BPM) with prolonged isoelectric TP segments between beats.',
    limitations: 'Educational rhythm illustration; excludes junctional escape or high-grade AV blocks.',
  },
  'atrial-fibrillation': {
    label: 'Atrial Fibrillation',
    summary: 'Disorganized atrial depolarization removes distinct P waves, creating chaotic f-wave baseline undulation and irregularly irregular R-R intervals.',
    limitations: 'Simplified stochastic R-R modulation for educational visualization, not patient telemetry.',
  },
  'pvc-bigeminy': {
    label: 'PVC Bigeminy (Rhythm Abnormality)',
    summary: 'Alternating normal sinus beats and Premature Ventricular Contractions featuring wide, bizarre QRS morphology without preceding P waves.',
    limitations: 'Illustrative ectopic ventricular waveform; hemodynamic beat-by-beat drop is approximated.',
  },
  'ischemic-st': {
    label: 'Ischemic ST-Segment Depression',
    summary: 'Representative ST-segment depression and T-wave inversion reflecting altered ventricular repolarization gradients.',
    limitations: 'Educational pattern only; cannot localize myocardial territories or diagnose ischemia.',
  },
};

const WAVE_COMPONENTS = [
  {
    name: 'P Wave',
    window: '~80–100 ms',
    meaning: 'Atrial depolarization initiated by the sinoatrial (SA) node spreading across right and left atria.',
  },
  {
    name: 'QRS Complex',
    window: '~60–100 ms',
    meaning: 'Rapid ventricular depolarization via the His-Purkinje network, triggering ventricular systole.',
  },
  {
    name: 'T Wave',
    window: '~160 ms',
    meaning: 'Ventricular myocardial repolarization resetting membrane potentials prior to the next beat.',
  },
];

export function HeroEcgStrip() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const buffer = new Array<number>(360).fill(0);
    let lastTime = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const sim = useSimulationStore.getState();
      if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth || 800;
        canvas.height = canvas.clientHeight || 88;
      }

      const w = canvas.width;
      const h = canvas.height;

      const sample = synthesizeEcgSampleMv(sim.cyclePhase, sim.ecgRhythm, sim.simTimeSec, sim.beatCount);
      if (sim.isRunning && !sim.reducedMotion) {
        buffer.push(sample);
        if (buffer.length > 360) buffer.shift();
      } else if (sim.reducedMotion) {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = synthesizeEcgSampleMv((i / 120) % 1, sim.ecgRhythm, i * 0.01, Math.floor(i / 120));
        }
      }

      ctx.clearRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.09)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Waveform
      const midY = h * 0.62;
      const amp = h * 0.38;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      grad.addColorStop(0.75, 'rgba(34, 211, 238, 0.85)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 1)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < buffer.length; i++) {
        const px = (i / (buffer.length - 1)) * w;
        const py = midY - buffer[i] * amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Leading phosphor dot
      const lastY = midY - buffer[buffer.length - 1] * amp;
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(w - 2, lastY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      void dt;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="h-[84px] w-full" />;
}

export function ECGMonitor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { heartRate, ecgRhythm, setEcgRhythm, reducedMotion } = useSimulationStore();
  const [localPaused, setLocalPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedWave, setSelectedWave] = useState<string>('QRS Complex');

  const localStateRef = useRef({ localPaused, playbackSpeed, reducedMotion });
  useEffect(() => {
    localStateRef.current = { localPaused, playbackSpeed, reducedMotion };
  }, [localPaused, playbackSpeed, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const POINTS = 420;
    const trace = new Array<number>(POINTS).fill(0);
    let sweepX = 0;
    let raf = 0;
    let lastTime = performance.now();

    const render = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth || 720;
        canvas.height = canvas.clientHeight || 280;
      }

      const w = canvas.width;
      const h = canvas.height;
      const sim = useSimulationStore.getState();
      const ls = localStateRef.current;

      if (!ls.localPaused && sim.isRunning) {
        const steps = Math.max(1, Math.round(ls.playbackSpeed * 2));
        for (let s = 0; s < steps; s++) {
          const sample = synthesizeEcgSampleMv(sim.cyclePhase, sim.ecgRhythm, sim.simTimeSec, sim.beatCount);
          trace[sweepX] = sample;
          sweepX = (sweepX + 1) % POINTS;
        }
      }

      // Draw ECG Grid Background (1mm minor, 5mm major)
      ctx.fillStyle = '#060A13';
      ctx.fillRect(0, 0, w, h);

      const minorStep = 14;
      ctx.strokeStyle = 'rgba(14, 116, 144, 0.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += minorStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += minorStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const majorStep = minorStep * 5;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
      for (let x = 0; x < w; x += majorStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += majorStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Isoelectric baseline
      const midY = h * 0.62;
      const amp = h * 0.36;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Draw Oscilloscope Trace with Erase Gap Ahead of Sweep Cursor
      const gap = 14;
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < POINTS; i++) {
        const distAhead = (i - sweepX + POINTS) % POINTS;
        if (distAhead < gap) {
          started = false;
          continue;
        }
        const x = (i / (POINTS - 1)) * w;
        const y = midY - trace[i] * amp;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Sweep Beam Dot
      const cursorX = (sweepX / (POINTS - 1)) * w;
      const cursorY = midY - trace[(sweepX - 1 + POINTS) % POINTS] * amp;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 4, 0, Math.PI * 2);
      ctx.fill();

      void dt;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const info = RHYTHM_INFO[ecgRhythm];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Real-Time ECG Synthesis Monitor</h2>
          <p className="mt-1 text-sm text-slate-400">
            Synchronized Lead II-style educational waveform generator calibrated to the active simulation heart rate and rhythm state.
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-slate-300">
          <span>Rate: <strong className="text-rose-400">{Math.round(heartRate)} BPM</strong></span>
          <span className="text-slate-600">/</span>
          <span>R-R: <strong className="text-cyan-300">{Math.round(60000 / Math.max(30, heartRate))} ms</strong></span>
          <span className="text-slate-600">/</span>
          <span>Sweep: 25 mm/s ({playbackSpeed.toFixed(1)}x)</span>
        </div>
      </div>

      {/* Main Oscilloscope Viewport */}
      <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono font-semibold text-cyan-300">SYNTHETIC LEAD II</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">{info.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLocalPaused((p) => !p)}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50"
            >
              {localPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span>{localPaused ? 'Resume Trace' : 'Pause Trace'}</span>
            </button>

            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#070B14] px-2.5 py-1">
              <span className="text-[11px] text-slate-400">Speed</span>
              {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
                    playbackSpeed === spd ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-800">
          <canvas ref={canvasRef} className="h-[260px] w-full sm:h-[300px]" />
        </div>

        {/* Rhythm Pattern Selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(RHYTHM_INFO) as EcgRhythmType[]).map((rKey) => (
            <button
              key={rKey}
              type="button"
              onClick={() => setEcgRhythm(rKey)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                ecgRhythm === rKey
                  ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-800 bg-[#070B14] text-slate-300 hover:border-slate-700'
              }`}
            >
              {RHYTHM_INFO[rKey].label}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform Morphology Explanation & Assumptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-7">
          <h3 className="text-sm font-semibold text-slate-100">ECG Waveform Morphology Guide</h3>
          <div className="mt-3 flex gap-2">
            {WAVE_COMPONENTS.map((wc) => (
              <button
                key={wc.name}
                type="button"
                onClick={() => setSelectedWave(wc.name)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedWave === wc.name
                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                {wc.name}
              </button>
            ))}
          </div>
          {WAVE_COMPONENTS.filter((wc) => wc.name === selectedWave).map((wc) => (
            <div key={wc.name} className="mt-4 rounded-lg border border-slate-800/80 bg-[#070B14] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{wc.name}</span>
                <span className="font-mono text-xs text-cyan-300">Typical Duration: {wc.window}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{wc.meaning}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Info className="h-4 w-4 text-cyan-400" />
            <span>Pattern Assumptions &amp; Limitations</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">{info.summary}</p>
          <p className="mt-3 border-t border-slate-800/80 pt-3 text-xs leading-relaxed text-amber-300/90">
            {info.limitations}
          </p>
        </div>
      </div>
    </div>
  );
}
