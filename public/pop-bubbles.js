const ROOT_ID = "pop-bubbles-root";

export function startBubbles() {
  if (document.getElementById(ROOT_ID)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.createElement("div");
  root.id = ROOT_ID;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d");

  const controls = document.createElement("div");
  controls.className = "pop-bubbles-controls";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Pop them all";
  controls.append(clear);

  root.append(canvas, controls);
  document.body.append(root);

  const pointer = { x: 0, y: 0, active: false };
  const bits = [];
  let bubbles = [];
  let width = window.innerWidth;
  let height = window.innerHeight;
  let running = true;
  let last = performance.now();

  const resize = () => {
    const previousWidth = width;
    const previousHeight = height;
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const bubble of bubbles) {
      bubble.x = Math.max(bubble.radius, Math.min(width - bubble.radius, (bubble.x / previousWidth) * width));
      bubble.y = Math.max(bubble.radius, Math.min(height - bubble.radius, (bubble.y / previousHeight) * height));
    }
  };

  const placeBubble = (radius) => {
    const padding = radius + 8;
    const angle = Math.random() * Math.PI * 2;
    const speed = reduceMotion ? 0 : 28 + Math.random() * 36;
    return {
      radius,
      x: padding + Math.random() * Math.max(40, width - padding * 2),
      y: padding + Math.random() * Math.max(40, height - padding * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ix: 0,
      iy: 0,
      wobble: Math.random() * Math.PI * 2,
      tint: ["125, 210, 255", "255, 168, 120", "150, 235, 170", "255, 145, 205"][Math.floor(Math.random() * 4)],
      hover: 0,
      near: 0,
      popping: false,
      life: 1,
      target: document.createElement("button"),
    };
  };

  const count = Math.max(16, Math.min(40, Math.round((width * height) / 34000)));
  for (let index = 0; index < count; index += 1) {
    const bubble = placeBubble(16 + Math.random() * 36);
    bubble.target.type = "button";
    bubble.target.className = "pop-bubble";
    bubble.target.setAttribute("aria-label", "Pop bubble");
    bubble.target.addEventListener("pointerenter", () => {
      bubble.hover = 1;
    });
    bubble.target.addEventListener("pointerleave", () => {
      bubble.hover = 0;
    });
    bubble.target.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      pop(bubble);
    });
    root.append(bubble.target);
    bubbles.push(bubble);
  }

  const separate = () => {
    for (let i = 0; i < bubbles.length; i += 1) {
      const a = bubbles[i];
      if (a.popping) continue;
      for (let j = i + 1; j < bubbles.length; j += 1) {
        const b = bubbles[j];
        if (b.popping) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        const min = a.radius + b.radius + 6;
        if (distance >= min) continue;
        const overlap = (min - distance) / distance;
        const pushX = dx * overlap * 0.5;
        const pushY = dy * overlap * 0.5;
        a.x -= pushX;
        a.y -= pushY;
        b.x += pushX;
        b.y += pushY;
        a.ix -= (dx / distance) * 36;
        a.iy -= (dy / distance) * 36;
        b.ix += (dx / distance) * 36;
        b.iy += (dy / distance) * 36;
      }
    }
  };

  for (let pass = 0; pass < 10; pass += 1) separate();

  const placeTarget = (bubble) => {
    const size = bubble.radius * 2;
    bubble.target.style.width = `${size}px`;
    bubble.target.style.height = `${size}px`;
    bubble.target.style.transform = `translate(${bubble.x - bubble.radius}px, ${bubble.y - bubble.radius}px)`;
  };

  const burst = (bubble) => {
    const pieces = reduceMotion ? 4 : 8;
    for (let index = 0; index < pieces; index += 1) {
      const angle = (Math.PI * 2 * index) / pieces + Math.random() * 0.5;
      const speed = 50 + Math.random() * 90;
      bits.push({
        x: bubble.x,
        y: bubble.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        life: 1,
        tint: bubble.tint,
      });
    }
  };

  const paintBubble = (bubble) => {
    const swell = bubble.popping ? 1 + (1 - bubble.life) * 0.42 : 1 + bubble.hover * 0.08 + Math.sin(bubble.wobble) * 0.025;
    const radius = bubble.radius * swell;
    const alpha = bubble.popping ? bubble.life : 0.96;
    const shine = bubble.popping ? 0 : Math.sin(bubble.wobble) * bubble.radius * 0.08;
    context.save();
    context.globalAlpha = Math.max(0, alpha);
    const body = context.createRadialGradient(
      bubble.x - radius * 0.34 + shine,
      bubble.y - radius * 0.4,
      radius * 0.08,
      bubble.x,
      bubble.y,
      radius,
    );
    body.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    body.addColorStop(0.18, `rgba(${bubble.tint}, 0.72)`);
    body.addColorStop(0.62, `rgba(${bubble.tint}, 0.28)`);
    body.addColorStop(1, `rgba(${bubble.tint}, 0.05)`);
    context.fillStyle = body;
    context.beginPath();
    context.arc(bubble.x, bubble.y, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = `rgba(255, 255, 255, ${0.55 * alpha})`;
    context.lineWidth = 1.5;
    context.stroke();
    context.beginPath();
    context.ellipse(
      bubble.x - radius * 0.28,
      bubble.y - radius * 0.36,
      radius * 0.22,
      radius * 0.1,
      -0.7,
      0,
      Math.PI * 2,
    );
    context.fillStyle = `rgba(255, 255, 255, ${0.55 * alpha})`;
    context.fill();
    if (bubble.popping) {
      context.beginPath();
      context.arc(bubble.x, bubble.y, radius * (1.15 + (1 - bubble.life) * 0.7), 0, Math.PI * 2);
      context.strokeStyle = `rgba(${bubble.tint}, ${0.7 * bubble.life})`;
      context.lineWidth = 2;
      context.stroke();
    }
    context.restore();
  };

  const paintBit = (bit) => {
    context.save();
    context.globalAlpha = bit.life;
    context.fillStyle = `rgba(${bit.tint}, 0.9)`;
    context.beginPath();
    context.arc(bit.x, bit.y, bit.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const pop = (bubble) => {
    if (bubble.popping) return;
    bubble.popping = true;
    bubble.life = 1;
    bubble.target.remove();
    burst(bubble);
  };

  const finish = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("blur", onLeave);
    root.remove();
  };

  const onPointer = (event) => {
    if (event.pointerType === "touch") {
      pointer.active = false;
      return;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  };

  const onLeave = () => {
    pointer.active = false;
  };

  clear.addEventListener("click", () => {
    bubbles
      .filter((bubble) => !bubble.popping)
      .forEach((bubble, index) => {
        window.setTimeout(() => {
          if (running) pop(bubble);
        }, index * 28);
      });
  });

  const step = (now) => {
    if (!running) return;
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    context.clearRect(0, 0, width, height);

    if (!reduceMotion) separate();

    for (const bubble of bubbles) {
      if (bubble.popping) {
        bubble.life -= dt * (reduceMotion ? 8 : 3.4);
      } else if (!reduceMotion) {
        bubble.wobble += dt * 1.6;
        const dx = bubble.x - pointer.x;
        const dy = bubble.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const onBubble = bubble.hover > 0 || (pointer.active && distance < bubble.radius + 20);
        if (onBubble) bubble.near = Math.min(1, bubble.near + dt);
        else bubble.near = Math.max(0, bubble.near - dt * 2);

        if (onBubble && bubble.near < 0.2) {
          bubble.ix = -bubble.vx * 0.82;
          bubble.iy = -bubble.vy * 0.82;
        } else if (onBubble && pointer.active) {
          const flee = 110;
          bubble.ix = (dx / distance) * flee - bubble.vx * 0.65;
          bubble.iy = (dy / distance) * flee - bubble.vy * 0.65;
        } else {
          bubble.ix *= Math.exp(-3 * dt);
          bubble.iy *= Math.exp(-3 * dt);
        }
        bubble.x += (bubble.vx + bubble.ix + Math.sin(bubble.wobble) * 10) * dt;
        bubble.y += (bubble.vy + bubble.iy + Math.cos(bubble.wobble * 0.8) * 8) * dt;
        if (bubble.x < bubble.radius || bubble.x > width - bubble.radius) {
          bubble.vx *= -1;
          bubble.ix *= -0.4;
          bubble.x = Math.min(width - bubble.radius, Math.max(bubble.radius, bubble.x));
        }
        if (bubble.y < bubble.radius || bubble.y > height - bubble.radius) {
          bubble.vy *= -1;
          bubble.iy *= -0.4;
          bubble.y = Math.min(height - bubble.radius, Math.max(bubble.radius, bubble.y));
        }
        placeTarget(bubble);
      } else {
        placeTarget(bubble);
      }

      if (bubble.life > 0) paintBubble(bubble);
    }

    for (const bit of bits) {
      bit.life -= dt * 1.7;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.vy += 40 * dt;
      if (bit.life > 0) paintBit(bit);
    }

    bubbles = bubbles.filter((bubble) => bubble.life > 0);
    for (let index = bits.length - 1; index >= 0; index -= 1) {
      if (bits[index].life <= 0) bits.splice(index, 1);
    }

    if (!bubbles.length && !bits.length) {
      finish();
      return;
    }

    frameId = requestAnimationFrame(step);
  };

  let frameId = 0;
  resize();
  bubbles.forEach(placeTarget);
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("blur", onLeave);
  frameId = requestAnimationFrame(step);
}
