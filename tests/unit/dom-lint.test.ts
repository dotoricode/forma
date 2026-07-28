import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { lintDom, scanElements } from "../../src/qa/dom-lint.js";

const page = (body: string, style = "") =>
  `<!doctype html><html><head><style>${style}</style></head><body>${body}</body></html>`;

const section = (blk: string, inner = "") =>
  `<section class="section ${blk}"><div class="measure">${inner}</div></section>`;

/**
 * Each rule is paired: it must fire on the defect and stay quiet on
 * correct output. A rule that only ever passes is indistinguishable from
 * one that is broken.
 */
describe("scanElements", () => {
  it("ignores angle brackets inside style and script bodies", () => {
    const html = page(
      `<section class="section blk-a"></section><script>if (a < b) {}</script>`,
      `.x::after { content: "<"; }`,
    );
    expect(scanElements(html).filter((el) => el.tag === "section")).toHaveLength(1);
  });

  it("does not let void elements skew nesting depth", () => {
    const html = page(`<div class="a"><br><img src="x"><span class="b"></span></div>`);
    const elements = scanElements(html);
    const outer = elements.find((el) => el.classes.includes("a"));
    const inner = elements.find((el) => el.classes.includes("b"));
    expect(inner?.depth).toBe((outer?.depth ?? 0) + 1);
  });
});

describe("card-saturation", () => {
  it("fires when most sections sit on a raised surface", () => {
    const body = Array.from({ length: 6 }, (_, i) =>
      section(`blk-${i}`, i < 5 ? `<div class="metric"></div>` : ""),
    ).join("");
    expect(lintDom(page(body)).some((f) => f.rule === "card-saturation")).toBe(true);
  });

  it("stays quiet when cards are the exception", () => {
    const body = Array.from({ length: 6 }, (_, i) =>
      section(`blk-${i}`, i === 0 ? `<div class="metric"></div>` : ""),
    ).join("");
    expect(lintDom(page(body)).some((f) => f.rule === "card-saturation")).toBe(false);
  });

  it("does not judge a document too short to have a pattern", () => {
    const body = section("blk-a", `<div class="metric"></div>`);
    expect(lintDom(page(body)).some((f) => f.rule === "card-saturation")).toBe(false);
  });
});

describe("nested-surface", () => {
  it("fires on a card inside a card", () => {
    const body = section("blk-a", `<div class="metric"><div class="blk-code__frame"></div></div>`);
    expect(lintDom(page(body)).some((f) => f.rule === "nested-surface")).toBe(true);
  });

  it("accepts sibling cards", () => {
    const body = section("blk-a", `<div class="metric"></div><div class="metric"></div>`);
    expect(lintDom(page(body)).some((f) => f.rule === "nested-surface")).toBe(false);
  });
});

describe("layout-repetition", () => {
  it("fires on four consecutive sections of the same block", () => {
    const body = Array.from({ length: 4 }, () => section("blk-prose")).join("");
    expect(lintDom(page(body)).some((f) => f.rule === "layout-repetition")).toBe(true);
  });

  it("accepts three, which is a rhythm rather than a template", () => {
    const body = Array.from({ length: 3 }, () => section("blk-prose")).join("");
    expect(lintDom(page(body)).some((f) => f.rule === "layout-repetition")).toBe(false);
  });
});

describe("pill-overuse", () => {
  it("fires past a dozen badges", () => {
    const body = section(
      "blk-a",
      Array.from({ length: 13 }, () => `<span class="blk-finding__badge"></span>`).join(""),
    );
    expect(lintDom(page(body)).some((f) => f.rule === "pill-overuse")).toBe(true);
  });

  it("accepts a handful", () => {
    const body = section(
      "blk-a",
      Array.from({ length: 4 }, () => `<span class="blk-finding__badge"></span>`).join(""),
    );
    expect(lintDom(page(body)).some((f) => f.rule === "pill-overuse")).toBe(false);
  });
});

describe("false-interactivity", () => {
  it("fires on a hover treatment for something that cannot be clicked", () => {
    const html = page("", `.blk-finding:hover { transform: translateY(-2px); }`);
    expect(lintDom(html).some((f) => f.rule === "false-interactivity")).toBe(true);
  });

  it("accepts hover on genuinely interactive elements", () => {
    const html = page(
      "",
      `a:hover { color: red; } .theme-toggle:hover { border-color: red; } summary:hover { color: red; }`,
    );
    expect(lintDom(html).some((f) => f.rule === "false-interactivity")).toBe(false);
  });
});

describe("verified-claim-without-evidence", () => {
  it("fires when a verified block renders no source list", () => {
    const body = section("blk-finding", `<span class="confidence-tag" data-confidence="verified"></span>`);
    expect(lintDom(page(body)).some((f) => f.rule === "verified-claim-without-evidence")).toBe(true);
  });

  it("accepts a verified block that lists its sources", () => {
    const body = section(
      "blk-finding",
      `<span class="confidence-tag" data-confidence="verified"></span><div class="blk-source-note"><ul><li>x</li></ul></div>`,
    );
    expect(lintDom(page(body)).some((f) => f.rule === "verified-claim-without-evidence")).toBe(false);
  });

  it("ignores a block that only claims inference", () => {
    const body = section("blk-finding", `<span class="confidence-tag" data-confidence="inferred"></span>`);
    expect(lintDom(page(body)).some((f) => f.rule === "verified-claim-without-evidence")).toBe(false);
  });
});

describe("prose-run", () => {
  it("fires on four consecutive prose-only sections", () => {
    const body = ["blk-prose", "blk-summary", "blk-prose", "blk-appendix"]
      .map((blk) => section(blk, "text"))
      .join("");
    expect(lintDom(page(body)).some((f) => f.rule === "prose-run")).toBe(true);
  });

  it("accepts a run broken by a figure", () => {
    const body = ["blk-prose", "blk-summary", "blk-chart", "blk-prose", "blk-appendix"]
      .map((blk) => section(blk, "text"))
      .join("");
    expect(lintDom(page(body)).some((f) => f.rule === "prose-run")).toBe(false);
  });
});

describe("orphan-heading", () => {
  it("fires on a heading with almost nothing under it", () => {
    const body = section("blk-prose", "<h2>Overview</h2><p>Yes.</p>");
    expect(lintDom(page(body)).some((f) => f.rule === "orphan-heading")).toBe(true);
  });

  it("accepts a heading with real content under it", () => {
    const body = section(
      "blk-prose",
      "<h2>Overview</h2><p>This section actually explains the thing it names, at some length.</p>",
    );
    expect(lintDom(page(body)).some((f) => f.rule === "orphan-heading")).toBe(false);
  });

  it("exempts blocks that are a heading by design", () => {
    // A cover or a thesis is a headline with no body; that is the block.
    const body = section("blk-cover", "<h1>Title</h1>") + section("blk-thesis", "<h2>Claim.</h2>");
    expect(lintDom(page(body)).some((f) => f.rule === "orphan-heading")).toBe(false);
  });
});

describe("shipped output", () => {
  it("passes every fixture Forma actually ships", async () => {
    for (const dir of [
      "fixtures/explain",
      "fixtures/review",
      "fixtures/test",
      "fixtures/report",
      "fixtures/report/technical",
      "fixtures/manual/quickstart",
      "fixtures/dashboard/release-gate",
    ]) {
      const html = await readFile(`${dir}/output/index.html`, "utf-8");
      const findings = lintDom(html);
      expect(findings.map((f) => `${f.rule}: ${f.message}`), dir).toEqual([]);
    }
  });
});
