/**
 * Writing a Decision Freeze to disk.
 *
 * Three files, and the split matters:
 *
 * - `decision.json` is the machine-readable record.
 * - `snapshot.html` is the document plus the record, and it makes *no*
 *   requests of any kind — not to the internet and not to the room server,
 *   which by then is gone. It is the artifact that survives.
 * - `manifest.json` states the network posture in two separate fields
 *   because the room and the snapshot do not share one. Collapsing them into
 *   a single "no network requests" line would be false about the session.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { FormaSpec } from "../spec/schema.js";
import { escapeHtml } from "../security/sanitize.js";
import { buildDecisionRecord, type DecisionRecord } from "./freeze.js";
import type { RoomState } from "./state.js";
import type { BindMode } from "./server.js";

export function hashText(text: string): string {
  return createHash("sha256").update(text, "utf-8").digest("hex");
}

interface SnapshotLabels {
  heading: string;
  decision: string;
  owner: string;
  due: string;
  rationale: string;
  tally: string;
  dissent: string;
  unresolved: string;
  inputs: string;
  participants: string;
  frozenAt: string;
  fromSpec: string;
  fromRoom: string;
  noDue: string;
}

const SNAPSHOT_LABELS: Record<"ko" | "en", SnapshotLabels> = {
  ko: {
    heading: "회의 기록",
    decision: "결정",
    owner: "담당자",
    due: "기한",
    rationale: "근거",
    tally: "표결 (찬성 / 반대 / 기권)",
    dissent: "반대 의견",
    unresolved: "미해결 항목",
    inputs: "선택 당시 입력값",
    participants: "참여자",
    frozenAt: "확정 시각",
    fromSpec: "사전 기록",
    fromRoom: "회의 중",
    noDue: "미정",
  },
  en: {
    heading: "Meeting record",
    decision: "Decision",
    owner: "Owner",
    due: "Due",
    rationale: "Rationale",
    tally: "Votes (for / against / abstain)",
    dissent: "Dissent",
    unresolved: "Still unresolved",
    inputs: "Inputs at the time",
    participants: "Participants",
    frozenAt: "Frozen at",
    fromSpec: "recorded beforehand",
    fromRoom: "raised in the room",
    noDue: "unset",
  },
};

/**
 * The record as a readable section, appended inside the document body so it
 * inherits the artifact's own typography rather than arriving as an
 * unstyled afterthought.
 */
export function buildSnapshotHtml(html: string, record: DecisionRecord, spec: FormaSpec): string {
  const t = SNAPSHOT_LABELS[spec.meta.language === "ko" ? "ko" : "en"];
  const simLabels = simulationLabels(spec);
  const row = (term: string, value: string) =>
    `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`;

  const decisions = record.decisions
    .map((entry) => {
      const dissent =
        entry.dissent.length === 0
          ? ""
          : `<h4>${escapeHtml(t.dissent)}</h4><dl class="decision-record__dissent">${entry.dissent
              .map(
                (d) =>
                  `<dt>${escapeHtml(d.who)} <small>(${escapeHtml(
                    d.source === "spec" ? t.fromSpec : t.fromRoom,
                  )})</small></dt><dd>${escapeHtml(d.objection)}</dd>`,
              )
              .join("")}</dl>`;
      return `<article class="room-record__decision" data-status="${escapeHtml(entry.status)}">
<h3>${escapeHtml(entry.decision)}</h3>
<dl class="decision-record__meta">
${row(t.owner, entry.owner)}
${row(t.due, entry.due ?? t.noDue)}
${row(t.tally, `${entry.tally.for} / ${entry.tally.against} / ${entry.tally.abstain}`)}
</dl>
<p>${escapeHtml(entry.rationale)}</p>
${dissent}
</article>`;
    })
    .join("\n");

  const unresolved =
    record.unresolved.length === 0
      ? ""
      : `<h3>${escapeHtml(t.unresolved)}</h3><ul>${record.unresolved
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul>`;

  const inputEntries = Object.entries(record.simulationInputs);
  const inputs =
    inputEntries.length === 0
      ? ""
      : `<h3>${escapeHtml(t.inputs)}</h3>${inputEntries
          .map(([blockId, values]) => {
            const labels = simLabels.get(blockId);
            // The authored labels, not the variable names. Someone reading
            // this a year from now needs "정식 인증 지연 일 30일", not
            // "delayDays=30" — the raw names stay in decision.json, which is
            // the file meant for machines.
            const rows = Object.entries(values)
              .map(([name, value]) => {
                const input = labels?.inputs.get(name);
                const unit = input?.unit ? ` ${input.unit}` : "";
                return row(input?.label ?? name, `${value}${unit}`);
              })
              .join("");
            const heading = labels?.title
              ? `<h4>${escapeHtml(labels.title)}</h4>`
              : `<h4>${escapeHtml(blockId)}</h4>`;
            return `${heading}<dl class="decision-record__meta">${rows}</dl>`;
          })
          .join("")}`;

  const section = `
<section class="room-record" id="room-record" aria-labelledby="room-record-heading">
<h2 id="room-record-heading">${escapeHtml(t.heading)}</h2>
<dl class="decision-record__meta">
${row(t.frozenAt, record.frozenAt)}
${row(t.participants, record.participants.join(", "))}
</dl>
${decisions}
${unresolved}
${inputs}
</section>`;

  const withStyle = html.replace("</head>", `<style>${ROOM_RECORD_CSS}</style>\n</head>`);
  return withStyle.replace("</main>", `${section}\n  </main>`);
}

