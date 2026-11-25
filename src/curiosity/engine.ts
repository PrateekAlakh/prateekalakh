import {
  achievements,
  categories,
  type CategoryId,
  type Choice,
  type Progress,
  type Question,
  type StoredAnswer,
} from "./types.ts";

export const STORAGE_KEY = "curiosity-machine-v1";

const categoryIds = new Set(categories.map((category) => category.id));

export function emptyProgress(): Progress {
  return {
    version: 1,
    discovered: [],
    answers: {},
    bookmarks: [],
    achievements: [],
    category: "all",
  };
}

export function isObjective(question: Question): boolean {
  return question.type === "factual" || question.type === "logic";
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function orderChoices(question: Question, random: () => number): Choice[] {
  return shuffle(question.choices, random);
}

function knownIds(questions: readonly Question[]): Set<string> {
  return new Set(questions.map((question) => question.id));
}

function cleanIdList(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item === "string" && allowed.has(item)) seen.add(item);
  }
  return [...seen];
}

export function parseProgress(raw: string | null, questions: readonly Question[]): Progress {
  const blank = emptyProgress();
  if (!raw) return blank;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return blank;
  }
  if (!data || typeof data !== "object") return blank;
  const record = data as Partial<Progress>;
  if (record.version !== 1) return blank;

  const allowed = knownIds(questions);
  const discovered = cleanIdList(record.discovered, allowed);
  const bookmarks = cleanIdList(record.bookmarks, allowed).filter((id) => discovered.includes(id) || allowed.has(id));
  const answers: Record<string, StoredAnswer> = {};
  if (record.answers && typeof record.answers === "object") {
    for (const [id, answer] of Object.entries(record.answers)) {
      if (!allowed.has(id) || !answer || typeof answer !== "object") continue;
      const choiceId = (answer as StoredAnswer).choiceId;
      const question = questions.find((item) => item.id === id);
      if (!question || typeof choiceId !== "string") continue;
      if (!question.choices.some((choice) => choice.id === choiceId)) continue;
      const correct = isObjective(question) ? choiceId === question.correctChoiceId : null;
      answers[id] = { choiceId, correct };
    }
  }
  for (const id of Object.keys(answers)) {
    if (!discovered.includes(id)) discovered.push(id);
  }

  const category = record.category === "all" || (typeof record.category === "string" && categoryIds.has(record.category as CategoryId))
    ? record.category
    : "all";

  const progress: Progress = {
    version: 1,
    discovered,
    answers,
    bookmarks,
    achievements: [],
    category: category ?? "all",
  };
  progress.achievements = earnedIds(progress, questions);
  return progress;
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify(progress);
}

export function inCategory(question: Question, category: CategoryId | "all"): boolean {
  return category === "all" || question.category === category;
}

export function pickQuestion(
  questions: readonly Question[],
  progress: Progress,
  random: () => number,
  currentId?: string,
): Question | undefined {
  const pool = questions.filter((question) => inCategory(question, progress.category));
  if (pool.length === 0) return undefined;
  const unseen = pool.filter((question) => !progress.discovered.includes(question.id));
  const source = unseen.length > 0 ? unseen : pool.filter((question) => question.id !== currentId);
  const choices = source.length > 0 ? source : pool;
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index];
}

export function answerResult(question: Question, choiceId: string): boolean | null {
  if (!question.choices.some((choice) => choice.id === choiceId)) return null;
  if (!isObjective(question)) return null;
  return choiceId === question.correctChoiceId;
}

function countWhere(questions: readonly Question[], progress: Progress, test: (question: Question) => boolean): number {
  return questions.filter((question) => progress.discovered.includes(question.id) && test(question)).length;
}

export function earnedIds(progress: Progress, questions: readonly Question[]): string[] {
  const discovered = progress.discovered.length;
  const facts = countWhere(questions, progress, (question) => question.category === "surprising-facts");
  const thoughts = countWhere(questions, progress, (question) => question.category === "thought-experiments" && progress.answers[question.id] !== undefined);
  const solved = questions.filter((question) => question.category === "logic" && progress.answers[question.id]?.correct === true).length;
  const explored = new Set(
    questions.filter((question) => progress.discovered.includes(question.id)).map((question) => question.category),
  );
  const unlocked = new Set<string>();
  if (discovered >= 1) unlocked.add("curious-one");
  if (discovered >= 10) unlocked.add("rabbit-hole");
  if (facts >= 10) unlocked.add("wait-what");
  if (thoughts >= 10) unlocked.add("philosopher");
  if (solved >= 10) unlocked.add("thinker");
  if (categories.every((category) => explored.has(category.id))) unlocked.add("renaissance");
  if (discovered >= 50) unlocked.add("insatiable");
  if (questions.length > 0 && questions.every((question) => progress.discovered.includes(question.id))) unlocked.add("completionist");
  return achievements.map((item) => item.id).filter((id) => unlocked.has(id));
}

export function recordAnswer(progress: Progress, question: Question, choiceId: string, questions: readonly Question[]): Progress {
  const correct = answerResult(question, choiceId);
  if (correct === null && isObjective(question)) return progress;
  if (!question.choices.some((choice) => choice.id === choiceId)) return progress;
  if (progress.answers[question.id]) return progress;
  const next: Progress = {
    ...progress,
    discovered: progress.discovered.includes(question.id) ? progress.discovered : [...progress.discovered, question.id],
    answers: { ...progress.answers, [question.id]: { choiceId, correct } },
    achievements: [],
  };
  next.achievements = earnedIds(next, questions);
  return next;
}

export function toggleBookmark(progress: Progress, id: string, questions: readonly Question[]): Progress {
  if (!questions.some((question) => question.id === id)) return progress;
  const bookmarks = progress.bookmarks.includes(id)
    ? progress.bookmarks.filter((item) => item !== id)
    : [...progress.bookmarks, id];
  return { ...progress, bookmarks };
}

export function withCategory(progress: Progress, category: CategoryId | "all"): Progress {
  return { ...progress, category };
}

export function factualScore(progress: Progress): { correct: number; answered: number } {
  const answered = Object.values(progress.answers).filter((answer) => answer.correct !== null);
  return {
    answered: answered.length,
    correct: answered.filter((answer) => answer.correct).length,
  };
}

export function bankProblems(questions: readonly Question[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  if (questions.length < 100) problems.push("The bank needs at least 100 questions.");
  for (const category of categories) {
    const count = questions.filter((question) => question.category === category.id).length;
    if (count < 12) problems.push(`${category.label} has ${count} questions.`);
  }
  for (const question of questions) {
    if (ids.has(question.id)) problems.push(`Duplicate id ${question.id}.`);
    ids.add(question.id);
    if (question.prompt.trim().length < 12) problems.push(`${question.id} has a short prompt.`);
    if (question.choices.length < 2) problems.push(`${question.id} needs at least two choices.`);
    const choiceIds = new Set(question.choices.map((choice) => choice.id));
    if (choiceIds.size !== question.choices.length) problems.push(`${question.id} repeats a choice id.`);
    if (isObjective(question)) {
      if (!question.correctChoiceId || !choiceIds.has(question.correctChoiceId)) {
        problems.push(`${question.id} is missing a valid answer.`);
      }
    } else if (question.correctChoiceId) {
      problems.push(`${question.id} is subjective but has a correct answer.`);
    }
    if (question.explanation.trim().length < 40) problems.push(`${question.id} explanation is too thin.`);
    for (const source of question.sources ?? []) {
      if (!source.url.startsWith("https://")) problems.push(`${question.id} has a source without https.`);
    }
  }
  return problems;
}
