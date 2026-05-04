import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// ── GET /api/v1/recruitment/checks?candidate_id= ──────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidate_id");

  const rawChecks = candidateId
    ? db.candidateChecks.findByCandidate(candidateId)
    : db.candidateChecks.findAll();

  const candidate = candidateId ? db.candidateProfiles.findById(candidateId) : null;
  const home_id = candidate?.home_id ?? "home_oak";

  const checks = rawChecks.map((c) => ({
    id: c.id,
    candidate_id: c.candidate_id,
    check_type: c.check_type,
    status: c.status,
    owner: c.owner_id ?? null,
    requested_date: c.requested_at ?? null,
    received_date: c.received_at ?? null,
    verified_by: c.verified_by ?? null,
    verified_at: c.verified_at ?? null,
    expiry_date: c.document_expiry ?? null,
    certificate_number: c.certificate_number ?? null,
    document_type: c.document_type ?? null,
    concern_flag: c.concern_flag,
    concern_notes: c.concern_summary ?? null,
    override_reason: c.override_reason ?? null,
    override_by: c.overridden_by ?? null,
    override_at: c.overridden_at ?? null,
    risk_mitigation: null,
    notes: null,
    home_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));

  return NextResponse.json({ data: checks });
}

// ── PATCH /api/v1/recruitment/checks ─────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, candidate_id, status, verified_by, verified_at, received_date,
    requested_date, certificate_number, document_type, expiry_date,
    concern_flag, concern_notes, override_reason, risk_mitigation, notes, owner } = body;

  if (!id) {
    return NextResponse.json({ error: "Check id is required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const updated = db.candidateChecks.update(id, {
    ...(status !== undefined && { status }),
    ...(owner !== undefined && { owner_id: owner }),
    ...(requested_date !== undefined && { requested_at: requested_date }),
    ...(received_date !== undefined && { received_at: received_date }),
    ...(verified_by !== undefined && { verified_by }),
    ...(verified_at !== undefined && { verified_at }),
    ...(certificate_number !== undefined && { certificate_number }),
    ...(document_type !== undefined && { document_type }),
    ...(expiry_date !== undefined && { document_expiry: expiry_date }),
    ...(concern_flag !== undefined && { concern_flag }),
    ...(concern_notes !== undefined && { concern_summary: concern_notes }),
    ...(override_reason !== undefined && { override_reason }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }

  // Write audit entry
  if (candidate_id) {
    db.recruitmentAudit.create({
      candidate_id,
      actor_id: "staff_darren",
      event_type: `check_${status ?? "updated"}`,
      entity_type: "candidate_check",
      entity_id: id,
      before_state: null,
      after_state: body,
      notes: status === "verified"
        ? `${updated.check_type.replace(/_/g, " ")} verified by ${verified_by ?? "manager"}`
        : concern_flag
        ? `Concern flagged on ${updated.check_type.replace(/_/g, " ")}`
        : `${updated.check_type.replace(/_/g, " ")} updated`,
    });
  }

  // Serialize to hook shape
  const result = {
    id: updated.id,
    candidate_id: updated.candidate_id,
    check_type: updated.check_type,
    status: updated.status,
    owner: updated.owner_id ?? null,
    requested_date: updated.requested_at ?? null,
    received_date: updated.received_at ?? null,
    verified_by: updated.verified_by ?? null,
    verified_at: updated.verified_at ?? null,
    expiry_date: updated.document_expiry ?? null,
    certificate_number: updated.certificate_number ?? null,
    document_type: updated.document_type ?? null,
    concern_flag: updated.concern_flag,
    concern_notes: updated.concern_summary ?? null,
    override_reason: updated.override_reason ?? null,
    override_by: updated.overridden_by ?? null,
    override_at: updated.overridden_at ?? null,
    risk_mitigation: null,
    notes: null,
    home_id: "home_oak",
    created_at: updated.created_at,
    updated_at: now,
  };

  return NextResponse.json({ data: result });
}
