// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING REPORT API
// GET ?period=quarter|month  → a leadership synthesis across the whole Practice
// Intelligence signal set for the period (repeated themes, emerging risks,
// unresolved learning, strengths, child-voice themes, improvement evidence).
//
// CHR 2015 Reg 45 · Quality Standards (leadership & management). The engine is
// pure; this route reads store snapshots + computes ethical cycle status.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { buildOrgLearningReport } from "@/lib/org-learning-report/report-engine";
import type { OrgLearningReportInput, ReportPeriod } from "@/lib/org-learning-report/types";
import { computeEthicalCycleStatus } from "@/lib/ethical-intelligence/ethical-intelligence-engine";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);
    const { searchParams } = new URL(req.url);
    const period: ReportPeriod = searchParams.get("period") === "month" ? "month" : "quarter";

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    // Restraint → debrief linkage (a debrief exists for the restraint's incident).
    const debriefs = (store.debriefRecords ?? []) as Array<{ linked_incident_id?: string }>;
    const hasDebrief = (rst: { id?: string; linked_incident_id?: string }): boolean => {
      const incId = String(rst.linked_incident_id ?? "") || String(rst.id ?? "").replace("rst_", "inc_");
      return debriefs.some((d) => d.linked_incident_id === incId);
    };

    const input: OrgLearningReportInput = {
      homeId: "home_oak",
      asOf,
      period,
      incidents: (store.incidents ?? []).map((i: Record<string, unknown>) => ({ id: String(i.id), date: day(i.date), type: String(i.type ?? "other"), severity: String(i.severity ?? ""), childId: i.child_id ? String(i.child_id) : undefined })),
      behaviour: (store.behaviourLog ?? []).map((b: Record<string, unknown>) => ({ id: String(b.id), date: day(b.date), direction: String(b.direction ?? ""), trigger: String(b.trigger ?? "") })),
      escalations: (store.escalationDecisions ?? []).map((e: Record<string, unknown>) => ({ id: String(e.id), createdAt: day(e.createdAt), status: String(e.status ?? ""), confirmedLevel: e.confirmedLevel ? String(e.confirmedLevel) : undefined })),
      ethical: (store.ethicalIntelligenceEvents ?? []).map((e: Record<string, unknown>) => {
        let cycleComplete = false;
        try {
          cycleComplete = computeEthicalCycleStatus(e as never).cycleComplete;
        } catch {
          cycleComplete = false;
        }
        return { id: String(e.id), createdAt: day(e.createdAt), cycleComplete, hasLearning: Array.isArray(e.learning) && (e.learning as unknown[]).length > 0, summary: String(e.triggerSummary ?? e.whatHappened ?? "") };
      }),
      feedbackLoops: (store.childFeedbackLoops ?? []).map((f: Record<string, unknown>) => ({ id: String(f.id), feedbackDate: day(f.feedback_date), decisionMade: String(f.decision_made ?? "pending_consideration") })),
      voice: (store.ypFeedback ?? []).map((v: Record<string, unknown>) => ({ id: String(v.id), date: day(v.date), category: String(v.category ?? ""), sentiment: String(v.sentiment ?? "") })),
      restraints: (store.restraints ?? []).map((r: Record<string, unknown>) => ({ id: String(r.id), date: day(r.date ?? r.created_at), childDebriefed: !!r.child_debriefed, hasDebriefRecord: hasDebrief(r as { id?: string; linked_incident_id?: string }) })),
    };

    return NextResponse.json({ data: buildOrgLearningReport(input) });
  } catch (error: unknown) {
    console.error("[api] org-learning-report error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
