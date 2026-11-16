import { DiseaseScenario, DiseaseScenarioId } from '../types/cardio';

export const DISEASE_SCENARIOS: Record<DiseaseScenarioId, DiseaseScenario> = {
  normal: {
    id: 'normal',
    name: 'Normal Cardiovascular Function',
    shortLabel: 'Normal Baseline',
    affectedStructures: [],
    affectedRegionLabel: 'Balanced Systemic & Pulmonary Circuits',
    ecgRhythm: 'normal-sinus',
    summary:
      'Healthy resting biventricular coupling with normal sinus rhythm, intact valve mechanics, and compliant elastic arteries.',
    physiologicalMechanism:
      'The sinoatrial node initiates regular depolarization at 72 BPM. Normal myocardial elastance (E_max = 2.3 mmHg/mL) ejects 70 mL from a 120 mL end-diastolic volume.',
    mathEffects: [
      'HR = 72 BPM, EDV = 120 mL, ESV = 50 mL',
      'SV = 70 mL, EF = 58.33%, CO = 5.04 L/min',
      'Systemic resistance R_sys = 1.05 mmHg·s/mL, C_art = 1.45 mL/mmHg',
    ],
    illustrativeEffects: [
      'Synchronized atrial-before-ventricular contraction with crisp valve opening/closing.',
    ],
    ecgNote: 'Regular P-QRS-T morphology with stable PR (160 ms) and QRS (85 ms) intervals.',
    overrides: {
      heartRate: 72,
      edv: 120,
      esv: 50,
      eMax: 2.3,
      rSys: 1.05,
      cArt: 1.45,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 1.0,
    },
  },
  tachycardia: {
    id: 'tachycardia',
    name: 'Sinus Tachycardia',
    shortLabel: 'Tachycardia',
    affectedStructures: ['right-atrium', 'left-ventricle'],
    affectedRegionLabel: 'SA Node Pacemaker & Ventricular Filling Time',
    ecgRhythm: 'sinus-tachycardia',
    summary:
      'Elevated resting heart rate (>100 BPM) driven by heightened sympathetic tone, fever, or autonomic stimulus.',
    physiologicalMechanism:
      'Shortened diastolic filling interval reduces ventricular preload (EDV falls slightly), while sympathetic inotropy partially preserves cardiac output.',
    mathEffects: [
      'HR elevated to 124 BPM (shortened cycle duration 0.48 s)',
      'EDV modestly reduced to 108 mL due to abbreviated diastole; ESV = 44 mL',
      'CO rises from 5.04 to ~7.94 L/min via rate dominance',
    ],
    illustrativeEffects: [
      'Rapid myocardial contraction cadence and accelerated blood-particle velocity.',
    ],
    ecgNote: 'Narrow-complex sinus rhythm at 124 BPM with compressed T-to-P diastolic baseline.',
    overrides: {
      heartRate: 124,
      edv: 108,
      esv: 44,
      eMax: 2.55,
      rSys: 0.92,
      cArt: 1.4,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.92,
    },
  },
  bradycardia: {
    id: 'bradycardia',
    name: 'Sinus Bradycardia',
    shortLabel: 'Bradycardia',
    affectedStructures: ['right-atrium', 'left-ventricle'],
    affectedRegionLabel: 'SA Node Automaticity & Diastolic Filling',
    ecgRhythm: 'sinus-bradycardia',
    summary:
      'Slow resting heart rate (<60 BPM) seen in high vagal tone, trained endurance physiology, or nodal suppression.',
    physiologicalMechanism:
      'Prolonged diastolic filling increases EDV via the Frank-Starling mechanism, boosting stroke volume per beat to partially compensate for lower heart rate.',
    mathEffects: [
      'HR reduced to 46 BPM (cycle duration 1.30 s)',
      'Extended filling raises EDV to 136 mL; ESV = 48 mL -> SV = 88 mL',
      'EF = 64.71%, resting CO = 4.05 L/min',
    ],
    illustrativeEffects: [
      'Slow, forceful myocardial beats with prolonged diastolic relaxation interval.',
    ],
    ecgNote: 'Regular P-QRS-T waves separated by long isoelectric TP segments.',
    overrides: {
      heartRate: 46,
      edv: 136,
      esv: 48,
      eMax: 2.4,
      rSys: 1.1,
      cArt: 1.55,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 1.0,
    },
  },
  hypertension: {
    id: 'hypertension',
    name: 'Systemic Hypertension',
    shortLabel: 'Hypertension',
    affectedStructures: ['aorta', 'left-ventricle', 'aortic-valve'],
    affectedRegionLabel: 'Systemic Arterioles & Left Ventricular Afterload',
    ecgRhythm: 'normal-sinus',
    summary:
      'Chronically elevated systemic arterial pressure resulting from increased total peripheral resistance and reduced arterial compliance.',
    physiologicalMechanism:
      'Higher systemic resistance (R_sys) and stiffer arteries (lower C_art) elevate aortic afterload. The left ventricle must generate higher systolic pressure, raising ESV and slightly reducing stroke volume.',
    mathEffects: [
      'R_sys increased to 1.65 mmHg·s/mL; C_art reduced to 0.95 mL/mmHg',
      'Elevated afterload increases ESV to 60 mL (EDV 122 mL -> SV 62 mL, EF 50.8%)',
      'Simulated BP rises into the ~160/98 mmHg range',
    ],
    illustrativeEffects: [
      'Heightened aortic wall tension and forceful left ventricular systolic wall stress.',
    ],
    ecgNote: 'Sinus rhythm remains regular; chronic hypertrophy signs are educational context only.',
    overrides: {
      heartRate: 76,
      edv: 122,
      esv: 60,
      eMax: 2.65,
      rSys: 1.65,
      cArt: 0.95,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.95,
    },
  },
  hypotension: {
    id: 'hypotension',
    name: 'Systemic Hypotension',
    shortLabel: 'Hypotension',
    affectedStructures: ['aorta', 'inferior-vena-cava', 'left-ventricle'],
    affectedRegionLabel: 'Venous Return & Systemic Vascular Tone',
    ecgRhythm: 'sinus-tachycardia',
    summary:
      'Abnormally low arterial blood pressure due to reduced preload or excessive peripheral vasodilation.',
    physiologicalMechanism:
      'Decreased systemic vascular resistance (R_sys) and lower venous return (reduced EDV) cause arterial pressure to drop; baroreceptor reflex elevates heart rate to defend perfusion.',
    mathEffects: [
      'R_sys decreased to 0.68 mmHg·s/mL; EDV reduced to 96 mL, ESV = 42 mL',
      'Reflex HR rises to 98 BPM; SV = 54 mL, CO = 5.29 L/min',
      'Simulated BP falls to ~86/52 mmHg (MAP ~63 mmHg)',
    ],
    illustrativeEffects: [
      'Compensatory rapid heart rate with reduced pulse amplitude.',
    ],
    ecgNote: 'Mild compensatory sinus tachycardia without intrinsic conduction block.',
    overrides: {
      heartRate: 98,
      edv: 96,
      esv: 42,
      eMax: 2.1,
      rSys: 0.68,
      cArt: 1.75,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.85,
    },
  },
  'aortic-stenosis': {
    id: 'aortic-stenosis',
    name: 'Aortic Valve Stenosis',
    shortLabel: 'Aortic Stenosis',
    affectedStructures: ['aortic-valve', 'left-ventricle', 'aorta'],
    affectedRegionLabel: 'Aortic Valve Orifice & LV Outflow Tract',
    ecgRhythm: 'normal-sinus',
    summary:
      'Narrowing of the aortic valve orifice creating high outflow resistance and a large systolic pressure gradient between LV and aorta.',
    physiologicalMechanism:
      'Increased aortic valve resistance (R_ao) impedes ventricular emptying. Peak LV pressure surges well above aortic systolic pressure while forward stroke volume declines.',
    mathEffects: [
      'Aortic valve resistance increased 10x (0.16 mmHg·s/mL)',
      'Peak LV pressure surges (>165 mmHg) while aortic SBP drops (~102 mmHg)',
      'ESV rises to 66 mL (EDV 120 mL -> SV 54 mL, EF 45.0%)',
    ],
    illustrativeEffects: [
      'Restricted aortic valve cusp excursion and elevated left ventricular pressure highlight.',
    ],
    ecgNote: 'Regular sinus rhythm; mechanical outflow obstruction primarily alters P_LV vs P_Ao waveforms.',
    overrides: {
      heartRate: 78,
      edv: 120,
      esv: 66,
      eMax: 2.85,
      rSys: 1.05,
      cArt: 1.3,
      aorticValveR: 0.16,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.85,
    },
  },
  'mitral-regurgitation': {
    id: 'mitral-regurgitation',
    name: 'Mitral Regurgitation',
    shortLabel: 'Mitral Regurg',
    affectedStructures: ['mitral-valve', 'left-atrium', 'left-ventricle'],
    affectedRegionLabel: 'Mitral Valve Apparatus & Left Atrium',
    ecgRhythm: 'normal-sinus',
    summary:
      'Incomplete closure of the mitral valve during systole allows a fraction of left ventricular blood to leak backward into the left atrium.',
    physiologicalMechanism:
      'Total LV emptying increases (larger EDV from volume overload), yet a substantial regurgitant fraction enters the low-pressure left atrium instead of the aorta, reducing net forward cardiac output.',
    mathEffects: [
      'Volume overload expands EDV to 145 mL; ESV = 55 mL',
      'Regurgitant fraction ~35% diverts flow backward into LA; net forward SV ~58 mL',
      'Apparent total EF rises, but effective forward CO drops (~4.7 L/min)',
    ],
    illustrativeEffects: [
      'Incomplete mitral leaflet coaptation with backward atrial volume load during systole.',
    ],
    ecgNote: 'Sinus tachycardia compensation at 86 BPM; widened P-wave tendencies in chronic atrial enlargement.',
    overrides: {
      heartRate: 86,
      edv: 145,
      esv: 55,
      eMax: 2.15,
      rSys: 1.0,
      cArt: 1.45,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0.35,
      coronaryPerfusionFactor: 0.9,
    },
  },
  'reduced-contractility': {
    id: 'reduced-contractility',
    name: 'Reduced Ventricular Contractility',
    shortLabel: 'Reduced Inotropy',
    affectedStructures: ['left-ventricle', 'interventricular-septum'],
    affectedRegionLabel: 'Left Ventricular Myocardium (Systolic Dysfunction)',
    ecgRhythm: 'sinus-tachycardia',
    summary:
      'Impaired myocardial contractile strength (depressed peak elastance E_max), modeling systolic ventricular dysfunction.',
    physiologicalMechanism:
      'Lower E_max flattens the End-Systolic Pressure-Volume Relationship (ESPVR), leaving a larger residual End-Systolic Volume (ESV) and markedly lowering Ejection Fraction.',
    mathEffects: [
      'Peak elastance E_max reduced from 2.3 to 1.05 mmHg/mL',
      'EDV dilates to 148 mL while ESV rises to 96 mL',
      'SV = 52 mL, EF falls to 35.14%, compensatory HR = 92 BPM -> CO = 4.78 L/min',
    ],
    illustrativeEffects: [
      'Visibly weaker left ventricular wall excursion during systole.',
    ],
    ecgNote: 'Compensatory sinus tachycardia to sustain systemic perfusion pressure.',
    overrides: {
      heartRate: 92,
      edv: 148,
      esv: 96,
      eMax: 1.05,
      rSys: 1.25,
      cArt: 1.35,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.85,
    },
  },
  'coronary-narrowing': {
    id: 'coronary-narrowing',
    name: 'Coronary Artery Narrowing',
    shortLabel: 'Coronary Stenosis',
    affectedStructures: ['coronary-arteries', 'left-ventricle', 'interventricular-septum'],
    affectedRegionLabel: 'LAD / Epicardial Coronary Perfusion Bed',
    ecgRhythm: 'ischemic-st',
    summary:
      'Luminal narrowing of an epicardial coronary artery limiting oxygen supply to the downstream left ventricular myocardium.',
    physiologicalMechanism:
      'Reduced coronary perfusion reserve impairs regional myocardial relaxation and contractile efficiency, especially if heart rate and oxygen demand increase.',
    mathEffects: [
      'Coronary perfusion factor reduced to 0.52; E_max falls to 1.65 mmHg/mL',
      'EDV = 126 mL, ESV = 66 mL -> SV = 60 mL, EF = 47.62%',
      'HR = 84 BPM, CO = 5.04 L/min with reduced exercise reserve',
    ],
    illustrativeEffects: [
      'Highlighted LAD/coronary arterial tree with ischemic myocardial perfusion warning.',
    ],
    ecgNote: 'Representative educational ST-segment depression / T-wave inversion illustrating repolarization strain.',
    overrides: {
      heartRate: 84,
      edv: 126,
      esv: 66,
      eMax: 1.65,
      rSys: 1.15,
      cArt: 1.35,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.52,
    },
  },
  'atrial-fibrillation': {
    id: 'atrial-fibrillation',
    name: 'Atrial Fibrillation (Rhythm Abnormality)',
    shortLabel: 'Atrial Fibrillation',
    affectedStructures: ['left-atrium', 'right-atrium', 'mitral-valve'],
    affectedRegionLabel: 'Atrial Conduction & AV Nodal Irregularity',
    ecgRhythm: 'atrial-fibrillation',
    summary:
      'Disorganized electrical activity in the atria eliminates coordinated atrial contraction ("atrial kick") and produces irregularly irregular ventricular beats.',
    physiologicalMechanism:
      'Without the late-diastolic atrial booster (~15–20% of ventricular filling), EDV decreases and beat-to-beat stroke volume fluctuates with varying R-R intervals.',
    mathEffects: [
      'Loss of atrial kick reduces baseline EDV to 104 mL; ESV = 48 mL -> SV = 56 mL',
      'Mean ventricular rate ~108 BPM with irregular beat-to-beat R-R variability',
      'EF = 53.85%, CO = 6.05 L/min (reduced preload efficiency)',
    ],
    illustrativeEffects: [
      'Loss of coordinated atrial contraction wave; irregular ventricular timing.',
    ],
    ecgNote: 'Absent distinct P waves replaced by chaotic baseline fibrillatory (f) waves and irregular R-R spacing.',
    overrides: {
      heartRate: 108,
      edv: 104,
      esv: 48,
      eMax: 2.1,
      rSys: 1.05,
      cArt: 1.4,
      aorticValveR: 0.015,
      mitralRegurgFraction: 0,
      coronaryPerfusionFactor: 0.9,
    },
  },
};

export const DISEASE_LIST = Object.values(DISEASE_SCENARIOS);
