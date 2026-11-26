const letterDelay = 20;
const paragraphPause = 500;

export function revealProse(prose: HTMLElement, next: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const paragraphs = Array.from(prose.querySelectorAll("p"));
  if (!paragraphs.length) return;

  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "be-skip";
  skip.textContent = "Show full scene";
  prose.before(skip);

  const lines = paragraphs.map((paragraph) => {
    const full = document.createElement("span");
    full.className = "be-full-text";
    full.textContent = paragraph.textContent;
    const visible = document.createElement("span");
    visible.setAttribute("aria-hidden", "true");
    paragraph.classList.add("be-revealing");
    paragraph.replaceChildren(full, visible);
    return { letters: Array.from(full.textContent ?? ""), visible };
  });

  next.classList.add("be-awaiting-prose");
  let timer = 0;
  let paragraphIndex = 0;
  let letterIndex = 0;

  function finish() {
    window.clearTimeout(timer);
    const focusWasOnSkip = document.activeElement === skip;
    skip.remove();
    for (const paragraph of paragraphs) {
      const full = paragraph.querySelector(".be-full-text");
      if (!full) continue;
      paragraph.textContent = full.textContent;
      paragraph.classList.remove("be-revealing");
    }
    next.classList.remove("be-awaiting-prose");
    if (focusWasOnSkip) next.querySelector("button")?.focus();
  }

  function typeLetter() {
    const line = lines[paragraphIndex];
    line.visible.textContent += line.letters[letterIndex++];
    if (letterIndex < line.letters.length) {
      timer = window.setTimeout(typeLetter, letterDelay);
    } else if (++paragraphIndex < lines.length) {
      letterIndex = 0;
      timer = window.setTimeout(typeLetter, paragraphPause);
    } else {
      timer = window.setTimeout(finish, paragraphPause);
    }
  }

  skip.addEventListener("click", finish);
  typeLetter();
  return () => window.clearTimeout(timer);
}
