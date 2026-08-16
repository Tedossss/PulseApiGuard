'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import type {
  BufferGeometry,
  Group,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import styles from './DreamDepthField.module.css';

export type DreamDepthFieldProps = {
  activeIndex: number;
  mode: 'dream' | 'evidence';
  disabled?: boolean;
};

type ThreeModule = typeof import('three');
type Point2 = readonly [number, number];
type MotionTarget = Pick<DreamDepthFieldProps, 'activeIndex' | 'mode'>;

type Station = {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
};

type Mark = {
  strokes: readonly (readonly Point2[])[];
  nodes: readonly Point2[];
};

type LandmarkRuntime = {
  group: Group;
  baseY: number;
  baseRotationY: number;
  frameMaterial: LineBasicMaterial;
  detailMaterial: LineBasicMaterial;
  planeMaterial: MeshBasicMaterial;
  nodeMaterial: MeshBasicMaterial;
};

const STATIONS: readonly Station[] = [
  { x: -1.58, y: 0.22, z: 0, rotationX: -0.04, rotationY: 0.13, rotationZ: -0.025 },
  { x: 1.08, y: 0.82, z: -1.9, rotationX: 0.03, rotationY: -0.17, rotationZ: 0.04 },
  { x: -0.72, y: -0.72, z: -3.8, rotationX: -0.025, rotationY: 0.14, rotationZ: -0.018 },
  { x: 1.34, y: -0.16, z: -5.7, rotationX: 0.025, rotationY: -0.11, rotationZ: 0.032 },
  { x: -1.34, y: 0.68, z: -7.6, rotationX: -0.03, rotationY: 0.16, rotationZ: -0.038 },
  { x: 0.62, y: -0.64, z: -9.5, rotationX: 0.035, rotationY: -0.14, rotationZ: 0.022 },
] as const;

