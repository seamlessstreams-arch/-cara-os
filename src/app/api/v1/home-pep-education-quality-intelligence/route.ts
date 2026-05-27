import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computePepEducationQuality } from "@/lib/engines/home-pep-education-quality-intelligence-engine";
import type { PepRecordInput } from "@/lib/engines/home-pep-education-quality-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.pepRecords as any[];
    const total_children = (store.youngPeople ?? []).length;

    const peps: PepRecordInput[] = raw.map((p: any) => ({
      id: p.id,
      child_id: p.child_id,
      status: p.status ?? "draft",
      attendance: typeof p.attendance === "number" ? p.attendance : 0,
      exclusions: typeof p.exclusions === "number" ? p.exclusions : 0,
      exclusion_days: typeof p.exclusion_days === "number" ? p.exclusion_days : 0,
      target_count: Array.isArray(p.targets) ? p.targets.length : 0,
      targets_on_track_count: Array.isArray(p.targets) ? p.targets.filter((t: any) => t.progress === "on_track").length : 0,
      targets_exceeded_count: Array.isArray(p.targets) ? p.targets.filter((t: any) => t.progress === "exceeded").length : 0,
      has_child_views: !!(p.child_views && p.child_views.trim().length > 0),
      has_carer_views: !!(p.carer_views && p.carer_views.trim().length > 0),
      actions_total: Array.isArray(p.actions) ? p.actions.length : 0,
      actions_completed: Array.isArray(p.actions) ? p.actions.filter((a: any) => a.status === "completed").length : 0,
      pupil_premium_allocated: p.pupil_premium?.annual_allocation ?? 0,
      pupil_premium_spent: p.pupil_premium?.spent_to_date ?? 0,
      has_sen: p.sen_status !== "none" && !!p.sen_status,
    }));

    const result = computePepEducationQuality({ today: new Date().toISOString().slice(0, 10), total_children, peps });
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
