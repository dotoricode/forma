#!/usr/bin/env node
import { runForma } from "./run-forma.mjs";

process.exit(runForma(["render", ...process.argv.slice(2)]));
