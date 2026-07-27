#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { loadSpecFile, renderSpecFileToDir, FormaSpecError } from "../renderer/render.js";
import { buildFormaJsonSchema } from "../spec/json-schema.js";
import { installSkills, verifySkills } from "./skills.js";
import { STARTER_SPEC } from "./starter-spec.js";

const program = new Command();
program.name("forma").description("Turn complex work into clear form.").version("0.1.0");

program
  .command("init")
  .description("Write a starter forma.spec.json in the current directory")
  .option("-o, --out <path>", "output path", "forma.spec.json")
  .action(async (opts: { out: string }) => {
    await writeFile(opts.out, JSON.stringify(STARTER_SPEC, null, 2), "utf-8");
    console.log(`forma: wrote ${opts.out}`);
  });

program
  .command("validate <spec>")
  .description("Validate a forma.spec.json against the Forma Spec schema")
  .action(async (specPath: string) => {
    try {
      await loadSpecFile(specPath);
      console.log(`forma: ${specPath} is valid`);
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("render <spec>")
  .description("Render a forma.spec.json into a self-contained HTML document")
  .option("--out <dir>", "output directory", "forma-output")
  .action(async (specPath: string, opts: { out: string }) => {
    try {
      const outcome = await renderSpecFileToDir(specPath, opts.out);
      console.log(`forma: rendered ${outcome.htmlPath} (${outcome.bytes} bytes)`);
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("build <spec>")
  .description("Render a spec and run the static (non-browser) quality gates")
  .option("--out <dir>", "output directory", "forma-output")
  .action(async (specPath: string, opts: { out: string }) => {
    try {
      const outcome = await renderSpecFileToDir(specPath, opts.out);
      console.log(`forma: rendered ${outcome.htmlPath} (${outcome.bytes} bytes)`);
      const { lintHtmlFile } = await import("../qa/design-lint.js");
      const findings = await lintHtmlFile(outcome.htmlPath);
      if (findings.length === 0) {
        console.log("forma: design lint — no generic-AI pattern violations found");
      } else {
        console.log(`forma: design lint — ${findings.length} finding(s):`);
        for (const f of findings) console.log(`  - [${f.rule}] ${f.message}`);
      }
      console.log("forma: run `pnpm qa` for the full Playwright/axe/Lighthouse gate");
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("preview <htmlOrDir>")
  .description("Serve a rendered output directory over localhost (no network access)")
  .option("-p, --port <port>", "port", "4173")
  .action(async (target: string, opts: { port: string }) => {
    const dir = target.endsWith(".html") ? path.dirname(target) : target;
    const port = Number(opts.port);
    const server = createServer(async (req, res) => {
      const reqPath = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
      const filePath = path.join(dir, decodeURIComponent(reqPath));
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "content-type": contentType(filePath) });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(port, () => {
      console.log(`forma: preview server at http://localhost:${port}/index.html (Ctrl+C to stop)`);
    });
  });

program
  .command("install-skills")
  .description("Sync the canonical skill into .agents/skills/forma and .claude/skills/forma")
  .action(async () => {
    const result = await installSkills(process.cwd());
    for (const target of result.targets) console.log(`forma: synced ${target}`);
  });

program
  .command("verify-skills")
  .description("Check installed skill copies match the canonical checksum")
  .action(async () => {
    const result = await verifySkills(process.cwd());
    if (result.ok) {
      console.log("forma: installed skills match canonical source");
    } else {
      console.error("forma: skill drift detected:");
      for (const issue of result.issues) console.error(`  - ${issue}`);
      process.exitCode = 1;
    }
  });

program
  .command("doctor")
  .description("Check the local environment for what Forma needs")
  .action(async () => {
    console.log(`forma: node ${process.version}`);
    try {
      await import("playwright");
      console.log("forma: playwright — available");
    } catch {
      console.log("forma: playwright — NOT available (run `npx playwright install chromium`)");
    }
  });

program
  .command("schema")
  .description("Print the Forma Spec JSON Schema")
  .action(() => {
    console.log(JSON.stringify(buildFormaJsonSchema(), null, 2));
  });

program
  .command("generate")
  .description("Structured-input scaffolding only — does not call any LLM")
  .option("--mode <mode>", "explain | review | test | report")
  .argument("<input>", "input file or directory")
  .action(async (input: string, opts: { mode?: string }) => {
    console.log(
      `forma: 'generate' only scaffolds a starter spec from ${input} (mode=${opts.mode ?? "explain"}).\n` +
        "forma: it does not call an LLM. For narrative composition, use the Forma Agent Skill\n" +
        "forma: (Codex: $forma, Claude Code: /forma) to read the input and author forma.spec.json.",
    );
    const out = `${path.basename(input).replace(/\.[^.]+$/, "")}.forma.spec.json`;
    const spec = { ...STARTER_SPEC, meta: { ...STARTER_SPEC.meta, mode: opts.mode ?? "explain" } };
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(out, JSON.stringify(spec, null, 2), "utf-8");
    console.log(`forma: wrote scaffold ${out}`);
  });

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function exitWithError(error: unknown): never {
  if (error instanceof FormaSpecError) {
    console.error(error.message);
  } else {
    console.error(`forma: unexpected error — ${(error as Error).message}`);
  }
  process.exit(1);
}

program.parseAsync(process.argv);
