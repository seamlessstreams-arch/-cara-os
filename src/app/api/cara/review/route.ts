// CARA STUDIO — GET /api/cara/review  (manager review centre)
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  getCaraStudioOutputsForHome,
  getRecentCaraGuardrailEvents,
  getRecentCaraAiRuns,
} from "@/lib/supabase/cara-persist";

export const dynamic = "force-dynamic";

export async function GET() {
  // Live-safe: the review centre read the emptied-on-live store, so on a live
  // tenant the queue, recent drafts, guardrail events and AI runs were all empty
  // even though the cara_studio_* tables hold them. Read durably when live.
  const live = isSupabaseEnabled();

  const allOutputs = live ? await getCaraStudioOutputsForHome() : db.caraStudioOutputs.findAll();
  const queue = allOutputs
    .filter((o) => o.manager_review_status === "review_required")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const recent = allOutputs
    .filter((o) => o.manager_review_status !== "review_required")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);

  const guardrail_events = live
    ? await getRecentCaraGuardrailEvents(30)
    : db.caraGuardrailEvents.findRecent(30);
  const ai_runs = live
    ? await getRecentCaraAiRuns(30)
    : db.caraAiRuns.findAll().slice(-30).reverse();

  return NextResponse.json({ data: { queue, recent, guardrail_events, ai_runs } });
}
