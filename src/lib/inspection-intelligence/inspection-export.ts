// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE EXPORT (§23)
//
// Turns the Inspection Intelligence projection (buildInspectionReadiness) into an
// inspector-readable evidence pack — for ALL three SCCIF judgement areas, or one
// area at a time (a "per-subject" export a manager can take into a focused
// conversation). Pure model + HTML + JSON here; the .docx renderer lives beside
// it so the model stays trivially testable.
//
// HARD RULE (matches the engine): this pack inventories EVIDENCE and GAPS. It
// NEVER predicts or implies an Ofsted grade — that is the inspector's judgement.
// The no-grade statement is carried on every export and the renderers emit no
// grade vocabulary.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  EvidenceStrength,
  InspectionReadiness,
  SccifArea,
  SccifAreaKey,
} from "./inspection-intelligence-engine";

export const INSPECTION_EXPORT_VERSION = "1.0.0";

export const NO_GRADE_STATEMENT =
  "This pack inventories the evidence the home can show and the gaps an inspector may probe, mapped to the SCCIF judgement areas. It does NOT predict, imply or pre-empt an Ofsted grade — the judgement is the inspector's. Use it to prepare, not to self-grade.";

export type ExportScope = SccifAreaKey | "all";

export const AREA_LABELS: Record<SccifAreaKey, string> = {
  experiences_progress: "The overall experiences and progress of children and young people",
  protection: "How well children and young people are helped and protected",
  leadership: "The effectiveness of leaders and managers",
};

const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong evidence available",
  developing: "Developing — some evidence, some gaps",
  limited: "Limited — evidence gaps an inspector would probe",
};

export interface InspectionExportModel {
  header: {
    homeName: string;
    generatedAt: string;
    scope: ExportScope;
    scopeLabel: string;
    headline: string;
    areasStrong: number;
    areasDeveloping: number;
    areasLimited: number;
  };
  noGradeStatement: string;
  /** Only the priorities relevant to the scope (all → every priority). */
  priorities: { area: string; label: string; detail: string; children: string[] }[];
  areas: Array<{
    key: SccifAreaKey;
    label: string;
    strengthLabel: string;
    strength: EvidenceStrength;
    summary: string;
    evidence: { label: string; count: number; detail: string }[];
    gaps: { label: string; severity: "high" | "medium"; detail: string; children: string[] }[];
  }>;
  version: string;
}

