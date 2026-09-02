import * as THREE from 'three';

type ThreeObject = InstanceType<typeof THREE.Object3D>;
type ThreeScene = InstanceType<typeof THREE.Scene>;
type ThreeCamera = InstanceType<typeof THREE.PerspectiveCamera>;
type ThreeRenderer = InstanceType<typeof THREE.WebGLRenderer>;
type ThreeMaterial = InstanceType<typeof THREE.Material>;
type ThreeGeometry = InstanceType<typeof THREE.BufferGeometry>;
type ThreeSphereGeometry = InstanceType<typeof THREE.SphereGeometry>;
type ThreeGroup = InstanceType<typeof THREE.Group>;
type ThreeMesh = InstanceType<typeof THREE.Mesh>;
type ThreePointLight = InstanceType<typeof THREE.PointLight>;
type ThreePoints = InstanceType<typeof THREE.Points>;
type ThreeShaderMaterial = InstanceType<typeof THREE.ShaderMaterial>;
type ThreeCurve = InstanceType<typeof THREE.CatmullRomCurve3>;

type Vec3 = readonly [number, number, number];

type Transform = {
  position: Vec3;
  scale: Vec3;
  rotation?: Vec3;
};

type GeometryKit = ReturnType<typeof createGeometryKit>;
type ObservatoryMaterials = ReturnType<typeof createMaterials>;

type FlickerLight = {
  light: ThreePointLight;
  base: number;
  phase: number;
  speed: number;
};

type AnimatedParts = {
  pulseRings: ThreeObject[];
  pulseScanner: ThreeObject | null;
  colabNodes: ThreeObject[];
  colabNetwork: ThreeGroup | null;
  foundationPapers: ThreeObject[];
  labLattice: ThreeGroup | null;
  labLens: ThreeObject | null;
  domeRings: ThreeObject[];
};

type BuiltScene = {
  scene: ThreeScene;
  camera: ThreeCamera;
  waterMaterial: ThreeShaderMaterial;
  sky: ThreeMesh;
  stars: ThreePoints;
  dust: ThreePoints;
  pointerLight: ThreePointLight;
  flickerLights: FlickerLight[];
  animated: AnimatedParts;
  cameraPath: ThreeCurve;
  targetPath: ThreeCurve;
};

export type ObservatorySceneOptions = {
  mobile: boolean;
  reducedMotion: boolean;
};

export type ObservatorySceneController = {
  setProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  setVisible: (visible: boolean) => void;
  resize: (width: number, height: number, devicePixelRatio: number) => void;
  renderNow: () => void;
  dispose: () => void;
};

const TAU = Math.PI * 2;
const CAMERA_SNAP_STOPS = [0, 0.155, 0.28, 0.385, 0.475, 0.565, 0.655, 0.79, 0.9, 1] as const;

