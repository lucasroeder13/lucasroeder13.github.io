import {
  HOME_PATH,
  SHELL_PATH,
  easterEggs,
  elements,
  pathToPrompt,
  pathToPromptPath,
  pathToUnix,
  parseTokens,
  splitByOperator,
  expandEnvVars,
  getBasename,
  state,
  terminalState
} from "./core.js";
import {
  cloneNode,
  formatLsLong,
  getNode,
  getParent,
  normalizePath,
  resetFsState,
  saveFsState
} from "./filesystem.js";
import { closeWindow } from "./window-system.js";

const nanoSession = {
  container: null,
  header: null,
  textarea: null,
  footer: null,
  path: null,
  originalContent: ""
};
let nanoOpen = false;

export function appendTerminalLine(text, className = "") {
  const { cmdHistory } = elements;
  if (!cmdHistory) {
    return;
  }

  const line = document.createElement("p");
  line.className = `terminal-line ${className}`.trim();
  line.textContent = text;
  cmdHistory.appendChild(line);
}

function appendTerminalBlock(lines, className = "") {
  lines.forEach((line) => appendTerminalLine(line, className));
}

function clearTerminal() {
  const { cmdHistory } = elements;
  if (!cmdHistory) {
    return;
  }
  cmdHistory.innerHTML = "";
}

function ensureNanoUi() {
  if (nanoSession.container) {
    return;
  }

  const cmdwind = document.getElementById("cmdwind");
  if (!cmdwind) {
    return;
  }

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.position = "absolute";
  container.style.inset = "6px";
  container.style.display = "none";
  container.style.flexDirection = "column";
  container.style.background = "#10131a";
  container.style.border = "1px solid #4e5b7a";
  container.style.boxShadow = "inset 1px 1px 0 rgba(255,255,255,0.12)";
  container.style.zIndex = "6";

  const header = document.createElement("div");
  header.style.padding = "4px 6px";
  header.style.background = "#0a1f4d";
  header.style.color = "#d9e7ff";
  header.style.fontFamily = '"Courier New", monospace';
  header.style.fontSize = "12px";
  header.style.borderBottom = "1px solid #2c406e";

  const textarea = document.createElement("textarea");
  textarea.spellcheck = false;
  textarea.wrap = "off";
  textarea.style.flex = "1";
  textarea.style.resize = "none";
  textarea.style.border = "0";
  textarea.style.outline = "none";
  textarea.style.padding = "8px";
  textarea.style.background = "#0f1522";
  textarea.style.color = "#dff7ff";
  textarea.style.fontFamily = '"Courier New", monospace';
  textarea.style.fontSize = "12px";
  textarea.style.lineHeight = "1.35";
  textarea.style.whiteSpace = "pre";

  const footer = document.createElement("div");
  footer.style.padding = "3px 6px";
  footer.style.background = "#0a1f4d";
  footer.style.color = "#d9e7ff";
  footer.style.fontFamily = '"Courier New", monospace';
  footer.style.fontSize = "11px";
  footer.style.borderTop = "1px solid #2c406e";

  textarea.addEventListener("input", () => {
    if (!nanoOpen) {
      return;
    }
    const dirty = textarea.value !== nanoSession.originalContent;
    footer.textContent = dirty
      ? "^O Write Out   ^X Exit   ^S Save   (modified)"
      : "^O Write Out   ^X Exit   ^S Save";
  });

  textarea.addEventListener("keydown", (event) => {
    if (!nanoOpen) {
      return;
    }

    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && (key === "o" || key === "s")) {
      event.preventDefault();
      saveNanoBuffer();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && key === "x") {
      event.preventDefault();
      closeNanoEditor();
    }
  });

  container.appendChild(header);
  container.appendChild(textarea);
  container.appendChild(footer);
  cmdwind.appendChild(container);

  nanoSession.container = container;
  nanoSession.header = header;
  nanoSession.textarea = textarea;
  nanoSession.footer = footer;
}