export function buildInspectionExportModel(
  readiness: InspectionReadiness,
  opts: { homeName?: string; scope?: ExportScope } = {}
): InspectionExportModel {
  const scope: ExportScope = opts.scope ?? "all";
  const areasIn: SccifArea[] = scope === "all" ? readiness.areas : readiness.areas.filter((a) => a.key === scope);
  const scopeLabels = scope === "all" ? "All three SCCIF judgement areas" : AREA_LABELS[scope];

  const priorities = readiness.priorities
    .filter((p) => scope === "all" || areasIn.some((a) => a.label === p.area))
    .map((p) => ({ area: p.area, label: p.label, detail: p.detail, children: (p.childRefs ?? []).map((c) => c.name) }));

  const areas = areasIn.map((a) => ({
    key: a.key,
    label: a.label,
    strengthLabel: STRENGTH_LABEL[a.strength],
    strength: a.strength,
    summary: a.summary,
    evidence: a.evidence.map((e) => ({ label: e.label, count: e.count, detail: e.detail })),
    gaps: a.gaps.map((g) => ({ label: g.label, severity: g.severity, detail: g.detail, children: (g.childRefs ?? []).map((c) => c.name) })),
  }));

  return {
    header: {
      homeName: opts.homeName || "The home",
      generatedAt: readiness.generatedAt,
      scope,
      scopeLabel: scopeLabels,
      headline: readiness.headline,
      areasStrong: readiness.areasStrong,
      areasDeveloping: readiness.areasDeveloping,
      areasLimited: readiness.areasLimited,
    },
    noGradeStatement: NO_GRADE_STATEMENT,
    priorities,
    areas,
    version: INSPECTION_EXPORT_VERSION,
  };
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderInspectionJson(model: InspectionExportModel): string {
  return JSON.stringify(model, null, 2);
}

export function renderInspectionHtml(model: InspectionExportModel): string {
  const h = model.header;
  const prioritiesHtml = model.priorities.length
    ? `<section class="priorities"><h2>Priority gaps to address first</h2><ul>${model.priorities
        .map((p) => `<li><strong>${esc(p.label)}</strong> <span class="area">(${esc(p.area)})</span><br>${esc(p.detail)}${p.children.length ? `<br><span class="children">Children: ${esc(p.children.join(", "))}</span>` : ""}</li>`)
        .join("")}</ul></section>`
    : "";

  const areasHtml = model.areas
    .map(
      (a) => `
    <section class="area strength-${a.strength}">
      <h2>${esc(a.label)}</h2>
      <p class="strength">${esc(a.strengthLabel)}</p>
      <p class="summary">${esc(a.summary)}</p>
      <h3>Evidence available</h3>
      ${
        a.evidence.length
          ? `<table><thead><tr><th>Evidence</th><th>Count</th><th>Detail</th></tr></thead><tbody>${a.evidence
              .map((e) => `<tr><td>${esc(e.label)}</td><td class="num">${e.count}</td><td>${esc(e.detail)}</td></tr>`)
              .join("")}</tbody></table>`
          : `<p class="none">No evidence catalogued for this area yet.</p>`
      }
      <h3>Gaps an inspector may probe</h3>
      ${
        a.gaps.length
          ? `<ul class="gaps">${a.gaps
              .map((g) => `<li class="sev-${g.severity}"><strong>${esc(g.label)}</strong> — ${esc(g.detail)}${g.children.length ? `<br><span class="children">Children: ${esc(g.children.join(", "))}</span>` : ""}</li>`)
              .join("")}</ul>`
          : `<p class="none">No open gaps flagged for this area.</p>`
      }
    </section>`
    )
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Inspection Evidence Pack — ${esc(h.scopeLabel)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; color: #1f2a30; line-height: 1.5; max-width: 860px; margin: 0 auto; padding: 32px 20px; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 26px 0 8px; border-bottom: 2px solid #e2e8ec; padding-bottom: 4px; }
  h3 { font-size: 14px; margin: 16px 0 6px; color: #37424a; }
  .meta { color: #6c7a83; font-size: 13px; margin-bottom: 16px; }
  .nograde { background: #fff8e6; border: 1px solid #f0dcb0; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #7a5c11; margin: 16px 0 8px; }
  .counts span { display: inline-block; margin-right: 14px; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; margin: 6px 0; }
  th, td { border: 1px solid #e2e8ec; padding: 6px 8px; text-align: left; vertical-align: top; } th { background: #f5f8fa; }
  td.num { text-align: center; width: 60px; font-variant-numeric: tabular-nums; }
  ul.gaps li.sev-high { color: #a3341f; } ul.gaps li.sev-medium { color: #8a6d1f; }
  .children { color: #6c7a83; font-size: 12px; } .none { color: #8a97a0; font-style: italic; font-size: 13px; }
  .area.strength-strong h2 { color: #0d7a5f; } .area.strength-limited h2 { color: #a3341f; }
  .priorities { background: #fdf1e7; border: 1px solid #f0cdb0; border-radius: 8px; padding: 4px 16px 12px; }
  footer { margin-top: 30px; color: #8a97a0; font-size: 11px; border-top: 1px solid #e2e8ec; padding-top: 10px; }
</style></head><body>
  <h1>Inspection Evidence Pack</h1>
  <p class="meta">${esc(h.homeName)} · ${esc(h.scopeLabel)} · generated ${esc(h.generatedAt)}</p>
  <p class="meta">${esc(h.headline)}</p>
  <p class="counts"><span>Strong: <strong>${h.areasStrong}</strong></span><span>Developing: <strong>${h.areasDeveloping}</strong></span><span>Limited: <strong>${h.areasLimited}</strong></span></p>
  <div class="nograde">${esc(model.noGradeStatement)}</div>
  ${prioritiesHtml}
  ${areasHtml}
  <footer>Cara Inspection Intelligence · deterministic evidence projection · v${esc(model.version)}. No Ofsted grade is predicted or implied.</footer>
</body></html>`;
}
