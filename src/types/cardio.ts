export type NavSectionId =
  | 'overview'
  | 'heart-lab'
  | 'exercise-sim'
  | 'circulation'
  | 'ecg-monitor'
  | 'analysis'
  | 'disease-sim'
  | 'analytics'
  | 'ai-assistant'
  | 'education'
  | 'settings';

export type AnatomyStructureId =
  | 'left-ventricle'
  | 'right-ventricle'
  | 'left-atrium'
  | 'right-atrium'
  | 'aorta'
  | 'pulmonary-artery'
  | 'pulmonary-veins'
  | 'superior-vena-cava'
  | 'inferior-vena-cava'
  | 'tricuspid-valve'
  | 'mitral-valve'
  | 'aortic-valve'
  | 'pulmonary-valve'
  | 'interventricular-septum'
  | 'coronary-arteries';

export interface AnatomyStructureInfo {
  id: AnatomyStructureId;
  name: string;
  category: 'chamber' | 'great-vessel' | 'valve' | 'septum' | 'coronary';
  oxygenation: 'oxygenated' | 'deoxygenated' | 'structural';
  description: string;
  hemodynamicRole: string;
  wallThicknessNote: string;
  normalPressureMmHg: string;
}

export type ExerciseMode =
  | 'resting'
  | 'walking'
  | 'light-jogging'
  | 'moderate-running'
  | 'high-intensity'
  | 'recovery';

export type EcgRhythmType =
  | 'normal-sinus'
  | 'sinus-tachycardia'
  | 'sinus-bradycardia'
  | 'atrial-fibrillation'
  | 'pvc-bigeminy'
  | 'ischemic-st';

export type DiseaseScenarioId =
  | 'normal'
  | 'tachycardia'
  | 'bradycardia'
  | 'hypertension'
  | 'hypotension'
  | 'aortic-stenosis'
  | 'mitral-regurgitation'
  | 'reduced-contractility'
  | 'coronary-narrowing'
  | 'atrial-fibrillation';

export interface DiseaseScenario {
  id: DiseaseScenarioId;
  name: string;
  shortLabel: string;
  affectedStructures: AnatomyStructureId[];
  affectedRegionLabel: string;
  ecgRhythm: EcgRhythmType;
  summary: string;
  physiologicalMechanism: string;
  mathEffects: string[];
  illustrativeEffects: string[];
  ecgNote: string;
  overrides: {
    heartRate: number;
    edv: number;
    esv: number;
    eMax: number;
    rSys: number;
    cArt: number;
    aorticValveR: number;
    mitralRegurgFraction: number;
    coronaryPerfusionFactor: number;
  };
}

export type AgeCategory = 'young-adult' | 'adult' | 'middle-aged' | 'older-adult';

export interface ModelParameters {
  ageCategory: AgeCategory;
  restingHeartRate: number;
  edv: number;
  esv: number;
  eMax: number; // Peak LV elastance (mmHg/mL)
  rSys: number; // Systemic vascular resistance (mmHg*s/mL)
  cArt: number; // Arterial compliance (mL/mmHg)
  aorticValveR: number;
  mitralRegurgFraction: number;
  coronaryPerfusionFactor: number;
}

export interface HemodynamicSnapshot {
  timestampSec: number;
  cyclePhase: number; // 0..1 within current heartbeat
  heartRate: number; // BPM
  edv: number; // mL
  esv: number; // mL
  strokeVolume: number; // mL
  ejectionFraction: number; // %
  cardiacOutput: number; // L/min
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  map: number; // mmHg
  lvPressure: number; // instantaneous P_LV (mmHg)
  lvVolume: number; // instantaneous V_LV (mL)
  aorticPressure: number; // instantaneous P_Ao (mmHg)
  aorticFlow: number; // mL/s
  mitralFlow: number; // mL/s
  cardiacPhaseLabel:
    | 'Atrial Systole'
    | 'Isovolumetric Contraction'
    | 'Ventricular Ejection'
    | 'Isovolumetric Relaxation'
    | 'Ventricular Filling';
}

export interface TimeSeriesSample {
  timeSec: number;
  heartRate: number;
  strokeVolume: number;
  cardiacOutput: number;
  ejectionFraction: number;
  systolicBp: number;
  diastolicBp: number;
  map: number;
  lvPressure: number;
  lvVolume: number;
  aorticPressure: number;
  exerciseSpeedKmh: number;
}

export interface SimulationPreset {
  id: string;
  name: string;
  createdAt: string;
  params: ModelParameters;
  diseaseId: DiseaseScenarioId;
  summary: {
    heartRate: number;
    strokeVolume: number;
    ejectionFraction: number;
    cardiacOutput: number;
    systolicBp: number;
    diastolicBp: number;
  };
}
