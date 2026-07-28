#!/usr/bin/env tsx
/**
 * Runs Lighthouse against each fixture's rendered HTML, served over a
 * throwaway localhost HTTP server (Lighthouse needs http:, not file:).
 * Uses Playwright's bundled Chromium via chrome-launcher so this doesn't
 * depend on a system Chrome install.
 */
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const FIXTURES = ["explain", "review", "test", "report"];
const PORT = 4321;
const PERFORMANCE_MIN = 0.95;
const ACCESSIBILITY_MIN = 1;
const BEST_PRACTICES_MIN = 1;
const CLS_MAX = 0.05;
const TBT_MAX = 100;

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

async function serveDir(dir: string, port: number) {
  const server = createServer(async (req, res) => {
    const reqPath = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
    try {
      const body = await readFile(path.join(dir, decodeURIComponent(reqPath)));
      res.writeHead(200, { "content-type": contentType(reqPath) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(port, resolve));
  return server;
}

async function main() {
  const chromePath = chromium.executablePath();
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ["--headless=new", "--no-sandbox"],
  });

  const summary: Record<string, unknown> = {};

  try {
    for (const fixture of FIXTURES) {
      const dir = path.resolve("fixtures", fixture, "output");
      const server = await serveDir(dir, PORT);
      try {
        const result = await lighthouse(
          `http://localhost:${PORT}/index.html`,
          { port: chrome.port, output: "json", logLevel: "error" },
          undefined,
        );
        const lhr = result?.lhr;
        const scores = {
          performance: lhr?.categories?.["performance"]?.score,
          accessibility: lhr?.categories?.["accessibility"]?.score,
          bestPractices: lhr?.categories?.["best-practices"]?.score,
          cls: lhr?.audits?.["cumulative-layout-shift"]?.numericValue,
          tbt: lhr?.audits?.["total-blocking-time"]?.numericValue,
        };
        summary[fixture] = scores;
        console.log(`forma lighthouse: ${fixture}`, JSON.stringify(scores));
        await mkdir(path.join(dir, "qa"), { recursive: true });
        await writeFile(path.join(dir, "qa", "performance.json"), JSON.stringify(lhr, null, 2), "utf-8");
      } finally {
        server.close();
      }
    }
  } finally {
    try {
      await chrome.kill();
    } catch (error) {
      // chrome-launcher can kill Chromium successfully and then fail to
      // remove its temporary profile on Windows while an antivirus scanner
      // still holds a file handle. Do not turn completed audits into a false
      // failure; the OS cleans its temp directory later.
      if ((error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      console.warn("forma lighthouse: Chromium stopped; Windows deferred temp-profile cleanup");
    }
  }

  await writeFile("docs/lighthouse-summary.json", JSON.stringify(summary, null, 2), "utf-8");
  console.log("forma lighthouse: summary written to docs/lighthouse-summary.json");

  const failures = Object.entries(summary).filter(([, value]) => {
    const scores = value as {
      performance?: number;
      accessibility?: number;
      bestPractices?: number;
      cls?: number;
      tbt?: number;
    };
    return (
      (scores.performance ?? 0) < PERFORMANCE_MIN ||
      (scores.accessibility ?? 0) < ACCESSIBILITY_MIN ||
      (scores.bestPractices ?? 0) < BEST_PRACTICES_MIN ||
      (scores.cls ?? Number.POSITIVE_INFINITY) > CLS_MAX ||
      (scores.tbt ?? Number.POSITIVE_INFINITY) > TBT_MAX
    );
  });
  if (failures.length > 0) {
    throw new Error(
      `Forma Lighthouse budget failed: ${failures.map(([fixture]) => fixture).join(", ")}`,
    );
  }
}

await main();
