#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { loadSpecFile, renderSpecFileToDir, FormaSpecError } from "../renderer/render.js";
import { buildFormaJsonSchema } from "../spec/json-schema.js";
import { installSkills, verifySkills } from "./skills.js";
import { writeStarterSpecFile } from "./starter-spec.js";
import { inferArtifact, parseArtifact } from "../spec/infer-artifact.js";
import { writeGeneratedSpec } from "./generate.js";

const program = new Command();
program.name("forma").description("Turn complex work into clear form.").version("0.1.0");

program
  .command("init")
  .description("Write a starter forma.spec.json in the current directory")
  .option("-o, --out <path>", "output path", "forma.spec.json")
  .action(async (opts: { out: string }) => {
    try {
      await writeStarterSpecFile(opts.out);
      console.log(`forma: wrote ${opts.out}`);
      console.log(`forma: next run \`pnpm forma validate ${opts.out}\`.`);
    } catch (error) {
      exitWithError(error);
    }
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
      console.log(`forma: run \`forma qa ${opts.out}\` for the full browser/axe gate`);
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
  .command("qa <htmlOrDir>")
  .description("Run browser, accessibility, responsive, and offline checks on a rendered output")
  .option("--out <dir>", "QA artifact directory (defaults to <output>/qa)")
  .action(async (target: string, opts: { out?: string }) => {
    try {
      const { formatQaResult, runBrowserQa } = await import("../qa/browser-qa.js");
      const result = await runBrowserQa({
        target,
        ...(opts.out ? { qaDir: opts.out } : {}),
      });
      console.log(`forma qa: ${result.htmlPath}`);
      console.log(`  ${formatQaResult(result)}`);
      console.log(`  artifacts: ${result.qaDir}`);
      if (!result.passed) process.exitCode = 1;
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("install-skills")
  .description("Sync the canonical skill into .agents/skills/forma and .claude/skills/forma")
  .action(async () => {
    const result = await installSkills(process.cwd());
    for (const target of result.targets) console.log(`forma: synced ${target}`);
    console.log(
      "forma: start a new Codex/Claude session if the skill list was already loaded.",
    );
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
  .option("--artifact <artifact>", "auto | dashboard | report | manual | advanced", "auto")
  .option("--instruction <text>", "task instruction used to choose an artifact automatically")
  .option("--out <path>", "output spec path")
  .argument("<input>", "input file or directory")
  .action(async (input: string, opts: { artifact: string; instruction?: string; out?: string }) => {
    const inferred = inferArtifact(opts.instruction ?? "", input);
    const artifact = opts.artifact === "auto" ? inferred.artifact : parseArtifact(opts.artifact);
    if (!artifact) {
      exitWithError(
        new FormaSpecError(
          `forma: invalid artifact '${opts.artifact}' (expected auto, dashboard, report, manual, or advanced)`,
        ),
      );
      return;
    }
    // Purpose only follows the inference when the artifact did too; an
    // explicitly named artifact should not silently inherit a purpose
    // guessed for a different one.
    const purpose = artifact === inferred.artifact ? inferred.purpose : "explain";
    console.log(
      `forma: 'generate' only scaffolds a starter spec from ${input} (artifact=${artifact}).\n` +
        "forma: it does not call an LLM. For narrative composition, use the Forma Agent Skill\n" +
        "forma: (Codex: $forma-report, Claude Code: /forma:report) to read the input and author forma.spec.json.",
    );
    const out = opts.out ?? `${path.basename(input).replace(/\.[^.]+$/, "")}.forma.spec.json`;
    try {
      await writeGeneratedSpec({ input, artifact, purpose, out });
      console.log(`forma: wrote scaffold ${out}`);
      console.log(`forma: next run \`pnpm forma validate ${out}\`, then author its narrative with $forma.`);
    } catch (error) {
      exitWithError(error);
    }
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
