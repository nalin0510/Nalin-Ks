import { AnatomyStructureId, AnatomyStructureInfo } from '../types/cardio';

export const ANATOMY_STRUCTURES: Record<AnatomyStructureId, AnatomyStructureInfo> = {
  'left-ventricle': {
    id: 'left-ventricle',
    name: 'Left Ventricle',
    category: 'chamber',
    oxygenation: 'oxygenated',
    description:
      'Thick-walled, conical primary systemic pumping chamber forming the cardiac apex. Generates high pressure to overcome systemic vascular resistance.',
    hemodynamicRole:
      'Receives oxygenated blood from the left atrium via the mitral valve and ejects it through the aortic valve into the ascending aorta.',
    wallThicknessNote: 'Myocardial wall thickness ~10–15 mm (approximately 3x thicker than the right ventricle).',
    normalPressureMmHg: '100–130 / 4–12 mmHg (systolic / end-diastolic)',
  },
  'right-ventricle': {
    id: 'right-ventricle',
    name: 'Right Ventricle',
    category: 'chamber',
    oxygenation: 'deoxygenated',
    description:
      'Crescent-shaped anterior pumping chamber wrapping around the right-anterior aspect of the interventricular septum.',
    hemodynamicRole:
      'Receives deoxygenated venous blood from the right atrium via the tricuspid valve and pumps it into the low-resistance pulmonary circulation.',
    wallThicknessNote: 'Myocardial wall thickness ~3–5 mm, adapted for low-pressure high-compliance volume ejection.',
    normalPressureMmHg: '20–30 / 2–6 mmHg (systolic / end-diastolic)',
  },
  'left-atrium': {
    id: 'left-atrium',
    name: 'Left Atrium',
    category: 'chamber',
    oxygenation: 'oxygenated',
    description:
      'Posterior-superior smooth-walled chamber receiving four pulmonary veins from the left and right lungs.',
    hemodynamicRole:
      'Acts as a reservoir during ventricular systole, a passive conduit in early diastole, and an active booster pump ("atrial kick") during late diastole.',
    wallThicknessNote: 'Smooth endocardial wall ~2–3 mm with a small left atrial appendage.',
    normalPressureMmHg: '6–12 mmHg mean',
  },
  'right-atrium': {
    id: 'right-atrium',
    name: 'Right Atrium',
    category: 'chamber',
    oxygenation: 'deoxygenated',
    description:
      'Right-superior receiving chamber housing the sinoatrial (SA) node pacemaker near the superior vena cava junction.',
    hemodynamicRole:
      'Collects systemic venous return from the superior vena cava, inferior vena cava, and coronary sinus, delivering it across the tricuspid valve.',
    wallThicknessNote: 'Thin wall (~2 mm) with pectinate muscle ridges inside the right auricle.',
    normalPressureMmHg: '2–6 mmHg mean',
  },
  aorta: {
    id: 'aorta',
    name: 'Aorta & Aortic Arch',
    category: 'great-vessel',
    oxygenation: 'oxygenated',
    description:
      'Largest elastic artery in the human body, rising from the left ventricular outflow tract, arching posteriorly, and giving off the brachiocephalic, left common carotid, and left subclavian arteries.',
    hemodynamicRole:
      'Provides Windkessel elastic compliance—expanding during systole to buffer peak pressure and recoiling during diastole to sustain continuous peripheral perfusion.',
    wallThicknessNote: 'Elastin-rich tunica media enabling high compliance and pulse wave propagation.',
    normalPressureMmHg: '110–125 / 70–80 mmHg',
  },
  'pulmonary-artery': {
    id: 'pulmonary-artery',
    name: 'Pulmonary Artery Trunk',
    category: 'great-vessel',
    oxygenation: 'deoxygenated',
    description:
      'Great vessel emerging anteriorly from the right ventricular outflow tract (conus arteriosus) before bifurcating beneath the aortic arch into left and right pulmonary arteries.',
    hemodynamicRole:
      'Transports deoxygenated blood to the alveolar capillary beds of the lungs for gas exchange.',
    wallThicknessNote: 'Thinner media than the aorta due to ~5x lower pulmonary arterial pressure.',
    normalPressureMmHg: '20–25 / 8–12 mmHg',
  },
  'pulmonary-veins': {
    id: 'pulmonary-veins',
    name: 'Pulmonary Veins (4)',
    category: 'great-vessel',
    oxygenation: 'oxygenated',
    description:
      'Four paired vessels (right/left superior and inferior) entering the posterior wall of the left atrium without valves.',
    hemodynamicRole:
      'Return freshly oxygenated blood from the pulmonary capillary beds directly into the left atrium.',
    wallThicknessNote: 'Thin-walled venous conduits with sleeves of atrial myocardium near the ostia.',
    normalPressureMmHg: '6–12 mmHg',
  },
  'superior-vena-cava': {
    id: 'superior-vena-cava',
    name: 'Superior Vena Cava',
    category: 'great-vessel',
    oxygenation: 'deoxygenated',
    description:
      'Large valveless venous trunk formed by the confluence of the brachiocephalic veins, entering the superior aspect of the right atrium.',
    hemodynamicRole:
      'Returns venous blood from the head, neck, upper limbs, and thoracic wall.',
    wallThicknessNote: 'Low-pressure compliant venous wall (~2–6 mmHg central venous pressure).',
    normalPressureMmHg: '2–6 mmHg',
  },
  'inferior-vena-cava': {
    id: 'inferior-vena-cava',
    name: 'Inferior Vena Cava',
    category: 'great-vessel',
    oxygenation: 'deoxygenated',
    description:
      'Largest venous vessel in the body ascending through the diaphragm to enter the postero-inferior right atrium.',
    hemodynamicRole:
      'Returns systemic venous blood from the abdomen, pelvis, and lower extremities; venous return rises sharply during leg exercise via the skeletal muscle pump.',
    wallThicknessNote: 'High-capacitance thin-walled vein with Eustachian valve ridge at the atrial junction.',
    normalPressureMmHg: '2–8 mmHg',
  },
  'tricuspid-valve': {
    id: 'tricuspid-valve',
    name: 'Tricuspid Valve',
    category: 'valve',
    oxygenation: 'structural',
    description:
      'Right atrioventricular valve composed of anterior, posterior, and septal leaflets anchored by chordae tendineae to papillary muscles.',
    hemodynamicRole:
      'Opens passively during diastole to allow right ventricular filling and closes during systole to prevent backflow into the right atrium.',
    wallThicknessNote: 'Fibrous avascular leaflets supported by collagenous chordae.',
    normalPressureMmHg: 'Gradient < 2 mmHg across open orifice',
  },
  'mitral-valve': {
    id: 'mitral-valve',
    name: 'Mitral (Bicuspid) Valve',
    category: 'valve',
    oxygenation: 'structural',
    description:
      'Left atrioventricular valve featuring a large anterior (aortic) leaflet and a crescentic posterior leaflet tethered to anterolateral and posteromedial papillary muscles.',
    hemodynamicRole:
      'Permits low-resistance diastolic filling of the left ventricle and seals against high systolic pressure (~120 mmHg) to ensure forward aortic ejection.',
    wallThicknessNote: 'Supported by robust saddle-shaped fibrous annulus and chordae tendineae.',
    normalPressureMmHg: 'Diastolic gradient < 2 mmHg',
  },
  'aortic-valve': {
    id: 'aortic-valve',
    name: 'Aortic Valve',
    category: 'valve',
    oxygenation: 'structural',
    description:
      'Three semilunar cusps (left coronary, right coronary, and non-coronary) positioned within the aortic root sinuses of Valsalva.',
    hemodynamicRole:
      'Snaps open when LV pressure exceeds aortic diastolic pressure (~80 mmHg) and closes briskly at end-systole (producing S2) to prevent aortic regurgitation.',
    wallThicknessNote: 'Cup-shaped semilunar cusps; coronary ostia arise just above the left and right cusps.',
    normalPressureMmHg: 'Systolic gradient < 5 mmHg',
  },
  'pulmonary-valve': {
    id: 'pulmonary-valve',
    name: 'Pulmonary Valve',
    category: 'valve',
    oxygenation: 'structural',
    description:
      'Three semilunar cusps situated at the junction of the right ventricular infundibulum and the main pulmonary trunk.',
    hemodynamicRole:
      'Opens when right ventricular pressure exceeds pulmonary arterial diastolic pressure (~10 mmHg) and closes during diastole.',
    wallThicknessNote: 'Structurally analogous to the aortic valve but thinner due to lower pressure load.',
    normalPressureMmHg: 'Systolic gradient < 5 mmHg',
  },
  'interventricular-septum': {
    id: 'interventricular-septum',
    name: 'Interventricular Septum',
    category: 'septum',
    oxygenation: 'structural',
    description:
      'Thick oblique muscular wall (with a small superior membranous portion) separating the left and right ventricular cavities.',
    hemodynamicRole:
      'Prevents mixing of oxygenated and deoxygenated blood, houses the Bundle of His and bundle branches, and contributes substantially to biventricular systolic contraction.',
    wallThicknessNote: 'Muscular thickness ~9–12 mm, mechanically coupled to left ventricular pressure dynamics.',
    normalPressureMmHg: 'Separates LV (~120 mmHg) from RV (~25 mmHg)',
  },
  'coronary-arteries': {
    id: 'coronary-arteries',
    name: 'Coronary Arteries (LAD / LCx / RCA)',
    category: 'coronary',
    oxygenation: 'oxygenated',
    description:
      'Epicardial arterial network arising from the aortic root sinuses: Left Main bifurcating into the Left Anterior Descending (LAD) and Left Circumflex (LCx), plus the Right Coronary Artery (RCA).',
    hemodynamicRole:
      'Supplies oxygenated blood directly to the myocardium—perfusing primarily during diastole when myocardial wall tension relaxes.',
    wallThicknessNote: 'Subepicardial conductance vessels sensitive to luminal narrowing (atherosclerosis).',
    normalPressureMmHg: 'Driven by aortic diastolic perfusion pressure (~70–85 mmHg)',
  },
};

export const ANATOMY_LIST = Object.values(ANATOMY_STRUCTURES);
