#!/usr/bin/env tsx
/**
 * Repository QA adapter: runs the generic browser QA Module against each
 * canonical fixture while reusing one Chromium instance.
 */
import { chromium } from "playwright";
import path from "node:path";
import {
  formatQaResult,
  runBrowserQa,
  type BrowserQaResult,
} from "./browser-qa.js";

// Legacy 0.1 fixtures plus one artifact fixture per implemented artifact.
// The 0.1 four stay in the list on purpose: they are the regression guard
// for the compatibility path.
const FIXTURES = ["explain", "review", "test", "report", "report/technical", "manual/quickstart", "dashboard/release-gate"];

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const results: BrowserQaResult[] = [];

  try {
    for (const fixture of FIXTURES) {
      console.log(`forma qa: ${fixture}`);
      const result = await runBrowserQa({
        target: path.resolve("fixtures", ...fixture.split("/"), "output"),
        label: fixture,
        browser,
      });
      results.push(result);
      console.log(`  ${formatQaResult(result)}`);
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => !result.passed);
  console.log(`\nforma qa summary: ${results.length - failures.length}/${results.length} passed`);
  if (failures.length > 0) process.exitCode = 1;
}

await main();
