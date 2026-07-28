/**
 * Central escaping/sanitization boundary. Every string that reaches the DOM
 * through one of Forma's block renderers must pass through here — no block
 * module concatenates raw HTML strings on its own.
 */
import DOMPurify from "isomorphic-dompurify";

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes a plain string for safe use as HTML text content or attribute value. */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/**
 * Renders a small, explicitly-allowed subset of inline Markdown (bold,
 * italic, inline code, links) inside otherwise-escaped prose text, then
 * sanitizes the result. This is the only place `prose`/`summary`/`finding`
 * bodies are allowed to contain any markup at all.
 */
export function renderInlineMarkdown(raw: string): string {
  const escaped = escapeHtml(raw);
  const withInlineCode = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  const withBold = withInlineCode.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  const withParagraphs = withItalic
    .split(/\n{2,}/)
    .map((para) => `<p>${para.trim().replace(/\n/g, "<br />")}</p>`)
    .join("");
  return sanitizeFragment(withParagraphs);
}

/** Sanitizes an HTML fragment that Forma itself generated (defense in depth). */
export function sanitizeFragment(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "code", "a", "span"],
    ALLOWED_ATTR: ["href", "class"],
  });
}

/** Sanitizes a generated SVG fragment (diagrams/charts) before inlining it. */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ["foreignObject"],
    FORBID_TAGS: ["script", "foreignObject"],
    FORBID_ATTR: ["onload", "onerror", "onclick"],
  });
}

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN (?:RSA|EC|OPENSSH|DSA) PRIVATE KEY-----/g,
  /\b(?:sk|pk)-[A-Za-z0-9]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bghp_[A-Za-z0-9]{36}\b/g,
  /\b(?:api[_-]?key|secret|password|token)\s*[:=]\s*["']?[^\s"']{8,}["']?/gi,
];

/** Masks strings that look like secrets so they never appear verbatim in output. */
export function redactSecrets(text: string): { text: string; redactions: number } {
  let redactions = 0;
  const redacted = SECRET_PATTERNS.reduce(
    (acc, pattern) => acc.replace(pattern, () => {
      redactions += 1;
      return "[redacted]";
    }),
    text,
  );
  return { text: redacted, redactions };
}

/** Removes the invoking user's home directory absolute path from output strings. */
export function stripHomeDirectory(text: string): string {
  const home = process.env["HOME"];
  if (!home) return text;
  return text.split(home).join("~");
}

const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** Returns `href` if it uses an allowed scheme (or is a bare relative/anchor link), else `#`. */
export function sanitizeUrl(href: string): string {
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./")) return href;
  try {
    const url = new URL(href);
    return SAFE_URL_SCHEMES.has(url.protocol) ? href : "#";
  } catch {
    return "#";
  }
}
