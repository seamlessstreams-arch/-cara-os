// ══════════════════════════════════════════════════════════════════════════════
// POST /api/practice-patterns/queue/:id/draft — an optional paraphrase draft (4e)
//
// Saves a draft on the candidate for the reviewer to edit. It never changes
// the candidate's status: nothing auto-publishes. The model call goes through
// the governed AI gateway; with no AI available the deterministic draft is
// saved instead. Manager-only, like every intake route.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { isCandidateRecord, type PatternCandidate } from "@/lib/practice-patterns/intake-pipeline";
import { candidateStore } from "@/lib/practice-patterns/intake-store";
import { draftParaphrase } from "@/lib/practice-patterns/paraphrase-draft";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.APPROVE_LEARNING_RESOURCES);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  let candidate: PatternCandidate | null;
  try {
    const found = await candidateStore.findById(id);
    candidate = isCandidateRecord(found) ? found : null;
  } catch {
    return NextResponse.json({ error: "Queue unavailable", detail: "The candidate could not be read." }, { status: 503 });
  }
  if (!candidate) {
    return NextResponse.json({ error: "Not found", detail: "No candidate with that id is in the review queue." }, { status: 404 });
  }
  if (candidate.status !== "pending_review") {
    return NextResponse.json({ error: "Already decided", detail: "Drafts are only for candidates still in review." }, { status: 409 });
  }

  const outcome = await draftParaphrase(candidate, { userId: auth.userId, role: auth.role }, new Date().toISOString());

  try {
    const updated = await candidateStore.update(candidate.id, { draft: outcome.draft, updated_by: auth.userId });
    if (!updated) {
      return NextResponse.json({ error: "Not saved", detail: "The candidate is no longer in the queue." }, { status: 409 });
    }
    return NextResponse.json({ data: updated, draft: outcome.draft, ai: outcome.ai });
  } catch {
    return NextResponse.json({ error: "Not saved", detail: "The draft could not be saved." }, { status: 500 });
  }
}
