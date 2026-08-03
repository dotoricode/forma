# Generic AI pattern checklist

Forma's renderer already avoids these by construction, but if you write
`custom` content or review a screenshot, check for:

- Left-side bracket/hook borders (`[`, `┌│└`) — banned outright.
- Purple/blue gradient hero sections, glassmorphism, glow, neon, dot-grid,
  gradient orbs, corner glow.
- Every piece of content wrapped in a rounded card.
- Excessive pills/badges without real meaning.
- SaaS-landing-page hero + big meaningless CTA.
- Decorative oversized `{ }`, `[ ]`, `</>` used as background texture.
- Sequential fade-up on scroll, hover-lift, card tilt, mouse-follow glow.
- Section headings that are just short labels instead of claims.
- Uniform card grids with no real hierarchy (see `design-grammar.md`).

`scripts/audit-design.mjs` catches only part of this, and it is worth knowing
which part. It runs the CSS lint, which sees bracket-border pseudo-elements,
decorative `content: "["`, and more than two CSS gradients. It does **not**
check for shadows, glow, glassmorphism, dot grids, or scroll animation —
there is no rule for any of those. Pill overuse is checked, but by the DOM
lint in `forma qa`, not by this script.

So most of the list above has no machine behind it. It needs a human looking
at real screenshots at 1920/1440/1024/390, and that is the primary check
rather than a fallback.
