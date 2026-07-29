#!/usr/bin/env node
import { runFormaSource } from "./run-forma.mjs";

process.exit(runFormaSource("src/qa/run-lighthouse.ts", process.argv.slice(2)));
