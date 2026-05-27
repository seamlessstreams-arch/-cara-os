import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeStaffReflectivePractice,
  type StaffReflectionInput,
  type SupervisionThemeInput,
  type ShadowingInput,
  type StaffMeetingInput,
} from "@/lib/engines/home-staff-reflective-practice-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Staff reflections
  const rawReflections = (store.staffReflectionRecords as any[] ?? []);
  const reflections: StaffReflectionInput[] = rawReflections.map((r: any) => ({
    id: r.id ?? "",
    staff_id: r.staff_id ?? "",
    date: (r.date ?? today).toString().slice(0, 10),
    shared_with_manager: !!(r.shared_with_manager),
    has_development_goal: !!(r.development_goal),
    linked_to_incident: !!(r.linked_incident),
  }));

  // Supervision themes
  const rawThemes = (store.staffSupervisionThemeRecords as any[] ?? []);
  const supervision_themes: SupervisionThemeInput[] = rawThemes.map((t: any) => ({
    id: t.id ?? "",
    theme_area: t.theme_area ?? "practice",
    frequency_across_team: t.frequency_across_team ?? 1,
    status: t.status ?? "active",
    has_organisational_response: !!(t.organisational_response && (t.organisational_response as any[]).length > 0),
    has_training_implications: !!(t.training_implications && (t.training_implications as any[]).length > 0),
  }));

  // Shadowings
  const rawShadowings = (store.staffShadowingRecords as any[] ?? []);
  const shadowings: ShadowingInput[] = rawShadowings.map((s: any) => ({
    id: s.id ?? "",
    staff_id: s.new_staff ?? s.staff_id ?? "",
    date: (s.date ?? today).toString().slice(0, 10),
    hours_shadowed: s.hours_shadowed ?? 0,
    shadow_number: s.shadow_number ?? 1,
    total_shadows_required: s.total_shadows_required ?? 3,
    signed_off: !!(s.signed_off),
    ready_to_work_solo: s.ready_to_work_solo ?? "not_yet",
  }));

  // Staff meetings
  const rawMeetings = (store.staffMeetingRecords as any[] ?? []);
  const staff_meetings: StaffMeetingInput[] = rawMeetings.map((m: any) => {
    const prevActions = (m.actions_from_previous ?? []) as any[];
    const completedPrev = prevActions.filter((a: any) => a.status === "completed" || a.completed).length;
    return {
      id: m.id ?? "",
      date: (m.date ?? today).toString().slice(0, 10),
      attendees_count: (m.attendees ?? []).length,
      total_staff: (staff as any[]).length,
      actions_from_previous_completed: completedPrev,
      actions_from_previous_total: prevActions.length,
      new_actions_count: (m.new_actions ?? []).length,
    };
  });

  const result = computeHomeStaffReflectivePractice({
    today,
    total_staff: (staff as any[]).length,
    reflections,
    supervision_themes,
    shadowings,
    staff_meetings,
  });

  return NextResponse.json({ data: result });
}
