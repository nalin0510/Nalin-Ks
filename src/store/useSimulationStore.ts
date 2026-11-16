import { create } from 'zustand';
import { DISEASE_SCENARIOS } from '../data/diseaseData';
import {
  classifyExerciseMode,
  computeExerciseTargetResponse,
  computeSteadyStateHemodynamics,
} from '../simulation/cardioModel';
import {
  AgeCategory,
  AnatomyStructureId,
  DiseaseScenarioId,
  EcgRhythmType,
  ExerciseMode,
  HemodynamicSnapshot,
  ModelParameters,
  NavSectionId,
  SimulationPreset,
  TimeSeriesSample,
} from '../types/cardio';

export type SimulationMode = 'normal' | 'exercise' | 'disease';

const DEFAULT_BASE_PARAMS: ModelParameters = {
  ageCategory: 'adult',
  restingHeartRate: 72,
  edv: 120,
  esv: 50,
  eMax: 2.3,
  rSys: 1.05,
  cArt: 1.45,
  aorticValveR: 0.015,
  mitralRegurgFraction: 0,
  coronaryPerfusionFactor: 1.0,
};

const PRESETS_STORAGE_KEY = 'heart_digital_twin_presets_v1';

function loadSavedPresets(): SimulationPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPresets(presets: SimulationPreset[]) {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage quota errors
  }
}

interface SimulationStore {
  // Navigation
  activeSection: NavSectionId;
  setActiveSection: (section: NavSectionId) => void;

  // Shared Simulation Clock & Control
  isRunning: boolean;
  isMonitoring: boolean;
  simSpeed: number; // 0.25 .. 3.0
  simTimeSec: number;
  cyclePhase: number; // 0..1
  beatCount: number;
  mode: SimulationMode;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;

  // Physiological State (Dynamic working parameters)
  heartRate: number;
  baseParams: ModelParameters;
  activeParams: ModelParameters;
  snapshot: HemodynamicSnapshot;

  // Exercise Lab State
  exerciseActive: boolean;
  exerciseRecovering: boolean;
  exerciseSpeedKmh: number;
  exerciseElapsedSec: number;
  exerciseDurationTargetSec: number;
  exerciseMode: ExerciseMode;

  // Disease & ECG State
  activeDiseaseId: DiseaseScenarioId;
  ecgRhythm: EcgRhythmType;

  // 3D Heart Inspection State
  selectedStructure: AnatomyStructureId | null;
  setSelectedStructure: (id: AnatomyStructureId | null) => void;
  hoveredStructure: AnatomyStructureId | null;
  setHoveredStructure: (id: AnatomyStructureId | null) => void;

  // Analytics & History
  recordingPaused: boolean;
  history: TimeSeriesSample[];
  comparisonRunA: { label: string; samples: TimeSeriesSample[] } | null;
  presets: SimulationPreset[];

  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  setMode: (mode: SimulationMode) => void;
  toggleMonitoring: () => void;

  // Parameter Setters
  setHeartRate: (bpm: number) => void;
  setEdvEsv: (edv: number, esv: number) => void;
  updateBaseParams: (partial: Partial<ModelParameters>) => void;
  setAgeCategory: (age: AgeCategory) => void;

  // Exercise Controls
  startExercise: () => void;
  pauseExercise: () => void;
  resumeExercise: () => void;
  stopExercise: () => void;
  resetExercise: () => void;
  setExerciseSpeed: (kmh: number) => void;
  setExerciseDurationTarget: (sec: number) => void;
  triggerRecoveryMode: () => void;

  // Disease & ECG Controls
  selectDiseaseScenario: (id: DiseaseScenarioId) => void;
  setEcgRhythm: (rhythm: EcgRhythmType) => void;

  // Analytics Controls
  toggleRecordingPaused: () => void;
  clearHistory: () => void;
  captureComparisonRunA: () => void;
  clearComparisonRunA: () => void;

  // Presets
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;

  // Shared Clock Step (driven by central App rAF ticker)
  stepSimulation: (realDeltaSec: number) => void;
}

const initialSnapshot = computeSteadyStateHemodynamics(72, DEFAULT_BASE_PARAMS, 0, 0);

