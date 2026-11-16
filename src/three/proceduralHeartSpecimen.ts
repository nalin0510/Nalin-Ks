import * as THREE from 'three';
import { AnatomyStructureId } from '../types/cardio';
import {
  attachCardiacMotionShader,
  CardiacMotionRegion,
  HeartTextureSet,
  HeartUniforms,
} from './heartTissueMaterials';

export interface SpecimenPartRecord {
  id: AnatomyStructureId;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  materials: THREE.MeshPhysicalMaterial[];
  baseColors: THREE.Color[];
  explodeDir: THREE.Vector3;
  anchorLocal: THREE.Vector3;
  region: CardiacMotionRegion;
  isMyocardium: boolean;
  isInternal: boolean;
}

export interface ProceduralHeartSpecimen {
  root: THREE.Group;
  parts: Map<AnatomyStructureId, SpecimenPartRecord>;
  clickableMeshes: THREE.Mesh[];
  valvePivots: Map<
    'mitral-valve' | 'tricuspid-valve' | 'aortic-valve' | 'pulmonary-valve',
    THREE.Group[]
  >;
  venousFlowCurves: THREE.CatmullRomCurve3[];
  arterialFlowCurves: THREE.CatmullRomCurve3[];
  dispose: () => void;
}

/**
 * Generates an organic sculpted chamber BufferGeometry with anatomical grooves,
 * per-vertex tissue color variation, and epicardial adipose deposits in sulci.
 */
