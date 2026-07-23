// ══════════════════════════════════════════════════════════════════════════════
// WORKFORCE — APPRAISAL (single record)
//
// PATCH /api/v1/workforce/appraisals/[id]
//
// useUpdateAppraisal has always PATCHed this path, but only the collection route
// (/workforce/appraisals) existed, so every edit 404'd — appraisal changes could
// never be saved. Mirrors the collection route's store access and its
// { data } response shape.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const record = db.appraisals.findAll().find((a) => a.id === id);
  if (!record) return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
  return NextResponse.json({ data: record });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const updated = db.appraisals.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
