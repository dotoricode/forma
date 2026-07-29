/**
 * The participation panel, and the only client-side code Room Mode adds.
 *
 * It is injected into a finished document rather than rendered through the
 * block pipeline. That keeps a useful property: the room document is provably
 * "the portable document, plus this panel". Strip the panel and you have the
 * file that makes no requests at all, which is exactly what a Freeze snapshot
 * needs to be.
 *
 * The panel degrades honestly. With JS disabled it shows one line saying the
 * room needs scripting, and the document underneath stays fully readable.
 */
import type { FormaSpec } from "../spec/schema.js";
import { escapeHtml } from "../security/sanitize.js";

interface PanelLabels {
  panel: string;
  join: string;
  yourName: string;
  joinButton: string;
  participants: string;
  noParticipants: string;
  voteFor: string;
  voteAgainst: string;
  voteAbstain: string;
  comment: string;
  commentPlaceholder: string;
  send: string;
  freeze: string;
  freezeHint: string;
  frozen: string;
  needsJs: string;
  connection: string;
  nothingToVoteOn: string;
}

const LABELS: Record<"ko" | "en", PanelLabels> = {
  ko: {
    panel: "회의 참여",
    join: "입장",
    yourName: "이름",
    joinButton: "입장하기",
    participants: "참여자",
    noParticipants: "아직 아무도 입장하지 않았다",
    voteFor: "찬성",
    voteAgainst: "반대",
    voteAbstain: "기권",
    comment: "의견",
    commentPlaceholder: "반대라면 사유를 남겨라. 기록에 남는다.",
    send: "남기기",
    freeze: "결정 확정",
    freezeHint: "확정하면 기록이 파일로 저장되고 이후 입력을 받지 않는다.",
    frozen: "확정됨. 기록이 저장되었다.",
    needsJs: "회의 참여에는 자바스크립트가 필요하다. 문서 본문은 그대로 읽을 수 있다.",
    connection: "연결 상태",
    nothingToVoteOn: "이 문서에는 표결할 결정 항목이 없다.",
  },
  en: {
    panel: "Room",
    join: "Join",
    yourName: "Your name",
    joinButton: "Join the room",
    participants: "Participants",
    noParticipants: "Nobody has joined yet",
    voteFor: "For",
    voteAgainst: "Against",
    voteAbstain: "Abstain",
    comment: "Comment",
    commentPlaceholder: "If you are against, say why. It goes in the record.",
    send: "Leave it",
    freeze: "Freeze the decision",
    freezeHint: "Freezing writes the record to disk and stops accepting input.",
    frozen: "Frozen. The record has been written.",
    needsJs: "Joining the room needs JavaScript. The document itself reads fine without it.",
    connection: "Connection",
    nothingToVoteOn: "This document has no decision to vote on.",
  },
};

/** Decision blocks are what a room votes on. Nothing else is votable. */
function votableBlocks(spec: FormaSpec) {
  return spec.sections
    .filter((block) => block.type === "decision-record")
    .map((block) => ({
      id: block.id,
      decision: (block as { decision: string }).decision,
    }));
}

export function buildRoomPanelHtml(spec: FormaSpec): string {
  const t = LABELS[spec.meta.language === "ko" ? "ko" : "en"];
  const decisions = votableBlocks(spec);

  const decisionSections = decisions
    .map(
      (entry) => `
    <fieldset class="room-decision" data-room-decision="${escapeHtml(entry.id)}">
      <legend>${escapeHtml(entry.decision)}</legend>
      <div class="room-decision__votes" role="group" aria-label="${escapeHtml(t.panel)}">
        <button type="button" data-room-vote="for" aria-pressed="false">${escapeHtml(t.voteFor)}</button>
        <button type="button" data-room-vote="against" aria-pressed="false">${escapeHtml(t.voteAgainst)}</button>
        <button type="button" data-room-vote="abstain" aria-pressed="false">${escapeHtml(t.voteAbstain)}</button>
      </div>
      <p
        class="room-decision__tally"
        data-room-tally
        data-label-for="${escapeHtml(t.voteFor)}"
        data-label-against="${escapeHtml(t.voteAgainst)}"
        data-label-abstain="${escapeHtml(t.voteAbstain)}"
        aria-live="polite"
      ></p>
      <label class="room-decision__comment">
        <span>${escapeHtml(t.comment)}</span>
        <textarea data-room-comment rows="2" maxlength="2000" placeholder="${escapeHtml(t.commentPlaceholder)}"></textarea>
      </label>
      <button type="button" data-room-comment-send>${escapeHtml(t.send)}</button>
      <ul class="room-decision__comments" data-room-comments></ul>
    </fieldset>`,
    )
    .join("");

  return `
<aside class="room-panel no-print" data-forma-room hidden>
  <h2 class="room-panel__title">${escapeHtml(t.panel)}</h2>
  <p class="room-panel__status" data-room-status aria-live="polite"></p>

  <form class="room-join" data-room-join>
    <label class="room-join__field">
      <span>${escapeHtml(t.yourName)}</span>
      <input type="text" name="name" maxlength="60" required autocomplete="name" />
    </label>
    <button type="submit">${escapeHtml(t.joinButton)}</button>
  </form>

  <section class="room-participants" hidden data-room-participants-section>
    <h3>${escapeHtml(t.participants)}</h3>
    <ul data-room-participants aria-live="polite"></ul>
  </section>

  <div class="room-decisions" hidden data-room-decisions>
${decisionSections || `    <p class="room-panel__empty">${escapeHtml(t.nothingToVoteOn)}</p>`}
  </div>

  <section class="room-freeze" hidden data-room-freeze-section>
    <p class="room-freeze__hint">${escapeHtml(t.freezeHint)}</p>
    <button type="button" data-room-freeze data-frozen-label="${escapeHtml(t.frozen)}">${escapeHtml(t.freeze)}</button>
  </section>
</aside>
<noscript><p class="room-panel__noscript">${escapeHtml(t.needsJs)}</p></noscript>`;
}

