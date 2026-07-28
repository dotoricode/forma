import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadSpecFileWithSource } from "../../src/renderer/render.js";
import { renderSpecToHtml } from "../../src/renderer/shell.js";
import { BIND_HOST, startRoomServer, type RoomServerHandle } from "../../src/room/server.js";
import { createSessionToken } from "../../src/room/token.js";
import { hashText, writeFreeze } from "../../src/room/persist.js";
import type { FormaSpec } from "../../src/spec/schema.js";

const FIXTURE = "fixtures/advanced/release-decision/forma.spec.json";
const TOKEN = createSessionToken();

let handle: RoomServerHandle;
let spec: FormaSpec;
let base: string;
let outDir: string;
let written: string[] = [];

/**
 * Port 0 lets the OS pick, so the suite never collides with a real room.
 *
 * The generous hook timeout is not padding: this hook renders the fixture
 * through the real pipeline, and under a full parallel run that exceeded the
 * 10s default and skipped all 23 tests as a "pass". A suite that goes quiet
 * under load is worse than one that fails.
 */
beforeAll(async () => {
  const loaded = await loadSpecFileWithSource(FIXTURE);
  spec = loaded.spec;
  base = (await renderSpecToHtml(spec)).html;
  outDir = await mkdtemp(path.join(tmpdir(), "forma-room-"));
  handle = await startRoomServer({
    spec,
    html: base,
    specHash: hashText(loaded.raw),
    sourceHash: hashText(base),
    token: TOKEN,
    bind: "loopback",
    port: 0,
    onFreeze: async (state) => {
      written = await writeFreeze(state, { outDir, spec, html: base, bind: "loopback" });
      return written;
    },
  });
}, 60_000);

afterAll(async () => {
  await handle.close();
  await rm(outDir, { recursive: true, force: true });
});

const url = (pathname: string, token: string = TOKEN) =>
  `http://127.0.0.1:${handle.port}${pathname}?t=${encodeURIComponent(token)}`;

