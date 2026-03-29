import { getAllWindows, apps, elements, state } from "./core.js";

const hooks = {
  onTerminalOpen: null,
  onProjectsOpen: null
};

export function setWindowHooks(nextHooks = {}) {
  hooks.onTerminalOpen = nextHooks.onTerminalOpen || null;
  hooks.onProjectsOpen = nextHooks.onProjectsOpen || null;
}

export function bringToFront(win) {
  state.zIndex += 1;
  win.style.zIndex = String(state.zIndex);
  state.activeWindowId = win.id;
  getAllWindows().forEach((entry) => entry.classList.toggle("is-active", entry.id === state.activeWindowId));
  updateTaskbarButtons();
}

export function updateActiveWindowAfterClose() {
  const allWins = getAllWindows();
  const visibleWindows = allWins.filter((win) => window.getComputedStyle(win).display !== "none");
  if (!visibleWindows.length) {
    state.activeWindowId = null;
    return;
  }

  const nextActive = visibleWindows
    .slice()
    .sort((a, b) => {
      const az = parseInt(window.getComputedStyle(a).zIndex, 10) || 0;
      const bz = parseInt(window.getComputedStyle(b).zIndex, 10) || 0;
      return bz - az;
    })[0];

  state.activeWindowId = nextActive.id;
  allWins.forEach((entry) => entry.classList.toggle("is-active", entry.id === state.activeWindowId));
}

export function closeWindow(windowId) {
  const win = document.getElementById(windowId);
  if (!win) {
    return;
  }
  win.style.display = "none";
  if (state.activeWindowId === windowId) {
    updateActiveWindowAfterClose();
  }
  updateTaskbarButtons();
}

export function openWindow(windowId) {
  const win = document.getElementById(windowId);
  if (!win) {
    return;
  }
  win.style.display = "block";
  bringToFront(win);
  if (state.isMobile) {
    applyMobileWindowLayout();
  }
  if (windowId === "cmd" && hooks.onTerminalOpen) {
    hooks.onTerminalOpen();
  }
  if (windowId === "windowProjects" && hooks.onProjectsOpen) {
    hooks.onProjectsOpen();
  }
  updateTaskbarButtons();
}

export function updateTaskbarButtons() {
  const { taskbarWindows } = elements;
  if (!taskbarWindows) {
    return;
  }

  taskbarWindows.innerHTMgetAllWindows()
  const visibleWindows = allWindows.filter((win) => window.getComputedStyle(win).display !== "none");

  visibleWindows.forEach((win) => {
    const appId = win.dataset.appId;
    const app = apps.find((entry) => entry.id === appId);
    if (!app) {
      return;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "taskbar-app-btn";
    if (win.id === state.activeWindowId) {
      btn.classList.add("active");
    }
    btn.textContent = app.title;
    btn.addEventListener("click", () => {
      if (win.style.display === "none") {
        openWindow(win.id);
      } else {
        bringToFront(win);
      }
    });
    taskbarWindows.appendChild(btn);
  });
}

export function attachWindowBehavior(win) {
  const header = win.querySelector(".title-bar");
  const closeBtn = win.querySelector(".btn-close");

  win.addEventListener("mousedown", () => bringToFront(win));
  win.addEventListener("touchstart", () => bringToFront(win), { passive: true });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeWindow(win.id));
  }

  if (!header) {
    return;
  }

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (event) => {
    if (state.isMobile) {
      return;
    }
    dragging = true;
    bringToFront(win);
    offsetX = event.clientX - win.offsetLeft;
    offsetY = event.clientY - win.offsetTop;
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!dragging || state.isMobile) {
      return;
    }
    win.style.left = `${Math.max(0, event.clientX - offsetX)}px`;
    win.style.top = `${Math.max(0, event.clientY - offsetY)}px`;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
}

export function applyMobileWindowLayout() {
  if (!state.isMobile) {
    return;
  }

  const visibleWindows = allWindows.filter((win) => window.getComputedStyle(win).display !== "none");
  visibleWindows.forEach((win, index) => {
    win.style.left = "8px";
    win.style.right = "8px";
    win.style.top = `${8 + index * 18}px`;
    win.classList.add("mobile-window");
  });
}

export function removeMobileWindowLayout() {
  getAllWindows().forEach((win) => {
    win.classList.remove("mobile-window");
    win.style.right = "";
  });
}

export function setupWindowButtons() {
  getAllWindows().forEach((win) => {
    attachWindowBehavior(win);
  });
  updateTaskbarButtons();
}
