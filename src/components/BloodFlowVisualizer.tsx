import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Compass } from 'lucide-react';
import { RBC_JOURNEY_STAGES } from '../data/educationData';
import { useSimulationStore } from '../store/useSimulationStore';

interface Particle {
  t: number; // 0..1 around complete double-loop circuit
  offset: number;
  isTracked?: boolean;
}

interface Waypoint {
  x: number;
  y: number;
  oxygenated: boolean;
  label: string;
}

// Normalized coordinates (0..1) tracing:
// Body -> Vena Cava -> RA -> Tricuspid -> RV -> Pulmonary Artery -> Lungs -> Pulmonary Veins -> LA -> Mitral -> LV -> Aorta -> Body
const CIRCUIT_WAYPOINTS: Waypoint[] = [
  { x: 0.14, y: 0.80, oxygenated: false, label: 'Systemic Capillaries (Body)' },
  { x: 0.25, y: 0.65, oxygenated: false, label: 'Inferior / Superior Vena Cava' },
  { x: 0.36, y: 0.42, oxygenated: false, label: 'Right Atrium' },
  { x: 0.38, y: 0.57, oxygenated: false, label: 'Right Ventricle' },
  { x: 0.42, y: 0.32, oxygenated: false, label: 'Pulmonary Artery' },
  { x: 0.50, y: 0.14, oxygenated: false, label: 'Pulmonary Capillaries (Lungs)' },
  { x: 0.60, y: 0.28, oxygenated: true, label: 'Pulmonary Veins' },
  { x: 0.63, y: 0.42, oxygenated: true, label: 'Left Atrium' },
  { x: 0.61, y: 0.58, oxygenated: true, label: 'Left Ventricle' },
  { x: 0.54, y: 0.28, oxygenated: true, label: 'Ascending Aorta' },
  { x: 0.82, y: 0.45, oxygenated: true, label: 'Systemic Arterial Tree' },
  { x: 0.84, y: 0.82, oxygenated: true, label: 'Peripheral Tissues (O2 Delivery)' },
];

function sampleCircuit(t: number, w: number, h: number) {
  const n = CIRCUIT_WAYPOINTS.length;
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * n;
  const idx0 = Math.floor(scaled) % n;
  const idx1 = (idx0 + 1) % n;
  const frac = scaled - Math.floor(scaled);
  const p0 = CIRCUIT_WAYPOINTS[idx0];
  const p1 = CIRCUIT_WAYPOINTS[idx1];

  const x = (p0.x + (p1.x - p0.x) * frac) * w;
  const y = (p0.y + (p1.y - p0.y) * frac) * h;
  return {
    x,
    y,
    oxygenated: p0.oxygenated,
    stageIndex: idx0,
    label: p0.label,
  };
}

