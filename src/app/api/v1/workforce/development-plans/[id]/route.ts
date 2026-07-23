// ══════════════════════════════════════════════════════════════════════════════
// WORKFORCE — DEVELOPMENT PLAN (single record)
//
// PATCH /api/v1/workforce/development-plans/[id]
//
// useUpdateDevelopmentPlan has always PATCHed this path, but only the collection
// route existed, so every edit 404'd — development-plan changes could never be
// saved. Mirrors the collection route's store access and { data } shape.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const record = db.developmentPlans.findAll().find((p) => p.id === id);
  if (!record) return NextResponse.json({ error: "Development plan not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const updated = db.developmentPlans.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Development plan not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
