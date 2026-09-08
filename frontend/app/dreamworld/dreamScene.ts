import * as THREE from 'three';

export const DREAM_SEGMENT_COUNT = 9;

export type DreamSceneOptions = {
  mobile: boolean;
  reducedMotion: boolean;
  onSceneChange?: (sceneIndex: number) => void;
};

export type DreamSceneController = {
  setProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setVisible: (visible: boolean) => void;
  setIdle: (idle: boolean) => void;
  resize: (width: number, height: number, devicePixelRatio: number) => void;
  renderNow: () => void;
  dispose: () => void;
};

type Vec3 = readonly [number, number, number];
type ThreeGeometry = InstanceType<typeof THREE.BufferGeometry>;
type ThreeMaterial = InstanceType<typeof THREE.Material>;
type SceneDisposables = { geometries: Set<ThreeGeometry>; materials: Set<ThreeMaterial> };
type PrimitiveKind = 'box' | 'roof' | 'sphere' | 'cylinder' | 'cone';
type PrimitiveSet = Record<PrimitiveKind, THREE.BufferGeometry>;
type StaticBatch = { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[] };
type StaticBatcher = {
  add: (kind: PrimitiveKind, material: THREE.Material, position: Vec3, scale: Vec3, rotation?: Vec3) => void;
  flush: () => void;
};
type CloudLobe = { cloudIndex: 0 | 1; offset: THREE.Vector3; scale: THREE.Vector3 };
type PulseLampRig = {
  bulbMaterials: THREE.MeshBasicMaterial[];
  lights: THREE.PointLight[];
  colors: THREE.Color[];
};

