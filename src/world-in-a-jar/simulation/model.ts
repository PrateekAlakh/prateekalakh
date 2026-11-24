/**
 * World in a Jar — environmental model.
 *
 * Assumptions (deliberately simple, internally consistent):
 * - Values are normalized from 0 to 1 unless noted. 0.5 temperature is a mild day.
 * - One simulated day is 24 simulated hours. While the page is open, time is
 *   accelerated by the caller. Time away uses real hours.
 * - Rain raises soil moisture and humidity, then eases off. It does not snap on.
 * - Sunlight, wind, and daylight drive temperature. Heat and wind evaporate moisture.
 * - Photosynthesis needs moisture, light, a comfortable temperature, and nutrients.
 * - Drought raises droop and slows the tree and grass. Moss and mushrooms prefer
 *   humidity and do poorly in harsh light.
 * - The pond follows moisture and recent rain. It is not a fluid simulation.
 * - Away from the page, weather relaxes toward a mild climate for at most 72 hours
 *   so a forgotten tab cannot bake or flood the world. Saved control targets return.
 * - Discoveries are sticky once earned: a rare flower after a long healthy spell,
 *   glowing mushrooms after humid nights, fireflies after a humid night with water.
 *
 * Limitations: this is not botany. Species do not compete for space, there is no
 * seasonal calendar, and nutrients are a single pool.
 */

export const SIM_STEP_HOURS = 0.05;
export const MAX_AWAY_HOURS = 72;

export interface Discoveries {
  rareFlower: boolean;
  glowingMushrooms: boolean;
  fireflies: boolean;
}

export interface WorldState {
  version: 1;
  seed: number;
  ageHours: number;
  moisture: number;
  humidity: number;
  sunlight: number;
  sunlightTarget: number;
  temperature: number;
  nutrients: number;
  wind: number;
  windTarget: number;
  rain: number;
  rainTarget: number;
  /** 0 and 1 are midnight, 0.5 is noon. */
  timeOfDay: number;
  /** When set, the clock eases toward this hour and then resumes on its own. */
  timeBias: number | null;
  tree: number;
  grass: number;
  moss: number;
  mushrooms: number;
  pond: number;
  droop: number;
  rareFlower: number;
  healthyHours: number;
  humidNightHours: number;
  discoveries: Discoveries;
}

export function createWorld(seed = 1): WorldState {
  return {
    version: 1,
    seed,
    ageHours: 8,
    moisture: 0.56,
    humidity: 0.48,
    sunlight: 0.62,
    sunlightTarget: 0.62,
    temperature: 0.5,
    nutrients: 0.7,
    wind: 0.12,
    windTarget: 0.12,
    rain: 0,
    rainTarget: 0,
    timeOfDay: 0.4,
    timeBias: null,
    tree: 0.62,
    grass: 0.58,
    moss: 0.3,
    mushrooms: 0.16,
    pond: 0.42,
    droop: 0,
    rareFlower: 0,
    healthyHours: 0,
    humidNightHours: 0,
    discoveries: { rareFlower: false, glowingMushrooms: false, fireflies: false },
  };
}

export function daylightFactor(timeOfDay: number) {
  const lifted = Math.cos((timeOfDay - 0.5) * Math.PI * 2);
  return clamp01(lifted * 0.5 + 0.5);
}

export function ecosystemHealth(state: WorldState) {
  const sun = state.sunlight * (0.12 + 0.88 * daylightFactor(state.timeOfDay));
  const comfort = 1 - Math.min(1, Math.abs(state.temperature - 0.52) * 2.2);
  const water = 1 - Math.min(1, Math.abs(state.moisture - 0.58) * 1.6);
  const cover = clamp01(state.tree * 0.4 + state.grass * 0.35 + state.moss * 0.25);
  return clamp01(comfort * 0.34 + water * 0.28 + sun * 0.2 + cover * 0.18 - state.droop * 0.22);
}

export function advance(state: WorldState, hours: number, leftover = 0) {
  const safeHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  let time = leftover + safeHours;
  let next = state;
  while (time >= SIM_STEP_HOURS - 1e-9) {
    next = integrate(next, SIM_STEP_HOURS);
    time -= SIM_STEP_HOURS;
  }
  return { state: next, leftover: time };
}

