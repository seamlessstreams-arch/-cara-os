// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DISCIPLINARY INTELLIGENCE API ROUTE
// GET /api/v1/staff-disciplinary-intelligence
// Returns staff disciplinary case analysis: timelines, outcomes,
// category patterns, support measures, LADO referrals, and Cara intelligence.
// Reg 33: fitness of staff — Reg 34: employment of staff
// Reg 21: supervision of staff (Schedule 4)
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeStaffDisciplinaryIntelligence,
  type DisciplinaryInput,
  type StaffRef,
} from "@/lib/engines/staff-disciplinary-intelligence-engine";

export async function GET() {
  const [staffList, staffDisciplinaryRecordsList] = await Promise.all([
      dal.staff.findAll(),
      dal.staffDisciplinaryRecords.findAll(),
    ]);

  const cases: DisciplinaryInput[] = (staffDisciplinaryRecordsList ?? []).map((r) => ({
    id: r.id,
    staff_id: r.staff_member ?? "",
    date_raised: typeof r.date_raised === "string" ? r.date_raised.slice(0, 10) : r.date_raised,
    category: r.category ?? "conduct",
    severity: r.severity ?? "informal",
    status: r.stage ?? "open",
    investigating_officer: r.investigator ?? "",
    outcome: r.outcome ?? "pending",
    date_concluded: r.investigation_end_date ? (typeof r.investigation_end_date === "string" ? r.investigation_end_date.slice(0, 10) : r.investigation_end_date) : null,
    days_to_resolution: r.investigation_end_date && r.date_raised
      ? Math.round((new Date(r.investigation_end_date).getTime() - new Date(r.date_raised).getTime()) / 86_400_000)
      : null,
    lado_referral: r.lado_notified ?? false,
    suspension: r.suspended ?? false,
    support_offered: r.support_offered ?? [],
  }));

  const staff: StaffRef[] = (staffList ?? [])
    .filter((s) => s.is_active)
    .map((s) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeStaffDisciplinaryIntelligence({ cases, staff });
  return NextResponse.json({ data: result });
}
