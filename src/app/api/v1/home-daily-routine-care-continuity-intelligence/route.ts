import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDailyRoutineCare,
  type DailyRoutineInput,
  type DutyLogInput,
  type ShiftNoteInput,
  type CleaningCheckInput,
  type SleepInInput,
} from "@/lib/engines/home-daily-routine-care-continuity-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Daily routine plans
  const rawRoutines = (store.dailyRoutinePlans as any[] ?? []);
  const daily_routines: DailyRoutineInput[] = rawRoutines.map((r: any) => ({
    id: r.id ?? "",
    child_id: r.child_id ?? "",
    is_current: r.status === "active" || !!(r.is_current),
    last_reviewed: (r.review_date ?? r.created_date ?? today).toString().slice(0, 10),
    personalised: !!(r.child_input || r.sensory_considerations?.length > 0 || r.transition_support?.length > 0),
  }));

  // Duty log entries
  const rawDutyLogs = (store.dutyLogEntries as any[] ?? []);
  const duty_logs: DutyLogInput[] = rawDutyLogs.map((d: any) => ({
    id: d.id ?? "",
    date: (d.date ?? today).toString().slice(0, 10),
    shift_type: d.shift ?? d.shift_type ?? "day",
    completed: !!(d.signed_off ?? d.completed),
    incidents_recorded: d.follow_up_required ? 1 : 0,
    handover_completed: !!(d.signed_off),
  }));

  // Shift note records
  const rawShiftNotes = (store.shiftNoteRecords as any[] ?? []);
  const shift_notes: ShiftNoteInput[] = rawShiftNotes.map((s: any) => {
    const childNotes = (s.child_notes ?? []) as any[];
    return {
      id: s.id ?? "",
      staff_id: s.recorded_by ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      quality_adequate: !!(s.general_notes && s.general_notes.length > 10),
      child_observations_included: childNotes.length > 0,
    };
  });

  // Cleaning entries
  const rawCleaning = (store.cleaningEntries as any[] ?? []);
  const cleaning_checks: CleaningCheckInput[] = rawCleaning.map((c: any) => {
    const defects = (c.defects_logged ?? []) as any[];
    const followUps = (c.follow_up_actions ?? []) as any[];
    return {
      id: c.id ?? "",
      date: (c.date ?? today).toString().slice(0, 10),
      area: c.area ?? "general",
      standard_met: !!(c.signed_off),
      issues_found: defects.length + (c.items_requiring_attention ?? []).length,
      issues_resolved: followUps.length,
    };
  });

  // Sleep-in records
  const rawSleepIns = (store.sleepInRecords as any[] ?? []);
  const sleep_ins: SleepInInput[] = rawSleepIns.map((s: any) => {
    const disturbances = (s.disturbances ?? []) as any[];
    return {
      id: s.id ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      staff_id: s.staff_member ?? "",
      wake_ups: disturbances.length,
      response_adequate: !!(s.safety_check_completed),
      handover_completed: !!(s.handover_notes && s.handover_to),
    };
  });

  const result = computeDailyRoutineCare({
    today,
    total_children: (children as any[]).length,
    total_staff: (staff as any[]).length,
    daily_routines,
    duty_logs,
    shift_notes,
    cleaning_checks,
    sleep_ins,
  });

  return NextResponse.json({ data: result });
}
