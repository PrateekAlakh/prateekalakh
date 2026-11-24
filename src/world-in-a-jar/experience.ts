import { advance, advanceAway, createWorld, daylightFactor, ecosystemHealth, hydrate, serialize, withControls, type WorldState } from "./simulation/model";
import { chooseQuality, createWorldView, type WorldView } from "./renderWorld";

const STORAGE_KEY = "wij-world-v1";
const SEEN_KEY = "wij-seen-at";
const LIVE_HOURS_PER_SECOND = 24 / 240;

export function startWorld(root: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = root.querySelector<HTMLCanvasElement>(".jar-canvas");
  const intro = root.querySelector<HTMLElement>(".jar-intro");
  const fallback = root.querySelector<HTMLElement>(".jar-fallback");
  const panel = root.querySelector<HTMLElement>(".jar-panel");
  const live = root.querySelector<HTMLElement>(".jar-live");
  const rainButton = root.querySelector<HTMLButtonElement>("[data-jar='rain']");
  const dayButton = root.querySelector<HTMLButtonElement>("[data-jar='day']");
  const infoButton = root.querySelector<HTMLButtonElement>("[data-jar='info']");
  const resetView = root.querySelector<HTMLButtonElement>("[data-jar='view']");
  const resetWorld = root.querySelector<HTMLButtonElement>("[data-jar='reset']");
  const sun = root.querySelector<HTMLInputElement>("[data-jar='sun']");
  const wind = root.querySelector<HTMLInputElement>("[data-jar='wind']");
  if (!canvas || !intro || !rainButton || !dayButton || !infoButton || !resetView || !resetWorld || !sun || !wind) return;

  let state = loadState();
  const welcomed = state.welcomed;
  state = state.world;
  sun.value = String(state.sunlightTarget);
  wind.value = String(state.windTarget);
  paint(root, state);
  if (welcomed) intro.hidden = true;

  let view: WorldView | null = null;
  try {
    if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) throw new Error("no webgl");
    view = createWorldView(canvas, chooseQuality());
  } catch {
    if (fallback) fallback.hidden = false;
  }

  let leftover = 0;
  let last = performance.now();
  let raf = 0;
  let running = true;
  let saveTimer = 0;

  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden) {
      const stepped = advance(state, dt * (reduceMotion ? LIVE_HOURS_PER_SECOND * 0.45 : LIVE_HOURS_PER_SECOND), leftover);
      state = stepped.state;
      leftover = stepped.leftover;
      view?.render(state, dt, reduceMotion);
      paint(root, state);
    }
    raf = requestAnimationFrame(frame);
  };

  const resize = () => view?.resize(canvas.clientWidth, canvas.clientHeight);
  resize();
  raf = requestAnimationFrame(frame);
  window.addEventListener("resize", resize);

  const pointers = new Map<number, { x: number; y: number }>();
  let pinch: number | null = null;
  canvas.addEventListener("pointerdown", (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const [first, second] = [...pointers.values()];
      if (!first || !second) return;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (pinch) view?.zoom((pinch - distance) * 0.002);
      pinch = distance;
      return;
    }
    view?.drag(event.clientX - previous.x, event.clientY - previous.y);
  });
  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    view?.zoom(Math.sign(event.deltaY) * 0.08);
  }, { passive: false });

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("[data-jar='enter']")) {
      intro.hidden = true;
      rainButton.focus();
      say(live, "The world is open. Give it light, or let it rain.");
      return;
    }
    if (target.closest("[data-jar='rain']")) {
      state = withControls(state, { rainTarget: state.rainTarget > 0.5 ? 0 : 1 });
      say(live, state.rainTarget > 0.5 ? "Rain is arriving." : "The rain is easing off.");
    }
    if (target.closest("[data-jar='day']")) {
      const night = daylightFactor(state.timeOfDay) > 0.45;
      state = withControls(state, { timeBias: night ? 0 : 0.5 });
      say(live, night ? "Night is settling over the jar." : "Morning is coming back.");
    }
    if (target.closest("[data-jar='info']")) {
      if (panel) panel.hidden = !panel.hidden;
      infoButton.setAttribute("aria-expanded", panel && !panel.hidden ? "true" : "false");
    }
    if (target.closest("[data-jar='view']")) view?.resetCamera();
    if (target.closest("[data-jar='reset']")) {
      if (window.confirm("Let this world go and start again?")) {
        state = createWorld((Date.now() % 997) + 1);
        leftover = 0;
        sun.value = String(state.sunlightTarget);
        wind.value = String(state.windTarget);
        say(live, "A new world is beginning.");
      }
    }
    paint(root, state);
  });

  sun.addEventListener("input", () => {
    state = withControls(state, { sunlightTarget: Number(sun.value) });
    say(live, `Sunlight is ${Math.round(state.sunlightTarget * 100)} percent.`);
  });
  wind.addEventListener("input", () => {
    state = withControls(state, { windTarget: Number(wind.value) });
    say(live, state.windTarget > 0.4 ? "A breeze is moving through the jar." : "The air is settling.");
  });

  const onHide = () => {
    if (document.hidden) {
      save(state);
      return;
    }
    const away = readAwayHours();
    if (away > 0.02) state = advanceAway(state, away);
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onHide);
  saveTimer = window.setInterval(() => save(state), 15000);
  window.addEventListener("pagehide", () => save(state));

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.clearInterval(saveTimer);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onHide);
    save(state);
    view?.dispose();
  };
}