function openNanoEditor(pathArray) {
  ensureNanoUi();
  if (!nanoSession.container || !nanoSession.textarea || !nanoSession.header || !nanoSession.footer) {
    appendTerminalLine("nano: editor UI could not be initialized", "terminal-error");
    return;
  }

  const node = getNode(pathArray);
  if (!node || node.type !== "file") {
    appendTerminalLine("nano: target is not a file", "terminal-error");
    return;
  }

  nanoOpen = true;
  nanoSession.path = [...pathArray];
  nanoSession.originalContent = node.content || "";
  nanoSession.header.textContent = `GNU nano 6.0   ${pathToUnix(pathArray)}`;
  nanoSession.textarea.value = node.content || "";
  nanoSession.footer.textContent = "^O Write Out   ^X Exit   ^S Save";
  nanoSession.container.style.display = "flex";
  nanoSession.container.setAttribute("aria-hidden", "false");
  elements.cmdInput.disabled = true;
  nanoSession.textarea.focus();
}

function saveNanoBuffer() {
  if (!nanoOpen || !nanoSession.path || !nanoSession.textarea || !nanoSession.footer) {
    return;
  }

  const node = getNode(nanoSession.path);
  if (!node || node.type !== "file") {
    nanoSession.footer.textContent = "Write failed: file no longer exists";
    return;
  }

  node.content = nanoSession.textarea.value;
  nanoSession.originalContent = node.content;
  const lineCount = node.content ? node.content.split("\n").length : 0;
  nanoSession.footer.textContent = `[ Wrote ${lineCount} lines ]  ^X Exit`;
  saveFsState();
}

function closeNanoEditor() {
  if (!nanoOpen || !nanoSession.container || !nanoSession.textarea) {
    return;
  }

  const hadUnsavedChanges = nanoSession.textarea.value !== nanoSession.originalContent;
  nanoSession.container.style.display = "none";
  nanoSession.container.setAttribute("aria-hidden", "true");
  nanoOpen = false;
  nanoSession.path = null;
  nanoSession.originalContent = "";
  elements.cmdInput.disabled = false;
  focusTerminalInput();

  if (hadUnsavedChanges) {
    appendTerminalLine("nano: unsaved changes discarded (use ^O or ^S to save)", "terminal-error");
  }
}

function ensurePrompt() {
  if (elements.promptPrefix) {
    elements.promptPrefix.textContent = pathToPrompt();
  }
}

export function focusTerminalInput() {
  const { cmdInput } = elements;
  if (!cmdInput) {
    return;
  }
  cmdInput.focus();
  cmdInput.selectionStart = cmdInput.value.length;
}

function scrollTerminalToBottom() {
  const cmdwind = document.getElementById("cmdwind");
  if (!cmdwind) {
    return;
  }
  cmdwind.scrollTop = cmdwind.scrollHeight;
}

function cmdHelp() {
  appendTerminalBlock([
    "Bash-like mock shell commands:",
    "help, clear, cls, exit, history, resetfs",
    "pwd, ls [-la] [path], cd [path|-], tree [path]",
    "cat <file...>, touch <file...>, head [-n N] <file>, tail [-n N] <file>",
    "mkdir [-p] <dir...>, rm [-rf] <path...>, cp [-r] <src> <dst>, mv <src> <dst>",
    "echo [text], grep [-in] <pattern> <file...>, wc <file...>, nano <file>",
    "uname [-a], whoami, id, which <cmd>, man <cmd>, date, ps",
    "neofetch, fastfetch, owo"
  ]);
}

