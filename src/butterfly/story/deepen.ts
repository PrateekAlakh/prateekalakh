import type { NarrativeNode } from "../types.ts";
import { go, scene, trust } from "./dsl.ts";

const memory = (text: string) => ({ memory: text });

export const deepen: NarrativeNode[] = [
  scene("s-aisle", "street", [
    "The aisle is narrow. A student sleeps against the glass. A nurse in clean shoes checks a watch, then decides not to look again. You take a seat that is not your usual one. It feels like a very small rebellion.",
  ], [go("s-aisle-on", "Watch the city instead of your hands.", "s-glass")]),

  scene("s-glass", "street", [
    "In the glass you are slightly see-through, a laundromat showing through your cheek. For three stops you practice being the person who would stand if someone needed the seat. Nobody does. You keep the practice anyway.",
  ], [go("s-glass-on", "Keep the seat.", "s-pair")], { effects: [memory("You practiced giving up a seat before anyone asked.")] }),

  scene("s-pair", "street", [
    "Two people share a pair of earbuds and an argument they are not having out loud. One of them looks ready to cry, and then laughs instead. You look away at the right moment. The morning has been asking you, again and again, to leave other people their privacy.",
  ], [go("s-pair-on", "Give them the row.", "s-announcement")]),

  scene("s-announcement", "street", [
    "The announcement mangles the next stop into a word you almost recognize. A child corrects it under their breath, delighted to be right. The adult with them says thank you like the child has saved a navigation, not a pronunciation.",
  ], [go("s-ann-on", "Smile at nobody.", "bd-1")], { effects: [memory("A child corrected a stop name, and an adult thanked them for real.")] }),

  scene("am-dishes", "ames", [
    "The plates are heavy in the good way. Ames washes, you dry, and the radio has given up on being interesting. This is the part of love that does not photograph.",
  ], [go("am-dish-1", "Ask about their week, not yours.", "am-week", [trust("ames", 1)])]),

  scene("am-week", "ames", [
    "Ames tells you about a coworker who apologizes to the printer and a plant they are keeping alive out of spite. You laugh. The laugh is not a distraction from the mystery. It is evidence that you still fit in a room.",
  ], [go("am-week-on", "Tell them one true small thing.", "am-small")]),

  scene("am-small", "ames", [
    "You say the mug cracked and you don't know when. Ames nods, as if objects are allowed to change their minds. They don't build a theory. They hand you a glass to put away.",
  ], [go("am-small-on", "Put the glass where it lives.", "am-doorway")], { effects: [memory("Ames let the cracked mug be a mug.")] }),

  scene("am-doorway", "ames", [
    "At the door the night is cool and unsymbolic. Ames holds the frame, not you. They are learning not to clutch.",
  ], [
    go("am-hug", "Hug them.", "am-hug", [trust("ames", 1), trust("empathy", 1)]),
    go("am-wave", "Say you'll text, and go.", "end-table"),
  ], { dialogue: [{ speaker: "Ames", line: "If tomorrow is weird, you can say that too. Weird is allowed in this kitchen." }] }),

  scene("am-hug", "ames", [
    "The hug is brief and accurate. You feel the day decrease by one fear. Not the whole fear. The fear of being only a problem.",
  ], [go("am-hug-on", "Walk home lighter.", "end-table")], { effects: [memory("Ames hugged you like a person, not a crisis.")] }),

  scene("bd-1", "street", [
    "Between stops, you count exits the way cautious people do, and then you stop counting, because a life spent only on exits is the usual route in a different coat.",
  ], [go("bd-1-on", "Look up.", "bd-2")]),

  scene("bd-2", "street", [
    "A poster for a play you will not see has a face painted gold. Someone has drawn glasses on it in pencil, gently, not as vandalism. The city edits itself in small handwriting. You recognize the impulse.",
  ], [go("bd-2-on", "Let it pass.", "bd-3")], { effects: [memory("Someone had drawn glasses, gently, on a golden face.")] }),

  scene("bd-3", "street", [
    "Your stop is soon. The bell cord is a red line of possible futures, which is a melodramatic way to see a bus. You forgive yourself for the thought. It has been a long morning.",
  ], [go("bd-3-on", "Wait for your moment.", "s-sit")]),
];
