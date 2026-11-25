import type { Choice, Effect, NarrativeNode } from "../types.ts";

export function scene(
  id: string,
  chapter: string,
  body: string[],
  choices: Choice[] = [],
  extra: Partial<NarrativeNode> = {},
): NarrativeNode {
  return { id, chapter, body, choices, ...extra };
}

export function go(id: string, label: string, to: string, effects?: Effect[], when?: Choice["when"]): Choice {
  return { id, label, to, effects, when };
}

export const matter: Effect = { mark: "matters" };
export const changed: Effect = { mark: "changed" };
export const flag = (name: string, value = true): Effect => ({ flag: name, value });
export const trust = (name: string, add: number): Effect => ({ stat: name, add });
export const item = (name: string): Effect => ({ item: name });
