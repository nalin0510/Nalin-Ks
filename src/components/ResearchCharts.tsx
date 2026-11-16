import React, { useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';
import { Camera, Download, GitCompare, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { computeExerciseTargetResponse, generatePvLoopData } from '../simulation/cardioModel';
import { useSimulationStore } from '../store/useSimulationStore';

export function ResearchCharts() {
  const {
    history,
    activeParams,
    baseParams,
    recordingPaused,
    toggleRecordingPaused,
    clearHistory,
    comparisonRunA,
    captureComparisonRunA,
    clearComparisonRunA,
  } = useSimulationStore();

  const [timeWindowSec, setTimeWindowSec] = useState<number>(60);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleHistory = useMemo(() => {
    if (history.length === 0) return [];
    const maxT = history[history.length - 1].timeSec;
    return history.filter((pt) => maxT - pt.timeSec <= timeWindowSec);
  }, [history, timeWindowSec]);

  // Merge Run A comparison overlay aligned by relative index
  const mergedComparisonData = useMemo(() => {
    return visibleHistory.map((pt, idx) => {
      const runAPt = comparisonRunA?.samples[idx];
      return {
        ...pt,
        runA_hr: runAPt?.heartRate,
        runA_co: runAPt?.cardiacOutput,
        runA_sv: runAPt?.strokeVolume,
      };
    });
  }, [visibleHistory, comparisonRunA]);

  // P-V Loop for current active parameters
  const pvLoopData = useMemo(() => generatePvLoopData(activeParams), [activeParams]);

  // Exercise Speed (0-20 km/h) vs Heart Rate theoretical curve for current baseParams
  const exerciseCurveData = useMemo(() => {
    const pts = [];
    for (let s = 0; s <= 20; s += 2) {
      const resp = computeExerciseTargetResponse(baseParams, s);
      pts.push({
        speedKmh: s,
        heartRate: Number(resp.targetHr.toFixed(1)),
      });
    }
    return pts;
  }, [baseParams]);

  const exportCsv = () => {
    if (history.length === 0) return;
    const headers = [
      'time_sec',
      'heart_rate_bpm',
      'stroke_volume_ml',
      'cardiac_output_l_min',
      'ejection_fraction_pct',
      'systolic_bp_mmhg',
      'diastolic_bp_mmhg',
      'map_mmhg',
      'lv_pressure_mmhg',
      'lv_volume_ml',
      'aortic_pressure_mmhg',
      'exercise_speed_kmh',
    ];
    const rows = history.map((r) =>
      [
        r.timeSec,
        r.heartRate,
        r.strokeVolume,
        r.cardiacOutput,
        r.ejectionFraction,
        r.systolicBp,
        r.diastolicBp,
        r.map,
        r.lvPressure,
        r.lvVolume,
        r.aorticPressure,
        r.exerciseSpeedKmh,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardio-twin-telemetry-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFirstSvgAsPng = () => {
    const root = chartContainerRef.current;
    if (!root) return;
    const svg = root.querySelector('svg.recharts-surface');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2 || 1200;
      canvas.height = img.height * 2 || 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#060A13';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `cardio-analytics-chart-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const tooltipStyle = {
    backgroundColor: '#0B111E',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div ref={chartContainerRef} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Research Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">
            Synchronized multi-channel physiological time-series, pressure-volume loops, and run-to-run simulation comparison.
          </p>
        </div>
        <span className="font-mono text-xs text-slate-400">
          {visibleHistory.length} samples buffered · Units: BPM, mL, L/min, mmHg
        </span>
      </div>

      {/* Analytics Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0B111E] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleRecordingPaused}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              recordingPaused
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-cyan-500/40'
            }`}
          >
            {recordingPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{recordingPaused ? 'Resume Collection' : 'Pause Collection'}</span>
          </button>

          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Graphs</span>
          </button>

          <button
            type="button"
            onClick={captureComparisonRunA}
            className="flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/25 whitespace-nowrap"
          >
            <GitCompare className="h-3.5 w-3.5" />
            <span>Snapshot Run A</span>
          </button>

          {comparisonRunA && (
            <button
              type="button"
              onClick={clearComparisonRunA}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-rose-300 hover:border-rose-500/50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Run A ({comparisonRunA.label})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-[#070B14] p-1">
            {[15, 30, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setTimeWindowSec(sec)}
                className={`rounded px-2.5 py-1 font-mono text-xs ${
                  timeWindowSec === sec ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={exportFirstSvgAsPng}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 whitespace-nowrap"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Heart Rate & Cardiac Output vs Time */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Heart Rate (BPM) &amp; Cardiac Output (L/min) vs. Time</span>
            <span className="font-mono text-slate-400">Dual Axis</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedComparisonData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="timeSec" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}s`} />
                <YAxis yAxisId="hr" stroke="#fb7185" fontSize={11} domain={[30, 210]} />
                <YAxis yAxisId="co" orientation="right" stroke="#22d3ee" fontSize={11} domain={[2, 22]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="hr" type="monotone" dataKey="heartRate" name="HR (BPM)" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="co" type="monotone" dataKey="cardiacOutput" name="CO (L/min)" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
                {comparisonRunA && (
                  <Line yAxisId="hr" type="monotone" dataKey="runA_hr" name="Run A HR" stroke="#fb7185" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Stroke Volume & Ejection Fraction vs Time */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Stroke Volume (mL) &amp; Ejection Fraction (%) vs. Time</span>
            <span className="font-mono text-slate-400">Ventricular Output</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedComparisonData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="timeSec" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}s`} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[20, 130]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="strokeVolume" name="Stroke Vol (mL)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="ejectionFraction" name="Ejection Frac (%)" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
                {comparisonRunA && (
                  <Line type="monotone" dataKey="runA_sv" name="Run A SV" stroke="#38bdf8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Simulated Blood Pressure (SBP / DBP / MAP) vs Time */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Simulated Arterial Blood Pressure (mmHg) vs. Time</span>
            <span className="font-mono text-slate-400">Windkessel Model</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibleHistory}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="timeSec" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}s`} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[40, 200]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="systolicBp" name="Systolic (mmHg)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="map" name="MAP (mmHg)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={1.8} isAnimationActive={false} />
                <Area type="monotone" dataKey="diastolicBp" name="Diastolic (mmHg)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Ventricular Pressure & Volume vs Time */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Instantaneous LV Pressure (mmHg) &amp; LV Volume (mL)</span>
            <span className="font-mono text-slate-400">Cycle Samples</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleHistory}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="timeSec" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}s`} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 200]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="lvPressure" name="P_LV (mmHg)" stroke="#fb7185" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="aorticPressure" name="P_Ao (mmHg)" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="lvVolume" name="V_LV (mL)" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Left Ventricular Pressure-Volume (P-V) Loop */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Left Ventricular Pressure-Volume (P-V) Loop</span>
            <span className="font-mono text-slate-400">P(t) = E(t)·(V(t) − V0)</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="volume" name="Volume" unit=" mL" stroke="#64748b" fontSize={11} domain={[20, 180]} />
                <YAxis type="number" dataKey="pressure" name="Pressure" unit=" mmHg" stroke="#64748b" fontSize={11} domain={[0, 200]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
                <Scatter name="P-V Trajectory" data={pvLoopData} fill="#22d3ee" line={{ stroke: '#22d3ee', strokeWidth: 2 }} shape="circle" isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Exercise Speed vs Heart Rate Model Curve */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-100">Exercise Intensity (km/h) vs. Target Heart Rate (BPM)</span>
            <span className="font-mono text-slate-400">Age Category: {baseParams.ageCategory}</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseCurveData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="speedKmh" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v} km/h`} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[50, 200]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="heartRate" name="Model HR (BPM)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3, fill: '#22d3ee' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Documented Model Assumptions */}
      <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-4 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">Simulation Assumptions: </span>
        0D lumped-parameter Windkessel approximation (C_art = {activeParams.cArt.toFixed(2)} mL/mmHg, R_sys = {activeParams.rSys.toFixed(2)} mmHg·s/mL, E_max = {activeParams.eMax.toFixed(2)} mmHg/mL). Neglects spatial pulse-wave reflections, thoracic respiratory coupling, and autonomic baroreceptor delay loops. Outputs are generated mathematically for educational research demonstration, never fabricated patient telemetry.
      </div>
    </div>
  );
}