const palette = {
  void: 0x063f52,
  nightSlate: 0x18aeb8,
  concrete: 0xffe58d,
  ivory: 0xfffbed,
  fogBlue: 0x57e4e7,
  oxide: 0xff6f91,
  sodium: 0xeaff43,
  cobalt: 0x2447c7,
  leaf: 0xbfe900,
  petal: 0xff9fc1,
} as const;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const amount = clamp((value - edge0) / Math.max(0.00001, edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
};

function nearestStop(progress: number) {
  return CAMERA_SNAP_STOPS.reduce((nearest, stop) => (
    Math.abs(stop - progress) < Math.abs(nearest - progress) ? stop : nearest
  ), CAMERA_SNAP_STOPS[0]);
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createGeometryKit(mobile: boolean) {
  return {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, mobile ? 12 : 20),
    node: new THREE.IcosahedronGeometry(1, mobile ? 1 : 2),
    smallNode: new THREE.IcosahedronGeometry(1, 1),
    leaf: new THREE.SphereGeometry(1, mobile ? 10 : 16, mobile ? 7 : 12),
  };
}

function createMaterials() {
  const structure = new THREE.MeshStandardMaterial({
    color: palette.cobalt,
    roughness: 0.58,
    metalness: 0.22,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: palette.concrete,
    roughness: 0.44,
    metalness: 0.12,
  });
  const floor = new THREE.MeshStandardMaterial({
    color: 0x67ddd1,
    roughness: 0.38,
    metalness: 0.08,
  });
  const paper = new THREE.MeshStandardMaterial({
    color: palette.ivory,
    emissive: 0x37332e,
    emissiveIntensity: 0.12,
    roughness: 0.92,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: palette.leaf,
    emissive: 0x426500,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.28,
    roughness: 0.18,
    metalness: 0.04,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ivoryGlow = new THREE.MeshBasicMaterial({
    color: palette.ivory,
    transparent: true,
    opacity: 0.68,
    toneMapped: false,
  });
  const fogGlow = new THREE.MeshBasicMaterial({
    color: palette.fogBlue,
    transparent: true,
    opacity: 0.52,
    toneMapped: false,
  });
  const dimIvoryGlow = new THREE.MeshBasicMaterial({
    color: palette.ivory,
    transparent: true,
    opacity: 0.42,
    toneMapped: false,
  });
  const sodiumGlow = new THREE.MeshBasicMaterial({
    color: palette.sodium,
    transparent: true,
    opacity: 0.68,
    toneMapped: false,
  });
  const oxideGlow = new THREE.MeshBasicMaterial({
    color: palette.oxide,
    transparent: true,
    opacity: 0.72,
    toneMapped: false,
  });
  const shadow = new THREE.MeshBasicMaterial({
    color: palette.void,
    transparent: true,
    opacity: 0.52,
  });

  const leaf = new THREE.MeshStandardMaterial({
    color: palette.leaf,
    emissive: 0x365f00,
    emissiveIntensity: 0.2,
    roughness: 0.32,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const petal = new THREE.MeshStandardMaterial({
    color: palette.petal,
    emissive: 0x76243d,
    emissiveIntensity: 0.17,
    roughness: 0.38,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });

  return {
    structure,
    steel,
    floor,
    paper,
    glass,
    ivoryGlow,
    fogGlow,
    dimIvoryGlow,
    sodiumGlow,
    oxideGlow,
    shadow,
    leaf,
    petal,
  };
}

function addBox(
  parent: ThreeObject,
  kit: GeometryKit,
  material: ThreeMaterial,
  size: Vec3,
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(kit.box, material);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addCylinder(
  parent: ThreeObject,
  kit: GeometryKit,
  material: ThreeMaterial,
  radius: number,
  height: number,
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(kit.cylinder, material);
  mesh.position.set(...position);
  mesh.scale.set(radius, height, radius);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addPlane(
  parent: ThreeObject,
  kit: GeometryKit,
  material: ThreeMaterial,
  size: readonly [number, number],
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(kit.plane, material);
  mesh.position.set(...position);
  mesh.scale.set(size[0], size[1], 1);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function addInstancedBoxes(
  parent: ThreeObject,
  kit: GeometryKit,
  material: ThreeMaterial,
  transforms: Transform[],
) {
  const instances = new THREE.InstancedMesh(kit.box, material, transforms.length);
  const dummy = new THREE.Object3D();

  transforms.forEach((transform, index) => {
    dummy.position.set(...transform.position);
    dummy.scale.set(...transform.scale);
    dummy.rotation.set(...(transform.rotation ?? [0, 0, 0]));
    dummy.updateMatrix();
    instances.setMatrixAt(index, dummy.matrix);
  });

  instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  instances.computeBoundingSphere();
  parent.add(instances);
  return instances;
}

function addInstancedShapes(
  parent: ThreeObject,
  geometry: ThreeSphereGeometry,
  material: ThreeMaterial,
  transforms: Transform[],
) {
  const instances = new THREE.InstancedMesh(geometry, material, transforms.length);
  const dummy = new THREE.Object3D();

  transforms.forEach((transform, index) => {
    dummy.position.set(...transform.position);
    dummy.scale.set(...transform.scale);
    dummy.rotation.set(...(transform.rotation ?? [0, 0, 0]));
    dummy.updateMatrix();
    instances.setMatrixAt(index, dummy.matrix);
  });

  instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  instances.computeBoundingSphere();
  parent.add(instances);
  return instances;
}

function addLine(
  parent: ThreeObject,
  points: InstanceType<typeof THREE.Vector3>[],
  color: number,
  opacity = 1,
) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
  });
  const line = new THREE.Line(geometry, material);
  parent.add(line);
  return line;
}

const waterVertexShader = [
  '#include <fog_pars_vertex>',
  'uniform float uTime;',
  'varying vec2 vUv;',
  'varying float vWave;',
  'void main() {',
  '  vUv = uv;',
  '  vec3 p = position;',
  '  float broad = sin(p.x * 0.115 + uTime * 0.31) * 0.075;',
  '  float crossWave = sin(p.y * 0.082 - uTime * 0.22 + p.x * 0.035) * 0.055;',
  '  float fine = sin((p.x + p.y) * 0.34 + uTime * 0.48) * 0.018;',
  '  vWave = broad + crossWave + fine;',
  '  p.z += vWave;',
  '  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);',
  '  gl_Position = projectionMatrix * mvPosition;',
  '  #include <fog_vertex>',
  '}',
].join('\n');

const waterFragmentShader = [
  '#include <fog_pars_fragment>',
  'uniform float uTime;',
  'varying vec2 vUv;',
  'varying float vWave;',
  'float hash(vec2 p) {',
  '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);',
  '}',
  'void main() {',
  '  float horizon = smoothstep(0.08, 0.92, vUv.y);',
  '  vec3 deep = vec3(0.015, 0.36, 0.45);',
  '  vec3 reflected = vec3(0.18, 0.92, 0.86);',
  '  vec3 color = mix(deep, reflected, horizon * 0.82);',
  '  float ripple = sin(vUv.x * 210.0 + vUv.y * 34.0 + uTime * 0.55);',
  '  ripple *= sin(vUv.y * 164.0 - uTime * 0.32);',
  '  color += vec3(0.92, 1.0, 0.70) * max(0.0, ripple) * 0.065;',
  '  float causewayReflection = exp(-pow((vUv.x - 0.5) * 28.0, 2.0));',
  '  causewayReflection *= 0.4 + 0.6 * sin(vUv.y * 240.0 + uTime * 0.4) * sin(vUv.y * 240.0 + uTime * 0.4);',
  '  color += vec3(1.0, 0.56, 0.66) * causewayReflection * 0.24;',
  '  float grain = hash(floor(vUv * vec2(920.0, 660.0) + uTime * 0.02));',
  '  color += step(0.996, grain) * vec3(1.0, 0.98, 0.66) * 0.34;',
  '  color += vWave * vec3(0.10, 0.28, 0.24);',
  '  gl_FragColor = vec4(color, 1.0);',
  '  #include <fog_fragment>',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n');

const skyVertexShader = [
  'varying vec3 vDirection;',
  'void main() {',
  '  vDirection = normalize(position);',
  '  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);',
  '  gl_Position = projectionMatrix * viewPosition;',
  '}',
].join('\n');

const skyFragmentShader = [
  'varying vec3 vDirection;',
  'void main() {',
  '  float altitude = clamp(vDirection.y * 0.5 + 0.5, 0.0, 1.0);',
  '  vec3 zenith = vec3(1.0, 0.88, 0.30);',
  '  vec3 mid = vec3(0.39, 0.88, 0.92);',
  '  vec3 dawn = vec3(1.0, 0.48, 0.65);',
  '  vec3 color = mix(mid, zenith, smoothstep(0.38, 0.9, altitude));',
  '  float horizonBand = exp(-pow((altitude - 0.46) * 10.0, 2.0));',
  '  color = mix(color, dawn, horizonBand * 0.52);',
  '  float moonHaze = pow(max(0.0, dot(normalize(vDirection), normalize(vec3(-0.42, 0.33, -0.84)))), 18.0);',
  '  color += vec3(1.0, 0.98, 0.78) * moonHaze * 0.42;',
  '  gl_FragColor = vec4(color, 1.0);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}',
].join('\n');

function createSky(parent: ThreeObject, mobile: boolean) {
  const geometry = new THREE.SphereGeometry(210, mobile ? 20 : 36, mobile ? 12 : 20);
  const material = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  parent.add(sky);
  return sky;
}

function createWater(parent: ThreeObject, mobile: boolean) {
  const geometry = new THREE.PlaneGeometry(
    220,
    270,
    mobile ? 28 : 62,
    mobile ? 38 : 88,
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: { value: 0 },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    fog: true,
  });
  const water = new THREE.Mesh(geometry, material);
  water.position.set(0, -0.52, -25);
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = false;
  parent.add(water);
  return material;
}

function createPointField(
  parent: ThreeObject,
  count: number,
  seed: number,
  bounds: {
    x: readonly [number, number];
    y: readonly [number, number];
    z: readonly [number, number];
  },
  color: number,
  size: number,
  opacity: number,
) {
  const random = createRandom(seed);
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = mix(bounds.x[0], bounds.x[1], random());
    positions[index * 3 + 1] = mix(bounds.y[0], bounds.y[1], random());
    positions[index * 3 + 2] = mix(bounds.z[0], bounds.z[1], random());
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const points = new THREE.Points(geometry, material);
  parent.add(points);
  return points;
}

function createCauseway(
  scene: ThreeScene,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
) {
  const causeway = new THREE.Group();
  causeway.name = 'causeway';
  scene.add(causeway);

  addBox(causeway, kit, materials.floor, [6.2, 0.25, 43], [0, -0.05, 20.5]);
  addBox(causeway, kit, materials.steel, [0.13, 0.12, 43], [-3.05, 0.18, 20.5]);
  addBox(causeway, kit, materials.steel, [0.13, 0.12, 43], [3.05, 0.18, 20.5]);
  addBox(causeway, kit, materials.fogGlow, [0.025, 0.025, 42.5], [-2.84, 0.35, 20.5]);
  addBox(causeway, kit, materials.fogGlow, [0.025, 0.025, 42.5], [2.84, 0.35, 20.5]);

  const postTransforms: Transform[] = [];
  const archTransforms: Transform[] = [];
  const count = mobile ? 8 : 11;

  for (let index = 0; index < count; index += 1) {
    const z = 39 - index * (39 / Math.max(1, count - 1));
    postTransforms.push(
      { position: [-3.05, 1.08, z], scale: [0.11, 1.8, 0.11] },
      { position: [3.05, 1.08, z], scale: [0.11, 1.8, 0.11] },
    );

    if (index % 2 === 0) {
      archTransforms.push(
        { position: [-3.05, 3.5, z], scale: [0.14, 2.7, 0.14] },
        { position: [3.05, 3.5, z], scale: [0.14, 2.7, 0.14] },
        { position: [0, 6.1, z], scale: [6.2, 0.14, 0.14] },
      );
    }
  }

  addInstancedBoxes(causeway, kit, materials.steel, postTransforms);
  addInstancedBoxes(causeway, kit, materials.structure, archTransforms);

  const lampTransforms: Transform[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const z = 37 - index * (37 / Math.max(1, count - 2));
    lampTransforms.push(
      { position: [-3.05, 2.25, z], scale: [0.18, 0.08, 0.24] },
      { position: [3.05, 2.25, z], scale: [0.18, 0.08, 0.24] },
    );
  }
  addInstancedBoxes(causeway, kit, materials.sodiumGlow, lampTransforms);

  const pylonTransforms: Transform[] = [];
  const leafTransforms: Transform[] = [];
  const petalTransforms: Transform[] = [];
  const random = createRandom(1926);
  const pylonCount = mobile ? 14 : 28;
  for (let index = 0; index < pylonCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * mix(12, 52, random());
    const height = mix(2.2, 8.5, random());
    const z = mix(-8, 68, random());
    pylonTransforms.push({
      position: [x, height * 0.5 - 0.45, z],
      scale: [mix(0.12, 0.36, random()), height, mix(0.12, 0.36, random())],
      rotation: [0, random() * 0.3, mix(-0.04, 0.04, random())],
    });

    const canopy: Transform = {
      position: [x + mix(-1.1, 1.1, random()), height - 0.25, z],
      scale: [mix(1.2, 3.5, random()), mix(0.16, 0.34, random()), mix(0.7, 2.1, random())],
      rotation: [mix(-0.5, 0.5, random()), random() * TAU, mix(-0.35, 0.35, random())],
    };
    (index % 3 === 0 ? petalTransforms : leafTransforms).push(canopy);
  }
  addInstancedBoxes(causeway, kit, materials.leaf, pylonTransforms);
  addInstancedShapes(causeway, kit.leaf, materials.leaf, leafTransforms);
  addInstancedShapes(causeway, kit.leaf, materials.petal, petalTransforms);
}

function createTicketHall(
  scene: ThreeScene,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
) {
  const hall = new THREE.Group();
  hall.name = 'ticket-hall';
  scene.add(hall);

  addBox(hall, kit, materials.floor, [21.5, 0.26, 19], [0, 0, -7.2]);
  addBox(hall, kit, materials.structure, [0.35, 7.2, 19], [-10.65, 3.45, -7.2]);
  addBox(hall, kit, materials.structure, [0.35, 7.2, 19], [10.65, 3.45, -7.2]);
  addBox(hall, kit, materials.structure, [21.5, 0.24, 19], [0, 7.05, -7.2]);

  const columnTransforms: Transform[] = [];
  for (const x of [-8.2, -5.3, 5.3, 8.2]) {
    columnTransforms.push({ position: [x, 3.45, -6.8], scale: [0.4, 6.9, 0.4] });
  }
  for (const z of [1.6, -15.8]) {
    columnTransforms.push(
      { position: [-10.1, 3.5, z], scale: [0.55, 7, 0.55] },
      { position: [10.1, 3.5, z], scale: [0.55, 7, 0.55] },
      { position: [0, 6.7, z], scale: [20.2, 0.55, 0.55] },
    );
  }
  addInstancedBoxes(hall, kit, materials.steel, columnTransforms);

  const booth = new THREE.Group();
  booth.position.set(4.25, 0, -5.2);
  hall.add(booth);
  addBox(booth, kit, materials.structure, [4.4, 0.35, 4.1], [0, 0.28, 0]);
  addBox(booth, kit, materials.steel, [0.2, 2.8, 4], [-2.05, 1.8, 0]);
  addBox(booth, kit, materials.steel, [0.2, 2.8, 4], [2.05, 1.8, 0]);
  addBox(booth, kit, materials.steel, [4.2, 0.2, 4], [0, 3.15, 0]);
  addPlane(booth, kit, materials.glass, [3.7, 2.55], [-2.13, 1.78, 0], [0, Math.PI / 2, 0]);
  addPlane(booth, kit, materials.glass, [3.7, 2.55], [0, 1.78, 2.08]);
  addBox(booth, kit, materials.sodiumGlow, [0.035, 2.15, 3.45], [-2.24, 1.75, 0]);

  const benchCount = mobile ? 2 : 4;
  for (let index = 0; index < benchCount; index += 1) {
    const z = -1.5 - index * 3.7;
    addBox(hall, kit, materials.steel, [3.3, 0.2, 0.7], [-5.5, 1.0, z]);
    addBox(hall, kit, materials.structure, [0.15, 1.0, 0.15], [-6.85, 0.5, z]);
    addBox(hall, kit, materials.structure, [0.15, 1.0, 0.15], [-4.15, 0.5, z]);
  }

  const ceilingRingCount = mobile ? 2 : 4;
  for (let index = 0; index < ceilingRingCount; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.25 + index * 0.16, 0.025, 8, mobile ? 28 : 48),
      index % 2 === 0 ? materials.ivoryGlow : materials.sodiumGlow,
    );
    ring.position.set(-1.1, 6.58 - index * 0.015, -3.8 - index * 2.7);
    ring.rotation.x = Math.PI / 2;
    hall.add(ring);
  }
}

function createBayFrame(
  corridor: ThreeGroup,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  side: -1 | 1,
  z: number,
  glow: ThreeMaterial,
) {
  const x = side * 8.78;
  addBox(corridor, kit, materials.steel, [0.34, 5.5, 0.24], [x, 3.05, z - 2.75]);
  addBox(corridor, kit, materials.steel, [0.34, 5.5, 0.24], [x, 3.05, z + 2.75]);
  addBox(corridor, kit, materials.steel, [0.34, 0.24, 5.75], [x, 5.7, z]);
  addBox(corridor, kit, glow, [0.035, 0.04, 5.35], [side * 8.55, 5.42, z]);
  addPlane(
    corridor,
    kit,
    materials.glass,
    [5.35, 5.15],
    [side * 8.94, 3.0, z],
    [0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0],
  );
}

function createCorridor(
  scene: ThreeScene,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
) {
  const corridor = new THREE.Group();
  corridor.name = 'archive-corridor';
  scene.add(corridor);

  addBox(corridor, kit, materials.floor, [18, 0.22, 69], [0, 0, -50.2]);
  addBox(corridor, kit, materials.structure, [0.25, 7.2, 69], [-9, 3.5, -50.2]);
  addBox(corridor, kit, materials.structure, [0.25, 7.2, 69], [9, 3.5, -50.2]);
  addBox(corridor, kit, materials.structure, [18, 0.18, 69], [0, 7.08, -50.2]);
  addBox(corridor, kit, materials.fogGlow, [0.035, 0.025, 67.5], [-8.35, 0.3, -50.2]);
  addBox(corridor, kit, materials.fogGlow, [0.035, 0.025, 67.5], [8.35, 0.3, -50.2]);
  addBox(corridor, kit, materials.ivoryGlow, [0.018, 0.02, 67.5], [0, 0.27, -50.2]);

  const ribs: Transform[] = [];
  const ribCount = mobile ? 12 : 19;
  for (let index = 0; index < ribCount; index += 1) {
    const z = -17.2 - index * (66 / Math.max(1, ribCount - 1));
    ribs.push(
      { position: [-8.7, 3.5, z], scale: [0.25, 7, 0.28] },
      { position: [8.7, 3.5, z], scale: [0.25, 7, 0.28] },
      { position: [0, 6.86, z], scale: [17.65, 0.25, 0.28] },
    );
  }
  addInstancedBoxes(corridor, kit, materials.steel, ribs);

  const ceilingLights: Transform[] = [];
  const lightCount = mobile ? 10 : 18;
  for (let index = 0; index < lightCount; index += 1) {
    ceilingLights.push({
      position: [0, 6.69, -18.5 - index * (63 / Math.max(1, lightCount - 1))],
      scale: [3.6, 0.025, 0.08],
    });
  }
  addInstancedBoxes(corridor, kit, materials.ivoryGlow, ceilingLights);

  createBayFrame(corridor, kit, materials, -1, -28, materials.oxideGlow);
  createBayFrame(corridor, kit, materials, 1, -42, materials.dimIvoryGlow);
  createBayFrame(corridor, kit, materials, -1, -56, materials.sodiumGlow);
  createBayFrame(corridor, kit, materials, 1, -70, materials.fogGlow);

  return corridor;
}

function createPulseArtifact(
  corridor: ThreeGroup,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
  animated: AnimatedParts,
) {
  const artifact = new THREE.Group();
  artifact.name = 'pulseguard-rings';
  artifact.position.set(-7.75, 3.0, -28);
  corridor.add(artifact);

  const ringCount = mobile ? 3 : 5;
  for (let index = 0; index < ringCount; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.7 + index * 0.39,
        index === 0 ? 0.055 : 0.025,
        mobile ? 8 : 12,
        mobile ? 36 : 72,
      ),
      index === 0 ? materials.ivoryGlow : materials.oxideGlow,
    );
    ring.rotation.y = Math.PI / 2;
    ring.rotation.x = index * 0.08;
    artifact.add(ring);
    animated.pulseRings.push(ring);
  }

  const tracePoints = [
    [-0.12, -1.2, -2.15],
    [-0.12, -1.2, -1.45],
    [-0.12, -0.82, -1.08],
    [-0.12, -1.63, -0.62],
    [-0.12, -0.42, -0.08],
    [-0.12, -1.2, 0.45],
    [-0.12, -1.2, 1.05],
    [-0.12, -0.93, 1.35],
    [-0.12, -1.42, 1.66],
    [-0.12, -1.2, 2.18],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  addLine(artifact, tracePoints, palette.oxide, 0.82);

  const scanner = addBox(
    artifact,
    kit,
    materials.oxideGlow,
    [0.025, 4.35, 0.035],
    [0.12, 0, 0],
  );
  animated.pulseScanner = scanner;

  const core = new THREE.Mesh(kit.node, materials.ivoryGlow);
  core.scale.setScalar(0.19);
  artifact.add(core);
}

function createColabArtifact(
  corridor: ThreeGroup,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
  animated: AnimatedParts,
) {
  const artifact = new THREE.Group();
  artifact.name = 'colab-connections';
  artifact.position.set(7.72, 3.0, -42);
  corridor.add(artifact);
  animated.colabNetwork = artifact;

  const coordinates: readonly Vec3[] = mobile
    ? [
        [0, 1.35, -1.6],
        [0, 0.72, 0],
        [0, -0.65, -1.05],
        [0, -1.2, 1.25],
        [0, 1.15, 1.65],
      ]
    : [
        [0, 1.55, -1.8],
        [0, 0.82, -0.4],
        [0, -0.55, -1.35],
        [0, -1.42, 0.22],
        [0, -0.62, 1.7],
        [0, 0.78, 1.25],
        [0, 1.62, 0.28],
      ];
  const connectionPairs = mobile
    ? [[0, 1], [1, 2], [1, 3], [1, 4], [3, 4]]
    : [[0, 1], [0, 6], [1, 2], [1, 3], [1, 5], [2, 3], [3, 4], [4, 5], [5, 6], [1, 4]];

  connectionPairs.forEach(([from, to]) => {
    const start = coordinates[from];
    const end = coordinates[to];
    addLine(
      artifact,
      [new THREE.Vector3(...start), new THREE.Vector3(...end)],
      palette.fogBlue,
      0.42,
    );
  });

  coordinates.forEach((position, index) => {
    const node = new THREE.Mesh(
      index === 1 ? kit.node : kit.smallNode,
      index === 1 ? materials.ivoryGlow : materials.dimIvoryGlow,
    );
    node.position.set(...position);
    node.scale.setScalar(index === 1 ? 0.27 : 0.14);
    artifact.add(node);
    animated.colabNodes.push(node);

    if (!mobile && index % 2 === 0) {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(0.27, 0.012, 6, 24),
        materials.dimIvoryGlow,
      );
      orbit.position.set(...position);
      orbit.rotation.y = Math.PI / 2;
      artifact.add(orbit);
    }
  });
}

function createFoundationArtifact(
  corridor: ThreeGroup,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
  animated: AnimatedParts,
) {
  const artifact = new THREE.Group();
  artifact.name = 'foundation-trays';
  artifact.position.set(-7.72, 1.2, -56);
  corridor.add(artifact);

  const trayCount = mobile ? 3 : 5;
  for (let index = 0; index < trayCount; index += 1) {
    const y = index * 0.78;
    const shift = (index % 2 === 0 ? -1 : 1) * index * 0.055;
    addBox(artifact, kit, materials.steel, [1.22, 0.12, 4.15], [0, y, shift]);
    addBox(artifact, kit, materials.steel, [1.28, 0.3, 0.12], [0, y + 0.13, -2.04 + shift]);
    addBox(artifact, kit, materials.steel, [1.28, 0.3, 0.12], [0, y + 0.13, 2.04 + shift]);

    const paper = addBox(
      artifact,
      kit,
      materials.paper,
      [1.01, 0.035, 3.45],
      [-0.03 + index * 0.018, y + 0.12, 0.06 + shift],
      [0, index * 0.018, index % 2 === 0 ? -0.012 : 0.014],
    );
    animated.foundationPapers.push(paper);

    const ruleCount = mobile ? 2 : 4;
    for (let rule = 0; rule < ruleCount; rule += 1) {
      addBox(
        paper,
        kit,
        materials.shadow,
        [0.015, 0.014, 0.52],
        [-0.515, 0.56, -1.05 + rule * 0.7],
      );
    }
  }

  addBox(artifact, kit, materials.sodiumGlow, [0.025, 4.1, 4.8], [-0.68, 1.65, 0]);
}

function createLabArtifact(
  corridor: ThreeGroup,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
  animated: AnimatedParts,
) {
  const artifact = new THREE.Group();
  artifact.name = 'local-ai-lens';
  artifact.position.set(7.68, 3.0, -70);
  corridor.add(artifact);

  const lens = new THREE.Group();
  artifact.add(lens);
  animated.labLens = lens;

  const outerLens = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.085, mobile ? 8 : 12, mobile ? 42 : 76),
    materials.fogGlow,
  );
  outerLens.rotation.y = Math.PI / 2;
  lens.add(outerLens);

  const innerLens = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.032, 8, mobile ? 32 : 58),
    materials.ivoryGlow,
  );
  innerLens.rotation.y = Math.PI / 2;
  innerLens.rotation.x = 0.22;
  lens.add(innerLens);

  const lensGlass = new THREE.Mesh(
    new THREE.CircleGeometry(1.62, mobile ? 28 : 52),
    materials.glass,
  );
  lensGlass.rotation.y = Math.PI / 2;
  lensGlass.position.x = -0.02;
  lens.add(lensGlass);

  const lattice = new THREE.Group();
  lattice.position.x = -0.18;
  artifact.add(lattice);
  animated.labLattice = lattice;

  const nodePositions: Vec3[] = [];
  const divisions = mobile ? 2 : 3;
  for (let y = 0; y < divisions; y += 1) {
    for (let z = 0; z < divisions; z += 1) {
      const yPosition = mix(-1.1, 1.1, y / Math.max(1, divisions - 1));
      const zPosition = mix(-1.1, 1.1, z / Math.max(1, divisions - 1));
      const xPosition = ((y + z) % 2 === 0 ? -1 : 1) * 0.38;
      nodePositions.push([xPosition, yPosition, zPosition]);
    }
  }

  nodePositions.forEach((position, index) => {
    const node = new THREE.Mesh(kit.smallNode, index % 2 === 0 ? materials.fogGlow : materials.dimIvoryGlow);
    node.position.set(...position);
    node.scale.setScalar(index % 3 === 0 ? 0.105 : 0.072);
    lattice.add(node);

    const next = nodePositions[index + 1];
    if (next && index % divisions !== divisions - 1) {
      addLine(lattice, [new THREE.Vector3(...position), new THREE.Vector3(...next)], palette.fogBlue, 0.4);
    }
    const nextRow = nodePositions[index + divisions];
    if (nextRow) {
      addLine(lattice, [new THREE.Vector3(...position), new THREE.Vector3(...nextRow)], palette.ivory, 0.24);
    }
  });

  addCylinder(artifact, kit, materials.fogGlow, 0.055, 4.1, [0, 0, 0], [0, 0, Math.PI / 2]);
}

