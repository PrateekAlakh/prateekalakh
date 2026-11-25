import type { NarrativeNode } from "../types.ts";
import { flag, go, scene, trust } from "./dsl.ts";

const memory = (text: string) => ({ memory: text });

export const afternoon: NarrativeNode[] = [
  scene("af-cross", "minute", [
    "The day you meant to have is still here, which feels almost rude. At the crosswalk, someone with too many bags waits through a light that has already changed. You could help, or you could keep the ordinary pace you promised yourself.",
  ], [
    go("af-help-bags", "Take one bag to the corner.", "af-bags", [trust("empathy", 1), flag("helpedBags")]),
    go("af-walk-on", "Walk on. They have it.", "af-window"),
  ], { time: "Late morning", place: "The neighborhood" }),

  scene("af-bags", "minute", [
    "The bag is heavier than it looks, oranges and a carton that sloshes. They thank you without turning it into a conversation. At the corner they take the bag back and the light is green for both of you in different directions.",
  ], [go("af-bags-on", "Continue.", "af-window")], { effects: [memory("You carried a stranger's oranges as far as the corner.")] }),

  scene("af-window", "minute", [
    "A bookshop window has a novel with a cracked cup on the cover. You almost go in to tell someone about the coincidence, which would be a strange thing to do to a bookseller. You stand there long enough to watch your reflection decide against it.",
  ], [
    go("af-enter", "Go in anyway, and buy nothing symbolic.", "af-shop", [trust("curiosity", 1)]),
    go("af-skip-shop", "Leave the cup on the cover.", "af-bench"),
  ]),

  scene("af-shop", "minute", [
    "Inside, it smells like paper and a radiator. You ask for nothing. You read one paragraph of a book you will not buy, about a person missing a train on purpose. You put it back exactly where it was.",
  ], [go("af-shop-on", "Step back into the day.", "af-bench")], { effects: [memory("A paragraph about missing a train, which you did not buy.")] }),

  scene("af-bench", "minute", [
    "A bench under a plane tree is wet on one side. You sit on the dry side and eat something you packed without thinking, which is a kind of past self taking care of this one. A dog walks by and does not choose you. That's fine.",
  ], [go("af-bench-on", "Get up before the sitting becomes hiding.", "af-phone")]),

  scene("af-phone", "minute", [
    "Your phone is quiet. The message is still at the top if you want it. You don't open it. You check the time the way ordinary people do, and the time has moved, which is the whole miracle you needed for an hour.",
  ], [
    go("af-call-ames", "Call Ames just to say you're eating.", "af-ames-call", [trust("ames", 1)]),
    go("af-not-yet", "Save the call for when you know what to say.", "af-grocer"),
  ]),

  scene("af-ames-call", "minute", [
    "Ames answers on the second ring, busy and glad. You say you are on a bench and the day is proceeding. They say good. Neither of you mentions destiny. You hang up feeling slightly more real.",
  ], [go("af-ames-on", "Walk toward food you don't have.", "af-grocer")], { dialogue: [{ speaker: "Ames", line: "Eat the thing you packed. I'll see you if you want to be seen." }] }),

  scene("af-grocer", "minute", [
    "The grocer knows your face and not your plot. You buy milk because the carton at home is a guess. At the register a note in the tip jar says 'for the late shift' in handwriting nothing like yours. You add a coin.",
  ], [
    go("af-coin", "Leave the coin.", "af-rain", [trust("empathy", 1)]),
    go("af-no-coin", "You already helped a bag. That's enough arithmetic.", "af-rain"),
  ], { effects: [memory("A tip jar for a late shift you don't work, and a coin, or the decision not to.")] }),

  scene("af-rain", "minute", [
    "Rain starts in the polite way, a few dark coins on the pavement. You have no hood. The awning of the pharmacy is two doors down. Jo's door. You can be a customer or a person with a question.",
  ], [
    go("af-pharmacy", "Step under the awning.", "af-jo-day"),
    go("af-wet", "Stay in the rain. It's only water.", "af-home-walk", [trust("caution", 1)]),
  ]),

  scene("af-jo-day", "minute", [
    "Jo looks up like you are a regular, which you might be. You buy mints you don't need so the visit has a receipt. They don't mention a drawer. Daylight is not the hour for that.",
  ], [go("af-jo-on", "Thank them and go.", "af-home-walk")], { dialogue: [{ speaker: "Jo", line: "Mints. Sensible. Come back if the rain gets opinions." }] }),

  scene("af-home-walk", "minute", [
    "The walk back is the city doing its job: a bus you don't take, a horn that is not about you, a tree shaking off the first rain. You are still the person who woke up. That is not a small thing.",
  ], [go("af-home-on", "Let the afternoon keep going.", "af-horn")], { effects: [memory("Rain, mints or no mints, and the time kept moving.")] }),

  scene("af-horn", "minute", [
    "A horn sounds, ordinary, two blocks off. You flinch and then don't. The morning's horn was a message only because you were looking for one. This one is a person who wants a parking spot.",
  ], [go("af-horn-on", "Unclench.", "af-puddle")]),

  scene("af-puddle", "minute", [
    "A puddle holds a piece of the building across the street, upside down and more honest. You step around it. Leaving a reflection intact feels, absurdly, like manners.",
  ], [go("af-puddle-on", "Take the last block.", "af-door")], { effects: [memory("You stepped around a puddle so a building could keep its reflection.")] }),

  scene("af-door", "minute", [
    "Your door is where you left it. You don't go in yet. You stand with the milk and the day and the fact that lunch is a decision, not a destiny. Then you go in, because hunger is also a kind of truth.",
  ], [go("af-door-on", "Eat.", "min-ordinary")]),
];
