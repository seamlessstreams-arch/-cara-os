// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING LEADERSHIP PACK (§31)
//
// Turns one OrgLearningReport into a pack a leadership team (or Reg 45 review)
// can take away: the headline, every learning section with its themes and
// weights, the honest "not enough data" flags carried forward — a section Cara
// could not read is said plainly, never rendered as an empty success — the
// regulatory links and the engine's own disclaimer. Pure model + HTML + JSON
// here; the .docx renderer lives beside it so the model stays trivially
// testable.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  LearningTheme,
  OrgLearningReport,
  OrgLearningReportSection,
  ThemeWeight,
} from "./types";
import { londonDateTimeStr } from "@/lib/utils";

export const ORG_LEARNING_EXPORT_VERSION = "1.0.0";

export const WEIGHT_LABELS: Record<ThemeWeight, string> = {
  priority: "Priority",
  watch: "Watch",
  notable: "Notable",
  positive: "Positive practice",
};

const INSUFFICIENT_DATA_STATEMENT =
  "Not enough data this period to read this honestly — treat the silence as a gap in the records, not as an all-clear.";

export interface OrgLearningExportModel {
  version: string;
  header: {
    homeName: string;
    periodLabel: string;
    asOf: string;
    windowDays: number;
    generatedAt: string;
    engineVersion: string;
  };
  headline: string;
  sections: Array<{
    key: OrgLearningReportSection["key"];
    label: string;
    insufficientData: boolean;
    insufficientDataStatement: string | null;
    themes: Array<{
      weight: ThemeWeight;
      weightLabel: string;
      title: string;
      detail: string;
      evidenceCount: number;
    }>;
  }>;
  totalEvidence: number;
  regulatoryLinks: string[];
  disclaimer: string;
}

const themeOrder: Record<ThemeWeight, number> = { priority: 0, watch: 1, notable: 2, positive: 3 };

function exportTheme(t: LearningTheme) {
  return {
    weight: t.weight,
    weightLabel: WEIGHT_LABELS[t.weight],
    title: t.title,
    detail: t.detail,
    evidenceCount: t.evidenceCount,
  };
}

export function buildOrgLearningExportModel(
  report: OrgLearningReport,
  opts: { homeName: string; generatedAt?: string },
): OrgLearningExportModel {
  return {
    version: ORG_LEARNING_EXPORT_VERSION,
    header: {
      homeName: opts.homeName,
      periodLabel: report.periodLabel,
      asOf: report.asOf,
      windowDays: report.windowDays,
      generatedAt: opts.generatedAt ?? new Date().toISOString(),
      engineVersion: report.engineVersion,
    },
    headline: report.headline,
    sections: report.sections.map((s) => ({
      key: s.key,
      label: s.label,
      insufficientData: s.insufficientData,
      insufficientDataStatement: s.insufficientData ? INSUFFICIENT_DATA_STATEMENT : null,
      themes: [...s.themes]
        .sort((a, b) => themeOrder[a.weight] - themeOrder[b.weight])
        .map(exportTheme),
    })),
    totalEvidence: report.totalEvidence,
    regulatoryLinks: report.regulatoryLinks,
    disclaimer: report.disclaimer,
  };
}

export function renderOrgLearningJson(model: OrgLearningExportModel): string {
  return JSON.stringify(model, null, 2);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderOrgLearningHtml(model: OrgLearningExportModel): string {
  const h = model.header;

  const sectionsHtml = model.sections
    .map((s) => {
      const body = s.insufficientData
        ? `<p class="insufficient">${esc(s.insufficientDataStatement ?? "")}</p>`
        : s.themes.length
          ? `<ul>${s.themes
              .map(
                (t) =>
                  `<li class="weight-${t.weight}"><span class="weight">${esc(t.weightLabel)}</span> <strong>${esc(t.title)}</strong><br>${esc(t.detail)} <span class="evidence">(${t.evidenceCount} evidence record${t.evidenceCount === 1 ? "" : "s"})</span></li>`,
              )
              .join("")}</ul>`
          : `<p class="none">Looked, and found nothing this period.</p>`;
      return `<section class="learning"><h2>${esc(s.label)}</h2>${body}</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Organisational Learning — ${esc(h.homeName)} — ${esc(h.periodLabel)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; margin: 2.5rem auto; max-width: 48rem; color: #1a1a1a; line-height: 1.55; }
  .meta, .evidence, .none { color: #555; font-size: 0.9rem; }
  .headline { font-size: 1.05rem; border-left: 4px solid #333; padding-left: 0.9rem; margin: 1.2rem 0; }
  .insufficient { border: 1px dashed #999; padding: 0.6rem 0.9rem; color: #555; font-style: italic; }
  section { margin: 1.1rem 0; }
  h2 { border-bottom: 1px solid #ccc; padding-bottom: 0.15rem; }
  .weight { display: inline-block; border: 1px solid #777; border-radius: 3px; padding: 0 0.4rem; font-size: 0.78rem; margin-right: 0.35rem; }
  li { margin-bottom: 0.6rem; }
  .disclaimer { border: 1px solid #999; padding: 0.8rem 1rem; font-weight: 600; margin-top: 1.5rem; font-size: 0.92rem; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>
<header>
  <h1>Organisational Learning</h1>
  <p class="meta">${esc(h.homeName)} · ${esc(h.periodLabel)} (last ${h.windowDays} days, as of ${esc(h.asOf)})</p>
  <p class="meta">Pack generated ${esc(londonDateTimeStr(h.generatedAt))} · engine v${esc(h.engineVersion)} · export v${esc(model.version)}</p>
</header>

<p class="headline">${esc(model.headline)}</p>

${sectionsHtml}

<section>
  <h2>Coverage and regulation</h2>
  <p class="meta">${model.totalEvidence} evidence record${model.totalEvidence === 1 ? "" : "s"} across the period.</p>
  ${model.regulatoryLinks.length ? `<ul>${model.regulatoryLinks.map((r) => `<li class="meta">${esc(r)}</li>`).join("")}</ul>` : ""}
</section>

<p class="disclaimer">${esc(model.disclaimer)}</p>
</body>
</html>`;
}
