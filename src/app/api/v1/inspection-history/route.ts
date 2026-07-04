import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// GET /api/v1/inspection-history          → list (newest first)
// GET /api/v1/inspection-history?latest=true → single latest record (or null)
export async function GET(req: NextRequest) {
  const latest = req.nextUrl.searchParams.get("latest") === "true";
  if (latest) {
    return NextResponse.json({ data: db.inspectionHistory.latest() ?? null });
  }
  const data = db.inspectionHistory.findAll();
  return NextResponse.json({ data, meta: { total: data.length } });
}

// POST /api/v1/inspection-history → create
export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_INSPECTION);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const record = db.inspectionHistory.create(body);
  return NextResponse.json({ data: record }, { status: 201 });
}
