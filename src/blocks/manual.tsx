/**
 * Manual blocks — the Guided Path vocabulary.
 *
 * The failure a manual has to prevent is a numbered list with no way to
 * tell whether a step worked. `prose` can hold instructions, but nothing in
 * it can be checked; a `step` has to declare what the reader should see
 * afterwards, which is what lets the planner reject a procedure that leaves
 * the reader guessing.
 *
 * Environment branching is data, not prose. A step that only applies to
 * macOS says so in a field, so the reader can filter instead of scanning
 * for "on macOS," in the middle of a paragraph.
 */
import { Fragment } from "react";
import { z } from "zod";
import { BlockBase } from "../spec/source.js";
import { defineBlock } from "./types.js";
import { MANUAL_LABEL } from "./strings.js";
import { InlineMarkdown, Measure, Section, SourceNotes } from "./primitives.js";

const MANUAL_ONLY = ["manual"] as const;
const MANUAL_AND_ADVANCED = ["manual", "advanced"] as const;

/** Environment tags a step or command can be scoped to. Free-form on purpose. */
const EnvironmentTags = z.array(z.string().min(1)).default([]);

function envAttr(environments: readonly string[]): string | undefined {
  return environments.length > 0 ? environments.join(" ") : undefined;
}

const taskMap = defineBlock({
  type: "task-map",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["opening"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].taskMap,
  schema: BlockBase.extend({
    type: z.literal("task-map"),
    title: z.string().optional(),
    /** What the reader can finish, stated as outcomes rather than topics. */
    outcomes: z.array(z.string().min(1)).min(1),
    estimatedMinutes: z.number().int().positive().optional(),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-task-map">
        <Measure>
          <h2 className="blk-task-map__title">{block.title ?? labels.taskMap}</h2>
          <ul className="blk-task-map__outcomes">
            {block.outcomes.map((outcome, i) => (
              <li key={i}>{outcome}</li>
            ))}
          </ul>
          {block.estimatedMinutes ? (
            <p className="blk-task-map__estimate">
              {labels.estimate}: {block.estimatedMinutes}
              {labels.minutes}
            </p>
          ) : null}
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const audienceScope = defineBlock({
  type: "audience-scope",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["scope"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].scope,
  schema: BlockBase.extend({
    type: z.literal("audience-scope"),
    title: z.string().optional(),
    appliesTo: z.array(z.string().min(1)).min(1),
    /** Saying what a document does *not* cover is what stops a reader wasting an hour. */
    doesNotCover: z.array(z.string().min(1)).default([]),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-audience-scope">
        <Measure>
          <h2 className="blk-audience-scope__title">{block.title ?? labels.scope}</h2>
          <div className="blk-audience-scope__grid">
            <div>
              <h3>{labels.appliesTo}</h3>
              <ul>
                {block.appliesTo.map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ul>
            </div>
            {block.doesNotCover.length > 0 ? (
              <div>
                <h3>{labels.doesNotCover}</h3>
                <ul>
                  {block.doesNotCover.map((entry, i) => (
                    <li key={i}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const prerequisite = defineBlock({
  type: "prerequisite",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["prerequisite"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].prerequisites,
  schema: BlockBase.extend({
    type: z.literal("prerequisite"),
    title: z.string().optional(),
    items: z
      .array(
        z.object({
          label: z.string().min(1),
          /** How the reader confirms they already have it. */
          check: z.string().optional(),
          required: z.boolean().default(true),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-prerequisite">
        <Measure>
          <h2 className="blk-prerequisite__title">{block.title ?? labels.prerequisites}</h2>
          <ul className="blk-prerequisite__list">
            {block.items.map((item, i) => (
              <li key={i} className="blk-prerequisite__item" data-required={String(item.required)}>
                <span className="blk-prerequisite__label">{item.label}</span>
                {item.required ? null : (
                  <span className="blk-prerequisite__optional">{labels.optional}</span>
                )}
                {item.check ? <code className="blk-prerequisite__check">{item.check}</code> : null}
              </li>
            ))}
          </ul>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const environmentSelector = defineBlock({
  type: "environment-selector",
  category: "manual",
  capabilities: ["measure", "interactive"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  navTitle: () => undefined,
  schema: BlockBase.extend({
    type: z.literal("environment-selector"),
    label: z.string().min(1),
    options: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-env-selector no-print">
        <Measure>
          <div
            className="blk-env-selector__control"
            data-forma-env-selector
            role="group"
            aria-label={block.label}
          >
            <span className="blk-env-selector__label">{block.label}</span>
            {block.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="blk-env-selector__option"
                data-env-option={option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          {/* Without JS nothing is filtered, so every step stays visible.
              A manual that hides its own instructions when a script fails
              to run is worse than one that shows all of them. */}
          <p className="blk-env-selector__fallback">{labels.selectorFallback}</p>
        </Measure>
      </Section>
    );
  },
});

const quickPath = defineBlock({
  type: "quick-path",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["quick-path"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].quickPath,
  schema: BlockBase.extend({
    type: z.literal("quick-path"),
    title: z.string().optional(),
    /** For a reader who has done this before and wants the short version. */
    steps: z.array(z.string().min(1)).min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-quick-path">
        <Measure>
          <h2 className="blk-quick-path__title">{block.title ?? labels.quickPath}</h2>
          <ol className="blk-quick-path__list">
            {block.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const CommandSchema = z.object({
  shell: z.string().min(1),
  /** Where this runs. A command with no context is a command run in the wrong place. */
  runIn: z.string().optional(),
  requiresElevation: z.boolean().default(false),
  environments: EnvironmentTags,
});

const step = defineBlock({
  type: "step",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["procedure", "expected-result"],
  navTitle: (block) => `${block.number}. ${block.title}`,
  schema: BlockBase.extend({
    type: z.literal("step"),
    number: z.number().int().positive(),
    title: z.string().min(1),
    instruction: z.string().min(1),
    environments: EnvironmentTags,
    commands: z.array(CommandSchema).default([]),
    substeps: z.array(z.object({ label: z.string().min(1) })).default([]),
    /** What the reader should see when it worked. */
    expectedResult: z.string().optional(),
    /** How to confirm it, when looking is not enough. */
    verification: z.string().optional(),
    /** Where to go when it did not work. */
    onFailure: z.string().optional(),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-step">
        <Measure>
          <div className="blk-step__body" data-environments={envAttr(block.environments)}>
            <h3 className="blk-step__title">
              <span className="blk-step__number">{block.number}</span>
              {block.title}
            </h3>
            <InlineMarkdown className="blk-step__instruction" text={block.instruction} />
            {block.substeps.length > 0 ? (
              <ol className="blk-step__substeps">
                {block.substeps.map((substep, i) => (
                  <li key={i}>{substep.label}</li>
                ))}
              </ol>
            ) : null}
            {block.commands.map((command, i) => (
              <div
                key={i}
                className="blk-step__command"
                data-environments={envAttr(command.environments)}
              >
                <p className="blk-step__command-meta">
                  {[
                    command.runIn,
                    command.requiresElevation ? labels.elevation : undefined,
                    command.environments.join(" / ") || undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {/* A horizontally scrolling region is unreachable by
                    keyboard unless it is focusable, so a keyboard user
                    could not read the end of a long command. */}
                <pre className="blk-step__command-shell" tabIndex={0}>
                  <code>{command.shell}</code>
                </pre>
              </div>
            ))}
            {block.expectedResult ? (
              <div className="blk-step__expected">
                <p className="blk-step__expected-label">{labels.expectedResult}</p>
                <p>{block.expectedResult}</p>
              </div>
            ) : null}
            {block.verification ? (
              <div className="blk-step__verify">
                <p className="blk-step__verify-label">{labels.verify}</p>
                <p>{block.verification}</p>
              </div>
            ) : null}
            {block.onFailure ? (
              <p className="blk-step__failure">
                <span className="blk-step__failure-label">{labels.ifItFails}</span>
                {block.onFailure}
              </p>
            ) : null}
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const checkpoint = defineBlock({
  type: "checkpoint",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["verification"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].checkpoint,
  schema: BlockBase.extend({
    type: z.literal("checkpoint"),
    title: z.string().optional(),
    /** Everything that must be true before the reader continues. */
    conditions: z.array(z.string().min(1)).min(1),
    ifNotMet: z.string().optional(),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-checkpoint">
        <Measure>
          <h3 className="blk-checkpoint__title">{block.title ?? labels.checkpoint}</h3>
          <ul className="blk-checkpoint__list">
            {block.conditions.map((condition, i) => (
              <li key={i}>{condition}</li>
            ))}
          </ul>
          {block.ifNotMet ? (
            <p className="blk-checkpoint__fallback">
              <span className="blk-checkpoint__fallback-label">{labels.ifNotMet}</span>
              {block.ifNotMet}
            </p>
          ) : null}
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const decisionTree = defineBlock({
  type: "decision-tree",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["procedure", "troubleshooting"],
  navTitle: (block) => block.question,
  schema: BlockBase.extend({
    type: z.literal("decision-tree"),
    question: z.string().min(1),
    branches: z
      .array(
        z.object({
          condition: z.string().min(1),
          action: z.string().min(1),
          /** Anchor of the block to continue at, so a branch is navigable. */
          goTo: z.string().optional(),
        }),
      )
      .min(2),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-decision-tree">
        <Measure>
          <h3 className="blk-decision-tree__question">{block.question}</h3>
          <dl className="blk-decision-tree__branches">
            {block.branches.map((branch, i) => (
              <Fragment key={i}>
                <dt>{branch.condition}</dt>
                <dd>
                  {branch.action}
                  {branch.goTo ? (
                    <>
                      {" "}
                      <a href={`#${branch.goTo}`}>→</a>
                    </>
                  ) : null}
                </dd>
              </Fragment>
            ))}
          </dl>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const troubleshooting = defineBlock({
  type: "troubleshooting",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["troubleshooting"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].troubleshooting,
  schema: BlockBase.extend({
    type: z.literal("troubleshooting"),
    title: z.string().optional(),
    entries: z
      .array(
        z.object({
          /** What the reader actually sees, in their words, not the cause. */
          symptom: z.string().min(1),
          cause: z.string().optional(),
          fix: z.string().min(1),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-troubleshooting">
        <Measure>
          <h2 className="blk-troubleshooting__title">{block.title ?? labels.troubleshooting}</h2>
          <div className="blk-troubleshooting__list">
            {block.entries.map((entry, i) => (
              <details key={i} className="blk-troubleshooting__entry">
                <summary>{entry.symptom}</summary>
                {entry.cause ? (
                  <p className="blk-troubleshooting__cause">
                    <span>{labels.cause}</span> {entry.cause}
                  </p>
                ) : null}
                <p className="blk-troubleshooting__fix">
                  <span>{labels.fix}</span> {entry.fix}
                </p>
              </details>
            ))}
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const compatibilityMatrix = defineBlock({
  type: "compatibility-matrix",
  category: "manual",
  capabilities: ["breakout"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["reference"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].compatibility,
  schema: BlockBase.extend({
    type: z.literal("compatibility-matrix"),
    title: z.string().optional(),
    columns: z.array(z.string().min(1)).min(1),
    rows: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          cells: z.record(z.string(), z.enum(["supported", "partial", "unsupported", "untested"])),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    const cellLabel: Record<string, string> = {
      supported: labels.supported,
      partial: labels.partial,
      unsupported: labels.unsupported,
      untested: labels.untested,
    };
    return (
      <Section id={block.id} className="blk-compat-matrix breakout">
        <h2 className="blk-compat-matrix__title">{block.title ?? labels.compatibility}</h2>
        <div className="blk-compat-matrix__scroll">
          <table className="blk-compat-matrix__table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">{labels.target}</span>
                </th>
                {block.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  {block.columns.map((column) => {
                    const status = row.cells[column] ?? "untested";
                    return (
                      // The word is in the cell, not just a colour: status
                      // that only exists as a colour is unreadable to a
                      // third of readers and invisible in print.
                      <td key={column} data-status={status}>
                        {cellLabel[status]}
                      </td>
                    );
                  })}
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

const versionNote = defineBlock({
  type: "version-note",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["reference"],
  navTitle: () => undefined,
  schema: BlockBase.extend({
    type: z.literal("version-note"),
    appliesFrom: z.string().min(1),
    appliesTo: z.string().optional(),
    note: z.string().min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    const range = block.appliesTo
      ? `${block.appliesFrom} – ${block.appliesTo}`
      : `${block.appliesFrom} ${labels.andLater}`;
    return (
      <Section id={block.id} className="blk-version-note">
        <Measure>
          <p className="blk-version-note__range">{range}</p>
          <p className="blk-version-note__note">{block.note}</p>
        </Measure>
      </Section>
    );
  },
});

const completionCheck = defineBlock({
  type: "completion-check",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_AND_ADVANCED,
  roles: ["verification"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].completion,
  schema: BlockBase.extend({
    type: z.literal("completion-check"),
    title: z.string().optional(),
    /** The single command or observation that proves the whole task worked. */
    check: z.string().min(1),
    expected: z.string().min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-completion-check">
        <Measure>
          <h2 className="blk-completion-check__title">{block.title ?? labels.completion}</h2>
          <pre className="blk-completion-check__check" tabIndex={0}>
            <code>{block.check}</code>
          </pre>
          <p className="blk-completion-check__expected">
            <span>{labels.expectedResult}</span> {block.expected}
          </p>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const nextTask = defineBlock({
  type: "next-task",
  category: "manual",
  capabilities: ["measure"],
  supportedArtifacts: MANUAL_ONLY,
  roles: ["reference"],
  navTitle: (block, language) => block.title ?? MANUAL_LABEL[language].nextTask,
  schema: BlockBase.extend({
    type: z.literal("next-task"),
    title: z.string().optional(),
    tasks: z
      .array(z.object({ label: z.string().min(1), why: z.string().optional() }))
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = MANUAL_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-next-task">
        <Measure>
          <h2 className="blk-next-task__title">{block.title ?? labels.nextTask}</h2>
          <ul className="blk-next-task__list">
            {block.tasks.map((task, i) => (
              <li key={i}>
                <span className="blk-next-task__label">{task.label}</span>
                {task.why ? <span className="blk-next-task__why">{task.why}</span> : null}
              </li>
            ))}
          </ul>
        </Measure>
      </Section>
    );
  },
});

export const manualBlocks = [
  taskMap,
  audienceScope,
  prerequisite,
  environmentSelector,
  quickPath,
  step,
  checkpoint,
  decisionTree,
  troubleshooting,
  compatibilityMatrix,
  versionNote,
  completionCheck,
  nextTask,
] as const;
