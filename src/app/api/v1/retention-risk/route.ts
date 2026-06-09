// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RETENTION & SUPPORT INDICATORS API
// GET /api/v1/retention-risk
//
// Fans in everyday operational signals into a NON-CLINICAL per-staff support
// indicator. Reuses the supervision engine (slice 3) for supervision status +
// wellbeing/confidence, then layers training, incidents, overtime, sickness and
// probation. Support indicators only — never a diagnosis (see engine).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeSupervisionOverview, type ReflectiveSupervisionRecord, type StaffLite } from "@/lib/engines/supervision-engine";
import { computeRetentionRisk, type StaffSignalsInput } from "@/lib/engines/retention-risk-engine";

const SUPERVISEE_ROLES = new Set(["registered_manager", "deputy_manager", "team_leader", "residential_care_worker", "bank_staff"]);

function staffName(s: any): string {
  return s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id;
}
function iso(d: any): string | null {
  if (!d) return null;
  const s = String(d).trim();
  return s ? s.slice(0, 10) : null;
}
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, (am || 1) - 1, ad || 1) - Date.UTC(by, (bm || 1) - 1, bd || 1)) / 86_400_000);
}
function withinDays(dateStr: any, n: number, today: string): boolean {
  const d = iso(dateStr);
  if (!d) return false;
  const diff = dayDiff(today, d); // days ago
  return diff >= 0 && diff <= n;
}

export async function GET() {
  const store = getStore() as any;
  const today = new Date().toISOString().slice(0, 10);

  const allStaff: any[] = store.staff ?? [];
  const staff: StaffLite[] = allStaff
    .filter((s) => s.employment_status !== "left" && SUPERVISEE_ROLES.has(String(s.role)))
    .map((s) => ({ id: s.id, name: staffName(s), role: s.role ?? s.job_title ?? null }));

  // 1. supervision status + wellbeing/confidence (reuse slice 3 engine)
  const supRecords: ReflectiveSupervisionRecord[] = store.reflectiveSupervisions ?? [];
  const supOverview = computeSupervisionOverview({ records: supRecords, staff, today });
  const supByStaff = new Map(supOverview.by_staff.map((s) => [s.staff_id, s]));

  const training: any[] = store.trainingRecords ?? [];
  const incidents: any[] = store.incidents ?? [];
  const shifts: any[] = store.shifts ?? [];
  const leave: any[] = store.leaveRequests ?? store.leave ?? [];

  const signals: StaffSignalsInput[] = staff.map((s) => {
    const sup = supByStaff.get(s.id);

    const overdue_training_count = training.filter((t) => t.staff_id === s.id && (String(t.status) === "expired" || (iso(t.expiry_date) && iso(t.expiry_date)! < today))).length;
    const incidents_recent = incidents.filter((i) => i.reported_by === s.id && withinDays(i.date, 90, today)).length;
    const overtime_minutes_30d = shifts.filter((sh) => sh.staff_id === s.id && withinDays(sh.date, 30, today)).reduce((n, sh) => n + (Number(sh.overtime_minutes) || 0), 0);
    const sickness_days_90d = leave.filter((l) => l.staff_id === s.id && String(l.leave_type) === "sick" && withinDays(l.start_date, 90, today)).reduce((n, l) => n + (Number(l.total_days) || 0), 0);
    const smRaw = allStaff.find((x) => x.id === s.id);
    const in_probation = !!(smRaw?.probation_end_date && iso(smRaw.probation_end_date)! >= today);

    return {
      staff_id: s.id, staff_name: s.name, role: s.role,
      supervision_status: sup?.status ?? "never",
      wellbeing_score: sup?.wellbeing_score ?? null,
      confidence_score: sup?.confidence_level ?? null,
      overdue_training_count, incidents_recent, overtime_minutes_30d, sickness_days_90d, in_probation,
    };
  });

  const overview = computeRetentionRisk({ staff: signals });
  return NextResponse.json({ data: overview });
}
