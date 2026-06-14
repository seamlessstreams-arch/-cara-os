// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/sources — List and index sources
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { listSources, indexSource } from "@/lib/cara-studio/source.service";
import { getUserIdFromRequest } from "@/lib/auth-guard";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await listSources(homeId(), {
      childId: searchParams.get("child_id") ?? undefined,
      sourceType: searchParams.get("source_type") ?? undefined,
      dateFrom: searchParams.get("date_from") ?? undefined,
      dateTo: searchParams.get("date_to") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[cara-studio/sources] GET error:", err);
    return NextResponse.json({ error: "Failed to list sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = getUserIdFromRequest(req);

    if (!body.source_type) {
      return NextResponse.json({ error: "source_type is required" }, { status: 400 });
    }

    const source = await indexSource({
      ...body,
      home_id: homeId(),
      created_by: userId,
    });

    return NextResponse.json({ data: source }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/sources] POST error:", err);
    return NextResponse.json({ error: "Failed to index source" }, { status: 500 });
  }
}
