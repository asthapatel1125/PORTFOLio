// ─────────────────────────────────────────────
//  Hero: rotating role line + name parallax
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  /* ── Rotating role line ──────────────────────────────── */
  const roleEl = document.getElementById("hero-role-text");
  const roles = [
    "Full-Stack Developer",
    "Cloud & Microservices Engineer",
    "AI-Powered Product Builder",
    "Computer Engineering Grad",
  ];

  if (roleEl) {
    if (reduceMotion) {
      roleEl.textContent = roles[0];
    } else {
      let roleIndex = 0;

      function typeText(text) {
        return new Promise((resolve) => {
          let i = 0;
          const interval = setInterval(() => {
            roleEl.textContent = text.slice(0, i + 1);
            i++;
            if (i >= text.length) {
              clearInterval(interval);
              resolve();
            }
          }, 45);
        });
      }

      function eraseText(text) {
        return new Promise((resolve) => {
          let i = text.length;
          const interval = setInterval(() => {
            roleEl.textContent = text.slice(0, i - 1);
            i--;
            if (i <= 0) {
              clearInterval(interval);
              resolve();
            }
          }, 25);
        });
      }

      async function cycleRoles() {
        while (true) {
          const current = roles[roleIndex % roles.length];
          await typeText(current);
          await new Promise((r) => setTimeout(r, 1800));
          await eraseText(current);
          await new Promise((r) => setTimeout(r, 300));
          roleIndex++;
        }
      }
      cycleRoles();
    }
  }

  /* ── Subtle parallax tilt on the giant name ─────────── */
  const nameEl = document.getElementById("hero-name");
  if (nameEl && !reduceMotion && !isTouch) {
    document.querySelector(".main").addEventListener("mousemove", (e) => {
      const rect = nameEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      nameEl.style.transform = `perspective(1000px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
    });
    document.querySelector(".main").addEventListener("mouseleave", () => {
      nameEl.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
    });
  }
});