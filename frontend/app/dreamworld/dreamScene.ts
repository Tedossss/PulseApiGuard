import * as THREE from 'three';

export const DREAM_SEGMENT_COUNT = 9;
export type DreamSceneOptions = { mobile: boolean; reducedMotion: boolean; onSceneChange?: (sceneIndex: number) => void };
export type DreamSceneController = { setProgress: (progress: number) => void; setPointer: (x: number, y: number) => void; setReducedMotion: (reducedMotion: boolean) => void; setVisible: (visible: boolean) => void; setIdle: (idle: boolean) => void; resize: (width: number, height: number, devicePixelRatio: number) => void; renderNow: () => void; dispose: () => void };
type Vec3 = readonly [number, number, number];
type DisposableSet = { geometries: Set<THREE.BufferGeometry>; materials: Set<THREE.Material> };
type DoorTarget = { slug: string; root: THREE.Group; panel: THREE.Mesh; open: number; target: number };
type SceneBuilt = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; cameraPath: THREE.CatmullRomCurve3; targetPath: THREE.CatmullRomCurve3; doors: DoorTarget[]; disposables: DisposableSet };

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const smoothstep = (edge0: number, edge1: number, value: number) => { const amount = clamp((value - edge0) / Math.max(0.00001, edge1 - edge0)); return amount * amount * (3 - 2 * amount); };
const sites = [
  { slug: 'pulseguard', x: 8, z: -18 }, { slug: 'colab', x: -8, z: -42 }, { slug: 'foundation', x: 8, z: -66 },
  { slug: 'prime-leather', x: -8, z: -90 }, { slug: 'bookshelf', x: 8, z: -114 }, { slug: 'local-ai-lab', x: -8, z: -138 },
] as const;

export function dreamSegmentFromProgress(progress: number) { const value = clamp(progress); return value >= 1 ? 8 : Math.min(8, Math.floor(value * DREAM_SEGMENT_COUNT)); }
const segmentCenter = (index: number) => (index + 0.5) / DREAM_SEGMENT_COUNT;
const segmentInfluence = (progress: number, index: number, radius = 0.055) => 1 - smoothstep(radius, radius * 2.2, Math.abs(progress - segmentCenter(index)));
function cameraProgress(progress: number) { const scaled = clamp(progress) * DREAM_SEGMENT_COUNT; const stop = Math.min(8, Math.floor(scaled)); if (stop >= 8) return 1; return (stop + smoothstep(0.58, 0.98, scaled - stop)) / 8; }
function track<T extends THREE.BufferGeometry>(set: DisposableSet, geometry: T) { set.geometries.add(geometry); return geometry; }
function mat(set: DisposableSet, color: number, options: Partial<THREE.MeshStandardMaterialParameters> = {}) { const value = new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...options }); set.materials.add(value); return value; }
function box(set: DisposableSet, size: Vec3) { return track(set, new THREE.BoxGeometry(...size)); }
function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, position: Vec3, scale: Vec3 = [1, 1, 1]) { const value = new THREE.Mesh(geometry, material); value.position.set(...position); value.scale.set(...scale); return value; }
function addBox(group: THREE.Group | THREE.Scene, set: DisposableSet, material: THREE.Material, position: Vec3, size: Vec3) { group.add(mesh(box(set, size), material, position)); }

type Materials = ReturnType<typeof createMaterials>;
function createMaterials(set: DisposableSet) {
  return {
    grass: mat(set, 0x789c59), grassLight: mat(set, 0x9dbb70), road: mat(set, 0x5b6570), roadLine: mat(set, 0xe7dcb9), curb: mat(set, 0xc8bca5), stone: mat(set, 0xd9ccb7), trim: mat(set, 0xf2e7d2),
    glass: mat(set, 0x8fc3c4, { roughness: 0.42, emissive: 0x244e55, emissiveIntensity: 0.08 }), door: mat(set, 0x493b35), brass: mat(set, 0xc79d54, { metalness: 0.55, roughness: 0.45 }), ink: mat(set, 0x233d4d), brick: mat(set, 0xc9795f), plaster: mat(set, 0xd6bfa1), blue: mat(set, 0x769caf), teal: mat(set, 0x668d88), cream: mat(set, 0xe8d8b2), dark: mat(set, 0x354a54), red: mat(set, 0xa65442), selected: mat(set, 0xf3bb61, { emissive: 0xf3bb61, emissiveIntensity: 0.25 }),
  };
}

