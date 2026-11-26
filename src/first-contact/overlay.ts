import "./first-contact.css";
import { earthTransmission, planetById, planets, signalTransmission, type PlanetId } from "./planetData";
import { runTerminal } from "./terminal";
import type { UniversePick, UniverseScene } from "./universe";

const SEEN_KEY = "fc-seen";
const visits = new Map<PlanetId, number>();

let openOverlay: FirstContact | null = null;

export function openFirstContact(trigger: HTMLElement) {
  if (openOverlay) return;
  openOverlay = new FirstContact(trigger);
  void openOverlay.start();
}

class FirstContact {
  private readonly root: HTMLElement;
  private readonly reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private readonly scrollY = window.scrollY;
  private scene: UniverseScene | null = null;
  private terminal: ReturnType<typeof runTerminal> | null = null;
  private replaying = false;
  private hintTimer = 0;
  private previousFocus: HTMLElement;
  private readonly hintText = window.matchMedia("(pointer: coarse)").matches
    ? "Drag to look around. Pinch to move closer. Tap a world."
    : "Drag to look around. Scroll to move closer. Arrows choose a world.";

  constructor(private readonly trigger: HTMLElement) {
    this.previousFocus = trigger;
    this.root = document.createElement("div");
    this.root.className = "fc";
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-modal", "true");
    this.root.setAttribute("aria-label", "Project First Contact");
    this.root.innerHTML = `
      <button class="fc-close" type="button">Close</button>
      <button class="fc-skip" type="button">Skip intro</button>
      <button class="fc-replay" type="button" hidden>Replay the signal</button>
      <div class="fc-terminal">
        <div class="fc-screen">
          <div class="fc-wave" aria-hidden="true">${"<span></span>".repeat(14)}</div>
          <div class="fc-log"></div>
          <div class="fc-note" hidden>
            <p class="fc-kicker">Alien transmission</p>
            <strong>We've been trying to reach you about your spaceship's extended warranty.</strong>
          </div>
        </div>
      </div>
      <canvas class="fc-canvas" hidden></canvas>
      <div class="fc-fallback" hidden>
        <div class="fc-screen"></div>
      </div>
      <div class="fc-slip" hidden aria-live="polite"></div>
      <p class="fc-hint" hidden>${this.hintText}</p>
    `;
    document.body.append(this.root);
  }

  async start() {
    document.body.style.position = "fixed";
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    this.root.querySelector<HTMLButtonElement>(".fc-close")?.focus();
    this.root.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKey);

    const seen = readSeen();
    if (seen) {
      this.hideTerminal();
      await this.enterUniverse();
      return;
    }

