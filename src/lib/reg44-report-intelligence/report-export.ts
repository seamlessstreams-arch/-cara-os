// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT EXPORT (pure model + HTML/JSON/Reg45 renderers)
//
// Turns the assembled A–Q report (+ any sign-off / addenda) into an export model
// and renders it to print-ready HTML (→ PDF via the browser), a JSON payload, and
// a standalone Reg 45 EVIDENCE-EXTRACT (evidence only — never the Reg 45 review).
// The .docx binary is rendered separately (report-docx.ts) from the same model.
// Deterministic; no store access. Child voice is already anonymised upstream.
// ══════════════════════════════════════════════════════════════════════════════

import type { Reg44ReportAssembly } from "./report-assembly";
import type { PersistedReg44Report } from "./report-lifecycle";

export const REG44_EXPORT_VERSION = "1.0.0";

export interface Reg44ExportModel {
  header: { homeName: string; ofstedUrn: string; month: string; generatedAt: string; visitorName: string; visitDate: string };
  sections: Array<{ key: string; label: string; content: string }>;
  signOff: { signed: boolean; signedBy: string | null; signedAt: string | null; decision: string | null; overrideReason: string | null; locked: boolean };
  addenda: Array<{ at: string; author: string; text: string }>;
  reg45Extract: string;
  disclaimer: string;
}

export function buildReg44ExportModel(
  assembly: Reg44ReportAssembly,
  opts: { homeName: string; ofstedUrn?: string; generatedAt: string; visitorName?: string; visitDate?: string; persisted?: PersistedReg44Report | null },
): Reg44ExportModel {
  const p = opts.persisted ?? null;
  const reg45Section = assembly.sections.find((s) => s.key === "N");
  return {
    header: {
      homeName: opts.homeName,
      ofstedUrn: opts.ofstedUrn ?? "",
      month: assembly.month,
      generatedAt: opts.generatedAt,
      visitorName: opts.visitorName ?? p?.draft.meta.visitorName ?? "",
      visitDate: opts.visitDate ?? p?.draft.meta.visitDate ?? "",
    },
    sections: assembly.sections.map((s) => ({ key: s.key, label: s.label, content: s.content })),
    signOff: {
      signed: !!p && p.status !== "draft" && p.locked,
      signedBy: p?.draft.signOff.signedBy ?? null,
      signedAt: p?.draft.signOff.signedAt ?? null,
      decision: p?.draft.signOff.decision ?? null,
      overrideReason: p?.draft.signOff.overrideReason ?? null,
      locked: !!p?.locked,
    },
    addenda: (p?.addenda ?? []).map((a) => ({ at: a.at, author: a.author, text: a.text })),
    reg45Extract:
      (reg45Section?.content ?? "") +
      "\n\nNOTE: This extract is EVIDENCE ONLY to support the Regulation 45 review. It does not constitute the Regulation 45 review, which is a separate six-monthly process led by the responsible individual.",
    disclaimer: assembly.disclaimer,
  };
}

const esc = (s: string): string =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderReg44Html(model: Reg44ExportModel): string {
  const h = model.header;
  const sectionHtml = model.sections
    .map((s) => `<section><h2>${esc(s.key)}. ${esc(s.label)}</h2><p>${esc(s.content).replace(/\n/g, "<br/>")}</p></section>`)
    .join("\n");
  const signOff = model.signOff.signed
    ? `<p><strong>Signed off:</strong> ${esc(model.signOff.decision ?? "")} by ${esc(model.signOff.signedBy ?? "")} on ${esc(model.signOff.signedAt ?? "")}${model.signOff.overrideReason ? ` — override: ${esc(model.signOff.overrideReason)}` : ""}. This report is locked.</p>`
    : `<p><em>Not yet signed off.</em></p>`;
  const addenda = model.addenda.length
    ? `<section><h2>Addenda</h2>${model.addenda.map((a) => `<p><strong>${esc(a.at)} — ${esc(a.author)}:</strong> ${esc(a.text)}</p>`).join("")}</section>`
    : "";
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"/>
<title>Reg 44 Report — ${esc(h.homeName)} — ${esc(h.month)}</title>
<style>
@page { size: A4; margin: 20mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); } }
body { font-family: Georgia, 'Times New Roman', serif; color: #14202a; line-height: 1.5; font-size: 12pt; }
.head { border-bottom: 2px solid #0d9488; padding-bottom: 8px; margin-bottom: 16px; }
.head h1 { margin: 0 0 4px; font-size: 18pt; }
.meta { font-size: 10pt; color: #445; }
h2 { font-size: 13pt; color: #0d9488; margin: 18px 0 4px; border-bottom: 1px solid #e2e8ec; padding-bottom: 2px; }
section { break-inside: avoid; }
p { margin: 4px 0; }
.foot { margin-top: 24px; border-top: 1px solid #e2e8ec; padding-top: 8px; font-size: 9pt; color: #667; font-style: italic; }
</style></head>
<body>
<div class="head">
  <h1>Regulation 44 Independent Visitor — Monthly Visit Report</h1>
  <div class="meta">${esc(h.homeName)}${h.ofstedUrn ? ` · URN ${esc(h.ofstedUrn)}` : ""} · Reporting month: ${esc(h.month)}${h.visitDate ? ` · Visit: ${esc(h.visitDate)}` : ""}${h.visitorName ? ` · Visitor: ${esc(h.visitorName)}` : ""}</div>
</div>
${sectionHtml}
<section><h2>Sign-off and distribution</h2>${signOff}</section>
${addenda}
<div class="foot">${esc(model.disclaimer)} Generated ${esc(h.generatedAt)}.</div>
</body></html>`;
}

export function renderReg44Json(model: Reg44ExportModel): string {
  return JSON.stringify({ schema: "reg44-report", version: REG44_EXPORT_VERSION, ...model }, null, 2);
}

/** Standalone Reg 45 evidence-extract as a small HTML document. */
export function renderReg45ExtractHtml(model: Reg44ExportModel): string {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"/><title>Reg 45 Evidence Extract — ${esc(model.header.homeName)} — ${esc(model.header.month)}</title>
<style>body{font-family:Georgia,serif;color:#14202a;line-height:1.5;font-size:12pt;margin:24px;} h1{font-size:16pt;color:#0d9488;} .note{color:#b7791f;font-style:italic;}</style></head>
<body><h1>Regulation 45 Evidence Extract</h1><p class="meta">${esc(model.header.homeName)} · ${esc(model.header.month)}</p>
<p>${esc(model.reg45Extract).replace(/\n/g, "<br/>")}</p>
<p class="note">Evidence only — not the Regulation 45 review.</p></body></html>`;
}

export { REG44_EXPORT_VERSION as _ev };
