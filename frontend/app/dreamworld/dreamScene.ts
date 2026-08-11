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

type ThreeGeometry = InstanceType<typeof THREE.BufferGeometry>;
type ThreeMaterial = InstanceType<typeof THREE.Material>;
type ThreeTexture = InstanceType<typeof THREE.Texture>;
type Vec3 = readonly [number, number, number];

type CloudInstance = {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  phase: number;
  speed: number;
  bob: number;
};

type BobbingMesh = {
  mesh: THREE.Object3D;
  baseY: number;
  amplitude: number;
  speed: number;
  phase: number;
};

type FluorescentTube = {
  light: THREE.PointLight;
  material: THREE.MeshStandardMaterial;
  baseIntensity: number;
  phase: number;
};

type DoorRig = {
  pivot: THREE.Group;
  closedY: number;
};

type DreamSceneBuilt = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cameraPath: THREE.CatmullRomCurve3;
  targetPath: THREE.CatmullRomCurve3;
  cloudMesh: THREE.InstancedMesh;
  clouds: CloudInstance[];
  porchLamp: THREE.PointLight;
  pulseGlow: THREE.PointLight;
  heroDoor: DoorRig;
  exitDoor: DoorRig;
  busCord: THREE.Group;
  checkoutBeltTexture: THREE.CanvasTexture;
  bellTop: THREE.Object3D;
  repairChair: THREE.Object3D;
  rainbowArc: THREE.Object3D;
  wrongShadow: THREE.Object3D;
  fluorescentTubes: FluorescentTube[];
  rainbowBalls: BobbingMesh[];
  officePlants: BobbingMesh[];
  disposables: {
    geometries: Set<ThreeGeometry>;
    materials: Set<ThreeMaterial>;
    textures: Set<ThreeTexture>;
  };
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

function segmentCenter(index: number) {
  return index / (DREAM_SEGMENT_COUNT - 1);
}

function segmentInfluence(progress: number, index: number, radius = 0.12) {
  const distance = Math.abs(progress - segmentCenter(index));
  return 1 - smoothstep(radius, radius * 1.8, distance);
}

function addTrackedGeometry<T extends ThreeGeometry>(built: DreamSceneBuilt['disposables'], geometry: T) {
  built.geometries.add(geometry);
  return geometry;
}

function addTrackedMaterial<T extends ThreeMaterial>(built: DreamSceneBuilt['disposables'], material: T) {
  built.materials.add(material);
  return material;
}

function addTrackedTexture<T extends ThreeTexture>(built: DreamSceneBuilt['disposables'], texture: T) {
  built.textures.add(texture);
  return texture;
}

function setTransform(object: THREE.Object3D, position: Vec3, scale?: Vec3, rotation?: Vec3) {
  object.position.set(position[0], position[1], position[2]);
  if (scale) object.scale.set(scale[0], scale[1], scale[2]);
  if (rotation) object.rotation.set(rotation[0], rotation[1], rotation[2]);
  return object;
}

function makeBox(
  built: DreamSceneBuilt['disposables'],
  size: Vec3,
  material: THREE.Material,
  position: Vec3,
  rotation?: Vec3,
) {
  const geometry = addTrackedGeometry(built, new THREE.BoxGeometry(size[0], size[1], size[2]));
  const mesh = new THREE.Mesh(geometry, material);
  return setTransform(mesh, position, undefined, rotation);
}

function makeCylinder(
  built: DreamSceneBuilt['disposables'],
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments: number,
  material: THREE.Material,
  position: Vec3,
  rotation?: Vec3,
) {
  const geometry = addTrackedGeometry(
    built,
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
  );
  const mesh = new THREE.Mesh(geometry, material);
  return setTransform(mesh, position, undefined, rotation);
}

function makeSphere(
  built: DreamSceneBuilt['disposables'],
  radius: number,
  widthSegments: number,
  heightSegments: number,
  material: THREE.Material,
  position: Vec3,
  scale?: Vec3,
) {
  const geometry = addTrackedGeometry(
    built,
    new THREE.SphereGeometry(radius, widthSegments, heightSegments),
  );
  const mesh = new THREE.Mesh(geometry, material);
  return setTransform(mesh, position, scale);
}

function createConveyorTexture(disposables: DreamSceneBuilt['disposables']) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create dream conveyor texture.');

  context.fillStyle = '#e7dcc1';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#d0be96';
  for (let index = -16; index < canvas.width + 16; index += 24) {
    context.fillRect(index, 0, 10, canvas.height);
  }
  context.fillStyle = 'rgba(120, 98, 68, 0.18)';
  for (let index = 0; index < 6; index += 1) {
    context.fillRect(index * 22, 4, 2, canvas.height - 8);
  }

  const texture = addTrackedTexture(disposables, new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.2, 1);
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

function createCloudField(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  mobile: boolean,
) {
  const geometry = addTrackedGeometry(disposables, new THREE.SphereGeometry(1, 16, 12));
  const material = addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf5fbff,
    emissiveIntensity: 0.18,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  }));

  const count = mobile ? 18 : 30;
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  const clouds: CloudInstance[] = [];
  const tint = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (let index = 0; index < count; index += 1) {
    const lane = index % 3;
    const row = Math.floor(index / 3);
    const baseX = -26 + lane * 22 + (row % 2 === 0 ? 0 : 6);
    const baseZ = 22 - row * 18;
    const baseY = 11 + (index % 5) * 1.3 + row * 0.18;
    const scaleValue = 1.8 + (index % 4) * 0.55;
    clouds.push({
      position: new THREE.Vector3(baseX, baseY, baseZ),
      scale: new THREE.Vector3(scaleValue * 1.8, scaleValue, scaleValue * 1.25),
      phase: index * 0.71,
      speed: 0.08 + (index % 3) * 0.02,
      bob: 0.35 + (index % 4) * 0.08,
    });
    tint.setHSL(0.57, 0.2, 0.95 - (index % 3) * 0.03);
    mesh.setColorAt(index, tint);
    position.copy(clouds[index].position);
    scale.copy(clouds[index].scale);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  }

  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.instanceMatrix.needsUpdate = true;
  return { cloudMesh: mesh, clouds };
}