// Seed initial 24 samples so charts are immediately populated at t=0
function buildInitialHistory(hr: number, params: ModelParameters): TimeSeriesSample[] {
  const arr: TimeSeriesSample[] = [];
  for (let i = 24; i >= 1; i--) {
    const t = -i * 0.5;
    const phi = ((i * 0.37) % 1);
    const snap = computeSteadyStateHemodynamics(hr, params, phi, t);
    arr.push({
      timeSec: Number((24 * 0.5 + t).toFixed(1)),
      heartRate: snap.heartRate,
      strokeVolume: snap.strokeVolume,
      cardiacOutput: snap.cardiacOutput,
      ejectionFraction: snap.ejectionFraction,
      systolicBp: snap.systolicBp,
      diastolicBp: snap.diastolicBp,
      map: snap.map,
      lvPressure: snap.lvPressure,
      lvVolume: snap.lvVolume,
      aorticPressure: snap.aorticPressure,
      exerciseSpeedKmh: 0,
    });
  }
  return arr;
}

let lastHistoryPushSimSec = 12.0;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  activeSection: 'overview',
  setActiveSection: (activeSection) => set({ activeSection }),

  isRunning: true,
  isMonitoring: true,
  simSpeed: 1.0,
  simTimeSec: 12.0,
  cyclePhase: 0,
  beatCount: 0,
  mode: 'normal',
  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  heartRate: 72,
  baseParams: { ...DEFAULT_BASE_PARAMS },
  activeParams: { ...DEFAULT_BASE_PARAMS },
  snapshot: initialSnapshot,

  exerciseActive: false,
  exerciseRecovering: false,
  exerciseSpeedKmh: 0,
  exerciseElapsedSec: 0,
  exerciseDurationTargetSec: 600,
  exerciseMode: 'resting',

  activeDiseaseId: 'normal',
  ecgRhythm: 'normal-sinus',

  selectedStructure: 'left-ventricle',
  setSelectedStructure: (selectedStructure) => set({ selectedStructure }),
  hoveredStructure: null,
  setHoveredStructure: (hoveredStructure) => set({ hoveredStructure }),

  recordingPaused: false,
  history: buildInitialHistory(72, DEFAULT_BASE_PARAMS),
  comparisonRunA: null,
  presets: loadSavedPresets(),

  startSimulation: () => set({ isRunning: true }),
  pauseSimulation: () => set({ isRunning: false }),
  resumeSimulation: () => set({ isRunning: true }),
  resetSimulation: () => {
    lastHistoryPushSimSec = 12.0;
    const base = { ...DEFAULT_BASE_PARAMS };
    const snap = computeSteadyStateHemodynamics(72, base, 0, 12.0);
    set({
      isRunning: true,
      simSpeed: 1.0,
      simTimeSec: 12.0,
      cyclePhase: 0,
      beatCount: 0,
      mode: 'normal',
      heartRate: 72,
      baseParams: base,
      activeParams: { ...base },
      snapshot: snap,
      exerciseActive: false,
      exerciseRecovering: false,
      exerciseSpeedKmh: 0,
      exerciseElapsedSec: 0,
      exerciseMode: 'resting',
      activeDiseaseId: 'normal',
      ecgRhythm: 'normal-sinus',
      history: buildInitialHistory(72, base),
    });
  },

  setSimSpeed: (simSpeed) => set({ simSpeed: Math.max(0.25, Math.min(3.0, simSpeed)) }),

  setMode: (mode) => {
    if (mode === 'normal') {
      get().selectDiseaseScenario('normal');
      set({
        mode: 'normal',
        exerciseActive: false,
        exerciseRecovering: false,
        exerciseSpeedKmh: 0,
        exerciseMode: 'resting',
      });
    } else if (mode === 'exercise') {
      const currentSpeed = get().exerciseSpeedKmh;
      set({
        mode: 'exercise',
        activeDiseaseId: 'normal',
        exerciseActive: true,
        exerciseRecovering: false,
        exerciseSpeedKmh: currentSpeed > 0.5 ? currentSpeed : 8.5,
        exerciseMode: classifyExerciseMode(currentSpeed > 0.5 ? currentSpeed : 8.5, false),
      });
    } else {
      set({ mode: 'disease', exerciseActive: false, exerciseRecovering: false, exerciseSpeedKmh: 0 });
    }
  },

  toggleMonitoring: () => set((s) => ({ isMonitoring: !s.isMonitoring })),

  setHeartRate: (bpm) => {
    const clamped = Math.max(35, Math.min(210, Math.round(bpm)));
    const state = get();
    const snap = computeSteadyStateHemodynamics(clamped, state.activeParams, state.cyclePhase, state.simTimeSec);
    set({
      heartRate: clamped,
      baseParams: { ...state.baseParams, restingHeartRate: clamped },
      snapshot: snap,
    });
  },

  setEdvEsv: (edv, esv) => {
    const safeEdv = Math.max(50, Math.min(220, Math.round(edv)));
    // Prevent impossible combinations: ESV must be strictly less than EDV by at least 10 mL
    const safeEsv = Math.max(15, Math.min(safeEdv - 10, Math.round(esv)));
    const state = get();
    const nextActive = { ...state.activeParams, edv: safeEdv, esv: safeEsv };
    const nextBase = { ...state.baseParams, edv: safeEdv, esv: safeEsv };
    const snap = computeSteadyStateHemodynamics(state.heartRate, nextActive, state.cyclePhase, state.simTimeSec);
    set({
      activeParams: nextActive,
      baseParams: nextBase,
      snapshot: snap,
    });
  },

  updateBaseParams: (partial) => {
    const state = get();
    const merged = { ...state.baseParams, ...partial };
    if (merged.esv >= merged.edv - 10) {
      merged.esv = Math.max(15, merged.edv - 10);
    }
    const snap = computeSteadyStateHemodynamics(
      partial.restingHeartRate ?? state.heartRate,
      merged,
      state.cyclePhase,
      state.simTimeSec
    );
    set({
      baseParams: merged,
      activeParams: { ...merged },
      heartRate: partial.restingHeartRate ?? state.heartRate,
      snapshot: snap,
    });
  },

  setAgeCategory: (ageCategory) => {
    const state = get();
    const nextBase = { ...state.baseParams, ageCategory };
    set({ baseParams: nextBase });
  },

  startExercise: () => {
    const speed = get().exerciseSpeedKmh > 0.2 ? get().exerciseSpeedKmh : 7.5;
    set({
      mode: 'exercise',
      exerciseActive: true,
      exerciseRecovering: false,
      exerciseSpeedKmh: speed,
      exerciseMode: classifyExerciseMode(speed, false),
      isRunning: true,
    });
  },

  pauseExercise: () => set({ exerciseActive: false }),
  resumeExercise: () => set({ exerciseActive: true, exerciseRecovering: false, isRunning: true }),

  stopExercise: () =>
    set({
      exerciseActive: false,
      exerciseRecovering: true,
      exerciseSpeedKmh: 0,
      exerciseMode: 'recovery',
    }),

  resetExercise: () => {
    const state = get();
    const nextActive = { ...state.baseParams };
    const snap = computeSteadyStateHemodynamics(
      state.baseParams.restingHeartRate,
      nextActive,
      state.cyclePhase,
      state.simTimeSec
    );
    set({
      exerciseActive: false,
      exerciseRecovering: false,
      exerciseSpeedKmh: 0,
      exerciseElapsedSec: 0,
      exerciseMode: 'resting',
      heartRate: state.baseParams.restingHeartRate,
      activeParams: nextActive,
      snapshot: snap,
    });
  },

  setExerciseSpeed: (kmh) => {
    const clamped = Math.max(0, Math.min(20, Number(kmh.toFixed(1))));
    const active = clamped > 0.2;
    set({
      mode: active ? 'exercise' : get().mode,
      exerciseSpeedKmh: clamped,
      exerciseActive: active,
      exerciseRecovering: !active && get().heartRate > get().baseParams.restingHeartRate + 6,
      exerciseMode: classifyExerciseMode(clamped, !active && get().heartRate > get().baseParams.restingHeartRate + 6),
    });
  },

  setExerciseDurationTarget: (sec) => set({ exerciseDurationTargetSec: Math.max(60, Math.min(3600, sec)) }),

  triggerRecoveryMode: () =>
    set({
      exerciseActive: false,
      exerciseRecovering: true,
      exerciseSpeedKmh: 0,
      exerciseMode: 'recovery',
    }),

  selectDiseaseScenario: (id) => {
    const scenario = DISEASE_SCENARIOS[id];
    const state = get();
    const nextParams: ModelParameters = {
      ...state.baseParams,
      restingHeartRate: scenario.overrides.heartRate,
      edv: scenario.overrides.edv,
      esv: scenario.overrides.esv,
      eMax: scenario.overrides.eMax,
      rSys: scenario.overrides.rSys,
      cArt: scenario.overrides.cArt,
      aorticValveR: scenario.overrides.aorticValveR,
      mitralRegurgFraction: scenario.overrides.mitralRegurgFraction,
      coronaryPerfusionFactor: scenario.overrides.coronaryPerfusionFactor,
    };
    const snap = computeSteadyStateHemodynamics(
      scenario.overrides.heartRate,
      nextParams,
      state.cyclePhase,
      state.simTimeSec
    );
    set({
      mode: id === 'normal' ? 'normal' : 'disease',
      activeDiseaseId: id,
      ecgRhythm: scenario.ecgRhythm,
      heartRate: scenario.overrides.heartRate,
      activeParams: nextParams,
      snapshot: snap,
      exerciseActive: false,
      exerciseRecovering: false,
      exerciseSpeedKmh: 0,
      exerciseMode: 'resting',
      selectedStructure: scenario.affectedStructures[0] ?? state.selectedStructure,
    });
  },

  setEcgRhythm: (ecgRhythm) => set({ ecgRhythm }),

  toggleRecordingPaused: () => set((s) => ({ recordingPaused: !s.recordingPaused })),
  clearHistory: () => set({ history: [] }),

  captureComparisonRunA: () => {
    const state = get();
    const label =
      state.mode === 'exercise'
        ? `Exercise (${state.exerciseSpeedKmh} km/h)`
        : state.activeDiseaseId !== 'normal'
        ? DISEASE_SCENARIOS[state.activeDiseaseId].shortLabel
        : `Baseline (${Math.round(state.heartRate)} BPM)`;
    set({
      comparisonRunA: {
        label,
        samples: state.history.slice(-60),
      },
    });
  },
  clearComparisonRunA: () => set({ comparisonRunA: null }),

  savePreset: (name) => {
    const state = get();
    const preset: SimulationPreset = {
      id: `${Date.now()}`,
      name: name.trim() || `Model Config ${state.presets.length + 1}`,
      createdAt: new Date().toISOString(),
      params: { ...state.activeParams },
      diseaseId: state.activeDiseaseId,
      summary: {
        heartRate: state.snapshot.heartRate,
        strokeVolume: state.snapshot.strokeVolume,
        ejectionFraction: state.snapshot.ejectionFraction,
        cardiacOutput: state.snapshot.cardiacOutput,
        systolicBp: state.snapshot.systolicBp,
        diastolicBp: state.snapshot.diastolicBp,
      },
    };
    const updated = [preset, ...state.presets].slice(0, 12);
    persistPresets(updated);
    set({ presets: updated });
  },

  loadPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (!preset) return;
    const snap = computeSteadyStateHemodynamics(
      preset.params.restingHeartRate,
      preset.params,
      get().cyclePhase,
      get().simTimeSec
    );
    set({
      baseParams: { ...preset.params },
      activeParams: { ...preset.params },
      heartRate: preset.params.restingHeartRate,
      activeDiseaseId: preset.diseaseId,
      ecgRhythm: DISEASE_SCENARIOS[preset.diseaseId].ecgRhythm,
      snapshot: snap,
      mode: preset.diseaseId === 'normal' ? 'normal' : 'disease',
    });
  },

  deletePreset: (id) => {
    const updated = get().presets.filter((p) => p.id !== id);
    persistPresets(updated);
    set({ presets: updated });
  },

  stepSimulation: (realDeltaSec) => {
    const state = get();
    if (!state.isRunning) return;

    const dt = Math.min(0.1, Math.max(0.001, realDeltaSec)) * state.simSpeed;
    const nextSimTime = state.simTimeSec + dt;

    let nextHr = state.heartRate;
    let nextActive = state.activeParams;
    let nextExerciseElapsed = state.exerciseElapsedSec;
    let nextRecovering = state.exerciseRecovering;
    let nextExerciseMode = state.exerciseMode;
    let nextEcgRhythm = state.ecgRhythm;

    if (state.mode === 'exercise' || state.exerciseActive || state.exerciseRecovering) {
      if (state.exerciseActive && state.exerciseSpeedKmh > 0.2) {
        nextExerciseElapsed += dt;
        const targets = computeExerciseTargetResponse(state.baseParams, state.exerciseSpeedKmh);
        const k = 1 - Math.exp(-0.55 * dt);
        nextHr = state.heartRate + (targets.targetHr - state.heartRate) * k;
        nextActive = {
          ...state.activeParams,
          edv: state.activeParams.edv + (targets.targetEdv - state.activeParams.edv) * k,
          esv: state.activeParams.esv + (targets.targetEsv - state.activeParams.esv) * k,
          eMax: state.activeParams.eMax + (targets.targetEMax - state.activeParams.eMax) * k,
          rSys: state.activeParams.rSys + (targets.targetRSys - state.activeParams.rSys) * k,
        };
        nextExerciseMode = classifyExerciseMode(state.exerciseSpeedKmh, false);
        if (nextHr > 102 && state.activeDiseaseId === 'normal') {
          nextEcgRhythm = 'sinus-tachycardia';
        } else if (state.activeDiseaseId === 'normal') {
          nextEcgRhythm = 'normal-sinus';
        }
      } else if (state.exerciseRecovering) {
        const k = 1 - Math.exp(-0.28 * dt);
        nextHr = state.heartRate + (state.baseParams.restingHeartRate - state.heartRate) * k;
        nextActive = {
          ...state.activeParams,
          edv: state.activeParams.edv + (state.baseParams.edv - state.activeParams.edv) * k,
          esv: state.activeParams.esv + (state.baseParams.esv - state.activeParams.esv) * k,
          eMax: state.activeParams.eMax + (state.baseParams.eMax - state.activeParams.eMax) * k,
          rSys: state.activeParams.rSys + (state.baseParams.rSys - state.activeParams.rSys) * k,
        };
        if (Math.abs(nextHr - state.baseParams.restingHeartRate) < 1.2) {
          nextHr = state.baseParams.restingHeartRate;
          nextRecovering = false;
          nextExerciseMode = 'resting';
        } else {
          nextExerciseMode = 'recovery';
        }
        if (nextHr <= 100 && state.activeDiseaseId === 'normal') {
          nextEcgRhythm = 'normal-sinus';
        }
      }
    }

    // Advance cardiac cycle phase from synchronized heart rate
    // If Atrial Fibrillation, introduce realistic beat-to-beat R-R jitter
    const beatJitter =
      nextEcgRhythm === 'atrial-fibrillation'
        ? 1 + 0.16 * Math.sin(state.beatCount * 2.31) + 0.1 * Math.cos(state.beatCount * 4.17)
        : 1;
    const cyclesPerSec = (nextHr / 60) * beatJitter;
    const rawPhase = state.cyclePhase + dt * cyclesPerSec;
    const wrappedBeats = Math.floor(rawPhase);
    const nextPhase = rawPhase - wrappedBeats;
    const nextBeatCount = state.beatCount + wrappedBeats;

    const nextSnapshot = computeSteadyStateHemodynamics(nextHr, nextActive, nextPhase, nextSimTime);

    let nextHistory = state.history;
    if (!state.recordingPaused && nextSimTime - lastHistoryPushSimSec >= 0.45) {
      lastHistoryPushSimSec = nextSimTime;
      const sample: TimeSeriesSample = {
        timeSec: Number(nextSimTime.toFixed(1)),
        heartRate: nextSnapshot.heartRate,
        strokeVolume: nextSnapshot.strokeVolume,
        cardiacOutput: nextSnapshot.cardiacOutput,
        ejectionFraction: nextSnapshot.ejectionFraction,
        systolicBp: nextSnapshot.systolicBp,
        diastolicBp: nextSnapshot.diastolicBp,
        map: nextSnapshot.map,
        lvPressure: nextSnapshot.lvPressure,
        lvVolume: nextSnapshot.lvVolume,
        aorticPressure: nextSnapshot.aorticPressure,
        exerciseSpeedKmh: state.exerciseSpeedKmh,
      };
      nextHistory = [...state.history, sample].slice(-120);
    }

    set({
      simTimeSec: nextSimTime,
      cyclePhase: nextPhase,
      beatCount: nextBeatCount,
      heartRate: nextHr,
      activeParams: nextActive,
      snapshot: nextSnapshot,
      exerciseElapsedSec: nextExerciseElapsed,
      exerciseRecovering: nextRecovering,
      exerciseMode: nextExerciseMode,
      ecgRhythm: nextEcgRhythm,
      history: nextHistory,
    });
  },
}));
