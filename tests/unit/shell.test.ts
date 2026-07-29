import { describe, expect, it } from "vitest";
import { renderSpecToHtml } from "../../src/renderer/shell.js";
import { loadSpecFile } from "../../src/renderer/render.js";

const FIXTURE = "fixtures/manual/quickstart/forma.spec.json";
const DASHBOARD_FIXTURE = "examples/dashboard/forma.spec.json";

/**
 * The document bar replaced a bare theme button floating in the page corner.
 * These pin the parts that made it a bar rather than a control: it says what
 * the document is, and it keeps the confidentiality label on screen while
 * scrolling instead of only at the very bottom of the page.
 */
describe("document bar", () => {
  it("names the document and its confidentiality", async () => {
    const spec = await loadSpecFile(FIXTURE);
    const { html } = await renderSpecToHtml(spec);
    const bar = html.slice(html.indexOf('<header class="doc-bar'), html.indexOf("</header>"));
    expect(bar).toContain(spec.meta.title);
    expect(bar).toContain(spec.meta.confidentiality);
  });

  it("gives the icon-only toggle an accessible name, since the glyph carries none", async () => {
    const spec = await loadSpecFile(FIXTURE);
    const { html } = await renderSpecToHtml(spec);
    const bar = html.slice(html.indexOf('<header class="doc-bar'), html.indexOf("</header>"));
    expect(bar).toMatch(/<button[^>]+aria-label="[^"]+"/);
    // Both glyphs ship and CSS picks one, so both have to be in the markup
    // and neither may be the button's accessible name.
    expect(bar).toContain("theme-toggle__icon--moon");
    expect(bar).toContain("theme-toggle__icon--sun");
    expect(bar).toContain('aria-hidden="true"');
  });

  it("ships a rail heading that does not double-announce the nav's own label", async () => {
    const spec = await loadSpecFile(FIXTURE);
    const { html } = await renderSpecToHtml(spec);
    // The nav already carries aria-label, so the visible heading is
    // aria-hidden. Without that a screen reader announces the rail twice.
    expect(html).toMatch(/<p class="toc__label" aria-hidden="true">/);
  });

  it("gives manuals separate guide navigation and page navigation", async () => {
    const spec = await loadSpecFile(FIXTURE);
    const { html } = await renderSpecToHtml(spec);

    expect(html).toContain('class="guide-nav');
    expect(html).toContain('class="guide-nav__group"');
    expect(html).toContain('class="side-toc');
  });

  it("puts dashboard status and metrics before explanatory narrative", async () => {
    const spec = await loadSpecFile(DASHBOARD_FIXTURE);
    const { html } = await renderSpecToHtml(spec);

    const body = html.slice(html.indexOf("<body>"));
    const status = body.indexOf('class="section blk-status-header');
    const metrics = body.indexOf('class="section blk-metric-group');
    const chart = body.indexOf('class="section blk-chart');
    const narrative = body.indexOf('class="section blk-narrative');
    expect(status).toBeGreaterThan(-1);
    expect(metrics).toBeGreaterThan(status);
    expect(chart).toBeGreaterThan(metrics);
    expect(narrative).toBeGreaterThan(chart);
  });
});
