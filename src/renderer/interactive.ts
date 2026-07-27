/**
 * The only client-side JavaScript Forma ships: a handful of small,
 * independent islands (theme toggle, code copy). Everything else in the
 * document is readable and navigable with JS disabled. No framework
 * runtime, no bundler client chunk — this is the literal inline script.
 */
export function buildInteractiveScript(): string {
  return `
(() => {
  const root = document.documentElement;
  const STORAGE_KEY = "forma-theme";

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function initThemeToggle() {
    const toggle = document.querySelector("[data-forma-theme-toggle]");
    if (!toggle) return;
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch {}
    if (stored) applyTheme(stored);
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme")
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    }, { passive: true });
  }

  function initTocActiveState() {
    const links = document.querySelectorAll(".toc a[href^='#']");
    if (links.length === 0 || !("IntersectionObserver" in window)) return;
    const targets = new Map();
    for (const link of links) {
      const id = link.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) targets.set(el, link);
    }
    const setActive = (link) => {
      for (const l of links) l.removeAttribute("aria-current");
      if (link) link.setAttribute("aria-current", "true");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(targets.get(visible[0].target));
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    for (const el of targets.keys()) observer.observe(el);
  }

  function initCodeCopy() {
    const frames = document.querySelectorAll(".blk-code__frame");
    for (const frame of frames) {
      const pre = frame.querySelector("pre");
      if (!pre) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy no-print";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        const text = pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
        } catch {
          button.textContent = "Copy failed";
        }
        setTimeout(() => { button.textContent = "Copy"; }, 1600);
      });
      frame.prepend(button);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { initThemeToggle(); initCodeCopy(); initTocActiveState(); });
  } else {
    initThemeToggle();
    initCodeCopy();
    initTocActiveState();
  }
})();
`.trim();
}
