/**
 * Metric checks.
 *
 * The way a dashboard misleads is almost never a wrong number. It is a
 * right number with no basis: 95.2% with no period, a delta with nothing to
 * compare against, a chart with no reading. Each of those is individually
 * defensible and collectively produces a screen that looks authoritative
 * and cannot be acted on.
 *
 * These are errors on the dashboard artifact, which promised to answer
 * "when is this data from" in its contract.
 */
import type { FormaSpec } from "../spec/schema.js";
import type { PlanIssue } from "./plan.js";

interface MetricLike {
  id: string;
  label?: string;
  period?: string;
  unit?: string;
  value?: unknown;
}

interface DashboardBlockLike {
  id: string;
  type: string;
  period?: string;
  unit?: string;
  label?: string;
  metrics?: MetricLike[];
}

export function checkMetrics(spec: FormaSpec): PlanIssue[] {
  if (spec.meta.artifact !== "dashboard" && spec.meta.artifact !== "advanced") return [];

  const issues: PlanIssue[] = [];
  const blocks = spec.sections as unknown as DashboardBlockLike[];

  const complain = (blockId: string, label: string) => {
    issues.push({
      severity: "error",
      code: "metric-without-context",
      message: `metric '${label}' (${blockId}) has no period. A number with no "as of when" reads as current simply because it is on screen.`,
    });
  };

  for (const block of blocks) {
    if (block.type === "metric" && !block.period) {
      complain(block.id, block.label ?? block.id);
    }
    if (block.type === "metric-group") {
      for (const entry of block.metrics ?? []) {
        if (!entry.period) complain(block.id, entry.label ?? entry.id);
      }
    }
  }

  // A dashboard whose metrics all carry a period but whose freshness block
  // is missing still leaves the reader without a single answer to "how old
  // is this screen". The contract requires the role; this names the reason.
  const hasFreshness = blocks.some((block) => block.type === "data-freshness");
  const hasMetrics = blocks.some(
    (block) => block.type === "metric" || block.type === "metric-group",
  );
  if (hasMetrics && !hasFreshness && spec.meta.artifact === "dashboard") {
    issues.push({
      severity: "error",
      code: "dashboard-without-freshness",
      message:
        "this dashboard shows metrics but has no data-freshness block. The reader cannot tell how old the screen is.",
    });
  }

  return issues;
}
