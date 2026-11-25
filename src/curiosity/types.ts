export const categories = [
  { id: "surprising-facts", label: "Surprising facts" },
  { id: "impossible-choices", label: "Impossible choices" },
  { id: "logic", label: "Logic challenges" },
  { id: "thought-experiments", label: "Thought experiments" },
  { id: "strange-but-true", label: "Strange but true" },
  { id: "what-if", label: "What if" },
  { id: "everyday-debates", label: "Everyday debates" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export type QuestionType = "factual" | "subjective" | "logic";
export type Difficulty = "light" | "medium" | "deep";

export interface Choice {
  id: string;
  label: string;
}

export interface SourceRef {
  title: string;
  url: string;
}

export interface Question {
  id: string;
  category: CategoryId;
  type: QuestionType;
  prompt: string;
  choices: Choice[];
  correctChoiceId?: string;
  explanation: string;
  followUp?: string;
  difficulty?: Difficulty;
  sources?: SourceRef[];
}

export interface StoredAnswer {
  choiceId: string;
  correct: boolean | null;
}

export interface Progress {
  version: 1;
  discovered: string[];
  answers: Record<string, StoredAnswer>;
  bookmarks: string[];
  achievements: string[];
  category: CategoryId | "all";
}

export interface Achievement {
  id: string;
  title: string;
  detail: string;
}

export const achievements: Achievement[] = [
  { id: "curious-one", title: "The Curious One", detail: "Discover your first question." },
  { id: "rabbit-hole", title: "Down the Rabbit Hole", detail: "Discover 10 questions." },
  { id: "wait-what", title: "Wait, What?", detail: "Discover 10 surprising facts." },
  { id: "philosopher", title: "The Philosopher", detail: "Answer 10 thought experiments." },
  { id: "thinker", title: "The Thinker", detail: "Solve 10 logic challenges." },
  { id: "renaissance", title: "Renaissance Mind", detail: "Explore every category." },
  { id: "insatiable", title: "Insatiably Curious", detail: "Discover 50 questions." },
  { id: "completionist", title: "The Completionist", detail: "Discover every question." },
];
