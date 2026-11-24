import * as THREE from "three";
import type { WorldState } from "./simulation/model";
import { daylightFactor } from "./simulation/model";

export type Quality = "high" | "balanced" | "low";

const LOOK = new THREE.Vector3(0.02, 0.52, 0);
const POND = new THREE.Vector2(0.16, -0.04);

export function chooseQuality(): Quality {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency || 4;
  if (coarse && (cores <= 4 || window.innerWidth < 760)) return "low";
  if (!coarse && cores >= 8) return "high";
  return "balanced";
}

export interface WorldView {
  quality: Quality;
  resize(width: number, height: number): void;
  render(state: WorldState, dt: number, reduceMotion: boolean): void;
  drag(dx: number, dy: number): void;
  zoom(delta: number): void;
  resetCamera(): void;
  dispose(): void;
}

export function createWorldView(canvas: HTMLCanvasElement, quality: Quality): WorldView {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality !== "low",
    alpha: false,
    powerPreference: quality === "low" ? "low-power" : "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.setClearColor(0x10110e, 1);
  if (quality !== "low") {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10110e);
  scene.fog = new THREE.Fog(0x10110e, 6.5, 12);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.06, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environmentRoom(), 0.04).texture;

  const hemi = new THREE.HemisphereLight(0xf3ecdf, 0x3a4634, 0.85);
  const sun = new THREE.DirectionalLight(0xffe6c8, 1.55);
  sun.position.set(2.8, 3.6, 1.4);
  sun.castShadow = quality !== "low";
  sun.shadow.mapSize.set(quality === "high" ? 1024 : 512, quality === "high" ? 1024 : 512);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 10;
  sun.shadow.camera.left = -1.6;
  sun.shadow.camera.right = 1.6;
  sun.shadow.camera.top = 1.6;
  sun.shadow.camera.bottom = -1.6;
  sun.shadow.bias = -0.0006;
  sun.shadow.radius = quality === "high" ? 3 : 1.5;
  const fill = new THREE.DirectionalLight(0xc5d0c2, 0.38);
  fill.position.set(-2.2, 1.4, 2.6);
  const moon = new THREE.DirectionalLight(0x9eb4d0, 0);
  moon.position.set(-2.4, 2.8, -1.2);
  scene.add(hemi, sun, sun.target, fill, moon);

  const jar = createJar();
  const ground = createGround(quality);
  const pond = createPond();
  const life = createLife(quality);
  scene.add(jar.group, ground.group, pond.mesh, life.group);

  const clock = { elapsed: 0 };
  const orbit = { theta: 0.35, phi: 1.18, radius: 3.15, targetTheta: 0.35, targetPhi: 1.18, targetRadius: 3.15 };
  const home = { ...orbit };

  const view: WorldView = {
    quality,
    resize(width, height) {
      const ratio = Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.5 : quality === "balanced" ? 1.25 : 1);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    },
    render(state, dt, reduceMotion) {
      clock.elapsed += reduceMotion ? dt * 0.15 : dt;
      const daylight = daylightFactor(state.timeOfDay);
      const sunLevel = state.sunlight * (0.18 + 0.82 * daylight);
      hemi.color.set(daylight > 0.35 ? 0xf3ecdf : 0xb7c4d6);
      hemi.groundColor.set(daylight > 0.35 ? 0x3a4634 : 0x1a221c);
      hemi.intensity = 0.55 + sunLevel * 0.4;
      sun.intensity = 0.25 + sunLevel * 1.7;
      sun.color.set(daylight > 0.45 ? 0xffe6c8 : 0xc5d4ea);
      fill.intensity = 0.22 + daylight * 0.2;
      moon.intensity = (1 - daylight) * 0.42;
      scene.fog.color.set(daylight > 0.3 ? 0x10110e : 0x0c0e12);
      scene.background = scene.fog.color;

      ground.update(state);
      pond.update(state, clock.elapsed);
      life.update(state, clock.elapsed, reduceMotion);
      placeCamera(camera, orbit, dt);
      renderer.render(scene, camera);
    },
    drag(dx, dy) {
      orbit.targetTheta -= dx * 0.005;
      orbit.targetPhi = clamp(orbit.targetPhi + dy * 0.0032, 0.95, 1.36);
    },
    zoom(delta) {
      orbit.targetRadius = clamp(orbit.targetRadius * (1 + delta), 2.45, 5.2);
    },
    resetCamera() {
      orbit.targetTheta = home.targetTheta;
      orbit.targetPhi = home.targetPhi;
      orbit.targetRadius = home.targetRadius;
    },
    dispose() {
      renderer.dispose();
      pmrem.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
    },
  };
  return view;
}

