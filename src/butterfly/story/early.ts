import type { NarrativeNode } from "../types.ts";
import { changed, flag, go, item, matter, scene, trust } from "./dsl.ts";

const q = (id: string, text: string) => ({ question: { id, text } });
const clue = (id: string, title: string, detail: string) => ({ clue: { id, title, detail } });
const memory = (text: string) => ({ memory: text });
const person = (id: string, name: string, note: string) => ({ person: { id, name, note } });

export const early: NarrativeNode[] = [
  scene("m-wake", "ordinary", [
    "The alarm goes off, and your hand finds the phone before your eyes open. You have done this so many mornings that the dark already knows the way.",
    "7:13.",
    "For a little while, that is all there is. The quilt pulled to your chin. A thin line of light at the blind. The plain, welcome fact of being awake.",
  ], [go("m-next", "Look at the screen.", "m-message")], { time: "7:13 AM", place: "Your room", checkpoint: true, effects: [q("q-message", "Who can text you from your own number?")] }),

  scene("m-message", "ordinary", [
    "A message is waiting. It was sent from your own number.",
    "There is no conversation before it. No name at the top. No joke you remember starting, and no sign that anyone else has been in the thread.",
  ], [
    go("m-reply", "Reply to the message.", "m-type", [flag("replied"), trust("curiosity", 1), matter]),
    go("m-clock", "Check whether the time is even possible.", "m-clock", [flag("checkedClock"), trust("caution", 1)]),
    go("m-window", "Look outside.", "m-window", [flag("lookedOut")]),
    go("m-dismiss", "Dismiss it and continue the morning.", "m-dismiss", [flag("dismissed"), trust("caution", 1)]),
  ], {
    time: "7:13 AM — Tomorrow",
    dialogue: [{ speaker: "Your number", line: "Whatever happens today, do not take the usual route." }],
    effects: [clue("c-text", "The message", "Sent from your number, timestamped tomorrow. It tells you to avoid the usual route.")],
  }),

  scene("m-type", "ordinary", [
    "The reply box is empty, and the cursor blinks in it. Your own number sits at the top of the screen. It looks absurd there, like a name you would never save.",
    "You type slowly. Some part of you thinks that if you hurry, the whole thing will turn out to be a trick.",
  ], [go("m-send", "Ask who this is.", "m-sent")], { dialogue: [{ speaker: "You", line: "Who is this?" }] }),

  scene("m-sent", "ordinary", [
    "The message leaves. For a few seconds the thread holds nothing but your question, sitting there by itself. Silence would have been easier. A question means you have admitted someone might answer.",
  ], [
    go("m-wait", "Wait.", "m-dots"),
    go("m-pocket", "Put the phone down.", "m-door-shaken", [changed]),
  ]),

  scene("m-dots", "ordinary", [
    "Three dots appear, vanish, and come back. Whoever is on the other side is writing something, then thinking better of it, then writing again.",
  ], [go("m-read-back", "Read the reply.", "m-answer")], { dialogue: [{ speaker: "Your number", line: "You, if you take the bus." }] }),

  scene("m-answer", "ordinary", [
    "You read it twice. It does not explain how a message can arrive from tomorrow. It only tells you what they are afraid of, and that is worse, because now the fear has a shape.",
    "Outside, a car horn sounds once. Early, and almost polite.",
  ], [
    go("m-press", "Ask what happens on the bus.", "m-no-bus", [trust("curiosity", 1)]),
    go("m-enough", "Stop writing.", "m-door-warned", [matter]),
  ]),

  scene("m-no-bus", "ordinary", [
    "You send the question. The reply comes back so quickly that nobody on the other end can have stopped to think.",
  ], [go("m-leave-thread", "Leave it there.", "m-door-warned")], {
    dialogue: [{ speaker: "Your number", line: "Nothing, if you are not on it. That is the whole kindness." }],
    effects: [memory("A version of you called the warning a kindness.")],
  }),

  scene("m-clock", "ordinary", [
    "You open the clock, then the calendar, then the settings you never bother with. The date is today. The time is 7:13. The message still says it was sent tomorrow.",
    "The alarm goes off again.",
    "7:13.",
  ], [
    go("m-stay", "Stay inside the minute.", "m-hold", [flag("stayedMinute"), matter]),
    go("m-leave-clock", "Put the phone face down and stand up.", "m-door-clock", [changed]),
  ]),

  scene("m-hold", "ordinary", [
    "You watch the numbers. They do not move. Everything else in the room is ordinary: the bed, the chair with yesterday's clothes, the dust turning slowly in the light from the blinds. Only the minute refuses to end.",
    "In the black screen, your reflection is a little late. You lift your hand. It follows, a half-second behind, as if it had to be reminded.",
  ], [
    go("m-again", "Keep watching.", "m-hold-2"),
    go("m-break", "Stand up anyway.", "m-door-clock", [changed]),
  ], { allowLoop: true }),

  scene("m-hold-2", "ordinary", [
    "You try again, and this time the stillness feels less like a glitch and more like a decision. You can hear the fridge, a horn in the street, the sound of your own swallow. None of it pulls the clock forward.",
    "If you stay, you might understand what is happening. You are not sure that understanding will be any use to someone who still has to get dressed and leave.",
  ], [
    go("m-stay-more", "Stay.", "m-reflection"),
    go("m-break-2", "Leave the minute.", "m-door-clock"),
  ], { allowLoop: true }),

  scene("m-reflection", "ordinary", [
    "In the window, you are already dressed. The other you looks tired in a way this morning has not earned yet. Their mouth moves. You cannot tell whether they are saying a name, or simply don't.",
    "You blink. The glass is only glass again, and the clock, as if it has been waiting for you to look away, becomes 7:14.",
  ], [go("m-after-minute", "Get dressed.", "m-door-clock")], { effects: [memory("For a moment you were already dressed, and already sorry.")] }),

  scene("m-window", "ordinary", [
    "The horn comes from the corner, not from any crash you can see. Someone is being careful in the fog. You push the blind aside with two fingers.",
    "A person in a blue scarf is waiting at the crosswalk, looking up at your building as if they have been standing there long enough to be cold.",
  ], [
    go("m-open", "Open the window.", "m-open", [flag("waved"), trust("empathy", 1)]),
    go("m-back", "Step back before they see you.", "m-door-seen", [flag("lookedOut")]),
  ]),

  scene("m-open", "ordinary", [
    "Cold air comes in, and the last of sleep with it. The person in the scarf finds your window without having to search. They do not wave. They nod, the way you nod at someone whose name you have lost, but whose face you still trust.",
    "The light changes. They cross, and the corner is empty again.",
  ], [go("m-after-wave", "Close the window.", "m-door-waved", [matter])], { effects: [person("marlow", "A person in a blue scarf", "They looked up at your window as if they had been waiting for a face, not a favor.")] }),

  scene("m-dismiss", "ordinary", [
    "You turn the phone over. The message is still there, of course. Turning it over only means you do not have to look at it.",
    "You do the morning in the usual order. Water. Teeth. The shirt that does not ask you to decide anything. The kettle clicks. Somewhere outside, a horn sounds once, and then the street goes back to being a street.",
  ], [go("m-toast", "Make toast.", "m-toast")]),

  scene("m-toast", "ordinary", [
    "The toast comes out a little too dark at one corner. That, at least, is familiar. The toaster has always done that, and a morning that still contains your own small annoyances feels harder to doubt.",
    "You reach for the mug you always use.",
  ], [go("m-mug", "Pick it up.", "m-mug")]),

  scene("m-mug", "ordinary", [
    "There is a crack in the glaze. A thin line, running from the lip toward the handle. You do not remember dropping it. You would remember. You are the sort of person who says sorry to a mug.",
    "The phone buzzes where you left it, face-down, reminding you of the thing you have already decided not to answer.",
  ], [
    go("m-usual", "Take the usual route.", "m-door-usual", [flag("usualRoute")]),
    go("m-other", "Walk the long way.", "m-door-other", [flag("otherRoute"), matter]),
  ], { effects: [clue("c-mug", "The cracked mug", "The crack is new. You did not drop it. Not in this morning.")] }),

  scene("m-door-shaken", "ordinary", [
    "You get dressed with the phone in your pocket, heavier than it should be. You did not wait for an answer. It felt like a choice. It also felt like flinching.",
    "At the door you stop with the keys in your hand. The usual way is less a street than a habit: the bus, the corner cafe, the nod at the driver who never nods back.",
  ], [
    go("m-shaken-usual", "Take it anyway.", "s-stop", [flag("usualRoute")]),
    go("m-shaken-other", "Take the long way.", "s-long", [flag("otherRoute"), changed]),
  ], { checkpoint: true }),

  scene("m-door-warned", "ordinary", [
    "You are dressed. The thread is still open in your hand. Kindness, they called it. If there is a they.",
    "The bus is the usual way. You know that without a map. You have taken it long enough that your body starts toward the stop before you have agreed to go.",
  ], [
    go("m-warned-bus", "Take the bus anyway. You want to see.", "s-stop", [flag("usualRoute"), trust("curiosity", 1)]),
    go("m-warned-walk", "Walk. Let the bus happen without you.", "s-long", [flag("otherRoute"), matter]),
  ]),

  scene("m-door-clock", "ordinary", [
    "It is 7:14, and the minute looks almost proud of itself for moving. Your hands are steady again, the way they get after something small has frightened them.",
    "You could tell someone. You cannot think of a sentence that would not sound like a dream you are insisting on.",
  ], [
    go("m-clock-bus", "Take the bus. Keep your eyes open.", "s-stop", [flag("usualRoute")]),
    go("m-clock-walk", "Walk, and do not give the minute another chance.", "s-long", [flag("otherRoute")]),
  ]),

  scene("m-door-seen", "ordinary", [
    "You get ready without looking out again. The blue scarf stays with you anyway, a small bright thing at the edge of the block.",
    "When you lock the door, you lock it twice. You never lock it twice.",
  ], [
    go("m-seen-bus", "Go to the stop.", "s-stop", [flag("usualRoute")]),
    go("m-seen-walk", "Walk the way that avoids the corner.", "s-long", [flag("otherRoute")]),
  ], { effects: [memory("You locked the door twice.")] }),

  scene("m-door-waved", "ordinary", [
    "The nod follows you while you put your shoes on. You did not speak. You were seen, and that was already a conversation you had not planned to have.",
  ], [
    go("m-waved-bus", "Go down and hope they are gone.", "s-stop", [flag("usualRoute")]),
    go("m-waved-walk", "Walk. If they are going to the stop, you will not.", "s-long", [flag("otherRoute"), changed]),
  ]),

  scene("m-door-usual", "ordinary", [
    "You rinse the mug and keep your finger off the crack. Some things can wait until evening, when you are either braver or too tired to care.",
    "Keys. Bag. The phone, still face-down, still unanswered.",
  ], [go("m-out-usual", "Take the usual route.", "s-stop", [flag("usualRoute")])]),

  scene("m-door-other", "ordinary", [
    "You leave the mug in the sink, crack facing up, like a small confession you are not ready to make out loud. The long way adds twelve minutes and a street you only use when the bus is late, or when you want to be.",
    "Following a text from yourself feels ridiculous. It is also the first time today you have taken the warning seriously.",
  ], [go("m-out-other", "Lock the door.", "s-long", [flag("otherRoute")])], { effects: [memory("You took the long way because a text from yourself asked you to.")] }),

  scene("s-stop", "street", [
    "The stop smells like rain that has not quite decided to fall. Sam is already there, a bakery box going soft at one corner, flour on the sleeve they keep forgetting to roll.",
    "They smile at you as if the morning is a joke you are both in on, and not a test.",
  ], [
    go("s-help", "Catch the box. The corner is failing.", "s-help", [flag("helpedSam"), trust("sam", 2), trust("empathy", 1), matter]),
    go("s-nod", "Nod, and let them manage the box.", "s-nod", [trust("sam", 1)]),
    go("s-past", "Stay in your phone.", "s-past", [flag("ignoredSam"), trust("sam", -1)]),
  ], { place: "The bus stop", time: "7:31 AM", checkpoint: true, meet: "sam", effects: [person("sam", "Sam", "Neighbor. Bakery shift. Flour on one sleeve and a box that wants to open itself.")] }),

  scene("s-help", "street", [
    "The box gives way just as you reach it. A pastry slides, then another. You and Sam crouch at the same time, and for a second you are just two neighbors picking breakfast off the pavement.",
    "Up close they smell like butter and cold air.",
  ], [go("s-flour", "Help them fit the lid back on.", "s-flour")]),

  scene("s-flour", "street", [
    "Sam laughs once, quietly. It is the laugh of someone who is late and has decided not to spend the lateness being ashamed.",
    "Under the paper in the box there is a list. You see your own building's door number, and the words say it today, underlined, before a cinnamon roll slides back over them.",
  ], [
    go("s-ask-list", "Ask what the list is.", "s-list", [trust("curiosity", 1), trust("sam", 1)]),
    go("s-pretend", "Pretend you only saw the pastry.", "s-thanks"),
  ]),

  scene("s-list", "street", [
    "Sam folds the paper so quickly it is almost graceful. They do not look angry. They look caught.",
  ], [go("s-after-list", "Let it go.", "s-thanks", [changed])], {
    dialogue: [{ speaker: "Sam", line: "Things I keep not saying. If I write them down, some of them agree to wait." }],
    effects: [clue("c-list", "Sam's list", "A private list of unsent sentences. Your building's door was on it, underlined.")],
  }),

  scene("s-thanks", "street", [
    "The bus arrives with that tired sigh buses make. Sam touches your elbow, briefly, flour and all.",
  ], [go("s-board-sam", "Board with them.", "s-ride")], { dialogue: [{ speaker: "Sam", line: "I owe you a proper good morning. I'm collecting those." }] }),

  scene("s-nod", "street", [
    "Sam nods back, shifts the box, and watches the road as if the bus might be persuaded to come sooner. You stand a polite distance away. It is friendly. It is also a way of not quite arriving.",
  ], [go("s-board-nod", "Board when it comes.", "s-ride")]),

  scene("s-past", "street", [
    "You scroll through nothing. The corner of Sam's box gives way, and they manage it alone, one knee up, a soft curse that is not meant for you. When they glance over, you are only a person shaped like a phone.",
    "The glance lasts a second. It is enough to put you somewhere in their morning.",
  ], [go("s-board-past", "Board.", "s-ride")], { effects: [memory("Sam managed the box without you, and noticed.")] }),

  scene("s-long", "street", [
    "The long way is a street of closed shutters and one tree doing its best without an audience. The phone is warm in your pocket. You leave it there.",
    "A florist's gate is down. On the paper taped to it, the handwriting starts as a stranger's and, halfway through the sentence, becomes yours.",
  ], [
    go("s-read-note", "Read the note.", "s-note", [flag("readNote"), trust("curiosity", 1), matter]),
    go("s-skip-note", "Walk past it.", "s-corner"),
  ], { place: "The long way", time: "7:36 AM", checkpoint: true }),

  scene("s-note", "street", [
    "The tape is new. The sentence is not dramatic, and that is how you know it is yours. You do not write speeches on other people's doors. When you are afraid of being misunderstood, you write small instructions.",
  ], [go("s-after-note", "Peel nothing. Leave it.", "s-corner")], {
    dialogue: [{ speaker: "The note", line: "Not today. Let them make the morning without you in it." }],
    effects: [clue("c-note", "The florist note", "Your handwriting, on a shop you rarely pass: Not today. Let them make the morning without you in it.")],
  }),

  scene("s-corner", "street", [
    "At the next corner the blue scarf is no longer a maybe. The person is tying a shoe on the curb, as if a curb were a perfectly reasonable place to be honest.",
    "They look up. If you opened the window earlier, something like recognition crosses their face and is put away, carefully, before you can name it.",
  ], [
    go("s-talk", "Say good morning.", "s-marlow", [flag("talkedMarlow"), trust("empathy", 1)]),
    go("s-walk-on", "Keep walking.", "s-arrive", [flag("avoidedMarlow")]),
  ]),

  scene("s-marlow", "street", [
    "Up close, the scarf is mended at one end, a small neat stitch that has been redone more than once. Their voice is ordinary. You had half expected weather, or a riddle. Marlow only has a bus transfer, folded small enough to hide in a palm.",
  ], [
    go("s-name", "Ask their name.", "s-name", [trust("curiosity", 1)]),
    go("s-why", "Ask why they were watching the building.", "s-why", [matter]),
    go("s-leave-marlow", "Wish them a good day and go.", "s-arrive"),
  ], { meet: "marlow", effects: [person("marlow", "Marlow", "Blue scarf, mended. They were outside your building before you were a person they could explain.")] }),

  scene("s-name", "street", [
    "They tell you the name the way you might lend someone a key. Carefully, and not for keeps.",
  ], [
    go("s-echo", "We've met before, haven't we?", "s-echo", [flag("saidEcho"), changed], { echo: "marlow" }),
    go("s-after-name", "Thank them and walk.", "s-arrive"),
  ], { dialogue: [{ speaker: "Marlow", line: "Marlow. Don't lose the morning trying to spend it on me." }] }),

  scene("s-echo", "street", [
    "Marlow goes very still. Not frightened. Counting. Their hand finds the mended end of the scarf and stays there.",
  ], [go("s-after-echo", "Let the silence be an answer.", "s-arrive", [matter])], {
    dialogue: [{ speaker: "Marlow", line: "Then be careful which of us you're remembering. The scarf gets confused." }],
    effects: [memory("Marlow said the scarf gets confused about who it has met.")],
  }),

  scene("s-why", "street", [
    "Marlow looks at the building, then at you. You can see them consider the easier lie, and decide not to use it.",
  ], [go("s-after-why", "Accept that and go.", "s-arrive")], {
    dialogue: [{ speaker: "Marlow", line: "Because on one morning I didn't look up, and the day went on without a person I liked in it." }],
    effects: [clue("c-scarf", "Marlow's almost", "They watched your building because a morning they didn't look up lost someone.")],
  }),

  scene("s-arrive", "street", [
    "You come out on the avenue farther down, where the bus has already sighed and gone. The day is still intact. You are late in a way nobody is going to call brave.",
    "The cafe on your usual corner has its lights on. That is normal. The sign in the door is not.",
  ], [go("s-to-wrong", "Cross to the cafe.", "w-open")]),

  scene("s-ride", "street", [
    "The bus kneels. You tap your card. The driver looks at you a moment longer than the job requires, then back at the road, as if the road has asked them something about you.",
    "If Sam boarded with you, they take the sideways seat and hold the box the way you hold something that has already tried to escape once.",
  ], [
    go("s-ask-driver", "Ask the driver if something is wrong.", "s-driver", [flag("askedDriver"), trust("curiosity", 1)]),
    go("s-sit", "Sit down and keep to yourself.", "s-aisle"),
  ], { place: "The bus" }),

  scene("s-driver", "street", [
    "The driver does not turn all the way around. People who drive the early shift learn to spend their attention carefully.",
  ], [go("s-after-driver", "Sit.", "s-aisle")], { dialogue: [{ speaker: "The driver", line: "You usually don't say anything. Today you look like you're waiting for me to." }] }),

  scene("s-sit", "street", [
    "The city goes past in its usual strips: laundromat, dentist, a church with its doors still shut. In the window opposite, your reflection is on time. You are more relieved by that than you want to admit.",
    "One stop before yours, somebody pulls the cord early. The bell sounds like a decision being made out loud.",
  ], [
    go("s-early", "Get off early.", "s-early", [flag("leftEarly"), changed]),
    go("s-stay-ride", "Ride to your stop.", "s-usual-stop"),
  ]),

  scene("s-early", "street", [
    "The doors open on a block you only know from bus windows. The air is different by half a degree. You stand on the pavement and watch the bus take your usual self away without you.",
    "Nothing dramatic happens. The street does not applaud. You are simply not where you meant to be, and the day continues anyway.",
  ], [go("s-early-walk", "Walk the rest.", "w-open")], { effects: [memory("You let the bus leave with the version of you that stays seated.")] }),

  scene("s-usual-stop", "street", [
    "Your stop. The cafe. The same crack in the same pavement. You thank no one in particular and step down into a day that, so far, still looks like itself.",
  ], [go("s-to-cafe", "Go toward the cafe.", "w-open")]),

  scene("w-open", "wrong", [
    "The cafe is open. The bell over the door is the same bell. The person behind the counter is not the one who knows your order, and they look at you with a kindness that does not know where to land.",
    "In the window seat, Rin is stirring a coffee they have not touched. Rin works nights. Rin should be asleep, face-down in an ordinary weekday.",
  ], [
    go("w-rin", "Sit with Rin.", "w-sit", [flag("satWithRin"), trust("rin", 1)]),
    go("w-counter", "Order, and pretend you didn't see them.", "w-order"),
    go("w-leave", "Back out before the bell finishes.", "w-street", [flag("avoidedRin")]),
  ], { place: "The corner cafe", time: "8:02 AM", checkpoint: true, meet: "rin", effects: [person("rin", "Rin", "An old friend who should be asleep. They are in your morning cafe, not drinking their coffee.")] }),

  scene("w-sit", "wrong", [
    "Rin looks up, and you can see them do the small arithmetic of someone who hoped you would come and also hoped you wouldn't. They push the other chair out with their foot.",
  ], [
    go("w-honest", "Tell them about the message.", "w-honest", [flag("toldRin"), trust("rin", 2), trust("curiosity", 1)]),
    go("w-light", "Ask why they're awake, and nothing else.", "w-light", [trust("rin", 1)]),
  ], { dialogue: [{ speaker: "Rin", line: "If you say this is a coincidence I will respect you less, and I don't have a lot of that stocked." }] }),

  scene("w-honest", "wrong", [
    "You tell it plainly. The number. The timestamp that says tomorrow. The bus, or the walk. Rin listens with a thumb resting on the spoon, perfectly still. When you finish, they nod as if you have just come on shift.",
  ], [go("w-rin-rule", "Ask what they know.", "w-rule")], { effects: [memory("You told Rin about the message while the coffee went cold.")] }),

  scene("w-rule", "wrong", [
    "Rin glances at the counter, then at the door, and decides the room can hold one true thing.",
  ], [
    go("w-believe", "Believe them.", "w-after-rin", [flag("believedRin"), trust("rin", 1), matter]),
    go("w-doubt", "Tell them it sounds like exhaustion.", "w-after-rin", [flag("doubtedRin"), trust("rin", -1)]),
  ], { dialogue: [{ speaker: "Rin", line: "I got one last year. I took the usual route anyway. Somebody I liked had a worse day than they needed. I don't know the machinery. I know the cost." }] }),

  scene("w-light", "wrong", [
    "Rin accepts the smaller question. They were awake, they say, because sleep put them in a kitchen they don't live in anymore. They do not say whose kitchen. They stir the coffee they still have not drunk.",
  ], [go("w-light-go", "Let the conversation stay small.", "w-after-rin")], { effects: [clue("c-kitchen", "Rin's other kitchen", "Rin dreamed, or remembered, a kitchen they say they don't live in.")] }),

  scene("w-order", "wrong", [
    "You order the usual. The new person makes it right, which is its own small unease. In the window, Rin watches the spoon and not you. Once, their mouth moves. You are not close enough to hear the sentence, and you are not sure you have earned it.",
  ], [go("w-take-cup", "Take the cup and go.", "w-street")]),

  scene("w-street", "wrong", [
    "Outside, the day is bright enough to make everyone look more certain than they are. Your phone has no new messages. The old one is still there, timestamped like a dare.",
    "The rest of your life is still expecting you. A shift, a desk, a list, someone who will notice if you disappear into a mystery before lunch.",
  ], [
    go("w-go-life", "Go do the day you meant to do.", "af-cross"),
    go("w-follow", "Walk toward the block where the bus would have been.", "min-follow", [trust("curiosity", 1)]),
  ]),

  scene("w-after-rin", "wrong", [
    "Rin stands when you stand. They do not offer a hug. They offer a fact, which is more like them.",
  ], [
    go("w-take-fact", "Take the address.", "min-follow", [flag("rinAddress"), item("slip")]),
    go("w-no-fact", "Say you'll call tonight.", "min-ordinary"),
  ], { dialogue: [{ speaker: "Rin", line: "If the day starts repeating a minute, don't be brave inside it. Leave the room." }] }),

  scene("min-ordinary", "minute", [
    "Work, or the errand, or whatever room you are useful in, takes you back without questions. People say your name, or they don't. The clock behaves.",
    "At 12:13 you feel a draft that is not there. Nobody else looks up.",
  ], [
    go("min-ignore-draft", "Ignore it. Eat.", "min-lunch"),
    go("min-check", "Check your phone anyway.", "min-lunch-phone", [trust("curiosity", 1)]),
  ], { place: "The middle of the day", time: "12:13 PM", checkpoint: true }),

  scene("min-follow", "minute", [
    "You walk back toward the route you did or did not take. The bus is gone. A transfer ticket is stuck to the pole, blank on one side. On the other, in pencil, there is a time.",
  ], [go("min-ticket", "Take the ticket.", "min-ticket", [item("ticket"), flag("hasTicket")])], {
    dialogue: [{ speaker: "The ticket", line: "7:13. Don't apologize to the driver." }],
    effects: [clue("c-ticket", "The blank transfer", "A bus transfer, blank, then not: 7:13. Don't apologize to the driver.")],
  }),

  scene("min-ticket", "minute", [
    "The pencil smudges when you rub it, so the words are really there. You resent that. A real thing is harder to set aside than a feeling.",
    "Your phone rings. Ames. They only call when a plan is starting to turn into a feeling.",
  ], [
    go("min-answer-ames", "Answer.", "a-hello", [flag("answeredAmes"), trust("ames", 1)]),
    go("min-text-ames", "Let it ring. You'll call back.", "a-later", [flag("avoidedAmes")]),
  ], { meet: "ames" }),

  scene("min-lunch", "minute", [
    "You eat. The draft goes away. You are almost proud of yourself for ignoring it, and pride feels like a risky thing to add to a day like this.",
    "Ames calls, as if they have been standing in the middle of your afternoon, waiting for a door to open.",
  ], [
    go("min-lunch-answer", "Answer Ames.", "a-hello", [flag("answeredAmes"), trust("ames", 1)]),
    go("min-lunch-skip", "Silence the call.", "a-later", [flag("avoidedAmes"), trust("ames", -1)]),
  ]),

  scene("min-lunch-phone", "minute", [
    "There is no new message. The old one has been moved, by nothing you did, into a thread titled You. That title was not there this morning.",
    "Ames is calling at the same time. The two things arrive together, and you cannot tell whether that is unkind or simply how the day is being arranged.",
  ], [
    go("min-both", "Answer Ames. The thread can wait.", "a-hello", [flag("answeredAmes"), trust("ames", 1), matter]),
    go("min-thread", "Open the thread and miss the call.", "min-thread", [flag("avoidedAmes"), trust("curiosity", 1)]),
  ], { effects: [clue("c-thread", "A thread titled You", "The message now lives in a thread you did not name.")] }),

  scene("min-thread", "minute", [
    "Inside the thread there is only what you already know, and one line you did not see this morning. It is not a threat. It is about a table.",
  ], [go("min-thread-on", "Put the phone away.", "a-later")], { dialogue: [{ speaker: "Your number", line: "If Ames asks, go. The mystery will still be there after dessert." }] }),
];
