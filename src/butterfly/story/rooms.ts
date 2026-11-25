import type { NarrativeNode } from "../types.ts";
import { flag, go, matter, scene, trust } from "./dsl.ts";

const memory = (text: string) => ({ memory: text });

export const rooms: NarrativeNode[] = [
  scene("rm-stair", "memory", [
    "The stairwell smells like other people's dinners. A radio leaks from 3B, a song you almost know. You could knock and borrow an ordinary conversation, or you could let the song belong to whoever is playing it.",
  ], [
    go("rm-knock", "Knock.", "rm-radio", [trust("empathy", 1)]),
    go("rm-pass-radio", "Pass it.", "rm-mail"),
  ], { place: "Your building" }),

  scene("rm-radio", "memory", [
    "The neighbor opens the door with the chain on. They don't know you well. They do know you are usually quieter than this. You don't ask about the time. You ask if the song has a name. They tell you. The name is ordinary, and that helps.",
  ], [go("rm-radio-on", "Thank them.", "rm-mail")], { effects: [memory("A neighbor named a song, and the building became less theoretical.")] }),

  scene("rm-mail", "memory", [
    "Your mail slot holds a menu and a bill. Under them, a torn transfer with no pencil left on it. Blank, this time. You can decide the blank is a mercy.",
  ], [
    go("rm-keep-blank", "Keep the blank ticket.", "rm-laundry", [flag("blankTicket")]),
    go("rm-bin", "Throw it away.", "rm-laundry", [trust("caution", 1)]),
  ]),

  scene("rm-laundry", "memory", [
    "The laundry room is warm from a dryer someone else started. A mug sits on the folding table. It is not yours, but the crack in it is a close cousin of yours. You don't touch it. Some resemblances are none of your business.",
  ], [go("rm-laundry-on", "Leave it.", "rm-bike")], { effects: [memory("A mug in the laundry room was cracked almost like yours, and you left it alone.")] }),

  scene("rm-bike", "memory", [
    "The bike room is full of good intentions. Yours is dusty. Sam's, if it is Sam's, has a bakery tote hooked on the handle. There was a footprint of flour near their door upstairs. You saw it on the way down and pretended it was only dirt.",
  ], [
    go("rm-up-sam", "Go back up and stand at Sam's door.", "rm-sam-door"),
    go("rm-roof", "Try the roof door instead.", "rm-roof-door"),
  ]),

  scene("rm-sam-door", "memory", [
    "Sam's door has a scuff at kicking height. No light under it. You could knock and turn their night into your question, or you could leave them the rest of the evening.",
  ], [
    go("rm-knock-sam", "Knock once.", "rm-sam-knock", [trust("sam", 1)]),
    go("rm-note", "Slide nothing under the door. Leave.", "rm-roof-door"),
  ]),

  scene("rm-sam-knock", "memory", [
    "No answer. Then a shift of weight, a person deciding. Sam opens the door the width of a face. They are not unkind. They are off duty from being a symbol.",
  ], [go("rm-sam-goodnight", "Say goodnight and mean only that.", "rm-roof-door", [trust("empathy", 1)])], { dialogue: [{ speaker: "Sam", line: "If this is about the morning, it can wait until there is bread. If it's goodnight, then goodnight." }] }),

  scene("rm-roof-door", "memory", [
    "The roof door sticks, then gives, because the building is old and not invested in your symbolism. Wind. A city of windows, a few of them still negotiating with sleep.",
  ], [
    go("rm-stay-roof", "Stay until you are cold.", "rm-cold"),
    go("rm-down", "Go down. You've seen the size of it.", "rm-more-1"),
  ]),

  scene("rm-cold", "memory", [
    "The cold does what advice can't. It returns you to a body. Whatever is texting you does not have ears up here. You do.",
  ], [go("rm-cold-down", "Go inside.", "rm-elevator")], { effects: [memory("On the roof, the cold made the mystery smaller than your hands.")] }),

  scene("rm-elevator", "memory", [
    "The elevator opens on your floor and, for a blink, on the feeling of a floor you don't live on: yellow light, a laugh, Ames's voice. Then the doors are just doors. You step out on the correct number.",
  ], [go("rm-correct", "Walk to your own door.", "rm-keys")], { effects: [memory("The elevator offered one second of a kitchen you have not lived in.")] }),

  scene("rm-keys", "memory", [
    "Your keys are loud. Inside, the shoes by the mat are both yours, which you confirm like a person checking a lock twice. One of them is turned out, the way you kick them when you are late to be kind.",
  ], [
    go("rm-straighten", "Straighten them.", "rm-water", [trust("caution", 1)]),
    go("rm-leave-shoes", "Leave the evidence of hurry.", "rm-water"),
  ]),

  scene("rm-water", "memory", [
    "You drink water standing up. The thread can wait. Ames can wait until morning if you promised badly. Rin sends a photo of the station dog, no caption, which is a kind of faith.",
  ], [
    go("rm-reply-dog", "Reply with something petty and alive.", "rm-reply", [trust("rin", 1)]),
    go("rm-no-reply", "Look at the dog and don't perform.", "rm-alarm"),
  ], { effects: [memory("Rin sent a dog instead of a theory.")] }),

  scene("rm-reply", "memory", [
    "You type that the dog is management and you are not. Rin sends back a single period, which from them is laughter. The night loosens.",
  ], [go("rm-reply-on", "Put the phone face-down.", "rm-alarm")]),

  scene("rm-alarm", "memory", [
    "You set an alarm. The cruel joke would be 7:13. The living choice is a time that belongs to bread or a bus you mean to miss on purpose.",
  ], [
    go("rm-713", "Set it for 7:13, as a test.", "rm-dare", [flag("daredClock")]),
    go("rm-730", "Set it for a human time.", "rm-human", [flag("keptDay"), trust("caution", 1)]),
  ]),

  scene("rm-dare", "memory", [
    "The number looks smaller in the alarm app than it did in the message. You are poking a bruise to see if it is still yours. That is allowed. It is not required.",
  ], [
    go("rm-dare-keep", "Leave the dare.", "rm-lights", [matter]),
    go("rm-dare-change", "Change it. You don't owe the minute a rematch.", "rm-human"),
  ]),

  scene("rm-human", "memory", [
    "A human time. You feel slightly foolish and much more located. The mug can stay in the sink until daylight, when cracks are easier to measure.",
  ], [go("rm-human-on", "Turn the lights off.", "rm-lights")]),

  scene("rm-lights", "memory", [
    "The building settles. Pipes tick. Somewhere 3B's radio has become a murmur. You are not resolved. You are housed. That is a better place to choose from than a stuck digit.",
  ], [
    go("rm-to-sleep", "Sleep.", "ow-sleep"),
    go("rm-to-thread", "One last look at the thread.", "rm-thread-once"),
  ]),

  scene("rm-thread-once", "memory", [
    "The thread is still there, timestamped from a day that has not happened. You read it once, standing, and do not answer. The building has already given you a better reply: a floor, a song, a human alarm.",
  ], [go("rm-thread-sleep", "Put the phone down.", "ow-sleep")]),

  scene("rm-more-1", "memory", [
    "On the landing below yours, a child's drawing is taped to a door: a sun with too many rays. You think of warnings that try to be kind and become noise. You hope yours, if you send any, will be fewer rays.",
  ], [go("rm-more-1-on", "Continue down.", "rm-more-2")]),

  scene("rm-more-2", "memory", [
    "The ground-floor light is the green of an exit sign. You stand in it and practice leaving. The door opens onto the tree from the long way, small at this hour, doing its job without a witness. You witness it anyway.",
  ], [go("rm-more-2-on", "Go back up.", "rm-elevator")], { effects: [memory("You looked at the tree on purpose, with no instruction.")] }),
];
