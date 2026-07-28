#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
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
  .option("--quality <level>", "standard | advanced (advanced runs the candidate tournament)", "standard")
  .option("--seed <text>", "seed for candidate generation; same seed, same winner", "forma")
  .action(async (specPath: string, opts: { out: string; quality: string; seed: string }) => {
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

      if (opts.quality === "advanced") {
        const { buildCandidates, scoreCandidate, seedFrom, selectWinner } = await import(
          "../qa/candidates.js"
        );
        const { loadSpecFile } = await import("../renderer/render.js");
        const spec = await loadSpecFile(specPath);
        const candidates = buildCandidates(spec, 8, seedFrom(opts.seed));
        // Every candidate is scored against the same rendered evidence for
        // now: composition axes do not yet feed the stylesheet, so varying
        // them would change nothing and pretending otherwise would make the
        // tournament theatre. The selection machinery is real and pinned by
        // tests; wiring the axes into the renderer is the remaining step.
        const evidence = { lintFindings: findings };
        const scores = candidates.map((candidate) => scoreCandidate(candidate, evidence));
        const winner = selectWinner(scores);
        if (!winner) {
          console.log("forma: every candidate failed a hard gate. Nothing to select.");
        } else {
          console.log(
            `forma: quality advanced — ${candidates.length} candidates, winner '${winner.candidate.id}' at ${winner.score}/100`,
          );
          for (const [dimension, value] of Object.entries(winner.breakdown)) {
            console.log(`  ${dimension}: ${value}`);
          }
        }
      }

      console.log(`forma: run \`forma qa ${opts.out}\` for the full browser/axe gate`);
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("advanced <spec>")
  .description("Build a Decision Room. --portable travels as a file; --room opens a live session.")
  .option("--out <dir>", "output directory", "forma-room")
  .option("--portable", "single self-contained build, no server", false)
  .option("--room", "open a live Decision Room on this machine", false)
  .option("--lan", "let other machines on the local network join (off by default)", false)
  .option("-p, --port <port>", "port for Room Mode", "4180")
  .action(
    async (
      specPath: string,
      opts: { out: string; portable: boolean; room: boolean; lan: boolean; port: string },
    ) => {
      try {
        const spec = await loadSpecFile(specPath);
        if (spec.meta.artifact !== "advanced") {
          throw new FormaSpecError(
            `forma: 'advanced' needs an artifact of 'advanced'; this spec is '${spec.meta.artifact}'.`,
          );
        }
        if (opts.portable && opts.room) {
          throw new FormaSpecError(
            "forma: --portable and --room are different products. Pick one.",
          );
        }
        if (!opts.portable && !opts.room) {
          throw new FormaSpecError(
            "forma: pass --portable for a file that makes no requests, or --room to open a live session.",
          );
        }
        if (opts.lan && !opts.room) {
          throw new FormaSpecError("forma: --lan only means something with --room.");
        }

        if (opts.portable) {
          if (spec.meta.interaction === "live") {
            throw new FormaSpecError(
              "forma: interaction 'live' needs Room Mode. A portable build cannot sync participants.",
            );
          }
          const outcome = await renderSpecFileToDir(specPath, opts.out, { portable: true });
          console.log(`forma: Decision Room (portable) ${outcome.htmlPath} (${outcome.bytes} bytes)`);
          console.log("forma: no external network requests, no telemetry, no CDN.");
          console.log(`forma: verify it with \`forma qa ${opts.out}\`.`);
          return;
        }

        await openRoom(specPath, opts);
      } catch (error) {
        exitWithError(error);
      }
    },
  );

/**
 * Room Mode. Kept out of the action body because it has a lifecycle the
 * other commands do not: it renders, binds a port, prints a credential, and
 * then waits for people.
 */
async function openRoom(
  specPath: string,
  opts: { out: string; lan: boolean; port: string },
): Promise<void> {
  const { startRoomServer } = await import("../room/server.js");
  const { createSessionToken } = await import("../room/token.js");
  const { hashText, writeFreeze } = await import("../room/persist.js");
  const { loadSpecFileWithSource } = await import("../renderer/render.js");
  const { renderSpecToHtml } = await import("../renderer/shell.js");
  const { redactSecrets, stripHomeDirectory } = await import("../security/sanitize.js");

  const { spec, raw } = await loadSpecFileWithSource(specPath);
  const rendered = await renderSpecToHtml(spec);
  // The same guards the file path applies. A room document is the portable
  // document plus a panel, so it must not be less redacted than the file.
  const html = stripHomeDirectory(redactSecrets(rendered.html).text);

  const bind = opts.lan ? ("lan" as const) : ("loopback" as const);
  const token = createSessionToken();

  const handle = await startRoomServer({
    spec,
    html,
    specHash: hashText(raw),
    sourceHash: hashText(html),
    token,
    bind,
    port: Number(opts.port),
    onFreeze: (state) => writeFreeze(state, { outDir: opts.out, spec, html, bind }),
  });

  const shown = bind === "lan" ? localAddresses() : ["127.0.0.1"];
  console.log(`forma: Decision Room open — ${spec.meta.title}`);
  for (const address of shown) {
    console.log(`  http://${address}:${handle.port}/?t=${token}`);
  }
  console.log("");
  if (bind === "lan") {
    console.log("forma: --lan is on. Anyone on this network who has the link can join.");
    console.log("forma: external network requests: 0. Local network traffic: yes, that is --lan.");
  } else {
    console.log("forma: bound to 127.0.0.1. Nothing outside this machine can reach it.");
    console.log("forma: external network requests: 0. Pass --lan to let other desks join.");
  }
  console.log("forma: the session token is not stored anywhere. Closing the room voids it.");
  console.log("forma: nothing is written to disk until someone freezes the decision.");
  console.log("forma: Ctrl+C to close and discard the session.");

  const shutdown = () => {
    void handle.close().then(() => {
      console.log("\nforma: room closed. In-memory session discarded.");
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/** Non-internal IPv4 addresses, so the printed link is one people can use. */
function localAddresses(): string[] {
  const found: string[] = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) found.push(entry.address);
    }
  }
  return found.length > 0 ? found : ["127.0.0.1"];
}

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
  .description("Sync the canonical skill to the repo copies and every machine-wide skill target")
  .action(async () => {
    try {
      const result = await installSkills(process.cwd(), { includeGlobalTargets: true });
      for (const target of result.targets) console.log(`forma: synced ${target}`);
      for (const target of result.globalTargets) console.log(`forma: synced ${target}`);
      if (result.globalTargets.length === 0) {
        console.log(
          `forma: no ~/.agents/skill-targets.json — synced the repo copies only.`,
        );
      }
      console.log(`forma: checksum ${result.checksum.slice(0, 12)} verified on every copy`);
      console.log("forma: start a new Codex/Claude session if the skill list was already loaded.");
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("build-skills")
  .description("Generate the Claude Code plugin and Codex skill packages from skills-src/")
  .option("--out <dir>", "output directory", "dist/skills")
  .action(async (opts: { out: string }) => {
    try {
      const { buildSkills } = await import("../skills/build.js");
      const result = await buildSkills(process.cwd(), opts.out);
      console.log(`forma: wrote ${result.fileCount} files to ${result.outDir}`);
      for (const skill of result.skills) {
        console.log(`  ${skill.invocation.padEnd(20)} ${skill.dir}`);
      }
      console.log("");
      console.log("forma: Claude Code — install the plugin directory under dist/skills/claude/forma");
      console.log("forma: Codex — copy dist/skills/codex/* into .agents/skills or ~/.codex/skills");
    } catch (error) {
      exitWithError(error);
    }
  });

program
  .command("verify-skills")
  .description("Check installed skill copies match the canonical checksum")
  .action(async () => {
    const result = await verifySkills(process.cwd(), { includeGlobalTargets: true });
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
