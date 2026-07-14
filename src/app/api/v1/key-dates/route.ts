// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEY DATES API
//
// Aggregates all upcoming deadlines, birthdays, reviews, and expiry dates
// across the system. Returns a prioritised list sorted by urgency with
// stats for the dashboard widget. Replaces the stale catch-all mapping
// that returned raw youngPeople data.
//
// GET /api/v1/key-dates
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeKeyDates } from "@/lib/engines/key-dates-engine";

export const dynamic = "force-dynamic";

function staffName(id: string, store: ReturnType<typeof getStore>): string {
  const staff = (store.staff ?? []).find((s) => s.id === id);
  if (staff) return staff.full_name ?? id;
  return id?.replace("staff_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Unknown";
}

function ypName(id: string, store: ReturnType<typeof getStore>): string {
  const yp = (store.youngPeople ?? []).find((y) => y.id === id);
  if (yp) {
    return yp.preferred_name ?? yp.first_name ?? id;
  }
  return id?.replace("yp_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Unknown";
}

export async function GET(_req: NextRequest) {
  const store = getStore();

  const result = computeKeyDates({
    youngPeople: (store.youngPeople ?? []).map((yp) => ({
      id: yp.id,
      first_name: yp.first_name,
      last_name: yp.last_name,
      preferred_name: yp.preferred_name,
      date_of_birth: yp.date_of_birth,
      placement_start: yp.placement_start,
      status: yp.status,
    })),

    staff: (store.staff ?? []).map((s) => ({
      id: s.id,
      full_name: s.full_name,
      first_name: s.first_name,
      employment_status: s.employment_status,
      next_supervision_due: s.next_supervision_due,
      next_appraisal_due: s.next_appraisal_due,
      probation_end_date: s.probation_end_date,
      dbs_issue_date: s.dbs_issue_date,
      dbs_update_service: s.dbs_update_service,
    })),

    trainingRecords: (store.trainingRecords ?? []).map((t) => ({
      id: t.id,
      staff_id: t.staff_id,
      course_name: t.course_name,
      expiry_date: t.expiry_date,
      status: t.status,
      is_mandatory: t.is_mandatory,
    })),

    supervisions: (store.supervisions ?? []).map((s) => ({
      id: s.id,
      staff_id: s.staff_id,
      type: s.type,
      scheduled_date: s.scheduled_date,
      actual_date: s.actual_date,
      status: s.status,
      next_date: s.next_date,
    })),

    lacReviews: (store.lacReviews ?? []).map((l) => ({
      id: l.id,
      child_id: l.child_id,
      next_review_date: l.next_review_date,
      review_type: l.review_type,
    })),

    behaviourSupportPlans: (store.behaviourSupportPlans ?? []).map((b) => ({
      id: b.id,
      child_id: b.child_id,
      review_date: b.review_date,
      status: b.status,
    })),

    staffNameLookup: (id: string) => staffName(id, store),
    ypNameLookup: (id: string) => ypName(id, store),
  });

  return NextResponse.json(result);
}
