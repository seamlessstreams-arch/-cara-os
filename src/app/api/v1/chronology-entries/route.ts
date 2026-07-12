import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// GET /api/v1/chronology-entries?child_id=
// → chronology entries (all, or filtered to one child, newest-first).
//
// The catch-all SLUG_MAP entry for "chronology-entries" is intentionally
// disabled, but useChronologyEntries (on /safeguarding) needs this collection
// endpoint, so it is served explicitly here.
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const data = childId ? db.chronology.findByChild(childId) : db.chronology.findAll();
  return NextResponse.json({ data });
}

// POST /api/v1/chronology-entries → create a chronology entry
export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Record<string, unknown>;

  // A chronology row is part of a child's timeline of record — an empty POST
  // must not mint a blank entry (live probe proved `{}` returned 201). Require
  // the identifying essentials; every real caller already sends them.
  const missing = ["child_id", "date"].filter(
    (f) => typeof body[f] !== "string" || !(body[f] as string).trim(),
  );
  const hasText =
    (typeof body.title === "string" && body.title.trim()) ||
    (typeof body.description === "string" && body.description.trim());
  if (missing.length > 0 || !hasText) {
    return NextResponse.json(
      { error: `Missing required fields: ${[...missing, ...(hasText ? [] : ["title or description"])].join(", ")}` },
      { status: 400 },
    );
  }
  const denied = assertChildHomeAccess(identity, body.child_id as string);
  if (denied) return denied;

  const entry = db.chronology.create({ recorded_by: identity.userId, ...body });
  return NextResponse.json({ data: entry }, { status: 201 });
}
