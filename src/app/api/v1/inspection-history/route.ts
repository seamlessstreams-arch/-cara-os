import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// GET /api/v1/inspection-history
// Returns inspection records sorted newest first.
// Optional query params: latest=true (returns only the most recent record)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latestOnly = searchParams.get("latest") === "true";

  if (latestOnly) {
    const latest = db.inspectionHistory.latest();
    return NextResponse.json({ data: latest ?? null });
  }

  const records = db.inspectionHistory.findAll();
  return NextResponse.json({ data: records, meta: { total: records.length } });
}

// POST /api/v1/inspection-history
// Creates a new inspection record. Manager/RI role required (enforced at UI level).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const record = db.inspectionHistory.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