function addWindow(group: THREE.Group, set: DisposableSet, materials: Materials, position: Vec3, size: Vec3 = [1.35, 1.25, 0.12]) {
  addBox(group, set, materials.trim, [position[0], position[1], position[2] - 0.08], [size[0] + 0.18, size[1] + 0.18, 0.18]);
  addBox(group, set, materials.glass, position, size);
  addBox(group, set, materials.trim, [position[0], position[1], position[2] - 0.16], [0.07, size[1], 0.05]);
  addBox(group, set, materials.trim, [position[0], position[1], position[2] - 0.16], [size[0], 0.07, 0.05]);
}
function addSteps(group: THREE.Group, set: DisposableSet, materials: Materials, z: number, width = 2.4) { addBox(group, set, materials.stone, [0, 0.16, z + 0.76], [width + 0.55, 0.22, 0.9]); addBox(group, set, materials.stone, [0, 0.33, z + 0.42], [width + 0.28, 0.22, 0.55]); }
function addRoof(group: THREE.Group, set: DisposableSet, material: THREE.Material, width: number, depth: number, y: number, height = 2.2) {
  const roof = mesh(track(set, new THREE.ConeGeometry(1, height, 4)), material, [0, y, 0], [width * 0.72, 1, depth * 0.72]);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);
  return roof;
}
function addColumn(group: THREE.Group, set: DisposableSet, material: THREE.Material, x: number, y: number, z: number, height = 2.8) {
  const column = mesh(track(set, new THREE.CylinderGeometry(0.16, 0.2, height, 8)), material, [x, y, z]);
  group.add(column);
}
function addLamp(group: THREE.Group, set: DisposableSet, materials: Materials, x: number, z: number) {
  addBox(group, set, materials.door, [x, 1.5, z], [0.14, 2.8, 0.14]);
  const shade = mesh(track(set, new THREE.SphereGeometry(0.3, 10, 6)), materials.selected, [x, 3, z], [1, 0.6, 1]);
  group.add(shade);
}
function addSign(group: THREE.Group, set: DisposableSet, materials: Materials, textColor: THREE.Material, y: number, width = 2.4) {
  addBox(group, set, materials.brass, [0, y, 2.95], [width + 0.22, 0.14, 0.12]);
  addBox(group, set, textColor, [0, y + 0.36, 2.96], [width, 0.6, 0.08]);
}
function addDoor(group: THREE.Group, set: DisposableSet, materials: Materials, slug: string, z: number, width = 1.35, height = 2.65): DoorTarget {
  const root = new THREE.Group(); root.userData.doorSlug = slug; root.position.set(0, height / 2 + 0.42, z);
  addBox(root, set, materials.trim, [0, 0, 0], [width + 0.42, height + 0.42, 0.2]);
  addBox(root, set, materials.ink, [0, 0, 0.08], [width - 0.08, height - 0.08, 0.08]);
  const panel = mesh(box(set, [width, height, 0.12]), materials.door, [0, 0, 0.13]); panel.userData.doorSlug = slug; root.add(panel);
  const handle = mesh(track(set, new THREE.SphereGeometry(0.09, 8, 6)), materials.brass, [width * 0.27, 0, 0.24], [1, 1, 0.65]); handle.userData.doorSlug = slug; root.add(handle);
  group.add(root); return { slug, root, panel, open: 0, target: 0 };
}
function profileForSite(slug: string, width: number, height: number) {
  const half = width / 2;
  if (slug === 'pulseguard') return [[-half, 0], [-half, height * 0.72], [-half * 0.62, height * 0.72], [-half * 0.62, height], [half * 0.62, height], [half * 0.62, height * 0.72], [half, height * 0.72], [half, 0]];
  if (slug === 'foundation') return [[-half, 0], [-half, height * 0.78], [-half * 0.7, height], [0, height * 1.15], [half * 0.7, height], [half, height * 0.78], [half, 0]];
  if (slug === 'prime-leather') return [[-half, 0], [-half, height * 0.8], [0, height * 1.08], [half, height * 0.8], [half, 0]];
  if (slug === 'bookshelf') return [[-half, 0], [-half, height * 0.82], [-half * 0.72, height], [half * 0.72, height], [half, height * 0.82], [half, 0]];
  if (slug === 'local-ai-lab') return [[-half, 0], [-half, height * 0.9], [-half * 0.5, height], [half * 0.5, height], [half, height * 0.9], [half, 0]];
  return [[-half, 0], [-half, height * 0.75], [-half * 0.5, height], [half * 0.5, height], [half, height * 0.75], [half, 0]];
}
function buildingShell(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number], width: number, height: number, depth: number, wall: THREE.Material) {
  const group = new THREE.Group(); group.position.set(site.x, 0.26, site.z);
  const profile = new THREE.Shape();
  profileForSite(site.slug, width, height).forEach(([x, y], index) => index === 0 ? profile.moveTo(x, y) : profile.lineTo(x, y));
  profile.closePath();
  const facade = new THREE.ExtrudeGeometry(profile, { depth, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.08, bevelThickness: 0.08 });
  facade.translate(0, 0, -depth / 2);
  group.add(new THREE.Mesh(track(set, facade), wall));
  addBox(group, set, materials.stone, [0, 0.03, 0], [width + 0.7, 0.34, depth + 0.65]);
  scene.add(group); return group;
}

