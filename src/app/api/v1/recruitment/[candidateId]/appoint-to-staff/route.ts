// CARA — POST /api/v1/recruitment/[candidateId]/appoint-to-staff
//
// Phase 4 · Module 3. The candidate→staff bridge: turn a fully-cleared, appointed
// candidate into a real StaffMember record — the step the recruitment pipeline
// never had. Creating an official record, so it is deliberately conservative:
//   • flag-gated (candidate_to_staff_bridge, opt-in, default OFF) — off = no-op;
//   • MANAGE_STAFF permission required (server-side);
//   • human-initiated only (an explicit POST — never an automatic side-effect);
//   • the safeguarding gate (assessAppointment) must pass BEFORE anything is
//     written: appointed stage + safer-recruitment "cleared" + not already bridged.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { createRecruitmentAuditRecord } from "@/lib/supabase/recruitment-persist";
import {
  assessAppointment,
  mapCandidateToStaff,
  type DbsCheckLite,
} from "@/lib/workforce/candidate-to-staff";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  const { candidateId } = await params;

  // Dark by default — the bridge creates official records, so it stays off until
  // explicitly enabled. No-op (not an error) when off.
  if (!isFeatureEnabled("candidate_to_staff_bridge")) {
    return NextResponse.json({
      data: { enabled: false, appointed: false, reason: "candidate_to_staff_bridge is disabled" },
    });
  }

  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
  if (auth instanceof NextResponse) return auth;

  const candidate = db.candidateProfiles.findById(candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const existing = db.staff.findByCandidate(candidateId);

  // Safeguarding gate — evaluated before any write.
  const gate = assessAppointment({
    candidate: {
      id: candidate.id,
      current_stage: candidate.current_stage,
      compliance_status: candidate.compliance_status,
    },
    existingStaffId: existing?.id ?? null,
  });
  if (!gate.appointable) {
    return NextResponse.json(
      {
        data: {
          enabled: true,
          appointed: false,
          blockers: gate.blockers,
          existing_staff_id: existing?.id ?? null,
        },
      },
      { status: 409 },
    );
  }

  // Gather the source records and map onto a staff record.
  const vacancy = candidate.vacancy_id ? db.vacancies.findById(candidate.vacancy_id) ?? null : null;
  const offer = db.conditionalOffers.findByCandidate(candidateId);
  const dbs =
    db.candidateChecks.findByCandidate(candidateId).find((c) => c.check_type === "enhanced_dbs") ?? null;
  const dbsCheck: DbsCheckLite | null = dbs
    ? { certificate_number: dbs.certificate_number, verified_at: dbs.verified_at, received_at: dbs.received_at }
    : null;

  const mapped = mapCandidateToStaff({
    candidate,
    vacancy,
    offer,
    dbsCheck,
    nowIso: new Date().toISOString(),
  });

  const staff = db.staff.create({ ...mapped, created_by: auth.userId, updated_by: auth.userId });

  // Mark the candidate as appointed-to-staff (the pipeline's boolean); the
  // authoritative link is staff.candidate_id.
  db.candidateProfiles.update(candidateId, { appointed: true });

  createRecruitmentAuditRecord({
    candidate_id: candidateId,
    vacancy_id: candidate.vacancy_id ?? undefined,
    actor_id: auth.userId,
    event_type: "appointed_to_staff",
    entity_type: "candidate_profile",
    entity_id: candidateId,
    before_state: null,
    after_state: { staff_id: staff.id, role: staff.role, start_date: staff.start_date },
    notes: `Appointed to staff record ${staff.id} (${staff.full_name}, ${staff.role})`,
  });

  return NextResponse.json({ data: { enabled: true, appointed: true, staff } });
}
