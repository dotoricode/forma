/**
 * Spec migrations.
 *
 * 0.1 described the output with three overlapping fields: `mode` (recorded,
 * never rendered), `theme` (light/dark), and `designSystem` (four CSS themes
 * over one DOM). 0.2 replaces them with `artifact` + `purpose` + `variant` +
 * `colorMode`, where the first three drive a composition contract that is
 * actually enforced.
 *
 * Some of that mapping is genuinely lossy. `workspace` was used both for
 * code review and for test dashboards, and nothing in a 0.1 spec says which.
 * Rather than guess, the migration picks the safer target and emits a
 * warning naming the choice, so a human can correct it.
 */
import {
  DEFAULT_VARIANT,
  type ArtifactKind,
  type Purpose,
  type Variant,
} from "./artifact.js";
import { FORMA_SPEC_VERSION } from "./schema.js";

export interface MigrationWarning {
  field: string;
  message: string;
}

export interface MigrationResult {
  spec: unknown;
  migrated: boolean;
  warnings: MigrationWarning[];
}

/** 0.1 `designSystem` values, including the pre-rename identifiers. */
const DESIGN_SYSTEM_TARGET: Record<string, { artifact: ArtifactKind; variant: Variant }> = {
  simple: { artifact: "report", variant: "technical" },
  workspace: { artifact: "report", variant: "technical" },
  guide: { artifact: "manual", variant: "procedural" },
  magazine: { artifact: "report", variant: "editorial" },
  // pre-rename identifiers, still accepted at the boundary
  "quiet-editorial": { artifact: "report", variant: "technical" },
  "precision-workbench": { artifact: "report", variant: "technical" },
  "developer-docs": { artifact: "manual", variant: "procedural" },
  "editorial-magazine": { artifact: "report", variant: "editorial" },
};

/** 0.1 `mode` values map onto purpose, except the two that name an artifact. */
const MODE_TO_PURPOSE: Record<string, Purpose> = {
  explain: "explain",
  review: "decide",
  test: "diagnose",
  report: "decide",
  manual: "operate",
};

const MODE_TO_ARTIFACT: Partial<Record<string, ArtifactKind>> = {
  report: "report",
  manual: "manual",
};

const MODE_TO_VARIANT: Partial<Record<string, Variant>> = {
  test: "release-gate",
  postmortem: "postmortem",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Normalizes any accepted spec version to the current one. A spec that is
 * already 0.2 passes through untouched so re-running the migration is a
 * no-op rather than a slow rewrite.
 */
export function migrateSpec(input: unknown): MigrationResult {
  if (!isRecord(input)) return { spec: input, migrated: false, warnings: [] };
  if (input["version"] === FORMA_SPEC_VERSION) {
    return { spec: input, migrated: false, warnings: [] };
  }
  if (input["version"] !== "0.1") {
    return { spec: input, migrated: false, warnings: [] };
  }

  const warnings: MigrationWarning[] = [];
  const meta = isRecord(input["meta"]) ? input["meta"] : {};

  const mode = typeof meta["mode"] === "string" ? meta["mode"] : undefined;
  const designSystem =
    typeof meta["designSystem"] === "string" ? meta["designSystem"] : undefined;
  const theme = typeof meta["theme"] === "string" ? meta["theme"] : undefined;

  const fromDesign = designSystem ? DESIGN_SYSTEM_TARGET[designSystem] : undefined;
  if (designSystem && !fromDesign) {
    warnings.push({
      field: "meta.designSystem",
      message: `unknown 0.1 designSystem '${designSystem}' — defaulting to artifact 'report'.`,
    });
  }

  // A 0.1 mode of report/manual names the artifact outright and is the
  // stronger signal; designSystem only ever named a look.
  const artifact: ArtifactKind =
    (mode ? MODE_TO_ARTIFACT[mode] : undefined) ?? fromDesign?.artifact ?? "report";

  if (designSystem === "workspace") {
    warnings.push({
      field: "meta.designSystem",
      message:
        "'workspace' was used for both code review and test dashboards. Migrated to artifact 'report' / variant 'technical'. If this document is a metrics view, set artifact 'dashboard' and variant 'diagnostic' by hand.",
    });
  }

  const variant: Variant =
    (mode ? MODE_TO_VARIANT[mode] : undefined) ?? fromDesign?.variant ?? DEFAULT_VARIANT[artifact];

  const purpose: Purpose = (mode ? MODE_TO_PURPOSE[mode] : undefined) ?? "explain";
  if (!mode) {
    warnings.push({
      field: "meta.mode",
      message: "0.1 spec had no mode — purpose defaulted to 'explain'.",
    });
  }

  const {
    mode: _droppedMode,
    theme: _droppedTheme,
    designSystem: _droppedDesign,
    ...restMeta
  } = meta;

  return {
    migrated: true,
    warnings,
    spec: {
      ...input,
      version: FORMA_SPEC_VERSION,
      meta: {
        ...restMeta,
        artifact,
        purpose,
        variant,
        ...(theme ? { colorMode: theme } : {}),
      },
    },
  };
}

export function formatMigrationWarnings(warnings: readonly MigrationWarning[]): string {
  return warnings.map((w) => `  - ${w.field}: ${w.message}`).join("\n");
}
