import type {
  Archive,
  Condition,
  Discoveries,
  Effect,
  Journal,
  NarrativeNode,
  Preferences,
  Run,
  RunSnapshot,
  SaveFile,
  Story,
} from "./types.ts";

export const STORAGE_KEY = "butterfly-effect-v1";

export function emptyJournal(): Journal {
  return { memories: [], people: [], clues: [], questions: [] };
}

export function emptyDiscoveries(): Discoveries {
  return { endings: [], nodes: [], people: [] };
}

export function emptyPreferences(): Preferences {
  return { size: "m", name: "" };
}

export function emptySave(): SaveFile {
  return {
    version: 1,
    active: null,
    completed: [],
    archives: [],
    discoveries: emptyDiscoveries(),
    preferences: emptyPreferences(),
  };
}

export function storyMap(story: Story): Map<string, NarrativeNode> {
  return new Map(story.nodes.map((node) => [node.id, node]));
}

function cloneJournal(journal: Journal): Journal {
  return {
    memories: [...journal.memories],
    people: journal.people.map((person) => ({ ...person })),
    clues: journal.clues.map((clue) => ({ ...clue })),
    questions: journal.questions.map((question) => ({ ...question })),
  };
}

export function cloneRun(run: Run): Run {
  return {
    nodeId: run.nodeId,
    flags: { ...run.flags },
    stats: { ...run.stats },
    items: [...run.items],
    journal: cloneJournal(run.journal),
    history: run.history.map((entry) => ({ ...entry })),
    checkpoints: run.checkpoints.map((point) => ({
      ...point,
      flags: { ...point.flags },
      stats: { ...point.stats },
      items: [...point.items],
      journal: cloneJournal(point.journal),
      history: point.history.map((entry) => ({ ...entry })),
    })),
    lastMark: run.lastMark,
    endingId: run.endingId,
  };
}

export function meets(condition: Condition | undefined, run: Run, discoveries: Discoveries): boolean {
  if (!condition) return true;
  if ("all" in condition) return condition.all.every((item) => meets(item, run, discoveries));
  if ("any" in condition) return condition.any.some((item) => meets(item, run, discoveries));
  if ("not" in condition) return !meets(condition.not, run, discoveries);
  if ("flag" in condition) return Boolean(run.flags[condition.flag]) === (condition.is ?? true);
  if ("stat" in condition) return (run.stats[condition.stat] ?? 0) >= (condition.gte ?? 0);
  if ("item" in condition) return run.items.includes(condition.item);
  if ("echo" in condition) return discoveries.people.includes(condition.echo);
  if ("endingsAtLeast" in condition) return discoveries.endings.length >= condition.endingsAtLeast;
  if ("seenEnding" in condition) return discoveries.endings.includes(condition.seenEnding);
  return false;
}

function applyEffects(run: Run, effects: Effect[] | undefined): Mark | null {
  let mark: Mark | null = null;
  for (const effect of effects ?? []) {
    if ("flag" in effect) run.flags[effect.flag] = effect.value;
    else if ("stat" in effect) run.stats[effect.stat] = (run.stats[effect.stat] ?? 0) + effect.add;
    else if ("item" in effect && !run.items.includes(effect.item)) run.items.push(effect.item);
    else if ("meet" in effect) run.flags[`met-${effect.meet}`] = true;
    else if ("memory" in effect && !run.journal.memories.includes(effect.memory)) run.journal.memories.push(effect.memory);
    else if ("person" in effect) {
      const existing = run.journal.people.find((person) => person.id === effect.person.id);
      if (existing) existing.note = effect.person.note;
      else run.journal.people.push({ ...effect.person });
      run.flags[`met-${effect.person.id}`] = true;
    } else if ("clue" in effect && !run.journal.clues.some((clue) => clue.id === effect.clue.id)) {
      run.journal.clues.push({ ...effect.clue });
    } else if ("question" in effect && !run.journal.questions.some((question) => question.id === effect.question.id)) {
      run.journal.questions.push({ ...effect.question });
    } else if ("resolve" in effect) {
      run.journal.questions = run.journal.questions.filter((question) => question.id !== effect.resolve);
    } else if ("mark" in effect) mark = effect.mark;
  }
  return mark;
}

function snapshot(run: Run): RunSnapshot {
  return {
    nodeId: run.nodeId,
    flags: { ...run.flags },
    stats: { ...run.stats },
    items: [...run.items],
    journal: cloneJournal(run.journal),
    history: run.history.map((entry) => ({ ...entry })),
  };
}

