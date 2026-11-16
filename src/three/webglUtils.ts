import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export function createMedicalRenderer(
  container: HTMLElement,
  isSoftwareGl: boolean
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 640, container.clientHeight || 480);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function applyStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene
): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();
  return envTex;
}

/**
 * Generates procedural striated myocardial tissue color & bump textures
 * so heart chambers have organic fibrous muscle grain rather than flat plastic color.
 */
export function createMyocardiumTextures(
  renderer: THREE.WebGLRenderer,
  baseHex: string,
  veinHex: string
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  cCtx.fillStyle = baseHex;
  cCtx.fillRect(0, 0, size, size);

  // Subtle helical myocardial fiber striations
  for (let i = 0; i < 180; i++) {
    const y = (i / 180) * size;
    cCtx.strokeStyle = i % 2 === 0 ? 'rgba(255,210,210,0.06)' : 'rgba(40,5,12,0.10)';
    cCtx.lineWidth = 1 + (i % 3) * 0.4;
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.bezierCurveTo(size * 0.33, y + 12, size * 0.66, y - 10, size, y + 4);
    cCtx.stroke();
  }

  // Fine epicardial capillary micro-branches
  cCtx.strokeStyle = veinHex;
  cCtx.globalAlpha = 0.22;
  for (let b = 0; b < 18; b++) {
    let x = (b * 37) % size;
    let y = (b * 53) % size;
    cCtx.lineWidth = 1.1;
    cCtx.beginPath();
    cCtx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += Math.sin(b + s * 1.4) * 18;
      y += Math.cos(b * 0.7 + s) * 16;
      cCtx.lineTo(x, y);
    }
    cCtx.stroke();
  }
  cCtx.globalAlpha = 1;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    const y = (i / 160) * size;
    bCtx.strokeStyle = i % 2 === 0 ? '#969696' : '#6b6b6b';
    bCtx.lineWidth = 1.2;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.bezierCurveTo(size * 0.33, y + 12, size * 0.66, y - 10, size, y + 4);
    bCtx.stroke();
  }

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAniso;

  return { map, bumpMap };
}

/**
 * Schedules next frame safely for both hardware GPUs and software WebGL renderers.
 */
export function scheduleNextFrame(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean,
  cb: () => void
): number {
  if (!isSoftwareGl) {
    return requestAnimationFrame(cb);
  }
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || typeof gl.fenceSync !== 'function') {
    return window.setTimeout(cb, 80);
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
    if (state === gl.UNSIGNALED) {
      window.setTimeout(poll, 5);
    } else {
      if (sync) gl.deleteSync(sync);
      window.setTimeout(cb, 80);
    }
  };
  return window.setTimeout(poll, 5);
}
