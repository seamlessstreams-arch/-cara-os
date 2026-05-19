import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

const HOME_ID = "home_oak";

// GET /api/v1/aria-studio/sources
// Query params: home_id, child_id, source_type, limit
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? HOME_ID;
  const childId = searchParams.get("child_id");
  const sourceType = searchParams.get("source_type");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  let items = db.ariaSources.findAll(homeId);

  if (childId) items = items.filter((s) => s.child_id === childId);
  if (sourceType) items = items.filter((s) => s.source_type === sourceType);

  items = items.sort((a, b) =>
    new Date(b.source_date).getTime() - new Date(a.source_date).getTime()
  );

  const paginated = items.slice(0, limit);

  return NextResponse.json({
    data: paginated,
    meta: { total: items.length },
  });
}
