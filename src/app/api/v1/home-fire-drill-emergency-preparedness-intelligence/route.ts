import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFireDrillPreparedness,
  type FireDrillRecordInput,
} from "@/lib/engines/home-fire-drill-emergency-preparedness-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = (store.youngPeople ?? []).filter((c: any) => c.status === "current");
  const today = new Date().toISOString().slice(0, 10);

  // Fire drills → FireDrillRecordInput[]
  const rawDrills = (store.fireDrills as any[] ?? []);
  const drills: FireDrillRecordInput[] = rawDrills.map((d: any) => ({
    id: d.id ?? "",
    drill_type: d.drill_type ?? "fire_drill",
    result: d.result ?? "not_completed",
    all_present: !!(d.all_present),
    children_present_count: (d.children_present ?? []).length,
    staff_present_count: (d.staff_present ?? []).length,
    evacuation_time_seconds: d.evacuation_time_seconds ?? null,
    has_issues: !!(d.issues && d.issues.trim().length > 0),
    has_actions: !!(d.actions_taken && d.actions_taken.trim().length > 0),
  }));

  const result = computeFireDrillPreparedness({
    today,
    total_children: (children as any[]).length,
    drills,
  });

  return NextResponse.json({ data: result });
}
