// ─────────────────────────────────────────────
//  Hero terminal typewriter effect
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const commands = Array.from(document.querySelectorAll(".cmd[data-type]"));
  const outputs = Array.from(document.querySelectorAll(".term-output[data-reveal]"));

  if (reduceMotion) {
    commands.forEach((el) => (el.textContent = el.dataset.type));
    outputs.forEach((el) => el.classList.add("visible"));
    return;
  }

  function typeInto(el, text, speed) {
    return new Promise((resolve) => {
      let i = 0;
      el.classList.add("typed-cursor");
      const interval = setInterval(() => {
        el.textContent = text.slice(0, i + 1);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          el.classList.remove("typed-cursor");
          resolve();
        }
      }, speed);
    });
  }

  async function run() {
    for (let i = 0; i < commands.length; i++) {
      await typeInto(commands[i], commands[i].dataset.type, 38);
      await new Promise((r) => setTimeout(r, 150));
      if (outputs[i]) {
        outputs[i].classList.add("visible");
      }
      await new Promise((r) => setTimeout(r, 220));
    }
  }

  run();
});