function buildRoad(scene: THREE.Scene, set: DisposableSet, materials: Materials, mobile: boolean) {
  addBox(scene, set, materials.grass, [0, -0.35, -72], [92, 0.5, 190]); addBox(scene, set, materials.road, [0, -0.02, -72], [11.5, 0.18, 180]);
  addBox(scene, set, materials.curb, [-6.4, 0.06, -72], [0.5, 0.3, 180]); addBox(scene, set, materials.curb, [6.4, 0.06, -72], [0.5, 0.3, 180]);
  for (let z = 16; z > -164; z -= 8) addBox(scene, set, materials.roadLine, [0, 0.09, z], [0.2, 0.03, 3.2]);
  for (const site of sites) addBox(scene, set, materials.stone, [site.x > 0 ? 11.2 : -11.2, 0.12, site.z], [7.2, 0.22, 9.2]);
  const treeCount = mobile ? 12 : 20;
  for (let index = 0; index < treeCount; index += 1) { const side = index % 2 ? -1 : 1; const z = 8 - index * 8.4; addBox(scene, set, materials.door, [side * 18, 1.2, z], [0.55, 2.4, 0.55]); const foliage = mesh(track(set, new THREE.IcosahedronGeometry(1.7, 1)), index % 3 ? materials.grassLight : materials.grass, [side * 18, 3.1, z], [1.2, 1.45, 1.2]); scene.add(foliage); }
}

