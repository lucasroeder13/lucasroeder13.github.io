import { MOBILE_BREAKPOINT, state } from "./core.js";
import { applyMobileWindowLayout, removeMobileWindowLayout } from "./window-system.js";
import { toggleStartMenu } from "./navigation-ui.js";

export function setupResponsiveMode() {
  const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  media.addEventListener("change", (event) => {
    state.isMobile = event.matches;
    if (state.isMobile) {
      applyMobileWindowLayout();
    } else {
      removeMobileWindowLayout();
    }
  });

  if (state.isMobile) {
    applyMobileWindowLayout();
  }
}

export function setupGlobalKeys() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.startMenuOpen) {
      toggleStartMenu(false);
    }
  });
}
