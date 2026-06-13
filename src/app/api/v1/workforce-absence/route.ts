// CARA — GET /api/v1/workforce-absence
// Sickness / absence pattern intelligence across the active team, computed
// deterministically from the staff sickness records.
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeWorkforceAbsence } from "@/lib/engines/workforce-absence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore() as any;
  const today = new Date().toISOString().slice(0, 10);

  const result = computeWorkforceAbsence({
    today,
    staff: (store.staff ?? [])
      .filter((s: any) => s.is_active !== false && s.employment_status !== "inactive")
      .map((s: any) => ({
        id: String(s.id),
        full_name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Unknown",
      })),
    records: (store.staffSicknessRecords ?? []).map((r: any) => ({
      staff_id: String(r.staff_id),
      date_started: r.date_started ? String(r.date_started).slice(0, 10) : "",
      date_ended: r.date_ended ? String(r.date_ended).slice(0, 10) : null,
      total_days: Number(r.total_days) || 0,
      category: String(r.category ?? "short_term"),
      reason: String(r.reason ?? "other"),
      rtw_status: String(r.rtw_status ?? "not_required"),
      occupational_health_referral: !!r.occupational_health_referral,
    })),
  });

  return NextResponse.json({ data: result });
}