function createArtifacts(
  corridor: ThreeGroup,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
  animated: AnimatedParts,
) {
  createPulseArtifact(corridor, kit, materials, mobile, animated);
  createColabArtifact(corridor, kit, materials, mobile, animated);
  createFoundationArtifact(corridor, kit, materials, mobile, animated);
  createLabArtifact(corridor, kit, materials, mobile, animated);
}

function createCalibrationDome(
  scene: ThreeScene,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
  animated: AnimatedParts,
) {
  const dome = new THREE.Group();
  dome.name = 'calibration-dome';
  dome.position.set(0, 0, -98);
  scene.add(dome);

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 0.32, mobile ? 32 : 64),
    materials.floor,
  );
  floor.position.y = -0.02;
  dome.add(floor);

  const shellMaterial = new THREE.MeshBasicMaterial({
    color: palette.fogBlue,
    wireframe: true,
    transparent: true,
    opacity: mobile ? 0.12 : 0.17,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(
      15,
      mobile ? 24 : 48,
      mobile ? 10 : 20,
      0,
      TAU,
      0,
      Math.PI / 2,
    ),
    shellMaterial,
  );
  shell.position.y = 0;
  dome.add(shell);

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(14.85, 0.14, 10, mobile ? 48 : 92),
    materials.steel,
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.15;
  dome.add(baseRing);

  const meridianCount = mobile ? 5 : 9;
  for (let index = 0; index < meridianCount; index += 1) {
    const meridian = new THREE.Mesh(
      new THREE.TorusGeometry(14.92, 0.025, 6, mobile ? 48 : 80, Math.PI),
      materials.fogGlow,
    );
    meridian.position.y = 0.02;
    meridian.rotation.set(Math.PI / 2, index * (Math.PI / meridianCount), Math.PI / 2);
    dome.add(meridian);
  }

  const oculus = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.16, 10, mobile ? 40 : 72),
    materials.ivoryGlow,
  );
  oculus.rotation.x = Math.PI / 2;
  oculus.position.y = 14.62;
  dome.add(oculus);

  addCylinder(dome, kit, materials.structure, 0.82, 4.4, [0, 2.05, 0]);
  addCylinder(dome, kit, materials.steel, 2.9, 0.2, [0, 4.22, 0]);

  const gimbal = new THREE.Group();
  gimbal.position.y = 5.45;
  dome.add(gimbal);
  const gimbalSpecs = [
    { radius: 3.7, rotation: [0, 0, 0] as Vec3, material: materials.fogGlow },
    { radius: 3.15, rotation: [0.45, 0.75, 0] as Vec3, material: materials.dimIvoryGlow },
    { radius: 2.55, rotation: [-0.5, -0.25, 0.7] as Vec3, material: materials.sodiumGlow },
  ];
  gimbalSpecs.forEach((specification) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        specification.radius,
        0.055,
        mobile ? 7 : 10,
        mobile ? 40 : 72,
      ),
      specification.material,
    );
    ring.rotation.set(...specification.rotation);
    gimbal.add(ring);
    animated.domeRings.push(ring);
  });

  const calibrationCore = new THREE.Mesh(kit.node, materials.ivoryGlow);
  calibrationCore.scale.setScalar(0.55);
  gimbal.add(calibrationCore);

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: palette.fogBlue,
    transparent: true,
    opacity: 0.055,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 2.2, 10.4, mobile ? 16 : 28, 1, true),
    beamMaterial,
  );
  beam.position.y = 9.6;
  dome.add(beam);

  const radialMarks: Transform[] = [];
  const markCount = mobile ? 18 : 36;
  for (let index = 0; index < markCount; index += 1) {
    const angle = (index / markCount) * TAU;
    const radius = 10.8;
    radialMarks.push({
      position: [Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius],
      scale: [index % 3 === 0 ? 0.12 : 0.06, 0.025, index % 3 === 0 ? 1.05 : 0.55],
      rotation: [0, -angle, 0],
    });
  }
  addInstancedBoxes(dome, kit, materials.ivoryGlow, radialMarks);

  return dome;
}

