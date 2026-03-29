export const MOBILE_BREAKPOINT = 900;
export const BOOT_MS = 600;
export const GITHUB_USER = "lucasroeder13";

export const state = {
  zIndex: 10,
  history: [],
  historyIndex: -1,
  isMobile: window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches,
  startMenuOpen: false,
  selectedMenuIndex: -1,
  currentPath: ["home", "lucy", "Desktop"],
  previousPath: ["home", "lucy", "Desktop"],
  projectsLoaded: false,
  projectsLoading: false,
  activeWindowId: null
};

export const HOME_PATH = ["home", "lucy"];
export const SHELL_PATH = "/bin/bash";
export const FS_STORAGE_KEY = "lucy-mock-fs-v1";

export const easterEggs = [
  "You are valid, cutie",
  "Trans rights are human rights",
  "Executing slay.sh... done"
];

export const apps = [
  {
    id: "about",
    title: "About",
    icon: "https://win98icons.alexmeub.com/icons/png/address_book_user.png",
    type: "window",
    target: "windowIntro"
  },
  {
    id: "about-details",
    title: "About Details",
    icon: "https://win98icons.alexmeub.com/icons/png/address_book_pad_users.png",
    type: "window",
    target: "windowIntro2"
  },
  {
    id: "music",
    title: "Music",
    icon: "https://win98icons.alexmeub.com/icons/png/cd_audio_cd-0.png",
    type: "window",
    target: "window3"
  },
  {
    id: "terminal",
    title: "Terminal",
    icon: "https://win98icons.alexmeub.com/icons/png/console_prompt-0.png",
    type: "window",
    target: "cmd"
  },
  {
    id: "projects",
    title: "Projects",
    icon: "https://win98icons.alexmeub.com/icons/png/directory_closed-0.png",
    type: "window",
    target: "windowProjects"
  },
  {
    id: "contact",
    title: "Contact",
    icon: "https://win98icons.alexmeub.com/icons/png/address_book-0.png",
    type: "window",
    target: "windowContact"
  },
  {
    id: "github",
    title: "GitHub",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/56ddcf59-3cb4-4f3d-851e-91ec86e67871/df9xsq7-bf213b05-8c95-4b5e-a8aa-718d329ab707.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi81NmRkY2Y1OS0zY2I0LTRmM2QtODUxZS05MWVjODZlNjc4NzEvZGY5eHNxNy1iZjIxM2IwNS04Yzk1LTRiNWUtYThhYS03MThkMzI5YWI3MDcucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Oe3yS_4pdoJoWWONm1KfoNPB0kZebMY1ByqeSer_zIY",
    type: "link",
    target: `https://github.com/${GITHUB_USER}`
  }
];

export const terminalState = {
  osName: "Bimbows 69",
  hostname: "lucy-pc",
  kernel: "420.69.1337.0.1",
  user: "lucy",
  shellName: "bash"
};

export const defaultFsRoot = {
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        lucy: {
          type: "dir",
          children: {
            Desktop: {
              type: "dir",
              children: {
                "readme.txt": {
                  type: "file",
                  content: "Welcome to the fake shell. Try help, ls, cat readme.txt, and neofetch."
                },
                "todo.md": {
                  type: "file",
                  content: "- add more songs\n- make more cute themes\n- drink water"
                },
                projects: {
                  type: "dir",
                  children: {
                    "desktop-os.txt": {
                      type: "file",
                      content: "Retro desktop UI with terminal, start menu, and draggable windows."
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    etc: {
      type: "dir",
      children: {
        hosts: {
          type: "file",
          content: "127.0.0.1 localhost"
        }
      }
    }
  }
};

// Lazy element accessor to ensure DOM is ready before querying
export const elements = {
  get desktop() { return document.getElementById("desktop"); },
  get cmdWindow() { return document.getElementById("cmd"); },
  get cmdHistory() { return document.getElementById("cmd-history"); },
  get cmdInput() { return document.getElementById("commandInput"); },
  get promptPrefix() { return document.getElementById("prompt-prefix"); },
  get desktopIcons() { return document.getElementById("desktop-icons"); },
  get startButton() { return document.getElementById("start-button"); },
  get startMenu() { return document.getElementById("start-menu"); },
  get startSearch() { return document.getElementById("start-search"); },
  get startMenuItems() { return document.getElementById("start-menu-items"); },
  get startMenuClose() { return document.getElementById("start-menu-close"); },
  get taskbarWindows() { return document.getElementById("taskbar-windows"); },
  get taskbar() { return document.getElementById("taskbar"); },
  get projectsList() { return document.getElementById("projects-list"); },
  get projectsStatus() { return document.getElementById("projects-status"); },
  get projectsRefresh() { return document.getElementById("projects-refresh"); },
  get projectsProfileLink() { return document.getElementById("projects-profile-link"); }
};

export function getAllWindows() {
  return Array.from(document.querySelectorAll(".window[data-app-id]"));
}

export function updateTime() {
  const timeEl = document.getElementById("time");
  if (!timeEl) {
    return;
  }

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  timeEl.textContent = `${hours}:${minutes}`;
}

export function pathToPrompt() {
  return `${terminalState.user}@${terminalState.hostname}:${pathToPromptPath(state.currentPath)}$`;
}

export function pathToPromptPath(pathArr) {
  const isInHome = HOME_PATH.every((part, idx) => pathArr[idx] === part);
  if (isInHome) {
    const relative = pathArr.slice(HOME_PATH.length).join("/");
    return relative ? `~/${relative}` : "~";
  }
  return pathToUnix(pathArr);
}

export function pathToUnix(pathArr) {
  return `/${pathArr.join("/")}`;
}

export function parseTokens(input) {
  const tokens = [];
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

export function splitByOperator(input, operator) {
  const parts = [];
  let quote = null;
  let segment = "";
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if ((char === '"' || char === "'") && (quote === null || quote === char)) {
      quote = quote === char ? null : char;
      segment += char;
      continue;
    }

    if (!quote && char === operator) {
      if (segment.trim()) {
        parts.push(segment.trim());
      }
      segment = "";
      continue;
    }

    segment += char;
  }

  if (segment.trim()) {
    parts.push(segment.trim());
  }

  return parts;
}

export function expandEnvVars(text) {
  if (!text) {
    return "";
  }

  return text.replace(/\$(\w+)|\$\{([^}]+)\}/g, (_, a, b) => {
    const key = a || b;
    const env = {
      USER: terminalState.user,
      HOME: `/${HOME_PATH.join("/")}`,
      PWD: pathToUnix(state.currentPath),
      SHELL: SHELL_PATH,
      HOSTNAME: terminalState.hostname,
      OS: terminalState.osName
    };
    return env[key] ?? "";
  });
}

export function getBasename(pathArray) {
  return pathArray[pathArray.length - 1] || "";
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
}