function buildPulseGuard(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number]) { const group = buildingShell(scene, set, materials, site, 6.8, 5.4, 5.2, materials.blue); addRoof(group, set, materials.dark, 7.6, 6, 7.2, 2.6); addBox(group, set, materials.ink, [0, 6.3, 0], [2.4, 1.5, 2.4]); addBox(group, set, materials.glass, [0, 6.3, 1.27], [1.6, 1.1, 0.12]); addBox(group, set, materials.brass, [0, 8.6, 0], [0.18, 2.1, 0.18]); const dish = mesh(track(set, new THREE.TorusGeometry(1, 0.16, 8, 18)), materials.selected, [0, 9.8, 0], [1, 1, 0.6]); dish.rotation.x = Math.PI / 2; group.add(dish); addWindow(group, set, materials, [-2.05, 2.65, 2.63]); addWindow(group, set, materials, [2.05, 2.65, 2.63]); addSign(group, set, materials, materials.ink, 4.9, 2.8); addSteps(group, set, materials, 2.65, 1.7); return addDoor(group, set, materials, site.slug, 2.7, 1.5, 2.9); }
function buildCoLab(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number]) { const group = buildingShell(scene, set, materials, site, 8.2, 4.8, 5.2, materials.plaster); addRoof(group, set, materials.ink, 9.2, 6.2, 6.6, 2.1); addBox(group, set, materials.blue, [-2.45, 2.4, 2.63], [3.1, 4.4, 0.14]); addBox(group, set, materials.cream, [2.45, 2.4, 2.63], [3.1, 4.4, 0.14]); addBox(group, set, materials.glass, [0, 2.45, 2.68], [1.4, 3.9, 0.14]); addColumn(group, set, materials.trim, -3.6, 2.6, 2.76, 4.2); addColumn(group, set, materials.trim, 3.6, 2.6, 2.76, 4.2); addSign(group, set, materials, materials.ink, 5.05, 3.2); addSteps(group, set, materials, 2.65, 2.1); return addDoor(group, set, materials, site.slug, 2.68, 1.65, 2.85); }
function buildFoundation(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number]) { const group = buildingShell(scene, set, materials, site, 8.8, 5.4, 5.8, materials.brick); addRoof(group, set, materials.red, 9.7, 6.8, 7.2, 2.6); addBox(group, set, materials.ink, [0, 6.08, 1.55], [3.4, 0.72, 0.22]); addBox(group, set, materials.trim, [0, 6.72, 1.6], [3.2, 0.22, 0.2]); addBox(group, set, materials.ink, [0, 7.28, 1.6], [0.2, 0.95, 0.2]); for (const x of [-3.2, 0, 3.2]) addWindow(group, set, materials, [x, 3.0, 2.94], [1.5, 1.55, 0.12]); addColumn(group, set, materials.trim, -2.1, 2.6, 3.05, 4.4); addColumn(group, set, materials.trim, 2.1, 2.6, 3.05, 4.4); addSign(group, set, materials, materials.ink, 5.2, 3.1); addSteps(group, set, materials, 2.95, 2.8); return addDoor(group, set, materials, site.slug, 2.98, 2.2, 3.35); }
function buildPrimeLeather(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number]) { const group = buildingShell(scene, set, materials, site, 5.5, 4.6, 4.2, materials.cream); addRoof(group, set, materials.red, 6.2, 5.1, 6, 2); addBox(group, set, materials.red, [0, 5.1, 1.15], [6.2, 0.8, 4.7]); addBox(group, set, materials.ink, [0, 4.78, 1.2], [4.8, 0.18, 3.6]); addWindow(group, set, materials, [-1.6, 2.4, 2.15], [1.2, 1.65, 0.12]); addWindow(group, set, materials, [1.6, 2.4, 2.15], [1.2, 1.65, 0.12]); const shoe = mesh(track(set, new THREE.SphereGeometry(0.58, 12, 8)), materials.brass, [0, 5.15, 1.62], [1.2, 0.48, 0.6]); shoe.rotation.z = -0.2; group.add(shoe); addSign(group, set, materials, materials.ink, 4.55, 2.7); addAwning(group, set, materials, -1.6); addAwning(group, set, materials, 1.6); addSteps(group, set, materials, 2.15, 1.55); return addDoor(group, set, materials, site.slug, 2.18, 1.35, 2.7); }
function addAwning(group: THREE.Group, set: DisposableSet, materials: Materials, x: number) { const awning = mesh(box(set, [1.45, 0.18, 0.8]), materials.red, [x, 3.5, 2.5]); awning.rotation.x = -0.18; group.add(awning); }
function buildBookShelf(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number]) { const group = buildingShell(scene, set, materials, site, 8.8, 5.2, 5.8, materials.teal); addRoof(group, set, materials.dark, 9.5, 6.6, 7, 2.5); addBox(group, set, materials.trim, [0, 5.8, 0], [9.2, 0.55, 6.2]); for (const x of [-3.15, 3.15]) addWindow(group, set, materials, [x, 2.8, 2.94], [2.2, 2.25, 0.12]); for (let index = 0; index < 8; index += 1) addBox(group, set, [materials.red, materials.cream, materials.brass][index % 3], [-2.5 + index * 0.7, 2.8, 2.78], [0.35, 1.6 + (index % 3) * 0.2, 0.08]); addColumn(group, set, materials.trim, -4, 2.7, 3.05, 4.7); addColumn(group, set, materials.trim, 4, 2.7, 3.05, 4.7); addSign(group, set, materials, materials.ink, 5.15, 3.6); addSteps(group, set, materials, 2.94, 2.5); return addDoor(group, set, materials, site.slug, 2.98, 1.8, 3.2); }
function buildLocalAi(scene: THREE.Scene, set: DisposableSet, materials: Materials, site: typeof sites[number]) { const group = buildingShell(scene, set, materials, site, 7.2, 4.8, 5.2, materials.dark); addRoof(group, set, materials.brass, 7.8, 5.8, 6.6, 2.1); addBox(group, set, materials.ink, [0, 5.25, 0], [7.7, 0.45, 5.7]); for (const x of [-2.25, 0, 2.25]) addWindow(group, set, materials, [x, 2.7, 2.64], [1.4, 1.6, 0.12]); addBox(group, set, materials.brass, [0, 5.85, 0], [2.1, 0.18, 1.6]); addBox(group, set, materials.selected, [0, 6.2, 0.82], [1.2, 0.55, 0.08]); addLamp(group, set, materials, -4.4, 2.6); addLamp(group, set, materials, 4.4, 2.6); addSign(group, set, materials, materials.ink, 4.9, 3); addSteps(group, set, materials, 2.65, 1.8); return addDoor(group, set, materials, site.slug, 2.68, 1.5, 2.8); }