function createRoofline(
  scene: ThreeScene,
  kit: GeometryKit,
  materials: ObservatoryMaterials,
  mobile: boolean,
) {
  const roofline = new THREE.Group();
  roofline.name = 'roofline';
  scene.add(roofline);

  const random = createRandom(26021996);
  const buildings: Transform[] = [];
  const buildingCount = mobile ? 24 : 46;
  for (let index = 0; index < buildingCount; index += 1) {
    const lane = index % 2 === 0 ? -1 : 1;
    const x = lane * mix(11, 66, random());
    const z = mix(-178, -112, random());
    const width = mix(3, 11, random());
    const depth = mix(3.5, 12, random());
    const height = mix(1.6, 8.5, random());
    buildings.push({
      position: [x, height * 0.5 - 0.18, z],
      scale: [width, height, depth],
      rotation: [0, mix(-0.08, 0.08, random()), 0],
    });
  }
  addInstancedBoxes(roofline, kit, materials.structure, buildings);

  addBox(roofline, kit, materials.structure, [24, 0.45, 54], [0, -0.06, -138]);
  addBox(roofline, kit, materials.steel, [0.35, 1.25, 54], [-11.8, 0.58, -138]);
  addBox(roofline, kit, materials.steel, [0.35, 1.25, 54], [11.8, 0.58, -138]);
  addBox(roofline, kit, materials.sodiumGlow, [0.035, 0.045, 52], [-11.55, 1.24, -138]);
  addBox(roofline, kit, materials.sodiumGlow, [0.035, 0.045, 52], [11.55, 1.24, -138]);

  const antennaCount = mobile ? 6 : 14;
  for (let index = 0; index < antennaCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * mix(17, 58, random());
    const z = mix(-178, -118, random());
    const height = mix(4, 13, random());
    addCylinder(roofline, kit, materials.steel, 0.08, height, [x, height * 0.5, z]);
    const beacon = new THREE.Mesh(kit.smallNode, index % 3 === 0 ? materials.oxideGlow : materials.sodiumGlow);
    beacon.position.set(x, height, z);
    beacon.scale.setScalar(0.13);
    roofline.add(beacon);
  }
}

