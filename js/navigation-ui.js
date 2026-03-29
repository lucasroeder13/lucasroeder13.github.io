import { apps, elements, state } from "./core.js";
import { openWindow } from "./window-system.js";

function launchAppById(appId) {
  const app = apps.find((entry) => entry.id === appId);
  if (!app) {
    return;
  }

  if (app.type === "link") {
    window.open(app.target, "_blank", "noopener");
    return;
  }

  openWindow(app.target);
}

export function renderDesktopIcons() {
  const { desktopIcons } = elements;
  if (!desktopIcons) {
    return;
  }

  desktopIcons.innerHTML = "";
  apps.forEach((app) => {
    const icon = document.createElement("button");
    icon.className = "desktop-icon";
    icon.type = "button";
    icon.setAttribute("data-app-id", app.id);
    icon.innerHTML = `
      <img src="${app.icon}" alt="${app.title} icon" />
      <span class="icon-label-bottom">${app.title}</span>
    `;

    icon.addEventListener("dblclick", () => launchAppById(app.id));
    icon.addEventListener("click", () => {
      document.querySelectorAll(".desktop-icon.active").forEach((el) => el.classList.remove("active"));
      icon.classList.add("active");
      if (state.isMobile) {
        launchAppById(app.id);
      }
    });
    icon.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        launchAppById(app.id);
      }
    });

    desktopIcons.appendChild(icon);
  });
}

function getFilteredStartItems() {
  const query = elements.startSearch?.value.trim().toLowerCase() || "";
  return apps.filter((app) => app.title.toLowerCase().includes(query));
}

function runStartAction(appId) {
  launchAppById(appId);
  toggleStartMenu(false);
}

export function renderStartMenuItems() {
  const { startMenuItems } = elements;
  if (!startMenuItems) {
    return;
  }

  const filtered = getFilteredStartItems();
  startMenuItems.innerHTML = "";

  if (!filtered.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "start-menu-item-empty";
    emptyItem.textContent = "No results";
    startMenuItems.appendChild(emptyItem);
    state.selectedMenuIndex = -1;
    return;
  }

  if (state.selectedMenuIndex >= filtered.length) {
    state.selectedMenuIndex = 0;
  }

  filtered.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "start-menu-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "start-menu-launch";
    btn.dataset.appId = item.id;
    btn.innerHTML = `<span class="start-item-main"><img src="${item.icon}" alt="" /><span>${item.title}</span></span><span class="start-arrow">▶</span>`;
    btn.setAttribute("aria-selected", String(index === state.selectedMenuIndex));
    if (index === state.selectedMenuIndex) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => runStartAction(item.id));

    li.appendChild(btn);
    startMenuItems.appendChild(li);
  });

  const selected = startMenuItems.querySelector(".start-menu-launch.active");
  if (selected) {
    selected.scrollIntoView({ block: "nearest" });
  }
}

function moveStartSelection(delta) {
  const filtered = getFilteredStartItems();
  if (!filtered.length) {
    state.selectedMenuIndex = -1;
    renderStartMenuItems();
    return;
  }

  if (state.selectedMenuIndex < 0) {
    state.selectedMenuIndex = 0;
  } else {
    state.selectedMenuIndex = (state.selectedMenuIndex + delta + filtered.length) % filtered.length;
  }
  renderStartMenuItems();
}

export function toggleStartMenu(forceValue) {
  const { startButton, startMenu, startSearch } = elements;
  if (!startButton || !startMenu || !startSearch) {
    return;
  }

  const next = typeof forceValue === "boolean" ? forceValue : !state.startMenuOpen;
  state.startMenuOpen = next;
  startMenu.classList.toggle("open", next);
  startMenu.setAttribute("aria-hidden", String(!next));
  startButton.setAttribute("aria-expanded", String(next));

  if (next) {
    state.selectedMenuIndex = 0;
    renderStartMenuItems();
    alignStartMenuToTaskbar();
    startSearch.focus();
    startSearch.select();
  }
}

export function alignStartMenuToTaskbar() {
  const { desktop, startButton, startMenu, taskbar } = elements;

  if (state.isMobile) {
    if (!startMenu) {
      return;
    }

    startMenu.style.left = "";
    startMenu.style.right = "";
    startMenu.style.top = "";
    startMenu.style.bottom = "";
    return;
  }

  if (!desktop || !startButton || !startMenu || !taskbar) {
    return;
  }

  const desktopRect = desktop.getBoundingClientRect();
  const startRect = startButton.getBoundingClientRect();
  const taskbarRect = taskbar.getBoundingClientRect();
  const menuWidth = startMenu.offsetWidth || 308;
  const menuHeight = startMenu.offsetHeight || 348;

  const maxLeft = Math.max(2, desktopRect.width - menuWidth - 2);
  const desiredLeft = Math.max(2, Math.min(maxLeft, startRect.left - desktopRect.left));
  const desiredTop = Math.max(2, taskbarRect.top - desktopRect.top - menuHeight - 2);

  startMenu.style.left = `${Math.round(desiredLeft)}px`;
  startMenu.style.top = `${Math.round(desiredTop)}px`;
  startMenu.style.bottom = "auto";
  startMenu.style.right = "auto";
}

export function setupStartMenu() {
  const { startButton, startMenuClose, startSearch, startMenu, startButton: startBtn } = elements;
  if (!startButton || !startSearch || !startMenu || !startBtn) {
    return;
  }

  startButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleStartMenu();
  });

  if (startMenuClose) {
    startMenuClose.addEventListener("click", () => toggleStartMenu(false));
  }

  startSearch.addEventListener("input", () => {
    state.selectedMenuIndex = 0;
    renderStartMenuItems();
  });

  startSearch.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveStartSelection(1);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveStartSelection(-1);
    }
    if (event.key === "Enter") {
      const filtered = getFilteredStartItems();
      if (filtered[state.selectedMenuIndex]) {
        runStartAction(filtered[state.selectedMenuIndex].id);
      }
    }
  });

  document.getElementById("start-restart")?.addEventListener("click", () => {
    toggleStartMenu(false);
    alert("Pretend restart complete. All your slay survived.");
  });

  document.getElementById("start-shutdown")?.addEventListener("click", () => {
    toggleStartMenu(false);
    alert("Shutting down... jk, it's a website.");
  });

  document.addEventListener("click", (event) => {
    if (!state.startMenuOpen) {
      return;
    }

    if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
      toggleStartMenu(false);
    }
  });

  window.addEventListener("resize", () => {
    if (state.startMenuOpen) {
      alignStartMenuToTaskbar();
    }
  });
}

export function setupLinks() {
  document.querySelectorAll(".link-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const url = button.dataset.url;
      if (url) {
        window.open(url, "_blank", "noopener");
      }
    });
  });
}
