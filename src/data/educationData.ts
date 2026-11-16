import { AnatomyStructureId } from '../types/cardio';

export interface RbcJourneyStage {
  step: number;
  title: string;
  structureId: AnatomyStructureId | 'lungs' | 'body';
  oxygenation: 'deoxygenated' | 'oxygenated';
  pressureNote: string;
  description: string;
}

export const RBC_JOURNEY_STAGES: RbcJourneyStage[] = [
  {
    step: 1,
    title: 'Systemic Capillary Exchange (Body Tissues)',
    structureId: 'body',
    oxygenation: 'deoxygenated',
    pressureNote: 'Venous PO2 ~40 mmHg',
    description:
      'After delivering oxygen to working skeletal muscle and organs, the red blood cell carries CO2 back toward the heart through systemic venules.',
  },
  {
    step: 2,
    title: 'Superior & Inferior Vena Cava',
    structureId: 'inferior-vena-cava',
    oxygenation: 'deoxygenated',
    pressureNote: 'Central Venous Pressure 2–6 mmHg',
    description:
      'Low-pressure venous return converges into the Superior and Inferior Vena Cava, boosted during exercise by skeletal muscle compression and respiratory suction.',
  },
  {
    step: 3,
    title: 'Right Atrium',
    structureId: 'right-atrium',
    oxygenation: 'deoxygenated',
    pressureNote: '2–6 mmHg',
    description:
      'The red blood cell enters the right atrium, home to the sinoatrial (SA) pacemaker node, and waits briefly before atrial depolarization.',
  },
  {
    step: 4,
    title: 'Tricuspid Valve',
    structureId: 'tricuspid-valve',
    oxygenation: 'deoxygenated',
    pressureNote: 'Opens during ventricular diastole',
    description:
      'When right ventricular pressure drops below right atrial pressure, the three tricuspid leaflets swing open, allowing passive filling followed by the atrial kick.',
  },
  {
    step: 5,
    title: 'Right Ventricle',
    structureId: 'right-ventricle',
    oxygenation: 'deoxygenated',
    pressureNote: 'Systolic peak ~25 mmHg',
    description:
      'As the QRS wave triggers ventricular systole, the tricuspid valve snaps shut and the crescentic right ventricle compresses.',
  },
  {
    step: 6,
    title: 'Pulmonary Valve & Pulmonary Artery',
    structureId: 'pulmonary-artery',
    oxygenation: 'deoxygenated',
    pressureNote: '25 / 10 mmHg',
    description:
      'The pulmonary semilunar valve opens, propelling deoxygenated blood up the pulmonary trunk into the left and right pulmonary arteries.',
  },
  {
    step: 7,
    title: 'Pulmonary Alveolar Capillaries (Lungs)',
    structureId: 'lungs',
    oxygenation: 'oxygenated',
    pressureNote: 'O2 Uptake -> PO2 ~100 mmHg',
    description:
      'Across the ultra-thin alveolar-capillary membrane, CO2 diffuses out for exhalation and O2 binds to hemoglobin, turning the blood bright arterial red.',
  },
  {
    step: 8,
    title: 'Pulmonary Veins',
    structureId: 'pulmonary-veins',
    oxygenation: 'oxygenated',
    pressureNote: '6–12 mmHg',
    description:
      'Four valveless pulmonary veins transport freshly oxygenated blood back to the posterior wall of the heart.',
  },
  {
    step: 9,
    title: 'Left Atrium',
    structureId: 'left-atrium',
    oxygenation: 'oxygenated',
    pressureNote: '8–12 mmHg',
    description:
      'The left atrium stores oxygenated blood during systole and provides the final pre-stretch ("atrial kick") to the left ventricle at end-diastole.',
  },
  {
    step: 10,
    title: 'Mitral Valve',
    structureId: 'mitral-valve',
    oxygenation: 'oxygenated',
    pressureNote: 'Bicuspid coaptation',
    description:
      'The two mitral leaflets open wide during diastole to fill the left ventricle to End-Diastolic Volume (~120 mL), then seal tightly at systolic onset.',
  },
  {
    step: 11,
    title: 'Left Ventricle',
    structureId: 'left-ventricle',
    oxygenation: 'oxygenated',
    pressureNote: 'Systolic peak ~120 mmHg',
    description:
      'Thick left ventricular myocardium contracts vigorously with helical torsion, driving intraventricular pressure past aortic diastolic pressure.',
  },
  {
    step: 12,
    title: 'Aortic Valve & Systemic Aorta',
    structureId: 'aorta',
    oxygenation: 'oxygenated',
    pressureNote: '120 / 80 mmHg (MAP ~93 mmHg)',
    description:
      'The aortic valve opens, ejecting Stroke Volume (~70 mL) into the elastic aorta, whose Windkessel recoil sustains perfusion to the brain, coronaries, and body.',
  },
];

export interface EducationLesson {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  equationOrMetric: string;
}

