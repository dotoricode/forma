import { describe, expect, it } from "vitest";
import { buildDecisionRecord } from "../../src/room/freeze.js";
import {
  addComment,
  addParticipant,
  castVote,
  createRoomState,
  freezeRoom,
  setSimulationInputs,
} from "../../src/room/state.js";
import type { FormaBlock } from "../../src/blocks/registry.js";

const AT = "2026-07-28T00:00:00.000Z";
const FROZEN_AT = "2026-07-28T01:00:00.000Z";

const briefBlock = {
  id: "b1",
  type: "brief",
  question: "9월에 출시할까",
  summary: "요약",
  decideToday: ["출시 여부"],
  stillUnknown: ["부하 테스트 미완료", "법무 검토 대기"],
} as unknown as FormaBlock;

const decisionBlock = {
  id: "d1",
  type: "decision-record",
  decision: "9월 15일 출시",
  owner: "플랫폼팀 김PM",
  due: "2026-09-15",
  rationale: "회귀 위험이 낮다",
  dissent: [{ who: "SRE 박", objection: "롤백 경로가 검증되지 않았다" }],
  revisitWhen: ["에러율이 1%를 넘으면"],
  status: "decided",
} as unknown as FormaBlock;

function frozenRoom() {
  let state = createRoomState({
    roomId: "r1",
    title: "출시 결정",
    specHash: "spec-abc",
    sourceHash: "src-def",
    openedAt: AT,
  });
  state = addParticipant(state, { id: "p1", name: "김PM", at: AT });
  state = addParticipant(state, { id: "p2", name: "SRE 박", at: AT });
  state = castVote(state, { participantId: "p1", blockId: "d1", choice: "for", at: AT });
  state = castVote(state, { participantId: "p2", blockId: "d1", choice: "against", at: AT });
  state = addComment(state, {
    id: "c1",
    participantId: "p2",
    blockId: "d1",
    text: "롤백부터 확인하자",
    at: AT,
  });
  state = setSimulationInputs(state, { blockId: "sim1", inputs: { weeks: 6 } });
  return freezeRoom(state, FROZEN_AT);
}

/**
 * The frozen record is the only thing that outlives the room, so it has to
 * carry the parts a reader will want a year later: not just what was
 * decided, but who objected and what was still unknown at the time.
 */
describe("decision freeze record", () => {
  const record = buildDecisionRecord(frozenRoom(), [briefBlock, decisionBlock]);

  it("carries the decision, owner, due date, and rationale", () => {
    expect(record.decisions[0]).toMatchObject({
      decision: "9월 15일 출시",
      owner: "플랫폼팀 김PM",
      due: "2026-09-15",
      rationale: "회귀 위험이 낮다",
    });
  });

  it("carries the authored dissent", () => {
    expect(record.decisions[0]?.dissent).toContainEqual({
      who: "SRE 박",
      objection: "롤백 경로가 검증되지 않았다",
      source: "spec",
    });
  });

  it("carries dissent raised in the room, attributed to the participant", () => {
    expect(record.decisions[0]?.dissent).toContainEqual({
      who: "SRE 박",
      objection: "롤백부터 확인하자",
      source: "room",
    });
  });

  it("records a participant who voted against even with nothing to say", () => {
    const record = buildDecisionRecord(frozenRoom(), [decisionBlock]);
    const objections = record.decisions[0]?.dissent.filter((d) => d.who === "SRE 박") ?? [];
    expect(objections.length).toBeGreaterThan(0);
  });

  it("carries the tally", () => {
    expect(record.decisions[0]?.tally).toEqual({ for: 1, against: 1, abstain: 0 });
  });

  it("carries what was still unknown", () => {
    expect(record.unresolved).toEqual(["부하 테스트 미완료", "법무 검토 대기"]);
  });

  it("carries the simulation inputs as they stood at freeze time", () => {
    expect(record.simulationInputs).toEqual({ sim1: { weeks: 6 } });
  });

  it("carries both hashes and the freeze time", () => {
    expect(record).toMatchObject({
      specHash: "spec-abc",
      sourceHash: "src-def",
      frozenAt: FROZEN_AT,
      openedAt: AT,
    });
  });

  it("lists the participants who were in the room", () => {
    expect(record.participants).toEqual(["김PM", "SRE 박"]);
  });

  it("refuses to build a record from a room that is still open", () => {
    const open = createRoomState({
      roomId: "r1",
      title: "t",
      specHash: "s",
      sourceHash: "d",
      openedAt: AT,
    });
    expect(() => buildDecisionRecord(open, [decisionBlock])).toThrow();
  });
});
