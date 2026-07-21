// ─────────────────────────────────────────────────────────
//  Everything on this page about projects, skills, and
//  stats is LIVE — pulled from the GitHub API and computed
//  client-side. Nothing below is hand-maintained; add a
//  repo on GitHub and it appears here automatically.
// ─────────────────────────────────────────────────────────
const GITHUB_USERNAME = "asthapatel1125";
const EXCLUDED_REPOS = [];
const CACHE_KEY = "gh_portfolio_cache_v3";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Canonical GitHub/linguist language colors, so tags and
// skill bars use the same colors GitHub itself uses.
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", HTML: "#e34c26", CSS: "#563d7c", SCSS: "#c6538c",
  Shell: "#89e051", Dockerfile: "#384d54", "Jupyter Notebook": "#DA5B0B",
  C: "#555555", "C++": "#f34b7d", "C#": "#178600", Go: "#00ADD8",
  Ruby: "#701516", PHP: "#4F5D95", Vue: "#41b883", VHDL: "#adb2cb",
  PLpgSQL: "#336790", Makefile: "#427819", Dart: "#00B4AB",
  Kotlin: "#A97BFF", Rust: "#dea584", R: "#198CE7", Solidity: "#AA6746",
  SQL: "#e38c00", Batchfile: "#C1F12E", CMake: "#DA3434",
};
const FALLBACK_COLOR = "#8b5cf6";

function colorFor(lang) {
  return LANGUAGE_COLORS[lang] || FALLBACK_COLOR;
}

// Bold flat "product" colors for project tiles — deterministic per
// repo name so it's stable across reloads, and always high-contrast
// enough for white title text (unlike some GitHub language colors).
const CANDY_COLORS = ["#e6007e", "#ff6a13", "#7cb518", "#0091c2", "#7b2d8e"];
function candyColorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CANDY_COLORS[hash % CANDY_COLORS.length];
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (raw && Date.now() - raw.timestamp < CACHE_TTL_MS) return raw.data;
  } catch (e) { /* ignore */ }
  return null;
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) { /* storage may be unavailable — non-fatal */ }
}

// ─────────────────────────────────────────────────────────
//  Fetch + aggregate
// ─────────────────────────────────────────────────────────
async function loadGitHubData() {
  const cached = readCache();
  if (cached) return cached;

  const repos = await fetchJSON(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);

  const active = repos
    .filter((r) => !r.fork)
    .filter((r) => !EXCLUDED_REPOS.includes(r.name));

  // Pull the real language breakdown for every repo in parallel.
  // If a call fails (rate limit, etc.) we fall back to the repo's
  // single primary `language` field so the page still works.
  const languageResults = await Promise.allSettled(
    active.map((r) => (r.languages_url ? fetchJSON(r.languages_url) : Promise.resolve(null)))
  );

  const languageTotals = {};
  const projects = active.map((repo, i) => {
    const result = languageResults[i];
    let langs = {};
    if (result.status === "fulfilled" && result.value && Object.keys(result.value).length) {
      langs = result.value;
    } else if (repo.language) {
      langs = { [repo.language]: 1 };
    }
    Object.entries(langs).forEach(([lang, bytes]) => {
      languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
    });

    const topLangs = Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang)
      .slice(0, 4);

    return {
      name: repo.name,
      title: repo.name.replace(/[-_]/g, " "),
      description: repo.description || "No description provided.",
      stars: repo.stargazers_count || 0,
      updatedAt: repo.pushed_at,
      codeUrl: repo.html_url,
      demoUrl: repo.homepage || null,
      tech: topLangs.length ? topLangs : ["N/A"],
    };
  });

  const data = {
    projects,
    languageTotals,
  };

  writeCache(data);
  return data;
}

// ─────────────────────────────────────────────────────────
//  Render: projects
// ─────────────────────────────────────────────────────────
function renderProjects(projects) {
  const grid = document.querySelector(".projects-grid");
  if (!grid) return;

  if (!projects.length) {
    grid.innerHTML = `<p class="fetch-note" style="grid-column:1/-1;">No public repositories found.</p>`;
    return;
  }

  grid.innerHTML = projects
    .map(({ title, description, tech, codeUrl, demoUrl, stars }) => {
      const primary = tech[0] !== "N/A" ? tech[0] : null;
      const tileColor = candyColorFor(title);

      return `
      <div class="project-card reveal tilt-card">
        <div class="project-tile" style="--accent:${tileColor}">
          <h3 class="project-title">${title}</h3>
        </div>
        <div class="project-body">
          <p class="project-description">${description}</p>
          <div class="project-meta">
            <span class="project-lang">${primary || "—"}${stars ? ` · ★ ${stars}` : ""}</span>
            <div class="project-links">
              <a href="${codeUrl}" class="project-link" target="_blank" rel="noopener">Code</a>
              ${demoUrl ? `<a href="${demoUrl}" class="project-link" target="_blank" rel="noopener">Demo</a>` : ""}
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  document.dispatchEvent(new CustomEvent("projects:rendered"));
}

function renderProjectsError(message) {
  const grid = document.querySelector(".projects-grid");
  if (grid) grid.innerHTML = `<p class="fetch-note fetch-error" style="grid-column:1/-1;">${message}</p>`;
}

// ─────────────────────────────────────────────────────────
//  Render: skills (auto-computed language breakdown)
// ─────────────────────────────────────────────────────────
function renderSkills(languageTotals) {
  const container = document.querySelector(".skills-bars");
  if (!container) return;

  const entries = Object.entries(languageTotals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  if (!entries.length || total === 0) {
    container.innerHTML = `<p class="fetch-note">No language data available yet.</p>`;
    return;
  }

  const top = entries.slice(0, 10);

  container.innerHTML = top
    .map(([lang, bytes], i) => {
      const pct = ((bytes / total) * 100).toFixed(1);
      const color = colorFor(lang);
      return `
      <div class="skill-bar-row reveal" style="transition-delay:${i * 50}ms">
        <div class="skill-bar-label">
          <span class="skill-dot" style="background:${color}"></span>
          <span class="skill-bar-name">${lang}</span>
          <span class="skill-bar-pct">${pct}%</span>
        </div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" data-target="${pct}" style="background:linear-gradient(90deg, ${color}, ${color}cc); width:0%;"></div>
        </div>
      </div>`;
    })
    .join("");

  document.dispatchEvent(new CustomEvent("skills:rendered"));
}

function renderSkillsError(message) {
  const container = document.querySelector(".skills-bars");
  if (container) container.innerHTML = `<p class="fetch-note fetch-error">${message}</p>`;
}

// ─────────────────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────────────────
async function init() {
  const projectsGrid = document.querySelector(".projects-grid");
  const skillsBars = document.querySelector(".skills-bars");
  if (projectsGrid) projectsGrid.innerHTML = `<p class="fetch-note" style="grid-column:1/-1;">Fetching live data from GitHub…</p>`;
  if (skillsBars) skillsBars.innerHTML = `<p class="fetch-note">Computing language breakdown…</p>`;

  try {
    const data = await loadGitHubData();
    renderProjects(data.projects);
    renderSkills(data.languageTotals);
  } catch (err) {
    console.error(err);
    renderProjectsError("Could not reach the GitHub API right now. Refresh to try again.");
    renderSkillsError("Could not compute language stats right now.");
  }
}

document.addEventListener("DOMContentLoaded", init);