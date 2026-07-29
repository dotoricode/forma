/**
 * The wire vocabulary between a participant's browser and the room server.
 *
 * Everything here is untrusted. With `--lan` the sender is another machine
 * on the office network, and even on loopback it is any process on the box.
 * So each message is parsed against a schema with explicit bounds before it
 * reaches the state reducers, and the bounds are deliberately tight: a
 * blockId is an authored identifier, not free text, and a comment is a
 * remark in a meeting, not a file upload.
 */
import { z } from "zod";

/** Long enough for any authored block id, short enough to bound the payload. */
const MAX_BLOCK_ID = 120;
const MAX_NAME = 60;
const MAX_COMMENT = 2000;
/** A simulation block has a handful of controls; this is far above any real one. */
const MAX_SIM_INPUTS = 64;

const BlockIdSchema = z.string().min(1).max(MAX_BLOCK_ID);

export const JoinMessageSchema = z.object({
  kind: z.literal("join"),
  name: z.string().min(1).max(MAX_NAME),
});

export const VoteMessageSchema = z.object({
  kind: z.literal("vote"),
  blockId: BlockIdSchema,
  choice: z.enum(["for", "against", "abstain"]),
});

export const CommentMessageSchema = z.object({
  kind: z.literal("comment"),
  blockId: BlockIdSchema,
  text: z.string().min(1).max(MAX_COMMENT),
});

export const SimulationMessageSchema = z.object({
  kind: z.literal("simulation"),
  blockId: BlockIdSchema,
  // `finite` matters: NaN and Infinity survive JSON round-trips through
  // some clients and would poison a frozen record's "inputs at the time".
  inputs: z
    .record(z.string().min(1).max(MAX_BLOCK_ID), z.number().finite())
    .refine((value) => Object.keys(value).length <= MAX_SIM_INPUTS, {
      message: `at most ${MAX_SIM_INPUTS} inputs`,
    }),
});

export const FreezeMessageSchema = z.object({ kind: z.literal("freeze") });

export const ClientMessageSchema = z.discriminatedUnion("kind", [
  JoinMessageSchema,
  VoteMessageSchema,
  CommentMessageSchema,
  SimulationMessageSchema,
  FreezeMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export type ParseResult =
  | { ok: true; message: ClientMessage }
  | { ok: false; error: string };

export function parseClientMessage(input: unknown): ParseResult {
  const result = ClientMessageSchema.safeParse(input);
  if (result.success) return { ok: true, message: result.data };
  const first = result.error.issues[0];
  const where = first?.path.join(".");
  return { ok: false, error: where ? `${where}: ${first?.message}` : (first?.message ?? "invalid") };
}
