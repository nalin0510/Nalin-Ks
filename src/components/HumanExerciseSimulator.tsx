import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Square, Activity } from 'lucide-react';
import { useSimulationStore } from '../store/useSimulationStore';
import {
  applyStudioEnvironment,
  createMedicalRenderer,
  detectSoftwareGl,
  scheduleNextFrame,
} from '../three/webglUtils';
import { ErrorBoundary } from './ErrorBoundary';
import { Heart3DViewer } from './Heart3DViewer';

function TreadmillHumanCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      const isSoftwareGl = detectSoftwareGl();
      renderer = createMedicalRenderer(mount, isSoftwareGl);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x060a13, 0.06);

      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 420;
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 60);
      camera.position.set(2.85, 1.75, 2.95);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 1.0, 0);
      controls.minDistance = 2.0;
      controls.maxDistance = 6.5;
      controls.maxPolarAngle = Math.PI * 0.49;

      const envTex = applyStudioEnvironment(renderer, scene);

      // Studio Lighting
      const keyLight = new THREE.DirectionalLight(0xfff5eb, 2.0);
      keyLight.position.set(3.2, 5.2, 3.8);
      if (!isSoftwareGl) {
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.left = -2.5;
        keyLight.shadow.camera.right = 2.5;
        keyLight.shadow.camera.top = 2.5;
        keyLight.shadow.camera.bottom = -2.5;
        keyLight.shadow.bias = -0.0005;
      }
      scene.add(keyLight);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
      scene.add(hemiLight);

      const rimLight = new THREE.DirectionalLight(0x22d3ee, 1.2);
      rimLight.position.set(-3.5, 2.5, -2.5);
      scene.add(rimLight);

      // Lab Floor Grid
      const gridHelper = new THREE.GridHelper(12, 24, 0x1e293b, 0x0f172a);
      scene.add(gridHelper);

      const floorPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 12),
        new THREE.MeshStandardMaterial({ color: 0x070b14, roughness: 0.9, metalness: 0.1 })
      );
      floorPlane.rotation.x = -Math.PI / 2;
      floorPlane.position.y = -0.01;
      floorPlane.receiveShadow = !isSoftwareGl;
      scene.add(floorPlane);

      // Motorized Treadmill Assembly
      const treadmill = new THREE.Group();
      scene.add(treadmill);

      const deckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.65 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });
      const beltMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.85, metalness: 0.1 });
      const slatMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

      const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 2.15), deckMat);
      baseDeck.position.set(0, 0.08, 0);
      baseDeck.receiveShadow = !isSoftwareGl;
      treadmill.add(baseDeck);

      const beltSurface = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 1.98), beltMat);
      beltSurface.position.set(0, 0.145, 0);
      beltSurface.receiveShadow = !isSoftwareGl;
      treadmill.add(beltSurface);

      // Animated Belt Slats
      const beltSlats: THREE.Mesh[] = [];
      const slatCount = 12;
      for (let i = 0; i < slatCount; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.006, 0.02), slatMat);
        slat.position.set(0, 0.157, -0.92 + (i / slatCount) * 1.84);
        treadmill.add(slat);
        beltSlats.push(slat);
      }

      // Uprights, Handrails & Console
      [-0.42, 0.42].forEach((x) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 1.18, 12), deckMat);
        post.position.set(x, 0.66, -0.88);
        post.rotation.x = 0.12;
        treadmill.add(post);

        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 12), chromeMat);
        rail.position.set(x, 0.96, -0.52);
        rail.rotation.x = Math.PI / 2 - 0.08;
        treadmill.add(rail);
      });

      const consoleBar = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.24), deckMat);
      consoleBar.position.set(0, 1.22, -0.82);
      consoleBar.rotation.x = -0.35;
      treadmill.add(consoleBar);

      const consoleScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.46, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
      );
      consoleScreen.position.set(0, 1.24, -0.71);
      consoleScreen.rotation.x = -0.35;
      treadmill.add(consoleScreen);

      // Articulated Biomechanical 3D Human Athlete
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6a88a, roughness: 0.55, metalness: 0.05 });
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.62, metalness: 0.18 });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.35, metalness: 0.4, emissive: 0x083344 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.45, metalness: 0.15 });

      const humanRoot = new THREE.Group();
      humanRoot.position.set(0, 0.16, 0.05);
      scene.add(humanRoot);

      const pelvis = new THREE.Group();
      pelvis.position.set(0, 0.92, 0);
      humanRoot.add(pelvis);

      const pelvisMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.12, 8, 16), suitMat);
      pelvisMesh.rotation.z = Math.PI / 2;
      pelvisMesh.castShadow = !isSoftwareGl;
      pelvis.add(pelvisMesh);

      // Torso + Ribcage
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 0.08, 0);
      pelvis.add(torsoGroup);

      const torsoGeo = new THREE.CylinderGeometry(0.165, 0.125, 0.42, 16);
      torsoGeo.scale(1.12, 1, 0.72);
      const torsoMesh = new THREE.Mesh(torsoGeo, suitMat);
      torsoMesh.position.set(0, 0.24, 0);
      torsoMesh.castShadow = !isSoftwareGl;
      torsoGroup.add(torsoMesh);

      // Telemetry Chest Sensor Strap + Glowing Cardiac Indicator on Chest
      const strapMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.168, 0.156, 0.05, 16),
        trimMat
      );
      strapMesh.scale.set(1.13, 1, 0.74);
      strapMesh.position.set(0, 0.31, 0);
      torsoGroup.add(strapMesh);

      const heartBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xf43f5e })
      );
      heartBeacon.position.set(0.05, 0.31, -0.12);
      torsoGroup.add(heartBeacon);

      // Neck & Head
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.11, 12), skinMat);
      neck.position.set(0, 0.49, 0);
      torsoGroup.add(neck);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.62, 0);
      torsoGroup.add(headGroup);

      const headGeo = new THREE.SphereGeometry(0.105, 20, 16);
      headGeo.scale(0.88, 1.12, 0.96);
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.castShadow = !isSoftwareGl;
      headGroup.add(headMesh);

      // Build Articulated Arm Helper
      function buildArm(side: number) {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.21, 0.41, 0);
        torsoGroup.add(shoulder);

        const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), suitMat);
        shoulder.add(shoulderCap);

        const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.21, 6, 12), skinMat);
        upperArm.position.set(0, -0.14, 0);
        upperArm.castShadow = !isSoftwareGl;
        shoulder.add(upperArm);

        const elbow = new THREE.Group();
        elbow.position.set(0, -0.28, 0);
        shoulder.add(elbow);

        const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.20, 6, 12), skinMat);
        forearm.position.set(0, -0.13, 0);
        forearm.castShadow = !isSoftwareGl;
        elbow.add(forearm);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), skinMat);
        hand.position.set(0, -0.26, 0);
        elbow.add(hand);

        return { shoulder, elbow };
      }

      const leftArm = buildArm(-1);
      const rightArm = buildArm(1);

      // Build Articulated Leg Helper
      function buildLeg(side: number) {
        const hip = new THREE.Group();
        hip.position.set(side * 0.105, -0.02, 0);
        pelvis.add(hip);

        const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.30, 8, 14), suitMat);
        thigh.position.set(0, -0.20, 0);
        thigh.castShadow = !isSoftwareGl;
        hip.add(thigh);

        const knee = new THREE.Group();
        knee.position.set(0, -0.42, 0);
        hip.add(knee);

        const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.30, 8, 14), skinMat);
        shin.position.set(0, -0.20, 0);
        shin.castShadow = !isSoftwareGl;
        knee.add(shin);

        const ankle = new THREE.Group();
        ankle.position.set(0, -0.42, 0);
        knee.add(ankle);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.06, 0.22), shoeMat);
        foot.position.set(0, -0.02, -0.045);
        foot.castShadow = !isSoftwareGl;
        ankle.add(foot);

        return { hip, knee, ankle };
      }

      const leftLeg = buildLeg(-1);
      const rightLeg = buildLeg(1);

      const resizeObserver = new ResizeObserver(() => {
        if (!mount) return;
        const cw = mount.clientWidth;
        const ch = mount.clientHeight;
        if (cw > 0 && ch > 0) {
          camera.aspect = cw / ch;
          camera.updateProjectionMatrix();
          renderer.setSize(cw, ch);
        }
      });
      resizeObserver.observe(mount);

      let frameId = 0;
      let lastTime = performance.now();
      let stridePhase = 0;
      let beltOffset = 0;
      let disposed = false;

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        const sim = useSimulationStore.getState();
        const speedKmh = sim.exerciseActive && sim.isRunning ? sim.exerciseSpeedKmh : 0;
        const speedMs = speedKmh / 3.6;

        // Scroll treadmill belt slats backward (+Z is behind athlete since athlete faces -Z)
        beltOffset = (beltOffset + speedMs * dt) % (1.84 / slatCount);
        for (let i = 0; i < slatCount; i++) {
          const zBase = -0.92 + (i / slatCount) * 1.84 + beltOffset;
          beltSlats[i].position.z = zBase > 0.92 ? zBase - 1.84 : zBase;
        }

        // Biomechanical Gait Kinematics (Resting -> Walking -> Jogging -> Sprinting)
        if (speedKmh > 0.15 && !sim.reducedMotion) {
          const cadenceHz = 0.8 + (speedKmh / 20) * 1.9;
          stridePhase += dt * cadenceHz * Math.PI * 2;
          const intensity = Math.min(1, speedKmh / 20);
          const isRunningGait = speedKmh > 5.5;

          const hipAmp = 0.32 + intensity * 0.68;
          const kneeBendBase = isRunningGait ? 0.35 + intensity * 0.85 : 0.25;
          const armAmp = 0.28 + intensity * 0.82;
          const elbowFlex = isRunningGait ? 1.35 + intensity * 0.25 : 0.35;

          // Vertical pelvis bounce (double frequency of stride)
          const bounceAmp = isRunningGait ? 0.045 + intensity * 0.035 : 0.018;
          pelvis.position.y = 0.90 + Math.abs(Math.sin(stridePhase)) * bounceAmp - intensity * 0.04;
          pelvis.rotation.y = Math.sin(stridePhase) * 0.08;
          torsoGroup.rotation.x = -(0.04 + intensity * 0.22); // Forward lean facing -Z
          torsoGroup.rotation.y = -Math.sin(stridePhase) * 0.11;

          // Left & Right Legs (180 deg out of phase)
          const lS = Math.sin(stridePhase);
          const rS = Math.sin(stridePhase + Math.PI);

          leftLeg.hip.rotation.x = lS * hipAmp;
          rightLeg.hip.rotation.x = rS * hipAmp;

          // Knee bends sharply during swing phase when leg lifts forward
          leftLeg.knee.rotation.x = -Math.max(0.08, -Math.cos(stridePhase) * kneeBendBase + 0.28);
          rightLeg.knee.rotation.x = -Math.max(0.08, -Math.cos(stridePhase + Math.PI) * kneeBendBase + 0.28);

          leftLeg.ankle.rotation.x = Math.sin(stridePhase + 0.5) * 0.28;
          rightLeg.ankle.rotation.x = Math.sin(stridePhase + Math.PI + 0.5) * 0.28;

          // Counter-swinging arms (opposite to same-side leg)
          leftArm.shoulder.rotation.x = rS * armAmp;
          rightArm.shoulder.rotation.x = lS * armAmp;
          leftArm.elbow.rotation.x = elbowFlex;
          rightArm.elbow.rotation.x = elbowFlex;
        } else {
          // Smooth return to standing resting breathing posture
          const breath = Math.sin(now * 0.0022) * 0.012;
          pelvis.position.y = THREE.MathUtils.damp(pelvis.position.y, 0.92 + breath, 6, dt);
          pelvis.rotation.y = THREE.MathUtils.damp(pelvis.rotation.y, 0, 6, dt);
          torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, 0, 6, dt);
          torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0, 6, dt);

          leftLeg.hip.rotation.x = THREE.MathUtils.damp(leftLeg.hip.rotation.x, 0, 6, dt);
          rightLeg.hip.rotation.x = THREE.MathUtils.damp(rightLeg.hip.rotation.x, 0, 6, dt);
          leftLeg.knee.rotation.x = THREE.MathUtils.damp(leftLeg.knee.rotation.x, -0.05, 6, dt);
          rightLeg.knee.rotation.x = THREE.MathUtils.damp(rightLeg.knee.rotation.x, -0.05, 6, dt);
          leftLeg.ankle.rotation.x = THREE.MathUtils.damp(leftLeg.ankle.rotation.x, 0, 6, dt);
          rightLeg.ankle.rotation.x = THREE.MathUtils.damp(rightLeg.ankle.rotation.x, 0, 6, dt);

          leftArm.shoulder.rotation.x = THREE.MathUtils.damp(leftArm.shoulder.rotation.x, 0, 6, dt);
          rightArm.shoulder.rotation.x = THREE.MathUtils.damp(rightArm.shoulder.rotation.x, 0, 6, dt);
          leftArm.elbow.rotation.x = THREE.MathUtils.damp(leftArm.elbow.rotation.x, 0.15, 6, dt);
          rightArm.elbow.rotation.x = THREE.MathUtils.damp(rightArm.elbow.rotation.x, 0.15, 6, dt);
        }

        // Sync chest cardiac beacon scale with shared simulation cyclePhase
        const pulse = sim.cyclePhase >= 0.14 && sim.cyclePhase <= 0.38 ? 1.45 : 1.0;
        heartBeacon.scale.setScalar(THREE.MathUtils.damp(heartBeacon.scale.x, pulse, 18, dt));

        controls.update();
        renderer.render(scene, camera);
        frameId = scheduleNextFrame(renderer, isSoftwareGl, tick);
      };

      frameId = scheduleNextFrame(renderer, isSoftwareGl, tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.dispose();
        envTex.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material?.dispose();
          }
        });
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'Unable to initialize 3D treadmill viewport.');
    }
  }, []);

  if (webglError) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-slate-800 bg-[#0B111E] p-6 text-center text-xs text-slate-400">
        {webglError}
      </div>
    );
  }

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#060A13]">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-3 left-3 text-xs text-slate-300">
        <span className="font-semibold text-slate-100">3D Gait &amp; Treadmill Kinematics</span>
        <span className="mx-1.5 text-slate-600">·</span>
        <span className="text-slate-400">Drag to orbit</span>
      </div>
    </div>
  );
}