function placeCamera(camera: THREE.PerspectiveCamera, orbit: { theta: number; phi: number; radius: number; targetTheta: number; targetPhi: number; targetRadius: number }, dt: number) {
  const blend = 1 - Math.exp(-dt * 5.5);
  orbit.theta += (orbit.targetTheta - orbit.theta) * blend;
  orbit.phi += (orbit.targetPhi - orbit.phi) * blend;
  orbit.radius += (orbit.targetRadius - orbit.radius) * blend;
  const sinPhi = Math.sin(orbit.phi);
  camera.position.set(
    LOOK.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
    LOOK.y + orbit.radius * Math.cos(orbit.phi),
    LOOK.z + orbit.radius * sinPhi * Math.cos(orbit.theta),
  );
  camera.lookAt(LOOK);
}

function environmentRoom() {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x1a1914);
  room.add(new THREE.HemisphereLight(0xfff6ea, 0x3a3428, 1));
  return room;
}

function terrainHeight(x: number, z: number) {
  const radius = Math.hypot(x, z);
  const bowl = Math.exp(-((x - POND.x) ** 2 + (z - POND.y) ** 2) / 0.02);
  const mound = Math.max(0, 0.86 - radius) * 0.07;
  const edge = smoothstep(0.48, 0.84, radius);
  return 0.3 + mound + fbm(x * 1.7 + 1.2, z * 1.7 - 0.6) * 0.035 - bowl * 0.065 - edge * 0.055;
}

function createJar() {
  const group = new THREE.Group();
  const profile = [
    [0.02, 0],
    [1.05, 0],
    [1.12, 0.07],
    [1.08, 0.16],
    [0.98, 0.24],
    [0.94, 0.7],
    [0.97, 1.25],
    [1.04, 1.48],
    [0.86, 1.72],
    [0.48, 1.96],
    [0.16, 2.1],
    [0.2, 2.16],
    [0.2, 2.22],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 80), glassMaterial());
  glass.renderOrder = 3;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.02, 1.08, 0.16, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xc5cfc4, roughness: 0.22, transparent: true, opacity: 0.22, thickness: 0.35 }),
  );
  base.position.y = 0.08;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.02, 10, 56),
    new THREE.MeshStandardMaterial({ color: 0xe4ded2, roughness: 0.28, metalness: 0.04 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2.13;
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glassMaterial(0.12));
  lid.position.set(0.1, 2.22, 0.02);
  lid.rotation.z = -0.4;
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.28, 1.42, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: 0x161513, roughness: 0.94 }),
  );
  plinth.position.y = -0.06;
  plinth.receiveShadow = true;
  group.add(plinth, base, glass, rim, lid);
  return { group };
}

