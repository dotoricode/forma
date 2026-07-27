/**
 * Font subsetting pipeline.
 *
 * Forma embeds fonts as base64 WOFF2 data URIs directly inside the rendered
 * HTML — no runtime request to Google Fonts or any other CDN. To keep the
 * embedded payload small, each render subsets every font down to the glyphs
 * actually used in *that* document (title, body, code, labels) via HarfBuzz
 * (`subset-font`), instead of shipping full font files or the entire Google
 * Fonts glyph set.
 *
 * Source files ship inside the `geist` and `@ibm/plex-sans-kr` npm packages
 * (both SIL OFL-1.1, see THIRD_PARTY_NOTICES.md). We never call the Google
 * Fonts CSS API — doing so would leak document content through the `text=`
 * query parameter.
 */
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
// @ts-expect-error — subset-font ships no type declarations.
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);

function resolvePackageDir(pkgJsonSpecifier: string): string {
  return path.dirname(require.resolve(pkgJsonSpecifier));
}

// `geist`'s package.json declares an `exports` map with no `./package.json`
// entry, so it can't be resolved directly. Its `./font/sans` subpath *is*
// exported (as `dist/sans.js`), so resolve that instead and walk up to the
// package root.
const geistDir = path.resolve(path.dirname(require.resolve("geist/font/sans")), "..");
const plexDir = resolvePackageDir("@ibm/plex-sans-kr/package.json");

const SOURCE_FONTS = {
  sansVariable: path.join(geistDir, "dist/fonts/geist-sans/Geist-Variable.woff2"),
  monoVariable: path.join(geistDir, "dist/fonts/geist-mono/GeistMono-Variable.woff2"),
  krRegular: path.join(plexDir, "fonts/complete/woff/hinted/IBMPlexSansKR-Regular.woff"),
  krBold: path.join(plexDir, "fonts/complete/woff/hinted/IBMPlexSansKR-Bold.woff"),
} as const;

/** Baseline characters Forma's own UI chrome always needs, regardless of document content. */
const UI_BASELINE_CHARS =
  " \t\n\r0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  ".,:;!?'\"()[]{}<>-–—/\\+=*_%&#@~`^|·…→←↑↓✓✕";

export interface FontFaceInput {
  /** All visible text that will render in the sans typeface (titles, prose, labels). */
  sansText: string;
  /** All visible text that will render in the monospace typeface (code, diffs, data). */
  monoText: string;
}

interface SubsetJob {
  family: string;
  weight: number;
  style: "normal";
  sourcePath: string;
  text: string;
  variationAxes?: Record<string, number>;
}

async function subsetToDataUri(job: SubsetJob): Promise<string> {
  const buffer = await readFile(job.sourcePath);
  const text = UI_BASELINE_CHARS + job.text;
  const subset = await subsetFont(buffer, text, {
    targetFormat: "woff2",
    ...(job.variationAxes ? { variationAxes: job.variationAxes } : {}),
  });
  return `data:font/woff2;base64,${(subset as Buffer).toString("base64")}`;
}

function fontFace(family: string, weight: number, dataUri: string): string {
  return `  @font-face {
    font-family: "${family}";
    font-style: normal;
    font-weight: ${weight};
    /* The font is a document-specific subset embedded in this same HTML.
       Optional uses it when ready before first paint but never performs a
       late fallback-font swap; that keeps Korean mobile reports free of CLS
       under CPU throttling as well as on fast machines. */
    font-display: optional;
    src: url("${dataUri}") format("woff2");
  }`;
}

/**
 * Builds the `@font-face` CSS block for a single document, subsetting each
 * source font to the glyphs that document actually uses.
 */
export async function buildFontFaceCss(input: FontFaceInput): Promise<string> {
  const krText = extractHangulAndKoreanPunctuation(input.sansText);

  const [sansRegular, sansBold, mono, krRegular, krBold] = await Promise.all([
    subsetToDataUri({
      family: "Geist",
      weight: 400,
      style: "normal",
      sourcePath: SOURCE_FONTS.sansVariable,
      text: input.sansText,
      variationAxes: { wght: 400 },
    }),
    subsetToDataUri({
      family: "Geist",
      weight: 700,
      style: "normal",
      sourcePath: SOURCE_FONTS.sansVariable,
      text: input.sansText,
      variationAxes: { wght: 700 },
    }),
    subsetToDataUri({
      family: "Geist Mono",
      weight: 400,
      style: "normal",
      sourcePath: SOURCE_FONTS.monoVariable,
      text: input.monoText,
      variationAxes: { wght: 400 },
    }),
    krText.length > 0
      ? subsetToDataUri({
          family: "IBM Plex Sans KR",
          weight: 400,
          style: "normal",
          sourcePath: SOURCE_FONTS.krRegular,
          text: krText,
        })
      : null,
    krText.length > 0
      ? subsetToDataUri({
          family: "IBM Plex Sans KR",
          weight: 700,
          style: "normal",
          sourcePath: SOURCE_FONTS.krBold,
          text: krText,
        })
      : null,
  ]);

  const rules = [
    fontFace("Geist", 400, sansRegular),
    fontFace("Geist", 700, sansBold),
    fontFace("Geist Mono", 400, mono),
  ];
  if (krRegular) rules.push(fontFace("IBM Plex Sans KR", 400, krRegular));
  if (krBold) rules.push(fontFace("IBM Plex Sans KR", 700, krBold));

  return `@layer tokens {\n${rules.join("\n")}\n}`;
}

function extractHangulAndKoreanPunctuation(text: string): string {
  const matches = text.match(/[ᄀ-ᇿ㄰-㆏가-힣　-〿]/gu);
  return matches ? Array.from(new Set(matches)).join("") : "";
}