function buildScene(mobile: boolean): SceneBuilt {
  const disposables: DisposableSet = { geometries: new Set(), materials: new Set() }; const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa8d6e5); scene.fog = new THREE.Fog(0xa8d6e5, 80, 190); const camera = new THREE.PerspectiveCamera(mobile ? 48 : 43, 1, 0.1, 230); const materials = createMaterials(disposables); buildRoad(scene, disposables, materials, mobile);
  const builders = [buildPulseGuard, buildCoLab, buildFoundation, buildPrimeLeather, buildBookShelf, buildLocalAi]; const doors = sites.map((site, index) => builders[index](scene, disposables, materials, site));
  scene.add(new THREE.HemisphereLight(0xf6fbff, 0x49634e, 1.8)); const sun = new THREE.DirectionalLight(0xffe8bd, 2.4); sun.position.set(-22, 32, 24); scene.add(sun); const fill = new THREE.DirectionalLight(0xb3d5ec, 0.65); fill.position.set(18, 14, -28); scene.add(fill);
  const cameraPath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 3.4, 22), new THREE.Vector3(0, 3.5, -6), new THREE.Vector3(0, 3.7, -30), new THREE.Vector3(0, 3.8, -54), new THREE.Vector3(0, 3.9, -78), new THREE.Vector3(0, 4, -102), new THREE.Vector3(0, 4.1, -126), new THREE.Vector3(0, 4.2, -150), new THREE.Vector3(0, 4.6, -174)], false, 'catmullrom', 0.2);
  const targetPath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.2, -5), new THREE.Vector3(8, 2.8, -18), new THREE.Vector3(-8, 2.8, -42), new THREE.Vector3(8, 3, -66), new THREE.Vector3(-8, 2.8, -90), new THREE.Vector3(8, 3, -114), new THREE.Vector3(-8, 2.8, -138), new THREE.Vector3(0, 2.8, -158), new THREE.Vector3(0, 3, -174)], false, 'catmullrom', 0.2);
  return { scene, camera, cameraPath, targetPath, doors, disposables };
}

