import type { ChapterInfo, CharacterInfo, EndingInfo } from "./types.ts";

/**
 * Story bible. This is the private spine of the narrative. The page never prints it.
 *
 * The Margin is not a place you visit. It is the thin overlap where a choice you
 * almost made leaves a residue called an Unsent. An Unsent cannot move objects or
 * people. It can only reach you at the minute you are about to repeat its regret,
 * and only through something you already own: your phone, your mug, your voice
 * on a machine.
 *
 * Obeying an Unsent perfectly spends the regret that kept it. The warning goes
 * quiet. That is not a death. It is a morning that no longer needs to apologize.
 * Ignoring it may make you the next Unsent, writing to a later version of your hands.
 *
 * Other people are not copies. Feeling leaks across anchors (the scarf, the mug,
 * the bus ticket, a list of unsent sentences). Facts do not, unless the person
 * is holding an anchor. Time does not loop. 7:13 stays only if you refuse to
 * leave the minute the message used. Step out of the room and the minute ends.
 *
 * A later playthrough may feel like recognition because an anchor remembers hands.
 * The protagonist does not automatically know what the visitor knows.
 */

export const chapters: ChapterInfo[] = [
  { id: "ordinary", title: "An Ordinary Morning", act: "The Ordinary" },
  { id: "street", title: "The Street You Know", act: "The Ordinary" },
  { id: "wrong", title: "A Wrong Kind of Familiar", act: "The Disturbance" },
  { id: "minute", title: "The Minute That Stayed", act: "The Disturbance" },
  { id: "rin", title: "What Rin Doesn't Say", act: "The Fracture" },
  { id: "scarf", title: "The Blue Scarf", act: "The Fracture" },
  { id: "ames", title: "A Place at the Table", act: "The Fracture" },
  { id: "drawer", title: "The Unsent Drawer", act: "The Truth" },
  { id: "memory", title: "Days You Didn't Live", act: "The Truth" },
  { id: "warning", title: "The Warning", act: "The Consequence" },
  { id: "owe", title: "What You Owe", act: "The Consequence" },
  { id: "another", title: "Another Morning", act: "The Consequence" },
];

export const characters: CharacterInfo[] = [
  { id: "sam", name: "Sam", summary: "Your neighbor. Bakery shift. Keeps a list of sentences they almost said." },
  { id: "rin", name: "Rin", summary: "An old friend on nights. Received a warning once and is still deciding what it cost." },
  { id: "marlow", name: "Marlow", summary: "Rides the early bus because a blue scarf remembers a morning they didn't finish." },
  { id: "ames", name: "Ames", summary: "Family. Sets a place for you whether or not you have explained yourself." },
  { id: "jo", name: "Jo", summary: "Night clerk at the pharmacy. Files what people leave behind. Not a mystic. A witness." },
];

export const endings: EndingInfo[] = [
  { id: "ending-usual", title: "The Usual Route" },
  { id: "ending-sent", title: "The Sent Folder" },
  { id: "ending-late", title: "Late, On Purpose" },
  { id: "ending-scarf", title: "Give the Scarf Back" },
  { id: "ending-night", title: "Someone Else's Night" },
  { id: "ending-table", title: "A Place Was Set" },
  { id: "ending-minute", title: "Thirteen Past Seven" },
  { id: "ending-burned", title: "The Drawer, Emptied" },
  { id: "ending-again", title: "We've Met", hidden: true },
  { id: "ending-kept", title: "You Kept the Day" },
  { id: "ending-untrusted", title: "Sam Stops Waving" },
  { id: "ending-margin", title: "The Margin", hidden: true },
  { id: "ending-warning", title: "You Send It Anyway" },
  { id: "ending-chosen", title: "An Ordinary Life, Chosen" },
];