function cmdLs(args) {
  let showAll = false;
  let longFormat = false;
  const targets = [];

  args.forEach((arg) => {
    if (arg.startsWith("-") && arg.length > 1) {
      arg.slice(1).split("").forEach((flag) => {
        if (flag === "a") {
          showAll = true;
        } else if (flag === "l") {
          longFormat = true;
        } else {
          appendTerminalLine(`ls: invalid option -- '${flag}'`, "terminal-error");
        }
      });
    } else {
      targets.push(arg);
    }
  });

  const resolvedTargets = targets.length ? targets : ["."];

  resolvedTargets.forEach((target, index) => {
    const targetPath = normalizePath(target, state.currentPath);
    const node = getNode(targetPath);

    if (!node) {
      appendTerminalLine(`ls: cannot access '${target}': No such file or directory`, "terminal-error");
      return;
    }

    if (resolvedTargets.length > 1) {
      appendTerminalLine(`${target}:`);
    }

    if (node.type !== "dir") {
      appendTerminalLine(longFormat ? formatLsLong(getBasename(targetPath), node) : getBasename(targetPath));
    } else {
      const entries = Object.entries(node.children || {})
        .filter(([name]) => showAll || !name.startsWith("."))
        .sort(([a], [b]) => a.localeCompare(b));

      if (!entries.length) {
        appendTerminalLine("(empty)");
      } else if (longFormat) {
        entries.forEach(([name, child]) => {
          appendTerminalLine(formatLsLong(name, child));
        });
      } else {
        appendTerminalLine(entries.map(([name]) => name).join("  "));
      }
    }

    if (index < resolvedTargets.length - 1) {
      appendTerminalLine("");
    }
  });
}

function cmdCd(args) {
  const target = args[0] || "~";

  if (target === "-") {
    const nextPath = [...state.previousPath];
    state.previousPath = [...state.currentPath];
    state.currentPath = nextPath;
    ensurePrompt();
    appendTerminalLine(pathToUnix(state.currentPath));
    return;
  }

  const targetPath = normalizePath(target, state.currentPath);
  const node = getNode(targetPath);

  if (!node || node.type !== "dir") {
    appendTerminalLine(`cd: no such file or directory: ${target}`, "terminal-error");
    return;
  }

  state.previousPath = [...state.currentPath];
  state.currentPath = targetPath;
  ensurePrompt();
}

function cmdCat(args) {
  if (!args.length) {
    appendTerminalLine("cat: missing file operand", "terminal-error");
    return;
  }

  args.forEach((target) => {
    const targetPath = normalizePath(target, state.currentPath);
    const node = getNode(targetPath);
    if (!node) {
      appendTerminalLine(`cat: ${target}: No such file or directory`, "terminal-error");
      return;
    }

    if (node.type !== "file") {
      appendTerminalLine(`cat: ${target}: Is a directory`, "terminal-error");
      return;
    }

    appendTerminalBlock((node.content || "").split("\n"));
  });
}

function cmdTouch(args) {
  if (!args.length) {
    appendTerminalLine("touch: missing file operand", "terminal-error");
    return;
  }

  let changed = false;
  args.forEach((target) => {
    const targetPath = normalizePath(target, state.currentPath);
    const parentInfo = getParent(targetPath);
    if (!parentInfo || !parentInfo.parentNode || parentInfo.parentNode.type !== "dir") {
      appendTerminalLine(`touch: cannot touch '${target}': No such file or directory`, "terminal-error");
      return;
    }

    const existing = parentInfo.parentNode.children[parentInfo.leaf];
    if (!existing) {
      parentInfo.parentNode.children[parentInfo.leaf] = { type: "file", content: "" };
      changed = true;
    }
  });

  if (changed) {
    saveFsState();
  }
}