function glassMaterial(alphaBoost = 0) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uBoost: { value: alphaBoost } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPos;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vPos = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vPos;
      uniform float uBoost;
      void main() {
        float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.6);
        vec3 reflectDir = reflect(-normalize(vView), normalize(vNormal));
        vec3 sky = mix(vec3(0.09, 0.1, 0.08), vec3(0.55, 0.58, 0.52), reflectDir.y * 0.5 + 0.5);
        float imperfection = sin(vPos.y * 30.0 + vPos.x * 9.0) * 0.012;
        gl_FragColor = vec4(sky * (fres * 0.75 + imperfection), uBoost + 0.035 + fres * 0.42);
      }
    `,
  });
}

function createGround(quality: Quality) {
  const group = new THREE.Group();
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.74, 0.16, quality === "low" ? 24 : 48),
    new THREE.MeshStandardMaterial({ color: 0x3c2d24, roughness: 1 }),
  );
  soil.position.y = 0.2;
  soil.receiveShadow = true;

  const segments = quality === "low" ? 28 : quality === "balanced" ? 56 : 72;
  const geometry = new THREE.CircleGeometry(0.84, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors: number[] = [];
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    position.setY(index, terrainHeight(x, z));
    const radius = Math.hypot(x, z);
    const wet = Math.exp(-((x - POND.x) ** 2 + (z - POND.y) ** 2) / 0.03);
    const moss = smoothstep(0.82, 0.25, radius) * (0.55 + fbm(x * 3.0, z * 3.0) * 0.45);
    const soilMix = smoothstep(0.45, 0.84, radius);
    const green = new THREE.Color(0x4d6740).lerp(new THREE.Color(0x6d8452), moss);
    const earth = new THREE.Color(0x4a382c);
    const color = green.lerp(earth, soilMix * 0.85).lerp(new THREE.Color(0x243028), wet * 0.55);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const terrainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94 });
  const terrain = new THREE.Mesh(geometry, terrainMaterial);
  terrain.receiveShadow = true;
  terrain.castShadow = false;
  group.add(soil, terrain);
  return {
    group,
    update(state: WorldState) {
      const wetness = 0.92 - state.moisture * 0.16;
      terrainMaterial.color.setScalar(wetness);
      terrainMaterial.roughness = 0.96 - state.moisture * 0.2;
    },
  };
}

function createPond() {
  const uniforms = {
    uTime: { value: 0 },
    uRain: { value: 0 },
    uNight: { value: 0 },
  };
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 40),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uRain;
        void main() {
          vUv = uv;
          vec3 displaced = position;
          float radius = length(uv - 0.5);
          displaced.z += sin(radius * 36.0 - uTime * 1.6) * (0.002 + uRain * 0.006);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uNight;
        uniform float uRain;
        void main() {
          vec2 uv = vUv - 0.5;
          float radius = length(uv);
          if (radius > 0.48) discard;
          float shore = smoothstep(0.48, 0.22, radius);
          vec3 deep = vec3(0.05, 0.12, 0.11);
          vec3 shallow = vec3(0.16, 0.24, 0.2);
          vec3 color = mix(shallow, deep, shore);
          color += uRain * 0.03;
          color = mix(color, vec3(0.03, 0.05, 0.07), uNight * 0.45);
          gl_FragColor = vec4(color, 0.35 + shore * 0.5);
        }
      `,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(POND.x, terrainHeight(POND.x, POND.y) + 0.012, POND.y);
  mesh.renderOrder = 2;
  return {
    mesh,
    update(state: WorldState, elapsed: number) {
      uniforms.uTime.value = elapsed;
      uniforms.uRain.value = state.rain;
      uniforms.uNight.value = 1 - daylightFactor(state.timeOfDay);
      mesh.scale.setScalar(0.92 + state.pond * 0.16);
    },
  };
}

interface Limb {
  mesh: THREE.Mesh;
  appear: number;
  full: number;
  base: THREE.Vector3;
  direction: THREE.Vector3;
}

interface Tuft {
  mesh: THREE.Mesh;
  limb: Limb;
  appear: number;
  offset: THREE.Vector3;
}

