// CARA — WRITING TO THE CHILD  ·  API
//   POST /api/v1/writing-to-child            { recordType, rawText, … } → review
//   GET  /api/v1/writing-to-child?examples   → example scenarios (poor records)
//   GET  /api/v1/writing-to-child?nodes      → the knowledge network (10 nodes)
//
// Deterministic-first: the review always returns; AI (when configured) only
// enriches the two wording suggestions. Cara advises — the practitioner owns
// the final record (disclaimer travels in every response).
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { enrichWritingReview } from "@/lib/writing-to-child/writing-to-child-engine";
import { WRITING_EXAMPLES } from "@/lib/writing-to-child/examples";
import { WRITING_NODES, WRITING_CORE_PRINCIPLE, WRITING_DISCLAIMER } from "@/lib/writing-to-child/knowledge";
import type { WritingRecordType, WritingTone } from "@/lib/writing-to-child/types";

export const dynamic = "force-dynamic";

const RECORD_TYPES: WritingRecordType[] = [
  "daily_log", "incident", "missing_episode", "key_work", "manager_oversight",
  "room_search", "education", "family_time", "health", "medication",
  "exploitation", "professional_meeting",
];

function strArr(v: unknown): string[] | undefined {
  return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : undefined;
}

export function GET(req: Request) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;
  const sp = new URL(req.url).searchParams;
  if (sp.has("nodes")) {
    return NextResponse.json({ data: { nodes: WRITING_NODES, principle: WRITING_CORE_PRINCIPLE, disclaimer: WRITING_DISCLAIMER } });
  }
  // default + ?examples → the example scenarios (inputs only; the UI runs them)
  return NextResponse.json({ data: { examples: WRITING_EXAMPLES, recordTypes: RECORD_TYPES, principle: WRITING_CORE_PRINCIPLE } });
}

export async function POST(req: Request) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown> = {};
  try { body = (await req.json()) as Record<string, unknown>; } catch { body = {}; }

  const rawText = typeof body.rawText === "string" ? body.rawText : "";
  if (!rawText.trim()) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }
  const recordType = RECORD_TYPES.includes(body.recordType as WritingRecordType)
    ? (body.recordType as WritingRecordType)
    : "daily_log";

  const review = await enrichWritingReview({
    recordType,
    rawText,
    childAge: typeof body.childAge === "number" ? body.childAge : undefined,
    childCommunicationNeeds: strArr(body.childCommunicationNeeds),
    knownFacts: strArr(body.knownFacts),
    childDirectQuotes: strArr(body.childDirectQuotes),
    practitionerConcern: typeof body.practitionerConcern === "string" ? body.practitionerConcern : undefined,
    desiredTone: typeof body.desiredTone === "string" ? (body.desiredTone as WritingTone) : undefined,
    childPreferredName: typeof body.childPreferredName === "string" ? body.childPreferredName : undefined,
  });

  return NextResponse.json({ data: review });
}