export function enterNode(story: Story, run: Run, nodeId: string): Run {
  const node = storyMap(story).get(nodeId);
  if (!node) throw new Error(`Missing node ${nodeId}`);
  const next = cloneRun(run);
  next.nodeId = nodeId;
  next.endingId = node.ending ?? null;
  next.lastMark = applyEffects(next, node.effects);
  if (node.meet) next.flags[`met-${node.meet}`] = true;
  return next;
}

function recordCheckpoint(story: Story, run: Run) {
  const node = storyMap(story).get(run.nodeId);
  if (node?.checkpoint && !run.checkpoints.some((point) => point.nodeId === run.nodeId)) {
    run.checkpoints.push(snapshot(run));
  }
}

export function startRun(story: Story): Run {
  const blank: Run = {
    nodeId: story.start,
    flags: {},
    stats: {},
    items: [],
    journal: emptyJournal(),
    history: [],
    checkpoints: [],
    lastMark: null,
    endingId: null,
  };
  const started = enterNode(story, blank, story.start);
  started.history = [{ nodeId: story.start }];
  recordCheckpoint(story, started);
  return started;
}

export function availableChoices(story: Story, run: Run, discoveries: Discoveries) {
  const node = storyMap(story).get(run.nodeId);
  if (!node?.choices) return [];
  return node.choices.filter((choice) => meets(choice.when, run, discoveries));
}

