/**
 * What the room knows, held in memory and nowhere else.
 *
 * Nothing here touches the filesystem. A room that wrote every keystroke to
 * disk would leave a transcript of an internal discussion lying around after
 * the meeting, which is exactly what people are afraid of when they paste a
 * roadmap into a tool. The state lives for as long as the process does, and
 * the only thing that ever reaches disk is a Decision Freeze the room asked
 * for explicitly.
 *
 * Every function returns a new state. Timestamps arrive as arguments rather
 * than being read from the clock in here, so the reducers stay pure and the
 * tests stay deterministic.
 */

export class RoomStateError extends Error {}

export type VoteChoice = "for" | "against" | "abstain";

export interface Participant {
  readonly id: string;
  readonly name: string;
  readonly joinedAt: string;
}

export interface Vote {
  readonly participantId: string;
  readonly blockId: string;
  readonly choice: VoteChoice;
  readonly at: string;
}

export interface Comment {
  readonly id: string;
  readonly participantId: string;
  readonly blockId: string;
  readonly text: string;
  readonly at: string;
}

export interface RoomState {
  readonly roomId: string;
  readonly title: string;
  /** Hash of the spec as authored, so a frozen record names its own input. */
  readonly specHash: string;
  /** Hash of the rendered document, for the same reason. */
  readonly sourceHash: string;
  readonly openedAt: string;
  readonly participants: readonly Participant[];
  readonly votes: readonly Vote[];
  readonly comments: readonly Comment[];
  readonly simulationInputs: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly frozenAt: string | null;
}

export interface RoomInit {
  roomId: string;
  title: string;
  specHash: string;
  sourceHash: string;
  openedAt: string;
}

export function createRoomState(init: RoomInit): RoomState {
  return {
    ...init,
    participants: [],
    votes: [],
    comments: [],
    simulationInputs: {},
    frozenAt: null,
  };
}

function assertOpen(state: RoomState): void {
  if (state.frozenAt !== null) {
    throw new RoomStateError(
      `forma: this room was frozen at ${state.frozenAt}. A frozen record does not take further input.`,
    );
  }
}

function assertParticipant(state: RoomState, participantId: string): void {
  if (!state.participants.some((p) => p.id === participantId)) {
    throw new RoomStateError(`forma: '${participantId}' is not in this room.`);
  }
}

export function addParticipant(
  state: RoomState,
  entry: { id: string; name: string; at: string },
): RoomState {
  assertOpen(state);
  if (state.participants.some((p) => p.id === entry.id)) {
    throw new RoomStateError(`forma: '${entry.id}' has already joined.`);
  }
  return {
    ...state,
    participants: [...state.participants, { id: entry.id, name: entry.name, joinedAt: entry.at }],
  };
}

/**
 * One vote per participant per block. A second vote replaces the first
 * rather than stacking, because a room where someone changes their mind
 * should show one position, not a voting history that inflates the tally.
 */
export function castVote(
  state: RoomState,
  vote: { participantId: string; blockId: string; choice: VoteChoice; at: string },
): RoomState {
  assertOpen(state);
  assertParticipant(state, vote.participantId);
  const others = state.votes.filter(
    (v) => !(v.participantId === vote.participantId && v.blockId === vote.blockId),
  );
  return { ...state, votes: [...others, { ...vote }] };
}

export function addComment(
  state: RoomState,
  comment: { id: string; participantId: string; blockId: string; text: string; at: string },
): RoomState {
  assertOpen(state);
  assertParticipant(state, comment.participantId);
  return { ...state, comments: [...state.comments, { ...comment }] };
}

/**
 * Replaces a block's inputs wholesale rather than merging. The panel always
 * sends the full control set, and a merge would quietly keep a stale value
 * for any input that had been removed from the spec since.
 */
export function setSimulationInputs(
  state: RoomState,
  entry: { blockId: string; inputs: Record<string, number> },
): RoomState {
  assertOpen(state);
  return {
    ...state,
    simulationInputs: { ...state.simulationInputs, [entry.blockId]: { ...entry.inputs } },
  };
}

export function freezeRoom(state: RoomState, at: string): RoomState {
  assertOpen(state);
  return { ...state, frozenAt: at };
}

export interface Tally {
  for: number;
  against: number;
  abstain: number;
}

export function tallyVotes(state: RoomState, blockId: string): Tally {
  const tally: Tally = { for: 0, against: 0, abstain: 0 };
  for (const vote of state.votes) {
    if (vote.blockId === blockId) tally[vote.choice] += 1;
  }
  return tally;
}

/** Every block that anyone voted on or commented on, in first-seen order. */
export function discussedBlockIds(state: RoomState): string[] {
  const seen: string[] = [];
  for (const entry of [...state.votes, ...state.comments]) {
    if (!seen.includes(entry.blockId)) seen.push(entry.blockId);
  }
  return seen;
}