const MODE_PRESETS: Array<{ label: string; speed: number }> = [
  { label: 'Resting', speed: 0 },
  { label: 'Walking', speed: 4.5 },
  { label: 'Light Jogging', speed: 8.0 },
  { label: 'Moderate Running', speed: 12.5 },
  { label: 'High-Intensity', speed: 17.5 },
];

export function HumanExerciseSimulator() {
  const {
    exerciseActive,
    exerciseRecovering,
    exerciseSpeedKmh,
    exerciseElapsedSec,
    exerciseDurationTargetSec,
    exerciseMode,
    snapshot,
    startExercise,
    pauseExercise,
    resumeExercise,
    stopExercise,
    resetExercise,
    setExerciseSpeed,
    setExerciseDurationTarget,
    triggerRecoveryMode,
  } = useSimulationStore();

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Human Exercise Physiology Laboratory
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Synchronized 3D treadmill gait kinematics coupled to time-varying cardiac output, stroke volume, and vascular resistance.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <span>Mode: <strong className="text-cyan-300 capitalize">{exerciseMode.replace('-', ' ')}</strong></span>
          <span className="text-slate-600">/</span>
          <span>Elapsed: {formatTimer(exerciseElapsedSec)}</span>
        </div>
      </div>

      {/* Side-by-Side 3D Running Human & Beating Anatomical Heart + Animated Data Link */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-11">
        <div className="lg:col-span-5">
          <ErrorBoundary fallbackTitle="3D Human Simulator">
            <TreadmillHumanCanvas />
          </ErrorBoundary>
        </div>

        {/* Central Telemetry Conduit Linking Athlete to Heart */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-800 bg-[#0B111E] p-4 lg:col-span-1">
          <Activity className="h-5 w-5 text-cyan-400" />
          <div className="h-12 w-px bg-gradient-to-b from-cyan-500/20 via-cyan-400 to-rose-500/80 hidden lg:block" />
          <div className="text-center font-mono">
            <div className="text-[11px] text-slate-400">HR</div>
            <div className="text-base font-bold text-rose-400">{Math.round(snapshot.heartRate)}</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-[11px] text-slate-400">CO</div>
            <div className="text-sm font-bold text-cyan-300">{snapshot.cardiacOutput.toFixed(2)}</div>
          </div>
          <div className="h-12 w-px bg-gradient-to-b from-rose-500/80 via-cyan-400 to-cyan-500/20 hidden lg:block" />
        </div>

        <div className="lg:col-span-5">
          <Heart3DViewer compact />
        </div>
      </div>

      {/* Exercise Control Console & Live Synchronized Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-100">Treadmill &amp; Protocol Controls</h3>
            <div className="flex flex-wrap items-center gap-2">
              {!exerciseActive ? (
                <button
                  type="button"
                  onClick={exerciseElapsedSec > 0 ? resumeExercise : startExercise}
                  className="flex items-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-400 whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{exerciseElapsedSec > 0 ? 'Resume Exercise' : 'Start Exercise'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseExercise}
                  className="flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/25 whitespace-nowrap"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={stopExercise}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:border-rose-500/60 hover:text-rose-300 whitespace-nowrap"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Stop</span>
              </button>

              <button
                type="button"
                onClick={triggerRecoveryMode}
                className={`rounded-md border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  exerciseRecovering
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-emerald-500/50'
                }`}
              >
                Recovery Mode
              </button>

              <button
                type="button"
                onClick={resetExercise}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Speed Slider (0 - 20 km/h) */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Treadmill Running Speed</span>
              <span className="font-mono text-base font-bold text-cyan-300">
                {exerciseSpeedKmh.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={exerciseSpeedKmh}
              onChange={(e) => setExerciseSpeed(parseFloat(e.target.value))}
              className="lab-slider w-full"
            />
            <div className="flex justify-between font-mono text-[11px] text-slate-500">
              <span>0 km/h</span>
              <span>5 km/h</span>
              <span>10 km/h</span>
              <span>15 km/h</span>
              <span>20 km/h</span>
            </div>
          </div>

          {/* Mode Presets */}
          <div className="mt-5 flex flex-wrap gap-2">
            {MODE_PRESETS.map((preset) => {
              const active = Math.abs(exerciseSpeedKmh - preset.speed) < 0.8 && !exerciseRecovering;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setExerciseSpeed(preset.speed)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                      : 'border-slate-700/80 bg-slate-900 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {preset.label} ({preset.speed} km/h)
                </button>
              );
            })}
          </div>

          {/* Target Duration */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs">
            <span className="text-slate-400">Session Duration Target</span>
            <div className="flex items-center gap-2">
              {[300, 600, 1200, 1800].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setExerciseDurationTarget(sec)}
                  className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                    exerciseDurationTargetSec === sec
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec / 60}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulated Physiological Response */}
        <div className="rounded-xl border border-slate-800 bg-[#0B111E] p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Simulated Exercise Response</h3>
            <span className="text-[11px] font-mono text-slate-400">Illustrative Model</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-3">
              <div className="text-[11px] text-slate-400">Heart Rate</div>
              <div className="mt-1 font-mono text-xl font-bold text-rose-400">
                {Math.round(snapshot.heartRate)} <span className="text-xs font-normal text-slate-400">BPM</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-3">
              <div className="text-[11px] text-slate-400">Cardiac Output</div>
              <div className="mt-1 font-mono text-xl font-bold text-cyan-300">
                {snapshot.cardiacOutput.toFixed(2)} <span className="text-xs font-normal text-slate-400">L/min</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-3">
              <div className="text-[11px] text-slate-400">Stroke Volume</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-100">
                {snapshot.strokeVolume.toFixed(1)} <span className="text-xs font-normal text-slate-400">mL</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800/80 bg-[#070B14] p-3">
              <div className="text-[11px] text-slate-400">Simulated BP</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-100">
                {snapshot.systolicBp}/{snapshot.diastolicBp}{' '}
                <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs leading-relaxed text-slate-400">
            <p>
              <strong className="text-slate-200">Physiological Mechanism:</strong> Dynamic running increases sympathetic drive (raising heart rate and contractility), boosts venous return via the skeletal muscle pump (raising EDV), and vasodilates active muscle arterioles (lowering systemic vascular resistance).
            </p>
            <p className="text-[11px] text-amber-300/90">
              Note: Running speed alone cannot accurately determine an individual&apos;s true cardiovascular measurements. Outputs above are hypothetical model estimates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
