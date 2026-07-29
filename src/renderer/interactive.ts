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


  /* Simulation. The AST walk below mirrors src/spec/formula.ts exactly:
     literal, variable, and four operators, nothing else. There is no eval,
     no Function constructor and no identifier lookup, so a formula authored
     into a spec cannot reach anything but the declared inputs. */
  function evalFormula(node, vars, depth) {
    if (depth > 32) throw new Error("formula too deep");
    if (node.type === "literal") return node.value;
    if (node.type === "variable") {
      const v = vars[node.name];
      if (v === undefined) throw new Error("undeclared variable");
      return v;
    }
    if (node.type !== "operation") throw new Error("unknown node");
    const l = evalFormula(node.left, vars, depth + 1);
    const r = evalFormula(node.right, vars, depth + 1);
    if (node.operator === "add") return l + r;
    if (node.operator === "subtract") return l - r;
    if (node.operator === "multiply") return l * r;
    if (node.operator === "divide") {
      if (r === 0) throw new Error("divide by zero");
      return l / r;
    }
    throw new Error("unknown operator");
  }

  function initSimulations() {
    for (const panel of document.querySelectorAll("[data-forma-simulation]")) {
      const inputs = Array.from(panel.querySelectorAll("[data-sim-input]"));
      const outputs = Array.from(panel.querySelectorAll("[data-sim-output]"));
      if (inputs.length === 0 || outputs.length === 0) continue;

      const recompute = () => {
        const vars = {};
        for (const input of inputs) {
          const name = input.getAttribute("data-sim-input");
          vars[name] = Number(input.value);
          const echo = panel.querySelector('[data-sim-echo="' + name + '"]');
          if (echo) echo.textContent = String(input.value);
        }
        for (const output of outputs) {
          const precision = Number(output.getAttribute("data-sim-precision") || 2);
          const unit = output.getAttribute("data-sim-unit") || "";
          try {
            const node = JSON.parse(output.getAttribute("data-sim-output"));
            output.textContent = evalFormula(node, vars, 0).toFixed(precision) + unit;
          } catch {
            /* A broken formula leaves the build-time value in place rather
               than replacing a real number with NaN. */
          }
        }
      };

      for (const input of inputs) input.addEventListener("input", recompute);
      const fallback = panel.querySelector(".blk-simulation__fallback");
      if (fallback) fallback.hidden = true;
    }
  }

  initThemeToggle();
  initSimulations();
  initEnvSelector();
    initCodeCopy();
    initTocActiveState();
  }
})();
`.trim();
}
