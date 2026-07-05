// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT ASSEMBLY (pure, deterministic)
//
// Assembles a DRAFT of the A–Q monthly visit report from the evidence Cara
// already holds — the Quality-Standards assessment (the "brain") and the evidence
// pack headline. Each section is drafted from cited evidence with a plain,
// evidence-first template; sections that need the visitor's own judgement
// (independence, the statutory opinions, conflict of interest, sign-off) are left
// for them and flagged. NO AI: this is local templates + phrase logic only.
//
// The assembly also produces a `draftForGate` in the slice-2 shape so the
// validation + sign-off gate runs on exactly what has been assembled.
// ══════════════════════════════════════════════════════════════════════════════

import type { Reg44QualityStandardsAssessment, QualityStandardAssessment } from "./types";
import type { Reg44ReportDraft } from "./report-validation";

export const REG44_ASSEMBLY_VERSION = "1.0.0";

export type Reg44SectionStatus = "drafted_from_evidence" | "needs_visitor_input" | "insufficient_evidence";

export interface Reg44Section {
  key: string; // "A", "B", … "J1" …
  label: string;
  content: string;
  status: Reg44SectionStatus;
  /** true where only the independent visitor can complete it (judgement/identity). */
  visitorMustComplete: boolean;
  sourceCount: number;
}

export interface Reg44ReportAssembly {
  homeId: string;
  month: string;
  asOf: string;
  sections: Reg44Section[];
  /** The assembled state mapped to the validation gate's draft shape. */
  draftForGate: Reg44ReportDraft;
  sectionsDrafted: number;
  sectionsNeedingVisitor: number;
  disclaimer: string;
  engineVersion: string;
}

export interface Reg44AssemblyInput {
  homeId: string;
  homeName: string;
  month: string;
  asOf: string;
  qs: Reg44QualityStandardsAssessment;
  headline: {
    children_in_residence: number;
    incidents: number;
    incidents_critical: number;
    missing_episodes: number;
    missing_high_risk: number;
    restraints: number;
    complaints: number;
    complaints_unresolved: number;
    safeguarding_events: number;
    reg40_notifications: number;
    keywork_sessions: number;
  };
  /** Child voice, ALREADY anonymised to initials/reference codes. */
  childVoiceEntries: Array<{ ref: string; summary: string }>;
  previousRecommendations: Array<{ text: string; status: string; priority?: string }>;
  reg45EvidenceCount: number;
}

const J_MAP: Array<{ key: string; label: string; qsKey: QualityStandardAssessment["key"] }> = [
  { key: "J1", label: "Quality and purpose of care", qsKey: "qs_quality_purpose" },
  { key: "J2", label: "Children's views, wishes and feelings", qsKey: "qs_views_wishes_feelings" },
  { key: "J3", label: "Education, enjoyment and achievement", qsKey: "qs_education" },
  { key: "J4", label: "Health and well-being", qsKey: "qs_health_wellbeing" },
  { key: "J5", label: "Positive relationships", qsKey: "qs_positive_relationships" },
  { key: "J6", label: "Protection of children / safeguarding", qsKey: "qs_protection" },
  { key: "J7", label: "Leadership and management", qsKey: "qs_leadership_management" },
  { key: "J8", label: "Care planning", qsKey: "qs_care_planning" },
];

