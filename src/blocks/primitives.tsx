/**
 * Shared layout primitives every block composes from.
 *
 * These replace the string helpers (`section()`, `measureWrap()`) that each
 * renderer used to call. As components they can be type-checked at the call
 * site, which is most of the point of moving to TSX: a block can no longer
 * put a breakout table inside a reading measure by concatenating the wrong
 * two strings.
 */
import type { ReactNode } from "react";
import { renderInlineMarkdown, sanitizeUrl } from "../security/sanitize.js";
import type { RenderContext } from "./types.js";
import { STRINGS, type BlockLike } from "./strings.js";

export function Section(props: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section className={`section ${props.className}`} id={props.id}>
      {props.children}
    </section>
  );
}

/**
 * Prose-width text blocks constrain their *content* to reading width, but
 * the section itself stays full width — otherwise the section's own
 * border-block-end divider shrinks to the narrow content width too, reading
 * as an abrupt, oddly-centered fragment instead of a normal full-bleed
 * section boundary.
 */
export function Measure(props: { children: ReactNode }) {
  return <div className="measure">{props.children}</div>;
}

export function ConfidenceTag(props: { block: BlockLike; ctx: RenderContext }) {
  const { block, ctx } = props;
  if (!block.confidence) return <></>;
  const key =
    block.confidence === "verified"
      ? "confidenceVerified"
      : block.confidence === "inferred"
        ? "confidenceInferred"
        : "confidenceUnknown";
  return (
    <span className="confidence-tag" data-confidence={block.confidence}>
      {STRINGS[ctx.language][key]}
    </span>
  );
}

export function SourceListItem(props: { id: string; ctx: RenderContext }) {
  const source = props.ctx.sourcesById.get(props.id);
  if (!source) {
    return (
      <li>
        <span className="blk-source-note__label">{props.id}</span>
      </li>
    );
  }
  if (!source.path) {
    return (
      <li>
        <span className="blk-source-note__label">{source.label}</span>
      </li>
    );
  }
  // `sanitizeUrl` runs at the boundary; anything it rejects becomes "#" and
  // is rendered as plain text rather than a link the reader can follow.
  const safeUrl = sanitizeUrl(source.path);
  const isLinkedUrl = source.kind === "url" && safeUrl !== "#";
  return (
    <li>
      {isLinkedUrl ? (
        <a
          className="blk-source-note__link"
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          {source.label}
        </a>
      ) : (
        <span className="blk-source-note__label">{source.label}</span>
      )}
      <code className="blk-source-note__locator">{source.path}</code>
    </li>
  );
}

export function SourceNotes(props: { block: BlockLike; ctx: RenderContext }) {
  const refs = props.block.sourceRefs ?? [];
  if (refs.length === 0) return <></>;
  return (
    <div className="blk-source-note" aria-label={STRINGS[props.ctx.language].sources}>
      <ul>
        {refs.map((id) => (
          <SourceListItem key={id} id={id} ctx={props.ctx} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Renders the allowed inline-Markdown subset. The string is escaped and
 * sanitized by `renderInlineMarkdown` before it reaches this component;
 * `dangerouslySetInnerHTML` is how pre-sanitized markup crosses into React,
 * and it is the only way it does.
 */
export function InlineMarkdown(props: { text: string; className?: string }) {
  const html = renderInlineMarkdown(props.text);
  return props.className ? (
    <div className={props.className} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Inlines an SVG fragment that has already passed `sanitizeSvg`. */
export function InlineSvg(props: { svg: string; className?: string }) {
  return props.className ? (
    <div className={props.className} dangerouslySetInnerHTML={{ __html: props.svg }} />
  ) : (
    <div dangerouslySetInnerHTML={{ __html: props.svg }} />
  );
}
