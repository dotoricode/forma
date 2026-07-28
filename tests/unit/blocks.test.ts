import { describe, expect, it } from "vitest";
import { renderBlockToHtml } from "../../src/renderer/static.js";
import type { RenderContext } from "../../src/blocks/registry.js";
import type { FormaSource } from "../../src/spec/schema.js";

function context(sources: FormaSource[]): RenderContext {
  return {
    language: "en",
    sourcesById: new Map(sources.map((source) => [source.id, source])),
  };
}

describe("source evidence rendering", () => {
  it("preserves a URL source as a visible, safe external link", async () => {
    const html = await renderBlockToHtml(
      {
        id: "summary",
        type: "summary",
        title: "Summary",
        body: "Body",
        sourceRefs: ["video"],
      },
      context([
        {
          id: "video",
          label: "Original video",
          kind: "url",
          path: "https://www.youtube.com/watch?v=example",
        },
      ]),
    );

    expect(html).toContain('href="https://www.youtube.com/watch?v=example"');
    expect(html).toContain("Original video");
    expect(html).toContain("https://www.youtube.com/watch?v=example");
    expect(html).toContain('rel="noopener noreferrer"');
    // React serializes this attribute as `referrerPolicy`. HTML attribute
    // names are case-insensitive at parse time, so the rendered behaviour is
    // the same; the assertion just must not depend on the casing.
    expect(html).toMatch(/referrerpolicy="no-referrer"/i);
  });

  it("shows file locators without turning them into links", async () => {
    const html = await renderBlockToHtml(
      { id: "prose", type: "prose", body: "Body", sourceRefs: ["file"] },
      context([{ id: "file", label: "Design", kind: "file", path: "docs/DESIGN.md" }]),
    );

    expect(html).toContain("docs/DESIGN.md");
    expect(html).not.toContain('href="docs/DESIGN.md"');
  });

  it("does not link unsafe URL schemes", async () => {
    const html = await renderBlockToHtml(
      { id: "prose", type: "prose", body: "Body", sourceRefs: ["bad"] },
      context([{ id: "bad", label: "Unsafe", kind: "url", path: "javascript:alert(1)" }]),
    );

    expect(html).toContain("javascript:alert(1)");
    expect(html).not.toContain("<a ");
  });

  it("renders every source with its locator in a bibliography block", async () => {
    const html = await renderBlockToHtml(
      { id: "sources", type: "source-note", title: "Sources" },
      context([
        { id: "one", label: "One", kind: "file", path: "one.md" },
        { id: "two", label: "Two", kind: "url", path: "https://example.com/two" },
      ]),
    );

    expect(html).toContain("one.md");
    expect(html).toContain('href="https://example.com/two"');
  });
});
