/**
 * Deterministic SVG layout engine for the diagram-shaped blocks (`flow`,
 * `sequence`, `architecture`, `chart`). No browser, no Mermaid, no Vega-Lite
 * runtime — plain geometry so the same spec always produces byte-identical
 * SVG. Layout is intentionally simple (grid/lane based) rather than a
 * general graph-layout algorithm; it covers the block sizes Forma targets
 * (a few dozen nodes) without needing a heavyweight dependency.
 */
import { escapeHtml } from "../security/sanitize.js";

/**
 * Input shapes are declared structurally rather than pulled from the spec
 * types. The block registry owns the schemas and imports this module to
 * render them, so importing `FormaBlock` back would close a cycle
 * (spec -> registry -> diagram block -> diagrams -> spec) and collapse the
 * inference for every block in it. Structural types also keep the layout
 * engine usable on its own.
 */
export interface FlowBlock {
  nodes: readonly { id: string; label: string; kind: "start" | "step" | "decision" | "end" }[];
  edges: readonly { from: string; to: string; label?: string | undefined }[];
}
export interface SequenceBlock {
  participants: readonly { id: string; label: string }[];
  messages: readonly { from: string; to: string; label: string; kind: "call" | "return" | "async" }[];
}
export interface ArchitectureBlock {
  nodes: readonly { id: string; label: string; group?: string | undefined }[];
  edges: readonly { from: string; to: string; label?: string | undefined }[];
}
export interface ChartBlock {
  kind: "bar" | "line";
  categories: readonly string[];
  series: readonly { label: string; values: readonly number[] }[];
  unit?: string | undefined;
}

const NODE_W = 240;
const NODE_H = 64;
const ROW_GAP = 48;
const PAD = 24;
// CJK glyphs render roughly twice as wide as Latin ones at the same
// font-size, so a wrap threshold tuned for English text let Korean node
// labels run edge-to-edge (and past it) inside a fixed-width node.
const NODE_LABEL_WRAP_CHARS = 15;

export function renderFlowSvg(block: FlowBlock): string {
  const rows = block.nodes.length;
  const width = NODE_W + PAD * 2;
  const height = rows * (NODE_H + ROW_GAP) - ROW_GAP + PAD * 2;
  const centerX = width / 2;

  const positions = new Map<string, { x: number; y: number }>();
  block.nodes.forEach((node, i) => {
    positions.set(node.id, { x: centerX, y: PAD + i * (NODE_H + ROW_GAP) + NODE_H / 2 });
  });

  const edgeMarks = block.edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      const x1 = from.y < to.y ? from.x : from.x;
      const y1 = from.y < to.y ? from.y + NODE_H / 2 : from.y - NODE_H / 2;
      const y2 = from.y < to.y ? to.y - NODE_H / 2 : to.y + NODE_H / 2;
      const label = edge.label
        ? `<text x="${x1 + 10}" y="${(y1 + y2) / 2}" font-size="12" class="diagram-muted">${escapeHtml(edge.label)}</text>`
        : "";
      return `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y2}" class="diagram-line" marker-end="url(#arrow)" stroke-width="1.5" />${label}`;
    })
    .join("\n");

  const nodeMarks = block.nodes
    .map((node) => {
      const pos = positions.get(node.id);
      if (!pos) return "";
      const x = pos.x - NODE_W / 2;
      const y = pos.y - NODE_H / 2;
      const isTerminal = node.kind === "start" || node.kind === "end";
      const isDecision = node.kind === "decision";
      const shape = isDecision
        ? diamond(pos.x, pos.y, NODE_W * 0.55, NODE_H * 0.9, "diagram-node diagram-node--decision")
        : `<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="8" class="${isTerminal ? "diagram-node diagram-node--terminal" : "diagram-node"}" stroke-width="1.25" />`;
      const textClass = isTerminal ? "diagram-node-label diagram-node-label--invert" : "diagram-node-label";
      return `${shape}<text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" font-size="13" class="${textClass}">${wrapText(node.label, NODE_LABEL_WRAP_CHARS, pos.x)}</text>`;
    })
    .join("\n");

  return svgWrapper(
    width,
    height,
    `${arrowMarker()}${edgeMarks}\n${nodeMarks}`,
  );
}

