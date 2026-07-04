// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP Thinking API (structured thinking at decision points)
//
// GET  → list sessions (filter: childId / context / status), each with its
//        computed status, plus the five stage definitions (one source of truth
//        for the UI's questions).
// POST → kind:"create"   — open a session (traceability: ≥1 source record);
//        kind:"answer"   — record answers for a stage (attributed to a human);
//        kind:"complete" — close the session; completing with unanswered
//                          questions requires an honest incompleteReason.
//
// TAP structures the thinking; the answers belong to the professionals.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { computeTapStatus, TAP_STAGE_DEFINITIONS } from "@/lib/tap-thinking/tap-engine";
import {
  answerTapQuestions,
  completeTapSession,
  createTapSession,
  getTapSession,
  listTapSessions,
} from "@/lib/tap-thinking/session-service";
import { TAP_CONTEXT_LABELS, type TapContext, type TapStage } from "@/lib/tap-thinking/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const context = params.get("context");
  const sessions = listTapSessions({
    childId: params.get("childId") ?? undefined,
    context: context && context in TAP_CONTEXT_LABELS ? (context as TapContext) : undefined,
    status: status === "in_progress" || status === "complete" ? status : undefined,
  });
  return NextResponse.json({
    data: sessions.map((session) => ({ session, status: computeTapStatus(session) })),
    meta: { total: sessions.length },
    stages: TAP_STAGE_DEFINITIONS,
    contexts: TAP_CONTEXT_LABELS,
  });
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const kind = typeof body.kind === "string" ? body.kind : "";
  const actor = str(body.actor) ?? auth.userId;

  if (kind === "create") {
    const context = str(body.context);
    if (!context || !(context in TAP_CONTEXT_LABELS)) {
      return NextResponse.json({ error: "A valid context is required (e.g. care_planning, risk_review, management_oversight)." }, { status: 422 });
    }
    const result = createTapSession({
      createdBy: actor,
      childId: str(body.childId),
      childName: str(body.childName),
      context: context as TapContext,
      purpose: str(body.purpose) ?? "",
      sourceRecords: Array.isArray(body.sourceRecords) ? (body.sourceRecords as never[]) : [],
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json({ data: { session: result.value, status: computeTapStatus(result.value) } }, { status: 201 });
  }

  const sessionId = str(body.sessionId);
  if (!sessionId) return NextResponse.json({ error: "sessionId is required." }, { status: 422 });

  if (kind === "answer") {
    const result = answerTapQuestions(
      sessionId,
      actor,
      str(body.stage) as TapStage,
      Array.isArray(body.answers) ? (body.answers as Array<{ question: string; answer: string }>) : [],
    );
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json({ data: { session: result.value, status: computeTapStatus(result.value) } }, { status: 201 });
  }

  if (kind === "complete") {
    const result = completeTapSession(sessionId, actor, {
      incompleteReason: str(body.incompleteReason),
      ethicalEventId: str(body.ethicalEventId),
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    const session = getTapSession(sessionId);
    return NextResponse.json({ data: { session, status: session ? computeTapStatus(session) : null } }, { status: 201 });
  }

  return NextResponse.json({ error: `Unknown kind "${kind}". Expected create | answer | complete.` }, { status: 422 });
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
