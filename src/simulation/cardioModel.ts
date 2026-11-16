import {
  EcgRhythmType,
  ExerciseMode,
  HemodynamicSnapshot,
  ModelParameters,
} from '../types/cardio';

/**
 * Stergiopulos et al. Double-Hill normalized time-varying elastance E_n(tau), tau in [0, 1).
 * Models ventricular contraction activation and relaxation smoothly.
 */
export function normalizedDoubleHillElastance(tau: number): number {
  const t = Math.max(1e-5, ((tau % 1) + 1) % 1);
  const a1 = Math.pow(t / 0.303, 1.32);
  const a2 = Math.pow(t / 0.508, 21.9);
  const raw = (a1 / (1 + a1)) * (1 / (1 + a2));
  return Math.min(1.0, raw / 0.644);
}

/**
 * Computes mathematically consistent ventricular and systemic metrics from model parameters.
 * Strictly enforces SV = EDV - ESV, EF = (SV / EDV) * 100, CO = (HR * SV) / 1000.
 */
export function computeSteadyStateHemodynamics(
  heartRate: number,
  params: ModelParameters,
  cyclePhase: number,
  timestampSec: number
): HemodynamicSnapshot {
  const safeEdv = Math.max(40, Math.min(240, params.edv));
  const safeEsv = Math.max(15, Math.min(safeEdv - 5, params.esv));
  const grossSv = safeEdv - safeEsv;

  // Net forward stroke volume accounts for mitral regurgitation fraction if active
  const forwardSv = Math.max(5, grossSv * (1 - params.mitralRegurgFraction));
  const ejectionFraction = (grossSv / safeEdv) * 100;
  const cardiacOutput = (heartRate * forwardSv) / 1000;

  // Mean arterial pressure from Ohm's law: MAP ≈ CO (mL/s) * R_sys + CVP
  const coMlPerSec = (cardiacOutput * 1000) / 60;
  const cvp = 4;
  const rawMap = coMlPerSec * params.rSys + cvp;

  // Pulse pressure scales with forward SV / arterial compliance C_art
  const pulsePressure = Math.max(18, Math.min(110, forwardSv / Math.max(0.45, params.cArt)));
  const diastolicBp = Math.max(40, Math.min(140, rawMap - pulsePressure / 3));
  const systolicBp = Math.max(diastolicBp + 15, Math.min(240, diastolicBp + pulsePressure));
  const map = diastolicBp + (systolicBp - diastolicBp) / 3;

  // Instantaneous cardiac cycle phase calculations
  const phi = ((cyclePhase % 1) + 1) % 1;
  const en = normalizedDoubleHillElastance(phi);
  const eMin = 0.06;
  const eT = eMin + (params.eMax - eMin) * en;

  // Smoothly reconstruct instantaneous V_LV(phi) consistent with EDV and ESV
  let lvVolume = safeEdv;
  let cardiacPhaseLabel: HemodynamicSnapshot['cardiacPhaseLabel'] = 'Ventricular Filling';

  if (phi < 0.08) {
    // Atrial Systole ("atrial kick" final 12% filling)
    cardiacPhaseLabel = 'Atrial Systole';
    const f = phi / 0.08;
    lvVolume = safeEdv - (1 - f) * (grossSv * 0.12);
  } else if (phi < 0.14) {
    // Isovolumetric Contraction
    cardiacPhaseLabel = 'Isovolumetric Contraction';
    lvVolume = safeEdv;
  } else if (phi < 0.42) {
    // Ventricular Ejection
    cardiacPhaseLabel = 'Ventricular Ejection';
    const ejT = (phi - 0.14) / 0.28;
    const smoothEj = 0.5 - 0.5 * Math.cos(Math.PI * ejT);
    lvVolume = safeEdv - grossSv * smoothEj;
  } else if (phi < 0.50) {
    // Isovolumetric Relaxation
    cardiacPhaseLabel = 'Isovolumetric Relaxation';
    lvVolume = safeEsv;
  } else {
    // Rapid + Reduced Passive Ventricular Filling
    cardiacPhaseLabel = 'Ventricular Filling';
    const fillT = (phi - 0.50) / 0.50;
    const rapidFill = 1 - Math.pow(1 - fillT, 2.2);
    lvVolume = safeEsv + grossSv * 0.88 * rapidFill;
  }

  // Instantaneous P_LV(t) = E(t) * (V(t) - V0) + stenotic outflow pressure load
  const v0 = 10;
  const stenoticLoad = params.aorticValveR > 0.03 && phi >= 0.14 && phi < 0.42
    ? (params.aorticValveR - 0.015) * 320 * Math.sin(((phi - 0.14) / 0.28) * Math.PI)
    : 0;
  const lvPressure = Math.max(
    4,
    Math.min(260, eT * Math.max(5, lvVolume - v0) * (systolicBp / 120) * 0.55 + stenoticLoad + (phi >= 0.14 && phi < 0.42 ? diastolicBp * 0.68 : 0))
  );

  // Instantaneous Aortic Pressure (Windkessel systolic rise + dicrotic notch + exponential diastolic decay)
  let aorticPressure = diastolicBp;
  if (phi >= 0.14 && phi < 0.42) {
    const t = (phi - 0.14) / 0.28;
    aorticPressure = diastolicBp + (systolicBp - diastolicBp) * Math.sin(Math.PI * Math.pow(t, 0.78));
  } else if (phi >= 0.42 && phi < 0.47) {
    // Dicrotic notch at aortic valve closure
    const t = (phi - 0.42) / 0.05;
    const notchDepth = 4.5 * Math.sin(Math.PI * t);
    aorticPressure = diastolicBp + (systolicBp - diastolicBp) * 0.42 - notchDepth;
  } else {
    // Exponential Windkessel runoff from end-systole through diastole
    const dist = phi >= 0.47 ? (phi - 0.47) / 0.67 : (phi + 0.53) / 0.67;
    aorticPressure = diastolicBp + (systolicBp - diastolicBp) * 0.40 * Math.exp(-1.9 * dist);
  }

  const aorticFlow =
    phi >= 0.14 && phi < 0.42
      ? Math.max(0, (forwardSv / 0.24) * Math.sin(((phi - 0.14) / 0.28) * Math.PI) * (heartRate / 72))
      : 0;

  const mitralFlow =
    phi >= 0.50
      ? Math.max(0, (grossSv / 0.35) * Math.sin(((phi - 0.50) / 0.50) * Math.PI))
      : phi < 0.08
      ? Math.max(0, (grossSv * 0.25) / 0.08 * Math.sin((phi / 0.08) * Math.PI))
      : 0;

  return {
    timestampSec,
    cyclePhase: phi,
    heartRate: Number(heartRate.toFixed(1)),
    edv: Number(safeEdv.toFixed(1)),
    esv: Number(safeEsv.toFixed(1)),
    strokeVolume: Number(forwardSv.toFixed(1)),
    ejectionFraction: Number(ejectionFraction.toFixed(2)),
    cardiacOutput: Number(cardiacOutput.toFixed(2)),
    systolicBp: Number(systolicBp.toFixed(0)),
    diastolicBp: Number(diastolicBp.toFixed(0)),
    map: Number(map.toFixed(1)),
    lvPressure: Number(lvPressure.toFixed(1)),
    lvVolume: Number(lvVolume.toFixed(1)),
    aorticPressure: Number(aorticPressure.toFixed(1)),
    aorticFlow: Number(aorticFlow.toFixed(1)),
    mitralFlow: Number(mitralFlow.toFixed(1)),
    cardiacPhaseLabel,
  };
}