    const log = this.root.querySelector<HTMLElement>(".fc-log");
    const note = this.root.querySelector<HTMLElement>(".fc-note");
    const shell = this.root.querySelector<HTMLElement>(".fc-terminal");
    if (!log || !note || !shell) return;
    this.terminal = runTerminal(log, note, shell, this.reduceMotion);
    const ending = await this.terminal.finished;
    this.terminal = null;
    if (ending === "close" || openOverlay !== this) return;
    rememberSeen();
    shell.classList.add("is-leaving");
    await wait(this.reduceMotion ? 0 : 700);
    if (openOverlay !== this) return;
    this.hideTerminal();
    await this.enterUniverse();
  }

  private onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest(".fc-close")) {
      this.close();
      return;
    }
    if (target.closest(".fc-skip")) {
      this.terminal?.skip();
      return;
    }
    if (target.closest(".fc-replay")) {
      void this.replay();
      return;
    }
    if (target.closest(".fc-back")) {
      this.scene?.focusPlanet(null);
      this.hideSlip();
      return;
    }
    const choice = target.closest<HTMLElement>("[data-planet]");
    if (choice?.dataset.planet) this.showPlanet(choice.dataset.planet as PlanetId | "earth");
  };

  private onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === "Tab") {
      this.trapFocus(event);
      return;
    }
    if (!this.scene) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      this.scene.focusNext(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  private trapFocus(event: KeyboardEvent) {
    const items = [...this.root.querySelectorAll<HTMLElement>("button:not([hidden])")];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !this.root.contains(active))) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private hideTerminal() {
    const terminal = this.root.querySelector<HTMLElement>(".fc-terminal");
    const skip = this.root.querySelector<HTMLElement>(".fc-skip");
    if (terminal) terminal.hidden = true;
    if (skip) skip.hidden = true;
  }

  private async enterUniverse() {
    const hint = this.root.querySelector<HTMLElement>(".fc-hint");
    if (hint) {
      hint.hidden = false;
      hint.textContent = this.hintText;
      hint.classList.remove("is-quiet");
    }
    const replay = this.root.querySelector<HTMLElement>(".fc-replay");
    let canvas: HTMLCanvasElement | undefined;
    try {
      if (!canUseWebGL()) {
        this.showFallback();
        return;
      }
      const { UniverseScene } = await import("./universe");
      if (openOverlay !== this) return;
      canvas = mountCanvas(this.root);
      this.scene = new UniverseScene(
        canvas,
        (pick) => this.onPick(pick),
        this.reduceMotion,
        (label) => this.glance(label),
        () => this.release(),
      );
    } catch {
      canvas?.remove();
      if (openOverlay === this) this.showFallback();
      return;
    } finally {
      if (replay && openOverlay === this) replay.hidden = false;
    }
    window.clearTimeout(this.hintTimer);
    if (!this.reduceMotion) {
      this.hintTimer = window.setTimeout(() => this.quietHint(), 6500);
    }
  }

  private glance(label: string | null) {
    const hint = this.root.querySelector<HTMLElement>(".fc-hint");
    if (!hint || hint.hidden) return;
    hint.textContent = label ?? this.hintText;
    hint.classList.toggle("is-quiet", !label && hint.classList.contains("is-quiet"));
    if (label) hint.classList.remove("is-quiet");
  }

  private quietHint() {
    const hint = this.root.querySelector<HTMLElement>(".fc-hint");
    if (!hint || hint.hidden || hint.textContent !== this.hintText) return;
    hint.classList.add("is-quiet");
  }

  private release() {
    const slip = this.root.querySelector<HTMLElement>(".fc-slip");
    if (!slip || slip.hidden) return;
    this.scene?.focusPlanet(null);
    this.hideSlip();
  }

  private showFallback() {
    const fallback = this.root.querySelector<HTMLElement>(".fc-fallback");
    const screen = fallback?.querySelector(".fc-screen");
    if (!fallback || !screen) return;
    screen.innerHTML = planets
      .map(
        (planet) => `
          <button type="button" data-planet="${planet.id}">
            <strong>${planet.name}</strong>
            <span>${planet.transmission}</span>
          </button>
        `,
      )
      .join("");
    const earth = document.createElement("button");
    earth.type = "button";
    earth.dataset.planet = "earth";
    earth.innerHTML = "<strong>A faint blue world</strong><span>Someone left a signal pointing the other way.</span>";
    screen.append(earth);
    fallback.hidden = false;
    const hint = this.root.querySelector<HTMLElement>(".fc-hint");
    if (hint) hint.textContent = "Choose a world to read its transmission.";
  }

  private onPick(pick: UniversePick) {
    if (pick.kind === "planet") {
      this.showPlanet(pick.id);
      return;
    }
    if (pick.kind === "earth") {
      this.showSlip("Earth", earthTransmission, "The reply arrives with the enthusiasm of a hold message.");
      return;
    }
    this.showSlip("Unidentified signal", signalTransmission, "It fades again, as if the apology was the whole message.");
  }

  private showPlanet(id: PlanetId | "earth") {
    if (id === "earth") {
      this.showSlip("Earth", earthTransmission, "The reply arrives with the enthusiasm of a hold message.");
      return;
    }
    const planet = planetById(id);
    const count = (visits.get(id) ?? 0) + 1;
    visits.set(id, count);
    this.scene?.focusPlanet(id);
    this.showSlip(planet.name, count > 1 ? planet.encore : planet.transmission, planet.detail);
  }

  private showSlip(title: string, line: string, detail: string) {
    const slip = this.root.querySelector<HTMLElement>(".fc-slip");
    const hint = this.root.querySelector<HTMLElement>(".fc-hint");
    if (!slip) return;
    slip.hidden = false;
    if (hint) hint.hidden = true;
    slip.innerHTML = `
      <p class="fc-kicker">Transmission</p>
      <h2>${title}</h2>
      <p>${line}</p>
      <p>${detail}</p>
      <button class="fc-back" type="button">Pull back</button>
    `;
  }

  private hideSlip() {
    const slip = this.root.querySelector<HTMLElement>(".fc-slip");
    const hint = this.root.querySelector<HTMLElement>(".fc-hint");
    if (slip) slip.hidden = true;
    if (hint && this.scene) {
      hint.hidden = false;
      hint.textContent = this.hintText;
    }
  }

  private async replay() {
    if (this.replaying) return;
    this.replaying = true;
    try {
      window.clearTimeout(this.hintTimer);
      this.scene?.dispose();
      this.scene = null;
      this.hideSlip();
      const canvas = this.root.querySelector<HTMLCanvasElement>(".fc-canvas");
      const fallback = this.root.querySelector<HTMLElement>(".fc-fallback");
      const hint = this.root.querySelector<HTMLElement>(".fc-hint");
      const replay = this.root.querySelector<HTMLElement>(".fc-replay");
      const skip = this.root.querySelector<HTMLElement>(".fc-skip");
      const shell = this.root.querySelector<HTMLElement>(".fc-terminal");
      const log = this.root.querySelector<HTMLElement>(".fc-log");
      const note = this.root.querySelector<HTMLElement>(".fc-note");
      if (canvas) canvas.hidden = true;
      if (fallback) fallback.hidden = true;
      if (hint) hint.hidden = true;
      if (replay) replay.hidden = true;
      if (skip) skip.hidden = false;
      if (!shell || !log || !note) return;
      shell.hidden = false;
      shell.classList.remove("is-leaving", "is-glitching");
      log.replaceChildren();
      note.hidden = true;
      this.terminal = runTerminal(log, note, shell, this.reduceMotion);
      const ending = await this.terminal.finished;
      this.terminal = null;
      if (ending === "close" || openOverlay !== this) return;
      shell.classList.add("is-leaving");
      await wait(this.reduceMotion ? 0 : 700);
      if (openOverlay !== this) return;
      this.hideTerminal();
      await this.enterUniverse();
    } finally {
      this.replaying = false;
    }
  }

  private close() {
    window.clearTimeout(this.hintTimer);
    this.terminal?.stop();
    this.scene?.dispose();
    this.scene = null;
    this.root.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKey);
    this.root.remove();
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, this.scrollY);
    openOverlay = null;
    this.previousFocus.focus();
  }
}

function mountCanvas(root: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.className = "fc-canvas";
  const current = root.querySelector<HTMLCanvasElement>(".fc-canvas");
  if (current) current.replaceWith(canvas);
  else root.append(canvas);
  return canvas;
}

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* The session can continue without remembering the intro. */
  }
}

function canUseWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
