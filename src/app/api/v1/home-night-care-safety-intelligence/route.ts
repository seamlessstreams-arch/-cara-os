// ══════════════════════════════════════════════════════════════════════════════
// API — HOME NIGHT CARE & SAFETY INTELLIGENCE
// Maps in-memory store → engine input → JSON response.
// CHR 2015 Reg 12/25: Night care and safety.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeNightCareSafety,
  type NightCheckInput,
  type NightStaffHandoverInput,
  type NightAnxietySupportInput,
  type BedtimeRoutineInput,
  type WakeUpRoutineInput,
} from "@/lib/engines/home-night-care-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Night Checks ──────────────────────────────────────────────────
  const night_checks: NightCheckInput[] = (store.nightChecks as any[]).map((x: any) => ({
    id: x.id,
    date: (x.date ?? "").toString().slice(0, 10),
    time: x.time ?? "",
    child_id: x.child_id,
    staff_id: x.staff_id,
    sleep_status: x.sleep_status ?? "sleeping",
    check_type: x.check_type ?? "scheduled",
    concern_raised: !!(x.concern_raised),
    room_temp_ok: !!(x.room_temp_ok),
  }));

  // ── Night Staff Handovers ─────────────────────────────────────────
  const night_staff_handovers: NightStaffHandoverInput[] = (store.nightStaffHandovers as any[]).map((x: any) => ({
    id: x.id,
    date: (x.date ?? "").toString().slice(0, 10),
    risk_briefing_count: x.risk_briefing?.length ?? 0,
    specific_concerns_count: Object.keys(x.specific_concerns ?? {}).length,
    children_at_home_count: x.children_at_home?.length ?? 0,
    morning_handover_complete: !!(x.morning_handover_complete),
  }));

  // ── Night Anxiety Support Records ─────────────────────────────────
  const night_anxiety_support_records: NightAnxietySupportInput[] = (store.nightAnxietySupportRecords as any[]).map((x: any) => ({
    id: x.id,
    child_id: x.child_id,
    record_date: (x.record_date ?? "").toString().slice(0, 10),
    anxiety_level: x.anxiety_level ?? "settled",
    do_strategies_count: x.do_strategies?.length ?? 0,
    do_not_strategies_count: x.do_not_strategies?.length ?? 0,
    child_voice: x.child_voice ?? "",
    child_preferences: x.child_preferences ?? "",
    external_referral_active: x.external_referral_active ?? null,
    review_date: (x.review_date ?? "").toString().slice(0, 10),
  }));

  // ── Bedtime Routines ──────────────────────────────────────────────
  const bedtime_routines: BedtimeRoutineInput[] = (store.bedtimeRoutines as any[]).map((x: any) => ({
    id: x.id,
    child_id: x.child_id,
    effectiveness_rating: x.effectiveness_rating ?? 3,
    child_agreed: !!(x.child_agreed),
    routine_steps_count: x.routine_steps?.length ?? 0,
    pre_bed_rituals_count: x.pre_bed_rituals?.length ?? 0,
    reviewed_date: (x.reviewed_date ?? "").toString().slice(0, 10),
  }));

  // ── Wake-Up Routines ──────────────────────────────────────────────
  const wake_up_routines: WakeUpRoutineInput[] = (store.wakeUpRoutines as any[]).map((x: any) => ({
    id: x.id,
    child_id: x.child_id,
    effectivenessRating: x.effectivenessRating ?? 3,
    childAgreed: !!(x.childAgreed),
    wakeUpSteps_count: x.wakeUpSteps?.length ?? 0,
    reviewedDate: (x.reviewedDate ?? "").toString().slice(0, 10),
  }));

  const result = computeHomeNightCareSafety({
    today,
    night_checks,
    night_staff_handovers,
    night_anxiety_support_records,
    bedtime_routines,
    wake_up_routines,
    total_children: store.children?.length ?? 0,
  });

  return NextResponse.json({ data: result });
}