export function buildRoomPanelCss(): string {
  return `
.room-panel{position:fixed;inset-block:0;inset-inline-end:0;width:min(22rem,100vw);overflow-y:auto;
  padding:var(--space-5);background:var(--color-surface-raised);color:var(--color-text);
  border-inline-start:1px solid var(--color-border);z-index:20;
  font-size:.875rem;display:flex;flex-direction:column;gap:var(--space-4)}
/* Every flex/grid rule below would otherwise beat the UA stylesheet's
   [hidden]{display:none} and leave a panel on screen that JS meant to hide.
   Without this the whole panel renders with scripting off, which is the one
   state where none of its controls do anything. */
.room-panel[hidden],.room-panel [hidden]{display:none}
.room-panel__title{font-size:1rem;margin:0}
.room-panel__status:empty{display:none}
.room-panel__status{margin:0;color:var(--color-text)}
.room-panel h3{font-size:.875rem;margin:0 0 var(--space-2)}
.room-panel ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--space-1)}
.room-join,.room-decision__comment{display:flex;flex-direction:column;gap:var(--space-1)}
.room-panel input[type=text],.room-panel textarea{font:inherit;width:100%;padding:var(--space-2);
  color:var(--color-text);background:var(--color-canvas);
  border:1px solid var(--color-border-strong);border-radius:var(--radius-sm)}
.room-panel button{font:inherit;padding:var(--space-2) var(--space-3);cursor:pointer;
  color:var(--color-text);background:var(--color-canvas);
  border:1px solid var(--color-border-strong);border-radius:var(--radius-sm)}
.room-panel button:hover{border-color:var(--color-accent)}
.room-panel button[aria-pressed=true]{background:var(--color-accent);color:var(--color-on-accent);
  border-color:var(--color-accent)}
.room-decision{border:1px solid var(--color-border);border-radius:var(--radius-md);
  padding:var(--space-3);margin:0 0 var(--space-3);display:flex;flex-direction:column;gap:var(--space-2)}
.room-decision legend{font-weight:600;padding-inline:var(--space-1)}
.room-decision__votes{display:flex;gap:var(--space-1);flex-wrap:wrap}
/* --color-text rather than --color-text-muted: the tally and the freeze
   warning are the two lines a participant must be able to read, and muted
   grey on the raised surface failed contrast in the axe pass. */
.room-decision__tally{margin:0;font-variant-numeric:tabular-nums}
.room-decision__tally,.room-freeze__hint{color:var(--color-text)}
.room-freeze__hint{margin:0 0 var(--space-2)}
.room-decision__comments li{padding-block:var(--space-1);
  border-block-start:1px solid var(--color-border)}
.room-panel__noscript{padding:var(--space-3);text-align:center;color:var(--color-text)}
/* After a freeze the hint still read "freezing will write the record", which
   is advice about something that already happened. */
.room-panel[data-frozen=true] button:not([data-room-vote]),
.room-panel[data-frozen=true] .room-freeze__hint,
.room-panel[data-frozen=true] .room-decision__comment{display:none}
@media (max-width:70rem){
  .room-panel{position:static;width:auto;inset:auto;border-inline-start:0;
    border-block-start:1px solid var(--color-border)}
}
@media print{.room-panel{display:none}}`;
}

/**
 * The client. Written as a string for the same reason `interactive.ts` is:
 * the document ships one inline module and no bundler output, so what a
 * reviewer reads here is literally what runs.
 */