export function BloodFlowVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { snapshot, reducedMotion } = useSimulationStore();

  const [running, setRunning] = useState(true);
  const [speedMult, setSpeedMult] = useState(1.0);
  const [highlightMode, setHighlightMode] = useState<'both' | 'oxygenated' | 'deoxygenated'>('both');
  const [followCell, setFollowCell] = useState(false);
  const [trackedStageIdx, setTrackedStageIdx] = useState(0);

  const particlesRef = useRef<Particle[]>([]);
  if (particlesRef.current.length === 0) {
    for (let i = 0; i < 90; i++) {
      particlesRef.current.push({
        t: i / 90,
        offset: ((i % 5) - 2) * 3.5,
        isTracked: i === 0,
      });
    }
  }

  const ctrlRef = useRef({ running, speedMult, highlightMode, followCell, reducedMotion });
  useEffect(() => {
    ctrlRef.current = { running, speedMult, highlightMode, followCell, reducedMotion };
  }, [running, speedMult, highlightMode, followCell, reducedMotion]);

  const handleReset = () => {
    particlesRef.current.forEach((p, idx) => {
      p.t = idx / particlesRef.current.length;
    });
    setTrackedStageIdx(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let lastTime = performance.now();
    let lastStageIdx = -1;

    const render = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth || 760;
        canvas.height = canvas.clientHeight || 420;
      }

      const w = canvas.width;
      const h = canvas.height;
      const sim = useSimulationStore.getState();
      const ctrl = ctrlRef.current;

      // Velocity scales with Cardiac Output (L/min)
      const coFactor = Math.max(0.35, sim.snapshot.cardiacOutput / 5.04);
      const stepT = ctrl.running && !ctrl.reducedMotion ? dt * 0.085 * coFactor * ctrl.speedMult : 0;

      ctx.fillStyle = '#060A13';
      ctx.fillRect(0, 0, w, h);

      // Subtle scientific coordinate grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Vessel Loop Path Segments
      for (let i = 0; i < CIRCUIT_WAYPOINTS.length; i++) {
        const p0 = CIRCUIT_WAYPOINTS[i];
        const p1 = CIRCUIT_WAYPOINTS[(i + 1) % CIRCUIT_WAYPOINTS.length];
        ctx.strokeStyle = p0.oxygenated ? 'rgba(244, 63, 94, 0.25)' : 'rgba(59, 130, 246, 0.25)';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x * w, p0.y * h);
        ctx.lineTo(p1.x * w, p1.y * h);
        ctx.stroke();
      }

      // Draw Organ Stations (Lungs, Heart Chambers, Body)
      const drawStation = (nx: number, ny: number, title: string, sub: string, border: string) => {
        const cx = nx * w;
        const cy = ny * h;
        ctx.fillStyle = '#0B111E';
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx - 56, cy - 22, 112, 44, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, cx, cy - 2);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText(sub, cx, cy + 13);
      };

      drawStation(0.50, 0.14, 'LUNGS', 'O2 Gas Exchange', '#22d3ee');
      drawStation(0.37, 0.49, 'RIGHT HEART', 'RA -> TV -> RV', '#3b82f6');
      drawStation(0.62, 0.49, 'LEFT HEART', 'LA -> MV -> LV', '#f43f5e');
      drawStation(0.50, 0.84, 'SYSTEMIC BODY', 'O2 Delivery', '#94a3b8');

      // Synchronized Valve Open/Close Indicators
      const avOpen = sim.cyclePhase >= 0.50 || sim.cyclePhase < 0.12;
      const semilunarOpen = sim.cyclePhase >= 0.14 && sim.cyclePhase <= 0.42;

      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = avOpen ? '#34d399' : '#fb7185';
      ctx.fillText(`AV Valves: ${avOpen ? 'OPEN' : 'CLOSED'}`, 0.50 * w, 0.56 * h);
      ctx.fillStyle = semilunarOpen ? '#34d399' : '#fb7185';
      ctx.fillText(`Semilunar: ${semilunarOpen ? 'OPEN' : 'CLOSED'}`, 0.50 * w, 0.34 * h);

      // Update & Draw Red (Oxygenated) and Blue (Deoxygenated) Blood Particles
      particlesRef.current.forEach((p) => {
        p.t = (p.t + stepT) % 1;
        const pos = sampleCircuit(p.t, w, h);

        if (p.isTracked && pos.stageIndex !== lastStageIdx) {
          lastStageIdx = pos.stageIndex;
          setTrackedStageIdx(pos.stageIndex);
        }

        const dimmed =
          (ctrl.highlightMode === 'oxygenated' && !pos.oxygenated) ||
          (ctrl.highlightMode === 'deoxygenated' && pos.oxygenated);

        const color = pos.oxygenated
          ? dimmed
            ? 'rgba(244, 63, 94, 0.15)'
            : '#f43f5e'
          : dimmed
          ? 'rgba(59, 130, 246, 0.15)'
          : '#3b82f6';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x + p.offset, pos.y + p.offset * 0.6, p.isTracked && ctrl.followCell ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();

        if (p.isTracked && ctrl.followCell) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x + p.offset, pos.y + p.offset * 0.6, 13, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const currentRbcStage = RBC_JOURNEY_STAGES[trackedStageIdx % RBC_JOURNEY_STAGES.length];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Interactive Blood Circulation Simulator</h2>
          <p className="mt-1 text-sm text-slate-400">
            Dual-circuit pulmonary and systemic blood transport with synchronized cardiac valve timing and red/blue oxygenation states.
          </p>
        </div>
        <div className="font-mono text-xs text-slate-400">
          Flow Velocity Proportional to CO ({snapshot.cardiacOutput.toFixed(2)} L/min) · Educational Flow Model (Not CFD)
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0B111E] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{running ? 'Pause Circulation' : 'Start Circulation'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setFollowCell((f) => !f)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              followCell
                ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-500/40'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Follow a Blood Cell</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#070B14] p-1">
            {(['both', 'oxygenated', 'deoxygenated'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setHighlightMode(mode)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  highlightMode === mode
                    ? mode === 'oxygenated'
                      ? 'bg-rose-500/20 text-rose-300'
                      : mode === 'deoxygenated'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'both' ? 'All Blood' : mode === 'oxygenated' ? 'Oxygenated (Red)' : 'Deoxygenated (Blue)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Speed</span>
            <input
              type="range"
              min={0.3}
              max={2.5}
              step={0.1}
              value={speedMult}
              onChange={(e) => setSpeedMult(parseFloat(e.target.value))}
              className="lab-slider w-20"
            />
            <span className="w-8 font-mono text-cyan-300">{speedMult.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Circuit Canvas + Live Cell Tracker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#060A13] lg:col-span-8">
          <canvas ref={canvasRef} className="h-[400px] w-full" />
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-4">
          <div>
            <div className="text-xs font-semibold text-cyan-300">
              {followCell ? 'Active Red Blood Cell Telemetry' : 'Double-Circuit Pathway'}
            </div>
            <h3 className="mt-2 text-lg font-bold text-white">{currentRbcStage.title}</h3>
            <div className="mt-1 font-mono text-xs text-slate-400">
              {currentRbcStage.oxygenation === 'oxygenated' ? 'Oxygenated (O2-rich)' : 'Deoxygenated (CO2-rich)'} ·{' '}
              {currentRbcStage.pressureNote}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">{currentRbcStage.description}</p>
          </div>

          <div className="mt-6 space-y-2 border-t border-slate-800/80 pt-4 text-xs">
            <div className="font-semibold text-slate-200">Complete Circulation Sequence</div>
            <p className="leading-relaxed text-slate-400">
              <span className="text-blue-400">Body → Vena Cava → Right Atrium → Right Ventricle → Pulmonary Artery → Lungs</span>
              {' → '}
              <span className="text-rose-400">Pulmonary Veins → Left Atrium → Left Ventricle → Aorta → Body</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
