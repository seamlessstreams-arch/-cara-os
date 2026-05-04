import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import type { CandidateReference } from "@/types/recruitment";

// ── GET /api/v1/recruitment/references?candidate_id= ─────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidate_id");

  const rawRefs = candidateId
    ? db.candidateReferences.findByCandidate(candidateId)
    : db.candidateReferences.findAll();

  const candidate = candidateId ? db.candidateProfiles.findById(candidateId) : null;
  const home_id = candidate?.home_id ?? "home_oak";

  const refs = rawRefs.map((r) => serializeRef(r, home_id));
  return NextResponse.json({ data: refs });
}

// ── POST /api/v1/recruitment/references ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { candidate_id, referee_name, referee_org, referee_role, referee_email,
    referee_phone, relationship, is_most_recent_employer } = body;

  if (!candidate_id || !referee_name || !relationship) {
    return NextResponse.json(
      { error: "candidate_id, referee_name, and relationship are required" },
      { status: 400 }
    );
  }

  const candidate = db.candidateProfiles.findById(candidate_id);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const ref = db.candidateReferences.create({
    candidate_id,
    referee_name,
    referee_role: referee_role ?? null,
    organisation_name: referee_org ?? "Unknown",
    email: referee_email ?? null,
    phone: referee_phone ?? null,
    relationship_to_candidate: relationship,
    is_most_recent_employer: is_most_recent_employer ?? false,
    requested_at: null,
    chased_at: null,
    received_at: null,
    structured_response: null,
    verbal_verification_completed: false,
    verbal_verified_by: null,
    verbal_verified_at: null,
    discrepancy_flag: false,
    discrepancy_notes: null,
    reliability_rating: null,
    status: "not_requested",
  });

  db.recruitmentAudit.create({
    candidate_id,
    actor_id: "staff_darren",
    event_type: "reference_added",
    entity_type: "candidate_reference",
    entity_id: ref.id,
    before_state: null,
    after_state: { referee_name, referee_org, relationship },
    notes: `Reference added: ${referee_name} (${referee_org ?? "no org"})`,
  });

  return NextResponse.json({ data: serializeRef(ref, candidate.home_id) }, { status: 201 });
}

// ── PATCH /api/v1/recruitment/references ─────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, candidate_id, status, received_date, employment_dates_confirmed,
    role_confirmed, performance_rating, safeguarding_concerns, safeguarding_detail,
    would_re_employ, would_re_employ_reason, discrepancy_flag, discrepancy_notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Reference id is required" }, { status: 400 });
  }

  const existing = db.candidateReferences.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }

  const updatedStructured = {
    dates_of_employment_confirmed: employment_dates_confirmed
      ?? existing.structured_response?.dates_of_employment_confirmed ?? null,
    role_confirmed: role_confirmed
      ?? existing.structured_response?.role_confirmed ?? null,
    performance_rating: performance_rating
      ?? existing.structured_response?.performance_rating ?? null,
    safeguarding_concerns: safeguarding_concerns
      ?? existing.structured_response?.safeguarding_concerns ?? null,
    would_re_employ: would_re_employ
      ?? existing.structured_response?.would_re_employ ?? null,
    additional_comments: would_re_employ_reason
      ?? existing.structured_response?.additional_comments ?? null,
  };

  const updated = db.candidateReferences.update(id, {
    ...(status !== undefined && { status }),
    ...(received_date !== undefined && { received_at: received_date }),
    ...(discrepancy_flag !== undefined && { discrepancy_flag }),
    ...(discrepancy_notes !== undefined && { discrepancy_notes }),
    structured_response: updatedStructured as CandidateReference["structured_response"],
  });

  if (!updated) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }

  // Audit
  const cidForAudit = candidate_id ?? existing.candidate_id;
  if (cidForAudit) {
    db.recruitmentAudit.create({
      candidate_id: cidForAudit,
      actor_id: "staff_darren",
      event_type: status ? `reference_${status}` : "reference_updated",
      entity_type: "candidate_reference",
      entity_id: id,
      before_state: null,
      after_state: body,
      notes: status === "satisfactory"
        ? `Reference from ${updated.referee_name} marked satisfactory`
        : discrepancy_flag
        ? `Discrepancy flagged on reference from ${updated.referee_name}`
        : `Reference from ${updated.referee_name} updated`,
    });
  }

  const candidateRecord = db.candidateProfiles.findById(updated.candidate_id);
  return NextResponse.json({ data: serializeRef(updated, candidateRecord?.home_id ?? "home_oak") });
}

// ── Serializer ────────────────────────────────────────────────────────────────

function serializeRef(r: CandidateReference, home_id: string) {
  return {
    id: r.id,
    candidate_id: r.candidate_id,
    referee_name: r.referee_name,
    referee_org: r.organisation_name ?? null,
    referee_role: r.referee_role ?? null,
    referee_email: r.email ?? null,
    referee_phone: r.phone ?? null,
    relationship: r.relationship_to_candidate,
    is_most_recent_employer: r.is_most_recent_employer,
    status: r.status,
    requested_date: r.requested_at ?? null,
    received_date: r.received_at ?? null,
    employment_dates_confirmed: r.structured_response?.dates_of_employment_confirmed ?? null,
    role_confirmed: r.structured_response?.role_confirmed ?? null,
    performance_rating: r.structured_response?.performance_rating ?? null,
    safeguarding_concerns: r.structured_response?.safeguarding_concerns ?? null,
    safeguarding_detail: null,
    would_re_employ: r.structured_response?.would_re_employ ?? null,
    would_re_employ_reason: r.structured_response?.additional_comments ?? null,
    discrepancy_flag: r.discrepancy_flag,
    discrepancy_notes: r.discrepancy_notes ?? null,
    home_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