function createHouse(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  options: {
    position: Vec3;
    scale?: number;
    interior?: boolean;
    wallMaterial: THREE.Material;
    roofMaterial: THREE.Material;
    trimMaterial: THREE.Material;
    windowMaterial: THREE.Material;
    floorMaterial: THREE.Material;
    doorMaterial: THREE.Material;
  },
) {
  const group = new THREE.Group();
  const scale = options.scale ?? 1;
  group.position.set(options.position[0], options.position[1], options.position[2]);
  group.scale.setScalar(scale);
  scene.add(group);

  const shell = makeBox(disposables, [7, 4.2, 6], options.wallMaterial, [0, 2.2, 0]);
  group.add(shell);

  const roof = makeCylinder(
    disposables,
    0,
    4.7,
    7.4,
    4,
    options.roofMaterial,
    [0, 5.2, 0],
    [0, 0, Math.PI * 0.25],
  );
  roof.scale.set(1.25, 1, 1.05);
  group.add(roof);

  const porch = makeBox(disposables, [4.8, 0.3, 2.3], options.floorMaterial, [0, 0.3, 3.5]);
  group.add(porch);

  const step = makeBox(disposables, [2.4, 0.18, 1.1], options.floorMaterial, [0, 0.1, 4.7]);
  group.add(step);

  const doorFrame = makeBox(disposables, [1.55, 2.6, 0.28], options.trimMaterial, [0, 1.55, 3.05]);
  group.add(doorFrame);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.56, 0.33, 3.2);
  group.add(doorPivot);

  const door = makeBox(disposables, [1.08, 2.2, 0.18], options.doorMaterial, [0.54, 1.1, 0]);
  doorPivot.add(door);

  const windowLeft = makeBox(disposables, [1.25, 1.1, 0.14], options.windowMaterial, [-2.1, 2.25, 3.08]);
  const windowRight = makeBox(disposables, [1.25, 1.1, 0.14], options.windowMaterial, [2.1, 2.25, 3.08]);
  group.add(windowLeft, windowRight);

  const trimLeft = makeBox(disposables, [0.18, 2.5, 0.22], options.trimMaterial, [-3.28, 1.7, 3.05]);
  const trimRight = makeBox(disposables, [0.18, 2.5, 0.22], options.trimMaterial, [3.28, 1.7, 3.05]);
  group.add(trimLeft, trimRight);

  if (options.interior) {
    shell.position.z = -0.25;
    shell.scale.z = 0.78;
    const missingWall = makeBox(
      disposables,
      [0.25, 4.05, 5.4],
      options.trimMaterial,
      [3.45, 2.2, -0.15],
    );
    group.add(missingWall);
    const desk = makeBox(disposables, [2.4, 0.22, 1.2], options.floorMaterial, [-1.35, 1.2, 0.2]);
    const deskLegA = makeBox(disposables, [0.18, 1.1, 0.18], options.trimMaterial, [-2.2, 0.55, 0.55]);
    const deskLegB = makeBox(disposables, [0.18, 1.1, 0.18], options.trimMaterial, [-0.5, 0.55, -0.2]);
    const screenBody = makeBox(disposables, [1.2, 0.82, 0.22], options.trimMaterial, [-1.35, 2, 0.2]);
    const screenGlow = makeBox(disposables, [0.92, 0.58, 0.03], options.windowMaterial, [-1.35, 2, 0.34]);
    const couch = makeBox(disposables, [2.1, 0.85, 1.1], options.trimMaterial, [1.35, 0.75, -0.8]);
    const shelf = makeBox(disposables, [1.6, 2.3, 0.42], options.trimMaterial, [2.15, 1.45, 1.3]);
    group.add(desk, deskLegA, deskLegB, screenBody, screenGlow, couch, shelf);
  }

  return { group, doorPivot };
}

function buildRoad(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  roadCurve: THREE.CatmullRomCurve3,
  roadMaterial: THREE.Material,
  mobile: boolean,
) {
  const segments = mobile ? 46 : 74;
  const roadGroup = new THREE.Group();
  scene.add(roadGroup);

  for (let index = 0; index < segments; index += 1) {
    const start = roadCurve.getPoint(index / segments);
    const end = roadCurve.getPoint((index + 1) / segments);
    const delta = new THREE.Vector3().subVectors(end, start);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const length = delta.length();
    const angleY = Math.atan2(delta.x, delta.z);
    const angleZ = Math.atan2(end.y - start.y, Math.max(0.0001, Math.hypot(delta.x, delta.z)));
    const segment = makeBox(
      disposables,
      [5.2, 0.18, Math.max(1.4, length + 0.7)],
      roadMaterial,
      [midpoint.x, midpoint.y + 0.05, midpoint.z],
      [angleZ, angleY, 0],
    );
    roadGroup.add(segment);
  }
}

