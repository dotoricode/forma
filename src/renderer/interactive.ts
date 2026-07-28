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
  
  /* Environment filter for manuals. Steps and commands declare which
     environments they belong to; this narrows the page to one of them.
     Nothing is hidden until a choice is made, so a manual whose script
     fails to run still shows every step. */
  function initEnvSelector() {
    const control = document.querySelector("[data-forma-env-selector]");
    if (!control) return;
    const scoped = Array.from(document.querySelectorAll("[data-environments]"));
    if (scoped.length === 0) return;
    const STORAGE_KEY = "forma-env";

    function apply(env) {
      for (const el of scoped) {
        const tags = (el.getAttribute("data-environments") || "").split(" ").filter(Boolean);
        const match = !env || tags.length === 0 || tags.indexOf(env) !== -1;
        el.hidden = !match;
      }
      for (const button of control.querySelectorAll("[data-env-option]")) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-env-option") === env));
      }
      const fallback = document.querySelector(".blk-env-selector__fallback");
      if (fallback) fallback.hidden = Boolean(env);
    }

    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch {}
    control.addEventListener("click", (event) => {
      const button = event.target.closest("[data-env-option]");
      if (!button) return;
      const next = button.getAttribute("data-env-option");
      const env = button.getAttribute("aria-pressed") === "true" ? null : next;
      try { env ? localStorage.setItem(STORAGE_KEY, env) : localStorage.removeItem(STORAGE_KEY); } catch {}
      apply(env);
    });
    if (stored) apply(stored);
  }

  initThemeToggle();
  initEnvSelector();
    initCodeCopy();
    initTocActiveState();
  }
})();
`.trim();
}
