import * as THREE from 'three';

export interface HeartUniforms {
  uCyclePhase: { value: number };
  uContractility: { value: number };
  uAorticCompliance: { value: number };
}

export interface HeartTextureSet {
  muscleMap: THREE.CanvasTexture;
  muscleNormal: THREE.CanvasTexture;
  muscleRoughness: THREE.CanvasTexture;
  fatMap: THREE.CanvasTexture;
  vesselMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Generates high-detail 512x512 procedural PBR maps for human cardiac muscle,
 * subepicardial adipose tissue, and elastic great-vessel adventitia.
 */
export function createHeartTextureSet(maxAnisotropy = 4): HeartTextureSet {
  const size = 512;

  // 1. Myocardium Albedo (dark reddish-pink cardiac muscle with subtle fiber variation & micro-vessels)
  const mCanvas = document.createElement('canvas');
  mCanvas.width = size;
  mCanvas.height = size;
  const mCtx = mCanvas.getContext('2d')!;

  const baseGrad = mCtx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#6e1d29');
  baseGrad.addColorStop(0.5, '#7c2331');
  baseGrad.addColorStop(1, '#5a1620');
  mCtx.fillStyle = baseGrad;
  mCtx.fillRect(0, 0, size, size);

  // Subtle organic mottling patches
  for (let i = 0; i < 240; i++) {
    const x = ((i * 173) % size);
    const y = ((i * 293) % size);
    const r = 12 + (i % 28);
    const g = mCtx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, i % 3 === 0 ? 'rgba(148, 56, 68, 0.14)' : 'rgba(54, 10, 18, 0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    mCtx.fillStyle = g;
    mCtx.beginPath();
    mCtx.arc(x, y, r, 0, Math.PI * 2);
    mCtx.fill();
  }

  // Helical myocardial fascicle striations
  for (let i = 0; i < 420; i++) {
    const y = (i / 420) * size;
    mCtx.strokeStyle = i % 2 === 0 ? 'rgba(175, 86, 98, 0.09)' : 'rgba(38, 6, 12, 0.14)';
    mCtx.lineWidth = 0.8 + (i % 4) * 0.35;
    mCtx.beginPath();
    mCtx.moveTo(0, y);
    mCtx.bezierCurveTo(
      size * 0.3,
      y + Math.sin(i * 0.2) * 14,
      size * 0.7,
      y - Math.cos(i * 0.15) * 14,
      size,
      y + 6
    );
    mCtx.stroke();
  }

  // Fine subepicardial venules & arterioles
  for (let v = 0; v < 42; v++) {
    let x = (v * 61) % size;
    let y = (v * 97) % size;
    mCtx.strokeStyle = v % 3 === 0 ? 'rgba(160, 40, 56, 0.24)' : 'rgba(48, 14, 34, 0.22)';
    mCtx.lineWidth = 0.9;
    mCtx.beginPath();
    mCtx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += Math.sin(v * 1.3 + s) * 20;
      y += Math.cos(v * 0.9 + s * 1.1) * 18;
      mCtx.lineTo(x, y);
    }
    mCtx.stroke();
  }

  // 2. Normal-like Height -> Tangent Normal Map for fibrous relief
  const hCanvas = document.createElement('canvas');
  hCanvas.width = size;
  hCanvas.height = size;
  const hCtx = hCanvas.getContext('2d')!;
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 420; i++) {
    const y = (i / 420) * size;
    hCtx.strokeStyle = i % 2 === 0 ? '#9c9c9c' : '#666666';
    hCtx.lineWidth = 1.1;
    hCtx.beginPath();
    hCtx.moveTo(0, y);
    hCtx.bezierCurveTo(
      size * 0.3,
      y + Math.sin(i * 0.2) * 14,
      size * 0.7,
      y - Math.cos(i * 0.15) * 14,
      size,
      y + 6
    );
    hCtx.stroke();
  }
  const hData = hCtx.getImageData(0, 0, size, size).data;
  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);
  const strength = 2.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const ym = (y - 1 + size) % size;
      const yp = (y + 1) % size;
      const dx = (hData[(y * size + xp) * 4] - hData[(y * size + xm) * 4]) / 255;
      const dy = (hData[(yp * size + x) * 4] - hData[(ym * size + x) * 4]) / 255;
      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  // 3. Roughness Map (moist epicardium varies naturally between 0.36 and 0.68)
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#7c7c7c';
  rCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 200; i++) {
    const x = (i * 131) % size;
    const y = (i * 257) % size;
    const rad = 16 + (i % 32);
    const rg = rCtx.createRadialGradient(x, y, 2, x, y, rad);
    rg.addColorStop(0, i % 2 === 0 ? 'rgba(170,170,170,0.28)' : 'rgba(85,85,85,0.28)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    rCtx.fillStyle = rg;
    rCtx.beginPath();
    rCtx.arc(x, y, rad, 0, Math.PI * 2);
    rCtx.fill();
  }

  // 4. Epicardial Adipose (Fat) Texture (warm muted yellow-ivory lobules)
  const fCanvas = document.createElement('canvas');
  fCanvas.width = 256;
  fCanvas.height = 256;
  const fCtx = fCanvas.getContext('2d')!;
  fCtx.fillStyle = '#c4a464';
  fCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 140; i++) {
    const x = (i * 47) % 256;
    const y = (i * 83) % 256;
    fCtx.fillStyle = i % 2 === 0 ? 'rgba(218, 192, 132, 0.35)' : 'rgba(148, 114, 62, 0.25)';
    fCtx.beginPath();
    fCtx.arc(x, y, 4 + (i % 7), 0, Math.PI * 2);
    fCtx.fill();
  }

  // 5. Great Vessel Adventitia Texture (subtle longitudinal elastin weave)
  const vCanvas = document.createElement('canvas');
  vCanvas.width = 256;
  vCanvas.height = 256;
  const vCtx = vCanvas.getContext('2d')!;
  vCtx.fillStyle = '#8b3343';
  vCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 180; i++) {
    const x = (i / 180) * 256;
    vCtx.strokeStyle = i % 2 === 0 ? 'rgba(210, 140, 148, 0.08)' : 'rgba(55, 16, 24, 0.10)';
    vCtx.lineWidth = 1;
    vCtx.beginPath();
    vCtx.moveTo(x, 0);
    vCtx.lineTo(x + Math.sin(i) * 4, 256);
    vCtx.stroke();
  }

  const configureTex = (canvas: HTMLCanvasElement, isColor: boolean, repeat = 2) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  const muscleMap = configureTex(mCanvas, true, 2);
  const muscleNormal = configureTex(nCanvas, false, 2);
  const muscleRoughness = configureTex(rCanvas, false, 2);
  const fatMap = configureTex(fCanvas, true, 3);
  const vesselMap = configureTex(vCanvas, true, 2);

  return {
    muscleMap,
    muscleNormal,
    muscleRoughness,
    fatMap,
    vesselMap,
    dispose: () => {
      muscleMap.dispose();
      muscleNormal.dispose();
      muscleRoughness.dispose();
      fatMap.dispose();
      vesselMap.dispose();
    },
  };
}

