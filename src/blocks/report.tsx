/**
 * Report blocks — the Editorial Brief vocabulary.
 *
 * These exist because the generic document blocks cannot express the thing a
 * report is judged on: whether a claim is actually supported. A `prose`
 * block can *say* "the release is safe"; a `headline-finding` has to name
 * the claim, point at the evidence, and declare its confidence, which is
 * what lets `forma validate` reject a `verified` claim with nothing behind
 * it.
 *
 * `advanced` reuses this vocabulary — a Decision Room is a report the reader
 * can argue with — so most blocks are offered to both artifacts.
 */
import { Fragment } from "react";
import { z } from "zod";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { defineBlock } from "./types.js";
import { LEVEL_LABEL, REPORT_LABEL } from "./strings.js";
import {
  ConfidenceTag,
  InlineMarkdown,
  Measure,
  Section,
  SourceNotes,
} from "./primitives.js";

const REPORT_AND_ADVANCED = ["report", "advanced"] as const;

/**
 * A claim that asserts something and names what backs it.
 *
 * `evidenceRefs` is separate from `sourceRefs` on purpose. `sourceRefs`
 * answers "where did this text come from"; `evidenceRefs` answers "what
 * would I check to falsify this". A block can cite a source it merely
 * paraphrases without claiming that source proves anything.
 */
const ClaimFields = {
  claimId: z.string().min(1).optional(),
  evidenceRefs: z.array(z.string()).default([]),
};