function cmdMkdir(args) {
  if (!args.length) {
    appendTerminalLine("mkdir: missing operand", "terminal-error");
    return;
  }

  const recursive = args.includes("-p");
  const targets = args.filter((arg) => arg !== "-p");

  if (!targets.length) {
    appendTerminalLine("mkdir: missing operand", "terminal-error");
    return;
  }

  let changed = false;
  targets.forEach((target) => {
    const targetPath = normalizePath(target, state.currentPath);

    if (!recursive) {
      const parentInfo = getParent(targetPath);
      if (!parentInfo || !parentInfo.parentNode || parentInfo.parentNode.type !== "dir") {
        appendTerminalLine(`mkdir: cannot create directory '${target}': No such file or directory`, "terminal-error");
        return;
      }
      if (parentInfo.parentNode.children[parentInfo.leaf]) {
        appendTerminalLine(`mkdir: cannot create directory '${target}': File exists`, "terminal-error");
        return;
      }
      parentInfo.parentNode.children[parentInfo.leaf] = { type: "dir", children: {} };
      changed = true;
      return;
    }

    let cursor = getNode([]);
    let valid = true;
    targetPath.forEach((part) => {
      if (!cursor.children) {
        valid = false;
        return;
      }

      if (!cursor.children[part]) {
        cursor.children[part] = { type: "dir", children: {} };
        changed = true;
      }

      if (cursor.children[part].type !== "dir") {
        appendTerminalLine(`mkdir: cannot create directory '${target}': Not a directory`, "terminal-error");
        valid = false;
        return;
      }

      cursor = cursor.children[part];
    });

    if (!valid) {
      return;
    }
  });

  if (changed) {
    saveFsState();
  }
}

function cmdRm(args) {
  if (!args.length) {
    appendTerminalLine("rm: missing operand", "terminal-error");
    return;
  }

  let recursive = false;
  let force = false;
  const targets = [];

  args.forEach((arg) => {
    if (arg.startsWith("-") && arg.length > 1) {
      arg.slice(1).split("").forEach((flag) => {
        if (flag === "r" || flag === "R") {
          recursive = true;
        } else if (flag === "f") {
          force = true;
        } else {
          appendTerminalLine(`rm: invalid option -- '${flag}'`, "terminal-error");
        }
      });
    } else {
      targets.push(arg);
    }
  });

  if (!targets.length) {
    appendTerminalLine("rm: missing operand", "terminal-error");
    return;
  }

  let changed = false;
  targets.forEach((targetArg) => {
    const targetPath = normalizePath(targetArg, state.currentPath);
    const parentInfo = getParent(targetPath);
    if (!parentInfo || !parentInfo.parentNode || !parentInfo.parentNode.children[parentInfo.leaf]) {
      if (!force) {
        appendTerminalLine(`rm: cannot remove '${targetArg}': No such file or directory`, "terminal-error");
      }
      return;
    }

    const node = parentInfo.parentNode.children[parentInfo.leaf];
    if (node.type === "dir" && Object.keys(node.children).length > 0 && !recursive) {
      appendTerminalLine(`rm: cannot remove '${targetArg}': Is a directory`, "terminal-error");
      return;
    }

    delete parentInfo.parentNode.children[parentInfo.leaf];
    changed = true;
  });

  if (changed) {
    saveFsState();
  }
}

function cmdCp(args) {
  const recursive = args.includes("-r") || args.includes("-R");
  const filtered = args.filter((arg) => arg !== "-r" && arg !== "-R");

  if (filtered.length < 2) {
    appendTerminalLine("cp: missing file operand", "terminal-error");
    return;
  }

  const [srcArg, destArg] = filtered;
  const srcPath = normalizePath(srcArg, state.currentPath);
  const srcNode = getNode(srcPath);
  if (!srcNode) {
    appendTerminalLine(`cp: cannot stat '${srcArg}': No such file or directory`, "terminal-error");
    return;
  }

  if (srcNode.type === "dir" && !recursive) {
    appendTerminalLine(`cp: -r not specified; omitting directory '${srcArg}'`, "terminal-error");
    return;
  }

  let destPath = normalizePath(destArg, state.currentPath);
  const destNode = getNode(destPath);
  if (destNode && destNode.type === "dir") {
    destPath = [...destPath, getBasename(srcPath)];
  }

  const destParent = getParent(destPath);
  if (!destParent || !destParent.parentNode || destParent.parentNode.type !== "dir") {
    appendTerminalLine(`cp: cannot create regular file '${destArg}': No such file or directory`, "terminal-error");
    return;
  }

  destParent.parentNode.children[destParent.leaf] = cloneNode(srcNode);
  saveFsState();
}

