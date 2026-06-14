// CARA INTELLIGENCE — PACE API
//   POST /api/v1/pace/analyse { text, context, riskPresentHint? }
//     → analyse a record for PACE quality (recognise + score + recommend)
//   POST /api/v1/pace/analyse?mode=recording  → recording-assistant suggestions
//   GET  /api/v1/pace/analyse?context=INCIDENT → PACE guidance for a context
// Deterministic (no AI key). Cara advises; humans decide.
import { NextResponse } from "next/server";
import { analyzePACE, assistRecording, getPACEGuidance, type PACEContext } from "@/lib/cara-intelligence/pace";

export const dynamic = "force-dynamic";

const CONTEXTS = new Set<PACEContext>([
  "DAILY_LOG", "INCIDENT", "MISSING_FROM_CARE", "KEY_WORK", "DEBRIEF", "SANCTION",
  "PHYSICAL_INTERVENTION", "COMPLAINT", "ROOM_SEARCH", "FAMILY_CONTACT", "EDUCATION",
  "HEALTH", "SESSION_PLAN", "STAFF_SUPERVISION",
]);
function ctxOf(v: unknown, fallback: PACEContext = "DAILY_LOG"): PACEContext {
  return typeof v === "string" && CONTEXTS.has(v as PACEContext) ? (v as PACEContext) : fallback;
}

export function GET(req: Request) {
  const url = new URL(req.url);
  const context = ctxOf(url.searchParams.get("context"));
  return NextResponse.json({ data: getPACEGuidance(context, url.searchParams.get("scenario") ?? "") });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const text = String(body.text ?? "");
  if (text.trim().length < 5) {
    return NextResponse.json({ error: "Provide the record text to analyse." }, { status: 400 });
  }
  const context = ctxOf(body.context);
  const input = { text, context, childId: body.childId ?? null, staffId: body.staffId ?? null, homeId: body.homeId ?? null, riskPresentHint: !!body.riskPresentHint };
  if (url.searchParams.get("mode") === "recording") {
    return NextResponse.json({ data: assistRecording(input) });
  }
  const result = analyzePACE(input);
  // Best-effort metadata-only history → powers the recording-quality trend.
  // Never blocks or fails the call; no record content is stored.
  void import("@/lib/practice-history/record")
    .then((m) => m.recordPaceAnalysis({
      homeId: input.homeId, childId: input.childId, staffId: input.staffId,
      context, score: result.score.overall, band: result.score.band,
      flagCount: result.flags.length, managerReviewRequired: result.managerReviewRequired,
    }))
    .catch(() => {});
  return NextResponse.json({ data: result });
}
