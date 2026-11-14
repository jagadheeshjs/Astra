import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HealthStatus } from '../types/astra';

interface OrbitalEarthCardProps {
  missionName: string;
  altitudeKm: number;
  crewStatus: HealthStatus;
  isMonitoring: boolean;
}

function createProceduralEarthTextures(): {
  albedo: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  clouds: THREE.CanvasTexture;
} {
  const width = 512;
  const height = 256;

  // 1. Albedo & Land/Ocean Roughness Canvases
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const aCtx = albedoCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = aCtx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0C2D59');
  oceanGrad.addColorStop(0.5, '#0A2246');
  oceanGrad.addColorStop(1, '#0C2D59');
  aCtx.fillStyle = oceanGrad;
  aCtx.fillRect(0, 0, width, height);

  // Ocean is smoother (darker roughness)
  rCtx.fillStyle = '#383838';
  rCtx.fillRect(0, 0, width, height);

  // Stylized continent silhouettes (procedural aerospace globe aesthetic)
  const continents: [number, number, number, number, number][] = [
    // [cx, cy, rx, ry, rot]
    [115, 86, 44, 28, -0.25], // N America
    [136, 108, 22, 16, 0.3],
    [158, 162, 24, 38, 0.2], // S America
    [262, 76, 36, 20, 0.08], // Europe
    [270, 134, 34, 40, -0.1], // Africa
    [358, 86, 68, 34, 0.12], // Asia
    [392, 128, 24, 18, -0.2], // SE Asia
    [412, 178, 28, 18, 0.15], // Australia
    [200, 44, 24, 12, -0.2], // Greenland
  ];

  continents.forEach(([cx, cy, rx, ry, rot], idx) => {
    aCtx.save();
    aCtx.translate(cx, cy);
    aCtx.rotate(rot);
    const landGrad = aCtx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
    landGrad.addColorStop(0, '#2B6CB0');
    landGrad.addColorStop(0.7, '#1E4E8C');
    landGrad.addColorStop(1, '#1A3E73');
    aCtx.fillStyle = landGrad;
    aCtx.beginPath();
    aCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    aCtx.fill();

    // Subtle coastline cyan rim
    aCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    aCtx.lineWidth = 1.5;
    aCtx.stroke();
    aCtx.restore();

    // Land is rougher
    rCtx.save();
    rCtx.translate(cx, cy);
    rCtx.rotate(rot);
    rCtx.fillStyle = idx % 2 === 0 ? '#B8B8B8' : '#A6A6A6';
    rCtx.beginPath();
    rCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.restore();
  });

  // Subtle aerospace telemetry lat/lon grid
  aCtx.strokeStyle = 'rgba(125, 211, 252, 0.14)';
  aCtx.lineWidth = 1;
  for (let x = 0; x <= width; x += 32) {
    aCtx.beginPath();
    aCtx.moveTo(x, 0);
    aCtx.lineTo(x, height);
    aCtx.stroke();
  }
  for (let y = 0; y <= height; y += 32) {
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(width, y);
    aCtx.stroke();
  }

  // Subtle polar ice caps
  const iceTop = aCtx.createLinearGradient(0, 0, 0, 26);
  iceTop.addColorStop(0, 'rgba(186, 230, 253, 0.65)');
  iceTop.addColorStop(1, 'rgba(186, 230, 253, 0)');
  aCtx.fillStyle = iceTop;
  aCtx.fillRect(0, 0, width, 26);

  const iceBottom = aCtx.createLinearGradient(0, height - 26, 0, height);
  iceBottom.addColorStop(0, 'rgba(186, 230, 253, 0)');
  iceBottom.addColorStop(1, 'rgba(186, 230, 253, 0.65)');
  aCtx.fillStyle = iceBottom;
  aCtx.fillRect(0, height - 26, width, 26);

  // 2. Clouds Canvas
  const cloudsCanvas = document.createElement('canvas');
  cloudsCanvas.width = width;
  cloudsCanvas.height = height;
  const cCtx = cloudsCanvas.getContext('2d')!;
  cCtx.clearRect(0, 0, width, height);

  for (let i = 0; i < 42; i++) {
    const x = ((i * 73) % (width - 40)) + 20;
    const y = ((i * 41) % (height - 40)) + 20;
    const rx = 18 + (i % 5) * 9;
    const ry = 4 + (i % 3) * 3;
    const grad = cCtx.createRadialGradient(x, y, 2, x, y, rx);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.28)');
    grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
    cCtx.fillStyle = grad;
    cCtx.beginPath();
    cCtx.ellipse(x, y, rx, ry, (i % 4) * 0.2, 0, Math.PI * 2);
    cCtx.fill();
  }

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;

  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS = THREE.RepeatWrapping;

  const clouds = new THREE.CanvasTexture(cloudsCanvas);
  clouds.colorSpace = THREE.SRGBColorSpace;
  clouds.wrapS = THREE.RepeatWrapping;

  return { albedo, roughness, clouds };
}

