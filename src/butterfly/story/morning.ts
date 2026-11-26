import type { Story } from "../types.ts";

export const morning: Story = {
  start: "coffee-wake",
  characters: [
    { id: "nora", name: "Nora", summary: "Someone you once loved, with a train to catch." },
    { id: "alice", name: "Alice", summary: "A girl trying to get a birthday card to her grandfather." },
    { id: "rose", name: "Rose", summary: "A designer in her fifties pitching a neighborhood repair workshop." },
  ],
  chapters: [
    { id: "wake", title: "The kitchen light", act: "Morning" },
    { id: "cafe", title: "Two coffees", act: "Morning" },
    { id: "station", title: "The station", act: "Morning" },
    { id: "bakery", title: "The note at the bakery", act: "Morning" },
    { id: "shop", title: "The empty storefront", act: "Morning" },
  ],
  endings: [
    { id: "late-train", title: "The Next Train" },
    { id: "thursdays", title: "Thursdays" },
    { id: "number", title: "The Number on the Box" },
    { id: "six", title: "A Table at Six" },
    { id: "saturdays", title: "Four Saturdays" },
    { id: "key", title: "The Spare Key" },
  ],
  nodes: [
    {
      id: "coffee-wake", chapter: "wake", time: "7:12 AM", place: "Your apartment", checkpoint: true,
      body: [
        "Your alarm goes off at 7:12. You have one voicemail. Nora. You deleted her number three months ago and your phone still knows it’s her.",
        "“Hey. I’m downstairs. I brought coffee. Can we try again?”",
        "The message is six minutes old. There’s nobody on the sidewalk. Across the street, the café owner is putting out her chalkboard.",
        "Your kitchen light is on. Nora used to look for it before she crossed the street.",
      ],
      choices: [
        { id: "down", label: "Go downstairs", to: "coffee-cafe" },
        { id: "call", label: "Call Nora back", to: "coffee-bakery" },
        { id: "work", label: "Switch off the light and leave for work", to: "coffee-shop" },
      ],
    },
    {
      id: "coffee-cafe", chapter: "cafe", place: "The café", time: "7:17 AM", checkpoint: true, meet: "nora",
      body: [
        "Nora is at the table where you used to split a pastry on Sunday mornings. She pushes one of the cups toward you. “I remembered. No cinnamon.”",
        "At the next table, a woman named Rose is wrapping a cardboard model in a scarf. A girl with a yellow backpack steadies its tiny front door while Rose ties the knot. Then the girl runs back to the bakery across the street.",
        "You take a sip. There’s cinnamon in it. You swap cups and she laughs once, through her nose, the way she always did when you caught her trying too hard.",
        "Her suitcase is under the table. She follows your eyes. “My train’s in forty minutes. I was going to tell you last week. Then last week ended.”",
        "She pats the pocket of her coat. Then the other one. “I think I left my phone in the cab.”",
      ],
      choices: [
        { id: "phone", label: "Offer to help find her phone", to: "coffee-station" },
        { id: "ask", label: "Ask why she came in person", to: "coffee-table" },
      ],
    },
    {
      id: "coffee-station", chapter: "station", place: "Platform 2", time: "7:53 AM", checkpoint: true,
      body: [
        "You call her phone. The driver answers and swings by with it on his way back past the café. By the time you and Nora reach the station, the conductor is standing beside the last open door.",
        "“We did pretty well,” Nora says, nodding at the phone. You’ve spent thirty-six minutes together and you know more about the cab driver’s morning than hers.",
        "She unlocks her phone. Your old chat is still pinned. The last photo is a picture of a bin on a curb. You used to take hers out on Thursdays. She used to send photographic evidence on the weeks she beat you to it.",
        "“Can I send you something when I get there?” she asks. The conductor raises a hand.",
      ],
      choices: [
        { id: "wave", label: "Tell her to send a picture when she gets there", to: "coffee-thursdays" },
        { id: "stay", label: "Ask if there’s a later train", to: "coffee-next" },
      ],
    },
    {
      id: "coffee-table", chapter: "cafe", place: "The table by the window", time: "7:26 AM", checkpoint: true,
      body: [
        "“I came in September too,” Nora says. “I saw the kitchen light. I knocked twice.”",
        "You remember that morning. You were standing barefoot on the other side of the door, holding a piece of toast. You waited until you heard the stairwell door swing shut.",
        "“I thought you knew,” she says. “I thought leaving the light on was your way of saying I could come up.”",
        "She slides the suitcase handle out until it clicks. You have time to tell her one thing before she decides whether to stand up.",
      ],
      choices: [
        { id: "truth", label: "Tell her you were on the other side of the door", to: "coffee-next" },
        { id: "walk", label: "Offer to walk her to the station", to: "coffee-thursdays" },
      ],
    },
    {
      id: "coffee-next", chapter: "cafe", ending: "late-train",
      body: [
        "Just after eight, you and Nora are back at the café table, where the owner has left your cups. You both stop talking for a second. You can hear the milk steamer and somebody asking whether the scones have raisins.",
        "“There goes my train,” she says, looking at the clock. “There’s another at eleven. I checked before I came over.”",
        "By the time you walk her to the station, you’ve told her what you were doing with the toast in your hand. She’s told you there were two bags of groceries on the landing that day. She’d bought too much and thought you might want some pears.",
        "You don’t make plans to visit. You do ask what she’s making for dinner in the new place. At the top of the escalator she calls back that she has a saucepan and no forks. That evening she sends you a photo of herself eating noodles with a wooden spoon.",
      ],
    },
    {
      id: "coffee-thursdays", chapter: "station", ending: "thursdays",
      body: [
        "Nora takes the last step onto the train. There’s space beside her in the doorway for a second. Then the conductor taps a button and she puts her palm against the glass.",
        "At 6:04 that evening, she sends you a picture of two bins on an unfamiliar curb. The sky behind them is pink.",
        "You type, “I left the light on that morning in September too.” You look at it for a while. Then you add, “I heard you knock.”",
        "Her reply comes while you’re brushing your teeth. “Call me Thursday? I’ve got a long walk to the bins here.” You put it in your calendar before you rinse.",
      ],
    },
    {
      id: "coffee-bakery", chapter: "bakery", place: "The bakery on King Street", time: "7:38 AM", checkpoint: true, meet: "alice",
      body: [
        "A cab driver answers Nora’s phone. She’s dropping off a box of rolls at her sister’s bakery and says you can collect it there.",
        "By the time you arrive, Nora has already picked it up. The baker hands you the coffee she left behind. “She had a train to catch,” the baker says. She points to your name on the lid. “She asked me to make sure you got that.”",
        "Rose, a woman waiting for the café across the street to let her measure its spare tables, brings in a note she found under the cab’s windshield wiper. “Can you take me to Pine Road? I have nine dollars. Please don’t call ahead.”",
        "The baker nods toward a girl with a yellow backpack at the bus stop. “That’s Alice. She was asking about Pine Road.” Alice has her hand up, shading her eyes to read a timetable somebody has covered with a notice saying the route was cancelled.",
      ],
      choices: [
        { id: "bus", label: "Go tell Alice about the cancelled bus", to: "coffee-eli" },
        { id: "box", label: "Ask the baker what’s on Pine Road", to: "coffee-box" },
      ],
    },
    {
      id: "coffee-eli", chapter: "bakery", ending: "six",
      body: [
        "Pine Road is where Alice’s grandfather lives. Today is his birthday. Alice has been carrying his card in her school bag for a week. One corner has gone soft.",
        "“I just want to tell him happy birthday,” Alice says. She turns the card over. “If I call, I might forget my speech.”",
        "The baker sets the shop phone on the counter. Rose holds the birthday card open beside it so Alice can read what she wrote. By the time Alice hangs up, the baker has promised to save them a table for six o’clock.",
        "That afternoon, Nora texts that she made her train. At six, you pass the café on your way back. Two people are sitting at Nora’s old table. You’d been close enough this morning to go downstairs in slippers. You wish you had.",
        "At the bakery, Alice’s grandfather closes his eyes to make a wish. Alice holds a hand around the candle to keep it lit until he’s ready.",
      ],
    },
    {
      id: "coffee-box", chapter: "bakery", ending: "number",
      body: [
        "The baker turns around and pulls a flattened pastry box from behind the till. A delivery address on Pine Road is written on the lid. Below it is a phone number.",
        "“Birthday order,” she says. “He cancelled it yesterday. Said he didn’t think anybody was coming.”",
        "You take the box to the bus stop. Alice looks at the number. “That’s Grandpa’s old one. He still has it?” Rose lends her a phone and sits beside her on the bench while she dials.",
        "That evening you come back for a loaf. Nora has texted from the train. Before you go in, you open her voicemail and listen as far as “I’m downstairs.” You wish you’d heard her say it in person.",
        "Inside, the baker slides a fresh pastry box across the counter to Alice’s dad. Alice holds the door for him. “Do you want me to ring Grandpa’s bell?” she asks. Her dad thinks about it. “Let’s both go up.”",
      ],
    },
    {
      id: "coffee-shop", chapter: "shop", place: "The train to work", time: "7:32 AM", checkpoint: true, meet: "rose",
      body: [
        "You switch off the light, tuck your phone away, and catch the earlier train.",
        "The woman across from you asks if you can hold a piece of cardboard steady. She’s trying to slot a tiny window into a model. You recognize the chipped blue tile she’s drawn around the door. It’s the empty shop beside your café.",
        "Her name is Rose. The owner is hearing proposals today and she’s pitching a workshop. You’ve walked past that window for years, thinking somebody ought to put a big table in there and let people bring in things they don’t know how to fix.",
        "“I’m missing something,” she says, pushing the little window into place. “What would actually get you to walk in?”",
      ],
      choices: [
        { id: "idea", label: "Tell her about the repair table", to: "coffee-saturdays" },
        { id: "visit", label: "Ask if you can come see the space", to: "coffee-key" },
      ],
    },
    {
      id: "coffee-saturdays", chapter: "shop", ending: "saturdays",
      body: [
        "Rose takes a pen from her bag and draws a rectangle on the model’s floor. “Like that?” You move it away from the wall. You’ll need room on both sides if you’re going to open up a toaster.",
        "That evening you stop at the café. The owner hands you a sleeve with your name on it. “Nora left that before her train,” she says. You slip it into your coat pocket. Outside, a girl with a yellow backpack is drawing a crooked birthday candle in the corner of the chalkboard. Under the price of a flat white, Rose has written, “Bring something broken. Saturdays in December.” There are four dates and an empty space for a name.",
        "She’s inside borrowing a tape measure. She asks if you’d be willing to do the first Saturday together. You’ve got a lamp at home that stopped working two years ago. You tell her you’ll bring it.",
      ],
    },
    {
      id: "coffee-key", chapter: "shop", ending: "key",
      body: [
        "Rose sends you the viewing time. You show up at lunch and find her on her knees, measuring the doorway. Her workshop needs an extraction vent the owner won’t install. She takes the model apart so she can carry it home flat.",
        "The owner asks if you came with a proposal too. You look past him at the old counter. It’s wide enough to lay a bicycle wheel flat. “Would you let me try something for a month?” you ask.",
        "You spend your lunch drawing a plan on the back of Rose’s cardboard. By six you have an agreement for a trial opening and a key with a paper tag. The café owner lends you her chalkboard.",
        "The café owner tells you Nora left on the early train. Across the street, a girl in a yellow backpack is carrying a pastry box level with both hands. You hold the bakery door for her before going back to unlock the shop.",
        "You get as far as “What have you been meaning to fix?” before someone across the street shouts, “Do umbrellas count?”",
      ],
    },
  ],
};
