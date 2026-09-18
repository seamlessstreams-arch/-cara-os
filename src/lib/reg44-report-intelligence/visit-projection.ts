// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 VISIT PROJECTION
//
// The Quality → Reg 44 page (and the manager / provider dashboards) think in
// "visits": a date, a visitor, a status, a few summary paragraphs and the
// home's responses. Since the fold there is no separate visit record — a
// visit IS its A–Q report — so this projects the persisted report into that
// shape. Pure; no store access.
//
// Only sections the report actually has words for are surfaced. A section the
// engine marked as needing the visitor's input is a prompt, not a finding, and
// showing it under "Concerns" would put Cara's placeholder in the visitor's
// mouth.
// ══════════════════════════════════════════════════════════════════════════════

import type { PersistedReg44Report, Reg44Response } from "./report-lifecycle";
import type { Reg44Section } from "./report-assembly";

/** The tracker's status vocabulary (src/types/intelligence.layer Reg44ReportStatus). */
export type Reg44TrackerStatus = "draft" | "submitted" | "reviewed" | "closed";

export interface Reg44VisitRow {
  id: string;
  home_id: string;
  month: string;
  visit_date: string;
  visitor_name: string;
  announced: boolean | null;
  /** Tracker status, derived: draft → signed ("submitted") → responded ("reviewed"). */
  status: Reg44TrackerStatus;
  /** The report's own lifecycle status, for callers that want the source of truth. */
  report_status: PersistedReg44Report["status"];
  locked: boolean;
  summary: string | null;
  strengths: string | null;
  concerns: string | null;
  children_views_summary: string | null;
  staff_views_summary: string | null;
  manager_response: string | null;
  manager_responded_at: string | null;
  ri_response: string | null;
  ri_responded_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Which A–Q section stands behind each of the tracker's summary fields. */
export const VISIT_SECTION_KEYS = {
  summary: "A",                // Executive summary
  strengths: "L",              // Strengths and areas for development
  concerns: "O",               // Recommendations from this visit
  children_views_summary: "D", // Children's voice
  staff_views_summary: "F",    // Staffing snapshot
} as const;

function sectionText(sections: Reg44Section[] | undefined, key: string): string | null {
  const s = sections?.find((x) => x.key === key);
  if (!s) return null;
  if (s.status !== "drafted_from_evidence" || s.visitorMustComplete) return null;
  const t = (s.content ?? "").trim();
  return t.length ? t : null;
}

export function trackerStatusOf(r: PersistedReg44Report): Reg44TrackerStatus {
  if (r.status === "draft") return "draft";
  // Signed. The registered person's response is what moves it on (Reg 44(7)).
  return r.managerResponse?.text ? "reviewed" : "submitted";
}

export function projectReg44Visit(r: PersistedReg44Report): Reg44VisitRow {
  const sections = r.locked ? (r.signedSections ?? r.sections) : r.sections;
  const meta = r.draft?.meta;
  const resp = (x?: Reg44Response | null) => ({ text: x?.text ?? null, at: x?.at || null });
  const m = resp(r.managerResponse), ri = resp(r.riResponse);
  return {
    id: r.id,
    home_id: r.homeId,
    month: r.month,
    visit_date: meta?.visitDate ? meta.visitDate.slice(0, 10) : `${r.month}-01`,
    visitor_name: meta?.visitorName || "Independent visitor",
    announced: typeof meta?.announced === "boolean" ? meta.announced : null,
    status: trackerStatusOf(r),
    report_status: r.status,
    locked: r.locked,
    summary: sectionText(sections, VISIT_SECTION_KEYS.summary),
    strengths: sectionText(sections, VISIT_SECTION_KEYS.strengths),
    concerns: sectionText(sections, VISIT_SECTION_KEYS.concerns),
    children_views_summary: sectionText(sections, VISIT_SECTION_KEYS.children_views_summary),
    staff_views_summary: sectionText(sections, VISIT_SECTION_KEYS.staff_views_summary),
    manager_response: m.text,
    manager_responded_at: m.at,
    ri_response: ri.text,
    ri_responded_at: ri.at,
    created_by: r.auditTrail?.[0]?.actor ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

/**
 * Demo seeding only: turns one of the legacy fallback-store visit rows into a
 * persisted report so the demo Quality page keeps its worked example. The
 * draft is minimal (identity + sign-off shell); the legacy paragraphs become
 * the matching sections. Never used on a live tenant.
 */
export function reportFromLegacyVisit(v: {
  id: string; home_id: string; visit_date: string; visitor_name: string; status: string;
  summary: string | null; strengths: string | null; concerns: string | null;
  children_views_summary: string | null; staff_views_summary: string | null;
  manager_response: string | null; ri_response: string | null;
  created_by: string | null; created_at: string; updated_at: string;
}): PersistedReg44Report {
  const month = v.visit_date.slice(0, 7);
  const section = (key: string, label: string, content: string | null): Reg44Section => ({
    key, label, content: content ?? "", sourceCount: content ? 1 : 0,
    status: content ? "drafted_from_evidence" : "needs_visitor_input",
    visitorMustComplete: !content,
  });
  const sections: Reg44Section[] = [
    section("A", "Executive summary", v.summary),
    section("D", "Children's voice", v.children_views_summary),
    section("F", "Staffing snapshot", v.staff_views_summary),
    section("L", "Strengths and areas for development", v.strengths),
    section("O", "Recommendations from this visit", v.concerns),
  ];
  const signed = v.status !== "draft" && v.status !== "scheduled" && v.status !== "in_progress";
  const by = v.created_by ?? "system";
  const draft = {
    homeId: v.home_id, month,
    meta: { visitDate: v.visit_date, visitorName: v.visitor_name, visitorIndependent: true, announced: false },
    independence: { confirmed: true, conflictsDeclared: false },
    methodology: { peopleSpokenTo: [], areasObserved: [], recordsExamined: [], childrenOnRoll: 0, childrenPresent: 0, childrenSpokenTo: 0 },
    childrenVoice: { captured: !!v.children_views_summary, blankReason: "", entries: [] },
    qualityStandardsAssessed: 9,
    opinions: { safeguarding: { stated: signed, hasEvidence: signed }, wellbeing: { stated: signed, hasEvidence: signed } },
    recommendations: [],
    previousRecommendationsReviewed: signed,
    conflictOfInterestCompleted: signed,
    distribution: { completed: signed, recipients: signed ? ["Registered person"] : [] },
    reg45EvidenceExtractOnly: true,
    outputContainsChildNames: false,
    signOff: signed
      ? { signedBy: v.visitor_name, signedAt: v.updated_at, decision: "approved" as const, overrideReason: null }
      : { signedBy: null, signedAt: null, decision: null, overrideReason: null },
  } as PersistedReg44Report["draft"];
  const auditTrail: PersistedReg44Report["auditTrail"] = [{ at: v.created_at, actor: by, action: "created", detail: "Seeded demo report" }];
  if (signed) auditTrail.push({ at: v.updated_at, actor: v.visitor_name, action: "signed", detail: "Seeded as signed" });
  if (v.manager_response) auditTrail.push({ at: v.updated_at, actor: "registered_manager", action: "responded", detail: "Registered person's response recorded" });
  if (v.ri_response) auditTrail.push({ at: v.updated_at, actor: "responsible_individual", action: "responded", detail: "Responsible individual's response recorded" });
  return {
    id: v.id, homeId: v.home_id, month, status: signed ? "signed" : "draft", locked: signed,
    draft, sections, signedSnapshot: signed ? draft : null, signedSections: signed ? sections : null,
    addenda: [], engineVersion: "legacy-visit",
    managerResponse: v.manager_response ? { text: v.manager_response, at: v.updated_at, by: "registered_manager" } : null,
    riResponse: v.ri_response ? { text: v.ri_response, at: v.updated_at, by: "responsible_individual" } : null,
    auditTrail, createdAt: v.created_at, updatedAt: v.updated_at,
  };
}
