// ══════════════════════════════════════════════════════════════════════════════
// ARIA Studio — Regulation 45 Report Builder
//
// Composes a draft Regulation 45 report from manager-accepted /
// included-in-report evidence chips. ARIA produces draft narrative;
// the manager edits, reviews, approves and locks. Locked reports are
// immutable and feed Annex A Section 9 evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import {
  ARIA_REG45_THEME_LABELS,
  type AriaReg45EvidenceItem,
  type AriaReg45Report,
  type AriaReg45ReportSection,
  type AriaReg45Theme,
} from "@/types/aria-studio";

const DEFAULT_PERIOD_DAYS = 180;

function defaultPeriod(): { periodStart: string; periodEnd: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - DEFAULT_PERIOD_DAYS);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

function inPeriod(d: string | null | undefined, start: string, end: string): boolean {
  if (!d) return false;
  const day = d.slice(0, 10);
  return day >= start && day <= end;
}

function summariseTheme(theme: AriaReg45Theme, items: AriaReg45EvidenceItem[]): string {
  if (items.length === 0) return "No evidence accepted in this period.";
  const concerns = items.filter((i) => i.sentiment === "concern").length;
  const positives = items.filter((i) => i.sentiment === "positive").length;
  const lines: string[] = [];
  lines.push(
    `${items.length} item(s) of accepted evidence under ${ARIA_REG45_THEME_LABELS[theme]} ` +
      `(${concerns} concern(s), ${positives} positive(s)).`,
  );
  const top = items.slice(0, 5);
  for (const item of top) {
    const tag =
      item.sentiment === "concern"
        ? "Concern"
        : item.sentiment === "positive"
          ? "Strength"
          : "Note";
    lines.push(`- [${tag}] ${item.occurred_at}: ${item.title} — ${item.summary}`);
  }
  if (items.length > top.length) {
    lines.push(`- (+${items.length - top.length} further item(s) on file)`);
  }
  return lines.join("\n");
}

function buildExecutiveSummary(
  homeId: string,
  periodStart: string,
  periodEnd: string,
  items: AriaReg45EvidenceItem[],
): string {
  const concerns = items.filter((i) => i.sentiment === "concern").length;
  const positives = items.filter((i) => i.sentiment === "positive").length;
  const themesActive = new Set(items.map((i) => i.theme)).size;
  return [
    `Regulation 45 review for ${homeId} covering ${periodStart} to ${periodEnd}.`,
    `Drawn from ${items.length} item(s) of manager-accepted evidence across ${themesActive} theme(s).`,
    `${concerns} item(s) flagged as concerns, ${positives} item(s) flagged as positive practice.`,
    "ARIA has drafted the narrative; the Registered Manager is responsible for reviewing, editing, approving and locking the final report before it is shared.",
  ].join(" ");
}

export interface BuildReportOptions {
  periodStart?: string;
  periodEnd?: string;
  generatedBy: string;
  title?: string;
}

export function buildReg45Report(homeId: string, opts: BuildReportOptions): AriaReg45Report {
  const { periodStart: defStart, periodEnd: defEnd } = defaultPeriod();
  const periodStart = opts.periodStart ?? defStart;
  const periodEnd = opts.periodEnd ?? defEnd;

  const accepted = db.ariaReg45EvidenceItems
    .findAll(homeId)
    .filter(
      (e) =>
        (e.status === "accepted" || e.status === "included_in_report") &&
        inPeriod(e.occurred_at, periodStart, periodEnd),
    );

  const sections: AriaReg45ReportSection[] = [];
  for (const theme of Object.keys(ARIA_REG45_THEME_LABELS) as AriaReg45Theme[]) {
    const themeItems = accepted
      .filter((e) => e.theme === theme)
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    if (themeItems.length === 0) continue;
    sections.push({
      theme,
      label: ARIA_REG45_THEME_LABELS[theme],
      narrative: summariseTheme(theme, themeItems),
      evidence_item_ids: themeItems.map((i) => i.id),
      themes_covered: [theme],
      concerns: themeItems.filter((i) => i.sentiment === "concern").length,
      positives: themeItems.filter((i) => i.sentiment === "positive").length,
    });
  }

  const totalConcerns = accepted.filter((i) => i.sentiment === "concern").length;
  const totalPositives = accepted.filter((i) => i.sentiment === "positive").length;
  const generatedAt = new Date().toISOString();

  return db.ariaReg45Reports.create({
    home_id: homeId,
    period_start: periodStart,
    period_end: periodEnd,
    status: "draft",
    generated_at: generatedAt,
    generated_by: opts.generatedBy,
    title: opts.title ?? `Regulation 45 review — ${periodStart} to ${periodEnd}`,
    executive_summary: buildExecutiveSummary(homeId, periodStart, periodEnd, accepted),
    sections,
    evidence_item_ids: accepted.map((i) => i.id),
    total_evidence: accepted.length,
    total_concerns: totalConcerns,
    total_positives: totalPositives,
    reviewed_by: null,
    reviewed_at: null,
    review_note: null,
    approved_by: null,
    approved_at: null,
    locked_by: null,
    locked_at: null,
    lock_note: null,
  });
}

export interface ReportEdits {
  title?: string;
  executive_summary?: string;
  section_narratives?: Partial<Record<AriaReg45Theme, string>>;
}

export function editReg45Report(id: string, edits: ReportEdits): AriaReg45Report | null {
  const existing = db.ariaReg45Reports.findById(id);
  if (!existing) return null;
  if (existing.status === "locked") return existing;

  let sections = existing.sections;
  if (edits.section_narratives) {
    sections = existing.sections.map((s) => {
      const next = edits.section_narratives?.[s.theme];
      return next == null ? s : { ...s, narrative: next };
    });
  }

  return db.ariaReg45Reports.patch(id, {
    title: edits.title ?? existing.title,
    executive_summary: edits.executive_summary ?? existing.executive_summary,
    sections,
  });
}

export function setReg45ReportStatus(
  id: string,
  status: AriaReg45Report["status"],
  actorId: string,
  note: string | null,
): AriaReg45Report | null {
  const existing = db.ariaReg45Reports.findById(id);
  if (!existing) return null;
  if (existing.status === "locked") return existing;

  const now = new Date().toISOString();
  const patch: Partial<AriaReg45Report> = { status };

  if (status === "in_review") {
    patch.reviewed_by = actorId;
    patch.reviewed_at = now;
    patch.review_note = note;
  } else if (status === "approved") {
    patch.approved_by = actorId;
    patch.approved_at = now;
    if (note != null) patch.review_note = note;
  } else if (status === "locked") {
    patch.locked_by = actorId;
    patch.locked_at = now;
    patch.lock_note = note;
    // Promote linked evidence to included_in_report
    for (const evidenceId of existing.evidence_item_ids) {
      const ev = db.ariaReg45EvidenceItems.findById(evidenceId);
      if (ev && ev.status !== "included_in_report") {
        db.ariaReg45EvidenceItems.patch(evidenceId, {
          status: "included_in_report",
          included_in_report_id: id,
        });
      }
    }
  } else if (status === "draft") {
    patch.reviewed_by = null;
    patch.reviewed_at = null;
    patch.review_note = note ?? existing.review_note;
  }

  return db.ariaReg45Reports.patch(id, patch);
}

export function loadReg45Reports(homeId: string): AriaReg45Report[] {
  return [...db.ariaReg45Reports.findAll(homeId)].sort((a, b) =>
    b.generated_at.localeCompare(a.generated_at),
  );
}
