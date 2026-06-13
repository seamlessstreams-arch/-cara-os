// ══════════════════════════════════════════════════════════════════════════════
// CARA — Staff sickness demo seeds
//
// A realistic spread so the Workforce Absence engine demonstrates its patterns:
// a spell-count trigger (3+ short absences in 90 days), an ongoing long-term
// absence with an OH referral, an overdue return-to-work, a work-related
// absence, and a couple of clean single spells. Anchored to real seeded staff
// ids. Dates are relative to "now" so the patterns stay current.
// ══════════════════════════════════════════════════════════════════════════════

import type { StaffSicknessRecord } from "@/types/extended";

const DAY = 864e5;
function ago(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
}
function ahead(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

function base(over: Partial<StaffSicknessRecord> & { id: string; staff_id: string }): StaffSicknessRecord {
  return {
    date_started: ago(10),
    date_ended: ago(9),
    total_days: 1,
    category: "short_term",
    reason: "cold_flu",
    reason_detail: "",
    self_certified: true,
    fit_note: false,
    fit_note_expiry: null,
    cover_arrangements: "Covered by team",
    rtw_status: "completed",
    rtw_date: ago(8),
    rtw_conducted_by_id: "staff_darren",
    rtw_outcome: "Fit to return, no adjustments needed.",
    occupational_health_referral: false,
    trigger_points: [],
    manager_notes: "",
    ...over,
  };
}

export function seedStaffSicknessRecords(): StaffSicknessRecord[] {
  return [
    // Marcus Bell — 3 separate short absences in 90 days → spell-count trigger
    base({ id: "sskr_seed_1", staff_id: "staff_ryan", date_started: ago(78), date_ended: ago(77), total_days: 1, reason: "migraine", category: "intermittent" }),
    base({ id: "sskr_seed_2", staff_id: "staff_ryan", date_started: ago(41), date_ended: ago(39), total_days: 2, reason: "gastro", category: "short_term" }),
    base({ id: "sskr_seed_3", staff_id: "staff_ryan", date_started: ago(12), date_ended: ago(11), total_days: 1, reason: "cold_flu", category: "intermittent",
      trigger_points: ["3 separate absences in a rolling 90-day period"] }),

    // Priya Sharma — ongoing long-term absence, OH referral open
    base({ id: "sskr_seed_4", staff_id: "staff_anna", date_started: ago(31), date_ended: null, total_days: 31, reason: "mental_health", category: "long_term",
      self_certified: false, fit_note: true, fit_note_expiry: ahead(13), rtw_status: "not_required", rtw_date: null,
      occupational_health_referral: true, cover_arrangements: "Agency cover booked for 4 weeks",
      manager_notes: "Phased return to be planned with OH input." }),

    // Daniel Frost — returned but return-to-work interview overdue
    base({ id: "sskr_seed_5", staff_id: "staff_edward", date_started: ago(9), date_ended: ago(7), total_days: 3, reason: "musculoskeletal", category: "short_term",
      rtw_status: "overdue", rtw_date: null, rtw_outcome: "" }),

    // Hannah Cole — work-related absences
    base({ id: "sskr_seed_6", staff_id: "staff_bianca", date_started: ago(62), date_ended: ago(57), total_days: 5, reason: "injury", category: "work_related",
      reason_detail: "Slip in kitchen — incident reported", rtw_outcome: "Returned; workplace risk assessment reviewed." }),
    base({ id: "sskr_seed_7", staff_id: "staff_bianca", date_started: ago(19), date_ended: ago(17), total_days: 2, reason: "mental_health", category: "work_related" }),

    // Clean single spells (no concern)
    base({ id: "sskr_seed_8", staff_id: "staff_chervelle", date_started: ago(46), date_ended: ago(45), total_days: 1, reason: "cold_flu" }),
    base({ id: "sskr_seed_9", staff_id: "staff_lackson", date_started: ago(83), date_ended: ago(81), total_days: 2, reason: "gastro" }),
  ];
}
