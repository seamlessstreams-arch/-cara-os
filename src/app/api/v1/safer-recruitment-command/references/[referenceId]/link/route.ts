// ══════════════════════════════════════════════════════════════════════════════
// CARA — ISSUE SECURE REFERENCE LINK  (manager-side)
//
// Mints a one-time, 7-day token for the referee form and returns the link
// ONCE for the manager to share. Only the SHA-256 hash is stored. Nothing is
// ever sent externally by the system — sharing the link is the manager's act.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { createRecruitmentAuditRecord, updateCandidateReferenceRecord } from "@/lib/supabase/recruitment-persist";
import { issueToken } from "@/lib/safer-recruitment/reference-link-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ referenceId: string }> }) {
  const { referenceId } = await ctx.params;
  const reference = db.candidateReferences.findById(referenceId);
  if (!reference) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }
  if (reference.received_at) {
    return NextResponse.json({ error: "This reference has already been received" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const issued = issueToken(now);

  updateCandidateReferenceRecord(referenceId, {
    secure_token_hash: issued.secure_token_hash,
    token_expires_at: issued.token_expires_at,
    token_used_at: null,
    requested_at: reference.requested_at ?? now,
    status: reference.status === "not_requested" ? "requested" : reference.status,
  });

  const actor = req.headers.get("x-user-id") ?? "staff_darren";
  createRecruitmentAuditRecord({
    candidate_id: reference.candidate_id,
    actor_id: actor,
    event_type: "reference_link_issued",
    entity_type: "candidate_reference",
    entity_id: referenceId,
    before_state: null,
    after_state: { token_expires_at: issued.token_expires_at },
    notes: `Secure one-time reference link issued for ${reference.referee_name} (${reference.organisation_name}). Token stored hashed; link shown once to the manager.`,
  });

  const origin = req.headers.get("origin") ?? `https://${req.headers.get("host") ?? "cara-os-fresh.vercel.app"}`;
  return NextResponse.json({
    data: {
      link: `${origin}/reference/${issued.token}`,
      expires_at: issued.token_expires_at,
      referee_name: reference.referee_name,
      note: "Share this link with the referee yourself — it is shown once and is valid for 7 days, single use.",
    },
  });
}
