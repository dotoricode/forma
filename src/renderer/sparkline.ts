/**
 * Small deterministic SVG for dashboard metrics.
 *
 * Kept in the same hand-rolled style as `diagrams.ts` rather than pulling in
 * a plotting library. These shapes are simple — a polyline, a baseline, a
 * band of bars — and a chart runtime would mean either a browser at build
 * time or a script in the output, both of which the artifact contract rules
 * out for the static path.
 *
 * Missing values are a first-class case. A gap in a series is a real thing
 * that happened to the data, and drawing through it produces a line that
 * asserts measurements nobody took.
 */

export type SeriesPoint = number | null;

export interface SparklineOptions {
  values: readonly SeriesPoint[];
  width?: number;
  height?: number;
  /** Drawn as a dashed horizontal rule, e.g. a target or a previous period. */
  baseline?: number | undefined;
}

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 40;
const PAD = 3;

interface Scale {
  x: (index: number) => number;
  y: (value: number) => number;
  min: number;
  max: number;
}

function buildScale(
  values: readonly SeriesPoint[],
  width: number,
  height: number,
  baseline: number | undefined,
): Scale {
  const present = values.filter((v): v is number => v !== null);
  const candidates = baseline === undefined ? present : [...present, baseline];
  const rawMin = candidates.length > 0 ? Math.min(...candidates) : 0;
  const rawMax = candidates.length > 0 ? Math.max(...candidates) : 1;
  // A flat series has zero range, which would divide by zero and collapse
  // every point onto one row. Give it a nominal band so the line sits mid-height.
  const span = rawMax - rawMin || Math.abs(rawMax) || 1;
  const min = rawMin - span * 0.1;
  const max = rawMax + span * 0.1;
  const lastIndex = Math.max(values.length - 1, 1);
  return {
    min,
    max,
    x: (index) => PAD + (index / lastIndex) * (width - PAD * 2),
    y: (value) => height - PAD - ((value - min) / (max - min)) * (height - PAD * 2),
  };
}

/** Splits a series into the runs of consecutive present values. */
function segments(values: readonly SeriesPoint[]): { index: number; value: number }[][] {
  const runs: { index: number; value: number }[][] = [];
  let current: { index: number; value: number }[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) runs.push(current);
      current = [];
      return;
    }
    current.push({ index, value });
  });
  if (current.length > 0) runs.push(current);
  return runs;
}

export function renderSparklineSvg(options: SparklineOptions): string {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const scale = buildScale(options.values, width, height, options.baseline);

  const baselineEl =
    options.baseline === undefined
      ? ""
      : `<line class="spark-baseline" x1="${PAD}" x2="${width - PAD}" y1="${scale.y(options.baseline).toFixed(1)}" y2="${scale.y(options.baseline).toFixed(1)}" />`;

  const paths = segments(options.values)
    .map((run) => {
      if (run.length === 1) {
        const point = run[0];
        if (!point) return "";
        // A single measurement is a dot, not a line: drawing a segment of
        // length zero would render as nothing at all.
        return `<circle class="spark-point" cx="${scale.x(point.index).toFixed(1)}" cy="${scale.y(point.value).toFixed(1)}" r="1.6" />`;
      }
      const points = run
        .map((point) => `${scale.x(point.index).toFixed(1)},${scale.y(point.value).toFixed(1)}`)
        .join(" ");
      return `<polyline class="spark-line" points="${points}" fill="none" />`;
    })
    .join("");

  const last = [...options.values].reverse().find((v): v is number => v !== null);
  const lastIndex = options.values.findLastIndex((v) => v !== null);
  const marker =
    last === undefined || lastIndex < 0
      ? ""
      : `<circle class="spark-last" cx="${scale.x(lastIndex).toFixed(1)}" cy="${scale.y(last).toFixed(1)}" r="2.2" />`;

  return `<svg class="spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false">${baselineEl}${paths}${marker}</svg>`;
}

export interface BreakdownBar {
  label: string;
  value: number;
}

/**
 * Horizontal bars for a driver breakdown. Horizontal because the labels are
 * words: a vertical bar chart with Korean category names either rotates
 * them or truncates them, and both make the chart slower to read than the
 * table it replaced.
 */
export function renderBreakdownSvg(bars: readonly BreakdownBar[], width = 560): string {
  const rowHeight = 28;
  const gap = 8;
  const labelWidth = Math.min(200, Math.max(96, width * 0.32));
  const height = bars.length * (rowHeight + gap) + gap;
  const max = Math.max(...bars.map((bar) => Math.abs(bar.value)), 1);
  const trackWidth = width - labelWidth - 56;

  const rows = bars
    .map((bar, index) => {
      const y = gap + index * (rowHeight + gap);
      const barWidth = (Math.abs(bar.value) / max) * trackWidth;
      const negative = bar.value < 0;
      return [
        `<text class="breakdown-label" x="0" y="${y + rowHeight / 2 + 4}">${escapeXml(bar.label)}</text>`,
        `<rect class="breakdown-bar" data-sign="${negative ? "negative" : "positive"}" x="${labelWidth}" y="${y + 4}" width="${barWidth.toFixed(1)}" height="${rowHeight - 8}" rx="2" />`,
        `<text class="breakdown-value" x="${labelWidth + barWidth + 8}" y="${y + rowHeight / 2 + 4}">${escapeXml(formatSigned(bar.value))}</text>`,
      ].join("");
    })
    .join("");

  return `<svg class="breakdown" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false">${rows}</svg>`;
}

/**
 * Prints the value as authored. Rounding here disagreed with the list of
 * the same numbers rendered below the chart, and -0.002 became "0" — a
 * value that fell, shown as no change.
 */
function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function escapeXml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) =>
    ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === '"' ? "&quot;" : "&#39;",
  );
}
