const GITHUB_USERNAME = "asthapatel1125";
const EXCLUDED_REPOS = [];

// ─────────────────────────────────────────────
//  Manual tech stack per repo
//  Key = exact repo name on GitHub
// ─────────────────────────────────────────────
const REPO_OVERRIDES = {
  "LMS_CAPSTONE_2025": {
    tech: ["Python", "JavaScript", "FastAPI", "MongoDB", "Docker", "Kubernetes", "GCP", "Spring Boot"],
  },
  "Glide-Open-Source-Testing": {
    tech: ["Java", "JUnit 4"],
  },
  "Rover-Simulation": {
    tech: ["Python", "Docker", "Microsoft Azure"],
  },
  "Drone-Mission": {
    tech: ["Java", "Server-Client Architecture"],
  },
  "EmotionDetectionApp": {
    tech: ["Python", "HTML", "TensorFlow", "Keras", "OpenCV"],
  },
  "Secure-Banking-System": {
    tech: ["Python", "Tkinter", "Cryptography"],
  },
  "Housing-Contruction-Managment-System": {
    tech: ["Python", "gRPC", "Pandas", "FAST API", "Docker", "Kubernetes", "Microsoft Azure"],
  },
  "COE817-LABS": {
    tech: ["Python", "Cryptography", "Encryption"],
  },
  "COE891": {
    tech: ["Java", "Selenium", "JUnit 4"],
  },
  "CPS688-Advanced-Algorithm_LAB5": {
    tech: ["Java", "Algorithms"],
  },
  "CPS688-Advanced-Algorithms_LAB4": {
    tech: ["Java", "Algorithms"],
  },
  "CPS688-Advanced-Algorithms_LAB3": {
    tech: ["Java", "Algorithms"],
  },
  "CPS688-Advanced-Algorithms_LAB2": {
    tech: ["Java", "Algorithms"],
  },
  "CPS688-Advanced-Algorithms_LAB1": {
    tech: ["Java", "Algorithms"],
  },
  "CPS510-Patient-Information-and-Record-Management": {
    tech: ["SQL", "Oracle Databases", "Shell"],
  },
  "Design-of-a-Simple-General-Purpose-Processor": {
    tech: ["VHDL"],
  },
  "Online-Bookstore-Project": {
    tech: ["UML", "Java", "Docker"],
  },
  "PORTFOLio":{
    tech: ["HTML", "CSS", "vanilla JS"],
  }
};

// ─────────────────────────────────────────────
//  Map repo → project card
// ─────────────────────────────────────────────
function repoToProject(repo) {
  const override = REPO_OVERRIDES[repo.name] || {};

  // DiceBear generates a unique abstract shape image based on the repo name
  const imageUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(repo.name)}&backgroundColor=1a0b2e,0f172a,0d1117&backgroundType=gradientLinear`;

  return {
    title: repo.name.replace(/[-_]/g, " "),
    description: repo.description || "No description provided.",
    image: {
      src: imageUrl,
      alt: repo.name,
    },
    tech: override.tech || ["N/A"],
    links: {
      code: repo.html_url,
      demo: repo.homepage || null,
    },
  };
}

// ─────────────────────────────────────────────
//  Render
// ─────────────────────────────────────────────
function renderProjects(projectArray) {
  const grid = document.querySelector(".projects-grid");
  if (!grid) return;

  grid.innerHTML = projectArray
    .map(
      ({ title, description, image, tech, links }) => `
      <div class="project-card">
        <div class="project-image">
          <img src="${image.src}" alt="${image.alt}">
        </div>
        <div class="project-content">
          <h3 class="project-title">${title}</h3>
          <p class="project-description">${description}</p>
          <div class="project-tech">
            ${tech.map((t) => `<span class="tech-tag">${t}</span>`).join("")}
          </div>
          <div class="project-links">
            <a href="${links.code}" class="project-link" target="_blank" rel="noopener">Code</a>
            ${links.demo ? `<a href="${links.demo}" class="project-link" target="_blank" rel="noopener">Demo</a>` : ""}
          </div>
        </div>
      </div>`
    )
    .join("");
}

function renderError(message) {
  const grid = document.querySelector(".projects-grid");
  if (grid) grid.innerHTML = `<p style="color: #ff6b6b; text-align:center;">${message}</p>`;
}

// ─────────────────────────────────────────────
//  Fetch repos (no language API calls needed)
// ─────────────────────────────────────────────
async function init() {
  const grid = document.querySelector(".projects-grid");
  if (grid) grid.innerHTML = `<p style="text-align:center; opacity:0.5;">Loading projects...</p>`;

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`
    );
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

    const repos = await res.json();

    const projects = repos
      .filter((r) => !r.fork)
      .filter((r) => !EXCLUDED_REPOS.includes(r.name))
      .map(repoToProject);

    if (projects.length === 0) {
      renderError("No public repositories found.");
      return;
    }

    renderProjects(projects);
  } catch (err) {
    console.error(err);
    renderError("Could not load projects. Check your network or GitHub username.");
  }
}

document.addEventListener("DOMContentLoaded", init);