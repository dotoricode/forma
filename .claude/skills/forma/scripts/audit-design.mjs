#!/usr/bin/env node
import { runFormaSource } from "./run-forma.mjs";

process.exit(runFormaSource("src/qa/design-lint.ts", process.argv.slice(2)));