function buildFence(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  roadCurve: THREE.CatmullRomCurve3,
  material: THREE.Material,
  mobile: boolean,
) {
  const posts = mobile ? 64 : 104;
  const postGeometry = addTrackedGeometry(disposables, new THREE.BoxGeometry(0.12, 0.88, 0.12));
  const railGeometry = addTrackedGeometry(disposables, new THREE.BoxGeometry(0.12, 0.1, 1.45));
  const postMesh = new THREE.InstancedMesh(postGeometry, material, posts * 2);
  const railMesh = new THREE.InstancedMesh(railGeometry, material, posts * 2);
  const side = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const position = new THREE.Vector3();
  let instance = 0;

  for (let index = 0; index < posts; index += 1) {
    const t = index / Math.max(1, posts - 1);
    const point = roadCurve.getPoint(t);
    tangent.copy(roadCurve.getTangent(t)).normalize();
    side.crossVectors(up, tangent).normalize();
    for (const direction of [-1, 1] as const) {
      position.copy(point).addScaledVector(side, direction * 3.2);
      position.y += 0.45;
      quaternion.setFromAxisAngle(up, Math.atan2(tangent.x, tangent.z));
      matrix.compose(position, quaternion, scale);
      postMesh.setMatrixAt(instance, matrix);

      position.copy(point).addScaledVector(side, direction * 3.15);
      position.y += 0.66;
      matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
      railMesh.setMatrixAt(instance, matrix);
      instance += 1;
    }
  }

  postMesh.count = instance;
  railMesh.count = instance;
  postMesh.instanceMatrix.needsUpdate = true;
  railMesh.instanceMatrix.needsUpdate = true;
  scene.add(postMesh, railMesh);
}

function buildGround(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    grass: THREE.Material;
    hill: THREE.Material;
    pond: THREE.Material;
  },
) {
  const meadow = makeBox(disposables, [120, 0.2, 260], materials.grass, [0, -0.06, -88]);
  scene.add(meadow);

  const hillPositions: Array<{ position: Vec3; scale: Vec3 }> = [
    { position: [-24, 2.6, -8], scale: [12, 5, 16] },
    { position: [22, 3.2, -20], scale: [14, 6, 16] },
    { position: [-24, 4.5, -76], scale: [18, 8, 20] },
    { position: [28, 3.8, -90], scale: [16, 6.5, 18] },
    { position: [-20, 4.4, -138], scale: [16, 8, 18] },
    { position: [26, 5.2, -166], scale: [20, 9, 22] },
    { position: [0, 6.4, -216], scale: [28, 11, 16] },
  ];

  for (const hill of hillPositions) {
    const mesh = makeSphere(disposables, 1, 24, 16, materials.hill, hill.position, hill.scale);
    scene.add(mesh);
  }

  const pond = addTrackedGeometry(disposables, new THREE.CylinderGeometry(1, 1, 0.2, 28));
  const water = new THREE.Mesh(pond, materials.pond);
  setTransform(water, [7.3, 0.08, -126], [6.2, 1, 3.9], [Math.PI * 0.5, 0, 0]);
  scene.add(water);
}

function buildHeroSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    roof: THREE.Material;
    trim: THREE.Material;
    window: THREE.Material;
    floor: THREE.Material;
    door: THREE.Material;
    sign: THREE.Material;
    paper: THREE.Material;
  },
) {
  const { group, doorPivot } = createHouse(scene, disposables, {
    position: [-5.4, 0, -3],
    wallMaterial: materials.wall,
    roofMaterial: materials.roof,
    trimMaterial: materials.trim,
    windowMaterial: materials.window,
    floorMaterial: materials.floor,
    doorMaterial: materials.door,
  });

  const signPost = makeBox(disposables, [0.18, 2.2, 0.18], materials.trim, [2.8, 1.1, 2.2]);
  const sign = makeBox(disposables, [3.1, 1.18, 0.2], materials.sign, [2.8, 2.35, 2.2]);
  const note = makeBox(disposables, [1.8, 0.65, 0.08], materials.paper, [2.8, 2.35, 2.34]);
  const lampStem = makeBox(disposables, [0.16, 2.9, 0.16], materials.trim, [-1.2, 1.45, 4.8]);
  const lampTop = makeBox(disposables, [0.74, 0.36, 0.74], materials.sign, [-1.2, 3.05, 4.8]);
  scene.add(signPost, sign, note, lampStem, lampTop);

  const porchLamp = new THREE.PointLight(0xfff7d3, 1.3, 18, 2);
  porchLamp.position.set(-1.2, 3.35, 4.8);
  scene.add(porchLamp);

  group.add(makeBox(disposables, [1.8, 0.95, 0.95], materials.trim, [2.05, 0.65, -1.65]));

  return { heroDoor: { pivot: doorPivot, closedY: doorPivot.rotation.y }, porchLamp };
}

function buildPulseGuardSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    roof: THREE.Material;
    trim: THREE.Material;
    window: THREE.Material;
    floor: THREE.Material;
    door: THREE.Material;
  },
) {
  createHouse(scene, disposables, {
    position: [4.8, 0.2, -26],
    scale: 1.04,
    interior: true,
    wallMaterial: materials.wall,
    roofMaterial: materials.roof,
    trimMaterial: materials.trim,
    windowMaterial: materials.window,
    floorMaterial: materials.floor,
    doorMaterial: materials.door,
  });

  const pulseGlow = new THREE.PointLight(0xb6f5c0, 1.2, 14, 2);
  pulseGlow.position.set(3.5, 2.6, -25.2);
  scene.add(pulseGlow);
  return { pulseGlow };
}

function buildTransitSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    body: THREE.Material;
    trim: THREE.Material;
    window: THREE.Material;
    wheel: THREE.Material;
    cloud: THREE.Material;
  },
) {
  const group = new THREE.Group();
  group.position.set(11, 4.2, -50);
  scene.add(group);

  const bridge = makeBox(disposables, [8.5, 0.24, 16], materials.cloud, [0, -1.2, 0]);
  group.add(bridge);

  const body = makeBox(disposables, [7, 2.7, 3.1], materials.body, [0, 0.85, 0]);
  const nose = makeCylinder(disposables, 0.8, 0.8, 7.1, 16, materials.body, [0, 0.82, 0], [0, 0, Math.PI * 0.5]);
  nose.scale.set(1, 1.05, 0.42);
  const roof = makeBox(disposables, [6.2, 0.45, 2.9], materials.trim, [0, 2.35, 0]);
  group.add(body, nose, roof);

  for (const x of [-2.1, -0.7, 0.7, 2.1]) {
    group.add(makeBox(disposables, [0.95, 0.95, 0.08], materials.window, [x, 1.15, 1.58]));
    group.add(makeBox(disposables, [0.95, 0.95, 0.08], materials.window, [x, 1.15, -1.58]));
  }

  const wheelA = makeCylinder(disposables, 0.42, 0.42, 0.6, 14, materials.wheel, [-2.1, -0.65, 1.4], [0, 0, Math.PI * 0.5]);
  const wheelB = makeCylinder(disposables, 0.42, 0.42, 0.6, 14, materials.wheel, [2.1, -0.65, 1.4], [0, 0, Math.PI * 0.5]);
  const wheelC = makeCylinder(disposables, 0.42, 0.42, 0.6, 14, materials.wheel, [-2.1, -0.65, -1.4], [0, 0, Math.PI * 0.5]);
  const wheelD = makeCylinder(disposables, 0.42, 0.42, 0.6, 14, materials.wheel, [2.1, -0.65, -1.4], [0, 0, Math.PI * 0.5]);
  group.add(wheelA, wheelB, wheelC, wheelD);

  const cord = new THREE.Group();
  cord.position.set(2.4, 2.05, 0);
  group.add(cord);
  cord.add(makeCylinder(disposables, 0.06, 0.06, 1.3, 8, materials.trim, [0, -0.55, 0]));
  cord.add(makeCylinder(disposables, 0.18, 0.12, 0.42, 8, materials.body, [0, -1.28, 0], [0, 0, Math.PI * 0.5]));

  return { busCord: cord };
}

function buildSupermarketSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    trim: THREE.Material;
    shelf: THREE.Material;
    belt: THREE.Material;
    sign: THREE.Material;
    shadow: THREE.Material;
    accent: THREE.Material;
  },
) {
  const group = new THREE.Group();
  group.position.set(0.8, 0.2, -76);
  scene.add(group);

  group.add(makeBox(disposables, [15, 4.2, 9.5], materials.wall, [0, 2.1, 0]));
  group.add(makeBox(disposables, [14.5, 0.38, 9], materials.trim, [0, 4.35, 0]));
  group.add(makeBox(disposables, [5.8, 0.32, 3.1], materials.sign, [0, 4.05, 4.86]));
  group.add(makeBox(disposables, [5.8, 0.32, 3.1], materials.sign, [0.95, 3.45, 4.7]));

  const wrongShadow = makeBox(disposables, [6.7, 0.04, 2.7], materials.shadow, [2.2, 0.04, 3.25], [0, -0.2, 0]);
  group.add(wrongShadow);

  for (const x of [-4.4, -1.4, 1.4, 4.4]) {
    group.add(makeBox(disposables, [1.8, 2.6, 0.55], materials.shelf, [x, 1.45, -1.85]));
    group.add(makeBox(disposables, [1.8, 2.6, 0.55], materials.shelf, [x, 1.45, 1.85]));
  }

  const checkoutBase = makeBox(disposables, [4.6, 1.1, 1.7], materials.trim, [0.2, 0.58, 3]);
  const checkoutBelt = makeBox(disposables, [3.1, 0.18, 1.1], materials.belt, [-0.1, 1.18, 3]);
  const scanner = makeBox(disposables, [0.52, 0.62, 0.82], materials.accent, [1.6, 1.46, 3]);
  group.add(checkoutBase, checkoutBelt, scanner);

  return { wrongShadow };
}

function buildRepairSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    trim: THREE.Material;
    counter: THREE.Material;
    metal: THREE.Material;
    sign: THREE.Material;
  },
) {
  const group = new THREE.Group();
  group.position.set(-10.4, 0.2, -100);
  scene.add(group);

  group.add(makeBox(disposables, [10, 3.8, 6.2], materials.wall, [0, 1.9, 0]));
  group.add(makeBox(disposables, [10.6, 0.28, 6.6], materials.sign, [0, 4.04, 0]));
  group.add(makeBox(disposables, [6.2, 1.25, 2.1], materials.counter, [0, 0.7, 2.15]));
  group.add(makeBox(disposables, [2.4, 1.4, 0.72], materials.trim, [-2.4, 1.05, -1.85]));
  group.add(makeBox(disposables, [2.4, 1.4, 0.72], materials.trim, [2.4, 1.05, -1.85]));

  const bellBase = makeCylinder(disposables, 0.2, 0.22, 0.08, 16, materials.metal, [1.65, 1.38, 2.2]);
  const bellTop = makeSphere(disposables, 0.22, 16, 12, materials.sign, [1.65, 1.58, 2.2], [1, 0.88, 1]);
  const chair = new THREE.Group();
  chair.position.set(-1.5, 0.08, 0.55);
  group.add(chair);
  chair.add(makeCylinder(disposables, 0.12, 0.22, 1.1, 10, materials.metal, [0, 0.55, 0]));
  chair.add(makeCylinder(disposables, 0.68, 0.68, 0.16, 18, materials.sign, [0, 1.18, 0]));
  chair.add(makeBox(disposables, [0.88, 0.84, 0.2], materials.sign, [0, 1.8, -0.28], [0.24, 0, 0]));
  group.add(bellBase, bellTop);

  return { bellTop, repairChair: chair };
}

function buildLibrarySegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    shelf: THREE.Material;
    book: THREE.MeshStandardMaterial;
    trim: THREE.Material;
    ball: THREE.Material;
  },
  mobile: boolean,
) {
  const group = new THREE.Group();
  group.position.set(4.8, 0.2, -126);
  scene.add(group);

  group.add(makeBox(disposables, [18, 5.2, 10], materials.wall, [0, 2.6, 0]));
  const bookGeometry = addTrackedGeometry(disposables, new THREE.BoxGeometry(0.26, 1.15, 0.22));
  const bookCount = mobile ? 78 : 132;
  const books = new THREE.InstancedMesh(bookGeometry, materials.book, bookCount);
  const bookMatrix = new THREE.Matrix4();
  const bookPosition = new THREE.Vector3();
  const bookRotation = new THREE.Quaternion();
  const bookScale = new THREE.Vector3(1, 1, 1);
  const tint = new THREE.Color();
  let bookIndex = 0;
  for (const shelfX of [-6.3, -2.1, 2.1, 6.3]) {
    group.add(makeBox(disposables, [2.7, 4.2, 0.7], materials.shelf, [shelfX, 2.1, -3.2]));
    group.add(makeBox(disposables, [2.7, 4.2, 0.7], materials.shelf, [shelfX, 2.1, 3.2]));
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 11; col += 1) {
        if (bookIndex >= bookCount) break;
        bookPosition.set(shelfX - 1.05 + col * 0.2, 0.9 + row * 1.06, -2.8);
        tint.setHSL(0.12 + (bookIndex % 7) * 0.08, 0.52, 0.76);
        bookRotation.setFromEuler(new THREE.Euler(0, 0, (col % 3 - 1) * 0.04));
        bookMatrix.compose(bookPosition, bookRotation, bookScale);
        books.setMatrixAt(bookIndex, bookMatrix);
        books.setColorAt(bookIndex, tint);
        bookIndex += 1;
        if (bookIndex >= bookCount) break;
        bookPosition.set(shelfX - 1.05 + col * 0.2, 0.9 + row * 1.06, 2.8);
        tint.setHSL(0.55 + (bookIndex % 6) * 0.05, 0.44, 0.82);
        bookRotation.setFromEuler(new THREE.Euler(0, 0, (1 - (col % 3)) * 0.04));
        bookMatrix.compose(bookPosition, bookRotation, bookScale);
        books.setMatrixAt(bookIndex, bookMatrix);
        books.setColorAt(bookIndex, tint);
        bookIndex += 1;
      }
    }
  }
  if (books.instanceColor) books.instanceColor.needsUpdate = true;
  books.instanceMatrix.needsUpdate = true;
  group.add(books);

  const rainbowArc = new THREE.Group();
  rainbowArc.position.set(4.8, 2.5, 1.2);
  group.add(rainbowArc);
  const rainbowColors = [0xff8db2, 0xffd58e, 0xf8ffb0, 0xbaf4c3, 0x9fdcff];
  for (let index = 0; index < rainbowColors.length; index += 1) {
    const material = addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: rainbowColors[index],
      emissive: rainbowColors[index],
      emissiveIntensity: 0.04,
      flatShading: true,
      roughness: 0.9,
      metalness: 0,
    }));
    const geometry = addTrackedGeometry(disposables, new THREE.TorusGeometry(3.6 + index * 0.34, 0.13, 10, 48, Math.PI));
    const arc = new THREE.Mesh(geometry, material);
    arc.rotation.z = Math.PI;
    arc.position.y = index * 0.16;
    rainbowArc.add(arc);
  }

  const rainbowBalls: BobbingMesh[] = [];
  const ballOffsets = [-2.8, -1.1, 0.8, 2.4];
  for (let index = 0; index < ballOffsets.length; index += 1) {
    const x = ballOffsets[index];
    const ball = makeSphere(disposables, 0.42, 18, 14, materials.ball, [x, 0.84, 1], [1, 1, 1]);
    group.add(ball);
    rainbowBalls.push({
      mesh: ball,
      baseY: ball.position.y,
      amplitude: 0.18 + index * 0.03,
      speed: 1.2 + index * 0.25,
      phase: index * 0.6,
    });
  }

  return { rainbowArc, rainbowBalls };
}

function buildClassroomSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    desk: THREE.Material;
    trim: THREE.Material;
    monitor: THREE.Material;
    light: THREE.MeshStandardMaterial;
  },
  mobile: boolean,
) {
  const group = new THREE.Group();
  group.position.set(12, 0.2, -150);
  scene.add(group);

  group.add(makeBox(disposables, [16, 4.5, 8.2], materials.wall, [0, 2.25, 0]));
  group.add(makeBox(disposables, [15.4, 0.24, 7.6], materials.trim, [0, 4.65, 0]));
  group.add(makeBox(disposables, [15.8, 0.22, 1.6], materials.trim, [0, 0.12, -2.4]));

  const desks = mobile ? 4 : 6;
  for (let index = 0; index < desks; index += 1) {
    const x = -5.8 + (index % 3) * 5.2;
    const z = index < 3 ? -0.8 : 1.8;
    group.add(makeBox(disposables, [2.6, 0.18, 1.2], materials.desk, [x, 1.15, z]));
    group.add(makeBox(disposables, [0.16, 1.1, 0.16], materials.trim, [x - 1.1, 0.55, z - 0.42]));
    group.add(makeBox(disposables, [0.16, 1.1, 0.16], materials.trim, [x + 1.1, 0.55, z + 0.42]));
    group.add(makeBox(disposables, [1.1, 0.72, 0.22], materials.trim, [x, 1.92, z - 0.18]));
    group.add(makeBox(disposables, [0.88, 0.52, 0.04], materials.monitor, [x, 1.92, z - 0.04]));
  }

  const fluorescentTubes: FluorescentTube[] = [];
  const tubeOffsets = [-4.4, 0, 4.4];
  for (let index = 0; index < tubeOffsets.length; index += 1) {
    const x = tubeOffsets[index];
    const housing = makeBox(disposables, [3.4, 0.18, 0.32], materials.trim, [x, 4.02, -0.4]);
    const diffuser = makeBox(disposables, [3.1, 0.08, 0.18], materials.light, [x, 3.96, -0.4]);
    group.add(housing, diffuser);
    const light = new THREE.PointLight(0xf9ffe0, 0.85, 9, 2);
    light.position.set(group.position.x + x, 4.05, group.position.z - 0.4);
    scene.add(light);
    fluorescentTubes.push({
      light,
      material: materials.light,
      baseIntensity: 0.82,
      phase: index * 0.7,
    });
  }

  return { fluorescentTubes };
}

function buildOfficeSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    wall: THREE.Material;
    trim: THREE.Material;
    desk: THREE.Material;
    chair: THREE.Material;
    plant: THREE.Material;
    window: THREE.Material;
  },
) {
  const group = new THREE.Group();
  group.position.set(4.2, 0.2, -176);
  scene.add(group);

  group.add(makeBox(disposables, [13, 4.4, 8], materials.wall, [0, 2.2, 0]));
  group.add(makeBox(disposables, [4.8, 1.7, 0.18], materials.window, [0, 2.4, -3.91]));
  group.add(makeBox(disposables, [5.4, 0.2, 2.2], materials.desk, [-1.2, 1.08, 1.6]));
  group.add(makeBox(disposables, [0.18, 1.02, 0.18], materials.trim, [-3.5, 0.5, 0.8]));
  group.add(makeBox(disposables, [0.18, 1.02, 0.18], materials.trim, [1.1, 0.5, 2.4]));
  group.add(makeBox(disposables, [1.4, 0.18, 1.4], materials.chair, [2.2, 0.86, 1.4]));
  group.add(makeBox(disposables, [1, 1.35, 0.18], materials.chair, [2.2, 1.65, 0.84], [0.08, 0, 0]));

  const officePlants: BobbingMesh[] = [];
  const plantOffsets = [-4.8, 4.8];
  for (let index = 0; index < plantOffsets.length; index += 1) {
    const x = plantOffsets[index];
    const pot = makeCylinder(disposables, 0.42, 0.5, 0.62, 12, materials.desk, [x, 0.31, -1.7]);
    const leaves = makeSphere(disposables, 0.68, 16, 12, materials.plant, [x, 1.15, -1.7], [1.1, 1.2, 1.1]);
    group.add(pot, leaves);
    officePlants.push({
      mesh: leaves,
      baseY: leaves.position.y,
      amplitude: 0.08 + index * 0.02,
      speed: 0.95 + index * 0.18,
      phase: index * 0.5,
    });
  }

  return { officePlants };
}

function buildExitSegment(
  scene: THREE.Scene,
  disposables: DreamSceneBuilt['disposables'],
  materials: {
    stair: THREE.Material;
    trim: THREE.Material;
    door: THREE.Material;
    glow: THREE.Material;
  },
) {
  const group = new THREE.Group();
  group.position.set(0, 0.2, -201);
  scene.add(group);

  for (let index = 0; index < 8; index += 1) {
    group.add(makeBox(disposables, [4.4, 0.34, 2.6], materials.stair, [0, index * 0.74, index * -2.55]));
  }

  const frameLeft = makeBox(disposables, [0.22, 4.4, 0.28], materials.trim, [-1.1, 5.1, -18.4]);
  const frameRight = makeBox(disposables, [0.22, 4.4, 0.28], materials.trim, [1.1, 5.1, -18.4]);
  const lintel = makeBox(disposables, [2.5, 0.24, 0.28], materials.trim, [0, 7.15, -18.4]);
  group.add(frameLeft, frameRight, lintel);

  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.92, 2.95, -18.26);
  group.add(doorPivot);

  const exitDoor = makeBox(disposables, [1.84, 3.9, 0.18], materials.door, [0.92, 1.95, 0]);
  const glow = makeBox(disposables, [1.3, 2.8, 0.04], materials.glow, [0.92, 1.95, -0.08]);
  doorPivot.add(exitDoor, glow);

  return { exitDoor: { pivot: doorPivot, closedY: doorPivot.rotation.y } };
}