type DreamSceneBuilt = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cameraPath: THREE.CatmullRomCurve3;
  targetPath: THREE.CatmullRomCurve3;
  cloudMesh: THREE.InstancedMesh;
  cloudLobes: CloudLobe[];
  pulseLamps: PulseLampRig;
  colabBridge: THREE.Group;
  colabBridgeBaseY: number;
  foundationPapers: THREE.Group;
  foundationPapersBaseY: number;
  primeStitches: THREE.InstancedMesh;
  primeStitchMaterial: THREE.MeshStandardMaterial;
  bookMarker: THREE.Mesh;
  bookMarkerBaseY: number;
  readyWindowMaterial: THREE.MeshStandardMaterial;
  aboutVane: THREE.Group;
  contactMaterial: THREE.MeshStandardMaterial;
  floatingDoor: THREE.Group;
  floatingDoorBaseY: number;
  farSidewalkLoop: THREE.Mesh;
  wrongDirectionShadow: THREE.Mesh;
  disposables: SceneDisposables;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const amount = clamp((value - edge0) / Math.max(0.00001, edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
};

export function dreamSegmentFromProgress(progress: number) {
  const clamped = clamp(progress);
  if (clamped >= 1) return DREAM_SEGMENT_COUNT - 1;
  return Math.min(DREAM_SEGMENT_COUNT - 1, Math.floor(clamped * DREAM_SEGMENT_COUNT));
}

const segmentCenter = (index: number) => (index + 0.5) / DREAM_SEGMENT_COUNT;
const segmentInfluence = (progress: number, index: number, radius = 0.045) => {
  const distance = Math.abs(progress - segmentCenter(index));
  return 1 - smoothstep(radius, radius * 2.05, distance);
};

/** Hold on each parcel for half its scroll segment, then ease to the next one. */
function cameraProgress(progress: number) {
  const clamped = clamp(progress);
  if (clamped >= 1) return 1;
  const scaled = clamped * DREAM_SEGMENT_COUNT;
  const stop = Math.min(DREAM_SEGMENT_COUNT - 1, Math.floor(scaled));
  if (stop >= DREAM_SEGMENT_COUNT - 1) return 1;
  return (stop + smoothstep(0.5, 0.98, scaled - stop)) / (DREAM_SEGMENT_COUNT - 1);
}

function trackGeometry<T extends ThreeGeometry>(disposables: SceneDisposables, geometry: T) {
  disposables.geometries.add(geometry);
  return geometry;
}

function trackMaterial<T extends ThreeMaterial>(disposables: SceneDisposables, material: T) {
  disposables.materials.add(material);
  return material;
}

function applyTransform(
  object: THREE.Object3D,
  position: Vec3,
  scale: Vec3 = [1, 1, 1],
  rotation: Vec3 = [0, 0, 0],
) {
  object.position.set(...position);
  object.scale.set(...scale);
  object.rotation.set(...rotation);
  return object;
}

function makeRoofGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5,
    -0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, -0.5,
  ], 3));
  geometry.setIndex([
    0, 1, 2, 3, 4, 5,
    0, 3, 5, 0, 5, 1,
    0, 2, 4, 0, 4, 3,
    1, 5, 4, 1, 4, 2,
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

function createPrimitives(disposables: SceneDisposables): PrimitiveSet {
  return {
    box: trackGeometry(disposables, new THREE.BoxGeometry(1, 1, 1)),
    roof: trackGeometry(disposables, makeRoofGeometry()),
    sphere: trackGeometry(disposables, new THREE.IcosahedronGeometry(0.5, 1)),
    cylinder: trackGeometry(disposables, new THREE.CylinderGeometry(0.5, 0.5, 1, 10)),
    cone: trackGeometry(disposables, new THREE.ConeGeometry(0.5, 1, 8)),
  };
}

function createStaticBatcher(scene: THREE.Scene, primitives: PrimitiveSet): StaticBatcher {
  const batches = new Map<string, StaticBatch>();
  const transform = new THREE.Object3D();
  const add: StaticBatcher['add'] = (kind, material, position, scale, rotation = [0, 0, 0]) => {
    const geometry = primitives[kind];
    const key = `${geometry.uuid}:${material.uuid}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { geometry, material, matrices: [] };
      batches.set(key, batch);
    }
    applyTransform(transform, position, scale, rotation);
    transform.updateMatrix();
    batch.matrices.push(transform.matrix.clone());
  };
  const flush = () => {
    for (const batch of Array.from(batches.values())) {
      const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length);
      batch.matrices.forEach((item, index) => mesh.setMatrixAt(index, item));
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
      scene.add(mesh);
    }
    batches.clear();
  };
  return { add, flush };
}

function makeDynamicMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: Vec3,
  scale: Vec3 = [1, 1, 1],
  rotation: Vec3 = [0, 0, 0],
) {
  return applyTransform(new THREE.Mesh(geometry, material), position, scale, rotation) as THREE.Mesh;
}

function createMaterials(disposables: SceneDisposables) {
  const standard = (color: number, roughness = 0.92, emissive = 0, emissiveIntensity = 0) =>
    trackMaterial(disposables, new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity, flatShading: false, metalness: 0, roughness,
    }));
  return {
    grass: standard(0x83ad4f, 1), hill: standard(0x6e9c45, 1), hillLight: standard(0x98bc62, 1),
    road: standard(0x77727f, 0.98), roadEdge: standard(0x5f5b68, 1),
    sidewalk: standard(0xeee5d2, 1), sidewalkEdge: standard(0xc9bea9, 1),
    peach: standard(0xd9967e, 0.96), rose: standard(0xce8d99, 0.95),
    powderBlue: standard(0x8fb4c7, 0.96), butter: standard(0xd8c889, 0.96),
    mint: standard(0x9ebc9d, 0.97), lavender: standard(0xa89bbf, 0.96),
    paper: standard(0xf3ead5, 1), trim: standard(0xf8f1df, 0.98),
    sidingLine: standard(0xc2b59f, 1), foundation: standard(0xb8ad99, 1),
    navyRoof: standard(0x3c4b61, 0.94), fadedRoof: standard(0x8f6870, 0.95),
    window: standard(0x8dc7d1, 0.52, 0x48758b, 0.08), darkWood: standard(0x725847, 0.96),
    paperBlue: standard(0xc5d8de, 0.98), bookCoral: standard(0xc86f63, 0.92),
    bookBlue: standard(0x64839e, 0.92), bookGold: standard(0xc7a852, 0.93),
    foliage: standard(0x477b46, 1), trunk: standard(0x735a43, 1), warmMetal: standard(0xb79b68, 0.72),
  };
}

type Materials = ReturnType<typeof createMaterials>;

function worldFromLocal(origin: Vec3, rotationY: number, local: Vec3): Vec3 {
  const cosine = Math.cos(rotationY);
  const sine = Math.sin(rotationY);
  return [
    origin[0] + local[0] * cosine + local[2] * sine,
    origin[1] + local[1],
    origin[2] - local[0] * sine + local[2] * cosine,
  ];
}

function addHouse(batch: StaticBatcher, options: {
  origin: Vec3; width: number; height: number; depth: number; roofHeight: number;
  wall: THREE.Material; roof: THREE.Material; trim: THREE.Material;
  window: THREE.Material; door: THREE.Material; siding: THREE.Material;
  foundation: THREE.Material; rotationY?: number;
  frontWindows?: boolean; porch?: boolean;
}) {
  const rotationY = options.rotationY ?? 0;
  const addLocal = (
    kind: PrimitiveKind, material: THREE.Material, position: Vec3, scale: Vec3, rotation: Vec3 = [0, 0, 0],
  ) => batch.add(
    kind, material, worldFromLocal(options.origin, rotationY, position), scale,
    [rotation[0], rotation[1] + rotationY, rotation[2]],
  );
  addLocal('box', options.foundation, [0, 0.13, 0], [options.width + 0.42, 0.34, options.depth + 0.42]);
  addLocal('box', options.wall, [0, options.height * 0.5, 0], [options.width, options.height, options.depth]);
  addLocal('roof', options.roof, [0, options.height, 0], [options.width + 0.8, options.roofHeight, options.depth + 0.8]);
  addLocal('box', options.foundation,
    [options.width * 0.29, options.height + options.roofHeight * 0.52, -options.depth * 0.18],
    [0.5, options.roofHeight * 0.92, 0.58]);
  addLocal('box', options.trim,
    [options.width * 0.29, options.height + options.roofHeight * 0.98, -options.depth * 0.18],
    [0.66, 0.16, 0.72]);
  const front = options.depth * 0.5 + 0.09;
  addLocal('box', options.trim, [0, options.height - 0.08, front + 0.02], [options.width + 0.26, 0.22, 0.24]);
  for (const x of [-options.width * 0.5, options.width * 0.5]) {
    addLocal('box', options.trim, [x, options.height * 0.5, front + 0.03], [0.2, options.height, 0.2]);
  }
  addLocal('box', options.trim, [0, 1.2, front], [1.24, 2.48, 0.18]);
  addLocal('box', options.door, [0, 1.2, front + 0.1], [0.94, 2.18, 0.14]);
  addLocal('box', options.siding, [0, 1.57, front + 0.19], [0.64, 0.055, 0.08]);
  addLocal('box', options.siding, [0, 0.88, front + 0.19], [0.64, 0.055, 0.08]);
  addLocal('box', options.trim, [0.34, 1.17, front + 0.2], [0.075, 0.075, 0.07]);
  if (options.frontWindows !== false) {
    const windowX = options.width * 0.28;
    for (const x of [-windowX, windowX]) {
      addLocal('box', options.trim, [x, 2.35, front], [1.48, 1.52, 0.18]);
      addLocal('box', options.window, [x, 2.35, front + 0.1], [1.12, 1.17, 0.12]);
      addLocal('box', options.trim, [x, 2.35, front + 0.2], [0.07, 1.16, 0.07]);
      addLocal('box', options.trim, [x, 2.35, front + 0.2], [1.12, 0.07, 0.07]);
      addLocal('box', options.trim, [x, 1.68, front + 0.19], [1.66, 0.13, 0.3]);
    }
  }
  for (let y = 0.46; y < options.height - 0.24; y += 0.46) {
    addLocal('box', options.siding, [0, y, front - 0.015], [options.width * 0.92, 0.045, 0.075]);
    for (const x of [-options.width * 0.5 - 0.015, options.width * 0.5 + 0.015]) {
      addLocal('box', options.siding, [x, y, 0], [0.07, 0.045, options.depth * 0.92]);
    }
  }
  if (options.porch !== false) {
    addLocal('box', options.trim, [0, 0.16, options.depth * 0.5 + 1.05], [options.width * 0.72, 0.32, 2.15]);
    addLocal('box', options.trim, [0, 0.05, options.depth * 0.5 + 2.1], [2.25, 0.14, 0.72]);
    addLocal('box', options.trim, [0, 3.35, options.depth * 0.5 + 0.72], [options.width * 0.76, 0.18, 1.7]);
    addLocal('roof', options.roof, [0, 3.38, options.depth * 0.5 + 1.12],
      [options.width * 0.8, 0.48, 2.15]);
    for (const x of [-options.width * 0.32, options.width * 0.32]) {
      addLocal('box', options.trim, [x, 1.74, options.depth * 0.5 + 1.42], [0.16, 3.3, 0.16]);
      addLocal('box', options.foundation, [x, 0.23, options.depth * 0.5 + 1.42], [0.34, 0.18, 0.34]);
    }
  }
}

function buildRibbon(
  batch: StaticBatcher,
  curve: THREE.CatmullRomCurve3,
  material: THREE.Material,
  width: number,
  segments: number,
  elevation: number,
) {
  for (let index = 0; index < segments; index += 1) {
    const start = curve.getPoint(index / segments);
    const end = curve.getPoint((index + 1) / segments);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const delta = new THREE.Vector3().subVectors(end, start);
    batch.add('box', material, [midpoint.x, midpoint.y + elevation, midpoint.z],
      [width, 0.16, Math.max(0.9, delta.length() + 0.35)], [0, Math.atan2(delta.x, delta.z), 0]);
  }
}

function buildLandscape(batch: StaticBatcher, materials: Materials, mobile: boolean) {
  batch.add('box', materials.grass, [0, -0.25, -104], [150, 0.5, 300]);
  const hills: Array<{ position: Vec3; scale: Vec3; light?: boolean }> = [
    { position: [-44, 0.2, 2], scale: [58, 9, 50] },
    { position: [46, 0.5, -18], scale: [62, 11, 55], light: true },
    { position: [-48, 0.8, -62], scale: [66, 13, 60], light: true },
    { position: [49, 1.1, -91], scale: [68, 14, 64] },
    { position: [-50, 1.4, -132], scale: [70, 15, 68] },
    { position: [58, 1.1, -165], scale: [68, 10, 64], light: true },
    { position: [-58, 1.25, -205], scale: [70, 11, 66] },
    { position: [62, 1.45, -235], scale: [72, 12, 68], light: true },
    { position: [0, -4, -248], scale: [150, 20, 58], light: true },
  ];
  hills.forEach((hill) => batch.add('sphere', hill.light ? materials.hillLight : materials.hill, hill.position, hill.scale));

  const roadCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1, 0.04, 31), new THREE.Vector3(2, 0.05, 9),
    new THREE.Vector3(-2.5, 0.07, -18), new THREE.Vector3(3.6, 0.09, -45),
    new THREE.Vector3(-4.2, 0.11, -73), new THREE.Vector3(4.1, 0.13, -101),
    new THREE.Vector3(-4.5, 0.15, -130), new THREE.Vector3(4.2, 0.17, -159),
    new THREE.Vector3(-3.4, 0.2, -188), new THREE.Vector3(0, 0.22, -229),
  ], false, 'catmullrom', 0.33);
  const sidewalkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(6.4, 0.13, 31), new THREE.Vector3(7.6, 0.14, 8),
    new THREE.Vector3(3.4, 0.15, -18), new THREE.Vector3(8.5, 0.17, -45),
    new THREE.Vector3(1.3, 0.19, -73), new THREE.Vector3(8.5, 0.21, -101),
    new THREE.Vector3(1.2, 0.23, -130), new THREE.Vector3(8.1, 0.25, -159),
    new THREE.Vector3(2.2, 0.27, -188), new THREE.Vector3(4.1, 0.29, -229),
  ], false, 'catmullrom', 0.34);
  buildRibbon(batch, roadCurve, materials.roadEdge, 9.15, mobile ? 48 : 76, 0.015);
  buildRibbon(batch, roadCurve, materials.road, 8.4, mobile ? 48 : 76, 0.06);
  buildRibbon(batch, sidewalkCurve, materials.sidewalkEdge, 3.7, mobile ? 46 : 72, 0.11);
  buildRibbon(batch, sidewalkCurve, materials.sidewalk, 3.15, mobile ? 46 : 72, 0.18);

  const trees: Vec3[] = [
    [-22, 0, -4], [23, 0, -28], [-19, 0, -55], [24, 0, -84],
    [-22, 0, -111], [23, 0, -139], [-21, 0, -168], [22, 0, -198],
    [-31, 0, -34], [31, 0, -122], [-30, 0, -185], [29, 0, -218],
  ];
  const visibleTrees = mobile ? trees.filter((_, index) => index % 2 === 0) : trees;
  visibleTrees.forEach(([x, y, z], index) => {
    const height = 3.8 + (index % 3) * 0.7;
    batch.add('cylinder', materials.trunk, [x, y + 1.05, z], [0.42, 2.1, 0.42]);
    batch.add('cone', materials.foliage, [x, y + 2.6 + height * 0.25, z], [2.7, height, 2.7]);
  });
  const flowerCount = mobile ? 24 : 52;
  for (let index = 0; index < flowerCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    batch.add('sphere', index % 3 === 0 ? materials.paper : materials.lavender,
      [side * (12 + (index % 5) * 1.8), 0.3, 18 - index * (222 / flowerCount)], [0.24, 0.34, 0.24]);
  }
}

function buildHomeParcel(
  scene: THREE.Scene,
  primitives: PrimitiveSet,
  disposables: SceneDisposables,
) {
  const shadowMaterial = trackMaterial(disposables, new THREE.MeshBasicMaterial({
    color: 0x344658,
    depthWrite: false,
    opacity: 0.25,
    transparent: true,
    toneMapped: false,
  }));
  const wrongDirectionShadow = makeDynamicMesh(
    primitives.box, shadowMaterial, [-3.8, 0.015, 9.5], [8.2, 0.025, 1.05], [0, -0.72, 0],
  );
  scene.add(wrongDirectionShadow);
  return wrongDirectionShadow;
}

function buildPulseGuardParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
  disposables: SceneDisposables,
) {
  const origin: Vec3 = [10, 0.04, -15];
  addHouse(batch, {
    origin, width: 7.5, height: 5.1, depth: 6.3, roofHeight: 2.2,
    wall: materials.peach, roof: materials.navyRoof, trim: materials.trim,
    window: materials.window, door: materials.darkWood,
    siding: materials.sidingLine, foundation: materials.foundation,
  });
  batch.add('box', materials.peach, [10, 6.15, -15], [2.45, 2.1, 2.35]);
  batch.add('roof', materials.navyRoof, [10, 7.18, -15], [3.05, 1.35, 2.95]);
  batch.add('box', materials.trim, [10, 6.25, -13.78], [0.84, 0.95, 0.15]);
  batch.add('box', materials.window, [10, 6.25, -13.68], [0.6, 0.7, 0.09]);

  const lampPositions: Vec3[] = [
    [7.7, 2.35, -10.65], [10, 2.35, -10.65], [12.3, 2.35, -10.65],
  ];
  lampPositions.forEach((position) => {
    batch.add('cylinder', materials.navyRoof, [position[0], 1.15, position[2]], [0.2, 2.3, 0.2]);
    batch.add('box', materials.warmMetal, [position[0], 2.78, position[2]], [0.72, 0.16, 0.72]);
  });

  const colors = [new THREE.Color(0xc9f598), new THREE.Color(0xffda72), new THREE.Color(0xff806d)];
  const bulbMaterials: THREE.MeshBasicMaterial[] = [];
  const lights: THREE.PointLight[] = [];
  lampPositions.forEach((position, index) => {
    const bulbMaterial = trackMaterial(disposables, new THREE.MeshBasicMaterial({
      color: colors[index], toneMapped: false,
    }));
    const bulb = makeDynamicMesh(primitives.sphere, bulbMaterial, position, [0.78, 0.98, 0.78]);
    bulb.renderOrder = 2;
    scene.add(bulb);
    bulbMaterials.push(bulbMaterial);
    const light = new THREE.PointLight(colors[index].getHex(), 0.12, 8.5, 2);
    light.position.set(...position);
    scene.add(light);
    lights.push(light);
  });
  return { bulbMaterials, lights, colors } satisfies PulseLampRig;
}

function buildCoLabParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
) {
  addHouse(batch, {
    origin: [-13.2, 0.04, -44], width: 5.2, height: 4.25, depth: 5.7, roofHeight: 1.8,
    wall: materials.powderBlue, roof: materials.navyRoof, trim: materials.trim,
    window: materials.window, door: materials.darkWood,
    siding: materials.sidingLine, foundation: materials.foundation,
  });
  addHouse(batch, {
    origin: [-6, 0.04, -44], width: 5.2, height: 4.7, depth: 5.7, roofHeight: 1.95,
    wall: materials.rose, roof: materials.fadedRoof, trim: materials.trim,
    window: materials.window, door: materials.darkWood,
    siding: materials.sidingLine, foundation: materials.foundation,
  });
  const bridge = new THREE.Group();
  bridge.position.set(-9.6, 3.8, -44);
  bridge.add(makeDynamicMesh(primitives.box, materials.butter, [0, 0, 0], [3.7, 1.45, 2.45]));
  bridge.add(makeDynamicMesh(primitives.box, materials.trim, [0, 0.05, 1.28], [3.15, 0.84, 0.14]));
  bridge.add(makeDynamicMesh(primitives.box, materials.window, [0, 0.05, 1.37], [2.75, 0.62, 0.08]));
  bridge.add(makeDynamicMesh(primitives.roof, materials.navyRoof, [0, 0.73, 0], [4.2, 0.85, 2.9]));
  scene.add(bridge);
  return bridge;
}

function buildFoundationParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
  mobile: boolean,
) {
  addHouse(batch, {
    origin: [10.8, 0.06, -73], width: 8.7, height: 4.55, depth: 6.4, roofHeight: 1.75,
    wall: materials.butter, roof: materials.navyRoof, trim: materials.trim,
    window: materials.window, door: materials.darkWood,
    siding: materials.sidingLine, foundation: materials.foundation,
  });
  batch.add('roof', materials.trim, [10.8, 3.1, -68.96], [3.5, 1.15, 1.1]);
  const boardZ = -68.62;
  for (const x of [8.55, 13.05]) {
    batch.add('box', materials.navyRoof, [x, 1.35, boardZ - 0.12], [2.95, 2.15, 0.18]);
    batch.add('box', materials.paper, [x, 1.35, boardZ], [2.55, 1.75, 0.14]);
    batch.add('box', materials.trim, [x - 1.18, 0.55, boardZ - 0.05], [0.16, 1.1, 0.16]);
    batch.add('box', materials.trim, [x + 1.18, 0.55, boardZ - 0.05], [0.16, 1.1, 0.16]);
  }
  const paperCount = mobile ? 6 : 10;
  const papers = new THREE.InstancedMesh(primitives.box, materials.paperBlue, paperCount);
  const transform = new THREE.Object3D();
  for (let index = 0; index < paperCount; index += 1) {
    const column = index % 5;
    const row = Math.floor(index / 5);
    applyTransform(transform, [-2.2 + column * 1.08, row * 0.7, 0], [0.56, 0.72, 0.055],
      [0, 0, (column - 2) * 0.045]);
    transform.updateMatrix();
    papers.setMatrixAt(index, transform.matrix);
  }
  papers.instanceMatrix.needsUpdate = true;
  const paperGroup = new THREE.Group();
  paperGroup.position.set(10.8, 1.18, boardZ + 0.18);
  paperGroup.add(papers);
  scene.add(paperGroup);
  return paperGroup;
}

function buildPrimeLeatherParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
  disposables: SceneDisposables,
  mobile: boolean,
) {
  const origin: Vec3 = [-10.4, 0.06, -102];
  batch.add('box', materials.foundation, [-13.05, 0.18, -102], [5.5, 0.36, 6.75]);
  batch.add('box', materials.foundation, [-7.75, 0.18, -102], [5.5, 0.36, 6.75]);
  batch.add('box', materials.peach, [-13.05, 2.15, -102], [5.1, 4.2, 6.4]);
  batch.add('box', materials.lavender, [-7.75, 2.15, -102], [5.1, 4.2, 6.4]);
  batch.add('roof', materials.fadedRoof, [-13.05, 4.25, -102], [5.65, 1.8, 6.9]);
  batch.add('roof', materials.navyRoof, [-7.75, 4.25, -102], [5.65, 1.8, 6.9]);
  batch.add('box', materials.trim, [-13.05, 1.55, -98.72], [3.3, 2.65, 0.18]);
  batch.add('box', materials.paper, [-13.05, 1.55, -98.6], [2.85, 2.2, 0.12]);
  batch.add('box', materials.trim, [-7.75, 1.55, -98.72], [3.3, 2.65, 0.18]);
  batch.add('box', materials.darkWood, [-7.75, 1.55, -98.6], [2.85, 2.2, 0.12]);
  batch.add('box', materials.trim, [origin[0], 2.1, -98.64], [0.22, 4.2, 0.2]);
  batch.add('box', materials.trim, [origin[0], 4.08, -98.65], [10.55, 0.22, 0.26]);
  for (const x of [-15.5, -10.58, -10.22, -5.3]) {
    batch.add('box', materials.trim, [x, 2.12, -98.64], [0.18, 4.15, 0.2]);
  }
  for (let y = 0.5; y < 4; y += 0.45) {
    batch.add('box', materials.sidingLine, [-13.05, y, -98.75], [4.55, 0.045, 0.08]);
    batch.add('box', materials.sidingLine, [-7.75, y, -98.75], [4.55, 0.045, 0.08]);
  }
  for (const x of [-13.05, -7.75]) {
    batch.add('box', materials.trim, [x, 2.84, -98.47], [3.7, 0.16, 0.62], [0.16, 0, 0]);
    batch.add('box', materials.trim, [x, 1.55, -98.47], [0.09, 2.18, 0.08]);
    batch.add('box', materials.trim, [x, 0.38, -98.44], [3.15, 0.14, 0.34]);
  }

  const stitchMaterial = trackMaterial(disposables, new THREE.MeshStandardMaterial({
    color: 0xf2dfbe, emissive: 0x8a5b48, emissiveIntensity: 0.04,
    flatShading: true, metalness: 0, roughness: 0.86,
  }));
  const stitchCount = mobile ? 9 : 14;
  const stitches = new THREE.InstancedMesh(primitives.box, stitchMaterial, stitchCount);
  const transform = new THREE.Object3D();
  for (let index = 0; index < stitchCount; index += 1) {
    if (index < Math.min(stitchCount, 10)) {
      applyTransform(transform,
        [origin[0] + (index % 2 === 0 ? -0.23 : 0.23), 0.58 + index * 0.39, -98.49],
        [0.72, 0.085, 0.11], [0, 0, index % 2 === 0 ? 0.62 : -0.62]);
    } else {
      const roofIndex = index - 10;
      applyTransform(transform,
        [origin[0] + (roofIndex % 2 === 0 ? -0.2 : 0.2), 4.48 + roofIndex * 0.29, -101 + roofIndex * 0.34],
        [0.68, 0.085, 0.11], [0.2, 0, roofIndex % 2 === 0 ? 0.68 : -0.68]);
    }
    transform.updateMatrix();
    stitches.setMatrixAt(index, transform.matrix);
  }
  stitches.instanceMatrix.needsUpdate = true;
  scene.add(stitches);
  return { stitches, stitchMaterial };
}

function buildBookShelfParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
  mobile: boolean,
) {
  const origin: Vec3 = [10.4, 0.07, -131];
  batch.add('box', materials.foundation, [origin[0], 0.18, origin[2]], [8.65, 0.36, 6.78]);
  batch.add('box', materials.powderBlue, [origin[0], 2.2, origin[2]], [8.2, 4.3, 6.4]);
  batch.add('box', materials.trim, [origin[0], 1.18, origin[2] + 3.28], [1.3, 2.45, 0.18]);
  batch.add('box', materials.darkWood, [origin[0], 1.18, origin[2] + 3.39], [0.98, 2.16, 0.13]);
  for (const x of [-2.45, 2.45]) {
    batch.add('box', materials.trim, [origin[0] + x, 2.38, origin[2] + 3.28], [1.55, 1.55, 0.18]);
    batch.add('box', materials.window, [origin[0] + x, 2.38, origin[2] + 3.38], [1.18, 1.2, 0.12]);
    batch.add('box', materials.trim, [origin[0] + x, 2.38, origin[2] + 3.47], [0.07, 1.18, 0.06]);
    batch.add('box', materials.trim, [origin[0] + x, 2.38, origin[2] + 3.47], [1.16, 0.07, 0.06]);
    batch.add('box', materials.trim, [origin[0] + x, 1.68, origin[2] + 3.45], [1.58, 0.14, 0.3]);
  }
  batch.add('box', materials.trim, [origin[0], 4.1, origin[2] + 3.22], [8.6, 0.22, 0.28]);
  for (const x of [-3.98, 3.98]) {
    batch.add('box', materials.trim, [origin[0] + x, 2.15, origin[2] + 3.24], [0.2, 4.18, 0.2]);
  }
  for (let y = 0.5; y < 4; y += 0.45) {
    batch.add('box', materials.sidingLine, [origin[0], y, origin[2] + 3.2], [7.65, 0.045, 0.08]);
  }
  batch.add('box', materials.darkWood, [origin[0], 4.42, origin[2]], [9, 0.34, 6.9]);
  const spineCount = mobile ? 7 : 11;
  const center = Math.floor(spineCount / 2);
  for (let index = 0; index < spineCount; index += 1) {
    if (index === center) continue;
    const x = -3.75 + (index / Math.max(1, spineCount - 1)) * 7.5;
    const height = 1.65 + (index % 4) * 0.28;
    const material = [materials.bookCoral, materials.bookBlue, materials.bookGold][index % 3];
    batch.add('box', material, [origin[0] + x, 4.58 + height * 0.5, origin[2]],
      [0.58, height, 6.15], [0, 0, (index % 3 - 1) * 0.035]);
  }
  const markerHeight = 2.35;
  const bookMarker = makeDynamicMesh(primitives.box, materials.bookCoral,
    [origin[0], 4.58 + markerHeight * 0.5, origin[2]], [0.62, markerHeight, 6.15]);
  scene.add(bookMarker);
  return bookMarker;
}

function buildLocalLlmParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
  disposables: SceneDisposables,
  mobile: boolean,
) {
  const origin: Vec3 = [-10.2, 0.08, -160];
  addHouse(batch, {
    origin, width: 11, height: 4.25, depth: 6.5, roofHeight: 1.7,
    wall: materials.mint, roof: materials.navyRoof, trim: materials.trim,
    window: materials.window, door: materials.darkWood,
    siding: materials.sidingLine, foundation: materials.foundation,
    frontWindows: false, porch: false,
  });
  batch.add('box', materials.paper, [origin[0], 4.08, -156.62], [4.8, 0.82, 0.16]);
  const windowCount = mobile ? 4 : 6;
  const readyWindowMaterial = trackMaterial(disposables, new THREE.MeshStandardMaterial({
    color: 0xa9ded7, emissive: 0x4e9eaa, emissiveIntensity: 0.62,
    metalness: 0, roughness: 0.5, toneMapped: false,
  }));
  const readyWindows = new THREE.InstancedMesh(primitives.box, readyWindowMaterial, windowCount);
  const transform = new THREE.Object3D();
  for (let index = 0; index < windowCount; index += 1) {
    const x = origin[0] - (windowCount - 1) * 0.84 + index * 1.68;
    applyTransform(transform, [x, 2.22, -156.64], [1.05, 1.18, 0.13]);
    transform.updateMatrix();
    readyWindows.setMatrixAt(index, transform.matrix);
  }
  readyWindows.instanceMatrix.needsUpdate = true;
  scene.add(readyWindows);
  const stacks = mobile ? 2 : 3;
  for (let stack = 0; stack < stacks; stack += 1) {
    for (let card = 0; card < 4; card += 1) {
      batch.add('box', card % 2 === 0 ? materials.paper : materials.paperBlue,
        [origin[0] - 2.2 + stack * 2.2 + card * 0.025, 0.34 + card * 0.09, -155.8 - stack * 0.15],
        [1.25, 0.07, 0.88], [0, card * 0.035, 0]);
    }
  }
  return { readyWindowMaterial };
}

function buildAboutParcel(
  scene: THREE.Scene,
  batch: StaticBatcher,
  primitives: PrimitiveSet,
  materials: Materials,
) {
  addHouse(batch, {
    origin: [10.2, 0.1, -188], width: 7.5, height: 4.15, depth: 6.2, roofHeight: 1.75,
    wall: materials.lavender, roof: materials.fadedRoof, trim: materials.trim,
    window: materials.window, door: materials.darkWood,
    siding: materials.sidingLine, foundation: materials.foundation,
  });
  batch.add('box', materials.darkWood, [6.8, 1.1, -183.9], [3.6, 0.22, 1.55]);
  for (const x of [5.45, 8.15]) batch.add('box', materials.trim, [x, 0.56, -183.9], [0.18, 1.12, 0.18]);
  for (const x of [5.5, 7.2, 8.9]) {
    batch.add('cylinder', materials.paper, [x, 0.38, -181.9], [0.72, 0.72, 0.72]);
    batch.add('sphere', materials.foliage, [x, 1.16, -181.9], [1.45, 1.65, 1.45]);
  }
  batch.add('cylinder', materials.darkWood, [10.2, 6.55, -188], [0.12, 2.2, 0.12]);
  const vane = new THREE.Group();
  vane.position.set(10.2, 7.65, -188);
  vane.add(makeDynamicMesh(primitives.box, materials.navyRoof, [0, 0, 0], [2.15, 0.12, 0.12]));
  vane.add(makeDynamicMesh(primitives.cone, materials.navyRoof, [1.18, 0, 0], [0.55, 0.72, 0.55], [0, 0, -Math.PI * 0.5]));
  scene.add(vane);
  return vane;
}

function buildContactParcel(batch: StaticBatcher, materials: Materials, disposables: SceneDisposables) {
  const contactMaterial = trackMaterial(disposables, new THREE.MeshStandardMaterial({
    color: 0xf1ead8, emissive: 0x91aec0, emissiveIntensity: 0.03,
    flatShading: true, metalness: 0.02, roughness: 0.9,
  }));
  const x = -0.5;
  const z = -222;
  for (const [dx, dz, rx, rz] of [
    [-1.35, -1.2, -0.08, 0.08], [1.35, -1.2, -0.08, -0.08],
    [-1.35, 1.2, 0.08, 0.08], [1.35, 1.2, 0.08, -0.08],
  ] as const) {
    batch.add('cylinder', materials.warmMetal, [x + dx, 4.1, z + dz], [0.24, 7.4, 0.24], [rx, 0, rz]);
  }
  batch.add('cylinder', contactMaterial, [x, 8.4, z], [2.75, 2.75, 2.75]);
  batch.add('cone', contactMaterial, [x, 10.15, z], [3.1, 1.5, 3.1]);
  batch.add('box', materials.warmMetal, [x, 4.2, z], [4.3, 0.15, 0.15], [0, 0, 0.55]);
  batch.add('box', materials.warmMetal, [x, 4.2, z], [4.3, 0.15, 0.15], [0, 0, -0.55]);
  for (const gateX of [1.5, 6.5]) {
    batch.add('box', materials.trim, [gateX, 1.65, -211], [0.52, 3.3, 0.52]);
    batch.add('cone', materials.paper, [gateX, 3.62, -211], [0.9, 0.8, 0.9]);
  }
  return contactMaterial;
}

function buildAnomalies(
  scene: THREE.Scene,
  primitives: PrimitiveSet,
  materials: Materials,
  disposables: SceneDisposables,
) {
  const floatingDoor = new THREE.Group();
  floatingDoor.position.set(-14.8, 7.1, -183);
  floatingDoor.add(makeDynamicMesh(primitives.box, materials.trim, [0, 0, 0], [1.65, 3.3, 0.18]));
  floatingDoor.add(makeDynamicMesh(primitives.box, materials.paperBlue, [0, 0.62, 0.11], [1.15, 0.76, 0.1]));
  floatingDoor.add(makeDynamicMesh(primitives.box, materials.paperBlue, [0, -0.72, 0.11], [1.15, 0.76, 0.1]));
  floatingDoor.add(makeDynamicMesh(primitives.sphere, materials.warmMetal, [0.56, 0, 0.18], [0.16, 0.16, 0.16]));
  scene.add(floatingDoor);

  const loopGeometry = trackGeometry(disposables, new THREE.TorusGeometry(2.65, 0.42, 8, 32));
  const farSidewalkLoop = makeDynamicMesh(
    loopGeometry, materials.sidewalk, [4.15, 2.9, -201], [1, 1, 1], [0, 0.08, 0.05],
  );
  scene.add(farSidewalkLoop);
  return { floatingDoor, farSidewalkLoop };
}

function createPairedClouds(
  scene: THREE.Scene,
  primitives: PrimitiveSet,
  disposables: SceneDisposables,
) {
  const cloudMaterial = trackMaterial(disposables, new THREE.MeshStandardMaterial({
    color: 0xf7f4e9, emissive: 0xddefff, emissiveIntensity: 0.12,
    flatShading: true, metalness: 0, roughness: 1,
  }));
  const template: Array<{ offset: Vec3; scale: Vec3 }> = [
    { offset: [-1.05, 0, 0], scale: [2.7, 1.25, 1.55] },
    { offset: [0, 0.34, 0], scale: [3.25, 1.75, 1.8] },
    { offset: [1.16, -0.02, 0], scale: [2.55, 1.18, 1.48] },
    { offset: [0.18, -0.28, 0.15], scale: [3.45, 1.1, 1.65] },
  ];
  const cloudLobes: CloudLobe[] = [];
  for (const cloudIndex of [0, 1] as const) {
    template.forEach((lobe) => cloudLobes.push({
      cloudIndex,
      offset: new THREE.Vector3(...lobe.offset),
      scale: new THREE.Vector3(...lobe.scale),
    }));
  }
  const cloudMesh = new THREE.InstancedMesh(primitives.sphere, cloudMaterial, cloudLobes.length);
  cloudMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cloudMesh.frustumCulled = false;
  scene.add(cloudMesh);
  return { cloudMesh, cloudLobes };
}

function buildDreamScene(mobile: boolean): DreamSceneBuilt {
  const disposables: SceneDisposables = { geometries: new Set(), materials: new Set() };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x61afe5);
  scene.fog = new THREE.Fog(0xbcb9d4, 98, 272);
  const camera = new THREE.PerspectiveCamera(mobile ? 48 : 43, 1, 0.1, 340);
  camera.position.set(6.2, 2.85, 22);

  scene.add(new THREE.HemisphereLight(0xf5fbff, 0x6d8f42, 1.7));
  const sun = new THREE.DirectionalLight(0xffecc8, 2.05);
  sun.position.set(-24, 32, 18);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfc6ee, 0.48);
  fill.position.set(22, 12, -34);
  scene.add(fill);

  const primitives = createPrimitives(disposables);
  const materials = createMaterials(disposables);
  const batch = createStaticBatcher(scene, primitives);
  buildLandscape(batch, materials, mobile);
  const wrongDirectionShadow = buildHomeParcel(scene, primitives, disposables);
  const pulseLamps = buildPulseGuardParcel(scene, batch, primitives, materials, disposables);
  const colabBridge = buildCoLabParcel(scene, batch, primitives, materials);
  const foundationPapers = buildFoundationParcel(scene, batch, primitives, materials, mobile);
  const { stitches: primeStitches, stitchMaterial: primeStitchMaterial } = buildPrimeLeatherParcel(
    scene, batch, primitives, materials, disposables, mobile,
  );
  const bookMarker = buildBookShelfParcel(scene, batch, primitives, materials, mobile);
  const { readyWindowMaterial } = buildLocalLlmParcel(
    scene, batch, primitives, materials, disposables, mobile,
  );
  const aboutVane = buildAboutParcel(scene, batch, primitives, materials);
  const contactMaterial = buildContactParcel(batch, materials, disposables);
  const { floatingDoor, farSidewalkLoop } = buildAnomalies(scene, primitives, materials, disposables);
  const { cloudMesh, cloudLobes } = createPairedClouds(scene, primitives, disposables);
  batch.flush();

  const cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(6.2, 2.85, 22), new THREE.Vector3(5.8, 2.9, -2),
    new THREE.Vector3(4.4, 3, -30), new THREE.Vector3(6.8, 3.05, -58),
    new THREE.Vector3(2.8, 3.1, -87), new THREE.Vector3(6.8, 3.12, -116),
    new THREE.Vector3(2.4, 3.14, -145), new THREE.Vector3(6.5, 3.18, -174),
    new THREE.Vector3(3.8, 3.65, -204),
  ], false, 'catmullrom', 0.34);
  const targetPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.4, -5), new THREE.Vector3(10, 3.1, -15),
    new THREE.Vector3(-9.6, 2.8, -44), new THREE.Vector3(10.8, 2.45, -73),
    new THREE.Vector3(-10.4, 2.5, -102), new THREE.Vector3(10.4, 3, -131),
    new THREE.Vector3(-10.2, 2.45, -160), new THREE.Vector3(10.2, 2.4, -188),
    new THREE.Vector3(-0.5, 7, -222),
  ], false, 'catmullrom', 0.3);

  return {
    scene, camera, cameraPath, targetPath, cloudMesh, cloudLobes, pulseLamps,
    colabBridge, colabBridgeBaseY: colabBridge.position.y,
    foundationPapers, foundationPapersBaseY: foundationPapers.position.y,
    primeStitches, primeStitchMaterial,
    bookMarker, bookMarkerBaseY: bookMarker.position.y,
    readyWindowMaterial, aboutVane, contactMaterial,
    floatingDoor, floatingDoorBaseY: floatingDoor.position.y,
    farSidewalkLoop, wrongDirectionShadow, disposables,
  };
}

export function createDreamScene(
  canvas: HTMLCanvasElement,
  options: DreamSceneOptions,
): DreamSceneController {
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: false, antialias: !options.mobile,
    powerPreference: 'high-performance', preserveDrawingBuffer: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;

  const built = buildDreamScene(options.mobile);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const cloudPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const workingColor = new THREE.Color();
  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const startedAt = performance.now();
  let progressTarget = 0;
  let progress = 0;
  let reducedMotion = options.reducedMotion;
  let visible = true;
  let idle = false;
  let disposed = false;
  let frame = 0;
  let activeScene = -1;
  let needsRender = true;

  const requestRender = () => {
    if (disposed || !visible || reducedMotion || frame) return;
    frame = window.requestAnimationFrame(renderFrame);
  };
  const applySceneChange = (nextProgress: number) => {
    const nextScene = dreamSegmentFromProgress(nextProgress);
    if (nextScene !== activeScene) {
      activeScene = nextScene;
      options.onSceneChange?.(nextScene);
    }
  };
  const renderScene = () => {
    if (disposed) return;
    const elapsed = reducedMotion ? 0 : (performance.now() - startedAt) * 0.001;
    progress = reducedMotion ? progressTarget : mix(progress, progressTarget, 0.085);
    if (Math.abs(progressTarget - progress) < 0.0002) progress = progressTarget;
    pointer.lerp(pointerTarget, reducedMotion ? 1 : 0.075);
    applySceneChange(progress);

    const pathProgress = cameraProgress(progress);
    cameraPosition.copy(built.cameraPath.getPoint(pathProgress));
    lookTarget.copy(built.targetPath.getPoint(pathProgress));
    cameraPosition.x += pointer.x * 0.26;
    cameraPosition.y += pointer.y * 0.1;
    lookTarget.x += pointer.x * 0.72;
    lookTarget.y += pointer.y * 0.42;
    built.camera.position.copy(cameraPosition);
    built.camera.lookAt(lookTarget);

    const pulseInfluence = segmentInfluence(progress, 1);
    built.pulseLamps.colors.forEach((color, index) => {
      const wave = 0.5 + 0.5 * Math.sin(elapsed * (1.65 + index * 0.34) + index * 1.9);
      const brightness = 0.95 + pulseInfluence * (0.22 + wave * 0.28);
      workingColor.copy(color).multiplyScalar(brightness);
      built.pulseLamps.bulbMaterials[index].color.copy(workingColor);
      built.pulseLamps.lights[index].intensity = 0.34 + pulseInfluence * (0.3 + wave * 0.55);
    });

    const colabInfluence = segmentInfluence(progress, 2);
    built.colabBridge.position.y = built.colabBridgeBaseY + Math.sin(elapsed * 0.72) * 0.075 * colabInfluence;
    const foundationInfluence = segmentInfluence(progress, 3);
    built.foundationPapers.position.y = built.foundationPapersBaseY + Math.sin(elapsed * 0.92) * 0.08 * foundationInfluence;
    built.foundationPapers.rotation.z = Math.sin(elapsed * 0.55) * 0.018 * foundationInfluence;
    const primeInfluence = segmentInfluence(progress, 4);
    built.primeStitchMaterial.emissiveIntensity = 0.035 + primeInfluence * (0.08 + Math.sin(elapsed * 1.2) * 0.025);
    built.primeStitches.rotation.z = Math.sin(elapsed * 0.48) * 0.006 * primeInfluence;
    const bookInfluence = segmentInfluence(progress, 5);
    built.bookMarker.position.y = built.bookMarkerBaseY + smoothstep(0, 1, bookInfluence) * 0.24
      + Math.sin(elapsed * 0.68) * 0.035 * bookInfluence;

    const llmInfluence = segmentInfluence(progress, 6);
    const readyWave = 0.5 + 0.5 * Math.sin(elapsed * (idle ? 1.15 : 0.68));
    built.readyWindowMaterial.emissiveIntensity = 0.52
      + llmInfluence * (0.34 + readyWave * 0.24);

    const aboutInfluence = segmentInfluence(progress, 7);
    built.aboutVane.rotation.y = Math.sin(elapsed * 0.42) * 0.32 * aboutInfluence;
    const contactInfluence = segmentInfluence(progress, 8, 0.055);
    built.contactMaterial.emissiveIntensity = 0.025 + contactInfluence * (0.055 + Math.sin(elapsed * 0.58) * 0.012);
    built.floatingDoor.position.y = built.floatingDoorBaseY + Math.sin(elapsed * 0.34) * 0.11;
    built.floatingDoor.rotation.y = Math.sin(elapsed * 0.22) * 0.035;
    built.farSidewalkLoop.rotation.z = 0.05 + Math.sin(elapsed * 0.18) * 0.006;

    const cloudDrift = Math.sin(elapsed * 0.09) * 0.55;
    built.cloudLobes.forEach((lobe, index) => {
      const side = lobe.cloudIndex === 0 ? -1 : 1;
      cloudPosition.set(
        cameraPosition.x + side * 8.5 + lobe.offset.x + cloudDrift,
        cameraPosition.y + 13.5 + lobe.offset.y,
        cameraPosition.z - 70 + lobe.offset.z,
      );
      matrix.compose(cloudPosition, quaternion.identity(), lobe.scale);
      built.cloudMesh.setMatrixAt(index, matrix);
    });
    built.cloudMesh.instanceMatrix.needsUpdate = true;

    renderer.render(built.scene, built.camera);
    needsRender = false;
  };

  const renderFrame = () => {
    frame = 0;
    renderScene();
    if (!reducedMotion && visible && !disposed) requestRender();
  };
  const renderNow = () => {
    if (disposed) return;
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    renderScene();
  };
  const setVisible = (nextVisible: boolean) => {
    visible = nextVisible;
    if (!visible && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
    if (visible) {
      needsRender = true;
      if (reducedMotion) renderNow();
      else requestRender();
    }
  };
  const setReducedMotion = (nextReducedMotion: boolean) => {
    reducedMotion = nextReducedMotion;
    if (reducedMotion) {
      pointer.copy(pointerTarget);
      renderNow();
    } else if (visible) requestRender();
  };
  const setProgress = (nextProgress: number) => {
    progressTarget = clamp(nextProgress);
    applySceneChange(progressTarget);
    if (reducedMotion) renderNow();
    else if (Math.abs(progressTarget - progress) > 0.0001 || needsRender) requestRender();
  };
  const setPointer = (x: number, y: number) => {
    pointerTarget.set(clamp(x, -1, 1), clamp(y, -1, 1));
    if (reducedMotion) renderNow();
    else if (visible) requestRender();
  };
  const setIdle = (nextIdle: boolean) => {
    idle = nextIdle;
    if (reducedMotion) renderNow();
    else if (segmentInfluence(progressTarget, 6) > 0.08) requestRender();
  };
  const resize = (nextWidth: number, nextHeight: number, devicePixelRatio: number) => {
    const width = Math.max(1, Math.floor(nextWidth));
    const height = Math.max(1, Math.floor(nextHeight));
    built.camera.aspect = width / height;
    built.camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(options.mobile ? 1 : 1.35, Math.max(1, devicePixelRatio || 1)));
    renderer.setSize(width, height, false);
    renderNow();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame) window.cancelAnimationFrame(frame);
    built.scene.clear();
    built.disposables.materials.forEach((material) => material.dispose());
    built.disposables.geometries.forEach((geometry) => geometry.dispose());
    renderer.renderLists.dispose();
    renderer.dispose();
  };

  resize(1, 1, 1);
  setVisible(true);
  requestRender();
  return { setProgress, setPointer, setReducedMotion, setVisible, setIdle, resize, renderNow, dispose };
}
