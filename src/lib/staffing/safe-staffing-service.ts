// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Safe Staffing service (Phase 7)
//
// Reads the live store (Phase 3 clock-ins + on-call rota) and produces a real-time
// safe-staffing status. Pure assessment is delegated to safe-staffing.ts.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import {
  assessStaffing, currentPeriod, getStaffingConfig,
  type StaffOnShiftLite, type SafeStaffingAssessment,
} from "./safe-staffing";

const DEFAULT_HOME = "home_oak";

function isClockedIn(s: { status?: string; clock_in_at?: string | null; clock_out_at?: string | null }): boolean {
  return s.status === "in_progress" || (!!s.clock_in_at && !s.clock_out_at);
}

export interface OnCallContact {
  name: string;
  role: string | null;
  contact_number: string | null;
  backup: string | null;
}

export interface SafeStaffingStatus {
  home_id: string;
  generated_at: string;
  assessment: SafeStaffingAssessment;
  on_shift: StaffOnShiftLite[];
  on_call: OnCallContact | null;
}

function staffName(id: string): string {
  const s = (db.staff?.findAll?.() ?? []).find((x: { id: string }) => x.id === id) as
    | { full_name?: string; first_name?: string }
    | undefined;
  return s?.full_name || s?.first_name || id;
}

/** Active on-call contact for the moment (from the on-call rota), if any. */
function activeOnCall(homeId: string, nowIso: string): OnCallContact | null {
  const today = nowIso.slice(0, 10);
  const shifts = (db.onCallShifts?.findAll?.() ?? []) as Array<{
    date_from?: string; date_to?: string; on_call_staff?: string; backup_staff?: string;
    contact_number?: string; role?: string;
  }>;
  const active = shifts.find(
    (s) => (s.date_from ?? "") <= today && today <= (s.date_to ?? ""),
  );
  if (!active) return null;
  return {
    name: active.on_call_staff ?? "On-call manager",
    role: active.role ?? null,
    contact_number: active.contact_number ?? null,
    backup: active.backup_staff ?? null,
  };
}

/** Build the real-time safe-staffing status for a home. */
export function buildSafeStaffingStatus(homeId: string, nowIso: string): SafeStaffingStatus {
  const today = nowIso.slice(0, 10);
  const onShift: StaffOnShiftLite[] = (db.shifts?.findAll?.() ?? [])
    .filter((s: { date?: string; home_id?: string }) => s.date === today && (s.home_id ?? DEFAULT_HOME) === homeId)
    .filter(isClockedIn)
    .map((s: { staff_id: string; shift_type: string }) => ({
      staff_id: s.staff_id,
      name: staffName(s.staff_id),
      shift_type: s.shift_type,
    }));

  const period = currentPeriod(nowIso);
  const assessment = assessStaffing(onShift, period, getStaffingConfig(homeId));

  return {
    home_id: homeId,
    generated_at: nowIso,
    assessment,
    on_shift: onShift,
    on_call: activeOnCall(homeId, nowIso),
  };
}
