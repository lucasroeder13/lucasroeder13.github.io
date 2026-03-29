import { FS_STORAGE_KEY, HOME_PATH, defaultFsRoot, state, terminalState } from "./core.js";

let fsRoot = cloneNode(defaultFsRoot);

export function cloneNode(node) {
  if (!node) {
    return null;
  }
  if (node.type === "file") {
    return { type: "file", content: node.content };
  }

  const children = {};
  Object.entries(node.children || {}).forEach(([name, child]) => {
    children[name] = cloneNode(child);
  });

  return { type: "dir", children };
}

export function saveFsState() {
  try {
    sessionStorage.setItem(FS_STORAGE_KEY, JSON.stringify(fsRoot));
  } catch (error) {
    console.warn("filesystem state could not be saved", error);
  }
}

export function loadFsState() {
  try {
    const raw = sessionStorage.getItem(FS_STORAGE_KEY);
    if (!raw) {
      fsRoot = cloneNode(defaultFsRoot);
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.type !== "dir" || !parsed.children) {
      fsRoot = cloneNode(defaultFsRoot);
      return;
    }

    fsRoot = parsed;
  } catch (error) {
    fsRoot = cloneNode(defaultFsRoot);
  }
}

export function resetFsState() {
  fsRoot = cloneNode(defaultFsRoot);
  saveFsState();
}

export function formatLsLong(name, node) {
  const mode = node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
  const size = node.type === "file" ? (node.content || "").length : Object.keys(node.children || {}).length;
  const stamp = new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  return `${mode} 1 ${terminalState.user} ${terminalState.user} ${String(size).padStart(6, " ")} ${stamp} ${name}`;
}

export function expandPathShortcuts(targetPath) {
  if (!targetPath || targetPath === "~") {
    return `/${HOME_PATH.join("/")}`;
  }
  if (targetPath.startsWith("~/")) {
    return `/${HOME_PATH.join("/")}/${targetPath.slice(2)}`;
  }
  return targetPath;
}

export function normalizePath(targetPath, currentPath = state.currentPath) {
  const expanded = expandPathShortcuts(targetPath || ".");
  const pathBits = expanded.startsWith("/")
    ? expanded.split("/").filter(Boolean)
    : [...currentPath, ...expanded.split("/").filter(Boolean)];

  const normalized = [];
  pathBits.forEach((bit) => {
    if (bit === "." || bit === "") {
      return;
    }
    if (bit === "..") {
      normalized.pop();
    } else {
      normalized.push(bit);
    }
  });

  return normalized;
}

export function getNode(pathArray) {
  let node = fsRoot;
  for (const part of pathArray) {
    if (!node.children || !node.children[part]) {
      return null;
    }
    node = node.children[part];
  }
  return node;
}

export function getParent(pathArray) {
  if (!pathArray.length) {
    return null;
  }

  const parentPath = pathArray.slice(0, -1);
  const parentNode = getNode(parentPath);
  return { parentNode, leaf: pathArray[pathArray.length - 1] };
}

export function pathExists(pathArray) {
  return Boolean(getNode(pathArray));
}