function buildSculptedChamberGeometry(options: {
  uSeg: number;
  vSeg: number;
  radiusFn: (theta: number, v: number) => {
    x: number;
    y: number;
    z: number;
    fatWeight: number;
    grooveDepth: number;
  };
  muscleColor: THREE.Color;
  darkMuscleColor: THREE.Color;
  fatColor: THREE.Color;
}): THREE.BufferGeometry {
  const { uSeg, vSeg, radiusFn, muscleColor, darkMuscleColor, fatColor } = options;
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const tmpColor = new THREE.Color();

  for (let iv = 0; iv <= vSeg; iv++) {
    const v = iv / vSeg; // 0 (apex/bottom) -> 1 (base/top)
    for (let iu = 0; iu <= uSeg; iu++) {
      const u = iu / uSeg;
      const theta = u * Math.PI * 2;
      const p = radiusFn(theta, v);
      positions.push(p.x, p.y, p.z);
      uvs.push(u * 2, v * 2);

      // Subtle organic myocardial color mottling + adipose fat inside grooves
      const mottle =
        0.5 +
        0.3 * Math.sin(theta * 5 + v * 7) +
        0.2 * Math.cos(theta * 9 - v * 11);
      tmpColor.copy(muscleColor).lerp(darkMuscleColor, mottle * 0.55);
      if (p.fatWeight > 0.01) {
        tmpColor.lerp(fatColor, Math.min(0.88, p.fatWeight));
      }
      colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
  }

  for (let iv = 0; iv < vSeg; iv++) {
    for (let iu = 0; iu < uSeg; iu++) {
      const a = iv * (uSeg + 1) + iu;
      const b = a + 1;
      const c = a + (uSeg + 1);
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildProceduralHeartSpecimen(
  textures: HeartTextureSet,
  uniforms: HeartUniforms,
  castShadows: boolean
): ProceduralHeartSpecimen {
  const root = new THREE.Group();
  const parts = new Map<AnatomyStructureId, SpecimenPartRecord>();
  const clickableMeshes: THREE.Mesh[] = [];
  const valvePivots = new Map<
    'mitral-valve' | 'tricuspid-valve' | 'aortic-valve' | 'pulmonary-valve',
    THREE.Group[]
  >();

  function registerPart(
    id: AnatomyStructureId,
    explodeDir: THREE.Vector3,
    anchorLocal: THREE.Vector3,
    region: CardiacMotionRegion,
    isMyocardium: boolean,
    isInternal = false
  ): SpecimenPartRecord {
    const group = new THREE.Group();
    group.userData.structureId = id;
    root.add(group);
    const rec: SpecimenPartRecord = {
      id,
      group,
      meshes: [],
      materials: [],
      baseColors: [],
      explodeDir,
      anchorLocal,
      region,
      isMyocardium,
      isInternal,
    };
    parts.set(id, rec);
    return rec;
  }

  function makeMaterial(
    colorHex: number,
    options: {
      map?: THREE.Texture | null;
      normalMap?: THREE.Texture | null;
      roughnessMap?: THREE.Texture | null;
      roughness?: number;
      clearcoat?: number;
      vertexColors?: boolean;
      region: CardiacMotionRegion;
    }
  ): THREE.MeshPhysicalMaterial {
    const mat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      map: options.map ?? null,
      normalMap: options.normalMap ?? null,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: options.roughnessMap ?? null,
      roughness: options.roughness ?? 0.52,
      metalness: 0.02,
      clearcoat: options.clearcoat ?? 0.34,
      clearcoatRoughness: 0.34,
      vertexColors: Boolean(options.vertexColors),
    });
    attachCardiacMotionShader(mat, uniforms, options.region);
    return mat;
  }

  function addMesh(
    id: AnatomyStructureId,
    geometry: THREE.BufferGeometry,
    material: THREE.MeshPhysicalMaterial,
    pos?: [number, number, number],
    rot?: [number, number, number]
  ): THREE.Mesh {
    const rec = parts.get(id)!;
    const mesh = new THREE.Mesh(geometry, material);
    if (pos) mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    mesh.castShadow = castShadows;
    mesh.receiveShadow = castShadows;
    mesh.userData.structureId = id;
    rec.group.add(mesh);
    rec.meshes.push(mesh);
    if (!rec.materials.includes(material)) {
      rec.materials.push(material);
      rec.baseColors.push(material.color.clone());
    }
    clickableMeshes.push(mesh);
    return mesh;
  }

  const fatCol = new THREE.Color('#c5a365');
  const lvMuscle = new THREE.Color('#8e3240');
  const lvDark = new THREE.Color('#521620');
  const rvMuscle = new THREE.Color('#7c2b3d');
  const rvDark = new THREE.Color('#471524');
  const atrMuscle = new THREE.Color('#832b3b');
  const atrDark = new THREE.Color('#4a1420');

  // ------------------------------------------------------------------
  // 1. LEFT VENTRICLE — Asymmetric conical apex tilted down-left-anterior
  //    with anterior interventricular groove & subepicardial fat edge
  // ------------------------------------------------------------------
  registerPart(
    'left-ventricle',
    new THREE.Vector3(-0.46, -0.28, 0.10),
    new THREE.Vector3(-0.34, -0.45, 0.14),
    'ventricle',
    true
  );

  const lvGeo = buildSculptedChamberGeometry({
    uSeg: 84,
    vSeg: 64,
    muscleColor: lvMuscle,
    darkMuscleColor: lvDark,
    fatColor: fatCol,
    radiusFn: (theta, v) => {
      // Longitudinal envelope from pointed apex (v=0) to wide base (v=1)
      const y = -0.96 + v * 1.24;
      const profile = Math.sin(Math.pow(v, 0.62) * Math.PI * 0.92);
      const rBase = 0.02 + 0.50 * profile;

      // Natural anatomical anterior-interventricular sulcus & AV groove indentation
      const antSulcusAngle = 0.25 + (1 - v) * 0.35;
      const antDiff = Math.atan2(Math.sin(theta - antSulcusAngle), Math.cos(theta - antSulcusAngle));
      const postSulcusAngle = Math.PI + 0.2;
      const postDiff = Math.atan2(Math.sin(theta - postSulcusAngle), Math.cos(theta - postSulcusAngle));

      const antGroove = Math.exp(-Math.pow(antDiff / 0.26, 2)) * 0.065 * Math.sin(v * Math.PI);
      const postGroove = Math.exp(-Math.pow(postDiff / 0.28, 2)) * 0.055 * Math.sin(v * Math.PI);
      const avGroove = Math.exp(-Math.pow((v - 0.90) / 0.09, 2)) * 0.05;

      // Subtle muscular ridge surface relief
      const relief = 0.008 * Math.sin(theta * 8 + v * 10) + 0.005 * Math.cos(theta * 14 - v * 6);
      const r = Math.max(0.015, rBase - antGroove - postGroove - avGroove + relief);

      // Asymmetric leftward apex sweep & septal flattening on +X face
      const apexShiftX = -0.28 * Math.pow(1 - v, 1.35) - 0.16;
      const apexShiftZ = 0.12 * Math.pow(1 - v, 1.4) - 0.04;
      const xRaw = Math.cos(theta) * r * (Math.cos(theta) > 0 ? 0.78 : 1.02);
      const zRaw = Math.sin(theta) * r * 0.94;

      const fatWeight =
        Math.exp(-Math.pow(antDiff / 0.22, 2)) * 0.65 * Math.sin(v * Math.PI) +
        Math.exp(-Math.pow((v - 0.90) / 0.08, 2)) * 0.60;

      return {
        x: xRaw + apexShiftX,
        y,
        z: zRaw + apexShiftZ,
        fatWeight,
        grooveDepth: antGroove + postGroove,
      };
    },
  });
  const lvMat = makeMaterial(0xffffff, {
    map: textures.muscleMap,
    normalMap: textures.muscleNormal,
    roughnessMap: textures.muscleRoughness,
    roughness: 0.48,
    clearcoat: 0.36,
    vertexColors: true,
    region: 'ventricle',
  });
  addMesh('left-ventricle', lvGeo, lvMat);

  // ------------------------------------------------------------------
  // 2. RIGHT VENTRICLE — Crescentic anterior-right muscular mass
  //    wrapping smoothly against the LV interventricular sulcus
  // ------------------------------------------------------------------
  registerPart(
    'right-ventricle',
    new THREE.Vector3(0.45, -0.22, 0.32),
    new THREE.Vector3(0.32, -0.22, 0.38),
    'ventricle',
    true
  );

  const rvGeo = buildSculptedChamberGeometry({
    uSeg: 80,
    vSeg: 60,
    muscleColor: rvMuscle,
    darkMuscleColor: rvDark,
    fatColor: fatCol,
    radiusFn: (theta, v) => {
      const y = -0.78 + v * 1.16;
      const profile = Math.sin(Math.pow(v, 0.65) * Math.PI * 0.90);
      const rBase = 0.02 + 0.43 * profile;

      const sulcusDiff = Math.atan2(Math.sin(theta - (Math.PI - 0.25)), Math.cos(theta - (Math.PI - 0.25)));
      const sulcusGroove = Math.exp(-Math.pow(sulcusDiff / 0.30, 2)) * 0.06 * Math.sin(v * Math.PI);
      const avGroove = Math.exp(-Math.pow((v - 0.88) / 0.09, 2)) * 0.055;
      const relief = 0.007 * Math.cos(theta * 9 + v * 8);

      const r = Math.max(0.015, rBase - sulcusGroove - avGroove + relief);
      // Conus arteriosus (infundibulum) tapers upward-left toward pulmonary trunk
      const infundibX = v > 0.72 ? -0.14 * ((v - 0.72) / 0.28) : 0;
      const infundibZ = v > 0.72 ? 0.14 * ((v - 0.72) / 0.28) : 0;

      const xRaw = Math.cos(theta) * r * (Math.cos(theta) < 0 ? 0.68 : 1.0);
      const zRaw = Math.sin(theta) * r * 0.84;

      const fatWeight =
        Math.exp(-Math.pow(sulcusDiff / 0.24, 2)) * 0.55 * Math.sin(v * Math.PI) +
        Math.exp(-Math.pow((v - 0.88) / 0.08, 2)) * 0.68;

      return {
        x: xRaw + 0.20 - 0.14 * Math.pow(1 - v, 1.3) + infundibX,
        y,
        z: zRaw + 0.14 + infundibZ,
        fatWeight,
        grooveDepth: sulcusGroove,
      };
    },
  });
  const rvMat = makeMaterial(0xffffff, {
    map: textures.muscleMap,
    normalMap: textures.muscleNormal,
    roughnessMap: textures.muscleRoughness,
    roughness: 0.50,
    clearcoat: 0.34,
    vertexColors: true,
    region: 'ventricle',
  });
  addMesh('right-ventricle', rvGeo, rvMat);

  // ------------------------------------------------------------------
  // 3. INTERVENTRICULAR SEPTUM (Internal muscular partition)
  // ------------------------------------------------------------------
  registerPart(
    'interventricular-septum',
    new THREE.Vector3(0, -0.32, -0.35),
    new THREE.Vector3(0.0, -0.22, 0.06),
    'ventricle',
    true,
    true
  );
  const septumGeo = buildSculptedChamberGeometry({
    uSeg: 40,
    vSeg: 40,
    muscleColor: new THREE.Color('#7a2432'),
    darkMuscleColor: new THREE.Color('#4f1520'),
    fatColor: new THREE.Color('#8a3040'),
    radiusFn: (theta, v) => {
      const y = -0.82 + v * 1.08;
      const profile = Math.sin(Math.pow(v, 0.65) * Math.PI * 0.94);
      const r = 0.01 + 0.36 * profile;
      return {
        x: Math.cos(theta) * r * 0.24 + 0.01 - 0.14 * Math.pow(1 - v, 1.2),
        y,
        z: Math.sin(theta) * r * 0.92 + 0.05,
        fatWeight: 0,
        grooveDepth: 0,
      };
    },
  });
  addMesh(
    'interventricular-septum',
    septumGeo,
    makeMaterial(0xffffff, {
      map: textures.muscleMap,
      normalMap: textures.muscleNormal,
      roughness: 0.54,
      vertexColors: true,
      region: 'ventricle',
    })
  );

  // ------------------------------------------------------------------
  // 4. LEFT ATRIUM + Left Auricular Appendage
  // ------------------------------------------------------------------
  registerPart(
    'left-atrium',
    new THREE.Vector3(-0.40, 0.32, -0.32),
    new THREE.Vector3(-0.34, 0.52, -0.24),
    'atrium',
    true
  );
  const laGeo = buildSculptedChamberGeometry({
    uSeg: 52,
    vSeg: 40,
    muscleColor: atrMuscle,
    darkMuscleColor: atrDark,
    fatColor: fatCol,
    radiusFn: (theta, v) => {
      const y = 0.24 + v * 0.50;
      const s = Math.sin(v * Math.PI);
      const r = 0.02 + 0.34 * s;
      const ridge = 0.008 * Math.sin(theta * 10);
      return {
        x: Math.cos(theta) * (r + ridge) * 1.12 - 0.28,
        y,
        z: Math.sin(theta) * (r + ridge) * 0.90 - 0.22,
        fatWeight: v < 0.18 ? 0.45 : 0,
        grooveDepth: 0,
      };
    },
  });
  const laMat = makeMaterial(0xffffff, {
    map: textures.muscleMap,
    normalMap: textures.muscleNormal,
    roughnessMap: textures.muscleRoughness,
    roughness: 0.50,
    vertexColors: true,
    region: 'atrium',
  });
  addMesh('left-atrium', laGeo, laMat);

  // Scalloped Left Auricular Appendage wrapping anteriorly around pulmonary root
  const lAuricleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.42, 0.54, -0.10),
    new THREE.Vector3(-0.56, 0.51, 0.10),
    new THREE.Vector3(-0.48, 0.41, 0.27),
  ]);
  addMesh('left-atrium', new THREE.TubeGeometry(lAuricleCurve, 22, 0.105, 16, false), laMat);

  // ------------------------------------------------------------------
  // 5. RIGHT ATRIUM + Pectinate Right Auricle
  // ------------------------------------------------------------------
  registerPart(
    'right-atrium',
    new THREE.Vector3(0.48, 0.28, 0.05),
    new THREE.Vector3(0.46, 0.42, 0.02),
    'atrium',
    true
  );
  const raGeo = buildSculptedChamberGeometry({
    uSeg: 52,
    vSeg: 40,
    muscleColor: new THREE.Color('#732638'),
    darkMuscleColor: new THREE.Color('#421422'),
    fatColor: fatCol,
    radiusFn: (theta, v) => {
      const y = 0.16 + v * 0.56;
      const s = Math.sin(v * Math.PI);
      const r = 0.02 + 0.35 * s;
      // Pectinate muscle ridges + sulcus terminalis indentation
      const pectinate = 0.012 * Math.sin(theta * 14) * s;
      return {
        x: Math.cos(theta) * (r + pectinate) * 0.94 + 0.44,
        y,
        z: Math.sin(theta) * (r + pectinate) * 0.96 - 0.04,
        fatWeight: v < 0.20 ? 0.52 : 0,
        grooveDepth: 0,
      };
    },
  });
  const raMat = makeMaterial(0xffffff, {
    map: textures.muscleMap,
    normalMap: textures.muscleNormal,
    roughnessMap: textures.muscleRoughness,
    roughness: 0.52,
    vertexColors: true,
    region: 'atrium',
  });
  addMesh('right-atrium', raGeo, raMat);

  const rAuricleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.44, 0.56, 0.08),
    new THREE.Vector3(0.32, 0.58, 0.25),
    new THREE.Vector3(0.18, 0.49, 0.29),
  ]);
  addMesh('right-atrium', new THREE.TubeGeometry(rAuricleCurve, 22, 0.115, 16, false), raMat);

  // ------------------------------------------------------------------
  // 6. AORTA, AORTIC ARCH, 3 GREAT BRANCHES & LIGAMENTUM ARTERIOSUM
  // ------------------------------------------------------------------
  registerPart(
    'aorta',
    new THREE.Vector3(-0.14, 0.56, -0.14),
    new THREE.Vector3(-0.08, 1.15, -0.02),
    'great-vessel',
    false
  );
  const aortaMat = makeMaterial(0x9b3e4c, {
    map: textures.vesselMap,
    normalMap: textures.muscleNormal,
    roughness: 0.46,
    clearcoat: 0.28,
    region: 'great-vessel',
  });
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.26, 0.02),
    new THREE.Vector3(-0.02, 0.64, 0.08),
    new THREE.Vector3(0.03, 1.04, 0.04),
    new THREE.Vector3(-0.12, 1.24, -0.10),
    new THREE.Vector3(-0.34, 1.10, -0.32),
    new THREE.Vector3(-0.38, 0.50, -0.48),
    new THREE.Vector3(-0.34, -0.46, -0.50),
  ]);
  addMesh('aorta', new THREE.TubeGeometry(aortaCurve, 72, 0.165, 24, false), aortaMat);

  // Brachiocephalic, Left Common Carotid, Left Subclavian arteries
  const archBranches = [
    {
      pts: [
        new THREE.Vector3(0.01, 1.12, 0.0),
        new THREE.Vector3(0.09, 1.40, 0.02),
        new THREE.Vector3(0.15, 1.62, 0.02),
      ],
      r: 0.068,
    },
    {
      pts: [
        new THREE.Vector3(-0.10, 1.21, -0.08),
        new THREE.Vector3(-0.11, 1.48, -0.08),
        new THREE.Vector3(-0.12, 1.66, -0.08),
      ],
      r: 0.052,
    },
    {
      pts: [
        new THREE.Vector3(-0.22, 1.17, -0.18),
        new THREE.Vector3(-0.27, 1.44, -0.20),
        new THREE.Vector3(-0.31, 1.60, -0.22),
      ],
      r: 0.055,
    },
  ];
  archBranches.forEach((b) => {
    addMesh(
      'aorta',
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(b.pts), 20, b.r, 16, false),
      aortaMat
    );
  });

  // Ligamentum Arteriosum fibrous tether
  const ligCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 1.08, -0.08),
    new THREE.Vector3(-0.14, 0.88, 0.04),
  ]);
  addMesh(
    'aorta',
    new THREE.TubeGeometry(ligCurve, 10, 0.022, 10, false),
    makeMaterial(0x9f8f82, { roughness: 0.72, clearcoat: 0.1, region: 'great-vessel' })
  );

  // ------------------------------------------------------------------
  // 7. PULMONARY ARTERY TRUNK + BIFURCATION
  // ------------------------------------------------------------------
  registerPart(
    'pulmonary-artery',
    new THREE.Vector3(-0.10, 0.42, 0.44),
    new THREE.Vector3(0.02, 0.76, 0.34),
    'great-vessel',
    false
  );
  const paMat = makeMaterial(0x6b5678, {
    map: textures.vesselMap,
    normalMap: textures.muscleNormal,
    roughness: 0.50,
    clearcoat: 0.25,
    region: 'great-vessel',
  });
  const paTrunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.14, 0.26, 0.28),
    new THREE.Vector3(0.06, 0.56, 0.32),
    new THREE.Vector3(-0.08, 0.78, 0.22),
    new THREE.Vector3(-0.22, 0.84, 0.04),
  ]);
  const paLeftCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.81, 0.14),
    new THREE.Vector3(-0.42, 0.84, 0.02),
    new THREE.Vector3(-0.74, 0.80, -0.10),
  ]);
  const paRightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.78, 0.18),
    new THREE.Vector3(0.24, 0.80, -0.02),
    new THREE.Vector3(0.64, 0.76, -0.14),
  ]);
  addMesh('pulmonary-artery', new THREE.TubeGeometry(paTrunkCurve, 32, 0.135, 20, false), paMat);
  addMesh('pulmonary-artery', new THREE.TubeGeometry(paLeftCurve, 22, 0.095, 16, false), paMat);
  addMesh('pulmonary-artery', new THREE.TubeGeometry(paRightCurve, 22, 0.095, 16, false), paMat);

  // ------------------------------------------------------------------
  // 8. PULMONARY VEINS (4)
  // ------------------------------------------------------------------
  registerPart(
    'pulmonary-veins',
    new THREE.Vector3(-0.48, 0.22, -0.44),
    new THREE.Vector3(-0.62, 0.52, -0.28),
    'great-vessel',
    false
  );
  const pvMat = makeMaterial(0x9a3d4c, {
    map: textures.vesselMap,
    normalMap: textures.muscleNormal,
    roughness: 0.48,
    region: 'great-vessel',
  });
  [
    [new THREE.Vector3(-0.42, 0.58, -0.26), new THREE.Vector3(-0.78, 0.66, -0.32)],
    [new THREE.Vector3(-0.42, 0.42, -0.28), new THREE.Vector3(-0.76, 0.38, -0.36)],
    [new THREE.Vector3(-0.16, 0.56, -0.32), new THREE.Vector3(0.26, 0.62, -0.40)],
    [new THREE.Vector3(-0.16, 0.40, -0.32), new THREE.Vector3(0.24, 0.36, -0.42)],
  ].forEach(([p0, p1]) => {
    const mid = p0.clone().lerp(p1, 0.5);
    mid.y += 0.03;
    addMesh(
      'pulmonary-veins',
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, mid, p1]), 16, 0.062, 14, false),
      pvMat
    );
  });

  // ------------------------------------------------------------------
  // 9 & 10. SUPERIOR & INFERIOR VENA CAVA
  // ------------------------------------------------------------------
  const vcMat = makeMaterial(0x4c4c74, {
    map: textures.vesselMap,
    normalMap: textures.muscleNormal,
    roughness: 0.54,
    clearcoat: 0.22,
    region: 'great-vessel',
  });
  registerPart(
    'superior-vena-cava',
    new THREE.Vector3(0.50, 0.52, 0.0),
    new THREE.Vector3(0.46, 1.15, -0.06),
    'great-vessel',
    false
  );
  const svcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.45, 0.60, -0.05),
    new THREE.Vector3(0.46, 0.98, -0.06),
    new THREE.Vector3(0.48, 1.38, -0.08),
  ]);
  const rBrachioVenous = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 1.32, -0.08),
    new THREE.Vector3(0.56, 1.56, -0.06),
  ]);
  const lBrachioVenous = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 1.32, -0.08),
    new THREE.Vector3(0.22, 1.48, -0.04),
  ]);
  addMesh('superior-vena-cava', new THREE.TubeGeometry(svcCurve, 26, 0.13, 18, false), vcMat);
  addMesh('superior-vena-cava', new THREE.TubeGeometry(rBrachioVenous, 14, 0.082, 14, false), vcMat);
  addMesh('superior-vena-cava', new THREE.TubeGeometry(lBrachioVenous, 16, 0.082, 14, false), vcMat);

  registerPart(
    'inferior-vena-cava',
    new THREE.Vector3(0.44, -0.50, -0.34),
    new THREE.Vector3(0.44, -0.45, -0.24),
    'great-vessel',
    false
  );
  const ivcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.44, 0.18, -0.18),
    new THREE.Vector3(0.45, -0.24, -0.22),
    new THREE.Vector3(0.44, -0.78, -0.25),
  ]);
  addMesh('inferior-vena-cava', new THREE.TubeGeometry(ivcCurve, 24, 0.135, 18, false), vcMat);

  // ------------------------------------------------------------------
  // 11–14. INTERNAL CARDIAC VALVES (revealed in Transparent/Isolate/Explode)
  // ------------------------------------------------------------------
  function buildValve(
    id: 'mitral-valve' | 'tricuspid-valve' | 'aortic-valve' | 'pulmonary-valve',
    pos: [number, number, number],
    rot: [number, number, number],
    leafletCount: number,
    radius: number,
    explodeDir: THREE.Vector3
  ) {
    const rec = registerPart(id, explodeDir, new THREE.Vector3(...pos), 'static', false, true);
    const valveMat = makeMaterial(0xd7c4b4, {
      roughness: 0.42,
      clearcoat: 0.25,
      region: 'static',
    });
    const ring = new THREE.TorusGeometry(radius, 0.022, 12, 28);
    addMesh(id, ring, valveMat, pos, [rot[0] + Math.PI / 2, rot[1], rot[2]]);

    const pivots: THREE.Group[] = [];
    const holder = new THREE.Group();
    holder.position.set(...pos);
    holder.rotation.set(...rot);
    rec.group.add(holder);

    for (let i = 0; i < leafletCount; i++) {
      const angle = (i / leafletCount) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.position.set(Math.cos(angle) * radius * 0.85, 0, Math.sin(angle) * radius * 0.85);
      pivot.rotation.y = -angle;
      const cuspGeo = new THREE.SphereGeometry(radius * 0.62, 14, 10, 0, Math.PI, 0, Math.PI * 0.5);
      cuspGeo.scale(1.0, 0.45, 0.85);
      const cusp = new THREE.Mesh(cuspGeo, valveMat);
      cusp.position.set(-radius * 0.42, 0, 0);
      cusp.userData.structureId = id;
      pivot.add(cusp);
      clickableMeshes.push(cusp);
      holder.add(pivot);
      pivots.push(pivot);
    }
    valvePivots.set(id, pivots);
  }

  buildValve('tricuspid-valve', [0.34, 0.14, 0.08], [0.1, 0, -0.2], 3, 0.15, new THREE.Vector3(0.45, 0.05, 0.15));
  buildValve('mitral-valve', [-0.24, 0.20, -0.06], [0.15, 0, 0.15], 2, 0.145, new THREE.Vector3(-0.45, 0.12, -0.15));
  buildValve('aortic-valve', [-0.11, 0.34, 0.06], [-0.1, 0, -0.12], 3, 0.125, new THREE.Vector3(-0.15, 0.35, 0.15));
  buildValve('pulmonary-valve', [0.14, 0.32, 0.28], [0.22, 0, 0.14], 3, 0.12, new THREE.Vector3(0.15, 0.35, 0.42));

  // ------------------------------------------------------------------
  // 15. EPICARDIAL CORONARY ARTERIES + CARDIAC VEINS + CORONARY SINUS
  // ------------------------------------------------------------------
  registerPart(
    'coronary-arteries',
    new THREE.Vector3(0, -0.08, 0.62),
    new THREE.Vector3(-0.04, -0.15, 0.48),
    'coronary',
    false
  );
  const corArtMat = makeMaterial(0xaa2336, {
    roughness: 0.42,
    clearcoat: 0.45,
    region: 'coronary',
  });
  const corVeinMat = makeMaterial(0x3a325c, {
    roughness: 0.48,
    clearcoat: 0.38,
    region: 'coronary',
  });

  // Arterial coronary tree seated along epicardial sulci
  const coronaryArteryPaths: Array<{ pts: THREE.Vector3[]; r: number }> = [
    // Left Main -> LAD descending along anterior interventricular sulcus
    {
      pts: [
        new THREE.Vector3(-0.06, 0.32, 0.20),
        new THREE.Vector3(0.02, 0.16, 0.42),
        new THREE.Vector3(-0.03, -0.16, 0.48),
        new THREE.Vector3(-0.16, -0.52, 0.38),
        new THREE.Vector3(-0.32, -0.82, 0.20),
      ],
      r: 0.023,
    },
    // Diagonal D1 & D2 branches across LV anterior wall
    {
      pts: [
        new THREE.Vector3(-0.01, -0.02, 0.46),
        new THREE.Vector3(-0.22, -0.16, 0.44),
        new THREE.Vector3(-0.46, -0.32, 0.28),
      ],
      r: 0.014,
    },
    {
      pts: [
        new THREE.Vector3(-0.09, -0.34, 0.43),
        new THREE.Vector3(-0.28, -0.46, 0.36),
        new THREE.Vector3(-0.44, -0.58, 0.22),
      ],
      r: 0.011,
    },
    // Left Circumflex (LCx) in left AV groove + obtuse marginal
    {
      pts: [
        new THREE.Vector3(-0.06, 0.30, 0.22),
        new THREE.Vector3(-0.34, 0.26, 0.20),
        new THREE.Vector3(-0.56, 0.16, -0.06),
        new THREE.Vector3(-0.48, 0.06, -0.34),
      ],
      r: 0.019,
    },
    {
      pts: [
        new THREE.Vector3(-0.52, 0.18, -0.02),
        new THREE.Vector3(-0.62, -0.10, -0.04),
        new THREE.Vector3(-0.54, -0.42, 0.02),
      ],
      r: 0.012,
    },
    // Right Coronary Artery (RCA) in right AV groove -> Posterior Descending Artery (PDA)
    {
      pts: [
        new THREE.Vector3(0.08, 0.28, 0.26),
        new THREE.Vector3(0.32, 0.19, 0.38),
        new THREE.Vector3(0.54, 0.06, 0.22),
        new THREE.Vector3(0.50, -0.02, -0.12),
        new THREE.Vector3(0.18, -0.06, -0.38),
        new THREE.Vector3(-0.04, -0.38, -0.36),
        new THREE.Vector3(-0.20, -0.72, -0.22),
      ],
      r: 0.021,
    },
    // Right acute marginal branch
    {
      pts: [
        new THREE.Vector3(0.46, 0.10, 0.30),
        new THREE.Vector3(0.42, -0.18, 0.34),
        new THREE.Vector3(0.28, -0.46, 0.26),
      ],
      r: 0.012,
    },
  ];

  coronaryArteryPaths.forEach(({ pts, r }) => {
    addMesh(
      'coronary-arteries',
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, r, 10, false),
      corArtMat
    );
  });

  // Great Cardiac Vein + Coronary Sinus + Middle Cardiac Vein
  const cardiacVeinPaths: Array<{ pts: THREE.Vector3[]; r: number }> = [
    {
      pts: [
        new THREE.Vector3(-0.24, -0.74, 0.26),
        new THREE.Vector3(-0.08, -0.42, 0.44),
        new THREE.Vector3(0.02, -0.04, 0.48),
        new THREE.Vector3(-0.18, 0.20, 0.32),
        new THREE.Vector3(-0.48, 0.22, 0.06),
        new THREE.Vector3(-0.42, 0.18, -0.28),
        new THREE.Vector3(0.06, 0.16, -0.36),
      ],
      r: 0.017,
    },
    {
      pts: [
        new THREE.Vector3(-0.14, -0.68, -0.24),
        new THREE.Vector3(0.0, -0.32, -0.38),
        new THREE.Vector3(0.06, 0.14, -0.36),
      ],
      r: 0.015,
    },
  ];
  cardiacVeinPaths.forEach(({ pts, r }) => {
    addMesh(
      'coronary-arteries',
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 34, r, 10, false),
      corVeinMat
    );
  });

  // ------------------------------------------------------------------
  // 3D BLOOD FLOW PATHWAYS (Optional Illustrative Mode)
  // ------------------------------------------------------------------
  const venousFlowCurves = [
    // SVC/IVC -> RA -> RV -> Pulmonary Trunk -> L/R PA
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.48, 1.38, -0.08),
      new THREE.Vector3(0.45, 0.55, -0.04),
      new THREE.Vector3(0.32, 0.12, 0.10),
      new THREE.Vector3(0.24, -0.35, 0.22),
      new THREE.Vector3(0.14, 0.26, 0.28),
      new THREE.Vector3(0.04, 0.65, 0.28),
      new THREE.Vector3(-0.16, 0.82, 0.08),
      new THREE.Vector3(-0.72, 0.80, -0.10),
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.44, -0.78, -0.25),
      new THREE.Vector3(0.44, 0.22, -0.10),
      new THREE.Vector3(0.32, 0.12, 0.10),
      new THREE.Vector3(0.22, -0.28, 0.24),
      new THREE.Vector3(0.14, 0.26, 0.28),
      new THREE.Vector3(-0.04, 0.78, 0.20),
      new THREE.Vector3(0.24, 0.80, -0.02),
      new THREE.Vector3(0.62, 0.76, -0.14),
    ]),
  ];

  const arterialFlowCurves = [
    // Pulmonary Veins -> LA -> LV -> Ascending Aorta -> Arch -> Descending
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.78, 0.62, -0.32),
      new THREE.Vector3(-0.32, 0.50, -0.24),
      new THREE.Vector3(-0.24, 0.18, -0.06),
      new THREE.Vector3(-0.26, -0.45, 0.02),
      new THREE.Vector3(-0.12, 0.26, 0.02),
      new THREE.Vector3(0.03, 1.04, 0.04),
      new THREE.Vector3(-0.12, 1.24, -0.10),
      new THREE.Vector3(-0.36, 0.90, -0.38),
      new THREE.Vector3(-0.34, -0.46, -0.50),
    ]),
  ];

  return {
    root,
    parts,
    clickableMeshes,
    valvePivots,
    venousFlowCurves,
    arterialFlowCurves,
    dispose: () => {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
    },
  };
}
