import { GITHUB_USER, elements, formatTime, state } from "./core.js";

function formatRepoDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return date.toLocaleDateString();
}

function setProjectsStatus(message, isError = false, isLoading = false, isSuccess = false) {
  const { projectsStatus } = elements;
  if (!projectsStatus) {
    return;
  }
  projectsStatus.textContent = message;
  projectsStatus.classList.toggle("error", isError);
  projectsStatus.classList.toggle("loading", isLoading);
  projectsStatus.classList.toggle("success", isSuccess);
}

function renderProjectsList(repos) {
  const { projectsList } = elements;
  if (!projectsList) {
    return;
  }

  projectsList.innerHTML = "";
  repos.forEach((repo) => {
    const item = document.createElement("li");
    item.className = "project-item";

    const description = repo.description || "No description provided.";
    const language = repo.language || "Unknown";

    item.innerHTML = `
      <div class="project-name-row">
        <a class="project-name" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
        <span class="project-stars">★ ${repo.stargazers_count}</span>
      </div>
      <p class="project-description">${description}</p>
      <div class="project-meta">${language} • Updated ${formatRepoDate(repo.updated_at)}</div>
    `;

    projectsList.appendChild(item);
  });
}

export async function loadGitHubProjects(forceRefresh = false) {
  const { projectsList, projectsStatus } = elements;
  if (!projectsList || !projectsStatus) {
    return;
  }

  if (state.projectsLoaded && !forceRefresh) {
    return;
  }
  if (state.projectsLoading) {
    return;
  }

  state.projectsLoading = true;
  setProjectsStatus("Loading repositories", false, true, false);

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=24&type=owner`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();
    const visibleRepos = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 12);

    if (!visibleRepos.length) {
      projectsList.innerHTML = "";
      setProjectsStatus("No public repositories found.", true, false, false);
    } else {
      renderProjectsList(visibleRepos);
      setProjectsStatus(`Showing ${visibleRepos.length} recent repositories from @${GITHUB_USER}.`, false, false, true);
    }

    state.projectsLoaded = true;
  } catch (error) {
    setProjectsStatus("Could not load GitHub projects right now.", true, false, false);
    projectsList.innerHTML = "";
    const fallback = document.createElement("li");
    fallback.className = "project-item";
    fallback.innerHTML = `<a class="project-name" href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener noreferrer">Open GitHub profile</a>`;
    projectsList.appendChild(fallback);
  } finally {
    state.projectsLoading = false;
  }
}

export function setupProjectsWindow() {
  const { projectsProfileLink, projectsRefresh } = elements;

  if (projectsProfileLink) {
    projectsProfileLink.href = `https://github.com/${GITHUB_USER}`;
  }

  if (projectsRefresh) {
    projectsRefresh.addEventListener("click", () => {
      loadGitHubProjects(true);
    });
  }
}

export function setupAudioPlayer() {
  const slider = document.getElementById("range23");
  const durationLabel = document.getElementById("duration-label");
  const currentTimeLabel = document.getElementById("current-time-label");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");

  if (!slider || !durationLabel || !currentTimeLabel || !playBtn || !pauseBtn) {
    return;
  }

  const audioPlayer = new Audio("img/msc.mp3");

  audioPlayer.addEventListener("loadedmetadata", () => {
    const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0;
    durationLabel.textContent = formatTime(duration);
  });

  audioPlayer.addEventListener("timeupdate", () => {
    const duration = audioPlayer.duration || 1;
    const progress = (audioPlayer.currentTime / duration) * 100;
    slider.value = String(Math.min(100, Math.max(0, progress)));
    currentTimeLabel.textContent = formatTime(audioPlayer.currentTime);
    durationLabel.textContent = formatTime(audioPlayer.duration || 0);
  });

  slider.addEventListener("input", (event) => {
    const next = Number(event.target.value);
    const duration = audioPlayer.duration || 0;
    audioPlayer.currentTime = (next / 100) * duration;
  });

  playBtn.addEventListener("click", () => {
    audioPlayer.play().catch(() => {});
  });

  pauseBtn.addEventListener("click", () => {
    audioPlayer.pause();
  });
}

export function setupKonami() {
  const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiPosition = 0;

  document.addEventListener("keydown", (event) => {
    if (document.activeElement === elements.cmdInput) {
      return;
    }

    const key = event.key;
    const requiredKey = konamiCode[konamiPosition];

    if (key.toLowerCase() === requiredKey.toLowerCase()) {
      konamiPosition += 1;
      if (konamiPosition === konamiCode.length) {
        const bsod = document.getElementById("bsod");
        if (bsod) {
          bsod.style.display = "flex";
        }
        konamiPosition = 0;
      }
    } else {
      konamiPosition = 0;
    }
  });
}
