// CARA STUDIO — GET /api/cara/review  (manager review centre)
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const queue = db.caraStudioOutputs
    .findNeedingReview()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const recent = db.caraStudioOutputs
    .findAll()
    .filter((o) => o.manager_review_status !== "review_required")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);
  return NextResponse.json({
    data: {
      queue,
      recent,
      guardrail_events: db.caraGuardrailEvents.findRecent(30),
      ai_runs: db.caraAiRuns.findAll().slice(-30).reverse(),
    },
  });
}
