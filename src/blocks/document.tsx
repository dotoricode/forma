/**
 * Document blocks: prose-width text that carries the narrative. These are
 * available to every artifact — a dashboard still needs a status header's
 * worth of words, and a manual still explains before it instructs.
 */
import { Fragment } from "react";
import { z } from "zod";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { defineBlock } from "./types.js";
import {
  ConfidenceTag,
  InlineMarkdown,
  Measure,
  Section,
  SourceListItem,
  SourceNotes,
} from "./primitives.js";

const cover = defineBlock({
  type: "cover",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["opening"],
  schema: BlockBase.extend({
    type: z.literal("cover"),
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    meta: z.array(z.string()).default([]),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-cover">
        {block.eyebrow ? <p className="blk-cover__eyebrow">{block.eyebrow}</p> : null}
        <h1 className="blk-cover__title">{block.title}</h1>
        {block.subtitle ? <p className="blk-cover__subtitle">{block.subtitle}</p> : null}
        {block.meta.length > 0 ? (
          <ul className="blk-cover__meta">
            {block.meta.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        ) : null}
        <ConfidenceTag block={block} ctx={ctx} />
      </Section>
    );
  },
});

const summary = defineBlock({
  type: "summary",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["summary"],
  schema: BlockBase.extend({
    type: z.literal("summary"),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-summary">
        <Measure>
          <h2 className="blk-summary__title">
            {block.title}
            <ConfidenceTag block={block} ctx={ctx} />
          </h2>
          <InlineMarkdown className="blk-summary__body" text={block.body} />
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const prose = defineBlock({
  type: "prose",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail"],
  schema: BlockBase.extend({
    type: z.literal("prose"),
    title: z.string().optional(),
    body: z.string().min(1),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-prose">
        <Measure>
          {block.title ? <h2 className="blk-prose__title">{block.title}</h2> : null}
          <InlineMarkdown className="blk-prose__body" text={block.body} />
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const keyPoints = defineBlock({
  type: "key-points",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["summary", "detail"],
  schema: BlockBase.extend({
    type: z.literal("key-points"),
    title: z.string().optional(),
    points: z.array(z.string().min(1)).min(1),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-key-points">
        {block.title ? <h2 className="blk-key-points__title">{block.title}</h2> : null}
        <ol>
          {block.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ol>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const glossary = defineBlock({
  type: "glossary",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["reference"],
  schema: BlockBase.extend({
    type: z.literal("glossary"),
    title: z.string().optional(),
    terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).min(1),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-glossary">
        {block.title ? <h2 className="blk-glossary__title">{block.title}</h2> : null}
        <dl>
          {block.terms.map((entry, i) => (
            <Fragment key={i}>
              <dt>{entry.term}</dt>
              <dd>{entry.definition}</dd>
            </Fragment>
          ))}
        </dl>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const sourceNote = defineBlock({
  type: "source-note",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["provenance"],
  schema: BlockBase.extend({
    type: z.literal("source-note"),
    title: z.string().optional(),
  }),
  Component({ block, ctx }) {
    // A standalone source-note with no sourceRefs of its own is meant as the
    // document's closing bibliography — list every source in the spec rather
    // than rendering an empty (but still TOC-linked) section.
    const ownRefs = block.sourceRefs ?? [];
    const ids = ownRefs.length > 0 ? ownRefs : Array.from(ctx.sourcesById.keys());
    return (
      <Section id={block.id} className="blk-source-note">
        <Measure>
          {block.title ? <h2 className="blk-source-note__title">{block.title}</h2> : null}
          {ownRefs.length > 0 ? (
            <SourceNotes block={block} ctx={ctx} />
          ) : ids.length > 0 ? (
            <ul>
              {ids.map((id) => (
                <SourceListItem key={id} id={id} ctx={ctx} />
              ))}
            </ul>
          ) : null}
        </Measure>
      </Section>
    );
  },
});

export const documentBlocks = [cover, summary, prose, keyPoints, glossary, sourceNote] as const;