const MARKS: readonly Mark[] = [
  {
    strokes: [
      [[-0.78, 0], [-0.48, 0], [-0.3, 0.31], [-0.08, -0.35], [0.14, 0.19], [0.32, 0], [0.78, 0]],
      [[-0.78, -0.34], [-0.5, -0.34]],
    ],
    nodes: [[-0.48, 0], [-0.08, -0.35], [0.32, 0]],
  },
  {
    strokes: [
      [[-0.67, -0.28], [-0.08, 0.31], [0.61, -0.12]],
      [[-0.67, -0.28], [0.18, -0.36], [0.61, -0.12]],
      [[-0.08, 0.31], [0.18, -0.36]],
    ],
    nodes: [[-0.67, -0.28], [-0.08, 0.31], [0.18, -0.36], [0.61, -0.12]],
  },
  {
    strokes: [
      [[-0.7, 0.29], [0.34, 0.29], [0.34, -0.16], [-0.7, -0.16], [-0.7, 0.29]],
      [[-0.39, 0.08], [0.65, 0.08], [0.65, -0.37], [-0.39, -0.37], [-0.39, 0.08]],
    ],
    nodes: [[-0.7, 0.29], [0.34, -0.16], [0.65, -0.37]],
  },
  {
    strokes: [
      [[-0.76, 0.25], [-0.53, -0.19], [-0.3, 0.22], [-0.06, -0.2], [0.18, 0.2], [0.42, -0.22], [0.69, 0.23]],
      [[-0.76, -0.36], [0.69, -0.36]],
    ],
    nodes: [[-0.53, -0.19], [-0.06, -0.2], [0.42, -0.22]],
  },
  {
    strokes: [
      [[-0.71, 0.34], [-0.71, -0.34], [-0.46, -0.34], [-0.46, 0.34]],
      [[-0.33, 0.23], [-0.33, -0.34], [-0.02, -0.34], [-0.02, 0.23]],
      [[0.12, 0.38], [0.12, -0.34], [0.38, -0.34], [0.38, 0.38]],
      [[0.5, 0.14], [0.5, -0.34], [0.71, -0.34], [0.71, 0.14]],
    ],
    nodes: [[-0.71, 0.34], [-0.02, 0.23], [0.38, 0.38]],
  },
  {
    strokes: [
      [[-0.7, 0], [-0.35, 0.32], [0, 0], [0.35, 0.32], [0.7, 0]],
      [[-0.7, 0], [-0.35, -0.32], [0, 0], [0.35, -0.32], [0.7, 0]],
      [[-0.35, 0.32], [-0.35, -0.32]],
      [[0.35, 0.32], [0.35, -0.32]],
    ],
    nodes: [[-0.7, 0], [-0.35, 0.32], [-0.35, -0.32], [0, 0], [0.35, 0.32], [0.35, -0.32], [0.7, 0]],
  },
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const damp = (from: number, to: number, rate: number, delta: number) =>
  from + (to - from) * (1 - Math.exp(-rate * delta));

function normalizedIndex(value: number) {
  return Number.isFinite(value) ? clamp(Math.round(value), 0, STATIONS.length - 1) : 0;
}

function canCreateWebGLContext() {
  try {
    const probe = document.createElement('canvas');
    const attributes: WebGLContextAttributes = {
      alpha: true,
      failIfMajorPerformanceCaveat: true,
      powerPreference: 'high-performance',
    };
    const context = (
      probe.getContext('webgl2', attributes) ?? probe.getContext('webgl', attributes)
    ) as WebGL2RenderingContext | WebGLRenderingContext | null;
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function disposeResources(
  scene: Scene | undefined,
  renderer: WebGLRenderer | undefined,
  geometries: readonly BufferGeometry[],
  materials: readonly Material[],
) {
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  scene?.clear();
  renderer?.renderLists.dispose();
  renderer?.dispose();
}

function createAtlasRuntime(
  THREE: ThreeModule,
  canvas: HTMLCanvasElement,
  targetRef: MutableRefObject<MotionTarget>,
) {
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const landmarks: LandmarkRuntime[] = [];
  const routeNodes: Mesh[] = [];
  let renderer: WebGLRenderer | undefined;
  let scene: Scene | undefined;
  let camera: PerspectiveCamera | undefined;
  let atlas: Group | undefined;
  let routeMaterial: LineBasicMaterial | undefined;
  let routeNodeMaterial: MeshBasicMaterial | undefined;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(39, 1, 0.1, 36);
    camera.position.set(0, 0, 6.4);
    atlas = new THREE.Group();
    scene.add(atlas);

    const createLine = (
      points: readonly Point2[],
      material: LineBasicMaterial,
      z = 0.035,
      closed = false,
    ) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(([x, y]) => new THREE.Vector3(x, y, z)),
      );
      geometries.push(geometry);
      return closed
        ? new THREE.LineLoop(geometry, material)
        : new THREE.Line(geometry, material);
    };

    STATIONS.forEach((station, index) => {
      const group = new THREE.Group();
      group.position.set(station.x, station.y, station.z);
      group.rotation.set(station.rotationX, station.rotationY, station.rotationZ);

      const frameMaterial = new THREE.LineBasicMaterial({
        color: 0x092d66,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        toneMapped: false,
      });
      const detailMaterial = new THREE.LineBasicMaterial({
        color: 0x087ed2,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        toneMapped: false,
      });
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xf4f0e7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.025,
        depthWrite: false,
        toneMapped: false,
      });
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0x087ed2,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        toneMapped: false,
      });
      materials.push(frameMaterial, detailMaterial, planeMaterial, nodeMaterial);

      const planeGeometry = new THREE.PlaneGeometry(2.08, 1.22);
      geometries.push(planeGeometry);
      group.add(new THREE.Mesh(planeGeometry, planeMaterial));

      group.add(createLine(
        [[-1.04, -0.61], [1.04, -0.61], [1.04, 0.61], [-1.04, 0.61]],
        frameMaterial,
        0.025,
        true,
      ));
      group.add(createLine([[-0.86, -0.47], [0.86, -0.47]], frameMaterial));

      MARKS[index].strokes.forEach((stroke) => group.add(createLine(stroke, detailMaterial, 0.045)));

      const nodeGeometry = new THREE.RingGeometry(0.026, 0.046, 16);
      geometries.push(nodeGeometry);
      MARKS[index].nodes.forEach(([x, y]) => {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, y, 0.052);
        group.add(node);
      });

      const registrationGeometry = new THREE.RingGeometry(0.052, 0.072, 20);
      geometries.push(registrationGeometry);
      const registration = new THREE.Mesh(registrationGeometry, nodeMaterial);
      registration.position.set(0.86, -0.47, 0.052);
      group.add(registration);

      atlas?.add(group);
      landmarks.push({
        group,
        baseY: station.y,
        baseRotationY: station.rotationY,
        frameMaterial,
        detailMaterial,
        planeMaterial,
        nodeMaterial,
      });
    });

    const routeCurve = new THREE.CatmullRomCurve3(
      STATIONS.map((station) => new THREE.Vector3(station.x + 0.86, station.y - 0.47, station.z + 0.06)),
      false,
      'catmullrom',
      0.28,
    );
    const routeGeometry = new THREE.BufferGeometry().setFromPoints(routeCurve.getPoints(108));
    geometries.push(routeGeometry);
    routeMaterial = new THREE.LineBasicMaterial({
      color: 0x087ed2,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      toneMapped: false,
    });
    materials.push(routeMaterial);
    atlas.add(new THREE.Line(routeGeometry, routeMaterial));

    const routeNodeGeometry = new THREE.SphereGeometry(0.038, 10, 8);
    geometries.push(routeNodeGeometry);
    routeNodeMaterial = new THREE.MeshBasicMaterial({
      color: 0x087ed2,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      toneMapped: false,
    });
    materials.push(routeNodeMaterial);
    STATIONS.forEach((station) => {
      const node = new THREE.Mesh(routeNodeGeometry, routeNodeMaterial);
      node.position.set(station.x + 0.86, station.y - 0.47, station.z + 0.06);
      atlas?.add(node);
      routeNodes.push(node);
    });
  } catch (error) {
    disposeResources(scene, renderer, geometries, materials);
    throw error;
  }

  if (!renderer || !scene || !camera || !atlas || !routeMaterial || !routeNodeMaterial) {
    disposeResources(scene, renderer, geometries, materials);
    throw new Error('Dream depth field could not be initialized.');
  }

  const liveRenderer = renderer;
  const liveScene = scene;
  const liveCamera = camera;
  const liveAtlas = atlas;
  const liveRouteMaterial = routeMaterial;
  const liveRouteNodeMaterial = routeNodeMaterial;
  const navy = new THREE.Color(0x092d66);
  const activeBlue = new THREE.Color(0x087ed2);
  const cream = new THREE.Color(0xfffcf3);
  const focusPosition = new THREE.Vector3();
  let currentIndex = normalizedIndex(targetRef.current.activeIndex);
  let modeBlend = targetRef.current.mode === 'dream' ? 1 : 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let frame = 0;
  let disposed = false;
  let contextAvailable = true;
  let visible = !document.hidden;
  let lastTime = performance.now();
  let lastWidth = 0;
  let lastHeight = 0;
  let lastDpr = 0;

  const stop = () => {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
  };

  const resize = () => {
    if (disposed || !contextAvailable) return;
    const width = Math.max(1, Math.round(canvas.clientWidth || window.innerWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight || window.innerHeight));
    const dpr = Math.min(1.35, Math.max(1, window.devicePixelRatio || 1));
    if (width === lastWidth && height === lastHeight && dpr === lastDpr) return;
    lastWidth = width;
    lastHeight = height;
    lastDpr = dpr;
    liveRenderer.setPixelRatio(dpr);
    liveRenderer.setSize(width, height, false);
    liveCamera.aspect = width / height;
    liveCamera.updateProjectionMatrix();
  };

  const draw = (time: number) => {
    const delta = Math.min(0.05, Math.max(0.001, (time - lastTime) * 0.001));
    lastTime = time;
    const targetIndex = normalizedIndex(targetRef.current.activeIndex);
    const targetMode = targetRef.current.mode === 'dream' ? 1 : 0;
    currentIndex = damp(currentIndex, targetIndex, 4.4, delta);
    modeBlend = damp(modeBlend, targetMode, 4.8, delta);
    pointerX = damp(pointerX, targetPointerX, 3.6, delta);
    pointerY = damp(pointerY, targetPointerY, 3.6, delta);

    const lowerIndex = Math.floor(currentIndex);
    const upperIndex = Math.min(STATIONS.length - 1, lowerIndex + 1);
    const stationProgress = smoothstep(currentIndex - lowerIndex);
    const lower = STATIONS[lowerIndex];
    const upper = STATIONS[upperIndex];
    focusPosition.set(
      mix(lower.x, upper.x, stationProgress),
      mix(lower.y, upper.y, stationProgress),
      mix(lower.z, upper.z, stationProgress),
    );
    liveAtlas.position.set(
      -focusPosition.x + mix(-0.92, -0.2, modeBlend),
      -focusPosition.y + 0.04,
      -focusPosition.z + modeBlend * 0.1,
    );
    liveAtlas.rotation.z = pointerX * 0.006;
    liveAtlas.scale.setScalar(1 + modeBlend * 0.055);

    const elapsed = time * 0.001;
    landmarks.forEach((landmark, index) => {
      const proximity = clamp(1 - Math.abs(currentIndex - index) * 0.7, 0, 1);
      const breath = Math.sin(elapsed * 0.42 + index * 1.71);
      landmark.group.position.y = landmark.baseY + breath * (0.006 + proximity * 0.012);
      landmark.group.rotation.y = landmark.baseRotationY + pointerX * (0.006 + proximity * 0.012);
      landmark.group.scale.setScalar(1 + proximity * 0.035);

      landmark.frameMaterial.color.lerpColors(navy, cream, modeBlend * 0.82);
      landmark.detailMaterial.color.lerpColors(activeBlue, cream, modeBlend * 0.9);
      landmark.nodeMaterial.color.lerpColors(activeBlue, cream, modeBlend * 0.88);
      landmark.frameMaterial.opacity = (0.13 + proximity * 0.34) * (0.92 + modeBlend * 0.16);
      landmark.detailMaterial.opacity = (0.1 + proximity * 0.39) * (0.9 + modeBlend * 0.2);
      landmark.nodeMaterial.opacity = 0.2 + proximity * 0.58;
      landmark.planeMaterial.opacity = (0.014 + proximity * 0.045) * (0.72 + modeBlend * 0.6);
    });

    liveRouteMaterial.color.lerpColors(activeBlue, cream, modeBlend * 0.88);
    liveRouteMaterial.opacity = 0.16 + modeBlend * 0.08;
    liveRouteNodeMaterial.color.lerpColors(activeBlue, cream, modeBlend * 0.86);
    liveRouteNodeMaterial.opacity = 0.38 + modeBlend * 0.16;
    routeNodes.forEach((node, index) => {
      const proximity = clamp(1 - Math.abs(currentIndex - index), 0, 1);
      node.scale.setScalar(1 + proximity * 0.75 + Math.sin(elapsed * 0.65 + index) * 0.04);
    });

    liveCamera.position.set(pointerX * 0.1, pointerY * 0.07, 6.4);
    liveCamera.lookAt(
      mix(-0.92, -0.2, modeBlend) + pointerX * 0.04,
      pointerY * 0.025,
      0,
    );
    liveRenderer.render(liveScene, liveCamera);
    canvas.dataset.ready = 'true';
  };

  const tick = (time: number) => {
    frame = 0;
    if (disposed || !visible || !contextAvailable) return;
    draw(time);
    frame = window.requestAnimationFrame(tick);
  };

  const start = () => {
    if (disposed || !visible || !contextAvailable || frame) return;
    lastTime = performance.now();
    frame = window.requestAnimationFrame(tick);
  };

  const handlePointerMove = (event: PointerEvent) => {
    targetPointerX = clamp((event.clientX / Math.max(1, window.innerWidth)) * 2 - 1, -1, 1);
    targetPointerY = clamp(-((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1), -1, 1);
  };
  const handlePointerLeave = () => {
    targetPointerX = 0;
    targetPointerY = 0;
  };
  const handleVisibilityChange = () => {
    visible = !document.hidden;
    if (visible) start();
    else stop();
  };
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextAvailable = false;
    stop();
    delete canvas.dataset.ready;
  };
  const handleContextRestored = () => {
    contextAvailable = true;
    lastWidth = 0;
    resize();
    start();
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', handlePointerLeave);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  resize();
  start();

  return () => {
    if (disposed) return;
    disposed = true;
    stop();
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', handlePointerMove);
    document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    delete canvas.dataset.ready;
    disposeResources(liveScene, liveRenderer, geometries, materials);
  };
}