function buildOrbitalStationGroup(): THREE.Group {
  const station = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.72,
    roughness: 0.28,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    metalness: 0.4,
    roughness: 0.45,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    metalness: 0.85,
    roughness: 0.18,
  });

  // 1. Pressurized Core Module
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.11, 14), hullMat);
  core.rotation.z = Math.PI / 2;
  station.add(core);

  // 2. Docking Collar Ring
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.004, 8, 16), collarMat);
  collar.rotation.y = Math.PI / 2;
  station.add(collar);

  // 3. Cross Truss
  const truss = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.18), hullMat);
  station.add(truss);

  // 4 & 5. Dual Solar Arrays
  const panelGeo = new THREE.BoxGeometry(0.048, 0.003, 0.075);
  const wingLeft = new THREE.Mesh(panelGeo, solarMat);
  wingLeft.position.set(0, 0, 0.085);
  station.add(wingLeft);

  const wingRight = new THREE.Mesh(panelGeo, solarMat);
  wingRight.position.set(0, 0, -0.085);
  station.add(wingRight);

  return station;
}

export const OrbitalEarthCard: React.FC<OrbitalEarthCardProps> = ({
  missionName,
  altitudeKm,
  crewStatus,
  isMonitoring,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointerTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Probe WebGL availability and software GL status
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl =
        (probeCanvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
        (probeCanvas.getContext('webgl') as WebGLRenderingContext | null);
      if (!gl) {
        setWebglUnavailable(true);
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = container.clientWidth || 360;
    let height = container.clientHeight || 240;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x0b1628, 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1628);
    scene.fog = new THREE.FogExp2(0x0b1628, 0.042);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.55, 4.45);
    camera.lookAt(0, 0, 0);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Warm Sun Key + Cool Hemisphere Fill + Subtle Rim Light
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0b1528, 0.75);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.1);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-4, -1.5, -3);
    scene.add(rimLight);

    // Lightweight Starfield via InstancedMesh
    const starCount = 110;
    const starGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    const starMesh = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const theta = ((i * 137.5) % 360) * (Math.PI / 180);
      const phi = Math.acos(1 - (2 * ((i + 0.5) / starCount)));
      const rad = 7.5 + (i % 5) * 0.8;
      dummy.position.set(
        rad * Math.sin(phi) * Math.cos(theta),
        rad * Math.cos(phi),
        rad * Math.sin(phi) * Math.sin(theta) - 2
      );
      const scale = 0.55 + (i % 4) * 0.25;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    starMesh.computeBoundingSphere();
    scene.add(starMesh);

    // Root Orbital System Group (responds gently to pointer)
    const systemGroup = new THREE.Group();
    scene.add(systemGroup);

    // Procedural Earth Textures
    const { albedo, roughness, clouds } = createProceduralEarthTextures();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    albedo.anisotropy = maxAniso;
    clouds.anisotropy = maxAniso;

    // 1. Earth Globe
    const earthGeo = new THREE.SphereGeometry(1.12, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: albedo,
      roughnessMap: roughness,
      roughness: 0.72,
      metalness: 0.14,
      envMapIntensity: 0.7,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.y = -1.6;
    systemGroup.add(earthMesh);

    // 2. Cloud Layer
    const cloudGeo = new THREE.SphereGeometry(1.148, 40, 40);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: clouds,
      transparent: true,
      opacity: 0.72,
      roughness: 0.9,
      metalness: 0.0,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    systemGroup.add(cloudMesh);

    // 3. Atmospheric Fresnel Glow Shell
    const atmosGeo = new THREE.SphereGeometry(1.24, 40, 40);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x55b9e8) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 viewDir = normalize(vViewPos);
          float fresnel = pow(0.66 - dot(vNormal, viewDir), 3.2);
          float alpha = clamp(fresnel * 0.75, 0.0, 0.65);
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    systemGroup.add(atmosMesh);

    // 4. Orbital Rings & Markers
    const orbitConfigs = [
      { radius: 1.46, tiltX: 0.42, tiltZ: 0.28, color: 0x55b9e8, opacity: 0.6 },
      { radius: 1.62, tiltX: -0.58, tiltZ: 0.52, color: 0x2878c7, opacity: 0.4 },
      { radius: 1.76, tiltX: 0.85, tiltZ: -0.36, color: 0x55b9e8, opacity: 0.24 },
    ];

    const orbitRingGeos: THREE.TorusGeometry[] = [];
    const orbitRingMats: THREE.MeshBasicMaterial[] = [];
    const orbitGroups: THREE.Group[] = [];

    orbitConfigs.forEach((cfg) => {
      const grp = new THREE.Group();
      grp.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
      const rGeo = new THREE.TorusGeometry(cfg.radius, 0.0055, 8, 96);
      const rMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
      });
      orbitRingGeos.push(rGeo);
      orbitRingMats.push(rMat);
      const ringMesh = new THREE.Mesh(rGeo, rMat);
      ringMesh.rotation.x = Math.PI / 2;
      grp.add(ringMesh);
      systemGroup.add(grp);
      orbitGroups.push(grp);
    });

    // Primary Multi-Part Spacecraft Station on Orbit 1
    const stationGroup = buildOrbitalStationGroup();
    orbitGroups[0].add(stationGroup);

    // Secondary Orbital Relay Beacons on Orbit 2 & 3
    const beaconGeo = new THREE.OctahedronGeometry(0.032, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.65,
      metalness: 0.6,
      roughness: 0.25,
    });
    const beacon2 = new THREE.Mesh(beaconGeo, beaconMat);
    const beacon3 = new THREE.Mesh(beaconGeo, beaconMat);
    orbitGroups[1].add(beacon2);
    orbitGroups[2].add(beacon3);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize observer for responsive container fit
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 360;
      height = container.clientHeight || 240;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    // Animation loop with software WebGL pacing
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (!prefersReducedMotion) {
        elapsed += dt;
        earthMesh.rotation.y += dt * 0.11;
        cloudMesh.rotation.y += dt * 0.145;

        // Orbiting station along Orbit 1
        const angle1 = elapsed * 0.55;
        stationGroup.position.set(
          Math.cos(angle1) * orbitConfigs[0].radius,
          0,
          Math.sin(angle1) * orbitConfigs[0].radius
        );
        stationGroup.rotation.y = -angle1;

        // Orbiting beacons
        const angle2 = elapsed * -0.42 + 1.4;
        beacon2.position.set(
          Math.cos(angle2) * orbitConfigs[1].radius,
          0,
          Math.sin(angle2) * orbitConfigs[1].radius
        );

        const angle3 = elapsed * 0.34 + 3.1;
        beacon3.position.set(
          Math.cos(angle3) * orbitConfigs[2].radius,
          0,
          Math.sin(angle3) * orbitConfigs[2].radius
        );
      } else {
        // Static clean resting orbital positions when reduced motion is preferred
        stationGroup.position.set(orbitConfigs[0].radius, 0, 0);
        beacon2.position.set(-orbitConfigs[1].radius * 0.7, 0, orbitConfigs[1].radius * 0.7);
        beacon3.position.set(orbitConfigs[2].radius * 0.6, 0, -orbitConfigs[2].radius * 0.8);
      }

      // Smooth damped pointer parallax
      const targetRotX = pointerTargetRef.current.y * 0.24;
      const targetRotY = pointerTargetRef.current.x * 0.28;
      systemGroup.rotation.x = THREE.MathUtils.damp(systemGroup.rotation.x, targetRotX, 5, dt);
      systemGroup.rotation.y = THREE.MathUtils.damp(systemGroup.rotation.y, targetRotY, 5, dt);

      renderer.render(scene, camera);

      if (prefersReducedMotion) {
        return; // Render once cleanly for reduced motion unless pointer moves
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();

      earthGeo.dispose();
      earthMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
      orbitRingGeos.forEach((g) => g.dispose());
      orbitRingMats.forEach((m) => m.dispose());
      stationGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material.dispose();
        }
      });
      albedo.dispose();
      roughness.dispose();
      clouds.dispose();
      envTexture.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTargetRef.current = { x: nx, y: ny };
  };

  const handlePointerLeave = () => {
    pointerTargetRef.current = { x: 0, y: 0 };
  };

  const statusColor =
    crewStatus === 'WARNING'
      ? 'text-[#F4B6B6]'
      : crewStatus === 'ATTENTION'
        ? 'text-[#F5D098]'
        : 'text-[#55B9E8]';

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-[#0B1628] border border-[#1E3354] shadow-xs h-64 sm:h-72 select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Subtle top blue/cyan accent edge integrating with light dashboard */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{ background: 'linear-gradient(90deg, #2878C7 0%, #55B9E8 55%, #2878C7 100%)' }}
        aria-hidden="true"
      />
      {webglUnavailable ? (
        /* Static SVG Fallback if WebGL is unavailable */
        <div className="w-full h-full flex items-center justify-center bg-[#0B1628] p-6">
          <svg
            viewBox="0 0 220 220"
            className="w-44 h-44"
            aria-label="Stylized Orbital Globe Fallback"
          >
            <defs>
              <radialGradient id="earthFallback" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#2878C7" />
                <stop offset="65%" stopColor="#102C52" />
                <stop offset="100%" stopColor="#09172B" />
              </radialGradient>
            </defs>
            <circle cx="110" cy="110" r="76" fill="none" stroke="#1E3A63" strokeDasharray="4 4" />
            <ellipse
              cx="110"
              cy="110"
              rx="96"
              ry="34"
              transform="rotate(-22 110 110)"
              fill="none"
              stroke="#55B9E8"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <circle cx="110" cy="110" r="56" fill="url(#earthFallback)" stroke="#55B9E8" strokeOpacity="0.45" />
            <circle cx="176" cy="82" r="4" fill="#55B9E8" />
          </svg>
        </div>
      ) : (
        <div ref={mountRef} className="w-full h-full" />
      )}

      {/* Clean Solid/Translucent Non-Blur HUD Labels (No backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-mono">
        <div className="px-2.5 py-1 rounded-md bg-[#101D32]/90 border border-[#2878C7]/40 text-slate-200">
          {missionName} · {altitudeKm} km LEO
        </div>
        <div
          className={`px-2.5 py-1 rounded-md bg-[#101D32]/90 border border-[#2878C7]/40 ${statusColor}`}
        >
          {isMonitoring ? 'Telemetry Active' : 'Orbit Standby'}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-slate-400">
        <span>Interactive 3D Orbital View</span>
        <span className="font-mono text-[#55B9E8]/90">Simulated Position</span>
      </div>
    </div>
  );
};