export const EDUCATION_LESSONS: EducationLesson[] = [
  {
    id: 'cardiac-cycle',
    title: 'The Cardiac Cycle & Wiggers Phases',
    category: 'Physiology',
    summary:
      'Each heartbeat coordinates electrical depolarization with mechanical pressure gradients and unidirectional valve opening.',
    keyPoints: [
      'Atrial Systole (P wave): Final 15–20% active ventricular filling.',
      'Isovolumetric Contraction (QRS): All 4 valves closed; LV pressure rises steeply from ~10 to ~80 mmHg.',
      'Ventricular Ejection: Aortic valve opens when P_LV > P_Ao; ~70 mL ejected.',
      'Isovolumetric Relaxation (T wave end): Aortic valve closes (dicrotic notch); volume remains at ESV.',
    ],
    equationOrMetric: 'Cycle Duration (s) = 60 / HR (BPM)',
  },
  {
    id: 'pump-metrics',
    title: 'Stroke Volume, Ejection Fraction & Cardiac Output',
    category: 'Hemodynamics',
    summary:
      'Global ventricular performance is governed by preload (EDV), afterload (arterial pressure/resistance), and myocardial contractility.',
    keyPoints: [
      'Stroke Volume (SV) = End-Diastolic Volume (EDV) − End-Systolic Volume (ESV).',
      'Ejection Fraction (EF) = (SV / EDV) × 100%, normally 55–70% at rest.',
      'Cardiac Output (CO) = (HR × SV) / 1000 in L/min (typically ~5.0 L/min resting).',
      'Frank-Starling Law: Greater venous return stretches sarcomeres, increasing SV up to physiological limits.',
    ],
    equationOrMetric: 'CO = (72 × 70) / 1000 = 5.04 L/min',
  },
  {
    id: 'ecg-basics',
    title: 'Electrocardiogram (ECG) Waveforms',
    category: 'Electrophysiology',
    summary:
      'Surface ECG recordings reflect the summation of myocardial action potentials sweeping across the conduction system.',
    keyPoints: [
      'P wave: Atrial depolarization originating at the sinoatrial (SA) node.',
      'PR interval (120–200 ms): Physiological delay at the AV node allowing ventricular filling.',
      'QRS complex (60–100 ms): Rapid ventricular depolarization via Bundle of His and Purkinje fibers.',
      'T wave: Ventricular repolarization; vulnerable period for ischemic ST changes.',
    ],
    equationOrMetric: 'Paper speed standard: 25 mm/s (1 large box = 200 ms)',
  },
  {
    id: 'exercise-response',
    title: 'Cardiovascular Response to Dynamic Exercise',
    category: 'Exercise Physiology',
    summary:
      'Dynamic running demands rapid oxygen delivery: cardiac output can increase 3–4x via coordinated autonomic and peripheral adaptations.',
    keyPoints: [
      'Sympathetic activation increases Heart Rate and myocardial contractility (E_max).',
      'Skeletal muscle pump increases venous return, raising EDV while higher contractility lowers ESV.',
      'Active muscle arterioles vasodilate, dropping systemic vascular resistance (R_sys) so diastolic BP changes minimally while systolic BP rises.',
    ],
    equationOrMetric: 'MAP = DBP + (SBP − DBP) / 3',
  },
];

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'If End-Diastolic Volume (EDV) is 120 mL and End-Systolic Volume (ESV) is 50 mL at 72 BPM, what is the Cardiac Output?',
    options: ['3.60 L/min', '5.04 L/min', '6.12 L/min', '8.64 L/min'],
    correctIndex: 1,
    explanation: 'SV = 120 − 50 = 70 mL. Cardiac Output = (72 × 70) / 1000 = 5.04 L/min.',
  },
  {
    id: 'q2',
    question: 'Which valve separates the left atrium from the left ventricle?',
    options: ['Tricuspid valve', 'Pulmonary valve', 'Mitral (bicuspid) valve', 'Aortic valve'],
    correctIndex: 2,
    explanation: 'The mitral (bicuspid) valve guards the left atrioventricular orifice and seals against ~120 mmHg during systole.',
  },
  {
    id: 'q3',
    question: 'What physiological event does the QRS complex on an ECG represent?',
    options: [
      'Atrial depolarization',
      'Ventricular depolarization',
      'Ventricular repolarization',
      'Aortic valve closure',
    ],
    correctIndex: 1,
    explanation: 'The QRS complex reflects rapid electrical depolarization of the right and left ventricular myocardium.',
  },
  {
    id: 'q4',
    question: 'During diastole, when does the majority of left ventricular coronary artery perfusion occur?',
    options: [
      'During isovolumetric contraction',
      'During peak systolic ejection',
      'During ventricular diastole when wall tension relaxes',
      'Only during atrial systole',
    ],
    correctIndex: 2,
    explanation: 'High intramyocardial pressure compresses subendocardial vessels during systole, so LV coronary flow peaks during diastole.',
  },
  {
    id: 'q5',
    question: 'In a lumped-parameter Windkessel model, what does the equation Q = C × dP/dt express?',
    options: [
      'Flow proportional to arterial compliance and rate of pressure change',
      'Ventricular pressure equal to wall thickness',
      'Heart rate multiplied by vascular resistance',
      'Oxygen saturation across alveolar membranes',
    ],
    correctIndex: 0,
    explanation: 'Arterial compliance C stores blood volume elastically as pressure rises (Q = C × dP/dt) and releases it during diastole.',
  },
  {
    id: 'q6',
    question: 'Which vessel carries deoxygenated blood away from the right ventricle?',
    options: ['Pulmonary veins', 'Ascending aorta', 'Pulmonary artery trunk', 'Superior vena cava'],
    correctIndex: 2,
    explanation: 'The pulmonary artery trunk carries deoxygenated blood from the right ventricle to the lungs for oxygenation.',
  },
];
