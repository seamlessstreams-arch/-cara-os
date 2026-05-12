import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  getHomeAuditTrail, getEntityAuditTrail,
  getUserAuditTrail, searchAuditLog, getAuditStats,
} from "@/lib/services/audit-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Entity-specific audit trail
  if (type === "entity") {
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
    }
    const result = await getEntityAuditTrail(entityType, entityId, {
      limit: parseInt(searchParams.get("limit") ?? "100"),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // User audit trail
  if (type === "user") {
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    const result = await getUserAuditTrail(userId, {
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: parseInt(searchParams.get("limit") ?? "100"),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Search
  if (type === "search") {
    if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
    const q = searchParams.get("q");
    if (!q) return NextResponse.json({ error: "q (search term) required" }, { status: 400 });
    const result = await searchAuditLog(homeId, q, {
      limit: parseInt(searchParams.get("limit") ?? "50"),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Stats
  if (type === "stats") {
    if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
    const result = await getAuditStats(
      homeId,
      searchParams.get("from") ?? undefined,
      searchParams.get("to") ?? undefined,
    );
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Default: home audit trail
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  const result = await getHomeAuditTrail(homeId, {
    entityType: searchParams.get("entityType") ?? undefined,
    action: searchParams.get("action") as any ?? undefined,
    performedBy: searchParams.get("performedBy") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "100"),
    offset: parseInt(searchParams.get("offset") ?? "0"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}
