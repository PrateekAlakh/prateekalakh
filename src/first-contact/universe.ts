import * as THREE from "three";
import { planets, type PlanetId } from "./planetData";

export type UniversePick =
  | { kind: "planet"; id: PlanetId }
  | { kind: "earth" }
  | { kind: "signal" };

interface PickData {
  pick?: UniversePick["kind"];
  id?: PlanetId;
}

interface Body {
  id?: PlanetId;
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  orbit: number;
  speed: number;
  phase: number;
  height: number;
  radius: number;
}

export class UniverseScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly pickables: THREE.Object3D[] = [];
  private readonly bodies: Body[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private ship: THREE.Group | null = null;
  private signal: THREE.Mesh | null = null;
  private alive = true;
  private raf = 0;
  private last = performance.now();
  private theta = 0.55;
  private phi = 1.12;
  private radius = 12;
  private targetRadius = 12;
  private target = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private focusId: PlanetId | null = null;
  private pinch: number | null = null;
  private moved = false;
  private downX = 0;
  private downY = 0;
  private hovering: THREE.Mesh | null = null;
  private elapsed = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onPick: (pick: UniversePick) => void,
    private readonly reduceMotion: boolean,
  ) {
    this.scene.background = new THREE.Color(0x07070c);
    this.scene.fog = new THREE.FogExp2(0x07070c, 0.018);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.mobile(),
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x07070c, 1);

    this.addLights();
    this.addStars();
    this.addPlanets();
    this.addShip();
    this.addSignal();
    this.addEarth();
    this.resize();
    this.bind();
    this.loop();
    requestAnimationFrame(() => {
      if (this.alive) this.resize();
    });
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, this.mobile() ? 1.25 : 1.6);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  focusPlanet(id: PlanetId | null) {
    this.focusId = id;
    if (!id) {
      this.desiredTarget.set(0, 0, 0);
      this.targetRadius = 12;
      return;
    }
    const body = this.bodies.find((item) => item.id === id);
    if (body) this.targetRadius = Math.max(5.5, body.radius * 6.2);
  }

  focusNext(step: number) {
    const index = this.focusId ? planets.findIndex((planet) => planet.id === this.focusId) : -1;
    const next = planets[(index + step + planets.length) % planets.length];
    if (!next) return;
    this.focusPlanet(next.id);
    this.onPick({ kind: "planet", id: next.id });
  }

  dispose() {
    this.alive = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.unbind();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    const canvas = this.renderer.domElement;
    this.renderer.dispose();
    canvas.remove();
    try {
      this.renderer.forceContextLoss();
    } catch {
      /* The context may already be gone. */
    }
  }

  private mobile() {
    return Math.min(window.innerWidth, window.innerHeight) < 760;
  }

  private track<T extends THREE.BufferGeometry>(geometry: T) {
    this.geometries.push(geometry);
    return geometry;
  }

  private shade<T extends THREE.Material>(material: T) {
    this.materials.push(material);
    return material;
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xf4f0e6, 0.7));
    const sun = new THREE.DirectionalLight(0xfff4e8, 2.6);
    sun.position.set(8, 6, 10);
    this.scene.add(sun);
    const rim = new THREE.PointLight(0xff8a62, 8, 40);
    rim.position.set(-6, 2, -4);
    this.scene.add(rim);
  }

  private addStars() {
    const count = this.mobile() ? 500 : 1100;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.cos(phi);
      positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = this.track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = this.shade(
      new THREE.PointsMaterial({
        color: 0xf4f0e6,
        size: this.mobile() ? 0.14 : 0.11,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    this.scene.add(new THREE.Points(geometry, material));
  }

  private addPlanets() {
    const sphere = this.track(new THREE.SphereGeometry(1, this.mobile() ? 24 : 40, this.mobile() ? 18 : 28));
    for (const planet of planets) {
      const pivot = new THREE.Group();
      const material = this.shade(
        new THREE.MeshStandardMaterial({
          color: planet.color,
          emissive: planet.emissive,
          emissiveIntensity: planet.id === "bugfix" ? 0.55 : 0.28,
          roughness: 0.62,
          metalness: 0.08,
        }),
      );
      const mesh = new THREE.Mesh(sphere, material);
      mesh.scale.setScalar(planet.radius);
      mesh.userData = { pick: "planet", id: planet.id } satisfies PickData;
      pivot.add(mesh);
      this.pickables.push(mesh);

      if (planet.id === "procrastina") {
        const ring = new THREE.Mesh(
          this.track(new THREE.RingGeometry(planet.radius * 1.45, planet.radius * 2.15, 64)),
          this.shade(
            new THREE.MeshBasicMaterial({
              color: 0xc7b7ff,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.72,
            }),
          ),
        );
        ring.rotation.x = Math.PI / 2.4;
        pivot.add(ring);
      }

      if (planet.id === "monday" || planet.id === "unknown") {
        const cloud = new THREE.Mesh(
          sphere,
          this.shade(
            new THREE.MeshStandardMaterial({
              color: planet.id === "unknown" ? 0xd7efe0 : 0xd5e7ff,
              transparent: true,
              opacity: planet.id === "unknown" ? 0.38 : 0.16,
              roughness: 1,
              depthWrite: false,
            }),
          ),
        );
        cloud.scale.setScalar(planet.radius * (planet.id === "unknown" ? 1.18 : 1.08));
        cloud.userData = { cloud: planet.id };
        pivot.add(cloud);
      }

      if (planet.id === "bugfix") {
        const rig = new THREE.Group();
        rig.userData = { rig: "bugfix" };
        for (let index = 0; index < 4; index += 1) {
          const box = new THREE.Mesh(
            this.track(new THREE.BoxGeometry(0.18, 0.18, 0.18)),
            this.shade(
              new THREE.MeshStandardMaterial({
                color: 0xffb08a,
                emissive: 0xff4d1c,
                emissiveIntensity: 0.8,
              }),
            ),
          );
          const arm = planet.radius + 0.35 + index * 0.12;
          box.position.set(Math.cos(index) * arm, (index - 1.5) * 0.22, Math.sin(index * 1.4) * arm);
          rig.add(box);
        }
        pivot.add(rig);
      }

      this.scene.add(pivot);
      this.bodies.push({
        id: planet.id,
        pivot,
        mesh,
        orbit: planet.orbit,
        speed: planet.speed,
        phase: planet.phase,
        height: planet.height,
        radius: planet.radius,
      });
    }
  }

  private addShip() {
    const ship = new THREE.Group();
    const hull = this.shade(new THREE.MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.4, metalness: 0.3 }));
    const body = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.7, 0.16, 0.22)), hull);
    const neck = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.16, 0.1, 0.34)), hull);
    neck.position.z = 0.24;
    const panel = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(1.15, 0.03, 0.28)),
      this.shade(new THREE.MeshStandardMaterial({ color: 0x8f897e, emissive: 0x2a241c, emissiveIntensity: 0.3 })),
    );
    ship.add(body, neck, panel);
    this.scene.add(ship);
    this.ship = ship;
  }

  private addSignal() {
    const mesh = new THREE.Mesh(
      this.track(new THREE.IcosahedronGeometry(0.28, 0)),
      this.shade(
        new THREE.MeshStandardMaterial({
          color: 0xff8a62,
          emissive: 0xff4d1c,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0,
        }),
      ),
    );
    mesh.position.set(6.5, 2.4, -7.5);
    mesh.userData = { pick: "signal" } satisfies PickData;
    this.scene.add(mesh);
    this.pickables.push(mesh);
    this.signal = mesh;
  }

  private addEarth() {
    const mesh = new THREE.Mesh(
      this.track(new THREE.SphereGeometry(0.42, 24, 16)),
      this.shade(
        new THREE.MeshStandardMaterial({
          color: 0x9ec4de,
          emissive: 0x1d3d52,
          emissiveIntensity: 0.25,
          roughness: 0.7,
        }),
      ),
    );
    mesh.position.set(-18, -1.2, 12);
    mesh.userData = { pick: "earth" } satisfies PickData;
    this.scene.add(mesh);
    this.pickables.push(mesh);
  }

  private bind() {
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointercancel", this.onUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private unbind() {
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private onResize = () => this.resize();

  private onVisibility = () => {
    if (!document.hidden && this.alive && !this.raf) {
      this.last = performance.now();
      this.loop();
    }
  };

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const next = this.targetRadius * (1 + Math.sign(event.deltaY) * 0.08);
    this.targetRadius = Math.min(34, Math.max(5, next));
  };

  private onDown = (event: PointerEvent) => {
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.moved = false;
    this.downX = event.clientX;
    this.downY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
  };

  private onMove = (event: PointerEvent) => {
    if (!this.pointers.has(event.pointerId)) {
      if (event.pointerType === "mouse") this.hover(event.clientX, event.clientY);
      return;
    }
    const previous = this.pointers.get(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!previous) return;
    if (Math.hypot(event.clientX - this.downX, event.clientY - this.downY) > 8) this.moved = true;

    if (this.pointers.size >= 2) {
      const [first, second] = [...this.pointers.values()];
      if (!first || !second) return;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (this.pinch) {
        const scale = this.pinch / Math.max(1, distance);
        this.targetRadius = Math.min(34, Math.max(5, this.targetRadius * scale));
      }
      this.pinch = distance;
      return;
    }

    this.pinch = null;
    this.theta -= (event.clientX - previous.x) * 0.005;
    this.phi = Math.min(Math.PI - 0.28, Math.max(0.28, this.phi + (event.clientY - previous.y) * 0.004));
  };

  private onUp = (event: PointerEvent) => {
    const wasDrag = this.moved;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (!wasDrag && this.pointers.size === 0) this.pick(event.clientX, event.clientY);
  };

  private hover(x: number, y: number) {
    const hit = this.cast(x, y);
    const mesh = hit?.object instanceof THREE.Mesh ? hit.object : null;
    if (this.hovering && this.hovering !== mesh) this.hovering.scale.setScalar(this.scaleOf(this.hovering));
    if (mesh?.userData.pick === "planet") {
      mesh.scale.setScalar(this.scaleOf(mesh) * 1.045);
      this.canvas.style.cursor = "pointer";
    } else {
      this.canvas.style.cursor = "grab";
    }
    this.hovering = mesh?.userData.pick === "planet" ? mesh : null;
  }

  private scaleOf(mesh: THREE.Mesh) {
    const body = this.bodies.find((item) => item.mesh === mesh);
    return body?.radius ?? 1;
  }

  private pick(x: number, y: number) {
    const hit = this.cast(x, y);
    const data = hit?.object.userData as PickData | undefined;
    if (!data?.pick) return;
    if (data.pick === "signal") {
      const material = (hit?.object as THREE.Mesh).material;
      if (material instanceof THREE.MeshStandardMaterial && material.opacity < 0.35) return;
      this.onPick({ kind: "signal" });
      return;
    }
    if (data.pick === "planet" && data.id) {
      this.focusPlanet(data.id);
      this.onPick({ kind: "planet", id: data.id });
      return;
    }
    if (data.pick === "earth") this.onPick({ kind: "earth" });
  }

  private cast(x: number, y: number) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickables, false);
    return hits.find((hit) => {
      if (hit.object.userData.pick !== "signal") return true;
      const material = (hit.object as THREE.Mesh).material;
      return material instanceof THREE.MeshStandardMaterial && material.opacity >= 0.35;
    });
  }

  private loop = () => {
    if (!this.alive) return;
    if (document.hidden) {
      this.raf = 0;
      return;
    }
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.frame(dt);
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(dt: number) {
    const motion = this.reduceMotion ? 0 : dt;
    if (!this.reduceMotion) this.elapsed += dt;
    for (const body of this.bodies) {
      const angle = body.phase + this.elapsed * body.speed;
      const wander = body.id === "unknown" ? Math.sin(this.elapsed * 0.35) * 0.85 : 0;
      body.pivot.position.set(
        Math.cos(angle) * (body.orbit + wander),
        body.height,
        Math.sin(angle) * (body.orbit + wander),
      );
      body.mesh.rotation.y += motion * 0.25;
      const cloud = body.pivot.children.find((child) => child.userData.cloud);
      if (cloud) cloud.rotation.y -= motion * 0.12;
      const rig = body.pivot.children.find((child) => child.userData.rig);
      if (rig) {
        rig.rotation.y += motion * 0.7;
        const material = body.mesh.material;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.emissiveIntensity = 0.35 + Math.abs(Math.sin(performance.now() * 0.004)) * 0.5;
        }
      }
    }

    if (this.ship) {
      const t = this.elapsed * 0.12;
      this.ship.position.set(Math.cos(t) * 15, 1.6 + Math.sin(t * 2) * 0.4, Math.sin(t) * 15);
      this.ship.lookAt(0, 1.6, 0);
    }

    if (this.signal) {
      const material = this.signal.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        const wave = Math.sin(performance.now() * 0.0011);
        material.opacity = this.reduceMotion ? 0.2 : wave > 0.55 ? (wave - 0.55) / 0.45 : 0;
      }
      this.signal.rotation.y += motion;
    }

    if (this.focusId) {
      const body = this.bodies.find((item) => item.id === this.focusId);
      if (body) this.desiredTarget.copy(body.pivot.position);
    }

    this.target.lerp(this.desiredTarget, 1 - Math.exp(-dt * 3.2));
    this.radius += (this.targetRadius - this.radius) * (1 - Math.exp(-dt * 3.2));
    const sinPhi = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sinPhi * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * sinPhi * Math.cos(this.theta),
    );
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
  }
}