export type CardiacMotionRegion = 'ventricle' | 'atrium' | 'great-vessel' | 'coronary' | 'static';

/**
 * Attaches physiological GPU vertex deformation to a MeshPhysicalMaterial via onBeforeCompile.
 * Simulates genuine ventricular helical torsion, base-to-apex shortening, and regional wall motion
 * rather than uniform whole-heart balloon scaling.
 */
export function attachCardiacMotionShader(
  material: THREE.MeshPhysicalMaterial,
  uniforms: HeartUniforms,
  region: CardiacMotionRegion
): void {
  if (region === 'static') return;

  material.customProgramCacheKey = () => `cardiac-motion-${region}`;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCyclePhase = uniforms.uCyclePhase;
    shader.uniforms.uContractility = uniforms.uContractility;
    shader.uniforms.uAorticCompliance = uniforms.uAorticCompliance;

    shader.vertexShader =
      `
      uniform float uCyclePhase;
      uniform float uContractility;
      uniform float uAorticCompliance;
      ` + shader.vertexShader;

    const motionSnippet =
      region === 'ventricle' || region === 'coronary'
        ? `
        // Ventricular systole wave (phi 0.14..0.46) with mild diastolic filling expansion
        float sysPhase = clamp((uCyclePhase - 0.14) / 0.32, 0.0, 1.0);
        float sysEnvelope = (uCyclePhase >= 0.14 && uCyclePhase <= 0.46) ? sin(sysPhase * 3.14159265) : 0.0;
        float fillEnvelope = (uCyclePhase >= 0.50) ? sin(clamp((uCyclePhase - 0.50) / 0.45, 0.0, 1.0) * 3.14159265) * 0.25 : 0.0;

        // Height factor: apex is near y = -0.95, AV base near y = +0.25
        float hNorm = clamp((transformed.y + 0.95) / 1.25, 0.0, 1.0);
        float wallWeight = sin(hNorm * 3.14159265); // strongest squeeze in mid-ventricle

        float radialFactor = 1.0 - (sysEnvelope * 0.095 * uContractility * (0.45 + 0.55 * wallWeight)) + fillEnvelope * 0.028;
        transformed.x *= radialFactor;
        transformed.z *= radialFactor;

        // Longitudinal base-to-apex shortening (AV ring descends slightly toward anchored apex)
        transformed.y -= sysEnvelope * 0.045 * hNorm * uContractility;

        // Helical apical torsion (~7 deg wringing twist)
        float twistAngle = sysEnvelope * 0.13 * (1.0 - hNorm) * uContractility;
        float ct = cos(twistAngle);
        float st = sin(twistAngle);
        float tx = transformed.x * ct - transformed.z * st;
        float tz = transformed.x * st + transformed.z * ct;
        transformed.x = tx;
        transformed.z = tz;
      `
        : region === 'atrium'
        ? `
        // Atrial systole ("atrial kick") during phi 0.00..0.13
        float atrPhase = clamp(uCyclePhase / 0.13, 0.0, 1.0);
        float atrEnvelope = (uCyclePhase <= 0.13) ? sin(atrPhase * 3.14159265) : 0.0;
        float atrExpand = (uCyclePhase > 0.14 && uCyclePhase < 0.50) ? sin(((uCyclePhase - 0.14) / 0.36) * 3.14159265) * 0.035 : 0.0;
        float s = 1.0 - atrEnvelope * 0.085 + atrExpand;
        transformed *= vec3(s, 1.0 - atrEnvelope * 0.045, s);
      `
        : `
        // Great vessel Windkessel radial systolic distension
        float pulsePhase = clamp((uCyclePhase - 0.16) / 0.34, 0.0, 1.0);
        float pulseEnv = (uCyclePhase >= 0.16 && uCyclePhase <= 0.50) ? sin(pulsePhase * 3.14159265) : 0.0;
        float rootWeight = clamp(1.0 - max(0.0, transformed.y - 0.35) * 0.55, 0.2, 1.0);
        transformed.x *= 1.0 + pulseEnv * 0.045 * uAorticCompliance * rootWeight;
        transformed.z *= 1.0 + pulseEnv * 0.045 * uAorticCompliance * rootWeight;
      `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n${motionSnippet}`
    );
  };
}
