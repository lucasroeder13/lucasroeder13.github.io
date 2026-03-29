(() => {
  // Compatibility loader kept temporarily during migration to ES modules.
  import("./js/init.js").catch((error) => {
    console.error("Failed to load modular app entry:", error);
  });
})();
