import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { AnatomyStructureId } from '../types/cardio';

export interface LoadedGltfHeart {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  meshEntries: Array<{
    mesh: THREE.Mesh;
    rawName: string;
    mappedId: AnatomyStructureId | null;
    originalMaterial: THREE.Material | THREE.Material[];
  }>;
  dispose: () => void;
}

const KEYWORD_MAP: Array<{ id: AnatomyStructureId; patterns: RegExp[] }> = [
  { id: 'left-ventricle', patterns: [/left[_\s-]*ventric/i, /\blv\b/i, /ventriculus[_\s-]*sinister/i] },
  { id: 'right-ventricle', patterns: [/right[_\s-]*ventric/i, /\brv\b/i, /ventriculus[_\s-]*dexter/i] },
  { id: 'left-atrium', patterns: [/left[_\s-]*atri/i, /\bla\b/i, /atrium[_\s-]*sinistr/i] },
  { id: 'right-atrium', patterns: [/right[_\s-]*atri/i, /\bra\b/i, /atrium[_\s-]*dextr/i] },
  { id: 'aorta', patterns: [/aort(?!.*valve)/i, /arch/i, /brachiocephalic/i, /subclavian/i, /carotid/i] },
  { id: 'pulmonary-artery', patterns: [/pulmonary[_\s-]*(arter|trunk)/i, /truncus[_\s-]*pulmonalis/i] },
  { id: 'pulmonary-veins', patterns: [/pulmonary[_\s-]*vein/i, /vena[_\s-]*pulmonalis/i] },
  { id: 'superior-vena-cava', patterns: [/superior[_\s-]*vena[_\s-]*cava/i, /\bsvc\b/i, /vena[_\s-]*cava[_\s-]*superior/i] },
  { id: 'inferior-vena-cava', patterns: [/inferior[_\s-]*vena[_\s-]*cava/i, /\bivc\b/i, /vena[_\s-]*cava[_\s-]*inferior/i] },
  { id: 'tricuspid-valve', patterns: [/tricuspid/i] },
  { id: 'mitral-valve', patterns: [/mitral/i, /bicuspid/i] },
  { id: 'aortic-valve', patterns: [/aortic[_\s-]*valve/i] },
  { id: 'pulmonary-valve', patterns: [/pulmonary[_\s-]*valve/i] },
  { id: 'interventricular-septum', patterns: [/septum/i] },
  { id: 'coronary-arteries', patterns: [/coronary/i, /\blad\b/i, /\blcx\b/i, /\brca\b/i, /cardiac[_\s-]*vein/i] },
];

export function matchMeshNameToStructure(name: string): AnatomyStructureId | null {
  for (const entry of KEYWORD_MAP) {
    if (entry.patterns.some((re) => re.test(name))) {
      return entry.id;
    }
  }
  return null;
}

export async function loadCustomHeartGltf(file: File): Promise<LoadedGltfHeart> {
  const objectUrl = URL.createObjectURL(file);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  try {
    const gltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>(
      (resolve, reject) => {
        loader.load(
          objectUrl,
          (data) => resolve({ scene: data.scene, animations: data.animations || [] }),
          undefined,
          (err) => reject(err instanceof Error ? err : new Error('Failed to parse GLB/GLTF file.'))
        );
      }
    );

    const root = gltf.scene;

    // Normalize bounding box to fit ~2.5m anatomical inspection stage
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const scaleFactor = 2.45 / maxDim;

    root.position.sub(center).multiplyScalar(scaleFactor);
    root.scale.multiplyScalar(scaleFactor);

    const meshEntries: LoadedGltfHeart['meshEntries'] = [];
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mappedId = matchMeshNameToStructure(child.name || child.parent?.name || '');
        child.userData.structureId = mappedId ?? undefined;
        child.userData.rawMeshName = child.name || 'Unnamed Submesh';

        // Clone material per mesh so highlighting/transparency never leaks across shared instances
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => m.clone());
        } else if (child.material) {
          child.material = child.material.clone();
        }

        meshEntries.push({
          mesh: child,
          rawName: child.name || 'Unnamed Submesh',
          mappedId,
          originalMaterial: Array.isArray(child.material)
            ? child.material.map((m) => m.clone())
            : child.material.clone(),
        });
      }
    });

    return {
      scene: root,
      animations: gltf.animations,
      meshEntries,
      dispose: () => {
        dracoLoader.dispose();
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material?.dispose();
          }
        });
      },
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