export function choose(story: Story, run: Run, choiceId: string, discoveries: Discoveries): Run {
  if (run.endingId) return run;
  const choice = availableChoices(story, run, discoveries).find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Choice ${choiceId} is not available at ${run.nodeId}`);
  const next = cloneRun(run);
  const mark = applyEffects(next, choice.effects);
  const arrived = enterNode(story, next, choice.to);
  if (mark) arrived.lastMark = mark;
  arrived.history = [...next.history, { nodeId: choice.to, choiceId }];
  recordCheckpoint(story, arrived);
  return arrived;
}

export function restoreCheckpoint(run: Run, nodeId: string): Run | null {
  const point = run.checkpoints.find((item) => item.nodeId === nodeId);
  if (!point) return null;
  return {
    nodeId: point.nodeId,
    flags: { ...point.flags },
    stats: { ...point.stats },
    items: [...point.items],
    journal: cloneJournal(point.journal),
    history: point.history.map((entry) => ({ ...entry })),
    checkpoints: run.checkpoints.filter((item) => point.history.some((entry) => entry.nodeId === item.nodeId) || item.nodeId === point.nodeId),
    lastMark: null,
    endingId: null,
  };
}

export function noteDiscoveries(run: Run, discoveries: Discoveries): Discoveries {
  const nodes = new Set([...discoveries.nodes, ...run.history.map((entry) => entry.nodeId)]);
  const people = new Set(discoveries.people);
  for (const key of Object.keys(run.flags)) {
    if (key.startsWith("met-") && run.flags[key]) people.add(key.slice(4));
  }
  const endings = new Set(discoveries.endings);
  if (run.endingId) endings.add(run.endingId);
  return { nodes: [...nodes], people: [...people], endings: [...endings] };
}

export function walk(story: Story, choiceIds: string[], discoveries = emptyDiscoveries()): Run {
  let run = startRun(story);
  for (const choiceId of choiceIds) run = choose(story, run, choiceId, discoveries);
  return run;
}

export function parseSave(raw: string | null, story: Story): SaveFile {
  const blank = emptySave();
  if (!raw) return blank;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return blank;
  }
  if (!data || typeof data !== "object") return blank;
  const record = data as Partial<SaveFile>;
  if (record.version !== 1) return blank;
  const nodes = storyMap(story);
  const knownEndings = new Set(story.endings.map((ending) => ending.id));
  const discoveries = emptyDiscoveries();
  const source = record.discoveries;
  if (source && typeof source === "object") {
    discoveries.nodes = (source.nodes ?? []).filter((id) => nodes.has(id));
    discoveries.people = (source.people ?? []).filter((id) => typeof id === "string");
    discoveries.endings = (source.endings ?? []).filter((id) => knownEndings.has(id));
  }
  const preferences = emptyPreferences();
  if (record.preferences?.size === "s" || record.preferences?.size === "m" || record.preferences?.size === "l") {
    preferences.size = record.preferences.size;
  }
  if (typeof record.preferences?.name === "string") preferences.name = record.preferences.name.slice(0, 40);
  const active = validRun(record.active, nodes) ? record.active : null;
  const completed = Array.isArray(record.completed)
    ? record.completed.filter((item) => item && knownEndings.has(item.endingId) && typeof item.at === "number")
    : [];
  const archives = validArchives(record.archives, nodes, knownEndings);
  return { version: 1, active, completed, archives, discoveries, preferences };
}

function validArchives(value: Archive[] | undefined, nodes: Map<string, NarrativeNode>, endings: Set<string>): Archive[] {
  if (!Array.isArray(value)) return [];
  const archives: Archive[] = [];
  for (const item of value) {
    if (!item || !endings.has(item.endingId) || typeof item.at !== "number" || !Array.isArray(item.checkpoints)) continue;
    const checkpoints = item.checkpoints.filter((point) => point && nodes.has(point.nodeId) && Array.isArray(point.history));
    archives.push({ endingId: item.endingId, at: item.at, checkpoints });
  }
  return archives.slice(-12);
}

export function branchFromCheckpoint(checkpoints: RunSnapshot[], nodeId: string): Run | null {
  const host: Run = {
    nodeId,
    flags: {},
    stats: {},
    items: [],
    journal: emptyJournal(),
    history: [],
    checkpoints,
    lastMark: null,
    endingId: null,
  };
  return restoreCheckpoint(host, nodeId);
}

function validRun(run: Run | null | undefined, nodes: Map<string, NarrativeNode>): run is Run {
  if (!run || typeof run !== "object") return false;
  if (!nodes.has(run.nodeId)) return false;
  if (!run.journal || !Array.isArray(run.history) || !Array.isArray(run.items)) return false;
  return true;
}

export function serializeSave(save: SaveFile): string {
  return JSON.stringify(save);
}

export interface StoryReport {
  errors: string[];
  nodes: number;
  decisions: number;
  endings: number;
  chapters: number;
}

export function validateStory(story: Story): StoryReport {
  const errors: string[] = [];
  const nodes = storyMap(story);
  if (nodes.size !== story.nodes.length) errors.push("Node ids are not unique.");
  if (!nodes.has(story.start)) errors.push("The opening node is missing.");
  const chapterIds = new Set(story.chapters.map((chapter) => chapter.id));
  const endingIds = new Set(story.endings.map((ending) => ending.id));
  if (story.chapters.length < 8 || story.chapters.length > 12) errors.push("Chapter count is outside 8–12.");
  let decisions = 0;
  for (const node of story.nodes) {
    if (!chapterIds.has(node.chapter)) errors.push(`${node.id} uses an unknown chapter.`);
    if (!node.body.length) errors.push(`${node.id} has no prose.`);
    if (node.ending && !endingIds.has(node.ending)) errors.push(`${node.id} points at an unknown ending.`);
    const choices = node.choices ?? [];
    if (!node.ending && choices.length === 0) errors.push(`${node.id} is a dead end.`);
    if (node.ending && choices.length > 0) errors.push(`${node.id} is an ending with leftover choices.`);
    if (choices.length >= 2) decisions += 1;
    const seen = new Set<string>();
    for (const choice of choices) {
      if (seen.has(choice.id)) errors.push(`${node.id} repeats choice ${choice.id}.`);
      seen.add(choice.id);
      if (!nodes.has(choice.to)) errors.push(`${node.id} choice ${choice.id} leads nowhere.`);
    }
  }
  for (const ending of story.endings) {
    if (!story.nodes.some((node) => node.ending === ending.id)) errors.push(`${ending.id} is never reached by a node.`);
  }
  const loops = findBadLoops(story);
  errors.push(...loops);
  return { errors, nodes: story.nodes.length, decisions, endings: story.endings.length, chapters: story.chapters.length };
}

function findBadLoops(story: Story): string[] {
  const nodes = storyMap(story);
  const errors: string[] = [];
  const stack: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (stack.includes(id)) {
      const cycle = stack.slice(stack.indexOf(id));
      if (cycle.every((item) => nodes.get(item)?.allowLoop)) return;
      errors.push(`Unmarked loop: ${cycle.join(" -> ")}`);
      return;
    }
    if (seen.has(id)) return;
    seen.add(id);
    stack.push(id);
    for (const choice of nodes.get(id)?.choices ?? []) visit(choice.to);
    stack.pop();
  };
  visit(story.start);
  for (const node of story.nodes) {
    if (!seen.has(node.id)) errors.push(`${node.id} cannot be reached from the opening, even ignoring conditions.`);
  }
  return errors;
}

export function visitedChapters(story: Story, discoveries: Discoveries): Set<string> {
  const nodes = storyMap(story);
  const chapters = new Set<string>();
  for (const id of discoveries.nodes) {
    const chapter = nodes.get(id)?.chapter;
    if (chapter) chapters.add(chapter);
  }
  return chapters;
}
