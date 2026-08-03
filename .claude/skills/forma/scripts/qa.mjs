#!/usr/bin/env node
import { runForma } from "./run-forma.mjs";

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("forma: qa.mjs requires an HTML file or output directory.");
  process.exit(1);
}
process.exit(runForma(["qa", ...targets]));
