import { AxeBuilder } from "@axe-core/playwright";
import { access, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

export const QA_VIEWPORTS = [
  { name: "desktop-2048", width: 2048, height: 1272 },
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

export interface BrowserQaOptions {
  target: string;
  label?: string;
  qaDir?: string;
  browser?: Browser;
  /** Candidate tournaments need measurements, not six image files per arm. */
  captureScreenshots?: boolean;
}

export interface BrowserQaResult {
  label: string;
  htmlPath: string;
  qaDir: string;
  passed: boolean;
  consoleErrors: string[];
  externalRequests: string[];
  overflowElements: number;
  overflowByViewport: Record<string, number>;
  clippedTextElements: number;
  clippedTextByViewport: Record<string, number>;
  axeViolationCount: number;
  axeViolations: { id: string; impact: string | null; nodes: number }[];
  headingOrderOk: boolean;
  brokenAnchorTargets: string[];
  keyboardReachable: boolean;
  javascriptDisabledReadable: boolean;
}

export async function resolveHtmlTarget(target: string): Promise<string> {
  const resolved = path.resolve(target);
  const targetStat = await stat(resolved);
  const htmlPath = targetStat.isDirectory() ? path.join(resolved, "index.html") : resolved;
  await access(htmlPath);
  return htmlPath;
}

function isLocalRequest(url: string): boolean {
  try {
    return new URL(url).protocol === "file:";
  } catch {
    return false;
  }
}

function portableRelativePath(target: string): string {
  return path.relative(process.cwd(), target).split(path.sep).join("/");
}

async function blockExternalRequests(
  context: BrowserContext,
  externalRequests: Set<string>,
): Promise<void> {
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (isLocalRequest(url)) {
      await route.continue();
      return;
    }
    externalRequests.add(url);
    await route.abort("blockedbyclient");
  });
}

async function checkHorizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= docWidth + 1) return 0;

    let overflowing = 0;
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      let ancestor = el.parentElement;
      let containedByScroller = false;
      while (ancestor && ancestor !== document.body) {
        const ancestorOverflow = getComputedStyle(ancestor).overflowX;
        if (ancestorOverflow === "auto" || ancestorOverflow === "scroll") {
          containedByScroller = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (containedByScroller) continue;

      const bounds = el.getBoundingClientRect();
      if (
        (bounds.right > docWidth + 1 || bounds.left < -1) &&
        getComputedStyle(el).overflowX !== "auto" &&
        getComputedStyle(el).overflowX !== "scroll"
      ) {
        overflowing += 1;
      }
    }
    return overflowing;
  });
}

async function checkTextClipping(page: Page): Promise<number> {
  return page.evaluate(() => {
    let clipped = 0;
    const intentionallyTruncated =
      ".visually-hidden, .doc-bar__title, .side-toc .toc a";

    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      if (el.matches(intentionallyTruncated) || el.closest("[hidden], [aria-hidden='true']")) {
        continue;
      }
      if (el.getClientRects().length === 0) continue;
      const style = getComputedStyle(el);
      const clipsX = style.overflowX === "hidden" || style.overflowX === "clip";
      const clipsY = style.overflowY === "hidden" || style.overflowY === "clip";
      const hasText = Array.from(el.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0,
      );
      if (
        hasText &&
        ((clipsX && el.scrollWidth > el.clientWidth + 1) ||
          (clipsY && el.scrollHeight > el.clientHeight + 1))
      ) {
        clipped += 1;
      }
    }

    for (const text of document.querySelectorAll<SVGTextElement>("svg text")) {
      const svg = text.ownerSVGElement;
      if (!svg) continue;
      const svgBounds = svg.getBoundingClientRect();
      const textBounds = text.getBoundingClientRect();
      if (svgBounds.width === 0 || svgBounds.height === 0 || textBounds.width === 0) continue;
      if (
        textBounds.left < svgBounds.left - 1 ||
        textBounds.right > svgBounds.right + 1 ||
        textBounds.top < svgBounds.top - 1 ||
        textBounds.bottom > svgBounds.bottom + 1
      ) {
        clipped += 1;
      }
    }
    return clipped;
  });
}

async function checkHeadingOrder(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(
      (heading) => Number(heading.tagName.slice(1)),
    );
    let previous = 0;
    for (const level of headings) {
      if (previous !== 0 && level > previous + 1) return false;
      previous = level;
    }
    return true;
  });
}

async function checkAnchorTargets(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      .map((anchor) => anchor.getAttribute("href") ?? "")
      .filter((href) => href.length > 1 && document.getElementById(href.slice(1)) === null),
  );
}

async function checkKeyboardReachable(page: Page): Promise<boolean> {
  const visibleInteractiveCount = await page.locator("a[href], button, input, select, textarea").count();
  if (visibleInteractiveCount === 0) return true;
  await page.locator("body").focus();
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const active = document.activeElement;
    const reachable =
      active !== null && active !== document.body && active !== document.documentElement;
    if (active instanceof HTMLElement) active.blur();
    return reachable;
  });
}