/** Real hours away, capped, under a mild climate. Control targets are restored. */
export function advanceAway(state: WorldState, realHours: number) {
  const hours = Math.min(MAX_AWAY_HOURS, Math.max(0, Number.isFinite(realHours) ? realHours : 0));
  const eased: WorldState = {
    ...state,
    rainTarget: 0,
    sunlightTarget: 0.58,
    windTarget: 0.1,
    timeBias: null,
  };
  const next = advance(eased, hours).state;
  return {
    ...next,
    rainTarget: state.rainTarget,
    sunlightTarget: state.sunlightTarget,
    windTarget: state.windTarget,
    timeBias: state.timeBias,
  };
}

export function withControls(state: WorldState, patch: Partial<Pick<WorldState, "rainTarget" | "sunlightTarget" | "windTarget" | "timeBias">>): WorldState {
  return {
    ...state,
    ...patch,
    rainTarget: patch.rainTarget === undefined ? state.rainTarget : clamp01(patch.rainTarget),
    sunlightTarget: patch.sunlightTarget === undefined ? state.sunlightTarget : clamp01(patch.sunlightTarget),
    windTarget: patch.windTarget === undefined ? state.windTarget : clamp01(patch.windTarget),
  };
}

export function hydrate(raw: string | null): WorldState | null {
  if (!raw) return null;
  try {
    return parseState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function serialize(state: WorldState) {
  return JSON.stringify(state);
}

function integrate(state: WorldState, dt: number): WorldState {
  const rain = damp(state.rain, clamp01(state.rainTarget), dt, 1.6);
  const sunlight = damp(state.sunlight, clamp01(state.sunlightTarget), dt, 6);
  const wind = damp(state.wind, clamp01(state.windTarget), dt, 1.2);
  let timeOfDay = state.timeOfDay + dt / 24;
  let timeBias = state.timeBias;
  if (timeBias !== null && Number.isFinite(timeBias)) {
    timeOfDay = dampCircular(timeOfDay, timeBias, dt, 1.15);
    if (circularDistance(timeOfDay, timeBias) < 0.02) timeBias = null;
  }
  timeOfDay = wrap01(timeOfDay);

  const daylight = daylightFactor(timeOfDay);
  const effectiveSun = sunlight * (0.08 + 0.92 * daylight);
  const temperature = damp(state.temperature, 0.34 + effectiveSun * 0.48 - wind * 0.05, dt, 0.75);

  let moisture = state.moisture + rain * 0.46 * dt;
  const evaporation = (0.006 + effectiveSun * 0.018 + wind * 0.008 + Math.max(0, temperature - 0.62) * 0.012) * dt;
  moisture = clamp01(moisture - evaporation);

  let humidity = state.humidity + rain * 0.3 * dt + moisture * 0.05 * dt;
  humidity -= (0.04 + wind * 0.07 + (1 - rain) * 0.015) * dt;
  humidity = clamp01(humidity);

  const comfort = 1 - Math.min(1, Math.abs(temperature - 0.52) * 2.2);
  const photosynthesis = clamp01(moisture * 1.2) * effectiveSun * comfort * (0.4 + state.nutrients * 0.6);
  const drought = moisture < 0.28 ? (0.28 - moisture) / 0.28 : 0;
  const droop = clamp01(state.droop + (drought * 0.4 - (1 - drought) * 0.14) * dt);
  const growthScale = 1 - droop * 0.7;

  const tree = clamp01(state.tree + photosynthesis * 0.011 * growthScale * dt);
  const grass = clamp01(state.grass + (0.25 + effectiveSun * 0.75) * clamp01(moisture * 1.15) * 0.018 * growthScale * dt - drought * 0.035 * dt);
  const moss = clamp01(state.moss + humidity * (1 - effectiveSun * 0.4) * 0.016 * dt - (humidity < 0.3 ? 0.01 * dt : 0));
  const mushrooms = clamp01(state.mushrooms + humidity * moisture * (1 - effectiveSun * 0.5) * 0.014 * dt);
  const grown = Math.max(0, tree - state.tree) + Math.max(0, grass - state.grass);
  const nutrients = clamp01(state.nutrients + (0.74 - state.nutrients) * 0.025 * dt - grown * 0.45);
  const pond = damp(state.pond, clamp01(moisture * 0.75 + rain * 0.4), dt, 0.7);

  const health = ecosystemHealth({ ...state, moisture, sunlight, temperature, droop, tree, grass, moss, timeOfDay });
  const healthyHours = state.healthyHours + (health > 0.72 && moisture > 0.4 && moisture < 0.8 ? dt : 0);
  const night = daylight < 0.28;
  const humidNightHours = state.humidNightHours + (night && humidity > 0.62 ? dt : 0);

  let rareFlower = state.rareFlower;
  let discoveries = state.discoveries;
  if (!discoveries.rareFlower && healthyHours > 16 && tree > 0.52 && moisture > 0.4 && moisture < 0.78) {
    rareFlower = clamp01(rareFlower + dt * 0.2);
    if (rareFlower >= 1) discoveries = { ...discoveries, rareFlower: true };
  }
  if (!discoveries.glowingMushrooms && humidNightHours > 3.5 && mushrooms > 0.38) {
    discoveries = { ...discoveries, glowingMushrooms: true };
  }
  if (!discoveries.fireflies && night && humidity > 0.5 && pond > 0.34) {
    discoveries = { ...discoveries, fireflies: true };
  }

  return {
    ...state,
    ageHours: state.ageHours + dt,
    rain,
    sunlight,
    wind,
    timeOfDay,
    timeBias,
    temperature,
    moisture,
    humidity,
    nutrients,
    droop,
    tree,
    grass,
    moss,
    mushrooms,
    pond,
    rareFlower,
    healthyHours,
    humidNightHours,
    discoveries,
  };
}

function damp(current: number, target: number, dt: number, rate: number) {
  const t = 1 - Math.exp(-rate * dt);
  return current + (target - current) * t;
}

function dampCircular(current: number, target: number, dt: number, rate: number) {
  const delta = wrapSigned(target - current);
  return current + delta * (1 - Math.exp(-rate * dt));
}

function circularDistance(a: number, b: number) {
  return Math.abs(wrapSigned(a - b));
}

function wrapSigned(value: number) {
  return ((value + 0.5) % 1 + 1) % 1 - 0.5;
}

function wrap01(value: number) {
  return ((value % 1) + 1) % 1;
}

export function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function parseState(value: unknown): WorldState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<WorldState>;
  if (record.version !== 1) return null;
  const fresh = createWorld();
  const numeric: (keyof WorldState)[] = [
    "seed",
    "ageHours",
    "moisture",
    "humidity",
    "sunlight",
    "sunlightTarget",
    "temperature",
    "nutrients",
    "wind",
    "windTarget",
    "rain",
    "rainTarget",
    "timeOfDay",
    "tree",
    "grass",
    "moss",
    "mushrooms",
    "pond",
    "droop",
    "rareFlower",
    "healthyHours",
    "humidNightHours",
  ];
  const next = { ...fresh, discoveries: { ...fresh.discoveries } };
  for (const key of numeric) {
    const item = record[key];
    if (typeof item !== "number" || !Number.isFinite(item)) return null;
    next[key] = item as never;
  }
  const unitKeys: (keyof WorldState)[] = [
    "moisture",
    "humidity",
    "sunlight",
    "sunlightTarget",
    "temperature",
    "nutrients",
    "wind",
    "windTarget",
    "rain",
    "rainTarget",
    "tree",
    "grass",
    "moss",
    "mushrooms",
    "pond",
    "droop",
    "rareFlower",
  ];
  for (const key of unitKeys) {
    if ((next[key] as number) < 0 || (next[key] as number) > 1) return null;
  }
  if (next.timeOfDay < 0 || next.timeOfDay > 1 || next.ageHours < 0 || next.seed < 0) return null;
  if (record.timeBias !== null && (typeof record.timeBias !== "number" || record.timeBias < 0 || record.timeBias > 1)) return null;
  next.timeBias = record.timeBias ?? null;
  const found = record.discoveries;
  if (!found || typeof found !== "object") return null;
  if (typeof found.rareFlower !== "boolean" || typeof found.glowingMushrooms !== "boolean" || typeof found.fireflies !== "boolean") return null;
  next.discoveries = { rareFlower: found.rareFlower, glowingMushrooms: found.glowingMushrooms, fireflies: found.fireflies };
  return next;
}
