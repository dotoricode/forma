import { describe, expect, it } from "vitest";
import { parseClientMessage } from "../../src/room/protocol.js";
import { createSessionToken, tokensMatch } from "../../src/room/token.js";

/**
 * Room Mode is the first Forma surface that accepts input from another
 * machine. Everything crossing that boundary is parsed before it is
 * believed; these tests pin the rejections, because a validator that only
 * ever gets shown valid input is indistinguishable from no validator.
 */
describe("client message parsing", () => {
  it("accepts a well-formed vote", () => {
    const result = parseClientMessage({ kind: "vote", blockId: "d1", choice: "for" });
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown message kind", () => {
    expect(parseClientMessage({ kind: "shutdown" }).ok).toBe(false);
  });

  it("rejects a vote choice outside the three allowed", () => {
    expect(parseClientMessage({ kind: "vote", blockId: "d1", choice: "veto" }).ok).toBe(false);
  });

  it("rejects a comment longer than the limit", () => {
    const long = { kind: "comment", blockId: "d1", text: "x".repeat(2001) };
    expect(parseClientMessage(long).ok).toBe(false);
  });

  it("rejects an empty comment", () => {
    expect(parseClientMessage({ kind: "comment", blockId: "d1", text: "" }).ok).toBe(false);
  });

  it("rejects a display name longer than the limit", () => {
    expect(parseClientMessage({ kind: "join", name: "n".repeat(61) }).ok).toBe(false);
  });

  it("rejects a non-finite simulation input", () => {
    const message = { kind: "simulation", blockId: "s1", inputs: { a: Number.POSITIVE_INFINITY } };
    expect(parseClientMessage(message).ok).toBe(false);
  });

  it("rejects a simulation input that is not a number", () => {
    expect(parseClientMessage({ kind: "simulation", blockId: "s1", inputs: { a: "4" } }).ok).toBe(
      false,
    );
  });

  it("rejects a blockId longer than any real block id", () => {
    expect(parseClientMessage({ kind: "vote", blockId: "d".repeat(121), choice: "for" }).ok).toBe(
      false,
    );
  });

  it("rejects a non-object payload", () => {
    expect(parseClientMessage("vote").ok).toBe(false);
    expect(parseClientMessage(null).ok).toBe(false);
  });
});

describe("session token", () => {
  it("produces a different token every time", () => {
    expect(createSessionToken()).not.toBe(createSessionToken());
  });

  it("matches itself", () => {
    const token = createSessionToken();
    expect(tokensMatch(token, token)).toBe(true);
  });

  it("rejects a different token of the same length", () => {
    expect(tokensMatch(createSessionToken(), createSessionToken())).toBe(false);
  });

  it("rejects a token of a different length without throwing", () => {
    expect(tokensMatch(createSessionToken(), "short")).toBe(false);
  });

  it("rejects an empty candidate", () => {
    expect(tokensMatch(createSessionToken(), "")).toBe(false);
  });
});
