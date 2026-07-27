# Forma

Forma turns source material into a validated semantic specification and a
self-contained visual document that can be read and verified offline.

## Language

**Source Material**:
The document, code, result set, note, or remote resource from which a Forma document is derived.
_Avoid_: Input blob, raw content

**Forma Spec**:
The validated semantic JSON document that defines a Forma document's narrative, sources, and blocks.
_Avoid_: Template, page config

**Source**:
A labeled record in a **Forma Spec** that identifies one item of **Source Material** and its locator.
_Avoid_: Citation, reference

**Evidence**:
The explicit association from a semantic block to one or more **Sources** through `sourceRefs`.
_Avoid_: Source, citation

**Rendered Output**:
The self-contained `index.html` and its companion spec, manifest, and QA artifacts.
_Avoid_: Page, export, build

## Relationships

- A **Forma Spec** describes exactly one **Rendered Output**
- A **Forma Spec** contains zero or more **Sources**
- A semantic block carries **Evidence** by referring to zero or more **Sources**
- A **Source** identifies one item of **Source Material**

## Example dialogue

> **Dev:** "The summary names the video, but can readers inspect the Evidence?"
> **Domain expert:** "Only if the block's `sourceRefs` points to a Source whose locator is preserved in the Rendered Output."

## Flagged ambiguities

- "source" previously meant both the original material and its metadata record; use **Source Material** for the original and **Source** for the spec record.
- "output" previously meant either `index.html` alone or the whole directory; **Rendered Output** includes the HTML and companion artifacts.