export function renderSequenceSvg(block: SequenceBlock): string {
  const laneGap = 180;
  const width = block.participants.length * laneGap + PAD * 2;
  const messageGap = 44;
  const top = 64;
  const height = top + block.messages.length * messageGap + PAD;

  const laneX = new Map<string, number>();
  block.participants.forEach((p, i) => laneX.set(p.id, PAD + laneGap / 2 + i * laneGap));

  const lifelines = block.participants
    .map((p) => {
      const x = laneX.get(p.id) ?? 0;
      return `<line x1="${x}" y1="${top}" x2="${x}" y2="${height - PAD}" class="diagram-line" stroke-dasharray="3 4" />
      <rect x="${x - 70}" y="16" width="140" height="34" rx="6" class="diagram-node" />
      <text x="${x}" y="38" text-anchor="middle" font-size="13">${escapeHtml(p.label)}</text>`;
    })
    .join("\n");

  const messages = block.messages
    .map((m, i) => {
      const y = top + (i + 1) * messageGap;
      const x1 = laneX.get(m.from) ?? PAD;
      const x2 = laneX.get(m.to) ?? PAD;
      const dashed = m.kind === "async" || m.kind === "return" ? `stroke-dasharray="5 4"` : "";
      const midX = (x1 + x2) / 2;
      return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="diagram-line" marker-end="url(#arrow)" ${dashed} stroke-width="1.25" />
      <text x="${midX}" y="${y - 6}" text-anchor="middle" font-size="12" class="diagram-muted">${escapeHtml(m.label)}</text>`;
    })
    .join("\n");

  return svgWrapper(width, height, `${arrowMarker()}${lifelines}\n${messages}`);
}

export function renderArchitectureSvg(block: ArchitectureBlock): string {
  type ArchNode = ArchitectureBlock["nodes"][number];
  const groups = new Map<string, ArchNode[]>();
  for (const node of block.nodes) {
    const key = node.group ?? "_";
    const list = groups.get(key) ?? [];
    list.push(node);
    groups.set(key, list);
  }
  const groupKeys = Array.from(groups.keys());
  const colW = 220;
  const width = groupKeys.length * colW + PAD * 2;
  const maxRows = Math.max(...groupKeys.map((k) => (groups.get(k) ?? []).length));
  const height = PAD * 2 + 40 + maxRows * (NODE_H + 20);

  const positions = new Map<string, { x: number; y: number }>();
  const groupLabels: string[] = [];
  groupKeys.forEach((key, colIndex) => {
    const nodes = groups.get(key) ?? [];
    const x = PAD + colIndex * colW + colW / 2;
    if (key !== "_") {
      groupLabels.push(
        `<text x="${x}" y="${PAD + 16}" text-anchor="middle" font-size="12" class="diagram-muted">${escapeHtml(key)}</text>`,
      );
    }
    nodes.forEach((node, rowIndex) => {
      positions.set(node.id, { x, y: PAD + 40 + rowIndex * (NODE_H + 20) + NODE_H / 2 });
    });
  });

  const edges = block.edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="diagram-line" marker-end="url(#arrow)" stroke-width="1.25" />`;
    })
    .join("\n");

  const nodes = block.nodes
    .map((node) => {
      const pos = positions.get(node.id);
      if (!pos) return "";
      return `<rect x="${pos.x - NODE_W / 2}" y="${pos.y - NODE_H / 2}" width="${NODE_W}" height="${NODE_H}" rx="8" class="diagram-node" stroke-width="1.25" />
      <text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" font-size="13">${wrapText(node.label, NODE_LABEL_WRAP_CHARS, pos.x)}</text>`;
    })
    .join("\n");

  return svgWrapper(width, height, `${arrowMarker()}${edges}\n${groupLabels.join("\n")}\n${nodes}`);
}

