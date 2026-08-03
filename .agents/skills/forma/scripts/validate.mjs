#!/usr/bin/env node
// Thin wrapper: `forma validate <spec>`. Kept as a script so Agent Skills
// invoking this directory don't need to know the repo's package manager.
import { runForma } from "./run-forma.mjs";

process.exit(runForma(["validate", ...process.argv.slice(2)]));
