import {
  STORAGE_KEY,
  availableChoices,
  branchFromCheckpoint,
  choose,
  emptySave,
  meets,
  noteDiscoveries,
  parseSave,
  serializeSave,
  startRun,
  storyMap,
} from "./engine.ts";
import { story } from "./story/index.ts";
import type { NarrativeNode, Run, RunSnapshot, SaveFile } from "./types.ts";

const nodes = storyMap(story);

export function mount(root: HTMLElement) {
  let memoryOnly = false;
  let save = readSave();
  let panel: "journal" | "map" | null = null;
  let screen: "gate" | "play" = "gate";
  let notice = "";

  if (save.active?.endingId) settle(save.active);

  const shell = document.createElement("div");
  shell.className = "be";
  root.replaceChildren(shell);

  function readSave(): SaveFile {
    try {
      return parseSave(localStorage.getItem(STORAGE_KEY), story);
    } catch {
      memoryOnly = true;
      return emptySave();
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, serializeSave(save));
      if (!memoryOnly) notice = "Saved on this device.";
    } catch {
      memoryOnly = true;
      notice = "This browser can’t keep the story. It will last until you leave the page.";
    }
  }

  function settle(run: Run) {
    if (!run.endingId) return;
    save.discoveries = noteDiscoveries(run, save.discoveries);
    save.archives.push({ endingId: run.endingId, at: Date.now(), checkpoints: run.checkpoints });
    save.archives = save.archives.slice(-12);
    if (!save.completed.some((item) => item.endingId === run.endingId)) {
      save.completed.push({ endingId: run.endingId, at: Date.now() });
    }
  }

  function render() {
    shell.dataset.size = save.preferences.size;
    shell.replaceChildren();
    if (screen === "gate" || !save.active) renderGate();
    else if (save.active.endingId) renderEnding(save.active);
    else renderStory(save.active);
  }

  function renderGate() {
    const chapter = el("p", "be-kicker", "A story");
    const title = el("h1", "be-title", "The Butterfly Effect");
    const line = el("p", "be-lead", "It began like any other morning.");
    const caution = el(
      "p",
      "be-note",
      "This story includes psychological tension, grief, and choices you may regret. Nothing is timed. You can leave whenever you want. What you choose stays on this device.",
    );
    const name = document.createElement("label");
    name.className = "be-name";
    name.append(document.createTextNode("A name, if you want one. The story won’t require it."));
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 40;
    input.value = save.preferences.name;
    input.autocomplete = "nickname";
    input.setAttribute("aria-label", "Optional name");
    name.append(input);

    const actions = document.createElement("div");
    actions.className = "be-actions";
    if (save.active && !save.active.endingId) {
      const resume = button("Continue your story", () => {
        save.preferences.name = input.value.trim().slice(0, 40);
        screen = "play";
        panel = null;
        persist();
        render();
      });
      resume.classList.add("be-primary");
      actions.append(resume);
    }
    if (save.active?.endingId) {
      actions.append(
        button("Read this ending", () => {
          screen = "play";
          panel = null;
          render();
        }),
      );
    }
    const begin = button(save.active || save.discoveries.endings.length ? "Start a new timeline" : "Begin your story", () => {
      if (save.active && !save.active.endingId && !window.confirm("Start a new morning? This unfinished one will be replaced. Finished mornings stay.")) return;
      save.preferences.name = input.value.trim().slice(0, 40);
      save.active = startRun(story);
      screen = "play";
      panel = null;
      persist();
      render();
    });
    if (!save.active || save.active.endingId) begin.classList.add("be-primary");
    actions.append(begin);

    if (save.discoveries.endings.length) {
      actions.append(
        button("Explore discovered timelines", () => {
          panel = "map";
          render();
        }),
      );
    }

    const tools = renderTools(false);
    shell.append(chapter, title, line, caution, name, actions, tools, statusLine());
    if (panel === "map") {
      const map = document.createElement("section");
      map.className = "be-panel";
      map.append(
        button("Close the map", () => {
          panel = null;
          render();
        }),
      );
      renderMap(map);
      shell.append(map);
    }
    if (memoryOnly) shell.append(el("p", "be-status", "Progress can’t be retained in this browser."));
  }

  function renderStory(run: Run) {
    const node = nodes.get(run.nodeId);
    if (!node) {
      save.active = null;
      screen = "gate";
      persist();
      render();
      return;
    }
    const chapter = story.chapters.find((item) => item.id === node.chapter);
    shell.append(renderTools(true));
    const head = document.createElement("header");
    head.className = "be-head";
    const heading = el("h1", "be-chapter", chapter?.title ?? "The story");
    heading.id = "be-now";
    heading.tabIndex = -1;
    head.append(heading);
    const where = [node.time, node.place].filter(Boolean).join(" · ");
    if (where) head.append(el("p", "be-where", where));
    if (save.preferences.name) head.append(el("p", "be-where", save.preferences.name));
    shell.append(head);

    const prose = document.createElement("div");
    prose.className = "be-prose";
    prose.setAttribute("aria-live", "polite");
    for (const paragraph of node.body) prose.append(el("p", "", paragraph));
    shell.append(prose);

    if (node.dialogue?.length) {
      const talk = document.createElement("div");
      talk.className = "be-talk";
      for (const line of node.dialogue) {
        const block = document.createElement("blockquote");
        block.append(el("p", "", line.line));
        block.append(el("cite", "", line.speaker));
        talk.append(block);
      }
      shell.append(talk);
    }

    if (run.lastMark === "changed") shell.append(el("p", "be-mark", "Something has changed."));
    if (run.lastMark === "matters") shell.append(el("p", "be-mark", "This moment will matter."));

    const choices = document.createElement("div");
    choices.className = "be-choices";
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "Choices");
    for (const choice of availableChoices(story, run, save.discoveries)) {
      const choiceButton = button(choice.label, () => {
        if (!save.active || save.active.endingId) return;
        save.active = choose(story, save.active, choice.id, save.discoveries);
        panel = null;
        if (save.active.endingId) settle(save.active);
        persist();
        render();
        focusNow();
      });
      choices.append(choiceButton);
    }
    shell.append(choices, statusLine());
    if (panel) renderPanel(node);
    else focusNow();
  }

  function renderEnding(run: Run) {
    const node = nodes.get(run.nodeId);
    const ending = story.endings.find((item) => item.id === run.endingId);
    shell.append(renderTools(false));
    shell.append(el("p", "be-kicker", "An ending"));
    const heading = el("h1", "be-title", ending?.title ?? "An ending");
    heading.id = "be-now";
    heading.tabIndex = -1;
    shell.append(heading);
    const prose = document.createElement("div");
    prose.className = "be-prose";
    for (const paragraph of node?.body ?? []) prose.append(el("p", "", paragraph));
    shell.append(prose);
    const reflections = (node?.reflections ?? []).filter((item) => meets(item.when, run, save.discoveries));
    if (reflections.length) {
      const list = document.createElement("ul");
      list.className = "be-reflect";
      for (const item of reflections) list.append(el("li", "", item.text));
      shell.append(el("p", "be-kicker", "What stayed with you"), list);
    }
    shell.append(el("p", "be-note", `${save.discoveries.endings.length} ending${save.discoveries.endings.length === 1 ? "" : "s"} discovered.`));
    const actions = document.createElement("div");
    actions.className = "be-actions";
    actions.append(
      button("Begin another timeline", () => {
        save.active = startRun(story);
        screen = "play";
        panel = null;
        persist();
        render();
      }),
      button("Explore the timeline map", () => {
        panel = "map";
        render();
      }),
    );
    shell.append(actions, statusLine());
    if (panel) renderPanel(node);
    else focusNow();
  }

  function renderPanel(node: NarrativeNode | undefined) {
    const panelRoot = document.createElement("section");
    panelRoot.className = "be-panel";
    panelRoot.tabIndex = -1;
    const close = button("Back to the story", () => {
      panel = null;
      render();
    });
    panelRoot.append(close);
    if (panel === "journal") renderJournal(panelRoot, node);
    if (panel === "map") renderMap(panelRoot);
    shell.append(panelRoot);
    close.focus();
  }

  function renderJournal(panelRoot: HTMLElement, node: NarrativeNode | undefined) {
    const journal = save.active?.journal;
    panelRoot.append(el("h2", "be-chapter", "Journal"));
    section(panelRoot, "Memories", journal?.memories.length ? journal.memories : ["Nothing written down yet."]);
    const people = journal?.people.map((person) => `${person.name}. ${person.note}`) ?? [];
    section(panelRoot, "People", people.length ? people : ["You haven’t met anyone the journal can name."]);
    const clues = journal?.clues.map((clue) => `${clue.title}. ${clue.detail}`) ?? [];
    section(panelRoot, "Clues", clues.length ? clues : ["No clues yet."]);
    const questions = journal?.questions.map((question) => question.text) ?? [];
    section(panelRoot, "Unanswered questions", questions.length ? questions : ["Nothing filed here."]);
    if (node) panelRoot.append(el("p", "be-note", "The journal only keeps what this morning has shown you."));
  }

  function renderMap(panelRoot: HTMLElement) {
    panelRoot.append(el("h2", "be-chapter", "Timelines"));
    panelRoot.append(el("p", "be-note", "Each morning you finish stays here. A return starts a branch. It does not erase the one you lived."));
    const list = document.createElement("ol");
    list.className = "be-map";
    for (const chapter of story.chapters) {
      const seen = save.discoveries.nodes.some((id) => nodes.get(id)?.chapter === chapter.id);
      const item = document.createElement("li");
      if (!seen) {
        item.textContent = "Still unopened.";
      } else {
        item.append(el("strong", "", chapter.title));
        const points = checkpointsIn(chapter.id);
        if (points.length) {
          const inner = document.createElement("ul");
          for (const point of points) {
            const row = document.createElement("li");
            const place = nodes.get(point.snapshot.nodeId);
            row.append(document.createTextNode(place?.place || place?.time || "A place you stood."));
            row.append(
              button("Return here", () => {
                const branched = branchFromCheckpoint(point.checkpoints, point.snapshot.nodeId);
                if (!branched) return;
                save.active = branched;
                screen = "play";
                panel = null;
                persist();
                render();
              }),
            );
            inner.append(row);
          }
          item.append(inner);
        }
      }
      list.append(item);
    }
    panelRoot.append(list);
    const lived = save.discoveries.endings
      .map((id) => story.endings.find((ending) => ending.id === id)?.title)
      .filter((title): title is string => Boolean(title));
    panelRoot.append(el("h2", "be-chapter", "Endings you’ve lived"));
    if (!lived.length) panelRoot.append(el("p", "be-note", "Finish a morning and it will be named here."));
    else {
      const endings = document.createElement("ul");
      endings.className = "be-reflect";
      for (const title of lived) endings.append(el("li", "", title));
      panelRoot.append(endings);
    }
  }

  function checkpointsIn(chapterId: string): { snapshot: RunSnapshot; checkpoints: RunSnapshot[] }[] {
    const sources: RunSnapshot[][] = [];
    if (save.active) sources.push(save.active.checkpoints);
    for (const archive of save.archives) sources.push(archive.checkpoints);
    const found: { snapshot: RunSnapshot; checkpoints: RunSnapshot[] }[] = [];
    const used = new Set<string>();
    for (const checkpoints of sources) {
      for (const snapshot of checkpoints) {
        if (nodes.get(snapshot.nodeId)?.chapter !== chapterId) continue;
        if (!save.discoveries.nodes.includes(snapshot.nodeId) && save.active?.nodeId !== snapshot.nodeId) continue;
        const key = `${snapshot.nodeId}:${snapshot.history.length}`;
        if (used.has(key)) continue;
        used.add(key);
        found.push({ snapshot, checkpoints });
      }
    }
    return found;
  }

  function renderTools(compact: boolean) {
    const bar = document.createElement("div");
    bar.className = "be-tools";
    if (save.active && screen === "play") {
      bar.append(
        button("Journal", () => {
          panel = panel === "journal" ? null : "journal";
          render();
        }),
      );
      if (save.discoveries.endings.length || save.active.endingId) {
        bar.append(
          button("Timelines", () => {
            panel = panel === "map" ? null : "map";
            render();
          }),
        );
      }
    }
    const sizes = document.createElement("div");
    sizes.className = "be-sizes";
    sizes.setAttribute("role", "group");
    sizes.setAttribute("aria-label", "Reading size");
    for (const size of ["s", "m", "l"] as const) {
      const sizeButton = button(size === "s" ? "Smaller type" : size === "m" ? "Default type" : "Larger type", () => {
        save.preferences.size = size;
        persist();
        render();
      });
      sizeButton.setAttribute("aria-pressed", String(save.preferences.size === size));
      sizes.append(sizeButton);
    }
    bar.append(sizes);
    if (!compact) {
      bar.append(fileButtons());
    }
    return bar;
  }

  function fileButtons() {
    const group = document.createElement("div");
    group.className = "be-sizes";
    group.append(
      button("Export", () => {
        const blob = new Blob([serializeSave(save)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "butterfly-effect.json";
        link.click();
        URL.revokeObjectURL(url);
      }),
      button("Import", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.addEventListener("change", () => {
          const file = input.files?.[0];
          if (!file) return;
          file.text().then((raw) => {
            if (!window.confirm("Replace the story on this device with the file?")) return;
            const next = parseSave(raw, story);
            if (!next.active && !next.discoveries.endings.length && !next.discoveries.nodes.length) {
              notice = "That file didn’t contain a story this page could read.";
              render();
              return;
            }
            save = next;
            screen = next.active ? "play" : "gate";
            panel = null;
            persist();
            render();
          });
        });
        input.click();
      }),
      button("Erase progress", () => {
        if (!window.confirm("Erase this story from this browser? An exported file won’t be deleted.")) return;
        const preferences = save.preferences;
        save = emptySave();
        save.preferences = preferences;
        screen = "gate";
        panel = null;
        persist();
        render();
      }),
    );
    return group;
  }

  function statusLine() {
    const text = memoryOnly
      ? "Progress can’t be retained in this browser."
      : notice || (save.active ? "Saved on this device." : "Nothing is sent anywhere.");
    const line = el("p", "be-status", text);
    line.setAttribute("role", "status");
    return line;
  }

  function focusNow() {
    const heading = shell.querySelector<HTMLElement>("#be-now");
    heading?.focus();
  }

  render();
}

function section(parent: HTMLElement, title: string, lines: string[]) {
  parent.append(el("h3", "", title));
  const list = document.createElement("ul");
  list.className = "be-journal";
  for (const line of lines) list.append(el("li", "", line));
  parent.append(list);
}

function button(label: string, onClick: () => void) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
}

function el(tag: string, className: string, text: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}