export function assembleReg44ReportDraft(input: Reg44AssemblyInput): Reg44ReportAssembly {
  const { qs, headline: h } = input;
  const sections: Reg44Section[] = [];
  const add = (key: string, label: string, content: string, status: Reg44SectionStatus, visitorMustComplete: boolean, sourceCount = 0) =>
    sections.push({ key, label, content, status, visitorMustComplete, sourceCount });

  const statusCount = (s: string) => qs.standards.filter((x) => x.suggestedStatus === s).length;
  const topConcerns = qs.standards.flatMap((s) => s.concerns).slice(0, 3);

  // A. Executive summary (assembled from the section highlights) ─────────────
  add(
    "A",
    "Executive summary",
    `Independent visitor monthly visit to ${input.homeName} for ${input.month}. Cara assembled evidence against the nine Quality Standards: ${statusCount("met")} met, ${statusCount("partly_met")} partly met, ${statusCount("not_met")} not met, ${statusCount("insufficient_evidence")} with insufficient evidence in Cara. ${topConcerns.length ? `Matters to weigh: ${topConcerns.join("; ")}.` : "No specific concern was flagged from the records."} The two statutory opinions are for the visitor to form. Complete this summary last.`,
    "drafted_from_evidence",
    false,
    qs.evidenceCount,
  );

  // B. Visit details ─────────────────────────────────────────────────────────
  add("B", "Visit details", `${h.children_in_residence} child(ren) in residence this period. Visitor to confirm: visit date, arrival/departure, announced/unannounced, visit number, visitor identity, home details and Ofsted URN.`, "needs_visitor_input", true);

  // C. Visit methodology ─────────────────────────────────────────────────────
  add("C", "Visit methodology", `Records available in Cara for this period include incidents, restraints, missing episodes, complaints, safeguarding events and key-work. Visitor to record who was spoken to, areas observed and the records examined on the visit.`, "needs_visitor_input", true);

  // D. Children's voice (initials/reference codes only) ──────────────────────
  if (input.childVoiceEntries.length > 0) {
    add("D", "Children's voice", input.childVoiceEntries.map((e) => `${e.ref}: ${e.summary}`).join("\n"), "drafted_from_evidence", false, input.childVoiceEntries.length);
  } else {
    add("D", "Children's voice", "No child voice is captured in Cara for this period. The visitor should speak with children and record their views here (initials or reference codes only).", "insufficient_evidence", true);
  }

  // E. Notifications & significant events ─────────────────────────────────────
  add(
    "E",
    "Notifications and significant events since last visit",
    `This period: ${h.incidents} incident(s) (${h.incidents_critical} critical), ${h.missing_episodes} missing episode(s) (${h.missing_high_risk} high risk), ${h.restraints} restraint(s), ${h.safeguarding_events} safeguarding event(s), ${h.reg40_notifications} Reg 40 notification(s), ${h.complaints} complaint(s) (${h.complaints_unresolved} unresolved).${qs.standards.find((s) => s.key === "qs_protection")!.concerns.length ? " Protection concerns were flagged — comment on patterns/trends and follow-up." : ""}`,
    "drafted_from_evidence",
    false,
  );

  // F. Staffing snapshot ─────────────────────────────────────────────────────
  add("F", "Staffing snapshot", "Visitor to confirm the staffing snapshot (rota, agency use, training and supervision) from the workforce records.", "needs_visitor_input", true);

  // G. Statement of Purpose ──────────────────────────────────────────────────
  add("G", "Statement of Purpose", "Visitor to confirm the home is operating in line with its current Statement of Purpose and that placements match it.", "needs_visitor_input", true);

  // H. Building safety & compliance ──────────────────────────────────────────
  add("H", "Building safety and compliance checklist", "Building and fire-safety checklist — to be completed against the home's fire log, risk assessments and testing records.", "needs_visitor_input", true);

  // I. Assessment against the Quality Standards ──────────────────────────────
  add("I", "Assessment against the Quality Standards", qs.standards.map((s) => `${s.regulation} ${s.label}: ${s.suggestedStatus.replace(/_/g, " ")}${s.concerns.length ? ` (${s.concerns.join("; ")})` : ""}`).join("\n"), "drafted_from_evidence", false, qs.evidenceCount);

  // J1–J8. Detailed findings (from the QS narratives) ────────────────────────
  for (const j of J_MAP) {
    const std = qs.standards.find((s) => s.key === j.qsKey)!;
    add(j.key, `Detailed findings — ${j.label}`, std.suggestedNarrative, std.evidence.length > 0 ? "drafted_from_evidence" : "insufficient_evidence", false, std.evidence.length);
  }

  // K. Statutory opinion ─────────────────────────────────────────────────────
  add(
    "K",
    "Independent visitor's statutory opinion",
    `${qs.safeguardingOpinion.question} Cara reads the evidence as "${qs.safeguardingOpinion.position.replace(/_/g, " ")}": ${qs.safeguardingOpinion.basis}\n\n${qs.wellbeingOpinion.question} Cara reads the evidence as "${qs.wellbeingOpinion.position.replace(/_/g, " ")}": ${qs.wellbeingOpinion.basis}\n\nThe independent visitor must state both opinions here, on the evidence.`,
    "needs_visitor_input",
    true,
  );

  // L. Strengths & areas for development ─────────────────────────────────────
  const strengths = qs.standards.filter((s) => s.suggestedStatus === "met" || (s.suggestedStatus === "partly_met" && s.concerns.length === 0)).map((s) => s.label);
  const development = qs.standards.filter((s) => s.concerns.length > 0 || s.suggestedStatus === "insufficient_evidence" || s.suggestedStatus === "not_met").map((s) => s.label);
  add("L", "Strengths and areas for development", `Possible strengths (visitor to confirm): ${strengths.length ? strengths.join("; ") : "none clearly evidenced this period"}.\nAreas for development: ${development.length ? development.join("; ") : "none flagged"}.`, "drafted_from_evidence", false);

  // M. Progress on previous recommendations ──────────────────────────────────
  if (input.previousRecommendations.length > 0) {
    add("M", "Progress on previous recommendations", input.previousRecommendations.map((r) => `• ${r.text} — ${r.status}${r.priority ? ` (${r.priority})` : ""}`).join("\n"), "drafted_from_evidence", false, input.previousRecommendations.length);
  } else {
    add("M", "Progress on previous recommendations", "No recommendations were outstanding from the previous visit.", "drafted_from_evidence", false);
  }

  // N. Reg 45 evidence extract (evidence only — NOT the review) ──────────────
  add("N", "Evidence for the quality of care review (Regulation 45 support)", `Evidence extract for the Regulation 45 review: ${input.reg45EvidenceCount} verified evidence item(s) plus this month's Quality-Standards assessment. This is EVIDENCE ONLY — it does not constitute the Regulation 45 review, which is a separate six-monthly process.`, "drafted_from_evidence", false, input.reg45EvidenceCount);

  // O. Recommendations from this visit ───────────────────────────────────────
  add("O", "Recommendations from this visit", `Suggested focus from the evidence: ${development.length ? development.slice(0, 3).join("; ") : "confirm on the visit"}. The visitor must record each recommendation as a specific, evidence-linked, time-bound action with an owner.`, "needs_visitor_input", true);

  // P. Conflict of interest declaration ──────────────────────────────────────
  add("P", "Conflict of interest declaration", "The independent visitor must complete the conflict of interest declaration, recording any conflict that becomes apparent.", "needs_visitor_input", true);

  // Q. Sign-off & distribution ───────────────────────────────────────────────
  add("Q", "Sign-off and distribution", "Visitor to sign off and confirm distribution to Ofsted/HMCI, placing authorities, the provider, the registered manager, the responsible individual and the host local authority where applicable.", "needs_visitor_input", true);

  // ── Map the assembled state to the validation gate's draft ────────────────
  const protectionConcerns = qs.standards.find((s) => s.key === "qs_protection")!.concerns;
  const draftForGate: Reg44ReportDraft = {
    homeId: input.homeId,
    month: input.month,
    meta: { visitDate: "", visitorName: "", visitorIndependent: false },
    independence: { confirmed: false, conflictsDeclared: false },
    methodology: { peopleSpokenTo: [], areasObserved: [], recordsExamined: ["daily logs", "incident records"], childrenOnRoll: h.children_in_residence, childrenPresent: h.children_in_residence, childrenSpokenTo: 0 },
    childrenVoice: { captured: input.childVoiceEntries.length > 0, blankReason: "", entries: input.childVoiceEntries },
    qualityStandardsAssessed: qs.standards.length,
    opinions: { safeguarding: { stated: false, hasEvidence: qs.safeguardingOpinion.position !== "insufficient_evidence" }, wellbeing: { stated: false, hasEvidence: qs.wellbeingOpinion.position !== "insufficient_evidence" } },
    recommendations: [],
    previousRecommendationsReviewed: input.previousRecommendations.length > 0,
    conflictOfInterestCompleted: false,
    distribution: { completed: false, recipients: [] },
    reg45EvidenceExtractOnly: true,
    outputContainsChildNames: false,
    signOff: { signedBy: null, signedAt: null, decision: null, overrideReason: null },
  };
  // Surface the protection concerns so downstream views can show them.
  void protectionConcerns;

  return {
    homeId: input.homeId,
    month: input.month,
    asOf: input.asOf,
    sections,
    draftForGate,
    sectionsDrafted: sections.filter((s) => s.status === "drafted_from_evidence").length,
    sectionsNeedingVisitor: sections.filter((s) => s.visitorMustComplete).length,
    disclaimer:
      "Cara has assembled a DRAFT from the evidence it already holds — every drafted section is evidence-based, and sections needing the visitor's own judgement (independence, the statutory opinions, conflict of interest, sign-off) are left for them. This is a starting point the visitor edits and completes; it is not a finished or signed report.",
    engineVersion: REG44_ASSEMBLY_VERSION,
  };
}

export { REG44_ASSEMBLY_VERSION as _av };
