// ══════════════════════════════════════════════════════════════════════════════
// CARA — Org-learning report: store → OrgLearningReportInput (shared mapper)
//
// Extracted from /api/v1/org-learning-report so the SAME organisational-learning
// read powers the API, Ask CARA and any future consumer — one mapper, one answer.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";
import { computeEthicalCycleStatus } from "@/lib/ethical-intelligence/ethical-intelligence-engine";
import type { OrgLearningReportInput, ReportPeriod } from "@/lib/org-learning-report/types";

type Store = ReturnType<typeof getStore>;

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

export function buildOrgLearningInputFromStore(store: Store, asOf: string, period: ReportPeriod): OrgLearningReportInput {
  // Restraint → debrief linkage (a debrief exists for the restraint's incident).
  const debriefs = (store.debriefRecords ?? []) as Array<{ linked_incident_id?: string }>;
  const hasDebrief = (rst: { id?: string; linked_incident_id?: string }): boolean => {
    const incId = String(rst.linked_incident_id ?? "") || String(rst.id ?? "").replace("rst_", "inc_");
    return debriefs.some((d) => d.linked_incident_id === incId);
  };

  return {
    homeId: "home_oak",
    asOf,
    period,
    incidents: (store.incidents ?? []).map((i) => ({ id: String(i.id), date: day(i.date), type: String(i.type ?? "other"), severity: String(i.severity ?? ""), childId: i.child_id ? String(i.child_id) : undefined })),
    behaviour: (store.behaviourLog ?? []).map((b) => ({ id: String(b.id), date: day(b.date), direction: String(b.direction ?? ""), trigger: String(b.trigger ?? "") })),
    escalations: (store.escalationDecisions ?? []).map((e) => ({ id: String(e.id), createdAt: day(e.createdAt), status: String(e.status ?? ""), confirmedLevel: e.confirmedLevel ? String(e.confirmedLevel) : undefined })),
    ethical: (store.ethicalIntelligenceEvents ?? []).map((e) => {
      let cycleComplete = false;
      try {
        cycleComplete = computeEthicalCycleStatus(e as never).cycleComplete;
      } catch {
        cycleComplete = false;
      }
      return { id: String(e.id), createdAt: day(e.createdAt), cycleComplete, hasLearning: Array.isArray(e.learning) && (e.learning as unknown[]).length > 0, summary: String(e.triggerSummary ?? e.whatHappened ?? "") };
    }),
    feedbackLoops: (store.childFeedbackLoops ?? []).map((f) => ({ id: String(f.id), feedbackDate: day(f.feedback_date), decisionMade: String(f.decision_made ?? "pending_consideration") })),
    voice: (store.ypFeedback ?? []).map((v) => ({ id: String(v.id), date: day(v.date), category: String(v.category ?? ""), sentiment: String(v.sentiment ?? "") })),
    restraints: (store.restraints ?? []).map((r) => ({ id: String(r.id), date: day(r.date ?? r.created_at), childDebriefed: !!r.child_debriefed, hasDebriefRecord: hasDebrief(r as { id?: string; linked_incident_id?: string }) })),
  };
}
