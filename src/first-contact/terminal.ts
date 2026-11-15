const BOOT = [
  "INITIALIZING DEEP SPACE COMMUNICATION...",
  "CALIBRATING ANTENNA...",
  "SEARCHING FOR INTELLIGENT LIFE...",
  "...",
  "...",
  "SIGNAL DETECTED.",
  "ESTABLISHING CONNECTION...",
  "TRANSLATING INCOMING TRANSMISSION...",
];

const AFTER = [
  "RESPONSE CLASSIFIED AS QUESTIONABLE.",
  "ATTEMPTING TO DISCONNECT...",
  "ERROR: UNIVERSE CONNECTION ESTABLISHED.",
];

export type TerminalEnd = "done" | "skip" | "close";

export function runTerminal(
  log: HTMLElement,
  note: HTMLElement,
  shell: HTMLElement,
  reduceMotion: boolean,
): { finished: Promise<TerminalEnd>; skip: () => void; stop: () => void } {
  let end: TerminalEnd | null = null;
  let resolveEnd: (value: TerminalEnd) => void = () => {};
  const finished = new Promise<TerminalEnd>((resolve) => {
    resolveEnd = resolve;
  });
  const timers: number[] = [];

  const finish = (reason: TerminalEnd) => {
    if (end) return;
    end = reason;
    for (const timer of timers) window.clearTimeout(timer);
    resolveEnd(reason);
  };

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      if (end) {
        resolve();
        return;
      }
      timers.push(window.setTimeout(resolve, reduceMotion ? 0 : ms));
    });

  const typeLine = async (text: string) => {
    const row = document.createElement("p");
    log.append(row);
    const full = `> ${text}`;
    if (reduceMotion) {
      row.textContent = full;
      return;
    }
    for (let index = 1; index <= full.length; index += 1) {
      if (end) return;
      row.textContent = full.slice(0, index);
      await wait(12);
    }
    await wait(160);
  };

  const play = async () => {
    for (const line of BOOT) {
      if (end) return;
      await typeLine(line);
    }
    if (end) return;
    note.hidden = false;
    await wait(1500);
    if (end) return;
    for (const line of AFTER) {
      if (end) return;
      await typeLine(line);
    }
    if (end) return;
    if (!reduceMotion) {
      shell.classList.add("is-glitching");
      await wait(650);
    }
    finish("done");
  };

  void play();

  return {
    finished,
    skip: () => finish("skip"),
    stop: () => finish("close"),
  };
}
