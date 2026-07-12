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
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const entry = db.chronology.create(body);
  return NextResponse.json({ data: entry }, { status: 201 });
}
