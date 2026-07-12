// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INCIDENT MODE · TIMELINE API
// POST /api/v1/cara-incident/[sessionId]/timeline  { entry_type, raw_text }
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ENTRY_TYPES } from "@/lib/cara-incident/cara-incident-engine";
import { findSession, addTimelineEntry, currentUserId, buildSessionBundle } from "@/lib/cara-incident/incident-service";
import { readJsonBody } from "@/lib/http/read-json";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = findSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as any;
  const raw_text = String(body.raw_text ?? "").trim();
  const entry_type = String(body.entry_type ?? "observation");

  if (!raw_text) return NextResponse.json({ ok: false, error: "Write a brief note first." }, { status: 400 });
  if (!ENTRY_TYPES.some((t) => t.key === entry_type)) {
    return NextResponse.json({ ok: false, error: "Unknown entry type." }, { status: 400 });
  }

  addTimelineEntry({ session, entry_type, raw_text, user_id: currentUserId(req) });
  return NextResponse.json({ ok: true, data: buildSessionBundle(session) }, { status: 201 });
}
