/**
 * Renders a unified diff (as produced by `git diff`) into the semantic
 * before/after markup used by the `diff` block. Uses the `diff` package's
 * lenient unified-diff parser, then walks each hunk to assign old/new line
 * numbers per row.
 */
import { parsePatch } from "diff";
import { escapeHtml } from "../security/sanitize.js";

export interface DiffRow {
  op: "add" | "del" | "context";
  oldLine: number | null;
  newLine: number | null;
  text: string;
}

export interface DiffHunkView {
  header: string;
  rows: DiffRow[];
}

export function parseUnifiedDiff(unifiedDiff: string): DiffHunkView[] {
  const files = parsePatch(unifiedDiff);
  const hunks: DiffHunkView[] = [];

  for (const file of files) {
    for (const hunk of file.hunks) {
      let oldLine = hunk.oldStart;
      let newLine = hunk.newStart;
      const rows: DiffRow[] = [];
      for (const rawLine of hunk.lines) {
        const marker = rawLine.charAt(0);
        const text = rawLine.slice(1);
        if (marker === "-") {
          rows.push({ op: "del", oldLine, newLine: null, text });
          oldLine += 1;
        } else if (marker === "+") {
          rows.push({ op: "add", oldLine: null, newLine, text });
          newLine += 1;
        } else {
          rows.push({ op: "context", oldLine, newLine, text });
          oldLine += 1;
          newLine += 1;
        }
      }
      hunks.push({
        header: `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
        rows,
      });
    }
  }
  return hunks;
}

export function renderDiffHunksHtml(hunks: DiffHunkView[]): string {
  return hunks
    .map((hunk) => {
      const rowsHtml = hunk.rows
        .map((row) => {
          const oldCell = row.oldLine ?? "";
          const newCell = row.newLine ?? "";
          return `<div class="blk-diff__row" data-op="${row.op}">
            <span class="blk-diff__ln">${oldCell}</span>
            <span class="blk-diff__ln">${newCell}</span>
            <span class="blk-diff__code">${escapeHtml(row.text) || "&nbsp;"}</span>
          </div>`;
        })
        .join("");
      return `<div class="blk-diff__hunk"><div class="blk-diff__hunk-header">${escapeHtml(hunk.header)}</div>${rowsHtml}</div>`;
    })
    .join("");
}
