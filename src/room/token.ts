/**
 * The one thing standing between an open room and anyone else who can reach
 * the port. Generated per session, printed once, never written to disk and
 * never reused: closing the room invalidates it because the only copy lived
 * in the process.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";

/** 192 bits. Base64url so it survives a URL and a copy-paste into chat. */
const TOKEN_BYTES = 24;

export function createSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Constant-time within a length class. Comparing lengths first does leak the
 * token's length, which is a fixed constant of the build and therefore not a
 * secret; what it avoids is `timingSafeEqual` throwing on mismatched buffers.
 */
export function tokensMatch(expected: string, candidate: unknown): boolean {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  const a = Buffer.from(expected, "utf-8");
  const b = Buffer.from(candidate, "utf-8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
