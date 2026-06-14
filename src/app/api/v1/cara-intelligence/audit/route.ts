import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { CaraAuditEntry, AuditActionType } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const homeId  = searchParams.get("home_id") ?? "home_oak";
  const limit   = parseInt(searchParams.get("limit") ?? "100", 10);

  let results = childId
    ? intelligenceDb.caraAuditTrail.findByChild(childId)
    : intelligenceDb.caraAuditTrail.findAll(homeId);

  results = results.slice(0, limit);

  return NextResponse.json({ data: results, meta: { total: results.length } });
}

export async function POST(req: NextRequest) {
  let body: Partial<CaraAuditEntry>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.user_id) return NextResponse.json({ error: "Missing required field: user_id" }, { status: 400 });
  if (!body.action_type) return NextResponse.json({ error: "Missing required field: action_type" }, { status: 400 });

  const entry = intelligenceDb.caraAuditTrail.create({
    home_id:        body.home_id ?? "home_oak",
    user_id:        body.user_id,
    child_id:       body.child_id,
    action_type:    body.action_type as AuditActionType,
    source_table:   body.source_table,
    source_id:      body.source_id,
    ai_prompt:      body.ai_prompt,
    ai_response:    body.ai_response,
    human_edit:     body.human_edit,
    approval_status:body.approval_status,
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