async function captureScreenshot(page: Page, filePath: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({ path: filePath, fullPage: true });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(100);
    }
  }
  throw lastError;
}

/**
 * Runs Forma's deep browser quality gate against any rendered HTML file or
 * output directory. External requests are recorded and aborted before the
 * browser can transmit document-derived data.
 */
export async function runBrowserQa(options: BrowserQaOptions): Promise<BrowserQaResult> {
  const htmlPath = await resolveHtmlTarget(options.target);
  const qaDir = path.resolve(options.qaDir ?? path.join(path.dirname(htmlPath), "qa"));
  const label = options.label ?? path.basename(path.dirname(htmlPath));
  await mkdir(qaDir, { recursive: true });

  const ownsBrowser = options.browser === undefined;
  const browser = options.browser ?? (await chromium.launch());
  const context = await browser.newContext();
  const externalRequestSet = new Set<string>();
  await blockExternalRequests(context, externalRequestSet);

  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.goto(pathToFileURL(htmlPath).href);
  await page.waitForTimeout(150);

  const headingOrderOk = await checkHeadingOrder(page);
  const brokenAnchorTargets = await checkAnchorTargets(page);
  const keyboardReachable = await checkKeyboardReachable(page);
  const axeResults = await new AxeBuilder({ page }).analyze();
  const axeViolations = axeResults.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? null,
    nodes: violation.nodes.length,
  }));

  const overflowByViewport: Record<string, number> = {};
  const clippedTextByViewport: Record<string, number> = {};
  for (const viewport of QA_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(80);
    overflowByViewport[viewport.name] = await checkHorizontalOverflow(page);
    clippedTextByViewport[viewport.name] = await checkTextClipping(page);
    if (options.captureScreenshots !== false) {
      await captureScreenshot(page, path.join(qaDir, `${viewport.name}.png`));
    }
  }
  const overflowElements = Math.max(0, ...Object.values(overflowByViewport));
  const clippedTextElements = Math.max(0, ...Object.values(clippedTextByViewport));

  if (options.captureScreenshots !== false) {
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(80);
    await captureScreenshot(page, path.join(qaDir, "dark-1440.png"));
    await page.evaluate(() => document.documentElement.removeAttribute("data-theme"));
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForTimeout(80);
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const jsDisabledContext = await browser.newContext({ javaScriptEnabled: false });
  await blockExternalRequests(jsDisabledContext, externalRequestSet);
  const jsDisabledPage = await jsDisabledContext.newPage();
  await jsDisabledPage.goto(pathToFileURL(htmlPath).href);
  const bodyTextLength = await jsDisabledPage.evaluate(() => document.body.innerText.length);
  const javascriptDisabledReadable = bodyTextLength >= 50;
  if (!javascriptDisabledReadable) {
    consoleErrors.push("body unreadable with JavaScript disabled");
  }

  await jsDisabledContext.close();
  await context.close();
  if (ownsBrowser) await browser.close();

  const externalRequests = Array.from(externalRequestSet);
  const passed =
    consoleErrors.length === 0 &&
    externalRequests.length === 0 &&
    overflowElements === 0 &&
    clippedTextElements === 0 &&
    axeViolations.length === 0 &&
    headingOrderOk &&
    brokenAnchorTargets.length === 0 &&
    keyboardReachable &&
    javascriptDisabledReadable;

  const result: BrowserQaResult = {
    label,
    htmlPath,
    qaDir,
    passed,
    consoleErrors,
    externalRequests,
    overflowElements,
    overflowByViewport,
    clippedTextElements,
    clippedTextByViewport,
    axeViolationCount: axeViolations.length,
    axeViolations,
    headingOrderOk,
    brokenAnchorTargets,
    keyboardReachable,
    javascriptDisabledReadable,
  };
  const portableResult = {
    ...result,
    htmlPath: portableRelativePath(result.htmlPath),
    qaDir: portableRelativePath(result.qaDir),
  };
  await writeFile(
    path.join(qaDir, "accessibility.json"),
    JSON.stringify(portableResult, null, 2),
    "utf-8",
  );
  return result;
}

export function formatQaResult(result: BrowserQaResult): string {
  const status = result.passed ? "PASS" : "FAIL";
  return (
    `[${status}] console=${result.consoleErrors.length} ` +
    `axe=${result.axeViolationCount} overflow=${result.overflowElements} ` +
    `clippedText=${result.clippedTextElements} ` +
    `externalRequests=${result.externalRequests.length} ` +
    `headings=${result.headingOrderOk ? "ok" : "invalid"} ` +
    `anchors=${result.brokenAnchorTargets.length === 0 ? "ok" : "broken"} ` +
    `keyboard=${result.keyboardReachable ? "ok" : "unreachable"}`
  );
}