function cmdMv(args) {
  if (args.length < 2) {
    appendTerminalLine("mv: missing file operand", "terminal-error");
    return;
  }

  const [srcArg, destArg] = args;
  const srcPath = normalizePath(srcArg, state.currentPath);
  const srcParent = getParent(srcPath);
  const srcNode = getNode(srcPath);

  if (!srcNode || !srcParent || !srcParent.parentNode) {
    appendTerminalLine(`mv: cannot stat '${srcArg}': No such file or directory`, "terminal-error");
    return;
  }

  let destPath = normalizePath(destArg, state.currentPath);
  const destNode = getNode(destPath);
  if (destNode && destNode.type === "dir") {
    destPath = [...destPath, getBasename(srcPath)];
  }

  const destParent = getParent(destPath);
  if (!destParent || !destParent.parentNode || destParent.parentNode.type !== "dir") {
    appendTerminalLine(`mv: cannot move '${srcArg}' to '${destArg}': No such file or directory`, "terminal-error");
    return;
  }

  destParent.parentNode.children[destParent.leaf] = srcNode;
  delete srcParent.parentNode.children[srcParent.leaf];
  saveFsState();
}

function cmdEcho(args) {
  if (!args.length) {
    appendTerminalLine("");
    return;
  }

  const redirIndex = args.findIndex((arg) => arg === ">" || arg === ">>");
  let textArgs = args;
  let redirMode = null;
  let redirPathArg = null;

  if (redirIndex >= 0) {
    redirMode = args[redirIndex];
    redirPathArg = args[redirIndex + 1];
    textArgs = args.slice(0, redirIndex);
    if (!redirPathArg) {
      appendTerminalLine("echo: redirection requires a target file", "terminal-error");
      return;
    }
  }

  const text = expandEnvVars(textArgs.join(" "));

  if (!redirMode) {
    appendTerminalLine(text);
    return;
  }

  const redirPath = normalizePath(redirPathArg, state.currentPath);
  const parentInfo = getParent(redirPath);

  if (!parentInfo || !parentInfo.parentNode || parentInfo.parentNode.type !== "dir") {
    appendTerminalLine(`echo: ${redirPathArg}: No such file or directory`, "terminal-error");
    return;
  }

  const existing = parentInfo.parentNode.children[parentInfo.leaf];
  if (existing && existing.type === "dir") {
    appendTerminalLine(`echo: ${redirPathArg}: Is a directory`, "terminal-error");
    return;
  }

  if (!existing) {
    parentInfo.parentNode.children[parentInfo.leaf] = { type: "file", content: "" };
  }

  if (redirMode === ">>") {
    parentInfo.parentNode.children[parentInfo.leaf].content += `${text}\n`;
  } else {
    parentInfo.parentNode.children[parentInfo.leaf].content = `${text}\n`;
  }

  saveFsState();
}

function cmdNano(args) {
  const target = args[0];
  if (!target) {
    appendTerminalLine("nano: missing file operand", "terminal-error");
    return;
  }

  const targetPath = normalizePath(target, state.currentPath);
  const parentInfo = getParent(targetPath);
  if (!parentInfo || !parentInfo.parentNode || parentInfo.parentNode.type !== "dir") {
    appendTerminalLine(`nano: ${target}: No such file or directory`, "terminal-error");
    return;
  }

  const existing = getNode(targetPath);
  if (existing && existing.type === "dir") {
    appendTerminalLine(`nano: ${target}: Is a directory`, "terminal-error");
    return;
  }

  if (!existing) {
    parentInfo.parentNode.children[parentInfo.leaf] = { type: "file", content: "" };
    saveFsState();
  }

  openNanoEditor(targetPath);
}

