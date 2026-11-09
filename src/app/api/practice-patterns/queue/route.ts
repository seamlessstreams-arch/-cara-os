// ══════════════════════════════════════════════════════════════════════════════
// GET /api/practice-patterns/queue — the review queue (4d)
//
// Pending candidates, ordered by curator tier (1 → 3, then untiered) and
// oldest first within a tier. Manager-only, like every intake route.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { isCandidateRecord } from "@/lib/practice-patterns/intake-pipeline";
import { candidateStore } from "@/lib/practice-patterns/intake-store";
import { orderReviewQueue } from "@/lib/practice-patterns/review-queue";

export async function GET(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.APPROVE_LEARNING_RESOURCES);
  if (auth instanceof NextResponse) return auth;

  try {
    const queue = orderReviewQueue((await candidateStore.findAll()).filter(isCandidateRecord));
    return NextResponse.json({ data: queue, meta: { total: queue.length } });
  } catch {
    return NextResponse.json(
      { error: "Queue unavailable", detail: "The review queue could not be read." },
      { status: 503 },
    );
  }
}
