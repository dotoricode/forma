/**
 * Decision Freeze: the moment a room becomes a file.
 *
 * A meeting that ends with "we agreed, roughly" is the thing this is meant
 * to replace. So the record keeps the parts that are usually lost — who
 * objected and on what grounds, what nobody had checked yet, and what the
 * numbers on screen were when the call was made — alongside the decision
 * itself. Hashes of the spec and the rendered document are included so that
 * a year later a reader can tell whether the file in front of them still
 * describes the same material.
 *
 * This is the only place in Room Mode that produces something durable.
 */
import type { FormaBlock } from "../blocks/registry.js";
import { RoomStateError, tallyVotes, type RoomState, type Tally } from "./state.js";

export interface DissentEntry {
  who: string;
  objection: string;
  /** `spec` was authored before the meeting; `room` was raised during it. */
  source: "spec" | "room";
}

export interface DecisionEntry {
  blockId: string;
  decision: string;
  owner: string;
  due: string | null;
  rationale: string;
  status: string;
  dissent: DissentEntry[];
  revisitWhen: string[];
  tally: Tally;
}

export interface DecisionRecord {
  roomId: string;
  title: string;
  specHash: string;
  sourceHash: string;
  openedAt: string;
  frozenAt: string;
  participants: string[];
  decisions: DecisionEntry[];
  unresolved: string[];
  simulationInputs: Record<string, Record<string, number>>;
  comments: Array<{ who: string; blockId: string; text: string; at: string }>;
}

/** Placeholder for a participant who voted against but wrote no objection. */
const UNSTATED_OBJECTION = "반대했으나 사유를 남기지 않음";

export function buildDecisionRecord(state: RoomState, blocks: readonly FormaBlock[]): DecisionRecord {
  if (state.frozenAt === null) {
    throw new RoomStateError(
      "forma: a decision record can only be built from a frozen room. Freeze it first.",
    );
  }
  const nameOf = (participantId: string) =>
    state.participants.find((p) => p.id === participantId)?.name ?? participantId;

  const decisions = blocks
    .filter((block): block is Extract<FormaBlock, { type: "decision-record" }> =>
      block.type === "decision-record",
    )
    .map((block) => ({
      blockId: block.id,
      decision: block.decision,
      owner: block.owner,
      due: block.due ?? null,
      rationale: block.rationale,
      status: block.status,
      revisitWhen: [...block.revisitWhen],
      tally: tallyVotes(state, block.id),
      dissent: collectDissent(state, block, nameOf),
    }));

  // Everything the brief admitted was still unknown. These are the items a
  // reader should treat as open when they reopen the decision.
  const unresolved = blocks
    .filter((block): block is Extract<FormaBlock, { type: "brief" }> => block.type === "brief")
    .flatMap((block) => block.stillUnknown);

  return {
    roomId: state.roomId,
    title: state.title,
    specHash: state.specHash,
    sourceHash: state.sourceHash,
    openedAt: state.openedAt,
    frozenAt: state.frozenAt,
    participants: state.participants.map((p) => p.name),
    decisions,
    unresolved,
    simulationInputs: structuredClone(state.simulationInputs) as Record<
      string,
      Record<string, number>
    >,
    comments: state.comments.map((c) => ({
      who: nameOf(c.participantId),
      blockId: c.blockId,
      text: c.text,
      at: c.at,
    })),
  };
}

/**
 * Authored dissent and dissent raised in the room are both kept, and tagged
 * with which is which. Collapsing them would hide whether an objection was
 * anticipated by the author or surfaced by someone in the meeting.
 *
 * A vote against with no comment still produces an entry: silence from
 * someone who disagreed is a fact about the decision, and dropping it would
 * make the record read as more unanimous than the room was.
 */
function collectDissent(
  state: RoomState,
  block: Extract<FormaBlock, { type: "decision-record" }>,
  nameOf: (participantId: string) => string,
): DissentEntry[] {
  const authored: DissentEntry[] = block.dissent.map((entry) => ({
    who: entry.who,
    objection: entry.objection,
    source: "spec" as const,
  }));

  const objectors = state.votes.filter((v) => v.blockId === block.id && v.choice === "against");
  const fromRoom: DissentEntry[] = [];
  for (const vote of objectors) {
    const said = state.comments.filter(
      (c) => c.blockId === block.id && c.participantId === vote.participantId,
    );
    if (said.length === 0) {
      fromRoom.push({ who: nameOf(vote.participantId), objection: UNSTATED_OBJECTION, source: "room" });
      continue;
    }
    for (const comment of said) {
      fromRoom.push({ who: nameOf(vote.participantId), objection: comment.text, source: "room" });
    }
  }
  return [...authored, ...fromRoom];
}
