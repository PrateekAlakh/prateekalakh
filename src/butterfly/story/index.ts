import { chapters, characters, endings } from "../bible.ts";
import type { Story } from "../types.ts";
import { afternoon } from "./afternoon.ts";
import { deepen } from "./deepen.ts";
import { early } from "./early.ts";
import { late } from "./late.ts";
import { mid } from "./mid.ts";
import { rooms } from "./rooms.ts";

export const story: Story = {
  chapters,
  characters,
  endings,
  start: "m-wake",
  nodes: [...early, ...mid, ...late, ...rooms, ...deepen, ...afternoon],
};
