import {
  answerResult,
  emptyProgress,
  factualScore,
  isObjective,
  inCategory,
  orderChoices,
  parseProgress,
  pickQuestion,
  recordAnswer,
  serializeProgress,
  STORAGE_KEY,
  toggleBookmark,
  withCategory,
} from "./engine";
import { questions } from "./questions";
import { achievements, categories, type Achievement, type CategoryId, type Progress, type Question } from "./types";

const notes = [
  "Well. That took a turn.",
  "The universe is showing off again.",
  "File this under: wait, really?",
  "Curiosity looks good on you.",
  "One more couldn't hurt.",
  "Careful. Rabbit holes have good lighting in here.",
];

function noteFor(id: string): string {
  let index = 0;
  for (const character of id) index = (index + character.charCodeAt(0)) % notes.length;
  return notes[index];
}

function loadProgress(): Progress {
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY), questions);
  } catch {
    return emptyProgress();
  }
}

function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeProgress(progress));
  } catch {
    // The machine still works for this visit.
  }
}

function categoryLabel(id: CategoryId): string {
  return categories.find((category) => category.id === id)?.label ?? id;
}

export function startCuriosity(root: HTMLElement): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let progress = loadProgress();
  const requested = questions.find((question) => question.id === window.location.hash.replace("#", ""));
  if (requested && !inCategory(requested, progress.category)) progress = { ...progress, category: "all" };
  let current = requested ?? pickQuestion(questions, progress, Math.random);
  let choices = current ? orderChoices(current, Math.random) : [];
  let revealed = Boolean(current && progress.answers[current.id]);

  const live = document.createElement("p");
  live.className = "cm-live";
  live.setAttribute("aria-live", "polite");
  root.append(live);

  const filters = document.createElement("div");
  filters.className = "cm-filters";
  filters.setAttribute("role", "toolbar");
  filters.setAttribute("aria-label", "Categories");
  root.append(filters);

  const card = document.createElement("article");
  card.className = "cm-card";
  card.tabIndex = -1;
  root.append(card);

  const meta = document.createElement("div");
  meta.className = "cm-meta";
  root.append(meta);

  const trail = document.createElement("details");
  trail.className = "cm-history";
  trail.innerHTML = `<summary>Previously discovered</summary><div class="cm-history-list"></div>`;
  root.append(trail);

  const marks = document.createElement("details");
  marks.className = "cm-marks";
  marks.innerHTML = `<summary>Marks along the way</summary><ul></ul>`;
  root.append(marks);

  const resetDialog = document.createElement("dialog");
  resetDialog.className = "cm-dialog";
  resetDialog.innerHTML = `
    <form method="dialog">
      <h2>Clear this trail?</h2>
      <p>This removes discovered questions, bookmarks, and marks stored in this browser.</p>
      <div class="cm-dialog-actions">
        <button class="button" value="keep" type="submit">Keep them</button>
        <button class="cm-quiet" value="clear" type="submit">Clear</button>
      </div>
    </form>
  `;
  root.append(resetDialog);

  function say(message: string): void {
    live.textContent = message;
  }

  function show(question: Question, nextChoices = orderChoices(question, Math.random)): void {
    current = question;
    choices = nextChoices;
    revealed = Boolean(progress.answers[question.id]);
    const url = new URL(window.location.href);
    url.hash = question.id;
    window.history.replaceState(null, "", url);
    render();
    if (!reduceMotion) card.focus();
  }

  function renderFilters(): void {
    filters.replaceChildren();
    const options: Array<{ id: CategoryId | "all"; label: string }> = [{ id: "all", label: "All" }, ...categories];
    for (const option of options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cm-chip";
      button.textContent = option.label;
      button.setAttribute("aria-pressed", String(progress.category === option.id));
      button.addEventListener("click", () => {
        progress = withCategory(progress, option.id);
        saveProgress(progress);
        const next = pickQuestion(questions, progress, Math.random, current?.id);
        if (next) show(next);
        else render();
      });
      filters.append(button);
    }
  }

  function renderCard(): void {
    card.replaceChildren();
    if (!current) {
      const empty = document.createElement("p");
      empty.textContent = "Nothing in this category yet.";
      card.append(empty);
      return;
    }
    const answer = progress.answers[current.id];
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = categoryLabel(current.category);
    const title = document.createElement("h2");
    title.textContent = current.prompt;
    const group = document.createElement("div");
    group.className = "cm-choices";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Answers");

    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cm-choice";
      button.textContent = choice.label;
      const selected = answer?.choiceId === choice.id;
      const correct = isObjective(current) && choice.id === current.correctChoiceId;
      if (revealed && correct) button.classList.add("is-correct");
      if (revealed && selected) button.classList.add("is-selected");
      if (revealed && selected && answer?.correct === false) button.classList.add("is-miss");
      if (revealed) button.disabled = true;
      button.addEventListener("click", () => choose(choice.id));
      group.append(button);
    }

    card.append(eyebrow, title, group);

    if (revealed && answer) {
      const reveal = document.createElement("div");
      reveal.className = "cm-reveal";
      const kicker = document.createElement("p");
      kicker.className = "kicker";
      if (!isObjective(current)) kicker.textContent = "No wrong door here.";
      else if (answer.correct) kicker.textContent = "There it is.";
      else kicker.textContent = "Lovely guess. Here's the fun part.";
      const aside = document.createElement("p");
      aside.className = "cm-note";
      aside.textContent = noteFor(current.id);
      const body = document.createElement("p");
      body.textContent = current.explanation;
      reveal.append(kicker, aside, body);
      if (current.followUp) {
        const extra = document.createElement("p");
        extra.textContent = current.followUp;
        reveal.append(extra);
      }
      if (current.sources?.length) {
        const sources = document.createElement("p");
        sources.className = "cm-sources";
        sources.append("Further reading: ");
        current.sources.forEach((source, index) => {
          if (index > 0) sources.append(", ");
          const link = document.createElement("a");
          link.href = source.url;
          link.textContent = source.title;
          link.rel = "noreferrer";
          link.target = "_blank";
          sources.append(link);
        });
        reveal.append(sources);
      }
      card.append(reveal);
    }

    const actions = document.createElement("div");
    actions.className = "cm-actions";
    const again = document.createElement("button");
    again.type = "button";
    again.className = "button";
    again.textContent = "Surprise me again";
    again.addEventListener("click", () => {
      const next = pickQuestion(questions, progress, Math.random, current?.id);
      if (next) show(next);
    });
    const bookmark = document.createElement("button");
    bookmark.type = "button";
    bookmark.className = "cm-quiet";
    const saved = progress.bookmarks.includes(current.id);
    bookmark.textContent = saved ? "Bookmarked" : "Bookmark";
    bookmark.setAttribute("aria-pressed", String(saved));
    bookmark.addEventListener("click", () => {
      if (!current) return;
      progress = toggleBookmark(progress, current.id, questions);
      saveProgress(progress);
      say(progress.bookmarks.includes(current.id) ? "Bookmarked." : "Bookmark removed.");
      render();
    });
    actions.append(again, bookmark);
    card.append(actions);
  }

  function renderMeta(): void {
    const score = factualScore(progress);
    const pool = questions.filter((question) => progress.category === "all" || question.category === progress.category);
    const seen = pool.filter((question) => progress.discovered.includes(question.id)).length;
    meta.replaceChildren();
    const progressLine = document.createElement("p");
    progressLine.textContent = `${seen} of ${pool.length} discovered here`;
    if (score.answered > 0) {
      const facts = document.createElement("span");
      facts.textContent = ` · ${score.correct} of ${score.answered} settled answers`;
      progressLine.append(facts);
    }
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "cm-text";
    clear.textContent = "Clear my trail";
    clear.addEventListener("click", () => resetDialog.showModal());
    meta.append(progressLine, clear);

    const list = trail.querySelector<HTMLElement>(".cm-history-list");
    if (!list) return;
    list.replaceChildren();
    const discovered = questions.filter((question) => progress.discovered.includes(question.id));
    if (discovered.length === 0) {
      const none = document.createElement("p");
      none.textContent = "Questions you answer will wait here.";
      list.append(none);
    }
    for (const question of discovered) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question.prompt;
      if (progress.bookmarks.includes(question.id)) button.dataset.saved = "true";
      button.addEventListener("click", () => {
        const known = progress.answers[question.id];
        const nextChoices = orderChoices(question, Math.random);
        if (known) {
          nextChoices.sort((a, b) => Number(b.id === known.choiceId) - Number(a.id === known.choiceId));
        }
        show(question, nextChoices);
      });
      list.append(button);
    }

    const achievementList = marks.querySelector("ul");
    if (!achievementList) return;
    achievementList.replaceChildren();
    const unlocked = achievements.filter((item) => progress.achievements.includes(item.id));
    if (unlocked.length === 0) {
      const item = document.createElement("li");
      item.className = "is-waiting";
      item.textContent = "Marks show up as you wander. They are not a score.";
      achievementList.append(item);
      return;
    }
    for (const achievement of unlocked) {
      const item = document.createElement("li");
      item.textContent = `${achievement.title}. ${achievement.detail}`;
      achievementList.append(item);
    }
  }

  function render(): void {
    renderFilters();
    renderCard();
    renderMeta();
  }

  function choose(choiceId: string): void {
    if (!current || revealed) return;
    const before = new Set(progress.achievements);
    progress = recordAnswer(progress, current, choiceId, questions);
    saveProgress(progress);
    revealed = true;
    const result = answerResult(current, choiceId);
    const fresh = achievements
      .filter((item): item is Achievement => progress.achievements.includes(item.id) && !before.has(item.id))
      .map((item) => item.title);
    const lead = result === null ? "Kept. No score on this one." : result ? "There it is." : "Lovely guess.";
    say(fresh.length ? `${lead} ${fresh.join(", ")}.` : lead);
    render();
  }

  resetDialog.addEventListener("close", () => {
    if (resetDialog.returnValue !== "clear") return;
    progress = emptyProgress();
    saveProgress(progress);
    const next = pickQuestion(questions, progress, Math.random);
    say("Trail cleared.");
    if (next) show(next);
  });

  render();
  if (current && !progress.answers[current.id]) say("A question is ready.");
}
