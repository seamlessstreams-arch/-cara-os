// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/summarise
// Convenience wrapper — calls invokeCaraCommand with commandId "summarise_text".
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { invokeCaraCommand } from "@/lib/cara/cara-service";
import type { CaraActor, CaraRole } from "@/lib/cara/cara-permissions";

function actorFromBody(body: Record<string, unknown>): CaraActor | null {
  const userId = typeof body.actorUserId === "string" ? body.actorUserId : "";
  const role = typeof body.actorRole === "string" ? (body.actorRole as CaraRole) : "none";
  if (!userId) return null;
  return { userId, role, organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined, homeId: typeof body.homeId === "string" ? body.homeId : undefined };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const actor = actorFromBody(body);
  if (!actor) return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });

  const inputText = typeof body.inputText === "string" ? body.inputText : "";
  if (!inputText.trim()) return NextResponse.json({ error: "inputText is required" }, { status: 400 });

  const outcome = await invokeCaraCommand({
    actor,
    commandId: "summarise_text",
    organisationId: actor.organisationId,
    homeId: actor.homeId,
    childId: typeof body.childId === "string" ? body.childId : undefined,
    sourceModule: typeof body.sourceModule === "string" ? body.sourceModule : undefined,
    sourceRecordId: typeof body.sourceRecordId === "string" ? body.sourceRecordId : undefined,
    inputText,
  });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.errorReason ?? "Failed" }, { status: outcome.status });
  }
  return NextResponse.json({ data: outcome.result });
}