function cmdResetFs() {
  if (nanoOpen) {
    closeNanoEditor();
  }

  resetFsState();
  state.currentPath = ["home", "lucy", "Desktop"];
  state.previousPath = ["home", "lucy", "Desktop"];
  ensurePrompt();
  appendTerminalLine("filesystem reset: mock disk restored to defaults");
}

function cmdShowHistory() {
  if (!state.history.length) {
    appendTerminalLine("history is empty");
    return;
  }

  state.history.forEach((entry, index) => {
    appendTerminalLine(`${String(index + 1).padStart(4, " ")}  ${entry}`);
  });
}

function cmdTree(args) {
  const target = args[0] || ".";
  const targetPath = normalizePath(target, state.currentPath);
  const root = getNode(targetPath);

  if (!root) {
    appendTerminalLine(`tree: ${target}: No such file or directory`, "terminal-error");
    return;
  }

  appendTerminalLine(pathToPromptPath(targetPath));

  function walk(node, prefix) {
    if (node.type !== "dir") {
      return;
    }

    const entries = Object.entries(node.children || {}).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([name, child], idx) => {
      const isLast = idx === entries.length - 1;
      appendTerminalLine(`${prefix}${isLast ? "└── " : "├── "}${name}`);
      if (child.type === "dir") {
        walk(child, `${prefix}${isLast ? "    " : "│   "}`);
      }
    });
  }

  walk(root, "");
}

function cmdHead(args) {
  let lines = 10;
  let fileArg = args[0];

  if (args[0] === "-n") {
    lines = Math.max(1, parseInt(args[1], 10) || 10);
    fileArg = args[2];
  }

  if (!fileArg) {
    appendTerminalLine("head: missing file operand", "terminal-error");
    return;
  }

  const node = getNode(normalizePath(fileArg, state.currentPath));
  if (!node || node.type !== "file") {
    appendTerminalLine(`head: cannot open '${fileArg}'`, "terminal-error");
    return;
  }

  appendTerminalBlock((node.content || "").split("\n").slice(0, lines));
}

function cmdTail(args) {
  let lines = 10;
  let fileArg = args[0];

  if (args[0] === "-n") {
    lines = Math.max(1, parseInt(args[1], 10) || 10);
    fileArg = args[2];
  }

  if (!fileArg) {
    appendTerminalLine("tail: missing file operand", "terminal-error");
    return;
  }

  const node = getNode(normalizePath(fileArg, state.currentPath));
  if (!node || node.type !== "file") {
    appendTerminalLine(`tail: cannot open '${fileArg}'`, "terminal-error");
    return;
  }

  const contentLines = (node.content || "").split("\n");
  appendTerminalBlock(contentLines.slice(Math.max(0, contentLines.length - lines)));
}

function cmdGrep(args) {
  let ignoreCase = false;
  let showLineNumbers = false;
  const filtered = [];

  args.forEach((arg) => {
    if (arg === "-i") {
      ignoreCase = true;
    } else if (arg === "-n") {
      showLineNumbers = true;
    } else {
      filtered.push(arg);
    }
  });

  const pattern = filtered[0];
  const files = filtered.slice(1);

  if (!pattern || !files.length) {
    appendTerminalLine("grep: usage: grep [-in] <pattern> <file...>", "terminal-error");
    return;
  }

  const needle = ignoreCase ? pattern.toLowerCase() : pattern;
  const multi = files.length > 1;

  files.forEach((file) => {
    const node = getNode(normalizePath(file, state.currentPath));
    if (!node || node.type !== "file") {
      appendTerminalLine(`grep: ${file}: No such file`, "terminal-error");
      return;
    }

    (node.content || "").split("\n").forEach((line, idx) => {
      const candidate = ignoreCase ? line.toLowerCase() : line;
      if (!candidate.includes(needle)) {
        return;
      }

      const prefixParts = [];
      if (multi) {
        prefixParts.push(file);
      }
      if (showLineNumbers) {
        prefixParts.push(String(idx + 1));
      }

      const prefix = prefixParts.length ? `${prefixParts.join(":")}:` : "";
      appendTerminalLine(`${prefix}${line}`);
    });
  });
}

