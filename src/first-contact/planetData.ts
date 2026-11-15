export type PlanetId = "procrastina" | "bugfix" | "monday" | "unknown";

export interface PlanetDef {
  id: PlanetId;
  name: string;
  transmission: string;
  detail: string;
  encore: string;
  color: number;
  emissive: number;
  radius: number;
  orbit: number;
  speed: number;
  phase: number;
  tilt: number;
  height: number;
}

export const planets: PlanetDef[] = [
  {
    id: "procrastina",
    name: "Planet Procrastina",
    transmission: "We have received your message. We'll respond tomorrow.",
    detail: "Its inhabitants have been preparing for first contact for approximately 4,000 years.",
    encore: "Tomorrow has been moved. They ask that you continue to hold.",
    color: 0x6c4dff,
    emissive: 0x2a1466,
    radius: 1.05,
    orbit: 5.2,
    speed: 0.16,
    phase: 0.4,
    tilt: 0.35,
    height: 0.2,
  },
  {
    id: "bugfix",
    name: "Planet Bugfix-9",
    transmission: "Everything was working yesterday.",
    detail: "The civilization has been attempting to resolve a production incident for several centuries.",
    encore: "They found the bug. It was the century.",
    color: 0xff6a2a,
    emissive: 0xff4d1c,
    radius: 0.86,
    orbit: 7.6,
    speed: 0.12,
    phase: 1.7,
    tilt: 0.1,
    height: -0.15,
  },
  {
    id: "monday",
    name: "Planet Monday",
    transmission: "No intelligent life detected before coffee.",
    detail: "Communication attempts are automatically rejected before 10 AM, planetary time.",
    encore: "It is still before coffee. This reply is a courtesy outage.",
    color: 0x7eb6ff,
    emissive: 0x16324f,
    radius: 0.94,
    orbit: 10.1,
    speed: 0.08,
    phase: 3.1,
    tilt: 0.18,
    height: 0.35,
  },
  {
    id: "unknown",
    name: "Planet Unknown",
    transmission: "The inhabitants have requested privacy.",
    detail: "Its coordinates appear to change whenever someone tries to investigate.",
    encore: "You looked again. The coordinates moved, out of politeness.",
    color: 0x3f9a68,
    emissive: 0x123322,
    radius: 0.9,
    orbit: 12.6,
    speed: 0.05,
    phase: 4.6,
    tilt: 0.22,
    height: -0.4,
  },
];

export const earthTransmission = "Please hold. Your species is currently looking at its phone.";

export const signalTransmission = "Wrong number. This is a lighthouse.";

export function planetById(id: PlanetId) {
  const planet = planets.find((item) => item.id === id);
  if (!planet) throw new Error(`Unknown planet: ${id}`);
  return planet;
}