/**
 * The record is appended to a finished document, so it inherits the
 * artifact's type but none of its block spacing. Without this every heading
 * sits flush against the paragraph above it and the whole record reads as
 * one undifferentiated wall.
 */
const ROOM_RECORD_CSS = `
.room-record{margin-block-start:var(--space-8);padding-block-start:var(--space-6);
  border-block-start:1px solid var(--color-border)}
.room-record>h2{margin-block-end:var(--space-5)}
.room-record h3{margin-block:var(--space-6) var(--space-3)}
.room-record h4{margin-block:var(--space-4) var(--space-2)}
.room-record>ul{margin-block:0 var(--space-4);padding-inline-start:var(--space-5);list-style:disc}
.room-record>ul li{margin-block-end:var(--space-1)}
.room-record p{margin-block:var(--space-3)}
.room-record__decision{margin-block-start:var(--space-6)}
.room-record__decision>h3{margin-block-start:0}`;

interface SimulationLabels {
  title: string | null;
  inputs: Map<string, { label: string; unit?: string }>;
}

function simulationLabels(spec: FormaSpec): Map<string, SimulationLabels> {
  const found = new Map<string, SimulationLabels>();
  for (const block of spec.sections) {
    if (block.type !== "simulation") continue;
    found.set(block.id, {
      title: block.title ?? null,
      inputs: new Map(
        block.inputs.map((input) => [
          input.name,
          input.unit === undefined ? { label: input.label } : { label: input.label, unit: input.unit },
        ]),
      ),
    });
  }
  return found;
}

export interface FreezeWriteOptions {
  outDir: string;
  spec: FormaSpec;
  /** The document without the room panel: the thing that makes no requests. */
  html: string;
  bind: BindMode;
}

/** Returns the paths written, in the order a reader should look at them. */
export async function writeFreeze(
  state: RoomState,
  options: FreezeWriteOptions,
): Promise<string[]> {
  const record = buildDecisionRecord(state, options.spec.sections);
  const snapshot = buildSnapshotHtml(options.html, record, options.spec);

  await mkdir(options.outDir, { recursive: true });
  const decisionPath = path.join(options.outDir, "decision.json");
  const snapshotPath = path.join(options.outDir, "snapshot.html");
  const manifestPath = path.join(options.outDir, "manifest.json");

  const manifest = {
    generator: "forma@0.1.0",
    kind: "decision-freeze",
    roomId: record.roomId,
    title: record.title,
    specHash: record.specHash,
    sourceHash: record.sourceHash,
    snapshotHash: hashText(snapshot),
    openedAt: record.openedAt,
    frozenAt: record.frozenAt,
    participantCount: record.participants.length,
    // Two fields, not one. The session did use the local network; the
    // snapshot uses nothing. A single "offline: true" would be a lie about
    // one of them, and which one depends on which you meant.
    session: {
      externalNetworkRequests: 0,
      localNetwork: options.bind === "lan" ? "lan (opt-in via --lan)" : "loopback only",
      telemetry: "none",
      llmCalls: 0,
    },
    snapshot: {
      externalNetworkRequests: 0,
      localNetworkRequests: 0,
      selfContained: true,
    },
    files: ["decision.json", "snapshot.html", "manifest.json"],
  };

  await writeFile(decisionPath, JSON.stringify(record, null, 2), "utf-8");
  await writeFile(snapshotPath, snapshot, "utf-8");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  return [decisionPath, snapshotPath, manifestPath];
}