function cmdWc(args) {
  if (!args.length) {
    appendTerminalLine("wc: missing file operand", "terminal-error");
    return;
  }

  args.forEach((file) => {
    const node = getNode(normalizePath(file, state.currentPath));
    if (!node || node.type !== "file") {
      appendTerminalLine(`wc: ${file}: No such file`, "terminal-error");
      return;
    }

    const content = node.content || "";
    const lineCount = content ? content.split("\n").length : 0;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const bytes = content.length;
    appendTerminalLine(`${String(lineCount).padStart(6, " ")}${String(words).padStart(8, " ")}${String(bytes).padStart(8, " ")} ${file}`);
  });
}

function cmdWhich(args) {
  const aliases = {
    ll: "ls -la",
    la: "ls -a"
  };

  const commands = [
    "help", "clear", "cls", "exit", "pwd", "ls", "cd", "cat", "touch", "mkdir", "rm", "cp", "mv", "echo",
    "history", "tree", "head", "tail", "grep", "wc", "nano", "resetfs", "uname", "whoami", "id", "which", "man", "date", "ps", "neofetch", "fastfetch", "owo"
  ];

  if (!args.length) {
    appendTerminalLine("which: usage: which <command>", "terminal-error");
    return;
  }

  args.forEach((name) => {
    if (aliases[name]) {
      appendTerminalLine(`${name}: aliased to ${aliases[name]}`);
    } else if (commands.includes(name)) {
      appendTerminalLine(`/usr/bin/${name}`);
    } else {
      appendTerminalLine(`${name} not found`, "terminal-error");
    }
  });
}

function cmdMan(args) {
  const topic = args[0];
  if (!topic) {
    appendTerminalLine("What manual page do you want?", "terminal-error");
    return;
  }

  const pages = {
    ls: "ls - list directory contents\nusage: ls [-la] [path]",
    cd: "cd - change directory\nusage: cd [path|-]",
    mkdir: "mkdir - make directories\nusage: mkdir [-p] <dir...>",
    rm: "rm - remove files or directories\nusage: rm [-rf] <path...>",
    grep: "grep - print matching lines\nusage: grep [-in] <pattern> <file...>",
    wc: "wc - count lines, words, and bytes\nusage: wc <file...>",
    history: "history - show command history\nusage: history",
    nano: "nano - open mock nano editor\nusage: nano <file>\nkeys: ^O/^S save, ^X exit",
    resetfs: "resetfs - restore mock filesystem defaults\nusage: resetfs"
  };

  if (!pages[topic]) {
    appendTerminalLine(`No manual entry for ${topic}`, "terminal-error");
    return;
  }

  appendTerminalBlock(pages[topic].split("\n"));
}

function renderFetch() {
  const now = new Date().toLocaleTimeString();
  appendTerminalBlock([
    "      .--.      lucy@bimbows",
    "   .-(    ).    -------------",
    "  (___.__)__)   OS: Bimbows 69",
    `               Host: ${terminalState.hostname}`,
    `               Kernel: ${terminalState.kernel}`,
    `               Shell: ${terminalState.shellName}`,
    `               Time: ${now}`,
    "               Uptime: 1d 2h",
    `               Mood: ${easterEggs[Math.floor(Math.random() * easterEggs.length)]}`
  ], "terminal-fetch");
}

