import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { PracticeBankEntry } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const activeOnly = searchParams.get("active") !== "false"; // default to active only

  if (!childId) {
    return NextResponse.json({ error: "child_id is required" }, { status: 400 });
  }

  let results = intelligenceDb.practiceBank.findByChild(childId);
  if (activeOnly) {
    results = results.filter((p) => p.is_active);
  }

  return NextResponse.json({
    data: results,
    meta: { total: results.length },
  });
}

export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Partial<PracticeBankEntry>;
  const denied = assertChildHomeAccess(identity, (body as { child_id?: string }).child_id);
  if (denied) return denied;

  const required = ["child_id", "category", "title", "description"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const validCategories = [
    "what_works", "what_to_avoid", "language", "preparation",
    "repair", "regulation", "engagement", "education", "general",
  ];
  if (!validCategories.includes(body.category!)) {
    return NextResponse.json(
      { error: `category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const entry = intelligenceDb.practiceBank.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id!,
    category: body.category!,
    title: body.title!,
    description: body.description!,
    evidence: body.evidence ?? null,
    contributed_by: body.contributed_by ?? null,
    reviewed_by: body.reviewed_by ?? null,
    reviewed_at: body.reviewed_at ?? null,
    is_active: body.is_active ?? true,
    created_by: body.created_by ?? "staff_darren",
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