function createCameraPaths() {
  const cameraPoints = [
    [0, 2.25, 40],
    [-0.35, 2.35, 28],
    [0.45, 2.55, 14],
    [-1.55, 2.5, 0],
    [0.55, 2.45, -15],
    [1.0, 2.48, -27],
    [-0.9, 2.5, -40],
    [0.9, 2.48, -53],
    [-0.75, 2.62, -66],
    [0, 2.85, -79],
    [0.25, 3.2, -91],
    [-1.35, 5.4, -101],
    [1.55, 10.4, -112],
    [0, 13.8, -134],
  ].map((position) => new THREE.Vector3(...position));

  const targetPoints = [
    [0, 2.1, 21],
    [0, 2.35, 9],
    [-0.5, 2.6, -4],
    [0, 2.45, -14],
    [-7.75, 3.0, -28],
    [-6.9, 3.0, -28],
    [6.8, 3.0, -42],
    [-6.8, 3.1, -56],
    [6.7, 3.1, -70],
    [0, 3.4, -92],
    [0, 5.0, -99],
    [0, 8.2, -108],
    [0, 6.2, -139],
    [0, 4.2, -190],
  ].map((position) => new THREE.Vector3(...position));

  return {
    cameraPath: new THREE.CatmullRomCurve3(cameraPoints, false, 'centripetal', 0.5),
    targetPath: new THREE.CatmullRomCurve3(targetPoints, false, 'centripetal', 0.5),
  };
}

