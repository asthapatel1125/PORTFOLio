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

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    btn.textContent = "Sending...";
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
        status.style.background = "#0f2a1a";
        status.style.color = "#28c840";
        status.style.border = "1px solid #28c840";
        status.textContent = "✓ Message sent! I'll get back to you soon.";
        form.reset();
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
      status.style.display = "block";
      status.style.background = "#2a0f0f";
      status.style.color = "#ff6b6b";
      status.style.border = "1px solid #ff6b6b";
      status.textContent = "✗ Something went wrong. Please try again.";
    } finally {
      btn.textContent = "Send Message";
      btn.disabled = false;
    }
  });
});