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
    await chrome.kill();
  }

  await writeFile("docs/lighthouse-summary.json", JSON.stringify(summary, null, 2), "utf-8");
  console.log("forma lighthouse: summary written to docs/lighthouse-summary.json");
}

await main();
