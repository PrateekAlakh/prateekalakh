import type { NarrativeNode } from "../types.ts";
import { changed, flag, go, matter, scene, trust } from "./dsl.ts";

const memory = (text: string) => ({ memory: text });
const clue = (id: string, title: string, detail: string) => ({ clue: { id, title, detail } });

export const late: NarrativeNode[] = [
  scene("mem-home", "memory", [
    "Home still smells like the toast you left behind. The mug is in the sink. The crack has moved. This morning it ran toward the handle. Now it runs away from it, as if the damage changed its mind while you were out.",
    "The phone is on the table, dark, waiting to be picked up.",
  ], [
    go("mem-mug", "Pick up the mug.", "mem-mug", [matter]),
    go("mem-phone", "Open the thread.", "mem-thread-home"),
    go("mem-bed", "Leave both and wash your face.", "mem-wash"),
  ], { place: "Home", time: "9:05 PM", checkpoint: true, effects: [clue("c-crack", "The moving crack", "The crack in the mug is not where you left it.")] }),

  scene("mem-full", "memory", [
    "You come home fed, and that changes how much courage you have left. The apartment is the same size. You are a little less willing to turn it into a theory.",
    "The mug and the phone are still here, patient in the way objects are.",
  ], [
    go("mem-full-mug", "Look at the mug.", "mem-mug"),
    go("mem-full-phone", "Check the thread once.", "mem-thread-home"),
    go("mem-full-sleep", "Choose bed without a postscript.", "ow-sleep", [flag("keptDay")]),
  ], { place: "Home", checkpoint: true }),

  scene("mem-mug", "memory", [
    "The ceramic is warm. It should not be. Nobody has been here. You hold it in both hands, carefully, the way you hold something that might startle.",
    "For a second you remember dropping it in a kitchen with yellow light. Ames saying your name. Sam laughing in the hall. You did not live that evening. Your hands remember the apology anyway.",
  ], [
    go("mem-keep-memory", "Let the memory finish.", "mem-yellow", [flag("rememberedWrong"), trust("curiosity", 1)]),
    go("mem-set-down", "Set it down.", "mem-set"),
  ], { effects: [memory("The mug was warm, and your hands remembered an apology from a kitchen you have not stood in.")] }),

  scene("mem-yellow", "memory", [
    "In the memory you are not heroic. You are late. You brought the cracked mug as a joke, and Ames looked relieved that you could still make one. Sam was in the doorway, not invited and not leaving, flour on one cheek, asking if anyone wanted the end of the bread.",
    "It is a good evening. It undoes you a little, because all it asks is that you might have had it.",
  ], [go("mem-yellow-on", "Come back to the sink.", "mem-set", [changed])]),

  scene("mem-set", "memory", [
    "The apartment comes back. The fridge hums, steady and ordinary. You can still decide what to do with a night that has shown you its seams.",
  ], [
    go("mem-set-bed", "Sleep. Let tomorrow be a person.", "ow-sleep", [flag("keptDay")]),
    go("mem-set-write", "Write back before you lose your nerve.", "mem-thread-home"),
    go("mem-set-out", "Go out again. You are not done.", "ow-out", [trust("curiosity", 1)]),
  ]),

  scene("mem-thread-home", "memory", [
    "The thread titled You is awake. It does not accuse you. It waits, the way a blank page waits, which is not the same as being kind.",
  ], [
    go("mem-type-warn", "Write the warning you woke up to.", "w-compose", [flag("sentWarning"), matter]),
    go("mem-type-no", "Write that you will not be used.", "w-refuse", [flag("refusedSend")]),
    go("mem-close-thread", "Close it.", "mem-wash"),
  ], { dialogue: [{ speaker: "Your number", line: "You can still put this in tomorrow's sent folder. Or you can let the folder stay a rumor." }] }),

  scene("mem-wash", "memory", [
    "Water. The mirror. A face that has had a long Tuesday, not a legend. You watch yourself blink, and this time the blink arrives when it should.",
    "You still want to know more. You also want to be a person Ames can call without having to rehearse it.",
  ], [
    go("mem-wash-bed", "Go to bed.", "ow-sleep", [flag("keptDay")]),
    go("mem-wash-out", "One more walk.", "ow-out"),
    go("mem-wash-rooms", "Walk the building before you decide.", "rm-stair"),
  ]),

  scene("mem-minute", "memory", [
    "You go back to the room where the clock refused to move. You sit on the edge of the bed with the phone in your palm, useless as a compass that only points at regret.",
    "You say the time out loud. It feels ridiculous. The numbers seem to listen anyway.",
  ], [
    go("mem-enter", "Ask the minute to open.", "end-minute-hall", [flag("reentered")]),
    go("mem-no-enter", "Laugh at yourself and stand up.", "ow-sleep", [flag("keptDay"), trust("caution", 1)]),
  ], { place: "Your room", time: "Trying for 7:13" }),

  scene("mem-write", "memory", [
    "You sit on the stairs, because the apartment feels too much like an answer. The thread is open. Your thumbs already know the sentence. They knew it before you did.",
  ], [
    go("mem-write-send", "Send the warning onward.", "w-compose", [flag("sentWarning"), matter]),
    go("mem-write-stop", "Delete the draft.", "w-refuse", [flag("refusedSend")]),
  ]),

  scene("w-compose", "warning", [
    "You type the sentence you woke up to. Your hands hesitate on the word usual. Usual was a bus. A nod. A way of letting Sam struggle with a box. A way of not looking up.",
    "If you send it, someone living your morning will be afraid at 7:13. They might also be spared.",
  ], [
    go("w-send", "Send it.", "w-sent", [flag("sentWarning"), matter]),
    go("w-hold", "Save the draft and don't spend yourself.", "w-draft", [flag("heldDraft")]),
  ], { place: "The thread", checkpoint: true, effects: [memory("You held the warning in your hands and felt what it costs to pass it on.")] }),

  scene("w-sent", "warning", [
    "The message leaves. For a moment the thread shows two bubbles with the same words, one tired and one new. Then the tired one is gone. You feel lighter, and worse, the way a pocket feels after you have spent the last coin in it.",
    "There is still a night to finish. Sending the warning was not the only life available to you.",
  ], [
    go("w-sent-home", "Stay home with what you did.", "ow-sent-night"),
    go("w-sent-people", "Go tell somebody living.", "ow-out"),
  ]),

  scene("w-draft", "warning", [
    "The draft stays unsent. That drawer is kinder than Jo's, because it is still yours. You have not been spent. You are not exactly clean, either.",
  ], [go("w-draft-on", "Stand up.", "ow-choice")]),

  scene("w-refuse", "warning", [
    "You write that you will not carry someone else's regret for them. The reply does not come at once. When it does, it is short enough to respect.",
  ], [go("w-refuse-on", "Read it once.", "ow-choice")], { dialogue: [{ speaker: "Your number", line: "Then keep the people. That was the other route." }] }),

  scene("ow-sleep", "owe", [
    "You sleep. The building makes its small noises: a pipe, a neighbor's radio turned down, the lift somewhere below you. In the morning you will either be ordinary, or you will be ordinary on purpose.",
    "Before you close your eyes, one thing is clear. Nobody in this apartment is asking you to be a myth.",
  ], [
    go("ow-sleep-usual", "Let the usual morning come.", "an-usual", [flag("usualMorning")]),
    go("ow-sleep-chosen", "Decide the day you want, on purpose.", "an-chosen", [flag("choseOrdinary")], { all: [{ flag: "readHand" }, { any: [{ flag: "helpedSam" }, { flag: "promisedAmes" }] }] }),
    go("ow-sleep-kept", "Trust the quiet. You already changed the route.", "an-kept", [flag("keptDay")], { flag: "otherRoute" }),
  ], { place: "Bed", checkpoint: true }),

  scene("ow-out", "owe", [
    "The street at this hour belongs to people finishing work and people just beginning to feel something. You can still decide where to aim yourself.",
  ], [
    go("ow-find-sam", "Find Sam, if the bakery light is on.", "ow-sam", [], { flag: "helpedSam" }),
    go("ow-find-rin", "Go back to the station.", "ow-rin", [], { flag: "followedRin" }),
    go("ow-find-marlow", "Walk the early stop anyway.", "ow-marlow"),
    go("ow-alley", "Stand by the pharmacy alley and think about fire.", "ow-alley", [], { flag: "readHand" }),
  ]),

  scene("w-from-night", "warning", [
    "You come in from the walked route with the sentence already assembled. The apartment looks unimpressed. You can still spend yourself on a text, or you can keep the knowledge in your own shoes.",
  ], [
    go("w-fn-send", "Send it.", "ow-sent-night", [flag("sentWarning"), matter]),
    go("w-fn-keep", "Keep it.", "an-warning-self"),
  ]),

  scene("ow-sent-night", "owe", [
    "You sit with the sent message like a guest who will not take off their shoes. The apartment does not congratulate you.",
    "Tomorrow, someone will wake at 7:13 and think they are losing their mind. You hope they also miss a bus that needed missing.",
  ], [
    go("ow-sent-end", "Accept that you are the sender now.", "end-sent"),
    go("ow-sent-live", "Try to be a person in the morning anyway.", "an-after-send"),
  ]),

  scene("ow-choice", "owe", [
    "The night offers the last small doors. None of them are labeled correctly. You choose with the information you actually have, which is less than the story wants and enough for a life.",
  ], [
    go("ow-ch-home", "Stay.", "ow-sleep"),
    go("ow-ch-out", "Go out.", "ow-out"),
    go("ow-ch-warn-walk", "Walk the usual route now, at night, so you know what you would be warning against.", "ow-night-route", [flag("walkedUsual"), matter]),
    go("ow-ch-margin", "Stand in the overlap of the mornings you already lived.", "end-margin-gate", [matter], { endingsAtLeast: 3 }),
  ]),

  scene("ow-sam", "owe", [
    "The bakery light is a thin gold. Sam is locking up. They see you and do not perform the morning. Night Sam is softer and more direct.",
  ], [
    go("ow-sam-walk", "Ask for the walk they almost offered.", "ow-sam-yes", [trust("sam", 2), trust("empathy", 1), matter]),
    go("ow-sam-thanks", "Thank them for the morning and go.", "an-late"),
  ], { dialogue: [{ speaker: "Sam", line: "If you're here to be mysterious, the ovens are off. If you're here to walk, I have exactly one shoe that doesn't hurt." }] }),

  scene("ow-sam-yes", "owe", [
    "You walk without a destination, which is a destination. Sam tells you the bakery is loud and the street after is the quiet they save. You tell them as much of the day as fits in a block. They believe the feeling, if not the physics.",
  ], [go("ow-sam-end", "Let the walk be the ending of the fright.", "an-late")], { effects: [memory("You and Sam walked after close, and the day became smaller than your fear.")] }),

  scene("ow-rin", "owe", [
    "Rin is on the steps behind the station, coat half zipped, looking at nothing in a skilled way. They make room without comment.",
  ], [
    go("ow-rin-stay", "Sit until the trains thin out.", "ow-rin-night", [trust("rin", 1)]),
    go("ow-rin-route", "Ask to hear the rest of their route.", "ow-rin-rest", [matter]),
  ]),

  scene("ow-rin-night", "owe", [
    "You sit. A train leaves like a decision nobody in your story has to make. Rin passes you the rest of a terrible tea. It is, humiliatingly, comforting.",
  ], [go("ow-rin-night-on", "Stay until they can stand.", "end-night")], { effects: [memory("You stayed with Rin through the thin part of the night.")] }),

  scene("ow-rin-rest", "owe", [
    "Rin walks you past the place the driver mentioned, which is only a curb and a vending machine. They put a hand on the machine like a headstone and then take it off, embarrassed by their own symbol.",
  ], [go("ow-rin-rest-on", "Walk them home.", "end-night")], { dialogue: [{ speaker: "Rin", line: "If you ever get a text that sounds like me being brave, check. I'm not always. Sometimes I'm just sorry." }] }),

  scene("ow-marlow", "owe", [
    "The stop is empty and then it isn't. Marlow is there because of course the night bus is a kind of church for people who missed a morning. They see the shape of your day on your face.",
  ], [
    go("ow-marlow-return", "Give back whatever you took, including the story.", "ow-give", [flag("returnedScarf")]),
    go("ow-marlow-again", "We've met before, haven't we?", "ow-again", [matter], { echo: "marlow" }),
    go("ow-marlow-sit", "Sit without a speech.", "ow-sit"),
  ]),

  scene("ow-give", "owe", [
    "If you have the scarf, you return it. If you don't, you return the right to keep asking them for a map. Marlow looks grateful and tired, which is the human version of a blessing.",
  ], [go("ow-give-on", "Leave them their stop.", "end-scarf")]),

  scene("ow-again", "owe", [
    "Marlow's eyes shine in the cheap light, not with magic. With the relief of being believed by the right accident.",
  ], [go("ow-again-on", "Let both of you be real.", "end-again")], { dialogue: [{ speaker: "Marlow", line: "Then don't merge us. Take the morning you can actually live in. I'll take the one that taught me to look up." }] }),

  scene("ow-sit", "owe", [
    "You sit until the bus comes and neither of you gets on. That, too, is a route.",
  ], [go("ow-sit-on", "Stand when it's time.", "an-kept-night")]),

  scene("ow-alley", "owe", [
    "The alley behind the pharmacy smells like cardboard and rain. Jo's drawer is not here. The idea of it is. You could try to end the warnings by destroying a piece of paper you already read. Fire is a loud way to say no.",
  ], [
    go("ow-burn", "Burn the envelope, if you kept it. Or the wish of it.", "ow-burned", [flag("burned"), matter], { flag: "readHand" }),
    go("ow-no-burn", "Leave the alley. Fire is not a personality.", "ow-sleep", [trust("caution", 1)]),
  ]),

  scene("ow-burned", "owe", [
    "The paper curls. The sentence about being spent becomes a brown lace and then nothing. The alley is warmer by a degree nobody will record. You do not feel holy. You feel like a person who has taken a tool away from a frightened hand, including, perhaps, your own.",
  ], [go("ow-burned-on", "Walk until your coat smells like night again.", "end-burned")], { effects: [memory("You burned a sentence that said its writer was already spent.")] }),

  scene("ow-night-route", "owe", [
    "You walk the usual route in the wrong direction of the clock. The stop, the cafe dark, the pavement crack, the place the driver looks when they are deciding whether you are a regular. Nothing jumps out. The danger was never a villain. It was absence. A seat you didn't give up. A box you didn't catch. A window you didn't open.",
  ], [
    go("ow-night-send", "Go home and send the warning anyway.", "w-from-night"),
    go("ow-night-keep", "Keep this understanding and don't outsource it.", "an-warning-self", [flag("walkedUsual"), matter]),
  ], { effects: [memory("The usual route at night was only a series of places where you might fail to show up.")] }),

  scene("an-usual", "another", [
    "Morning. 7:14, mercifully. The phone is an ordinary tyrant. You turn it over because you are a person who has learned nothing, or because you are a person who wants one ordinary confirmation.",
    "The message is not in the inbox.",
  ], [go("an-usual-sent", "Look in the sent folder.", "end-usual")], { time: "The next morning", place: "Your room" }),

  scene("an-chosen", "another", [
    "You make the morning on purpose. Long way or not, you lock the door once. You think of Sam's sleeve and Ames's plate and Rin's terrible tea. You will be late to something theoretical. You will be on time to a person.",
    "The phone stays quiet. You check once, because you are not a saint.",
  ], [go("an-chosen-on", "Leave it quiet.", "end-chosen")], { effects: [memory("You chose an ordinary day with the extraordinary still in the room.")] }),

  scene("an-kept", "another", [
    "You took a different route, and the world did not throw a parade. That is the proof. The day you kept is full of small unremarkable mercies: a bus you were not on, a corner you did not need, a friend who will text you something petty and alive.",
  ], [go("an-kept-on", "Step into it.", "end-kept")]),

  scene("an-late", "another", [
    "You are late to the idea of yourself as someone who solves a cosmology before breakfast. Sam is not a reward. Sam is a person walking beside the consequence of a box you caught, or a walk you finally asked for.",
  ], [go("an-late-on", "Let that be enough.", "end-late")]),

  scene("an-after-send", "another", [
    "You sent it, and you are still here, which the note in the drawer said might not happen. Jo was right about panic. Rin was right about cost. You brush your teeth like a person who intends to have a mouth tomorrow.",
  ], [go("an-after-on", "Sleep, then wake as the sender.", "end-sent")]),

  scene("an-kept-night", "another", [
    "The night bus comes and goes. You and the stop survive each other. In the morning the long way will still be there, unimpressive and yours.",
  ], [go("an-kept-night-on", "Go home.", "end-kept")]),

  scene("an-warning-self", "another", [
    "You could have sent the fear forward. You keep it instead, which means you will have to be the one who looks up, catches the box, answers Ames, leaves the room when a minute sticks. Nobody else will do it under your name.",
  ], [go("an-warn-on", "Accept the job.", "end-warning")], { effects: [memory("You kept the warning instead of mailing it to a later pair of hands.")] }),

  scene("end-minute-hall", "another", [
    "The minute opens like a door that was never locked, only polite. You see the room from several mornings at once: you dismissing the phone, you at the window, you already gone. None of the yous can hear you. You can study them. You cannot pass a glass of water through.",
    "It is knowledge without a hand. It will not hold anyone.",
  ], [go("end-minute-go", "Stay, because leaving would waste the view.", "end-minute")], { effects: [memory("You stood where several mornings overlapped, and could not touch any of them.")] }),

  scene("end-usual", "another", [
    "In the sent folder, timestamped 7:13 tomorrow, is the sentence you woke up to. You did not type it last night. You also did not stop a box, or sit with a friend, or look twice at a blue scarf. The day was survivable. That is not nothing. It is also how the message learned the shape of your hands.",
    "You can delete it. It will be back on a morning you have not lived yet, wearing your number, trying to be kinder than you were.",
  ], [], { ending: "ending-usual", reflections: [
    { text: "You dismissed the first message, and the day agreed to look normal.", when: { flag: "dismissed" } },
    { text: "Sam carried the box alone.", when: { flag: "ignoredSam" } },
  ] }),

  scene("end-sent", "another", [
    "You are the person in the sent folder now. Somewhere, a version of you who has not yet burned the toast is about to be afraid, and safer, and annoyed that nobody explained anything. You do not get to watch them miss the bus. You only get to be the reason the warning exists.",
    "It is a lonely kindness. It still counts.",
  ], [], { ending: "ending-sent", reflections: [{ text: "You answered yourself, and then you became the answer.", when: { flag: "replied" } }] }),

  scene("end-late", "another", [
    "Nothing extraordinary happens. You are late, a little flour on your sleeve, walking someone home from their own courage. If an accident was waiting in your usual seat, it can have the seat. You are not in it.",
    "Sam bumps your shoulder once, the way a friend does, and does not ask you to explain the universe before the next corner.",
  ], [], { ending: "ending-late", reflections: [{ text: "You helped with the box when it was only a box.", when: { flag: "helpedSam" } }] }),

  scene("end-scarf", "another", [
    "Marlow has their color back. You have your hands back. The stop will still be there tomorrow, for whoever needs a place to be early. You do not take the scarf with you. You would like to remain someone who can buy bread, not someone collecting relics.",
    "Marlow lifts a hand. You lift yours. The light changes. You cross separately. That is not a sad ending. It is two people going home.",
  ], [], { ending: "ending-scarf" }),

  scene("end-night", "another", [
    "Rin's night does not become your personality. It becomes a room you sat in. The kid they missed is not brought back by your company, and Rin does not pretend otherwise. What changes is that the sorrow has a witness who is not a tired bus driver at the end of a shift.",
    "When you part, Rin says to come by tomorrow, if you are still you. You intend to be.",
  ], [], { ending: "ending-night", reflections: [{ text: "You believed Rin about the cost of staying in their head.", when: { flag: "believedRin" } }] }),

  scene("end-table", "another", [
    "The place was set before you were easy to understand. Ames does not need the whole mystery in order to pass you the salt. If another version of you stood outside earlier, they did not come in, and Ames kept that boundary.",
    "You do the dishes. The ordinary work is loud enough to make the strange part of the day small enough to live beside. This ending is not an answer. It is a kitchen.",
  ], [], { ending: "ending-table", reflections: [
    { text: "You told Ames the morning was wrong, and they fed you anyway.", when: { flag: "toldAmes" } },
    { text: "You promised to show up, and you did.", when: { flag: "promisedAmes" } },
  ] }),

  scene("end-minute", "another", [
    "7:13 holds you the way a hand holds something it does not mean to drop. You can see every version of the choice, and you cannot touch any of them. It is the loneliest kind of understanding.",
    "Even a stuck minute is a place you could leave. You don't. Not this time. You watch the other you reach for the phone, and you mouth a warning they cannot hear. The clock, polite to the end, never becomes 7:14.",
  ], [], { ending: "ending-minute", reflections: [{ text: "You stayed when the minute asked to be believed.", when: { flag: "stayedMinute" } }] }),

  scene("end-burned", "another", [
    "The drawer will fill again on Thursday. Jo said so, and you believe them. Burning one sentence did not stop whatever is happening. It stopped you from taking orders from your own panic.",
    "In the morning the inbox is empty of you. So is the sent folder. The quiet is not a victory. It is a space a living voice can fit into. You call Ames. You mean it.",
  ], [], { ending: "ending-burned" }),

  scene("end-again", "another", [
    "You and Marlow have stood at this stop in more than one version of the morning. There is no choir for it. The scarf is tired of being a symbol, so it is only warm.",
    "You do not become one correct life. You compare notes, the way people do when they have survived the same storm in different rooms. Then Marlow gets on a bus, and you don't. The choice is small enough to trust.",
  ], [], { ending: "ending-again", reflections: [{ text: "You remembered Marlow from a morning this body didn't live, and they allowed it.", when: { flag: "saidEcho" } }] }),

  scene("end-kept", "another", [
    "The day you kept is not a hidden reel of disasters avoided. It is groceries. A text from Rin about the station dog. A crack in a mug you decide to drink from anyway. The warning does not come back.",
    "You take the long way because you like the tree, not because a ghost told you to. That may be the whole difference.",
  ], [], { ending: "ending-kept", reflections: [{ text: "You left the usual route before you understood why.", when: { flag: "otherRoute" } }] }),

  scene("end-untrusted", "another", [
    "Sam does not wave the next time. They are not cruel. They are finished being a lesson in someone else's mystery. The good morning you might have shared goes back into their pocket, and you do not get to spend it.",
    "The rest of the day works. That is both the punishment and the mercy. The world does not collapse in order to scold you. It simply withholds a person.",
  ], [], { ending: "ending-untrusted", reflections: [{ text: "You spoke a secret Sam had not given this version of you.", when: { flag: "selfishEcho" } }] }),

  scene("end-margin", "another", [
    "You have woken enough times to feel the overlap as a change in temperature. It is not a throne. It is the moment before your hand moves, held open because you have seen more than one result and still have to choose.",
    "You pick a morning in which the people you love are not evidence. You let the other versions go quiet without using them. Someone will still be afraid someday. It does not have to be arranged by you.",
  ], [], { ending: "ending-margin" }),

  scene("end-warning", "another", [
    "You walk into the morning as the warning, not as the text of it. You will look up. You will catch what falls. You will leave a room when the clock starts flattering itself. No future you receives a riddle. If they receive anything, it is the sight of you already doing the plain thing.",
    "It is harder than sending a sentence. It lasts longer than a minute.",
  ], [], { ending: "ending-warning" }),

  scene("end-chosen", "another", [
    "You know enough to be haunted, and you choose the table anyway. The walk. The mug with the unreliable crack. The larger truth does not vanish. It becomes private weather, and you stop making other people stand in it.",
    "At 7:13 the phone is only a phone. You are already up. Somewhere, a morning that never got sent folds itself away, because you did not give it a fresh regret to wear.",
  ], [], { ending: "ending-chosen", reflections: [
    { text: "You read what your own hand called spent, and you declined the instruction.", when: { flag: "readHand" } },
    { text: "Somebody from your actual life was included in the choice.", when: { any: [{ flag: "helpedSam" }, { flag: "promisedAmes" }] } },
  ] }),

  scene("end-margin-gate", "another", [
    "You stand in the kitchen with too many mornings in your mouth. If you have lived enough of them, the room feels wider than the walls.",
  ], [
    go("end-mg-yes", "Choose which morning gets to wake, and release the rest.", "end-margin", [matter], { endingsAtLeast: 3 }),
    go("end-mg-no", "You are not there yet. Keep one life.", "end-kept"),
  ], { checkpoint: true }),
];
