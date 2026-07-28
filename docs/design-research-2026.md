# Design research: readable variety without generic AI styling

This research informed Forma's four visual themes in July 2026. The goal was
not to imitate any one brand, but to identify transferable composition rules
for self-contained technical documents.

## Sources reviewed

- [getdesign.md](https://getdesign.md/) and
  [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md):
  design direction becomes reusable when color, type, spacing, components,
  motion, and rationale are recorded together instead of copied as a screenshot.
- [Nicolai Palmkvist's Template Club](https://nicolaipalmkvist.com/):
  strong display headlines, black/white contrast, one vivid accent, compact
  corner radii, and scroll-paced collections create personality without a
  complicated palette.
- [Pinterest web-layout collections](https://www.pinterest.com/ideas/web-design-layouts/944260302017/):
  editorial grids, large typography, asymmetric alignment, and deliberate
  cropping repeatedly create hierarchy before decoration.
- [shadcn/ui](https://ui.shadcn.com/) and
  [shadcn-ui/ui](https://github.com/shadcn-ui/ui):
  neutral surfaces, precise controls, real product examples, and open
  component ownership make a technical interface feel credible.
- [Fumadocs](https://www.fumadocs.dev/) and
  [fuma-nama/fumadocs](https://github.com/fuma-nama/fumadocs):
  a strong headline, direct quick start, keyboard-search affordance, and
  composable documentation blocks support both scanning and depth.
- [Starlight](https://starlight.astro.build/) and
  [withastro/starlight](https://github.com/withastro/starlight):
  persistent navigation, narrow reading measure, visible current location,
  semantic landmarks, and accessible defaults reduce documentation friction.
- [Dub](https://dub.co/) and [dubinc/dub](https://github.com/dubinc/dub):
  product data is used as visual evidence, with tight numeric hierarchy and
  restrained black/white surfaces rather than decorative hero effects.

## Decisions for Forma

### simple

Use one strong title, a stable left reading edge, generous section pauses, and
fine rules. This is the default for mixed audiences and should feel like a
well-edited memo rather than a template.

### workspace

Keep the navigation rail and denser rhythm, but reserve raised surfaces for
actual tools and evidence such as diagrams, matrices, comparisons, and code.
Turning every section into a card weakens hierarchy and is explicitly avoided.

### guide

Prioritize orientation: a persistent left rail, clear active state, compact
reading width, prominent code and callouts, and predictable section rhythm.
This theme is intended for manuals and step-by-step explanations.

### magazine

Use display serif headings, a larger leverage-point title, editorial rules,
and asymmetric cover metadata. Expressiveness stays typographic; Forma does
not adopt ornamental gradients, hover theatrics, or scroll-triggered reveals.

## Naming decision

The previous identifiers described design-industry concepts:
`quiet-editorial`, `precision-workbench`, `developer-docs`, and
`editorial-magazine`. The public identifiers are now `simple`, `workspace`,
`guide`, and `magazine`. Legacy values remain accepted as input and normalize
to the new names so existing specs continue to render.
