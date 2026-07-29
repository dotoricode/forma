/**
 * The document body as a React tree.
 *
 * This is the piece the Decision Room will share: the same components that
 * produce the static HTML also mount in the interactive build, so an
 * artifact cannot drift between the two. Only the host differs —
 * `renderToStaticMarkup` here, a real root there.
 */
import { Fragment, type ReactElement } from "react";
import type { FormaSpec } from "../spec/schema.js";
import { navTitleOf, renderBlockElement, type RenderContext } from "../blocks/registry.js";
import { InlineMarkdown, Measure } from "../blocks/primitives.js";

const NAV_LABEL: Record<"ko" | "en", string> = {
  en: "Section navigation",
  ko: "섹션 이동",
};

/** Shorter than NAV_LABEL because it is set as a rail heading, not a sentence. */
const RAIL_LABEL: Record<"ko" | "en", string> = {
  en: "On this page",
  ko: "이 문서의 목차",
};

const GUIDE_NAV_LABEL: Record<"ko" | "en", string> = {
  en: "Guide navigation",
  ko: "가이드 탐색",
};

const MANUAL_GROUPS = {
  ko: [
    { id: "start", label: "시작하기" },
    { id: "work", label: "작업 순서" },
    { id: "reference", label: "확인과 참고" },
  ],
  en: [
    { id: "start", label: "Get started" },
    { id: "work", label: "Procedure" },
    { id: "reference", label: "Checks and reference" },
  ],
} as const;

const MANUAL_GROUP_BY_TYPE: Record<string, "start" | "work" | "reference"> = {
  "task-map": "start",
  "audience-scope": "start",
  prerequisite: "start",
  "environment-selector": "start",
  "quick-path": "work",
  step: "work",
  checkpoint: "work",
  "decision-tree": "reference",
  troubleshooting: "reference",
  "compatibility-matrix": "reference",
  "version-note": "reference",
  "completion-check": "reference",
  "next-task": "reference",
  "source-note": "reference",
};

export function Narrative(props: { spec: FormaSpec; showTitle: boolean }) {
  const { narrative, meta } = props.spec;
  return (
    <section className="section blk-narrative" id="narrative">
      <Measure>
        {/* A `cover` block supplies the h1. Artifacts that open with
            something else — a manual's task map, a dashboard's status
            header — left the page with no level-one heading at all, which
            axe flags and which leaves the document nameless on screen. */}
        {props.showTitle ? <h1 className="blk-narrative__title">{meta.title}</h1> : null}
        {props.showTitle && meta.subtitle ? (
          <p className="blk-narrative__subtitle">{meta.subtitle}</p>
        ) : null}
        <p className="blk-narrative__question">{narrative.question}</p>
        <InlineMarkdown className="blk-narrative__summary" text={narrative.summary} />
        {narrative.takeaways.length > 0 ? (
          <ul className="blk-takeaways">
            {narrative.takeaways.map((takeaway, i) => (
              <li key={i}>{takeaway}</li>
            ))}
          </ul>
        ) : null}
      </Measure>
    </section>
  );
}

export function DocumentBody(props: {
  spec: FormaSpec;
  ctx: RenderContext;
  prepared: Map<string, unknown>;
}): ReactElement {
  const { spec, ctx, prepared } = props;
  const blocks = spec.sections.map((block) => (
    <Fragment key={block.id}>{renderBlockElement(block, ctx, prepared)}</Fragment>
  ));

  // The title (cover) must be the first thing a reader sees. When a spec
  // leads with a `cover` block, the question/summary narrative slots in
  // right after it instead of floating above the title.
  const leadsWithCover = spec.sections[0]?.type === "cover";
  const hasCover = spec.sections.some((block) => block.type === "cover");
  const dashboardLead =
    spec.meta.artifact === "dashboard" &&
    spec.sections[0]?.type === "status-header" &&
    (spec.sections[1]?.type === "metric-group" || spec.sections[1]?.type === "metric");

  if (dashboardLead) {
    const evidenceCount = spec.sections[2]?.type === "chart" ? 3 : 2;
    return (
      <>
        {blocks.slice(0, evidenceCount)}
        <Narrative spec={spec} showTitle={false} />
        {blocks.slice(evidenceCount)}
      </>
    );
  }

  return (
    <>
      {leadsWithCover ? blocks[0] : null}
      <Narrative spec={spec} showTitle={!hasCover} />
      {leadsWithCover ? blocks.slice(1) : blocks}
    </>
  );
}

export function ManualGuideNavigation(props: { spec: FormaSpec }): ReactElement | null {
  if (props.spec.meta.artifact !== "manual") return null;
  const language = props.spec.meta.language;
  const entries = props.spec.sections
    .map((block) => ({
      id: block.id,
      type: block.type,
      title: navTitleOf(block, language),
      group: MANUAL_GROUP_BY_TYPE[block.type] ?? "reference",
    }))
    .filter((entry): entry is typeof entry & { title: string } => Boolean(entry.title));
  if (entries.length === 0) return null;

  return (
    <nav className="guide-nav" aria-label={GUIDE_NAV_LABEL[language]}>
      <p className="guide-nav__label" aria-hidden="true">
        {GUIDE_NAV_LABEL[language]}
      </p>
      {MANUAL_GROUPS[language].map((group) => {
        const links = entries.filter((entry) => entry.group === group.id);
        if (links.length === 0) return null;
        return (
          <div className="guide-nav__group" key={group.id}>
            <p className="guide-nav__group-label">{group.label}</p>
            {links.map((entry) => (
              <a key={entry.id} href={`#${entry.id}`}>
                {entry.title}
              </a>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

export function TableOfContents(props: { spec: FormaSpec }): ReactElement | null {
  const entries = props.spec.sections
    .map((block) => ({ id: block.id, title: navTitleOf(block, props.spec.meta.language) }))
    .filter((entry): entry is { id: string; title: string } => Boolean(entry.title));
  if (entries.length === 0) return null;
  return (
    <nav className="toc" aria-label={NAV_LABEL[props.spec.meta.language]}>
      {/* Visible only where the nav is a vertical rail, and aria-hidden
          because the nav's own aria-label already announces the same thing.
          Without it a rail of fifteen bare links does not say what it is. */}
      <p className="toc__label" aria-hidden="true">
        {RAIL_LABEL[props.spec.meta.language]}
      </p>
      {entries.map((entry) => (
        <a key={entry.id} href={`#${entry.id}`}>
          {entry.title}
        </a>
      ))}
    </nav>
  );
}