export function renderChartSvg(block: ChartBlock): string {
  const width = 640;
  const height = 260;
  const plotTop = 20;
  const plotBottom = height - 40;
  const plotLeft = 48;
  const plotRight = width - 16;
  const allValues = block.series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = Math.max(max - min, 1);
  const yFor = (value: number) => plotTop + ((max - value) / range) * (plotBottom - plotTop);

  const catCount = block.categories.length;
  const bandWidth = (plotRight - plotLeft) / catCount;
  const seriesCount = block.series.length;
  const zeroY = yFor(0);

  const grid = Array.from({ length: 5 }, (_, i) => {
    const y = plotTop + ((plotBottom - plotTop) * i) / 4;
    return `<line x1="${plotLeft}" y1="${y.toFixed(1)}" x2="${plotRight}" y2="${y.toFixed(1)}" class="chart-grid" />`;
  }).join("\n");
  const axis = `<line x1="${plotLeft}" y1="${zeroY.toFixed(1)}" x2="${plotRight}" y2="${zeroY.toFixed(1)}" class="chart-axis" />`;

  const bars = block.series
    .flatMap((series, si) =>
      series.values.slice(0, catCount).map((value, ci) => {
        const barWidth = (bandWidth - 12) / seriesCount;
        const x = plotLeft + ci * bandWidth + 6 + si * barWidth;
        const valueY = yFor(value);
        const y = Math.min(valueY, zeroY);
        const barHeight = Math.max(Math.abs(zeroY - valueY), 1);
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" class="chart-bar" data-series="${si}" rx="2" />`;
      }),
    )
    .join("\n");

  const lines = block.series
    .map((series, si) => {
      const points = series.values
        .slice(0, catCount)
        .map((value, ci) => {
          const x = plotLeft + ci * bandWidth + bandWidth / 2;
          return `${x.toFixed(1)},${yFor(value).toFixed(1)}`;
        })
        .join(" ");
      const dots = series.values
        .slice(0, catCount)
        .map((value, ci) => {
          const x = plotLeft + ci * bandWidth + bandWidth / 2;
          return `<circle cx="${x.toFixed(1)}" cy="${yFor(value).toFixed(1)}" r="3" class="chart-point" data-series="${si}" />`;
        })
        .join("\n");
      return `<polyline points="${points}" class="chart-line" data-series="${si}" />\n${dots}`;
    })
    .join("\n");

  const labels = block.categories
    .map((cat, i) => {
      const x = plotLeft + i * bandWidth + bandWidth / 2;
      return `<text x="${x}" y="${plotBottom + 18}" text-anchor="middle" font-size="11">${escapeHtml(cat)}</text>`;
    })
    .join("\n");

  const marks = block.kind === "line" ? lines : bars;
  return svgWrapper(width, height, `${grid}\n${axis}\n${marks}\n${labels}`);
}

function svgWrapper(width: number, height: number, inner: string): string {
  const w = Math.round(width);
  const h = Math.round(height);
  // Real width/height (not just viewBox) so the SVG's intrinsic size is
  // 1 layout unit = 1px — CSS then only ever shrinks it (max-width: 100%),
  // never stretches a narrow diagram up to fill a much wider column.
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" role="img" focusable="false">${inner}</svg>`;
}

function arrowMarker(): string {
  return `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="diagram-accent" /></marker></defs>`;
}

function diamond(cx: number, cy: number, w: number, h: number, className: string): string {
  const hw = w / 2;
  const hh = h / 2;
  return `<polygon points="${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}" class="${className}" stroke-width="1.25" />`;
}

function wrapText(label: string, maxChars: number, x: number): string {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  const startDy = -((lines.length - 1) * 7);
  return lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? startDy : 14}">${escapeHtml(line)}</tspan>`)
    .join("");
}