export function DreamDepthField({ activeIndex, mode, disabled = false }: DreamDepthFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<MotionTarget>({ activeIndex, mode });

  useEffect(() => {
    targetRef.current = { activeIndex, mode };
  }, [activeIndex, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (disabled || !canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const compactViewport = window.matchMedia('(max-width: 760px)');
    const capabilityQueries = [reducedMotion, coarsePointer, compactViewport];
    let disposed = false;
    let generation = 0;
    let teardownRuntime: (() => void) | null = null;
    let threePromise: Promise<ThreeModule> | null = null;
    let webglAvailable: boolean | undefined;

    const isBlocked = () =>
      reducedMotion.matches ||
      coarsePointer.matches ||
      compactViewport.matches ||
      window.innerWidth <= 760;

    const reconcile = () => {
      generation += 1;
      const bootGeneration = generation;
      teardownRuntime?.();
      teardownRuntime = null;
      delete canvas.dataset.ready;
      if (disposed || isBlocked()) return;
      webglAvailable ??= canCreateWebGLContext();
      if (!webglAvailable) return;

      threePromise ??= import('three');
      void threePromise
        .then((THREE) => {
          if (disposed || bootGeneration !== generation || isBlocked()) return;
          const teardown = createAtlasRuntime(THREE, canvas, targetRef);
          if (disposed || bootGeneration !== generation || isBlocked()) {
            teardown();
            return;
          }
          teardownRuntime = teardown;
        })
        .catch(() => {
          delete canvas.dataset.ready;
        });
    };

    capabilityQueries.forEach((query) => query.addEventListener('change', reconcile));
    reconcile();

    return () => {
      disposed = true;
      generation += 1;
      capabilityQueries.forEach((query) => query.removeEventListener('change', reconcile));
      teardownRuntime?.();
      teardownRuntime = null;
      delete canvas.dataset.ready;
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      data-mode={mode}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