const thesis = defineBlock({
  type: "thesis",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["thesis"],
  navTitle: (block) => block.statement,
  schema: BlockBase.extend({
    type: z.literal("thesis"),
    statement: z.string().min(1),
    qualifier: z.string().optional(),
    ...ClaimFields,
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-thesis">
        <Measure>
          <p className="blk-thesis__statement">
            {block.statement}
            <ConfidenceTag block={block} ctx={ctx} />
          </p>
          {block.qualifier ? <p className="blk-thesis__qualifier">{block.qualifier}</p> : null}
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const executiveSummary = defineBlock({
  type: "executive-summary",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["summary", "brief"],
  navTitle: (block, language) => block.title ?? REPORT_LABEL[language].executiveSummary,
  schema: BlockBase.extend({
    type: z.literal("executive-summary"),
    title: z.string().optional(),
    body: z.string().min(1),
    /** Two to four numbers a manager repeats in the next meeting. */
    figures: z
      .array(z.object({ label: z.string().min(1), value: z.string().min(1) }))
      .default([]),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-exec-summary">
        <Measure>
          <h2 className="blk-exec-summary__title">
            {block.title ?? REPORT_LABEL[ctx.language].executiveSummary}
            <ConfidenceTag block={block} ctx={ctx} />
          </h2>
          <InlineMarkdown className="blk-exec-summary__body" text={block.body} />
          {block.figures.length > 0 ? (
            <dl className="blk-exec-summary__figures">
              {block.figures.map((figure, i) => (
                // Grouped in a div rather than a bare dt/dd pair: as
                // separate flex items the label and its value wrapped to
                // different lines, so "예상 해결 기간" sat on one row and
                // "1주" on the next.
                <div key={i} className="blk-exec-summary__figure">
                  <dt>{figure.label}</dt>
                  <dd>{figure.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const headlineFinding = defineBlock({
  type: "headline-finding",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["finding"],
  navTitle: (block) => block.claim,
  schema: BlockBase.extend({
    type: z.literal("headline-finding"),
    /** Written as a complete claim, not a topic label. */
    claim: z.string().min(1),
    detail: z.string().min(1),
    severity: z.enum(["info", "low", "medium", "high", "critical"]).default("info"),
    ...ClaimFields,
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-headline-finding">
        <Measure>
          <div data-severity={block.severity}>
            <h3 className="blk-headline-finding__claim">{block.claim}</h3>
            <p className="blk-headline-finding__meta">
              <ConfidenceTag block={block} ctx={ctx} />
            </p>
            <InlineMarkdown className="blk-headline-finding__detail" text={block.detail} />
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const evidenceStack = defineBlock({
  type: "evidence-stack",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["evidence"],
  schema: BlockBase.extend({
    type: z.literal("evidence-stack"),
    title: z.string().optional(),
    /** Which claim this stack supports, so the link is machine-checkable. */
    supports: z.string().min(1).optional(),
    items: z
      .array(
        z.object({
          summary: z.string().min(1),
          detail: z.string().optional(),
          confidence: z.enum(["verified", "inferred", "unknown"]).default("inferred"),
          sourceRef: z.string().optional(),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-evidence-stack">
        <Measure>
          <h3 className="blk-evidence-stack__title">{block.title ?? labels.evidence}</h3>
          <ol className="blk-evidence-stack__list">
            {block.items.map((item, i) => (
              <li key={i} className="blk-evidence-stack__item" data-confidence={item.confidence}>
                <p className="blk-evidence-stack__summary">{item.summary}</p>
                {item.detail ? (
                  <p className="blk-evidence-stack__detail">{item.detail}</p>
                ) : null}
                {item.sourceRef ? (
                  <p className="blk-evidence-stack__source">
                    {ctx.sourcesById.get(item.sourceRef)?.label ?? item.sourceRef}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const optionComparison = defineBlock({
  type: "option-comparison",
  category: "data",
  capabilities: ["breakout"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["alternatives"],
  schema: BlockBase.extend({
    type: z.literal("option-comparison"),
    title: z.string().optional(),
    criteria: z.array(z.string().min(1)).min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          /** One cell per criterion, keyed by the criterion string. */
          cells: z.record(z.string(), z.string()),
          recommended: z.boolean().default(false),
        }),
      )
      .min(2),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-option-comparison breakout">
        {block.title ? <h3 className="blk-option-comparison__title">{block.title}</h3> : null}
        <div className="blk-option-comparison__scroll">
          <table className="blk-option-comparison__table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">{labels.option}</span>
                </th>
                {block.options.map((option) => (
                  <th key={option.id} scope="col" data-recommended={String(option.recommended)}>
                    {option.label}
                    {option.recommended ? (
                      <span className="blk-option-comparison__flag">{labels.recommended}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.criteria.map((criterion) => (
                <tr key={criterion}>
                  <th scope="row">{criterion}</th>
                  {block.options.map((option) => (
                    <td key={option.id} data-recommended={String(option.recommended)}>
                      {option.cells[criterion] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const recommendation = defineBlock({
  type: "recommendation",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["recommendation"],
  navTitle: (block) => block.statement,
  schema: BlockBase.extend({
    type: z.literal("recommendation"),
    statement: z.string().min(1),
    rationale: z.string().min(1),
    /** What would make this recommendation wrong. */
    conditions: z.array(z.string().min(1)).default([]),
    ...ClaimFields,
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-recommendation">
        <Measure>
          <p className="blk-recommendation__label">
            {labels.recommendation}
            <ConfidenceTag block={block} ctx={ctx} />
          </p>
          <h3 className="blk-recommendation__statement">{block.statement}</h3>
          <InlineMarkdown className="blk-recommendation__rationale" text={block.rationale} />
          {block.conditions.length > 0 ? (
            <>
              <p className="blk-recommendation__conditions-label">{labels.reversalConditions}</p>
              <ul className="blk-recommendation__conditions">
                {block.conditions.map((condition, i) => (
                  <li key={i}>{condition}</li>
                ))}
              </ul>
            </>
          ) : null}
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const implication = defineBlock({
  type: "implication",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["detail"],
  navTitle: (block, language) => block.title ?? REPORT_LABEL[language].implications,
  schema: BlockBase.extend({
    type: z.literal("implication"),
    title: z.string().optional(),
    /** Who this lands on, and what changes for them. */
    entries: z
      .array(z.object({ audience: z.string().min(1), effect: z.string().min(1) }))
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-implication">
        <Measure>
          <h3 className="blk-implication__title">{block.title ?? labels.implications}</h3>
          <dl className="blk-implication__list">
            {block.entries.map((entry, i) => (
              <Fragment key={i}>
                <dt>{entry.audience}</dt>
                <dd>{entry.effect}</dd>
              </Fragment>
            ))}
          </dl>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const riskRegister = defineBlock({
  type: "risk-register",
  category: "decision",
  capabilities: ["breakout"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["risk"],
  navTitle: (block, language) => block.title ?? REPORT_LABEL[language].risks,
  schema: BlockBase.extend({
    type: z.literal("risk-register"),
    title: z.string().optional(),
    risks: z
      .array(
        z.object({
          id: z.string().min(1),
          description: z.string().min(1),
          likelihood: z.enum(["low", "medium", "high"]),
          impact: z.enum(["low", "medium", "high"]),
          mitigation: z.string().min(1),
          owner: z.string().optional(),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    const level = LEVEL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-risk-register breakout">
        <h3 className="blk-risk-register__title">{block.title ?? labels.risks}</h3>
        <div className="blk-risk-register__scroll">
          <table className="blk-risk-register__table">
            <thead>
              <tr>
                <th scope="col">{labels.risk}</th>
                <th scope="col">{labels.likelihood}</th>
                <th scope="col">{labels.impact}</th>
                <th scope="col">{labels.mitigation}</th>
                <th scope="col">{labels.owner}</th>
              </tr>
            </thead>
            <tbody>
              {block.risks.map((risk) => (
                <tr key={risk.id} data-likelihood={risk.likelihood} data-impact={risk.impact}>
                  <th scope="row">{risk.description}</th>
                  <td>{level[risk.likelihood] ?? risk.likelihood}</td>
                  <td>{level[risk.impact] ?? risk.impact}</td>
                  <td>{risk.mitigation}</td>
                  <td>{risk.owner ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const actionPlan = defineBlock({
  type: "action-plan",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["action"],
  navTitle: (block, language) => block.title ?? REPORT_LABEL[language].actions,
  schema: BlockBase.extend({
    type: z.literal("action-plan"),
    title: z.string().optional(),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          owner: z.string().min(1),
          due: z.string().optional(),
          blocking: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-action-plan">
        <Measure>
          <h3 className="blk-action-plan__title">{block.title ?? labels.actions}</h3>
          <ol className="blk-action-plan__list">
            {block.items.map((item) => (
              <li key={item.id} className="blk-action-plan__item" data-blocking={String(item.blocking)}>
                <span className="blk-action-plan__label">{item.label}</span>
                <span className="blk-action-plan__owner">
                  {[item.owner, item.due].filter(Boolean).join(" · ")}
                </span>
                {item.blocking ? (
                  <span className="blk-action-plan__flag">{labels.blocking}</span>
                ) : null}
              </li>
            ))}
          </ol>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const pullQuote = defineBlock({
  type: "pull-quote",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  schema: BlockBase.extend({
    type: z.literal("pull-quote"),
    quote: z.string().min(1),
    attribution: z.string().optional(),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-pull-quote">
        <Measure>
          <blockquote className="blk-pull-quote__quote">
            <p>{block.quote}</p>
            {block.attribution ? <cite>{block.attribution}</cite> : null}
          </blockquote>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const figure = defineBlock({
  type: "figure",
  category: "data",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["evidence", "detail"],
  schema: BlockBase.extend({
    type: z.literal("figure"),
    /** A figure without a caption is a decoration; the caption is required. */
    caption: z.string().min(1),
    /** Reference to the block this figure illustrates. */
    of: z.string().min(1).optional(),
    /** What the reader should conclude, so the figure is not left to speak for itself. */
    reading: z.string().optional(),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-figure breakout">
        <figure className="blk-figure__frame">
          <figcaption className="blk-figure__caption">{block.caption}</figcaption>
          {block.reading ? <p className="blk-figure__reading">{block.reading}</p> : null}
        </figure>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const appendix = defineBlock({
  type: "appendix",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["reference"],
  schema: BlockBase.extend({
    type: z.literal("appendix"),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-appendix">
        <Measure>
          <h3 className="blk-appendix__title">{block.title}</h3>
          <InlineMarkdown className="blk-appendix__body" text={block.body} />
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const sourceLedger = defineBlock({
  type: "source-ledger",
  category: "document",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["provenance"],
  navTitle: (block, language) => block.title ?? REPORT_LABEL[language].sourceLedger,
  schema: BlockBase.extend({
    type: z.literal("source-ledger"),
    title: z.string().optional(),
    /** Per-source notes: what it covers and what it does not. */
    entries: z
      .array(
        z.object({
          sourceRef: z.string().min(1),
          covers: z.string().min(1),
          limits: z.string().optional(),
        }),
      )
      .default([]),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    // Falls back to every source in the spec, matching `source-note`: a
    // ledger with no entries is still meant to close the document.
    const entries =
      block.entries.length > 0
        ? block.entries
        : Array.from(ctx.sourcesById.keys()).map((sourceRef) => ({
            sourceRef,
            covers: "",
            limits: undefined as string | undefined,
          }));
    return (
      <Section id={block.id} className="blk-source-ledger breakout">
        <h3 className="blk-source-ledger__title">{block.title ?? labels.sourceLedger}</h3>
        <div className="blk-source-ledger__scroll">
          <table className="blk-source-ledger__table">
            <thead>
              <tr>
                <th scope="col">{labels.source}</th>
                <th scope="col">{labels.covers}</th>
                <th scope="col">{labels.limits}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const source = ctx.sourcesById.get(entry.sourceRef);
                return (
                  <tr key={entry.sourceRef}>
                    <th scope="row">{source?.label ?? entry.sourceRef}</th>
                    <td>{entry.covers || "—"}</td>
                    <td>{entry.limits ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    );
  },
});

const decisionMatrix = defineBlock({
  type: "decision-matrix",
  category: "decision",
  capabilities: ["breakout", "numeric"],
  supportedArtifacts: REPORT_AND_ADVANCED,
  roles: ["alternatives", "decision"],
  schema: BlockBase.extend({
    type: z.literal("decision-matrix"),
    title: z.string().optional(),
    /** Weights are declared, not implied, so the total can be audited. */
    criteria: z
      .array(z.object({ id: z.string().min(1), label: z.string().min(1), weight: z.number().positive() }))
      .min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          /** Raw scores keyed by criterion id; the weighted total is computed, never authored. */
          scores: z.record(z.string(), z.number()),
        }),
      )
      .min(2),
    chosen: z.string().min(1).optional(),
  }),
  Component({ block, ctx }) {
    const labels = REPORT_LABEL[ctx.language];
    // Computing the total here rather than trusting an authored one is the
    // point of the block: a matrix whose arithmetic disagrees with its
    // conclusion is the classic way a decision doc launders a preference.
    const totals = new Map(
      block.options.map((option) => [
        option.id,
        block.criteria.reduce(
          (sum, criterion) => sum + (option.scores[criterion.id] ?? 0) * criterion.weight,
          0,
        ),
      ]),
    );
    const best = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return (
      <Section id={block.id} className="blk-decision-matrix breakout">
        <h3 className="blk-decision-matrix__title">{block.title ?? labels.decisionMatrix}</h3>
        <div className="blk-decision-matrix__scroll">
          <table className="blk-decision-matrix__table">
            <thead>
              <tr>
                <th scope="col">{labels.criterion}</th>
                <th scope="col">{labels.weight}</th>
                {block.options.map((option) => (
                  <th key={option.id} scope="col" data-chosen={String(option.id === block.chosen)}>
                    {option.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.criteria.map((criterion) => (
                <tr key={criterion.id}>
                  <th scope="row">{criterion.label}</th>
                  <td className="blk-decision-matrix__weight">{criterion.weight}</td>
                  {block.options.map((option) => (
                    <td key={option.id} className="blk-decision-matrix__score">
                      {option.scores[criterion.id] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{labels.total}</th>
                <td />
                {block.options.map((option) => (
                  <td
                    key={option.id}
                    className="blk-decision-matrix__total"
                    data-best={String(option.id === best)}
                  >
                    {(totals.get(option.id) ?? 0).toFixed(1)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
        {block.chosen && block.chosen !== best ? (
          <p className="blk-decision-matrix__override">{labels.scoreOverride}</p>
        ) : null}
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

export const reportBlocks = [
  thesis,
  executiveSummary,
  headlineFinding,
  evidenceStack,
  optionComparison,
  decisionMatrix,
  recommendation,
  implication,
  riskRegister,
  actionPlan,
  pullQuote,
  figure,
  appendix,
  sourceLedger,
] as const;
