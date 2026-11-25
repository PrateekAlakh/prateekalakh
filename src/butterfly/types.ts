export interface ChapterInfo {
  id: string;
  title: string;
  act: string;
}

export interface CharacterInfo {
  id: string;
  name: string;
  summary: string;
}

export interface EndingInfo {
  id: string;
  title: string;
  hidden?: boolean;
}

export type Mark = "changed" | "matters";

export type Condition =
  | { flag: string; is?: boolean }
  | { stat: string; gte?: number }
  | { item: string }
  | { echo: string }
  | { endingsAtLeast: number }
  | { seenEnding: string }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export type Effect =
  | { flag: string; value: boolean }
  | { stat: string; add: number }
  | { item: string }
  | { meet: string }
  | { memory: string }
  | { person: { id: string; name: string; note: string } }
  | { clue: { id: string; title: string; detail: string } }
  | { question: { id: string; text: string } }
  | { resolve: string }
  | { mark: Mark };

export interface Choice {
  id: string;
  label: string;
  to: string;
  when?: Condition;
  effects?: Effect[];
}

export interface Reflection {
  text: string;
  when?: Condition;
}

export interface JournalPerson {
  id: string;
  name: string;
  note: string;
}

export interface JournalClue {
  id: string;
  title: string;
  detail: string;
}

export interface JournalQuestion {
  id: string;
  text: string;
}

export interface Journal {
  memories: string[];
  people: JournalPerson[];
  clues: JournalClue[];
  questions: JournalQuestion[];
}

export interface DialogueLine {
  speaker: string;
  line: string;
}

export interface NarrativeNode {
  id: string;
  chapter: string;
  place?: string;
  time?: string;
  body: string[];
  dialogue?: DialogueLine[];
  effects?: Effect[];
  choices?: Choice[];
  ending?: string;
  checkpoint?: boolean;
  allowLoop?: boolean;
  meet?: string;
  reflections?: Reflection[];
}

export interface Story {
  chapters: ChapterInfo[];
  characters: CharacterInfo[];
  endings: EndingInfo[];
  nodes: NarrativeNode[];
  start: string;
}

export interface RunSnapshot {
  nodeId: string;
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  items: string[];
  journal: Journal;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  nodeId: string;
  choiceId?: string;
}

export interface Run {
  nodeId: string;
  flags: Record<string, boolean>;
  stats: Record<string, number>;
  items: string[];
  journal: Journal;
  history: HistoryEntry[];
  checkpoints: RunSnapshot[];
  lastMark: Mark | null;
  endingId: string | null;
}

export interface Discoveries {
  endings: string[];
  nodes: string[];
  people: string[];
}

export interface Preferences {
  size: "s" | "m" | "l";
  name: string;
}

export interface Archive {
  endingId: string;
  at: number;
  checkpoints: RunSnapshot[];
}

export interface SaveFile {
  version: 1;
  active: Run | null;
  completed: { endingId: string; at: number }[];
  archives: Archive[];
  discoveries: Discoveries;
  preferences: Preferences;
}
