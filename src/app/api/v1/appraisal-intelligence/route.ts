// ══════════════════════════════════════════════════════════════════════════════
// CARA — APPRAISAL INTELLIGENCE API ROUTE
// GET /api/v1/appraisal-intelligence
// Returns staff appraisal compliance analysis, competency breakdown,
// rating distribution, fitness confirmation, and Cara workforce insights.
// Reg 32 (fitness of workers), Reg 33 (employment of staff), SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeAppraisalIntelligence,
  type AppraisalInput,
  type StaffRef,
} from "@/lib/engines/appraisal-intelligence-engine";

export async function GET() {
  const [appraisalsList, staffList] = await Promise.all([
      dal.appraisals.findAll(),
      dal.staff.findAll(),
    ]);

  // ── Map appraisals ───────────────────────────────────────────────────
  const appraisals: AppraisalInput[] = (appraisalsList ?? []).map((a) => ({
    id: a.id,
    staff_id: a.staff_id,
    appraisal_type: a.appraisal_type,
    appraisal_date: a.appraisal_date,
    appraiser_id: a.appraiser_id,
    status: a.status,
    overall_rating: a.overall_rating ?? null,
    competency_scores: a.competency_scores ?? {},
    signed_by_staff: a.signed_by_staff ?? false,
    next_review_date: a.next_review_date ?? null,
    objectives_next_period: a.objectives_next_period ?? null,
    created_at: a.created_at,
  }));

  // ── Map active staff ─────────────────────────────────────────────────
  const staff: StaffRef[] = (staffList ?? []).map((s) => ({
    id: s.id,
    name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    // absence-ok: roster read — an unrecorded flag INCLUDES the staff member in appraisal tracking, demanding more evidence, never less
    is_active: s.is_active ?? true,
  }));

  // ── Run engine ───────────────────────────────────────────────────────
  const result = computeAppraisalIntelligence({ appraisals, staff });

  return NextResponse.json({ data: result });
}