function createLife(quality: Quality) {
  const group = new THREE.Group();
  const random = mulberry32(27);
  const bark = new THREE.MeshStandardMaterial({ color: 0x4e3d32, roughness: 0.92 });
  const leafMaterials = [0x5d7344, 0x6d8450, 0x4c6238, 0x7b8b58].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, side: THREE.DoubleSide }),
  );
  for (const material of leafMaterials) material.onBeforeCompile = windShader;
  const limbs: Limb[] = [];
  const tufts: Tuft[] = [];

  const trunkPath = [
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0.01, 0.42, 0.005),
    new THREE.Vector3(-0.015, 0.56, -0.01),
    new THREE.Vector3(0.02, 0.7, 0.01),
    new THREE.Vector3(-0.01, 0.84, -0.005),
  ];
  for (let index = 0; index < trunkPath.length - 1; index += 1) {
    const from = trunkPath[index];
    const to = trunkPath[index + 1];
    if (!from || !to) continue;
    const radius = 0.05 - index * 0.008;
    limbs.push(addLimb(group, bark, from, to, radius, 0.05 + index * 0.04, quality));
  }

  const crown: { from: THREE.Vector3; yaw: number; pitch: number; length: number; appear: number }[] = [
    { from: trunkPath[3] ?? trunkPath[0]!, yaw: 0.5, pitch: 1.05, length: 0.22, appear: 0.28 },
    { from: trunkPath[3] ?? trunkPath[0]!, yaw: 2.3, pitch: 1.15, length: 0.26, appear: 0.32 },
    { from: trunkPath[4] ?? trunkPath[0]!, yaw: 4.0, pitch: 0.95, length: 0.2, appear: 0.36 },
    { from: trunkPath[2] ?? trunkPath[0]!, yaw: 5.3, pitch: 1.25, length: 0.16, appear: 0.4 },
  ];
  for (const branch of crown) {
    const direction = branchDirection(branch.yaw, branch.pitch);
    const tip = branch.from.clone().add(direction.clone().multiplyScalar(branch.length));
    const limb = addLimb(group, bark, branch.from, tip, 0.014, branch.appear, quality);
    limbs.push(limb);
    for (let twig = 0; twig < 2; twig += 1) {
      const twigDirection = branchDirection(branch.yaw + (twig === 0 ? 0.55 : -0.6), branch.pitch + 0.25);
      const twigTip = tip.clone().add(twigDirection.clone().multiplyScalar(branch.length * 0.55));
      const child = addLimb(group, bark, tip, twigTip, 0.007, branch.appear + 0.08, quality);
      limbs.push(child);
      addTuft(group, leafMaterials, child, branch.appear + 0.1, random, tufts, quality === "low" ? 4 : 7);
    }
  }

  const grassCount = quality === "low" ? 90 : quality === "balanced" ? 200 : 320;
  const blade = bentBlade();
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, side: THREE.DoubleSide, vertexColors: false });
  grassMaterial.onBeforeCompile = windShader;
  const grass = new THREE.InstancedMesh(blade, grassMaterial, grassCount);
  grass.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(grassCount * 3), 3);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let placed = 0;
  let guard = 0;
  while (placed < grassCount && guard < grassCount * 8) {
    guard += 1;
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 0.74;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x - POND.x, z - POND.y) < 0.16) continue;
    if (Math.hypot(x, z) < 0.08) continue;
    const patch = fbm(x * 4.0, z * 4.0);
    if (patch < -0.15 && random() > 0.35) continue;
    dummy.position.set(x, terrainHeight(x, z) - 0.005, z);
    dummy.rotation.y = random() * Math.PI;
    dummy.scale.set(0.7 + random() * 0.7, 0.55 + random() * 0.9, 1);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    tint.setHex(random() > 0.5 ? 0x6a844c : 0x556b3c).offsetHSL(0, (random() - 0.5) * 0.05, (random() - 0.5) * 0.06);
    grass.setColorAt(placed, tint);
    placed += 1;
  }
  grass.count = placed;
  grass.castShadow = quality === "high";
  grass.receiveShadow = true;
  group.add(grass);

  const mossMaterial = new THREE.MeshStandardMaterial({ color: 0x3e5636, roughness: 1 });
  const moss: THREE.Mesh[] = [];
  for (let index = 0; index < 8; index += 1) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.07 + random() * 0.05, 8), mossMaterial);
    const angle = index * 0.8 + 0.3;
    const radius = 0.22 + (index % 3) * 0.12;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    patch.position.set(x, terrainHeight(x, z) + 0.004, z);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = random() * Math.PI;
    moss.push(patch);
    group.add(patch);
  }

  const mushrooms: { group: THREE.Group; cap: THREE.Mesh }[] = [];
  for (let index = 0; index < 4; index += 1) {
    const mushroom = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.012, 0.045, 7),
      new THREE.MeshStandardMaterial({ color: 0xe4d8c4, roughness: 0.78 }),
    );
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 8),
      new THREE.MeshStandardMaterial({ color: index === 1 ? 0x7c3e34 : 0x6e5344, roughness: 0.62, emissive: 0x2a1810, emissiveIntensity: 0 }),
    );
    cap.scale.set(1, 0.55, 1);
    cap.position.y = 0.028;
    stem.position.y = 0.01;
    mushroom.add(stem, cap);
    const angle = 0.8 + index * 1.4;
    const radius = 0.28 + (index % 2) * 0.14;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    mushroom.position.set(x, terrainHeight(x, z) - 0.005, z);
    mushrooms.push({ group: mushroom, cap });
    group.add(mushroom);
  }

  const flower = new THREE.Group();
  const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xe6d5b0, roughness: 0.5, side: THREE.DoubleSide });
  for (let index = 0; index < 6; index += 1) {
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.018, 6), petalMaterial);
    const angle = (index / 6) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.02, 0.09, Math.sin(angle) * 0.02);
    petal.lookAt(0, 0.12, 0);
    flower.add(petal);
  }
  flower.add(new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 5), new THREE.MeshStandardMaterial({ color: 0x4a6338 })));
  flower.position.set(-0.24, terrainHeight(-0.24, 0.18), 0.18);
  flower.scale.setScalar(0.001);
  group.add(flower);

  const fernMaterial = new THREE.MeshStandardMaterial({ color: 0x4f6a3c, roughness: 0.8, side: THREE.DoubleSide });
  for (let index = 0; index < 3; index += 1) {
    const fern = new THREE.Group();
    for (let leaflet = 0; leaflet < 5; leaflet += 1) {
      const frond = new THREE.Mesh(new THREE.CircleGeometry(0.025, 5), fernMaterial);
      frond.position.y = leaflet * 0.018;
      frond.rotation.z = (leaflet % 2 === 0 ? 0.8 : -0.8);
      frond.rotation.x = -0.6;
      fern.add(frond);
    }
    const angle = 2.2 + index * 1.7;
    const x = Math.cos(angle) * 0.46;
    const z = Math.sin(angle) * 0.4;
    fern.position.set(x, terrainHeight(x, z), z);
    fern.rotation.y = angle;
    group.add(fern);
  }

  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.07, 0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 }),
    8,
  );
  stones.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(24), 3);
  for (let index = 0; index < 8; index += 1) {
    const angle = 0.4 + index * 0.78;
    const radius = index < 2 ? 0.5 : 0.3 + random() * 0.28;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    dummy.position.set(x, terrainHeight(x, z) - 0.02, z);
    dummy.rotation.set(random(), random(), random());
    const scale = index < 2 ? 1.15 : 0.35 + random() * 0.55;
    dummy.scale.set(scale * (0.8 + random() * 0.5), scale * (0.45 + random() * 0.3), scale);
    dummy.updateMatrix();
    stones.setMatrixAt(index, dummy.matrix);
    tint.setHex(index % 2 === 0 ? 0x6a645b : 0x534c45);
    stones.setColorAt(index, tint);
  }
  stones.castShadow = quality !== "low";
  stones.receiveShadow = true;
  group.add(stones);

  const rainCount = quality === "low" ? 40 : 90;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let index = 0; index < rainCount; index += 1) {
    rainPositions[index * 3] = (random() - 0.5) * 1.2;
    rainPositions[index * 3 + 1] = 0.45 + random() * 0.7;
    rainPositions[index * 3 + 2] = (random() - 0.5) * 1.2;
  }
  const rain = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ color: 0xb7c3c6, size: 0.012, transparent: true, opacity: 0, depthWrite: false }),
  );
  rain.geometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
  group.add(rain);

  const fireflyPositions = new Float32Array(18);
  const fireflies = new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ color: 0xe4c98a, size: 0.035, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  fireflies.geometry.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
  group.add(fireflies);

  const beetle = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a241c, roughness: 0.45, metalness: 0.15 }),
  );
  group.add(beetle);

  const grassFull = placed;
  return {
    group,
    update(state: WorldState, elapsed: number, reduceMotion: boolean) {
      windUniforms.uTime.value = elapsed;
      windUniforms.uWind.value = reduceMotion ? 0 : state.wind * (1 - state.droop * 0.5);
      for (const limb of limbs) {
        const grown = smooth(limb.appear, limb.appear + 0.14, state.tree);
        const sag = limb.direction.clone();
        sag.y -= state.droop * 0.35;
        sag.normalize();
        limb.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sag);
        limb.mesh.scale.y = Math.max(0.001, limb.full * grown);
        limb.mesh.position.copy(limb.base).add(sag.multiplyScalar(limb.full * grown * 0.5));
        limb.mesh.visible = grown > 0.04;
      }
      for (const tuft of tufts) {
        const grown = smooth(tuft.appear, tuft.appear + 0.12, state.tree);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(tuft.limb.mesh.quaternion);
        tuft.mesh.position.copy(tuft.limb.mesh.position).add(up.multiplyScalar(tuft.limb.mesh.scale.y * 0.5)).add(tuft.offset);
        tuft.mesh.lookAt(tuft.mesh.position.x + up.x, tuft.mesh.position.y + 0.2, tuft.mesh.position.z + up.z);
        const scale = grown * (1 - state.droop * 0.4);
        tuft.mesh.scale.setScalar(Math.max(0.001, scale));
        tuft.mesh.visible = scale > 0.08;
      }
      grass.count = Math.max(8, Math.floor(grassFull * clamp(0.35 + state.grass * 0.65, 0, 1)));
      const night = 1 - daylightFactor(state.timeOfDay);
      const glow = state.discoveries.glowingMushrooms ? night * (0.4 + state.humidity * 0.7) : 0;
      for (const [index, mushroom] of mushrooms.entries()) {
        const scale = smooth(index * 0.06, 0.22 + index * 0.05, state.mushrooms);
        mushroom.group.scale.setScalar(Math.max(0.001, scale));
        const material = mushroom.cap.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = glow;
      }
      flower.scale.setScalar(Math.max(0.001, state.discoveries.rareFlower ? 1 : state.rareFlower));
      flower.visible = flower.scale.x > 0.05;

      const rainMaterial = rain.material as THREE.PointsMaterial;
      rainMaterial.opacity = state.rain * 0.28;
      if (state.rain > 0.04 && !reduceMotion) {
        const positions = rain.geometry.attributes.position;
        if (positions) {
          for (let index = 0; index < rainCount; index += 1) {
            let y = positions.getY(index) - (0.35 + state.rain * 0.4) * 0.02;
            if (y < 0.36) y = 1.05;
            positions.setY(index, y);
          }
          positions.needsUpdate = true;
        }
      }

      const gather = state.discoveries.fireflies;
      const showFlies = night > 0.5 && (state.humidity > 0.45 || gather);
      (fireflies.material as THREE.PointsMaterial).opacity = showFlies ? 0.75 : 0;
      for (let index = 0; index < 6; index += 1) {
        const angle = elapsed * (reduceMotion ? 0.04 : 0.28) + index;
        const radius = gather ? 0.1 : 0.18 + (index % 3) * 0.06;
        const centerX = gather ? POND.x : 0;
        const centerZ = gather ? POND.y : 0;
        fireflyPositions[index * 3] = centerX + Math.cos(angle) * radius;
        fireflyPositions[index * 3 + 1] = 0.55 + Math.sin(elapsed * 0.7 + index) * (reduceMotion ? 0.01 : 0.06);
        fireflyPositions[index * 3 + 2] = centerZ + Math.sin(angle * 0.85) * radius;
      }
      const flyPosition = fireflies.geometry.attributes.position;
      if (flyPosition) flyPosition.needsUpdate = true;

      const crawl = elapsed * (reduceMotion ? 0.04 : 0.18);
      const beetleX = Math.cos(crawl) * 0.36;
      const beetleZ = Math.sin(crawl * 0.8) * 0.3;
      beetle.position.set(beetleX, terrainHeight(beetleX, beetleZ) + 0.012, beetleZ);
      beetle.visible = daylightFactor(state.timeOfDay) > 0.4;
    },
  };
}