function buildDreamScene(mobile: boolean) {
  const disposables: DreamSceneBuilt['disposables'] = {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set(),
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd2ff);
  scene.fog = new THREE.Fog(0xdff5ff, 36, 260);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 340);
  camera.position.set(0, 3.4, 18);

  const ambient = new THREE.HemisphereLight(0xf7fdff, 0x8ac066, 1.75);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff3cf, 1.8);
  sun.position.set(12, 18, 8);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xcde7ff, 0.65);
  fill.position.set(-12, 10, -14);
  scene.add(fill);

  const materials = {
    wall: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xf7ecda,
      roughness: 0.92,
      metalness: 0,
      flatShading: true,
    })),
    roof: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xf0b7a3,
      roughness: 0.86,
      metalness: 0,
      flatShading: true,
    })),
    trim: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
    })),
    window: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xc8efff,
      emissive: 0x7fdcff,
      emissiveIntensity: 0.22,
      roughness: 0.18,
      metalness: 0.06,
      flatShading: true,
    })),
    floor: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xe8dfcd,
      roughness: 0.96,
      metalness: 0,
      flatShading: true,
    })),
    door: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xb3dfa8,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    })),
    sign: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xaad8ff,
      roughness: 0.84,
      metalness: 0.02,
      flatShading: true,
    })),
    paper: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xfff8db,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })),
    road: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xf8f6ef,
      roughness: 0.98,
      metalness: 0,
      flatShading: true,
    })),
    grass: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0x8fd46b,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })),
    hill: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0x7fc25f,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    })),
    pond: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0x98e0ff,
      emissive: 0x5bb4ff,
      emissiveIntensity: 0.05,
      roughness: 0.18,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 0.95,
    })),
    busBody: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xf6f0d8,
      roughness: 0.85,
      metalness: 0,
      flatShading: true,
    })),
    busTrim: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xa2dfd2,
      roughness: 0.82,
      metalness: 0.01,
      flatShading: true,
    })),
    wheel: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0x5d7a73,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true,
    })),
    shelf: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xe0d2b6,
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
    })),
    accent: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xffdf96,
      roughness: 0.82,
      metalness: 0.03,
      flatShading: true,
    })),
    counter: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xe9c8ae,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    })),
    metal: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xbcd2d5,
      roughness: 0.54,
      metalness: 0.18,
      flatShading: true,
    })),
    shadow: addTrackedMaterial(disposables, new THREE.MeshBasicMaterial({
      color: 0x52626d,
      transparent: true,
      opacity: 0.28,
      toneMapped: false,
    })),
    ball: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xffd8e8,
      roughness: 0.36,
      metalness: 0.02,
      flatShading: true,
    })),
    book: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
      flatShading: true,
    })),
    light: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0xfaffd2,
      emissive: 0xf7ffb8,
      emissiveIntensity: 0.25,
      roughness: 0.24,
      metalness: 0.02,
      flatShading: true,
    })),
    officePlant: addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
      color: 0x88c982,
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
    })),
    glow: addTrackedMaterial(disposables, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
      toneMapped: false,
    })),
  };

  const checkoutBeltTexture = createConveyorTexture(disposables);
  const checkoutBeltMaterial = addTrackedMaterial(disposables, new THREE.MeshStandardMaterial({
    color: 0xf5e8bf,
    map: checkoutBeltTexture,
    roughness: 0.78,
    metalness: 0,
    flatShading: true,
  }));

  const cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3.3, 18),
    new THREE.Vector3(-1.5, 3.6, 8),
    new THREE.Vector3(2, 3.9, -10),
    new THREE.Vector3(8.5, 5.3, -36),
    new THREE.Vector3(3.4, 4.7, -62),
    new THREE.Vector3(-7, 4.9, -88),
    new THREE.Vector3(3.6, 5.8, -116),
    new THREE.Vector3(10.8, 5.7, -144),
    new THREE.Vector3(4.2, 5.3, -170),
    new THREE.Vector3(0.1, 13.2, -191),
  ], false, 'catmullrom', 0.35);

  const targetPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.5, 2.4, -1),
    new THREE.Vector3(0, 2.4, -12),
    new THREE.Vector3(4.5, 2.8, -26),
    new THREE.Vector3(10.7, 4.1, -49),
    new THREE.Vector3(0, 2.4, -76),
    new THREE.Vector3(-10.3, 1.7, -100),
    new THREE.Vector3(4.7, 2.4, -126),
    new THREE.Vector3(12, 2.4, -150),
    new THREE.Vector3(4.3, 2.1, -176),
    new THREE.Vector3(0, 5.8, -219),
  ], false, 'catmullrom', 0.28);

  buildGround(scene, disposables, {
    grass: materials.grass,
    hill: materials.hill,
    pond: materials.pond,
  });
  buildRoad(scene, disposables, targetPath, materials.road, mobile);
  buildFence(scene, disposables, targetPath, materials.trim, mobile);

  const sunSphere = makeSphere(disposables, 1.2, 18, 14, materials.glow, [-18, 16, -14], [3.2, 3.2, 3.2]);
  scene.add(sunSphere);

  const { cloudMesh, clouds } = createCloudField(scene, disposables, mobile);
  const { heroDoor, porchLamp } = buildHeroSegment(scene, disposables, {
    wall: materials.wall,
    roof: materials.roof,
    trim: materials.trim,
    window: materials.window,
    floor: materials.floor,
    door: materials.door,
    sign: materials.sign,
    paper: materials.paper,
  });
  const { pulseGlow } = buildPulseGuardSegment(scene, disposables, {
    wall: materials.wall,
    roof: materials.roof,
    trim: materials.trim,
    window: materials.window,
    floor: materials.floor,
    door: materials.door,
  });
  const { busCord } = buildTransitSegment(scene, disposables, {
    body: materials.busBody,
    trim: materials.busTrim,
    window: materials.window,
    wheel: materials.wheel,
    cloud: materials.trim,
  });
  const { wrongShadow } = buildSupermarketSegment(scene, disposables, {
    wall: materials.wall,
    trim: materials.trim,
    shelf: materials.shelf,
    belt: checkoutBeltMaterial,
    sign: materials.sign,
    shadow: materials.shadow,
    accent: materials.accent,
  });
  const { bellTop, repairChair } = buildRepairSegment(scene, disposables, {
    wall: materials.wall,
    trim: materials.trim,
    counter: materials.counter,
    metal: materials.metal,
    sign: materials.sign,
  });
  const { rainbowArc, rainbowBalls } = buildLibrarySegment(scene, disposables, {
    wall: materials.wall,
    shelf: materials.shelf,
    book: materials.book,
    trim: materials.trim,
    ball: materials.ball,
  }, mobile);
  const { fluorescentTubes } = buildClassroomSegment(scene, disposables, {
    wall: materials.wall,
    desk: materials.floor,
    trim: materials.trim,
    monitor: materials.window,
    light: materials.light,
  }, mobile);
  const { officePlants } = buildOfficeSegment(scene, disposables, {
    wall: materials.wall,
    trim: materials.trim,
    desk: materials.counter,
    chair: materials.sign,
    plant: materials.officePlant,
    window: materials.window,
  });
  const { exitDoor } = buildExitSegment(scene, disposables, {
    stair: materials.floor,
    trim: materials.trim,
    door: materials.door,
    glow: materials.glow,
  });

  return {
    scene,
    camera,
    cameraPath,
    targetPath,
    cloudMesh,
    clouds,
    porchLamp,
    pulseGlow,
    heroDoor,
    exitDoor,
    busCord,
    checkoutBeltTexture,
    bellTop,
    repairChair,
    rainbowArc,
    wrongShadow,
    fluorescentTubes,
    rainbowBalls,
    officePlants,
    disposables,
  } satisfies DreamSceneBuilt;
}