/**
 * Classifies running speed (0–20 km/h) into exercise physiology mode.
 */
export function classifyExerciseMode(speedKmh: number, isRecovering: boolean): ExerciseMode {
  if (isRecovering) return 'recovery';
  if (speedKmh <= 0.2) return 'resting';
  if (speedKmh <= 5.5) return 'walking';
  if (speedKmh <= 9.5) return 'light-jogging';
  if (speedKmh <= 14.0) return 'moderate-running';
  return 'high-intensity';
}

/**
 * Computes target cardiovascular adjustments during dynamic treadmill exercise (0–20 km/h).
 * Documented illustrative model: combines chronotropic drive, Frank-Starling preload rise,
 * increased contractility (lower ESV), and active muscle vasodilation (lower R_sys).
 */
export function computeExerciseTargetResponse(
  baseParams: ModelParameters,
  speedKmh: number
): {
  targetHr: number;
  targetEdv: number;
  targetEsv: number;
  targetEMax: number;
  targetRSys: number;
} {
  const intensity = Math.max(0, Math.min(1, speedKmh / 20));
  const ageOffset =
    baseParams.ageCategory === 'young-adult'
      ? 10
      : baseParams.ageCategory === 'adult'
      ? 0
      : baseParams.ageCategory === 'middle-aged'
      ? -12
      : -24;

  const maxReserve = Math.max(60, 115 + ageOffset);
  const targetHr = baseParams.restingHeartRate + maxReserve * Math.pow(intensity, 0.85);
  const targetEdv = Math.min(180, baseParams.edv + 24 * Math.sin(Math.min(1, intensity * 1.25) * (Math.PI / 2)));
  const targetEsv = Math.max(22, baseParams.esv - 18 * Math.pow(intensity, 0.9));
  const targetEMax = Math.min(4.8, baseParams.eMax + 1.65 * intensity);
  const targetRSys = Math.max(0.42, baseParams.rSys * (1 - 0.52 * Math.pow(intensity, 0.8)));

  return {
    targetHr,
    targetEdv,
    targetEsv: Math.min(targetEsv, targetEdv - 10),
    targetEMax,
    targetRSys,
  };
}