const windUniforms = { uTime: { value: 0 }, uWind: { value: 0 } };

function windShader(shader: { uniforms: Record<string, { value: number }>; vertexShader: string }) {
  shader.uniforms.uTime = windUniforms.uTime;
  shader.uniforms.uWind = windUniforms.uWind;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uWind;")
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\ntransformed.x += sin(uTime * 1.4 + position.y * 9.0) * uWind * uv.y * 0.08;",
    );
}

function addLimb(group: THREE.Group, material: THREE.Material, from: THREE.Vector3, to: THREE.Vector3, radius: number, appear: number, quality: Quality) {
  const direction = to.clone().sub(from);
  const length = Math.max(0.01, direction.length());
  direction.normalize();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.004, radius * 0.55), radius, 1, 7), material);
  mesh.castShadow = quality !== "low";
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  mesh.position.copy(from).add(direction.clone().multiplyScalar(length * 0.5));
  mesh.scale.y = length;
  group.add(mesh);
  return { mesh, appear, full: length, base: from.clone(), direction: direction.clone() };
}

function addTuft(group: THREE.Group, materials: THREE.Material[], limb: Limb, appear: number, random: () => number, tufts: Tuft[], count: number) {
  for (let index = 0; index < count; index += 1) {
    const material = materials[index % materials.length];
    if (!material) continue;
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.034 + random() * 0.016, 6), material);
    const offset = new THREE.Vector3((random() - 0.5) * 0.07, (random() - 0.4) * 0.05, (random() - 0.5) * 0.07);
    group.add(mesh);
    tufts.push({ mesh, limb, appear, offset });
  }
}

function bentBlade() {
  const geometry = new THREE.PlaneGeometry(0.014, 0.13, 1, 3);
  const position = geometry.attributes.position;
  if (!position) return geometry;
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index) + 0.065;
    const lift = y / 0.13;
    position.setX(index, position.getX(index) * (1 - lift * 0.72));
    position.setZ(index, Math.sin(lift * 1.3) * 0.012);
  }
  geometry.translate(0, 0.065, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function fbm(x: number, z: number) {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave += 1) {
    value += amplitude * Math.sin(x * frequency * 1.7 + z * frequency * 0.6) * Math.cos(z * frequency * 1.3 - x * frequency * 0.45);
    frequency *= 2.05;
    amplitude *= 0.5;
  }
  return value;
}

function smooth(start: number, end: number, value: number) {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const t = (value - start) / (end - start);
  return t * t * (3 - 2 * t);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
