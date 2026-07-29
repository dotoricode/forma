/**
 * The room server.
 *
 * This is the first Forma surface that is not a file. Two things follow from
 * that and both are deliberate:
 *
 * 1. It binds `127.0.0.1` unless `--lan` is passed. Reaching the room from
 *    another desk is opt-in, spelled out on the command line, and printed
 *    back so nobody discovers later that the meeting was on the network.
 * 2. "No external network requests" and "participants talk over the LAN" are
 *    different claims. The document still fetches nothing from the internet
 *    — a CSP sent with every response enforces it rather than asserting it —
 *    but it does talk to this server. The manifest says so in those words.
 *
 * Transport is Server-Sent Events plus POST rather than WebSocket. Node has
 * no WebSocket server in core, and adding one would put a runtime dependency
 * behind a product whose whole claim is that its output depends on nothing.
 * SSE is in every browser and in `node:http`, and one-way push plus ordinary
 * POSTs is the shape this traffic actually has.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import type { FormaSpec } from "../spec/schema.js";
import { parseClientMessage } from "./protocol.js";
import { tokensMatch } from "./token.js";
import {
  RoomStateError,
  addComment,
  addParticipant,
  castVote,
  createRoomState,
  freezeRoom,
  setSimulationInputs,
  type RoomState,
} from "./state.js";
import { buildRoomDocument } from "./panel.js";

/** Bounds the request body. A room message is a vote or a remark. */
const MAX_BODY_BYTES = 16 * 1024;
/** Comment keeps intermediaries from closing an idle SSE stream. */
const HEARTBEAT_MS = 20_000;

const CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  "font-src data:",
  "img-src data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export type BindMode = "loopback" | "lan";

export const BIND_HOST: Record<BindMode, string> = {
  loopback: "127.0.0.1",
  lan: "0.0.0.0",
};

export interface RoomServerOptions {
  spec: FormaSpec;
  /** The rendered document, exactly as a portable build would produce it. */
  html: string;
  specHash: string;
  sourceHash: string;
  token: string;
  bind: BindMode;
  port: number;
  /** Called once, with the record to persist, when the room freezes. */
  onFreeze: (state: RoomState) => Promise<string[]>;
  now?: () => string;
}

export interface RoomServerHandle {
  server: Server;
  host: string;
  port: number;
  state: () => RoomState;
  close: () => Promise<void>;
}

export async function startRoomServer(options: RoomServerOptions): Promise<RoomServerHandle> {
  const now = options.now ?? (() => new Date().toISOString());
  let state = createRoomState({
    roomId: randomUUID(),
    title: options.spec.meta.title,
    specHash: options.specHash,
    sourceHash: options.sourceHash,
    openedAt: now(),
  });

  const roomHtml = buildRoomDocument(options.html, options.spec);
  const streams = new Set<ServerResponse>();

  const broadcast = () => {
    const payload = `data: ${JSON.stringify(publicView(state))}\n\n`;
    for (const stream of streams) stream.write(payload);
  };

  const server = createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (error) {
      // A room that dies on one malformed request takes the meeting with it.
      sendJson(res, 500, { error: `unexpected: ${(error as Error).message}` });
    }
  });

  async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (!tokensMatch(options.token, url.searchParams.get("t"))) {
      sendJson(res, 401, { error: "forma: missing or wrong session token" });
      return;
    }
    // The token is in the URL, so a page that does not have it cannot forge a
    // request. Rejecting a foreign Origin anyway closes the case where the
    // URL leaks into a browser tab that a third-party script can read.
    const origin = req.headers.origin;
    if (origin && origin !== `http://${req.headers.host}`) {
      sendJson(res, 403, { error: "forma: cross-origin request refused" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": CSP,
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "cache-control": "no-store",
      });
      res.end(roomHtml);
      return;
    }

    if (req.method === "GET" && url.pathname === "/events") {
      openStream(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/message") {
      await handleMessage(req, res);
      return;
    }

    sendJson(res, 404, { error: "forma: no such room endpoint" });
  }

  function openStream(req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      connection: "keep-alive",
      "x-content-type-options": "nosniff",
    });
    res.write(`data: ${JSON.stringify(publicView(state))}\n\n`);
    streams.add(res);
    const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
    const drop = () => {
      clearInterval(heartbeat);
      streams.delete(res);
    };
    req.on("close", drop);
    res.on("close", drop);
  }

  async function handleMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let raw: string;
    try {
      raw = await readBody(req);
    } catch (error) {
      sendJson(res, 413, { error: (error as Error).message });
      return;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      sendJson(res, 400, { error: "forma: body is not JSON" });
      return;
    }
    const parsed = parseClientMessage(json);
    if (!parsed.ok) {
      sendJson(res, 400, { error: `forma: ${parsed.error}` });
      return;
    }
    const message = parsed.message;
    const at = now();

    try {
      if (message.kind === "join") {
        const id = randomUUID();
        state = addParticipant(state, { id, name: message.name, at });
        broadcast();
        sendJson(res, 200, { participantId: id });
        return;
      }

      const participantId = header(req, "x-forma-participant");
      if (!participantId) {
        sendJson(res, 400, { error: "forma: join the room before sending anything else" });
        return;
      }

      if (message.kind === "vote") {
        state = castVote(state, {
          participantId,
          blockId: message.blockId,
          choice: message.choice,
          at,
        });
      } else if (message.kind === "comment") {
        state = addComment(state, {
          id: randomUUID(),
          participantId,
          blockId: message.blockId,
          text: message.text,
          at,
        });
      } else if (message.kind === "simulation") {
        state = setSimulationInputs(state, { blockId: message.blockId, inputs: message.inputs });
      } else {
        // Freeze is the one message with a side effect outside memory.
        state = freezeRoom(state, at);
        const written = await options.onFreeze(state);
        broadcast();
        // Basenames, not the paths. With `--lan` the reply crosses to another
        // machine, and the host's directory layout is not a participant's
        // business. The operator sees the full paths on the server console.
        console.log(`forma: room frozen — wrote ${written.join(", ")}`);
        sendJson(res, 200, { frozen: true, written: written.map((p) => basename(p)) });
        return;
      }
      broadcast();
      sendJson(res, 200, { ok: true });
    } catch (error) {
      if (error instanceof RoomStateError) {
        sendJson(res, 409, { error: error.message });
        return;
      }
      throw error;
    }
  }

  const host = BIND_HOST[options.bind];
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, host, resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port;

  return {
    server,
    host,
    port,
    state: () => state,
    close: () =>
      new Promise<void>((resolve) => {
        for (const stream of streams) stream.end();
        streams.clear();
        server.close(() => resolve());
      }),
  };
}

/**
 * What participants are allowed to see. Participant ids are omitted: they are
 * bearer credentials for "this is me", so echoing the whole list back would
 * let anyone in the room vote as anyone else.
 */
export function publicView(state: RoomState) {
  return {
    title: state.title,
    openedAt: state.openedAt,
    frozenAt: state.frozenAt,
    participants: state.participants.map((p) => ({ name: p.name, joinedAt: p.joinedAt })),
    votes: state.votes.map((v) => ({ blockId: v.blockId, choice: v.choice })),
    comments: state.comments.map((c) => ({
      blockId: c.blockId,
      text: c.text,
      at: c.at,
      who: state.participants.find((p) => p.id === c.participantId)?.name ?? "?",
    })),
    simulationInputs: state.simulationInputs,
  };
}

function header(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (res.headersSent) {
    res.end();
    return;
  }
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error(`forma: request body over ${MAX_BODY_BYTES} bytes`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