function createWorld(mobile: boolean): BuiltScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.nightSlate);
  scene.fog = new THREE.FogExp2(0x8ce8dc, mobile ? 0.007 : 0.0055);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 360);
  const kit = createGeometryKit(mobile);
  const materials = createMaterials();
  const animated: AnimatedParts = {
    pulseRings: [],
    pulseScanner: null,
    colabNodes: [],
    colabNetwork: null,
    foundationPapers: [],
    labLattice: null,
    labLens: null,
    domeRings: [],
  };

  const sky = createSky(scene, mobile);
  const waterMaterial = createWater(scene, mobile);
  const stars = createPointField(
    scene,
    mobile ? 340 : 980,
    3111998,
    { x: [-150, 150], y: [12, 115], z: [-205, 72] },
    palette.ivory,
    mobile ? 0.24 : 0.18,
    0.72,
  );
  const dust = createPointField(
    scene,
    mobile ? 90 : 310,
    8052026,
    { x: [-8.25, 8.25], y: [0.35, 6.7], z: [-84, -14] },
    palette.fogBlue,
    mobile ? 0.055 : 0.04,
    0.24,
  );

  createCauseway(scene, kit, materials, mobile);
  createTicketHall(scene, kit, materials, mobile);
  const corridor = createCorridor(scene, kit, materials, mobile);
  createArtifacts(corridor, kit, materials, mobile, animated);
  createCalibrationDome(scene, kit, materials, mobile, animated);
  createRoofline(scene, kit, materials, mobile);

  const hemisphere = new THREE.HemisphereLight(
    0xfff2a8,
    0x0b6380,
    mobile ? 1.16 : 1.36,
  );
  scene.add(hemisphere);

  const moon = new THREE.DirectionalLight(palette.ivory, mobile ? 2.15 : 2.5);
  moon.position.set(-14, 34, 18);
  scene.add(moon);

  const hallLight = new THREE.PointLight(palette.petal, 3.2, 32, 1.55);
  hallLight.position.set(-1.4, 5.5, -5.5);
  scene.add(hallLight);

  const bayLightData = [
    { color: palette.oxide, position: [-6.8, 3.3, -28] as Vec3, base: 1.3, phase: 0.3, speed: 0.77 },
    { color: palette.ivory, position: [6.8, 3.3, -42] as Vec3, base: 1.12, phase: 2.2, speed: 0.63 },
    { color: palette.sodium, position: [-6.8, 3.3, -56] as Vec3, base: 1.28, phase: 4.3, speed: 0.58 },
    { color: palette.fogBlue, position: [6.8, 3.3, -70] as Vec3, base: 1.15, phase: 1.5, speed: 0.69 },
  ];
  const flickerLights = bayLightData.map((data) => {
    const light = new THREE.PointLight(data.color, data.base, mobile ? 9 : 12, 1.8);
    light.position.set(...data.position);
    scene.add(light);
    return {
      light,
      base: data.base,
      phase: data.phase,
      speed: data.speed,
    };
  });

  const domeLight = new THREE.PointLight(palette.fogBlue, mobile ? 1.55 : 1.95, 31, 1.55);
  domeLight.position.set(0, 9, -98);
  scene.add(domeLight);
  flickerLights.push({ light: domeLight, base: mobile ? 1.55 : 1.95, phase: 3.1, speed: 0.31 });

  const pointerLight = new THREE.PointLight(palette.ivory, mobile ? 0.4 : 0.62, 18, 2);
  pointerLight.position.set(0, 4.8, 10);
  scene.add(pointerLight);

  const { cameraPath, targetPath } = createCameraPaths();

  return {
    scene,
    camera,
    waterMaterial,
    sky,
    stars,
    dust,
    pointerLight,
    flickerLights,
    animated,
    cameraPath,
    targetPath,
  };
}

