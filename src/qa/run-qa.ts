#!/usr/bin/env tsx
/**
 * Full browser QA gate: for each fixture's rendered `index.html`, checks
 * console errors, zero external network requests, horizontal overflow,
 * axe-core accessibility violations, and captures screenshots at the four
 * required viewports. Writes results into each fixture's `output/qa/`.
 */
import { chromium, type Page } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
];

const FIXTURES = ["explain", "review", "test", "report"];

interface FixtureQaResult {
  fixture: string;
  consoleErrors: string[];
  externalRequests: string[];
  overflowElements: number;
  axeViolationCount: number;
  axeViolations: { id: string; impact: string | null; nodes: number }[];
  headingOrderOk: boolean;
}

async function checkHorizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    let overflowing = 0;
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      if (el.scrollWidth > docWidth + 1 && getComputedStyle(el).overflowX !== "auto" && getComputedStyle(el).overflowX !== "scroll") {
        overflowing += 1;
      }
    }
    return overflowing;
  });
}

async function checkHeadingOrder(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((h) =>
      Number(h.tagName.slice(1)),
    );
    let prev = 0;
    for (const level of headings) {
      if (prev !== 0 && level > prev + 1) return false;
      prev = level;
    }
    return true;
  });
}

async function runFixture(browser: import("playwright").Browser, fixture: string): Promise<FixtureQaResult> {
  const htmlPath = path.resolve("fixtures", fixture, "output", "index.html");
  const qaDir = path.resolve("fixtures", fixture, "output", "qa");
  await mkdir(qaDir, { recursive: true });

  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("request", (req) => {
    if (!req.url().startsWith("file://")) externalRequests.push(req.url());
  });

  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(150);

  const overflowElements = await checkHorizontalOverflow(page);
  const headingOrderOk = await checkHeadingOrder(page);

  const axeResults = await new AxeBuilder({ page }).analyze();
  const axeViolations = axeResults.violations.map((v) => ({
    id: v.id,
    impact: v.impact ?? null,
    nodes: v.nodes.length,
  }));

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(qaDir, `${vp.name}.png`), fullPage: true });
  }

  // Dark mode screenshot for a visual refinement check. Forces the
  // `data-theme="dark"` attribute directly (same effect as the in-page
  // theme toggle) rather than relying on prefers-color-scheme, since a
  // document that sets an explicit `meta.theme` intentionally ignores the
  // OS preference — this exercises the actual dark token values either way.
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.join(qaDir, "dark-1440.png"), fullPage: true });
  await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));

  // Reduced motion smoke check — page should still render without error.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForTimeout(80);
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // JS-disabled readability check.
  const jsDisabledContext = await browser.newContext({ javaScriptEnabled: false });
  const jsDisabledPage = await jsDisabledContext.newPage();
  await jsDisabledPage.goto(`file://${htmlPath}`);
  const bodyTextLength = await jsDisabledPage.evaluate(() => document.body.innerText.length);
  await jsDisabledContext.close();
  if (bodyTextLength < 50) {
    consoleErrors.push("body unreadable with JavaScript disabled");
  }

  await page.close();
  await context.close();

  return {
    fixture,
    consoleErrors,
    externalRequests,
    overflowElements,
    axeViolationCount: axeViolations.length,
    axeViolations,
    headingOrderOk,
  };
}

async function main() {
  const browser = await chromium.launch();
  const results: FixtureQaResult[] = [];
  for (const fixture of FIXTURES) {
    console.log(`forma qa: ${fixture}`);
    const result = await runFixture(browser, fixture);
    results.push(result);
    await writeFile(
      path.resolve("fixtures", fixture, "output", "qa", "accessibility.json"),
      JSON.stringify(result, null, 2),
      "utf-8",
    );
    const status = result.consoleErrors.length === 0 && result.axeViolationCount === 0 ? "PASS" : "REVIEW";
    console.log(
      `  [${status}] console=${result.consoleErrors.length} axe=${result.axeViolationCount} overflow=${result.overflowElements} externalRequests=${result.externalRequests.length}`,
    );
  }
  await browser.close();

  const totalConsoleErrors = results.reduce((sum, r) => sum + r.consoleErrors.length, 0);
  const totalExternal = results.reduce((sum, r) => sum + r.externalRequests.length, 0);
  const totalAxe = results.reduce((sum, r) => sum + r.axeViolationCount, 0);

  console.log("\nforma qa summary:");
  console.log(`  console errors total: ${totalConsoleErrors}`);
  console.log(`  external network requests total: ${totalExternal}`);
  console.log(`  axe violations total: ${totalAxe}`);

  if (totalConsoleErrors > 0 || totalExternal > 0 || totalAxe > 0) {
    process.exitCode = 1;
  }
}

await main();
