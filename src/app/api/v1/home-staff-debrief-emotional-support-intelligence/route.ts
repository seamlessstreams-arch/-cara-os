import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffDebriefEmotionalSupport,
  type DebriefRecordInput,
  type StaffWellbeingCheckInput,
} from "@/lib/engines/home-staff-debrief-emotional-support-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Staff debrief records → DebriefRecordInput[]
  const rawDebriefs = (store.staffDebriefRecords as any[] ?? []);
  const debriefs: DebriefRecordInput[] = rawDebriefs.map((d: any) => ({
    id: d.id ?? "",
    type: d.type ?? "post_incident",
    status: d.status ?? "scheduled",
    emotional_impact: d.emotional_impact ?? "low",
    follow_up_needed: !!(d.follow_up_needed),
    follow_up_completed: !!(d.follow_up_needed && d.follow_up_details && d.status === "completed"),
    learning_points_count: (d.learning_points ?? []).length,
    support_offered_count: (d.support_offered ?? []).length,
    staff_involved_count: (d.staff_involved ?? []).length,
  }));

  // Staff wellbeing checks → StaffWellbeingCheckInput[]
  const rawWellbeing = (store.staffWellbeingRecords as any[] ?? []);
  const wellbeingChecks: StaffWellbeingCheckInput[] = rawWellbeing.map((w: any) => ({
    id: w.id ?? "",
    staff_id: w.staff_id ?? "",
    check_completed: !!(w.overall_score && w.overall_score > 0),
    concerns_raised: (w.stressors ?? []).length > 0,
    support_provided: !!(w.action_agreed && w.action_agreed.trim().length > 0),
  }));

  const result = computeStaffDebriefEmotionalSupport({
    today,
    total_staff: (staff as any[]).length,
    debriefs,
    wellbeing_checks: wellbeingChecks,
  });

  return NextResponse.json({ data: result });
}