export function runTerminalCommand(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return;
  }

  const aliases = {
    ll: "ls -la",
    la: "ls -a"
  };

  const commands = splitByOperator(trimmed, ";");
  commands.forEach((commandLine) => {
    appendTerminalLine(`${pathToPrompt()} ${commandLine}`, "terminal-prompt");
    state.history.push(commandLine);
    state.historyIndex = state.history.length;

    const tokens = parseTokens(commandLine);
    const commandName = (tokens[0] || "").toLowerCase();
    const aliasExpansion = aliases[commandName];

    const expandedTokens = aliasExpansion
      ? [...parseTokens(aliasExpansion), ...tokens.slice(1)]
      : tokens;

    const command = (expandedTokens[0] || "").toLowerCase();
    const args = expandedTokens.slice(1);

    switch (command) {
      case "help":
        cmdHelp();
        break;
      case "clear":
      case "cls":
        clearTerminal();
        break;
      case "exit":
        closeWindow("cmd");
        break;
      case "pwd":
        appendTerminalLine(pathToUnix(state.currentPath));
        break;
      case "ls":
        cmdLs(args);
        break;
      case "cd":
        cmdCd(args);
        break;
      case "cat":
        cmdCat(args);
        break;
      case "touch":
        cmdTouch(args);
        break;
      case "mkdir":
        cmdMkdir(args);
        break;
      case "rm":
        cmdRm(args);
        break;
      case "cp":
        cmdCp(args);
        break;
      case "mv":
        cmdMv(args);
        break;
      case "echo":
        cmdEcho(args);
        break;
      case "history":
        cmdShowHistory();
        break;
      case "nano":
        cmdNano(args);
        break;
      case "resetfs":
        cmdResetFs();
        break;
      case "tree":
        cmdTree(args);
        break;
      case "head":
        cmdHead(args);
        break;
      case "tail":
        cmdTail(args);
        break;
      case "grep":
        cmdGrep(args);
        break;
      case "wc":
        cmdWc(args);
        break;
      case "which":
        cmdWhich(args);
        break;
      case "man":
        cmdMan(args);
        break;
      case "uname":
        if (args[0] === "-a") {
          appendTerminalLine(`${terminalState.osName} ${terminalState.hostname} ${terminalState.kernel} ${terminalState.shellName}`);
        } else {
          appendTerminalLine(terminalState.osName);
        }
        break;
      case "whoami":
        appendTerminalLine(terminalState.user);
        break;
      case "id":
        appendTerminalLine(`uid=1000(${terminalState.user}) gid=1000(${terminalState.user}) groups=1000(${terminalState.user})`);
        break;
      case "date":
        appendTerminalLine(new Date().toString());
        break;
      case "ps":
        appendTerminalBlock([
          "  PID TTY          TIME CMD",
          ` 1001 pts/0    00:00:00 ${terminalState.shellName}`,
          " 1024 pts/0    00:00:00 web-desktop"
        ]);
        break;
      case "neofetch":
      case "fastfetch":
        renderFetch();
        break;
      case "owo":
        appendTerminalLine("OwO what's this? UwU");
        break;
      default:
        appendTerminalLine(`${command}: command not found`, "terminal-error");
    }
  });

  ensurePrompt();
  scrollTerminalToBottom();
}

export function setupTerminal() {
  const { cmdInput } = elements;
  if (!cmdInput) {
    return;
  }

  appendTerminalLine(`GNU ${terminalState.shellName}, version 5.2.0(1)-release (mock)`, "terminal-banner");
  appendTerminalLine(`Welcome ${terminalState.user}. Type 'help' for available commands.`, "terminal-banner");
  appendTerminalLine("This is a safe in-browser shell simulation.", "terminal-banner");
  ensurePrompt();
  focusTerminalInput();

  cmdInput.addEventListener("keydown", (event) => {
    if (nanoOpen) {
      return;
    }

    if (event.key === "Enter") {
      runTerminalCommand(cmdInput.value);
      cmdInput.value = "";
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!state.history.length) {
        return;
      }
      state.historyIndex = Math.max(0, state.historyIndex - 1);
      cmdInput.value = state.history[state.historyIndex] || "";
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!state.history.length) {
        return;
      }
      state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
      cmdInput.value = state.history[state.historyIndex] || "";
    }
  });
}
