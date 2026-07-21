// ─────────────────────────────────────────────
//  Formspree Configuration
//  Sign up at formspree.io → create a form
//  → paste your endpoint URL below
// ─────────────────────────────────────────────
const FORMSPREE_URL = "https://formspree.io/f/xlgoqdzn"; // ← paste your ID here

document.addEventListener("DOMContentLoaded", () => {
  const form   = document.getElementById("contact-form");
  const btn    = document.getElementById("submit-btn");
  const status = document.getElementById("form-status");

  if (!form) return;

  const IDLE_LABEL = "./send-message.sh";

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    btn.textContent = "sending...";
    btn.disabled = true;
    status.style.display = "none";

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      });

      if (res.ok) {
        status.style.display = "block";
        status.style.background = "rgba(158, 206, 106, 0.1)";
        status.style.color = "#9ece6a";
        status.style.border = "1px solid rgba(158, 206, 106, 0.35)";
        status.textContent = "✓ Message sent! I'll get back to you soon.";
        form.reset();
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
      status.style.display = "block";
      status.style.background = "rgba(247, 118, 142, 0.1)";
      status.style.color = "#f7768e";
      status.style.border = "1px solid rgba(247, 118, 142, 0.35)";
      status.textContent = "✗ Something went wrong. Please try again.";
    } finally {
      btn.textContent = IDLE_LABEL;
      btn.disabled = false;
    }
  });
});