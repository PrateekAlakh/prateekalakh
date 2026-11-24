import assert from "node:assert/strict";
import test from "node:test";
import { advance, advanceAway, createWorld, ecosystemHealth, hydrate, serialize, withControls, type WorldState } from "./model.ts";

function hours(state: WorldState, total: number, patch: Partial<WorldState> = {}) {
  let current = { ...state, ...patch };
  let leftover = 0;
  const steps = Math.round(total / 0.05);
  for (let index = 0; index < steps; index += 1) {
    const next = advance(current, 0.05, leftover);
    current = next.state;
    leftover = next.leftover;
  }
  return current;
}

test("rain increases soil moisture", () => {
  const dry = hours(createWorld(), 6, { moisture: 0.3, rain: 0, rainTarget: 0, sunlightTarget: 0.3, timeOfDay: 0.5 });
  const wet = hours(createWorld(), 6, { moisture: 0.3, rain: 0, rainTarget: 1, sunlightTarget: 0.3, timeOfDay: 0.5 });
  assert.ok(wet.moisture > dry.moisture);
  assert.ok(wet.humidity > dry.humidity);
});

test("evaporation lowers moisture in strong sun without rain", () => {
  const start = createWorld();
  const next = hours(start, 8, { moisture: 0.7, rain: 0, rainTarget: 0, sunlight: 1, sunlightTarget: 1, timeOfDay: 0.5, wind: 0.4, windTarget: 0.4 });
  assert.ok(next.moisture < 0.7);
});

test("growth is faster in balanced conditions than in drought", () => {
  const healthy = hours(createWorld(), 24, { tree: 0.3, moisture: 0.6, rainTarget: 0.15, sunlightTarget: 0.7, nutrients: 0.8, timeOfDay: 0.45 });
  const drought = hours(createWorld(), 24, { tree: 0.3, moisture: 0.08, rainTarget: 0, sunlightTarget: 0.15, humidity: 0.1, nutrients: 0.2, timeOfDay: 0.5 });
  assert.ok(healthy.tree > drought.tree);
});

test("the same elapsed time matches whether it arrives in one chunk or many steps", () => {
  const start = withControls(createWorld(), { rainTarget: 0.8, sunlightTarget: 0.55 });
  const chunked = advance(start, 1).state;
  let stepped = start;
  let leftover = 0;
  for (let index = 0; index < 20; index += 1) {
    const next = advance(stepped, 0.05, leftover);
    stepped = next.state;
    leftover = next.leftover;
  }
  assert.equal(leftover, 0);
  assert.ok(Math.abs(chunked.moisture - stepped.moisture) < 1e-9);
  assert.ok(Math.abs(chunked.tree - stepped.tree) < 1e-9);
  assert.ok(Math.abs(chunked.ageHours - stepped.ageHours) < 1e-9);
});

test("time away is capped and does not keep a rainstorm running", () => {
  const soaked = withControls(createWorld(), { rainTarget: 1, sunlightTarget: 1 });
  const back = advanceAway({ ...soaked, moisture: 0.95, rain: 1 }, 10_000);
  assert.ok(back.ageHours - soaked.ageHours <= 72 + 1e-6);
  assert.equal(back.rainTarget, 1);
  assert.ok(back.moisture < 0.98);
  assert.ok(ecosystemHealth(back) > 0.15);
});

test("saved state restores and rejects corruption", () => {
  const saved = hours(createWorld(7), 3, { rainTarget: 0.4 });
  const restored = hydrate(serialize(saved));
  assert.deepEqual(restored, saved);
  assert.equal(hydrate("{"), null);
  assert.equal(hydrate(JSON.stringify({ ...saved, version: 2 })), null);
  assert.equal(hydrate(JSON.stringify({ ...saved, moisture: 4 })), null);
  assert.equal(hydrate(JSON.stringify({ ...saved, discoveries: { rareFlower: true } })), null);
});

test("reset matches a new world and values stay in range", () => {
  const reset = createWorld();
  const lived = hours(withControls(reset, { rainTarget: 1, sunlightTarget: 0.2, windTarget: 1 }), 30);
  for (const value of [lived.moisture, lived.humidity, lived.sunlight, lived.tree, lived.grass, lived.moss, lived.mushrooms, lived.pond, lived.droop, lived.temperature]) {
    assert.ok(value >= 0 && value <= 1);
  }
  assert.deepEqual(createWorld(), reset);
});
