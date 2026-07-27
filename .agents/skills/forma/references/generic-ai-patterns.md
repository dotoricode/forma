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

`scripts/audit-design.mjs` catches the CSS-detectable subset of these
automatically (bracket-border pseudo-elements, decorative `content: "["`,
excessive gradient/shadow/pill usage). It cannot see layout composition —
that still needs a human looking at real screenshots at 1920/1440/1024/390.
