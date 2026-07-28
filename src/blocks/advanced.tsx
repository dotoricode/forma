/**
 * Decision Room blocks.
 *
 * What separates `advanced` from a report is that the reader argues with it
 * and an outcome is recorded. So the vocabulary is about the shape of an
 * argument: which claim rests on which evidence, what the strongest
 * objection is, what happens if an assumption moves, and what was decided.
 *
 * Nothing here calls a model at read time. The counter-argument is authored
 * into the spec at build time, and the simulator evaluates a closed
 * arithmetic AST. A Decision Room that phoned an API would break the
 * confidentiality guarantee that makes it usable on internal material at
 * all.
 */
import { Fragment } from "react";
import { z } from "zod";
import { BlockBase } from "../spec/source.js";
import { FormulaNodeSchema, evaluateFormula, formulaToJson, variablesOf } from "../spec/formula.js";
import { defineBlock } from "./types.js";
import { ADVANCED_LABEL } from "./strings.js";
import { InlineMarkdown, Measure, Section, SourceNotes } from "./primitives.js";

const ADVANCED_ONLY = ["advanced"] as const;

const brief = defineBlock({
  type: "brief",
  category: "advanced",
  capabilities: ["measure"],
  supportedArtifacts: ADVANCED_ONLY,
  roles: ["brief", "opening"],
  navTitle: (block, language) => block.title ?? ADVANCED_LABEL[language].brief,
  schema: BlockBase.extend({
    type: z.literal("brief"),
    title: z.string().optional(),
    /** What the room is deciding today, in one sentence. */
    question: z.string().min(1),
    summary: z.string().min(1),
    decideToday: z.array(z.string().min(1)).min(1),
    /** Saying what is still unknown is what stops a room deciding on air. */
    stillUnknown: z.array(z.string().min(1)).default([]),
  }),
  Component({ block, ctx }) {
    const labels = ADVANCED_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-brief">
        <Measure>
          <h1 className="blk-brief__question">{block.question}</h1>
          <InlineMarkdown className="blk-brief__summary" text={block.summary} />
          <h2 className="blk-brief__heading">{labels.decideToday}</h2>
          <ol className="blk-brief__list">
            {block.decideToday.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
          {block.stillUnknown.length > 0 ? (
            <>
              <h2 className="blk-brief__heading">{labels.stillUnknown}</h2>
              <ul className="blk-brief__list" data-tone="unknown">
                {block.stillUnknown.map((item, i) => (
                  <li key={i}>{item}</li>
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

const evidenceGraph = defineBlock({
  type: "evidence-graph",
  category: "advanced",
  capabilities: ["breakout"],
  supportedArtifacts: ADVANCED_ONLY,
  roles: ["evidence-graph", "evidence"],
  navTitle: (block, language) => block.title ?? ADVANCED_LABEL[language].evidenceGraph,
  schema: BlockBase.extend({
    type: z.literal("evidence-graph"),
    title: z.string().optional(),
    claims: z
      .array(
        z.object({
          id: z.string().min(1),
          statement: z.string().min(1),
          confidence: z.enum(["verified", "inferred", "unknown"]),
          /** How much rests on this claim being true. */
          impact: z.enum(["low", "medium", "high"]),
          supportedBy: z.array(z.string()).default([]),
          contradictedBy: z.array(z.string()).default([]),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = ADVANCED_LABEL[ctx.language];
    const sourceLabel = (id: string) => ctx.sourcesById.get(id)?.label ?? id;
    // High impact plus weak confidence is the pair worth checking first;
    // ordering by it puts the room's real exposure at the top instead of
    // leaving it to be noticed.
    const rank = (impact: string, confidence: string) =>
      (impact === "high" ? 2 : impact === "medium" ? 1 : 0) * 2 +
      (confidence === "unknown" ? 2 : confidence === "inferred" ? 1 : 0);
    const ordered = [...block.claims].sort(
      (a, b) => rank(b.impact, b.confidence) - rank(a.impact, a.confidence),
    );
    return (
      <Section id={block.id} className="blk-evidence-graph breakout">
        <h2 className="blk-evidence-graph__title">{block.title ?? labels.evidenceGraph}</h2>
        <p className="blk-evidence-graph__legend">{labels.graphLegend}</p>
        <ol className="blk-evidence-graph__claims">
          {ordered.map((claim) => (
            <li
              key={claim.id}
              className="claim"
              data-confidence={claim.confidence}
              data-impact={claim.impact}
              id={`claim-${claim.id}`}
            >
              <p className="claim__meta">
                {labels.confidence[claim.confidence]} · {labels.impact[claim.impact]}
              </p>
              <p className="claim__statement">{claim.statement}</p>
              {claim.supportedBy.length > 0 ? (
                <p className="claim__support">
                  <span>{labels.supportedBy}</span>{" "}
                  {claim.supportedBy.map(sourceLabel).join(", ")}
                </p>
              ) : (
                <p className="claim__support" data-empty="true">
                  {labels.noSupport}
                </p>
              )}
              {claim.contradictedBy.length > 0 ? (
                <p className="claim__contradiction">
                  <span>{labels.contradictedBy}</span>{" "}
                  {claim.contradictedBy.map(sourceLabel).join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const challenge = defineBlock({
  type: "challenge",
  category: "advanced",
  capabilities: ["measure"],
  supportedArtifacts: ADVANCED_ONLY,
  roles: ["risk"],
  navTitle: (block, language) => block.title ?? ADVANCED_LABEL[language].challenge,
  schema: BlockBase.extend({
    type: z.literal("challenge"),
    title: z.string().optional(),
    /** Authored at build time. Nothing calls a model while the room is open. */
    strongestCounterargument: z.string().min(1),
    unprovenAssumptions: z.array(z.string().min(1)).default([]),
    failureConditions: z.array(z.string().min(1)).default([]),
    reversalTriggers: z.array(z.string().min(1)).default([]),
  }),
  Component({ block, ctx }) {
    const labels = ADVANCED_LABEL[ctx.language];
    const List = (props: { heading: string; items: string[] }) =>
      props.items.length === 0 ? (
        <></>
      ) : (
        <>
          <h3 className="blk-challenge__heading">{props.heading}</h3>
          <ul className="blk-challenge__list">
            {props.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      );
    return (
      <Section id={block.id} className="blk-challenge">
        <Measure>
          <h2 className="blk-challenge__title">{block.title ?? labels.challenge}</h2>
          <blockquote className="blk-challenge__counter">
            {block.strongestCounterargument}
          </blockquote>
          <List heading={labels.unprovenAssumptions} items={block.unprovenAssumptions} />
          <List heading={labels.failureConditions} items={block.failureConditions} />
          <List heading={labels.reversalTriggers} items={block.reversalTriggers} />
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const simulation = defineBlock({
  type: "simulation",
  category: "advanced",
  capabilities: ["measure", "interactive", "numeric"],
  supportedArtifacts: ADVANCED_ONLY,
  roles: ["simulation"],
  navTitle: (block, language) => block.title ?? ADVANCED_LABEL[language].simulation,
  schema: BlockBase.extend({
    type: z.literal("simulation"),
    title: z.string().optional(),
    description: z.string().optional(),
    inputs: z
      .array(
        z.object({
          name: z.string().min(1),
          label: z.string().min(1),
          value: z.number(),
          min: z.number(),
          max: z.number(),
          step: z.number().positive().default(1),
          unit: z.string().optional(),
        }),
      )
      .min(1),
    outputs: z
      .array(
        z.object({
          label: z.string().min(1),
          formula: FormulaNodeSchema,
          unit: z.string().optional(),
          /** Decimal places, so a currency and a rate can share one block. */
          precision: z.number().int().min(0).max(6).default(2),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = ADVANCED_LABEL[ctx.language];
    const defaults = Object.fromEntries(block.inputs.map((input) => [input.name, input.value]));
    return (
      <Section id={block.id} className="blk-simulation">
        <Measure>
          <h2 className="blk-simulation__title">{block.title ?? labels.simulation}</h2>
          {block.description ? (
            <p className="blk-simulation__description">{block.description}</p>
          ) : null}
          <div className="blk-simulation__panel" data-forma-simulation>
            <div className="blk-simulation__inputs">
              {block.inputs.map((input) => (
                <label key={input.name} className="sim-input">
                  <span className="sim-input__label">
                    {input.label}
                    {input.unit ? <span className="sim-input__unit">{input.unit}</span> : null}
                  </span>
                  <input
                    type="range"
                    name={input.name}
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    defaultValue={input.value}
                    data-sim-input={input.name}
                  />
                  <output className="sim-input__value" data-sim-echo={input.name}>
                    {input.value}
                  </output>
                </label>
              ))}
            </div>
            <dl className="blk-simulation__outputs">
              {block.outputs.map((out, i) => (
                <Fragment key={i}>
                  <dt>{out.label}</dt>
                  <dd
                    data-sim-output={formulaToJson(out.formula)}
                    data-sim-precision={out.precision}
                    data-sim-unit={out.unit ?? ""}
                  >
                    {/* Computed here as well as in the island so the value
                        a reader sees before touching a control is Forma's
                        own, not a second implementation's. */}
                    {evaluateFormula(out.formula, defaults).toFixed(out.precision)}
                    {out.unit ?? ""}
                  </dd>
                </Fragment>
              ))}
            </dl>
            <p className="blk-simulation__fallback">{labels.simulationFallback}</p>
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const decisionRecord = defineBlock({
  type: "decision-record",
  category: "advanced",
  capabilities: ["measure"],
  supportedArtifacts: ADVANCED_ONLY,
  roles: ["decision", "action"],
  navTitle: (block, language) => block.title ?? ADVANCED_LABEL[language].decision,
  schema: BlockBase.extend({
    type: z.literal("decision-record"),
    title: z.string().optional(),
    decision: z.string().min(1),
    /** A decision with no owner is a wish. */
    owner: z.string().min(1),
    due: z.string().optional(),
    rationale: z.string().min(1),
    /** Recording the objection is what makes the record honest a year later. */
    dissent: z.array(z.object({ who: z.string().min(1), objection: z.string().min(1) })).default([]),
    revisitWhen: z.array(z.string().min(1)).default([]),
    status: z.enum(["proposed", "decided", "deferred"]).default("proposed"),
  }),
  Component({ block, ctx }) {
    const labels = ADVANCED_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-decision-record">
        <Measure>
          <div className="decision-record" data-status={block.status}>
            <p className="decision-record__status">{labels.decisionStatus[block.status]}</p>
            <h2 className="decision-record__decision">{block.decision}</h2>
            <InlineMarkdown className="decision-record__rationale" text={block.rationale} />
            <dl className="decision-record__meta">
              <div>
                <dt>{labels.owner}</dt>
                <dd>{block.owner}</dd>
              </div>
              {block.due ? (
                <div>
                  <dt>{labels.due}</dt>
                  <dd>{block.due}</dd>
                </div>
              ) : null}
            </dl>
            {block.dissent.length > 0 ? (
              <>
                <h3 className="decision-record__heading">{labels.dissent}</h3>
                <dl className="decision-record__dissent">
                  {block.dissent.map((entry, i) => (
                    <Fragment key={i}>
                      <dt>{entry.who}</dt>
                      <dd>{entry.objection}</dd>
                    </Fragment>
                  ))}
                </dl>
              </>
            ) : null}
            {block.revisitWhen.length > 0 ? (
              <>
                <h3 className="decision-record__heading">{labels.revisitWhen}</h3>
                <ul className="decision-record__revisit">
                  {block.revisitWhen.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

export const advancedBlocks = [
  brief,
  evidenceGraph,
  challenge,
  simulation,
  decisionRecord,
] as const;

/** Re-exported so the planner can check a simulation's inputs cover its formulas. */
export { variablesOf };
