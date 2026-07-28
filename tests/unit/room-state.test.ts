import { describe, expect, it } from "vitest";
import {
  RoomStateError,
  addComment,
  addParticipant,
  castVote,
  createRoomState,
  freezeRoom,
  setSimulationInputs,
  tallyVotes,
} from "../../src/room/state.js";

const AT = "2026-07-28T00:00:00.000Z";

function room() {
  return createRoomState({
    roomId: "r1",
    title: "출시 결정",
    specHash: "spec-hash",
    sourceHash: "source-hash",
    openedAt: AT,
  });
}

function withAlice() {
  return addParticipant(room(), { id: "p1", name: "Alice", at: AT });
}

describe("room state", () => {
  it("does not mutate the state it is given", () => {
    const before = room();
    const after = addParticipant(before, { id: "p1", name: "Alice", at: AT });
    expect(before.participants).toHaveLength(0);
    expect(after.participants).toHaveLength(1);
  });

  it("replaces a participant's earlier vote on the same block", () => {
    let state = withAlice();
    state = castVote(state, { participantId: "p1", blockId: "d1", choice: "for", at: AT });
    state = castVote(state, { participantId: "p1", blockId: "d1", choice: "against", at: AT });
    expect(state.votes).toHaveLength(1);
    expect(state.votes[0]?.choice).toBe("against");
  });

  it("keeps votes from different participants on the same block", () => {
    let state = addParticipant(withAlice(), { id: "p2", name: "Bob", at: AT });
    state = castVote(state, { participantId: "p1", blockId: "d1", choice: "for", at: AT });
    state = castVote(state, { participantId: "p2", blockId: "d1", choice: "against", at: AT });
    expect(tallyVotes(state, "d1")).toEqual({ for: 1, against: 1, abstain: 0 });
  });

  it("counts only the requested block in a tally", () => {
    let state = castVote(withAlice(), { participantId: "p1", blockId: "d1", choice: "for", at: AT });
    state = castVote(state, { participantId: "p1", blockId: "d2", choice: "against", at: AT });
    expect(tallyVotes(state, "d1")).toEqual({ for: 1, against: 0, abstain: 0 });
  });

  it("refuses a vote from someone who never joined", () => {
    expect(() =>
      castVote(room(), { participantId: "ghost", blockId: "d1", choice: "for", at: AT }),
    ).toThrow(RoomStateError);
  });

  it("refuses a comment from someone who never joined", () => {
    expect(() =>
      addComment(room(), { id: "c1", participantId: "ghost", blockId: "d1", text: "?", at: AT }),
    ).toThrow(RoomStateError);
  });

  it("keeps simulation inputs per block", () => {
    let state = setSimulationInputs(withAlice(), { blockId: "sim1", inputs: { headcount: 4 } });
    state = setSimulationInputs(state, { blockId: "sim2", inputs: { weeks: 6 } });
    expect(state.simulationInputs).toEqual({ sim1: { headcount: 4 }, sim2: { weeks: 6 } });
  });

  it("replaces a block's simulation inputs rather than merging them", () => {
    let state = setSimulationInputs(withAlice(), { blockId: "sim1", inputs: { a: 1, b: 2 } });
    state = setSimulationInputs(state, { blockId: "sim1", inputs: { a: 9 } });
    expect(state.simulationInputs["sim1"]).toEqual({ a: 9 });
  });
});

/**
 * Freeze is the moment the room stops being a conversation and becomes a
 * record. If it kept accepting input afterwards the file on disk would stop
 * matching what it claims to describe.
 */
describe("decision freeze", () => {
  it("marks the room frozen at the given time", () => {
    const state = freezeRoom(withAlice(), AT);
    expect(state.frozenAt).toBe(AT);
  });

  it("rejects every further change once frozen", () => {
    const frozen = freezeRoom(withAlice(), AT);
    expect(() => addParticipant(frozen, { id: "p2", name: "Bob", at: AT })).toThrow(RoomStateError);
    expect(() =>
      castVote(frozen, { participantId: "p1", blockId: "d1", choice: "for", at: AT }),
    ).toThrow(RoomStateError);
    expect(() =>
      addComment(frozen, { id: "c1", participantId: "p1", blockId: "d1", text: "x", at: AT }),
    ).toThrow(RoomStateError);
    expect(() => setSimulationInputs(frozen, { blockId: "s", inputs: {} })).toThrow(RoomStateError);
  });

  it("refuses to freeze twice", () => {
    expect(() => freezeRoom(freezeRoom(withAlice(), AT), AT)).toThrow(RoomStateError);
  });
});