export function createDreamScene(
  canvas: HTMLCanvasElement,
  options: DreamSceneOptions,
): DreamSceneController {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !options.mobile,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;

  const built = buildDreamScene(options.mobile);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const cloudPosition = new THREE.Vector3();
  const startedAt = performance.now();
  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const lookTarget = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  let width = 1;
  let height = 1;
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
    progress = reducedMotion ? progressTarget : mix(progress, progressTarget, 0.08);
    if (Math.abs(progressTarget - progress) < 0.0002) progress = progressTarget;

    pointer.lerp(pointerTarget, reducedMotion ? 1 : 0.08);
    applySceneChange(progress);

    cameraPosition.copy(built.cameraPath.getPointAt(progress));
    lookTarget.copy(built.targetPath.getPointAt(clamp(progress + 0.015)));
    lookTarget.x += pointer.x * 1.45;
    lookTarget.y += pointer.y * 0.85;
    cameraPosition.x += pointer.x * 0.35;
    cameraPosition.y += pointer.y * 0.12;
    built.camera.position.copy(cameraPosition);
    built.camera.lookAt(lookTarget);

    const doorOpen = clamp(smoothstep(0.065, 0.19, progress) + pointer.x * 0.06, 0, 1) * 1.16;
    built.heroDoor.pivot.rotation.y = built.heroDoor.closedY - doorOpen;
    const exitOpen = smoothstep(0.91, 0.995, progress) * 1.28;
    built.exitDoor.pivot.rotation.y = built.exitDoor.closedY - exitOpen;

    const transitInfluence = segmentInfluence(progress, 2);
    built.busCord.rotation.z = Math.sin(elapsed * 2.35 + progress * 20) * 0.12 * transitInfluence;
    built.busCord.rotation.x = Math.cos(elapsed * 1.5 + 0.2) * 0.02 * transitInfluence;

    const marketInfluence = segmentInfluence(progress, 3);
    built.checkoutBeltTexture.offset.x = reducedMotion ? 0 : elapsed * 0.18 * marketInfluence;
    built.wrongShadow.position.x = 2.2 + Math.sin(elapsed * 0.8) * 1.1 * marketInfluence;
    built.wrongShadow.rotation.y = -0.2 + Math.sin(elapsed * 0.42) * 0.12 * marketInfluence;

    const repairInfluence = segmentInfluence(progress, 4);
    built.bellTop.position.y = 1.58 + Math.max(0, Math.sin(elapsed * 3.8)) * 0.14 * repairInfluence;
    built.repairChair.rotation.y = Math.sin(elapsed * 1.6) * 0.18 * repairInfluence + pointer.x * 0.12 * repairInfluence;

    const libraryInfluence = segmentInfluence(progress, 5);
    built.rainbowArc.rotation.z = Math.sin(elapsed * 0.7) * 0.03 * libraryInfluence;
    for (const ball of built.rainbowBalls) {
      ball.mesh.position.y = ball.baseY + Math.sin(elapsed * ball.speed + ball.phase) * ball.amplitude * libraryInfluence;
    }

    const classroomInfluence = segmentInfluence(progress, 6);
    for (const tube of built.fluorescentTubes) {
      const flicker = idle
        ? 0.66 + Math.abs(Math.sin(elapsed * 13 + tube.phase)) * 0.4
        : 0.92 + Math.sin(elapsed * 2.1 + tube.phase) * 0.05;
      const intensity = mix(0, tube.baseIntensity, classroomInfluence) * flicker;
      tube.light.intensity = intensity;
      tube.material.emissiveIntensity = 0.18 + intensity * 0.2;
    }

    const officeInfluence = segmentInfluence(progress, 7);
    for (const plant of built.officePlants) {
      plant.mesh.position.y = plant.baseY + Math.sin(elapsed * plant.speed + plant.phase) * plant.amplitude * officeInfluence;
    }

    built.porchLamp.intensity = 1.1 + segmentInfluence(progress, 0, 0.18) * 0.45 + Math.max(0, pointer.x) * 0.3;
    built.pulseGlow.intensity = 1 + Math.sin(elapsed * 3.4 + progress * 8) * 0.12 + segmentInfluence(progress, 1) * 0.45;

    const cloudParallax = reducedMotion ? 0 : elapsed;
    for (let index = 0; index < built.clouds.length; index += 1) {
      const cloud = built.clouds[index];
      cloudPosition.copy(cloud.position);
      cloudPosition.x += Math.sin(cloudParallax * cloud.speed + cloud.phase) * (0.45 + pointer.x * 0.35);
      cloudPosition.y += Math.cos(cloudParallax * 0.7 + cloud.phase) * cloud.bob + Math.max(pointer.y, -0.2) * 0.18;
      scale.copy(cloud.scale);
      quaternion.identity();
      matrix.compose(cloudPosition, quaternion, scale);
      built.cloudMesh.setMatrixAt(index, matrix);
    }
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
      cancelAnimationFrame(frame);
      frame = 0;
    }
    renderScene();
  };

  const setVisible = (nextVisible: boolean) => {
    visible = nextVisible;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
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
    } else if (visible) {
      requestRender();
    }
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
    width = Math.max(1, Math.floor(nextWidth));
    height = Math.max(1, Math.floor(nextHeight));
    built.camera.aspect = width / height;
    built.camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(options.mobile ? 1 : 1.5, Math.max(1, devicePixelRatio || 1)));
    renderNow();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    renderer.dispose();
    for (const texture of Array.from(built.disposables.textures)) texture.dispose();
    for (const material of Array.from(built.disposables.materials)) material.dispose();
    for (const geometry of Array.from(built.disposables.geometries)) geometry.dispose();
    built.scene.clear();
  };

  resize(1, 1, 1);
  setVisible(true);
  requestRender();

  return {
    setProgress,
    setPointer,
    setReducedMotion,
    setVisible,
    setIdle,
    resize,
    renderNow,
    dispose,
  };
}
