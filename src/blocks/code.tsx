/**
 * Code blocks. Both break out past the reading measure: source lines and
 * diff hunks have their own natural width, and wrapping them to prose
 * measure turns every other line into a continuation.
 *
 * Both do their real work in `prepare`. Shiki is async and diff parsing is
 * pure but non-trivial, and neither belongs inside a synchronous React tree.
 */
import { Fragment } from "react";
import { z } from "zod";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { highlightLines } from "../renderer/highlight.js";
import { parseUnifiedDiff, renderDiffHunksHtml, type DiffHunkView } from "../renderer/diff-view.js";
import { defineBlock } from "./types.js";
import { Section, SourceNotes } from "./primitives.js";

const annotatedCode = defineBlock({
  type: "annotated-code",
  category: "code",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail", "evidence", "procedure"],
  schema: BlockBase.extend({
    type: z.literal("annotated-code"),
    title: z.string().optional(),
    language: z.string().min(1),
    code: z.string(),
    highlightLines: z.array(z.number().int().positive()).default([]),
    annotations: z
      .array(z.object({ line: z.number().int().positive(), text: z.string().min(1) }))
      .default([]),
  }),
  async prepare(block) {
    return highlightLines(block.code, block.language);
  },
  Component({ block, ctx, prepared }) {
    const highlighted = new Set(block.highlightLines);
    const hasNotes = block.annotations.length > 0;
    return (
      <Section id={block.id} className="blk-code breakout">
        {block.title ? <h2 className="blk-code__title">{block.title}</h2> : null}
        <div className="blk-code__frame" data-has-notes={String(hasNotes)}>
          <div className="blk-code__scroll">
            <pre>
              <ol className="blk-code__lines">
                {prepared.map((line, i) => (
                  <li
                    key={i}
                    className="blk-code__line"
                    data-highlight={String(highlighted.has(i + 1))}
                    // Shiki output is generated markup, not user text; it is
                    // sanitized downstream with the rest of the document.
                    dangerouslySetInnerHTML={{ __html: line.html }}
                  />
                ))}
              </ol>
            </pre>
          </div>
          {hasNotes ? (
            <dl className="blk-code__notes">
              {block.annotations.map((annotation, i) => (
                <Fragment key={i}>
                  <dt>L{annotation.line}</dt>
                  <dd>{annotation.text}</dd>
                </Fragment>
              ))}
            </dl>
          ) : null}
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const diff = defineBlock({
  type: "diff",
  category: "code",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["evidence", "detail"],
  schema: BlockBase.extend({
    type: z.literal("diff"),
    title: z.string().optional(),
    language: z.string().optional(),
    unifiedDiff: z.string().min(1),
  }),
  async prepare(block): Promise<DiffHunkView[]> {
    return parseUnifiedDiff(block.unifiedDiff);
  },
  Component({ block, ctx, prepared }) {
    return (
      <Section id={block.id} className="blk-diff breakout">
        {block.title ? <h2 className="blk-diff__title">{block.title}</h2> : null}
        <div
          className="blk-diff__frame"
          dangerouslySetInnerHTML={{ __html: renderDiffHunksHtml(prepared) }}
        />
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

export const codeBlocks = [annotatedCode, diff] as const;