export function createDreamScene(canvas: HTMLCanvasElement, options: DreamSceneOptions): DreamSceneController {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: !options.mobile, powerPreference: 'high-performance' }); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  const built = buildScene(options.mobile); const pointer = new THREE.Vector2(); const pointerTarget = new THREE.Vector2(); const raycaster = new THREE.Raycaster(); const cameraPosition = new THREE.Vector3(); const lookTarget = new THREE.Vector3();
  let progressTarget = 0; let progress = 0; let reducedMotion = options.reducedMotion; let visible = true; let frame = 0; let disposed = false; let activeScene = -1; let hoveredSlug: string | null = null;
  const dispatch = (name: string, detail: Record<string, unknown>) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const setDoor = (slug: string | null, open: boolean) => built.doors.forEach((door) => { if (door.slug === slug) door.target = open ? 1 : 0; });
  const hitDoor = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, built.camera); let object: THREE.Object3D | null = raycaster.intersectObjects(built.doors.map((door) => door.root), true)[0]?.object ?? null; while (object && !object.userData.doorSlug) object = object.parent; return (object?.userData.doorSlug as string | undefined) ?? null; };
  const requestRender = () => { if (!disposed && visible && !reducedMotion && !frame) frame = window.requestAnimationFrame(renderFrame); };
  const onPointerMove = (event: PointerEvent) => { const slug = hitDoor(event); if (slug !== hoveredSlug) { hoveredSlug = slug; setDoor(slug, true); dispatch('falach:dream-door-hover', { slug }); if (reducedMotion) renderNow(); else requestRender(); } };
  const onPointerLeave = () => { if (hoveredSlug) setDoor(hoveredSlug, false); hoveredSlug = null; dispatch('falach:dream-door-hover', { slug: null }); if (reducedMotion) renderNow(); else requestRender(); };
  const onPointerDown = (event: PointerEvent) => { const slug = hitDoor(event); if (!slug) return; if (event.pointerType === 'touch' && hoveredSlug !== slug) { hoveredSlug = slug; setDoor(slug, true); dispatch('falach:dream-door-hover', { slug }); if (reducedMotion) renderNow(); else requestRender(); return; } dispatch('falach:dream-door-activate', { slug }); };
  const onDoorFocus = (event: Event) => { const detail = (event as CustomEvent<{ slug?: string; open?: boolean }>).detail; if (detail?.slug) setDoor(detail.slug, detail.open !== false); if (reducedMotion) renderNow(); else requestRender(); };
  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerleave', onPointerLeave); canvas.addEventListener('pointerdown', onPointerDown); window.addEventListener('falach:dream-door-focus', onDoorFocus);
  const applySceneChange = (next: number) => { const index = dreamSegmentFromProgress(next); if (index !== activeScene) { activeScene = index; options.onSceneChange?.(index); } };
  const renderScene = () => { if (disposed) return; progress = reducedMotion ? progressTarget : mix(progress, progressTarget, 0.095); if (Math.abs(progressTarget - progress) < 0.0002) progress = progressTarget; pointer.lerp(pointerTarget, reducedMotion ? 1 : 0.08); applySceneChange(progress); const path = cameraProgress(progress); cameraPosition.copy(built.cameraPath.getPoint(path)); lookTarget.copy(built.targetPath.getPoint(path)); cameraPosition.x += pointer.x * 0.28; cameraPosition.y += pointer.y * 0.12; lookTarget.x += pointer.x * 0.65; lookTarget.y += pointer.y * 0.36; built.camera.position.copy(cameraPosition); built.camera.lookAt(lookTarget); built.doors.forEach((door, index) => { const selected = door.slug === hoveredSlug || segmentInfluence(progress, index + 1) > 0.55; if (selected) door.target = 1; else if (door.slug !== hoveredSlug) door.target = 0; door.open = reducedMotion ? door.target : mix(door.open, door.target, 0.16); door.panel.rotation.y = -door.open * 0.92; door.root.position.y = 1.75; }); renderer.render(built.scene, built.camera); };
  const renderFrame = () => { frame = 0; renderScene(); if (!reducedMotion && visible && !disposed) requestRender(); }; const renderNow = () => { if (frame) { window.cancelAnimationFrame(frame); frame = 0; } renderScene(); };
  const setVisible = (next: boolean) => { visible = next; if (!visible && frame) { window.cancelAnimationFrame(frame); frame = 0; } if (visible) { if (reducedMotion) renderNow(); else requestRender(); } }; const setReducedMotion = (next: boolean) => { reducedMotion = next; renderNow(); }; const setProgress = (next: number) => { progressTarget = clamp(next); applySceneChange(progressTarget); if (reducedMotion) renderNow(); else requestRender(); }; const setPointer = (x: number, y: number) => { pointerTarget.set(clamp(x, -1, 1), clamp(y, -1, 1)); requestRender(); }; const setIdle = () => requestRender();
  const resize = (width: number, height: number, dpr: number) => { built.camera.aspect = Math.max(1, width) / Math.max(1, height); built.camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(options.mobile ? 1 : 1.35, Math.max(1, dpr || 1))); renderer.setSize(width, height, false); renderNow(); };
  const dispose = () => { if (disposed) return; disposed = true; if (frame) window.cancelAnimationFrame(frame); canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerleave', onPointerLeave); canvas.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('falach:dream-door-focus', onDoorFocus); built.scene.clear(); built.disposables.geometries.forEach((geometry) => geometry.dispose()); built.disposables.materials.forEach((item) => item.dispose()); renderer.renderLists.dispose(); renderer.dispose(); };
  resize(1, 1, 1); setVisible(true); requestRender(); return { setProgress, setPointer, setReducedMotion, setVisible, setIdle, resize, renderNow, dispose };
}
