import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { evaluateCandidateRules } from "@/lib/recruitment-rules";

// ── PATCH /api/v1/recruitment/offers ─────────────────────────────────────────
// Supports: grant_final_clearance, update offer details

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { candidate_id, action, by } = body;

  if (!candidate_id) {
    return NextResponse.json({ error: "candidate_id is required" }, { status: 400 });
  }

  const candidate = db.candidateProfiles.findById(candidate_id);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const offer = db.conditionalOffers.findByCandidate(candidate_id);
  if (!offer) {
    return NextResponse.json({ error: "No offer found for this candidate" }, { status: 404 });
  }

  // ── Grant Final Clearance ───────────────────────────────────────────────────
  if (action === "grant_final_clearance") {
    const checks = db.candidateChecks.findByCandidate(candidate_id);
    const references = db.candidateReferences.findByCandidate(candidate_id);
    const gaps = db.gapExplanations.findByCandidate(candidate_id);

    const rules = evaluateCandidateRules(candidate, checks, references, gaps, offer);
    if (!rules.can_progress && rules.blockers.length > 0) {
      return NextResponse.json(
        {
          error: "Final clearance blocked — compliance issues must be resolved first",
          blockers: rules.blockers.map((b) => b.message),
        },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const updated = db.conditionalOffers.update(offer.id, {
      final_clearance_completed_at: now,
      final_clearance_by: by ?? "staff_darren",
      status: "final_accepted",
    });

    db.recruitmentAudit.create({
      candidate_id,
      actor_id: by ?? "staff_darren",
      event_type: "final_clearance_granted",
      entity_type: "conditional_offer",
      entity_id: offer.id,
      before_state: null,
      after_state: { final_clearance_completed_at: now, final_clearance_by: by ?? "staff_darren" },
      notes: `Final clearance granted by ${by ?? "staff_darren"}`,
    });

    return NextResponse.json({ data: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
