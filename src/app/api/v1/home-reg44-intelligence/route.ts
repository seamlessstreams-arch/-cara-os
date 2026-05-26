// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REG 44 VISITS INTELLIGENCE API ROUTE
// GET /api/v1/home-reg44-intelligence
// Synthesises Regulation 44 independent visitor reports to assess visit
// frequency, recommendation completion, action plan compliance, child voice
// capture, Ofsted notification timeliness, and quality trends.
// CHR 2015 Reg 44. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeReg44,
  type Reg44VisitInput,
  type Reg44RecInput,
  type Reg44ActionInput,
} from "@/lib/engines/home-reg44-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;

  // ── Reg 44 Visit Reports ──────────────────────────────────────────────
  const visits: Reg44VisitInput[] = ((store.reg44VisitReports ?? []) as any[])
    .map((v: any) => {
      // Parse "children_spoken" field like "3/3" or "2/3 (Casey absent)"
      let childrenSpokenCount = 0;
      let visitTotalChildren = totalChildren;
      const spokenMatch = (v.children_spoken ?? "").toString().match(/^(\d+)\/(\d+)/);
      if (spokenMatch) {
        childrenSpokenCount = parseInt(spokenMatch[1], 10);
        visitTotalChildren = parseInt(spokenMatch[2], 10);
      }

      // Parse duration like "4 hours" or "3.5 hours"
      let durationHours = 0;
      const durMatch = (v.duration ?? "").toString().match(/([\d.]+)\s*hour/i);
      if (durMatch) {
        durationHours = parseFloat(durMatch[1]);
      }

      // Map recommendations
      const recs: Reg44RecInput[] = (v.recommendations ?? []).map((r: any) => ({
        id: r.id ?? "",
        recommendation: r.recommendation ?? "",
        priority: r.priority ?? "medium",
        status: r.status ?? "outstanding",
      }));

      return {
        id: v.id,
        visit_date: (v.visit_date ?? today).toString().slice(0, 10),
        visitor: v.visitor ?? "",
        duration_hours: durationHours,
        children_spoken_count: childrenSpokenCount,
        total_children: visitTotalChildren,
        staff_spoken: typeof v.staff_spoken === "number" ? v.staff_spoken : 0,
        records_reviewed_count: Array.isArray(v.records_reviewed) ? v.records_reviewed.length : 0,
        overall_judgement: v.overall_judgement ?? "",
        strengths_count: Array.isArray(v.strengths) ? v.strengths.length : 0,
        areas_for_development_count: Array.isArray(v.areas_for_development) ? v.areas_for_development.length : 0,
        recommendations: recs,
        previous_actions_completed: (v.previous_actions_status ?? "").toString().toLowerCase().includes("all") &&
          (v.previous_actions_status ?? "").toString().toLowerCase().includes("closed"),
        report_sent_to_ofsted: !!(v.report_sent_to_ofsted),
        report_sent_date: (v.report_sent_date ?? today).toString().slice(0, 10),
      };
    });

  // ── Reg 44 Action Records ─────────────────────────────────────────────
  const actionRecords: Reg44ActionInput[] = ((store.reg44ActionRecords ?? []) as any[])
    .map((a: any) => ({
      id: a.id,
      visit_ref: a.visit_ref ?? "",
      priority: a.priority ?? "medium",
      status: a.status ?? "outstanding",
      due_date: (a.due_date ?? today).toString().slice(0, 10),
      carried_forward_count: typeof a.carried_forward_count === "number" ? a.carried_forward_count : 0,
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeReg44({
    today,
    total_children: totalChildren,
    visits,
    action_records: actionRecords,
  });

  return NextResponse.json({ data: result });
}
