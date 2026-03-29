import { BOOT_MS, updateTime } from "./core.js";
import { loadFsState } from "./filesystem.js";
import { setupTerminal, focusTerminalInput } from "./terminal.js";
import { renderDesktopIcons, renderStartMenuItems, setupLinks, setupStartMenu } from "./navigation-ui.js";
import { loadGitHubProjects, setupAudioPlayer, setupKonami, setupProjectsWindow } from "./integrations.js";
import { setupGlobalKeys, setupResponsiveMode } from "./responsive.js";
import { setWindowHooks, setupWindowButtons } from "./window-system.js";

// Ensure boot screen is always hidden, with fallback
function hideBootArtifacts() {
  const hideBootScreen = () => {
    try {
      const bsod = document.getElementById("bsod");
      const boot = document.getElementById("boot-screen");
      if (bsod) {
        bsod.style.setProperty("display", "none", "important");
      }
      if (boot) {
        boot.style.setProperty("display", "none", "important");
      }
      console.log("Boot screen hidden");
    } catch (error) {
      console.error("Error hiding boot artifacts:", error);
    }
  };

  // Schedule hiding after BOOT_MS
  setTimeout(hideBootScreen, BOOT_MS || 600);
  
  // Fallback: also hide after a max delay
  setTimeout(hideBootScreen, 2000);
}

function init() {
  console.log("Init started");
  
  try {
    hideBootArtifacts();
    console.log("Boot artifacts hidden");
  } catch (e) {
    console.error("Failed to hide boot artifacts:", e);
  }
  
  try {
    loadFsState();
    console.log("Filesystem state loaded");
  } catch (e) {
    console.error("Failed to load filesystem state:", e);
  }

  try {
    setWindowHooks({
      onTerminalOpen: () => focusTerminalInput(),
      onProjectsOpen: () => loadGitHubProjects()
    });
    console.log("Window hooks set");
  } catch (e) {
    console.error("Failed to set window hooks:", e);
  }

  try {
    renderDesktopIcons();
    console.log("Desktop icons rendered");
  } catch (e) {
    console.error("Failed to render desktop icons:", e);
  }
  
  try {
    renderStartMenuItems();
    console.log("Start menu items rendered");
  } catch (e) {
    console.error("Failed to render start menu items:", e);
  }
  
  try {
    setupWindowButtons();
    console.log("Window buttons setup");
  } catch (e) {
    console.error("Failed to setup window buttons:", e);
  }
  
  try {
    setupTerminal();
    console.log("Terminal setup");
  } catch (e) {
    console.error("Failed to setup terminal:", e);
  }
  
  try {
    setupStartMenu();
    console.log("Start menu setup");
  } catch (e) {
    console.error("Failed to setup start menu:", e);
  }
  
  try {
    setupAudioPlayer();
    console.log("Audio player setup");
  } catch (e) {
    console.error("Failed to setup audio player:", e);
  }
  
  try {
    setupLinks();
    console.log("Links setup");
  } catch (e) {
    console.error("Failed to setup links:", e);
  }
  
  try {
    setupProjectsWindow();
    console.log("Projects window setup");
  } catch (e) {
    console.error("Failed to setup projects window:", e);
  }
  
  try {
    setupKonami();
    console.log("Konami setup");
  } catch (e) {
    console.error("Failed to setup konami:", e);
  }
  
  try {
    setupResponsiveMode();
    console.log("Responsive mode setup");
  } catch (e) {
    console.error("Failed to setup responsive mode:", e);
  }
  
  try {
    setupGlobalKeys();
    console.log("Global keys setup");
  } catch (e) {
    console.error("Failed to setup global keys:", e);
  }
  
  try {
    updateTime();
    setInterval(updateTime, 1000);
    console.log("Time updater started");
  } catch (e) {
    console.error("Failed to start time updater:", e);
  }
  
  console.log("Init complete - all modules initialized");
}

// Ensure DOM is ready before initializing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