export function buildRoomClientScript(): string {
  return `
(() => {
  const panel = document.querySelector("[data-forma-room]");
  if (!panel) return;
  const token = new URLSearchParams(location.search).get("t");
  if (!token) return;
  panel.hidden = false;

  const status = panel.querySelector("[data-room-status]");
  const joinForm = panel.querySelector("[data-room-join]");
  const say = (text) => { if (status) status.textContent = text; };

  let participantId = null;
  const NAME_KEY = "forma-room-participant";
  try {
    const stored = sessionStorage.getItem(NAME_KEY);
    if (stored) participantId = stored;
  } catch {}

  async function send(body) {
    const headers = { "content-type": "application/json" };
    if (participantId) headers["x-forma-participant"] = participantId;
    const res = await fetch("/message?t=" + encodeURIComponent(token), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      say(json.error || ("HTTP " + res.status));
      return null;
    }
    return json;
  }

  function showJoined() {
    if (joinForm) joinForm.hidden = true;
    for (const sel of ["[data-room-participants-section]", "[data-room-decisions]", "[data-room-freeze-section]"]) {
      const el = panel.querySelector(sel);
      if (el) el.hidden = false;
    }
  }

  if (joinForm) {
    joinForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = joinForm.querySelector("input[name=name]");
      const name = (input && input.value || "").trim();
      if (!name) return;
      const result = await send({ kind: "join", name });
      if (!result) return;
      participantId = result.participantId;
      try { sessionStorage.setItem(NAME_KEY, participantId); } catch {}
      showJoined();
      say("");
    });
  }
  if (participantId) showJoined();

  for (const fieldset of panel.querySelectorAll("[data-room-decision]")) {
    const blockId = fieldset.getAttribute("data-room-decision");
    for (const button of fieldset.querySelectorAll("[data-room-vote]")) {
      button.addEventListener("click", async () => {
        const choice = button.getAttribute("data-room-vote");
        if (!(await send({ kind: "vote", blockId, choice }))) return;
        for (const other of fieldset.querySelectorAll("[data-room-vote]")) {
          other.setAttribute("aria-pressed", String(other === button));
        }
      });
    }
    const box = fieldset.querySelector("[data-room-comment]");
    const sendComment = fieldset.querySelector("[data-room-comment-send]");
    if (box && sendComment) {
      sendComment.addEventListener("click", async () => {
        const text = box.value.trim();
        if (!text) return;
        if (await send({ kind: "comment", blockId, text })) box.value = "";
      });
    }
  }

  const freeze = panel.querySelector("[data-room-freeze]");
  if (freeze) {
    freeze.addEventListener("click", async () => {
      const result = await send({ kind: "freeze" });
      if (result) say(freeze.getAttribute("data-frozen-label") || "");
    });
  }

  // Report simulation inputs so a frozen record can say what the numbers on
  // screen were when the call was made.
  let pending = null;
  for (const sim of document.querySelectorAll("[data-forma-simulation]")) {
    const blockId = sim.closest("[id]") ? sim.closest("[id]").id : null;
    if (!blockId) continue;
    sim.addEventListener("input", () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        const inputs = {};
        for (const control of sim.querySelectorAll("[data-sim-input]")) {
          inputs[control.getAttribute("data-sim-input")] = Number(control.value);
        }
        send({ kind: "simulation", blockId, inputs });
      }, 250);
    });
  }

  function paint(view) {
    const list = panel.querySelector("[data-room-participants]");
    if (list) {
      list.textContent = "";
      for (const person of view.participants) {
        const li = document.createElement("li");
        li.textContent = person.name;
        list.append(li);
      }
    }
    for (const fieldset of panel.querySelectorAll("[data-room-decision]")) {
      const blockId = fieldset.getAttribute("data-room-decision");
      const votes = view.votes.filter((v) => v.blockId === blockId);
      const count = (choice) => votes.filter((v) => v.choice === choice).length;
      const tally = fieldset.querySelector("[data-room-tally]");
      if (tally) {
        // Labelled rather than "1 / 1 / 0". A bare triple is unreadable at a
        // glance and meaningless to a screen reader announcing the update.
        tally.textContent = [
          tally.getAttribute("data-label-for") + " " + count("for"),
          tally.getAttribute("data-label-against") + " " + count("against"),
          tally.getAttribute("data-label-abstain") + " " + count("abstain"),
        ].join(" · ");
      }
      const comments = fieldset.querySelector("[data-room-comments]");
      if (comments) {
        comments.textContent = "";
        for (const c of view.comments.filter((c) => c.blockId === blockId)) {
          const li = document.createElement("li");
          li.textContent = c.who + ": " + c.text;
          comments.append(li);
        }
      }
    }
    if (view.frozenAt) {
      panel.setAttribute("data-frozen", "true");
      for (const control of panel.querySelectorAll("button, textarea, input")) control.disabled = true;
    }
  }

  const events = new EventSource("/events?t=" + encodeURIComponent(token));
  events.addEventListener("message", (event) => {
    try { paint(JSON.parse(event.data)); } catch {}
  });
  events.addEventListener("error", () => say("…"));
})();`;
}

/**
 * Injects the panel into a finished document. String splicing rather than a
 * second render pass: the document is already validated, hashed, and known
 * good, and re-rendering it through a different path would mean the room and
 * the snapshot could drift.
 */
export function buildRoomDocument(html: string, spec: FormaSpec): string {
  const panel = buildRoomPanelHtml(spec);
  const css = buildRoomPanelCss();
  const script = buildRoomClientScript();
  const withCss = html.replace("</head>", `<style>${css}</style>\n</head>`);
  return withCss.replace(
    "</body>",
    `${panel}\n<script type="module">${script}</script>\n</body>`,
  );
}