function loadState() {
  let world = createWorld((Date.now() % 5000) + 3);
  let welcomed = false;
  try {
    const saved = hydrate(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      world = advanceAway(saved, readAwayHours());
      welcomed = true;
    }
  } catch {
    welcomed = false;
  }
  return { world, welcomed };
}

function readAwayHours() {
  const seen = Number(localStorage.getItem(SEEN_KEY));
  if (!Number.isFinite(seen) || seen <= 0) return 0;
  return Math.max(0, (Date.now() - seen) / 3_600_000);
}

function save(state: WorldState) {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    /* Storage can be full or blocked. The world still runs for this visit. */
  }
}

function paint(root: HTMLElement, state: WorldState) {
  const rainButton = root.querySelector<HTMLButtonElement>("[data-jar='rain']");
  const dayButton = root.querySelector<HTMLButtonElement>("[data-jar='day']");
  if (rainButton) {
    rainButton.setAttribute("aria-pressed", state.rainTarget > 0.5 ? "true" : "false");
    rainButton.textContent = state.rainTarget > 0.5 ? "Rain falling" : "Let it rain";
  }
  if (dayButton) dayButton.textContent = daylightFactor(state.timeOfDay) > 0.45 ? "Bring the night" : "Bring the morning";
  const health = ecosystemHealth(state);
  const set = (name: string, value: string) => {
    const node = root.querySelector(`[data-read='${name}']`);
    if (node) node.textContent = value;
  };
  set("age", formatAge(state.ageHours));
  set("moisture", percent(state.moisture));
  set("humidity", percent(state.humidity));
  set("sun", percent(state.sunlight));
  set("temperature", `${Math.round(14 + state.temperature * 18)}°C`);
  set("health", health > 0.72 ? "Thriving" : health > 0.45 ? "Settling" : "Resting");
  const notes = root.querySelector("[data-read='notes']");
  if (notes) notes.textContent = discoveryLine(state);
}

function discoveryLine(state: WorldState) {
  if (state.discoveries.rareFlower) return "A pale flower opened in the moss.";
  if (state.discoveries.glowingMushrooms && daylightFactor(state.timeOfDay) < 0.35) return "The mushrooms are carrying a little light.";
  if (state.discoveries.fireflies && daylightFactor(state.timeOfDay) < 0.35) return "Fireflies found the water.";
  if (state.droop > 0.45) return "The leaves are waiting for water.";
  return "Rain feeds the soil. Light helps the tree. Away, the world settles rather than failing.";
}

function formatAge(hours: number) {
  if (hours < 36) return `${Math.round(hours)} hours`;
  const days = hours / 24;
  return `${days < 10 ? days.toFixed(1) : Math.round(days)} days`;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function say(live: HTMLElement | null, message: string) {
  if (live) live.textContent = message;
}
