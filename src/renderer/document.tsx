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

export function Narrative(props: { spec: FormaSpec }) {
  const { narrative } = props.spec;
  return (
    <section className="section blk-narrative" id="narrative">
      <Measure>
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
  return (
    <>
      {leadsWithCover ? blocks[0] : null}
      <Narrative spec={spec} />
      {leadsWithCover ? blocks.slice(1) : blocks}
    </>
  );
}

export function TableOfContents(props: { spec: FormaSpec }): ReactElement | null {
  const entries = props.spec.sections
    .map((block) => ({ id: block.id, title: navTitleOf(block, props.spec.meta.language) }))
    .filter((entry): entry is { id: string; title: string } => Boolean(entry.title));
  if (entries.length === 0) return null;
  return (
    <nav className="toc" aria-label={NAV_LABEL[props.spec.meta.language]}>
      {entries.map((entry) => (
        <a key={entry.id} href={`#${entry.id}`}>
          {entry.title}
        </a>
      ))}
    </nav>
  );
}
