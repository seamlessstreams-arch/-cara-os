// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEVELOPMENT PACK (§31)
//
// Turns one StaffPracticeSkillsProfile into a pack a supervisor can take into
// supervision or an appraisal: the five practice lenses with their signals,
// strengths and growing edges, the supervision prompts grouped by kind, and
// the honest read — never a rank or a grade. hasData=false is said plainly:
// no practice signal on record is a RECORDING gap, not a judgement of the
// person. Pure model + HTML + JSON here; the .docx renderer lives beside it so
// the model stays trivially testable.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  PracticeLens,
  SkillSignal,
  StaffPracticeSkillsProfile,
  StaffSupervisionPrompt,
} from "./types";

export const STAFF_SKILLS_EXPORT_VERSION = "1.0.0";

export const OVERALL_LABELS: Record<StaffPracticeSkillsProfile["overallPicture"], string> = {
  emerging: "Emerging",
  developing_well: "Developing well",
  well_established: "Well established",
  insufficient_data: "Insufficient data to read honestly",
};

export const SIGNAL_LABELS: Record<SkillSignal, string> = {
  strong: "Strong",
  developing: "Developing",
  needs_support: "Needs support",
  no_data: "No data in window",
};

export const PROMPT_KIND_LABELS: Record<StaffSupervisionPrompt["kind"], string> = {
  development: "Development",
  strength: "Strength to build on",
  wellbeing: "Wellbeing",
};

export const NO_DATA_STATEMENT =
  "No practice signal of any kind is on record in this window. That is a recording gap to close, not a judgement of the person.";

export const TONE_NOTE =
  "This pack is developmental — it shapes a supervision conversation and is never a rank, a grade or a performance score.";

export interface StaffSkillsExportModel {
  version: string;
  toneNote: string;
  header: {
    staffId: string;
    staffName: string;
    asOf: string;
    windowDays: number;
    generatedAt: string;
    engineVersion: string;
  };
  hasData: boolean;
  noDataStatement: string | null;
  overallPicture: StaffPracticeSkillsProfile["overallPicture"];
  overallLabel: string;
  lenses: Array<{
    key: PracticeLens["key"];
    label: string;
    signal: SkillSignal;
    signalLabel: string;
    detail: string;
    sourceCount: number;
  }>;
  strengths: string[];
  developmentAreas: string[];
  promptGroups: Array<{
    kind: StaffSupervisionPrompt["kind"];
    label: string;
    prompts: string[];
  }>;
  disclaimer: string;
}

export function buildStaffSkillsExportModel(
  profile: StaffPracticeSkillsProfile,
  generatedAt: string = new Date().toISOString(),
): StaffSkillsExportModel {
  const kinds: StaffSupervisionPrompt["kind"][] = ["development", "strength", "wellbeing"];
  return {
    version: STAFF_SKILLS_EXPORT_VERSION,
    toneNote: TONE_NOTE,
    header: {
      staffId: profile.staffId,
      staffName: profile.staffName,
      asOf: profile.asOf,
      windowDays: profile.windowDays,
      generatedAt,
      engineVersion: profile.engineVersion,
    },
    hasData: profile.hasData,
    noDataStatement: profile.hasData ? null : NO_DATA_STATEMENT,
    overallPicture: profile.overallPicture,
    overallLabel: OVERALL_LABELS[profile.overallPicture],
    lenses: profile.lenses.map((l) => ({
      key: l.key,
      label: l.label,
      signal: l.signal,
      signalLabel: SIGNAL_LABELS[l.signal],
      detail: l.detail,
      sourceCount: l.sources.length,
    })),
    strengths: profile.strengths,
    developmentAreas: profile.developmentAreas,
    promptGroups: kinds
      .map((kind) => ({
        kind,
        label: PROMPT_KIND_LABELS[kind],
        prompts: profile.supervisionPrompts.filter((p) => p.kind === kind).map((p) => p.prompt),
      }))
      .filter((g) => g.prompts.length > 0),
    disclaimer: profile.disclaimer,
  };
}

export function renderStaffSkillsJson(model: StaffSkillsExportModel): string {
  return JSON.stringify(model, null, 2);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderStaffSkillsHtml(model: StaffSkillsExportModel): string {
  const h = model.header;

  const lensesHtml = model.lenses
    .map(
      (l) => `
    <section class="lens signal-${l.signal}">
      <h3>${esc(l.label)} <span class="signal">${esc(l.signalLabel)}</span></h3>
      <p>${esc(l.detail)}</p>
      <p class="sources">${l.sourceCount} source record${l.sourceCount === 1 ? "" : "s"}</p>
    </section>`,
    )
    .join("");

  const listBlock = (title: string, items: string[]) => `
    <section class="list-block">
      <h3>${esc(title)}</h3>
      ${items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="none">None recorded in this window.</p>`}
    </section>`;

  const promptsHtml = model.promptGroups.length
    ? model.promptGroups
        .map(
          (g) => `
    <section class="prompts">
      <h3>${esc(g.label)}</h3>
      <ul>${g.prompts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </section>`,
        )
        .join("")
    : `<p class="none">No supervision prompts generated for this window.</p>`;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Staff Development Pack — ${esc(h.staffName)}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; margin: 2.5rem auto; max-width: 48rem; color: #1a1a1a; line-height: 1.55; }
  .meta, .sources, .none { color: #555; font-size: 0.9rem; }
  .tone { border: 1px solid #999; padding: 0.8rem 1rem; font-weight: 600; margin: 1.2rem 0; }
  .nodata { border: 1px dashed #999; padding: 0.8rem 1rem; color: #555; font-style: italic; margin: 1.2rem 0; }
  .overall { font-size: 1.05rem; border-left: 4px solid #333; padding-left: 0.9rem; margin: 1.2rem 0; }
  section { margin: 1.1rem 0; }
  h2 { border-bottom: 1px solid #ccc; padding-bottom: 0.15rem; }
  .signal { display: inline-block; border: 1px solid #777; border-radius: 3px; padding: 0 0.4rem; font-size: 0.78rem; margin-left: 0.35rem; }
  @media print { body { margin: 0.5in; } }
</style>
</head>
<body>
<header>
  <h1>Staff Development Pack</h1>
  <p class="meta">${esc(h.staffName)} · last ${h.windowDays} days, as of ${esc(h.asOf)}</p>
  <p class="meta">Pack generated ${esc(h.generatedAt.slice(0, 16).replace("T", " "))} · engine v${esc(h.engineVersion)} · export v${esc(model.version)}</p>
</header>

<p class="tone">${esc(model.toneNote)}</p>
${model.noDataStatement ? `<p class="nodata">${esc(model.noDataStatement)}</p>` : ""}

<p class="overall">Overall picture: <strong>${esc(model.overallLabel)}</strong></p>

<h2>The five practice lenses</h2>
${lensesHtml}

${listBlock("Strengths", model.strengths)}
${listBlock("Growing edges", model.developmentAreas)}

<h2>Supervision prompts</h2>
${promptsHtml}

<p class="tone">${esc(model.disclaimer)}</p>
</body>
</html>`;
}