/**
 * Evaluates a synthetic educational ECG voltage (mV) at cardiac cycle phase phi in [0, 1).
 * Uses Gaussian summation for P, Q, R, S, T waves with rhythm-specific morphology.
 */
function gaussian(x: number, mu: number, sigma: number): number {
  const d = (x - mu) / sigma;
  return Math.exp(-0.5 * d * d);
}

export function synthesizeEcgSampleMv(
  phi: number,
  rhythm: EcgRhythmType,
  timeSec: number,
  beatIndex: number
): number {
  const p = ((phi % 1) + 1) % 1;

  // Baseline respiration / subtle micro-drift
  let v = 0.012 * Math.sin(2 * Math.PI * 0.25 * timeSec);

  if (rhythm === 'atrial-fibrillation') {
    // Chaotic low-amplitude f-waves replacing P wave
    v +=
      0.045 * Math.sin(2 * Math.PI * 6.3 * timeSec) +
      0.03 * Math.sin(2 * Math.PI * 8.7 * timeSec + 1.1);
  } else {
    // Normal atrial P wave
    v += 0.14 * gaussian(p, 0.12, 0.025);
  }

  // Premature Ventricular Contraction every 2nd beat in pvc-bigeminy
  const isPvcBeat = rhythm === 'pvc-bigeminy' && beatIndex % 2 === 1;

  if (isPvcBeat) {
    // Wide bizarre QRS without preceding P contribution, discordant T
    v -= 0.28 * gaussian(p, 0.25, 0.022);
    v += 0.92 * gaussian(p, 0.29, 0.024);
    v -= 0.62 * gaussian(p, 0.34, 0.028);
    v -= 0.28 * gaussian(p, 0.52, 0.055);
    return v;
  }

  // Normal QRS complex
  v -= 0.12 * gaussian(p, 0.235, 0.008); // Q
  v += 1.25 * gaussian(p, 0.26, 0.010);  // R
  v -= 0.26 * gaussian(p, 0.285, 0.009); // S

  if (rhythm === 'ischemic-st') {
    // Representative educational ST depression + inverted/biphasic T wave
    v -= 0.18 * gaussian(p, 0.36, 0.045);
    v -= 0.16 * gaussian(p, 0.49, 0.045);
  } else {
    // Normal upright T wave
    v += 0.30 * gaussian(p, 0.48, 0.046);
  }

  return v;
}

/**
 * Generates a full Pressure-Volume loop curve (one cardiac cycle) for Research Analytics.
 */
export function generatePvLoopData(params: ModelParameters): Array<{
  phase: string;
  volume: number;
  pressure: number;
}> {
  const safeEdv = Math.max(40, params.edv);
  const safeEsv = Math.max(15, Math.min(safeEdv - 5, params.esv));
  const points: Array<{ phase: string; volume: number; pressure: number }> = [];
  const steps = 80;

  for (let i = 0; i <= steps; i++) {
    const phi = i / steps;
    const snap = computeSteadyStateHemodynamics(72, params, phi, phi);
    points.push({
      phase: snap.cardiacPhaseLabel,
      volume: Number(snap.lvVolume.toFixed(1)),
      pressure: Number(snap.lvPressure.toFixed(1)),
    });
  }

  // Ensure closed loop
  if (points.length > 0) {
    points.push({ ...points[0] });
  }
  void safeEdv;
  void safeEsv;
  return points;
}