function disposeWorld(scene: ThreeScene, renderer: ThreeRenderer) {
  const geometries = new Set<ThreeGeometry>();
  const materials = new Set<ThreeMaterial>();

  scene.traverse((object: ThreeObject & {
    geometry?: ThreeGeometry;
    material?: ThreeMaterial | ThreeMaterial[];
  }) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material: ThreeMaterial) => materials.add(material));
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  renderer.renderLists.dispose();
  renderer.dispose();
}

export function createObservatoryScene(
  canvas: HTMLCanvasElement,
  options: ObservatorySceneOptions,
): ObservatorySceneController {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !options.mobile,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.mobile ? 1.12 : 1.22;
  renderer.setClearColor(palette.nightSlate, 1);

  let world: BuiltScene;
  try {
    world = createWorld(options.mobile);
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  const cameraPosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const baseCameraPosition = new THREE.Vector3();
  const baseCameraTarget = new THREE.Vector3();

  let targetProgress = 0;
  let currentProgress = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let reducedMotion = options.reducedMotion;
  let visible = true;
  let disposed = false;
  let frame = 0;
  let previousTime = performance.now();

  const updateAnimatedParts = (elapsed: number) => {
    world.waterMaterial.uniforms.uTime.value = elapsed;
    world.stars.rotation.y = elapsed * 0.0035;
    world.dust.position.y = Math.sin(elapsed * 0.17) * 0.035;

    world.animated.pulseRings.forEach((ring, index) => {
      const pulse = 1 + Math.sin(elapsed * 0.72 - index * 0.66) * (0.008 + index * 0.002);
      ring.scale.setScalar(pulse);
      ring.rotation.x = index * 0.08 + elapsed * 0.008 * (index % 2 === 0 ? 1 : -1);
    });
    if (world.animated.pulseScanner) {
      world.animated.pulseScanner.position.z = Math.sin(elapsed * 0.54) * 1.95;
      world.animated.pulseScanner.visible = Math.sin(elapsed * 2.2) > -0.93;
    }

    world.animated.colabNodes.forEach((node, index) => {
      const scale = (index === 1 ? 0.27 : 0.14) * (1 + Math.sin(elapsed * 0.68 + index) * 0.08);
      node.scale.setScalar(scale);
    });
    if (world.animated.colabNetwork) {
      world.animated.colabNetwork.rotation.x = Math.sin(elapsed * 0.16) * 0.025;
    }

    world.animated.foundationPapers.forEach((paper, index) => {
      paper.position.y = index * 0.78 + 0.12 + Math.sin(elapsed * 0.4 + index * 1.3) * 0.018;
      paper.rotation.y = index * 0.018 + Math.sin(elapsed * 0.22 + index) * 0.008;
    });

    if (world.animated.labLattice) {
      world.animated.labLattice.rotation.x = elapsed * 0.035;
      world.animated.labLattice.rotation.z = Math.sin(elapsed * 0.19) * 0.16;
    }
    if (world.animated.labLens) {
      world.animated.labLens.rotation.x = Math.sin(elapsed * 0.21) * 0.07;
    }

    world.animated.domeRings.forEach((ring, index) => {
      const baseY = [0, 0.75, -0.25][index] ?? 0;
      const baseZ = [0, 0, 0.7][index] ?? 0;
      ring.rotation.y = baseY + elapsed * (0.012 + index * 0.004) * (index % 2 === 0 ? 1 : -1);
      ring.rotation.z = baseZ + elapsed * 0.006 * (index % 2 === 0 ? -1 : 1);
    });

    world.flickerLights.forEach(({ light, base, phase, speed }, index) => {
      const slow = Math.sin(elapsed * speed + phase) * 0.045;
      const quietFault = Math.sin(elapsed * (3.7 + index * 0.23) + phase) > 0.982 ? -0.11 : 0;
      light.intensity = base * (1 + slow + quietFault);
    });
  };

  const updateCamera = (elapsed: number, idleMotion: boolean) => {
    const pathProgress = reducedMotion ? nearestStop(targetProgress) : currentProgress;
    world.cameraPath.getPoint(clamp(pathProgress), baseCameraPosition);
    world.targetPath.getPoint(clamp(pathProgress), baseCameraTarget);

    const outdoorReveal = smoothstep(0.77, 1, pathProgress);
    const breathing = idleMotion ? Math.sin(elapsed * 0.23) * 0.025 : 0;
    cameraPosition.copy(baseCameraPosition);
    cameraPosition.x += pointerX * mix(0.18, 0.36, outdoorReveal);
    cameraPosition.y += pointerY * 0.13 + breathing;
    cameraPosition.z += pointerY * 0.045;

    cameraTarget.copy(baseCameraTarget);
    cameraTarget.x += pointerX * 0.24;
    cameraTarget.y += pointerY * 0.12;

    world.camera.position.copy(cameraPosition);
    world.camera.fov = mix(49, 58, smoothstep(0.79, 1, pathProgress));
    world.camera.updateProjectionMatrix();
    world.camera.lookAt(cameraTarget);

    world.sky.position.copy(cameraPosition);
    world.pointerLight.position.set(
      cameraPosition.x + pointerX * 3.2,
      cameraPosition.y + 2.2 + pointerY * 1.6,
      cameraPosition.z - 4.5,
    );
  };

  const draw = (time: number, animate: boolean) => {
    if (disposed) return;
    const elapsed = time * 0.001;

    if (animate) {
      const delta = Math.min(0.05, Math.max(0.001, (time - previousTime) * 0.001));
      const progressDamping = 1 - Math.exp(-delta * 5.5);
      const pointerDamping = 1 - Math.exp(-delta * 3.8);
      currentProgress += (targetProgress - currentProgress) * progressDamping;
      pointerX += (pointerTargetX - pointerX) * pointerDamping;
      pointerY += (pointerTargetY - pointerY) * pointerDamping;
      updateAnimatedParts(elapsed);
    } else {
      currentProgress = reducedMotion ? nearestStop(targetProgress) : targetProgress;
      pointerX = reducedMotion ? 0 : pointerTargetX;
      pointerY = reducedMotion ? 0 : pointerTargetY;
      world.waterMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
    }

    updateCamera(elapsed, animate && !reducedMotion);
    renderer.render(world.scene, world.camera);
    previousTime = time;
  };

  const stop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const tick = (time: number) => {
    frame = 0;
    if (!visible || reducedMotion || disposed) return;
    draw(time, true);
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    if (visible && !reducedMotion && !disposed && !frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const renderNow = () => {
    if (!disposed) draw(performance.now(), false);
  };

  renderNow();
  start();

  return {
    setProgress(progress) {
      targetProgress = clamp(progress);
      if (reducedMotion) renderNow();
    },
    setPointer(x, y) {
      pointerTargetX = clamp(x, -1, 1);
      pointerTargetY = clamp(y, -1, 1);
      if (reducedMotion) {
        pointerTargetX = 0;
        pointerTargetY = 0;
      }
    },
    setReducedMotion(reduced) {
      if (reducedMotion === reduced) return;
      reducedMotion = reduced;
      if (reducedMotion) {
        stop();
        pointerTargetX = 0;
        pointerTargetY = 0;
        renderNow();
      } else {
        currentProgress = targetProgress;
        start();
      }
    },
    setVisible(nextVisible) {
      visible = nextVisible;
      if (visible) {
        if (reducedMotion) renderNow();
        else start();
      } else {
        stop();
      }
    },
    resize(width, height, devicePixelRatio) {
      const pixelRatioCap = options.mobile ? 1.15 : 1.6;
      renderer.setPixelRatio(Math.min(pixelRatioCap, Math.max(1, devicePixelRatio)));
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      world.camera.aspect = Math.max(1, width) / Math.max(1, height);
      world.camera.updateProjectionMatrix();
      if (reducedMotion || !frame) renderNow();
    },
    renderNow,
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      disposeWorld(world.scene, renderer);
    },
  };
}
