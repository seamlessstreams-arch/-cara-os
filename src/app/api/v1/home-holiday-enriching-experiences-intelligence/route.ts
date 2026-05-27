import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHolidayEnrichingExperiences,
  type HolidayRecordInput,
  type CareAnniversaryInput,
} from "@/lib/engines/home-holiday-enriching-experiences-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  // Holiday records → HolidayRecordInput[]
  const rawHolidays = (store.holidayRecords as any[] ?? []);
  const holidays: HolidayRecordInput[] = rawHolidays.map((h: any) => ({
    id: h.id ?? "",
    child_id: h.child_id ?? "",
    duration_days: h.duration_days ?? 0,
    child_chose_destination: !!(h.child_chose_destination),
    has_highlights: !!((h.highlights ?? []).length > 0),
    photos_taken: !!(h.photos_taken),
    has_child_voice: !!(h.child_voice && h.child_voice.trim().length > 0),
    challenges_count: (h.challenges_noted ?? []).length,
  }));

  // Care anniversary records → CareAnniversaryInput[]
  const rawAnniversaries = (store.careAnniversaryRecords as any[] ?? []);
  const anniversaries: CareAnniversaryInput[] = rawAnniversaries.map((a: any) => ({
    id: a.id ?? "",
    child_id: a.child_id ?? "",
    anniversary_type: a.anniversary_type ?? "other_significant_date",
    child_attitude: a.child_attitude ?? "mixed_changes_year_by_year",
    has_upcoming_plan: !!(a.upcoming_plan && a.upcoming_plan.trim().length > 0),
    support_in_place_count: (a.support_in_place_for_date ?? []).length,
    triggers_count: (a.triggers_around_date ?? []).length,
    has_child_voice: !!(a.child_voice && a.child_voice.trim().length > 0),
  }));

  const result = computeHolidayEnrichingExperiences({
    today,
    total_children: totalChildren,
    holidays,
    anniversaries,
  });

  return NextResponse.json({ data: result });
}