async function post(body: unknown, participantId?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (participantId) headers["x-forma-participant"] = participantId;
  const res = await fetch(url("/message"), { method: "POST", headers, body: JSON.stringify(body) });
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe("room server bind policy", () => {
  it("maps loopback and lan to different hosts, and never conflates them", () => {
    expect(BIND_HOST.loopback).toBe("127.0.0.1");
    expect(BIND_HOST.lan).toBe("0.0.0.0");
  });

  it("binds the loopback host when lan is not requested", () => {
    expect(handle.host).toBe("127.0.0.1");
  });
});

describe("room server access control", () => {
  it("refuses a request with no token", async () => {
    const res = await fetch(`http://127.0.0.1:${handle.port}/`);
    expect(res.status).toBe(401);
  });

  it("refuses a request with the wrong token", async () => {
    const res = await fetch(url("/", createSessionToken()));
    expect(res.status).toBe(401);
  });

  it("refuses a cross-origin post even with the right token", async () => {
    const res = await fetch(url("/message"), {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://evil.example" },
      body: JSON.stringify({ kind: "join", name: "attacker" }),
    });
    expect(res.status).toBe(403);
  });

  it("serves the room document with a CSP that forbids external fetches", async () => {
    const res = await fetch(url("/"));
    expect(res.status).toBe(200);
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("returns 404 for an unknown endpoint", async () => {
    expect((await fetch(url("/admin"))).status).toBe(404);
  });
});

describe("room document", () => {
  it("carries the participation panel", async () => {
    const html = await (await fetch(url("/"))).text();
    expect(html).toContain("data-forma-room");
    expect(html).toContain("data-room-join");
  });

  it("still contains the document the portable build would produce", async () => {
    const html = await (await fetch(url("/"))).text();
    expect(html).toContain("blk-brief__question");
  });

  it("tells a reader without JavaScript that the panel needs it", async () => {
    const html = await (await fetch(url("/"))).text();
    expect(html).toContain("<noscript>");
  });
});

describe("room participation", () => {
  it("rejects a vote from someone who has not joined", async () => {
    const decisionId = decisionBlockId();
    const result = await post({ kind: "vote", blockId: decisionId, choice: "for" });
    expect(result.status).toBe(400);
  });

  it("rejects a malformed message before it reaches the state", async () => {
    const result = await post({ kind: "vote", blockId: "d", choice: "veto" });
    expect(result.status).toBe(400);
  });

  it("runs join, vote, comment, and freeze end to end", async () => {
    const decisionId = decisionBlockId();

    const joined = await post({ kind: "join", name: "테스터" });
    expect(joined.status).toBe(200);
    const participantId = joined.json["participantId"] as string;
    expect(participantId).toBeTruthy();

    expect((await post({ kind: "vote", blockId: decisionId, choice: "against" }, participantId)).status).toBe(200);
    expect(
      (await post({ kind: "comment", blockId: decisionId, text: "롤백 경로 미검증" }, participantId))
        .status,
    ).toBe(200);
    expect(
      (await post({ kind: "simulation", blockId: simBlock().id, inputs: simInputs() }, participantId))
        .status,
    ).toBe(200);

    const frozen = await post({ kind: "freeze" }, participantId);
    expect(frozen.status).toBe(200);
    expect(handle.state().frozenAt).not.toBeNull();

    // Nothing reached disk before the freeze; three files after it.
    expect(written).toHaveLength(3);
  });

  it("refuses further input after the freeze", async () => {
    const result = await post({ kind: "join", name: "지각" });
    expect(result.status).toBe(409);
  });
});

describe("freeze output", () => {
  it("writes a decision record carrying the room's dissent", async () => {
    const record = JSON.parse(await readFile(path.join(outDir, "decision.json"), "utf-8"));
    const dissent = record.decisions[0].dissent;
    expect(dissent).toContainEqual({
      who: "테스터",
      objection: "롤백 경로 미검증",
      source: "room",
    });
  });

  it("separates the session's network posture from the snapshot's", async () => {
    const manifest = JSON.parse(await readFile(path.join(outDir, "manifest.json"), "utf-8"));
    expect(manifest.session.externalNetworkRequests).toBe(0);
    expect(manifest.session.localNetwork).toBe("loopback only");
    expect(manifest.snapshot.externalNetworkRequests).toBe(0);
    expect(manifest.snapshot.localNetworkRequests).toBe(0);
  });

  it("writes a snapshot that has no room panel and no way to talk to a server", async () => {
    const snapshot = await readFile(path.join(outDir, "snapshot.html"), "utf-8");
    expect(snapshot).not.toContain("data-forma-room");
    expect(snapshot).not.toContain("EventSource");
    expect(snapshot).not.toContain("/message?t=");
  });

  it("writes a snapshot that contains the meeting record", async () => {
    const snapshot = await readFile(path.join(outDir, "snapshot.html"), "utf-8");
    expect(snapshot).toContain('id="room-record"');
    expect(snapshot).toContain("롤백 경로 미검증");
  });
});

function decisionBlockId(): string {
  const block = spec.sections.find((section) => section.type === "decision-record");
  if (!block) throw new Error("fixture has no decision-record block");
  return block.id;
}

function simBlock() {
  const block = spec.sections.find((section) => section.type === "simulation");
  if (!block || block.type !== "simulation") throw new Error("fixture has no simulation block");
  return block;
}

/**
 * A real input name with a value the fixture does not use, so a test that it
 * reached the record cannot pass on the authored default.
 */
const PROBE_VALUE = 4242;
function simInputs(): Record<string, number> {
  return { [simBlock().inputs[0]!.name]: PROBE_VALUE };
}

/**
 * Assertions about the record have to be scoped to the record. The labels
 * also appear in the document above it, so an unscoped `toContain` passes
 * whether or not the record was built correctly.
 */
async function recordSection(): Promise<string> {
  const snapshot = await readFile(path.join(outDir, "snapshot.html"), "utf-8");
  const start = snapshot.indexOf('<section class="room-record"');
  if (start === -1) throw new Error("snapshot has no room-record section");
  return snapshot.slice(start, snapshot.indexOf("</section>", start));
}

/**
 * Each of these was found by looking at a real render, not by a failing
 * test. They are pinned here so the next change cannot quietly undo them.
 */
describe("defects found by eye", () => {
  it("neutralises [hidden] against the panel's own display rules", async () => {
    // Every flex rule in the panel CSS outranks the UA stylesheet's
    // [hidden]{display:none}, so without an explicit rule the panel renders
    // in full with scripting off — the one state where nothing in it works.
    const html = await (await fetch(url("/"))).text();
    expect(html).toContain(".room-panel[hidden],.room-panel [hidden]{display:none}");
  });

  it("does not send the host's filesystem paths to participants", async () => {
    const manifest = JSON.parse(await readFile(path.join(outDir, "manifest.json"), "utf-8"));
    expect(manifest.files).toEqual(["decision.json", "snapshot.html", "manifest.json"]);
    // The freeze reply is the one response that could carry a path. With
    // --lan it crosses to another desk, so it carries basenames only.
    expect(JSON.stringify(manifest.files)).not.toContain(path.sep + "var");
  });

  it("labels the tally instead of showing a bare numeric triple", async () => {
    const html = await (await fetch(url("/"))).text();
    expect(html).toContain('data-label-for="찬성"');
    expect(html).toContain('data-label-against="반대"');
  });

  it("writes the snapshot's inputs with their authored labels, not variable names", async () => {
    const section = await recordSection();
    const first = simBlock().inputs[0]!;
    expect(section).toContain(first.label);
    expect(section).toContain(String(PROBE_VALUE));
    // The raw name is what a reader a year later cannot interpret.
    expect(section).not.toContain(first.name);
  });

  it("keeps the raw variable names in decision.json, which is the machine's copy", async () => {
    const record = JSON.parse(await readFile(path.join(outDir, "decision.json"), "utf-8"));
    const sim = simBlock();
    expect(record.simulationInputs[sim.id]).toEqual({ [sim.inputs[0]!.name]: PROBE_VALUE });
  });
});
