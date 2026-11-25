import type { NarrativeNode } from "../types.ts";
import { changed, flag, go, item, matter, scene, trust } from "./dsl.ts";

const clue = (id: string, title: string, detail: string) => ({ clue: { id, title, detail } });
const memory = (text: string) => ({ memory: text });
const person = (id: string, name: string, note: string) => ({ person: { id, name, note } });

export const mid: NarrativeNode[] = [
  scene("a-hello", "ames", [
    "Ames answers from a kitchen. You can hear a spoon, and a radio turned low, and the particular calm of someone who has already decided what dinner is.",
    "They don't ask if you are all right. They ask if you are coming. With Ames, that is the same question.",
  ], [
    go("a-yes", "Say you'll be there.", "a-yes", [flag("promisedAmes"), trust("ames", 2), matter]),
    go("a-maybe", "Say you might be late.", "a-maybe", [trust("ames", 1)]),
    go("a-truth", "Tell them the morning was wrong.", "a-truth", [flag("toldAmes"), trust("ames", 1), trust("curiosity", 1)]),
  ], { place: "Wherever you stopped", time: "12:20 PM", checkpoint: true, meet: "ames", dialogue: [{ speaker: "Ames", line: "I set you a place. You can move it. I'd rather you moved it than pretend I didn't." }] }),

  scene("a-yes", "ames", [
    "The promise settles somewhere in your chest, like a chair you had forgotten you owned. Ames lets out a breath, and the radio behind them gets a little louder, as if the room has relaxed too.",
  ], [go("a-yes-on", "Hang up gently.", "a-after")], { dialogue: [{ speaker: "Ames", line: "Seven. Don't bring a story if it isn't ready. Just bring yourself, if you can." }] }),

  scene("a-maybe", "ames", [
    "Ames goes quiet. You know that quiet. They are working out what you mean, and they would rather get it right than fill the silence.",
  ], [go("a-maybe-on", "Let them work it out.", "a-after")], { dialogue: [{ speaker: "Ames", line: "Late is a place I know. Missing is a different address. Text me which one you're at." }] }),

  scene("a-truth", "ames", [
    "You tell them about the text. Not all of it. Enough. Ames listens without the little laughs people use when they want a strange story to become a joke. When you stop, they do not rush in with advice.",
  ], [
    go("a-come", "Say you'll come anyway.", "a-after", [flag("promisedAmes"), trust("ames", 1)]),
    go("a-stay-out", "Say you need the evening to understand it.", "a-after", [flag("skippedDinner"), trust("ames", -1)]),
  ], { effects: [memory("Ames heard the strange part and did not laugh.")] }),

  scene("a-later", "ames", [
    "You don't pick up. The voicemail is twenty seconds of Ames trying not to sound like someone who has been checking the door.",
    "They say the place is set. They say the food can wait. They say your name once, carefully, the way you set a glass down when you don't want it to ring.",
  ], [
    go("a-call-back", "Call back.", "a-hello", [flag("answeredAmes"), trust("ames", 1)]),
    go("a-text-late", "Text that you'll try.", "a-after", [flag("hedgedAmes")]),
    go("a-silence", "Leave it.", "a-after", [flag("skippedDinner"), trust("ames", -1), matter]),
  ], { effects: [person("ames", "Ames", "Family. They set a place before they know if you deserve the evening.")] }),

  scene("a-after", "ames", [
    "The afternoon has edges again. You walk, because sitting still makes the phone feel heavier. On the way home you pass the pharmacy that stays open later than it needs to, out of stubbornness and a little kindness.",
    "In the window, a handwritten sign: UNCLAIMED NOTES. ASK JO.",
  ], [
    go("a-in", "Go in.", "d-bell", [flag("openedDrawer"), trust("curiosity", 1), matter]),
    go("a-pass", "Walk past.", "d-passed"),
  ]),

  scene("d-bell", "drawer", [
    "The bell over the door sounds tired. Jo looks up from a crossword and sees, immediately, that you are not here for medicine. It is a look they have practiced. There is nothing mystical about it.",
  ], [
    go("d-ask", "Ask about the notes.", "d-ask"),
    go("d-browse", "Pretend to browse and lose your nerve.", "d-browse"),
  ], { place: "The pharmacy", time: "4:10 PM", checkpoint: true, meet: "jo", effects: [person("jo", "Jo", "The night-leaning clerk. They keep a drawer of notes people meant to give someone and didn't.")] }),

  scene("d-ask", "drawer", [
    "Jo does not make a ceremony of it. They pull the drawer the way you pull a register. Inside are folded papers, a receipt with a heart drawn on it, a bus transfer, and an envelope with no name. The handwriting has the posture of yours.",
  ], [
    go("d-envelope", "Ask to see the envelope.", "d-envelope", [flag("readHand"), matter]),
    go("d-leave-drawer", "Thank them and don't touch it.", "d-thanks", [trust("caution", 1)]),
  ], { effects: [clue("c-drawer", "Jo's drawer", "Unclaimed notes. One envelope stands like your handwriting.")] }),

  scene("d-envelope", "drawer", [
    "Jo slides it across without opening it. The flap is unsealed. There is one line inside, and then your hand does not feel entirely reliable.",
  ], [
    go("d-read", "Read it.", "d-read", [flag("readHand")]),
    go("d-return", "Give it back unread.", "d-thanks", [trust("caution", 1)]),
  ], { dialogue: [{ speaker: "The envelope", line: "If you are reading this, you already chose a kinder bus. Don't come looking for the one who wrote it. They are spent." }] }),

  scene("d-read", "drawer", [
    "Spent. It is such an ordinary word. You spend money. You spend a morning. You do not like the idea that a version of you can be spent, like a coin put into a machine that gives warnings back.",
    "Jo is not watching you. They are watching the door, giving you the privacy of someone who has seen this look before and knows better than to comment on it.",
  ], [
    go("d-burn-ask", "Ask if anyone ever takes them home to destroy them.", "d-burn-talk", [trust("curiosity", 1)]),
    go("d-keep", "Ask to keep this one.", "d-keep", [item("envelope"), flag("keptEnvelope")]),
  ], { effects: [memory("A note in your handwriting said the writer was already spent.")] }),

  scene("d-burn-talk", "drawer", [
    "Jo shrugs. On them, a shrug is almost a whole answer.",
  ], [go("d-after-burn-talk", "Hold the envelope a moment longer.", "d-choice")], { dialogue: [{ speaker: "Jo", line: "Some people burn them in the alley because they think fire decides something. The alley just gets warmer. The drawer fills back up on Thursdays." }] }),

  scene("d-keep", "drawer", [
    "Jo lets you take it. They do not write anything in a book. Some records, it seems, are only kept in a person's memory.",
  ], [go("d-kept-on", "Step back outside.", "d-choice")], { dialogue: [{ speaker: "Jo", line: "If it starts sounding like orders, it isn't wisdom. It's panic with good handwriting." }] }),

  scene("d-thanks", "drawer", [
    "You thank Jo. They go back to seven-across as if you had been a change in the weather. The envelope stays in the drawer. That feels safer. It also feels like you have left a debt there.",
  ], [go("d-thanks-on", "Leave.", "d-choice")]),

  scene("d-browse", "drawer", [
    "You hold a bottle of aspirin as if it might explain the day. It does not. Jo does not rescue you from the awkwardness, and that seems fair.",
  ], [go("d-browse-on", "Put it back and go.", "d-choice", [flag("lostNerve")])]),

  scene("d-passed", "drawer", [
    "You walk past the pharmacy. The sign stays in the corner of your eye until the next block looks ordinary again. You tell yourself the notes are other people's love letters. You are not entirely convinced.",
  ], [go("d-passed-on", "Keep walking.", "d-choice")]),

  scene("d-choice", "drawer", [
    "Evening has a color now. You could go to Ames, or find Rin, or look for the person in the blue scarf, or go home to the cracked mug.",
    "Not all of them will still be waiting. The day has kept moving while you were being brave, or careful, or both.",
  ], [
    go("d-to-ames", "Go to Ames.", "am-door", [flag("wentToAmes")], { flag: "promisedAmes" }),
    go("d-to-ames-anyway", "Go to Ames even if you hesitated.", "am-door", [flag("wentToAmes"), trust("ames", 1)]),
    go("d-to-rin", "Find Rin.", "r-kiosk", [flag("soughtRin")], { any: [{ flag: "toldRin" }, { flag: "satWithRin" }, { item: "slip" }] }),
    go("d-to-scarf", "Look for the blue scarf.", "sc-stop", [flag("soughtMarlow")], { any: [{ flag: "talkedMarlow" }, { flag: "lookedOut" }, { flag: "waved" }] }),
    go("d-to-sam", "Stop by the bakery before it closes.", "sc-bakery", [flag("soughtSam")], { flag: "helpedSam" }),
    go("d-home", "Go home.", "mem-home"),
  ]),

  scene("am-door", "ames", [
    "Ames opens the door before you knock. They were listening for the particular sound of you. At the table there is a plate, a glass, and a fork set out with more hope than formality.",
    "Something in the room has been moved. A chair. You feel it the way you feel a word you almost have.",
  ], [
    go("am-sit", "Sit.", "am-sit", [trust("ames", 1)]),
    go("am-ask-chair", "Ask who else was here.", "am-chair", [trust("curiosity", 1), matter]),
  ], { place: "Ames's kitchen" }),

  scene("am-sit", "ames", [
    "Dinner is simple, and because of that it feels serious. Ames talks about a neighbor's dog, a bill, and a dream they refuse to call a dream. You can stay in that ordinary conversation, or you can put the morning on the table between you.",
  ], [
    go("am-normal", "Be ordinary with them.", "am-ordinary", [flag("ordinaryDinner"), trust("ames", 2)]),
    go("am-spill", "Tell them all of it.", "am-spill", [flag("toldAmes"), trust("ames", 1)]),
  ]),

  scene("am-chair", "ames", [
    "Ames looks at the extra chair as if it has told on them.",
  ], [go("am-after-chair", "Sit anyway.", "am-spill")], { dialogue: [{ speaker: "Ames", line: "You, or someone using your knock. They wouldn't come in. They said if you arrived for real, I should feed you and not ask you to be less strange." }] }),

  scene("am-ordinary", "ames", [
    "You laugh in the right places. The morning stays in your pocket, a stone you have agreed not to take out at dinner. Ames relaxes a little at a time. At the door, they hold your sleeve.",
  ], [go("am-out", "Help with the dishes.", "am-dishes")], { dialogue: [{ speaker: "Ames", line: "Whatever it is, don't disappear just to prove you can. I'm not a test." }] }),

  scene("am-spill", "ames", [
    "You set the day down between the salt and whatever forgiveness the table can hold. Ames asks one question, not ten. Are you in danger from a person? You say you don't think so. They accept the shape of that answer, even if it does not comfort them.",
  ], [
    go("am-stay-night", "Stay until the dishes are done.", "mem-full", [flag("stayedAmes"), trust("ames", 2), matter]),
    go("am-go-seek", "Leave to find the rest of the answer.", "r-kiosk", [flag("leftAmes"), trust("ames", -1)]),
  ], { effects: [memory("Ames fed you after hearing that the morning had a crack in it.")] }),

  scene("r-kiosk", "rin", [
    "Rin's kiosk is a lit box in a station that smells like metal and oranges. They see you and do not pretend to be surprised. A night shift teaches a face to save itself.",
  ], [
    go("r-ask-cost", "Ask what the usual route cost them.", "r-cost", [trust("rin", 1), matter]),
    go("r-ask-help", "Ask them to come with you.", "r-with", [flag("askedRinAlong")]),
    go("r-small", "Buy gum and talk about anything else.", "r-small", [trust("rin", 1)]),
  ], { place: "Rin's kiosk", time: "6:40 PM", checkpoint: true }),

  scene("r-cost", "rin", [
    "Rin sells a ticket to a stranger without looking away from you for long. When the stranger leaves, the truth comes out quietly, the way you say a price you wish were lower.",
  ], [go("r-after-cost", "Listen to the end.", "r-end-cost")], {
    dialogue: [{ speaker: "Rin", line: "I took the bus. There was a kid who needed a louder adult. I was in my head, arguing with a text. I heard about the kid later, from a driver who said I looked familiar and useless." }],
    effects: [clue("c-kid", "The kid on the bus", "Rin believes a usual morning made them miss a child who needed a voice.")],
  }),

  scene("r-end-cost", "rin", [
    "Rin shrugs, and then looks angry at themselves for shrugging.",
  ], [
    go("r-night", "Ask to walk their old route with them after the shift.", "r-walk", [flag("followedRin"), trust("rin", 2), matter]),
    go("r-absolve", "Tell them one miss does not own them.", "r-absolve", [trust("rin", 1), trust("empathy", 1)]),
  ], { dialogue: [{ speaker: "Rin", line: "Don't make me noble. Make the next choice less asleep." }] }),

  scene("r-with", "rin", [
    "Rin looks at the clock, at the shutter, at you.",
  ], [go("r-with-on", "Wait out the last half hour.", "r-walk", [flag("followedRin")])], { dialogue: [{ speaker: "Rin", line: "I can close in thirty. If this is a haunting, it can sit on the cooler." }] }),

  scene("r-small", "rin", [
    "You talk about a film neither of you finished, and a dog in the station that belongs to nobody and everybody. Rin's shoulders drop. Not everything tonight has to open a door.",
  ], [go("r-small-on", "Leave them the rest of the shift.", "sc-choice")], { effects: [memory("You and Rin talked about a film and a station dog, and the world stayed big enough.")] }),

  scene("r-absolve", "rin", [
    "Rin hears you. They do not agree out loud. Agreeing would sound like permission to forget the kid, and they are not ready to be that free.",
  ], [go("r-absolve-on", "Let the shift finish in peace.", "sc-choice")], { dialogue: [{ speaker: "Rin", line: "Come by tomorrow if you're still you." }] }),

  scene("r-walk", "rin", [
    "After the shutter comes down, Rin walks you to the stop they mean. The route is so ordinary it almost feels rude. Somewhere a driver is ending a shift. No child is in danger now. The past does not put on a show for you.",
    "Rin looks both disappointed and relieved.",
  ], [
    go("r-stay-out", "Stay with them until they can laugh.", "r-laugh", [trust("rin", 1), trust("empathy", 1)]),
    go("r-learn", "Ask how the message finds a phone.", "r-how", [trust("curiosity", 1)]),
  ]),

  scene("r-laugh", "rin", [
    "It takes an hour, and a bad cup of tea from a machine. Rin laughs at the machine, not at the day. You laugh too, because a speech would be worse.",
  ], [go("r-laugh-on", "Walk them toward home.", "sc-choice")], { effects: [memory("Rin laughed at a tea machine, which meant the night had given something back.")] }),

  scene("r-how", "rin", [
    "Rin does not have a diagram. They have something closer to a habit.",
  ], [go("r-how-on", "Carry that with you.", "sc-choice", [changed])], {
    dialogue: [{ speaker: "Rin", line: "It uses what you already own. A phone. A mug. A scarf. A list. It can't knock. It can only be there when your hand arrives." }],
    effects: [clue("c-rule", "What Rin believes", "The warning can only move through things you already touch. It cannot knock on its own.")],
  }),

  scene("sc-stop", "scarf", [
    "The stop is mostly empty. The blue scarf is on the bench, folded, not dropped. A folded scarf is a message. A dropped one is only an accident.",
    "Marlow is across the road, watching to see whether you will treat the scarf as litter or as a hand left out for you.",
  ], [
    go("sc-pick", "Pick it up and wait.", "sc-wait", [item("scarf"), flag("tookScarf"), matter]),
    go("sc-call", "Call their name.", "sc-name"),
    go("sc-leave-scarf", "Leave it. People lose things.", "sc-left", [flag("leftScarf")]),
  ], { place: "The early stop", checkpoint: true }),

  scene("sc-wait", "scarf", [
    "Marlow crosses without hurrying. They do not snatch the scarf. They let you hold it long enough to feel the mend: careful stitches, done by someone who expected to wear it again.",
  ], [
    go("sc-return", "Give it back.", "sc-return", [flag("returnedScarf"), trust("empathy", 1)]),
    go("sc-keep", "Ask to keep it until morning.", "sc-keep", [flag("keptScarf"), trust("empathy", -1)]),
  ]),

  scene("sc-name", "scarf", [
    "Marlow comes over because their name still works. They look tired in an ordinary, human way.",
  ], [go("sc-name-on", "Give them the evening back.", "sc-talk")], { dialogue: [{ speaker: "Marlow", line: "You don't have to make this a reunion. Some of us are just checking the stop." }] }),

  scene("sc-talk", "scarf", [
    "You talk a little. The buses get rarer. Marlow says they ride early because late mornings are when they turn into the sort of person who misses things. You understand more than you say.",
  ], [go("sc-talk-on", "Wish them a quiet night.", "sc-choice")], { effects: [memory("Marlow rides early so they will not become careless.")] }),

  scene("sc-return", "scarf", [
    "Marlow takes the scarf, and for a second their face opens. There is nothing mystical about it. It is only a person getting their own warmth back.",
  ], [go("sc-return-on", "Let them go.", "sc-choice", [changed])], { dialogue: [{ speaker: "Marlow", line: "If another you asks for this, tell them I already have a morning. They can keep theirs." }] }),

  scene("sc-keep", "scarf", [
    "Marlow lets you keep it, and the letting costs them. Without the color, they look smaller.",
  ], [go("sc-keep-on", "Regret it, and walk anyway.", "sc-choice")], {
    dialogue: [{ speaker: "Marlow", line: "Bring it back if it starts remembering the wrong hands." }],
    effects: [clue("c-hands", "Wrong hands", "Marlow thinks the scarf can remember who held it.")],
  }),

  scene("sc-left", "scarf", [
    "You leave the scarf on the bench. Marlow watches you choose the ordinary explanation. Then they pick it up themselves. Nobody is struck by lightning. Someone is just alone at a stop.",
  ], [go("sc-left-on", "Go.", "sc-choice")], { effects: [memory("You left the scarf. Marlow picked up their own kindness.")] }),

  scene("sc-bakery", "scarf", [
    "The bakery gate is half down. Sam is sweeping flour into a line, like a tide mark. They see you, and the broom pauses. If you helped this morning, the pause becomes a smile. If you didn't, it is only a measurement.",
  ], [
    go("sc-apologize", "Speak first.", "sc-speak", [trust("sam", 1)]),
    go("sc-wait-sam", "Wait to see what they do.", "sc-sam-wait"),
  ], { place: "The bakery" }),

  scene("sc-speak", "scarf", [
    "You say you were strange today. It is a small true thing, and Sam seems grateful for the size of it. They lean on the broom.",
  ], [
    go("sc-ask-door", "Ask why your door was on their list.", "sc-door", [matter], { flag: "helpedSam" }),
    go("sc-no-list", "Don't mention the list.", "sc-kind", [trust("sam", 1)]),
    go("sc-use", "Use what you remember from another morning.", "sc-selfish", [flag("selfishEcho"), trust("sam", -2), matter], { echo: "sam" }),
  ]),

  scene("sc-sam-wait", "scarf", [
    "Sam speaks first if you helped them. If you didn't, they nod like a customer and return to the flour. Both are honest.",
  ], [go("sc-wait-on", "Meet them where they are.", "sc-kind")]),

  scene("sc-door", "scarf", [
    "Sam flushes. Not quite with shame. More like someone whose private habit has been opened in the light.",
  ], [go("sc-door-on", "Tell them they don't owe you the sentence.", "sc-kind", [trust("sam", 2), trust("empathy", 1)])], { dialogue: [{ speaker: "Sam", line: "I was going to ask if you wanted to walk to the shift together. Not a confession. A route. I keep not asking, so I wrote the door down until I could." }] }),

  scene("sc-kind", "scarf", [
    "You leave Sam with the broom and with the sentence they almost said. The street smells like sugar leaving a warm building. It is a good smell to walk away on.",
  ], [go("sc-kind-on", "Head onward.", "sc-choice")], { effects: [memory("Sam wanted a shared walk, not a grand gesture.")] }),

  scene("sc-selfish", "scarf", [
    "You mention a detail from a morning Sam did not live with you. The underline. The cinnamon roll. The exact shy wording. Sam steps back. The broom handle knocks the counter.",
  ], [go("sc-self-on", "Hear what that cost.", "end-untrusted")], {
    dialogue: [{ speaker: "Sam", line: "That's mine. If you know it, you went somewhere I didn't invite you. Don't come back for the good morning. I've spent it." }],
    effects: [memory("You used another morning against Sam. They felt it as theft.")],
  }),

  scene("sc-choice", "scarf", [
    "The night is far enough along to feel like weather. Home is one direction. So is the mug, the thread, and the minute you could still try to walk back into.",
  ], [
    go("sc-home", "Go home.", "mem-home"),
    go("sc-minute", "Try to find 7:13 again.", "mem-minute", [flag("chasedMinute")], { flag: "stayedMinute" }),
    go("sc-write", "Open the thread and keep writing.", "mem-write", [flag("keptWriting")], { flag: "replied" }),
  ]),
];
