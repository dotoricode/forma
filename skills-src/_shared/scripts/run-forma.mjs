import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

function isFormaRepo(dir) {
  const packagePath = path.join(dir, "package.json");
  if (!existsSync(packagePath)) return false;
  try {
    return JSON.parse(readFileSync(packagePath, "utf-8")).name === "forma";
  } catch {
    return false;
  }
}

function findUp(start) {
  let current = path.resolve(start);
  while (true) {
    if (isFormaRepo(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function findFormaRepo() {
  const override = process.env.FORMA_REPO;
  if (override) {
    const resolved = path.resolve(override);
    if (!isFormaRepo(resolved)) {
      throw new Error(`FORMA_REPO does not point to the Forma repository: ${resolved}`);
    }
    return resolved;
  }
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return findUp(process.cwd()) ?? findUp(scriptDir);
}

export function runForma(args) {
  const repo = findFormaRepo();
  if (repo) {
    const builtCli = path.join(repo, "dist/cli/index.js");
    const sourceCli = path.join(repo, "src/cli/index.ts");
    const result = existsSync(builtCli)
      ? spawnSync(process.execPath, [builtCli, ...args], { cwd: process.cwd(), stdio: "inherit" })
      : spawnSync(path.join(repo, "node_modules/.bin/tsx"), [sourceCli, ...args], {
          cwd: process.cwd(),
          stdio: "inherit",
        });
    return result.status ?? 1;
  }

  const result = spawnSync("forma", args, { cwd: process.cwd(), stdio: "inherit" });
  if (result.error?.code === "ENOENT") {
    console.error(
      "forma: CLI not found. Install Forma on PATH or set FORMA_REPO to its source checkout.",
    );
  }
  return result.status ?? 1;
}

export function runFormaSource(relativeScript, args) {
  const repo = findFormaRepo();
  if (!repo) {
    console.error(`forma: ${relativeScript} requires FORMA_REPO or a Forma source checkout.`);
    return 1;
  }
  const result = spawnSync(
    path.join(repo, "node_modules/.bin/tsx"),
    [path.join(repo, relativeScript), ...args],
    { cwd: process.cwd(), stdio: "inherit" },
  );
  return result.status ?? 1;
}
