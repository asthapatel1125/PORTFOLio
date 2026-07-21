// ─────────────────────────────────────────────
//  Effects layer — particles, tilt, reveal,
//  cursor glow, live clock, toasts, easter egg
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  /* ── Toasts ──────────────────────────────────────────── */
  const toastStack = document.getElementById("toast-stack");
  function showToast(message, ms = 2600) {
    if (!toastStack) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    toastStack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast-in"));
    setTimeout(() => {
      el.classList.remove("toast-in");
      el.classList.add("toast-out");
      setTimeout(() => el.remove(), 300);
    }, ms);
  }
  window.__showToast = showToast;

  /* ── Scroll progress bar ────────────────────────────── */
  const progressBar = document.getElementById("scroll-progress");
  function updateProgress() {
    if (!progressBar) return;
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    progressBar.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ── Live clock (Toronto) ───────────────────────────── */
  const clockEl = document.getElementById("live-clock");
  function tickClock() {
    if (!clockEl) return;
    try {
      const now = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
      clockEl.textContent = now;
    } catch (e) {
      clockEl.textContent = new Date().toLocaleTimeString();
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ── Copy email to clipboard ────────────────────────── */
  const copyBtn = document.getElementById("copy-email-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        showToast("✓ Email copied to clipboard");
        copyBtn.classList.add("copied");
        setTimeout(() => copyBtn.classList.remove("copied"), 1200);
      } catch (e) {
        showToast("Copy failed — email: " + email, 3200);
      }
    });
  }

  /* ── Cursor-follow ambient glow (desktop only) ──────── */
  const glow = document.getElementById("cursor-glow");
  if (glow && !isTouch) {
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    let tx = gx, ty = gy;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      glow.style.opacity = "1";
    });
    function animateGlow() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  } else if (glow) {
    glow.style.display = "none";
  }

  /* ── Scroll-reveal via IntersectionObserver ─────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const siblingIndex = Array.from(el.parentElement.children).indexOf(el);
          if (!el.style.transitionDelay) {
            el.style.transitionDelay = reduceMotion ? "0ms" : Math.min(siblingIndex * 70, 350) + "ms";
          }
          el.classList.add("in-view");

          // If this is a skill bar row, animate its fill width now that it's visible
          const fill = el.querySelector && el.querySelector(".skill-bar-fill");
          if (fill) {
            const target = fill.dataset.target;
            requestAnimationFrame(() => {
              setTimeout(() => { fill.style.width = target + "%"; }, 150);
            });
          }

          revealObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  function observeReveal(el) {
    if (el.dataset.revealBound) return;
    el.dataset.revealBound = "true";
    if (reduceMotion) {
      el.classList.add("in-view");
      const fill = el.querySelector && el.querySelector(".skill-bar-fill");
      if (fill) fill.style.width = fill.dataset.target + "%";
      return;
    }
    revealObserver.observe(el);
  }

  document.querySelectorAll(".reveal").forEach(observeReveal);

  // Watch for content injected later by github.js
  ["projects:rendered", "skills:rendered"].forEach((evt) => {
    document.addEventListener(evt, () => {
      document.querySelectorAll(".reveal:not(.in-view)").forEach(observeReveal);
    });
  });

  /* ── 3D tilt + spotlight on cards ────────────────────── */
  function attachTilt(card) {
    if (reduceMotion || isTouch || card.dataset.tiltBound) return;
    card.dataset.tiltBound = "true";

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      const rotateY = (px - 0.5) * 8;
      const rotateX = (0.5 - py) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      card.style.setProperty("--spot-x", `${px * 100}%`);
      card.style.setProperty("--spot-y", `${py * 100}%`);
      card.style.setProperty("--spot-opacity", "1");
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.setProperty("--spot-opacity", "0");
    });
  }

  function bindAllTiltCards() {
    document.querySelectorAll(".tilt-card").forEach(attachTilt);
  }
  bindAllTiltCards();
  document.addEventListener("projects:rendered", bindAllTiltCards);

  /* ── Particle network canvas in hero ────────────────── */
  const canvas = document.getElementById("particle-canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null };
    let animId = null;
    let running = true;

    const COLORS = ["230, 0, 126", "255, 106, 19", "0, 145, 194"];

    function resize() {
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + "px";
      canvas.style.height = parent.clientHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const area = canvas.clientWidth * canvas.clientHeight;
      const count = Math.max(28, Math.min(70, Math.floor(area / 16000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    }

    function step() {
      if (!running) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        if (mouse.x !== null) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 0.6;
            p.y += (dy / dist) * force * 0.6;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, 0.8)`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(230, 0, 126, ${0.2 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(step);
    }

    canvas.parentElement.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) step();
      else cancelAnimationFrame(animId);
    });

    window.addEventListener("resize", resize);
    resize();
    step();
  }

  /* ── Scrollspy: highlight active nav tab ────────────── */
  const navLinks = Array.from(document.querySelectorAll(".nav-link[data-section]"));
  const sections = navLinks
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);

  if (sections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              link.classList.toggle("active", link.dataset.section === id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spyObserver.observe(s));
  }

  /* ── Easter egg: type "hire" anywhere ───────────────── */
  let buffer = "";
  window.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-4);
    if (buffer === "hire") {
      showToast("👀 on it — scrolling to contact.sh", 2200);
      const contact = document.getElementById("contact");
      if (contact) contact.scrollIntoView({ behavior: "smooth" });
      const submit = document.getElementById("submit-btn");
      if (submit) {
        submit.classList.add("pulse-once");
        setTimeout(() => submit.classList.remove("pulse-once"), 1000);
      }
      buffer = "";
    }
  });
});