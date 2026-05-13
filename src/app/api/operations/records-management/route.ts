import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAudits,
  createAudit,
  listAccessRequests,
  createAccessRequest,
  updateAccessRequest,
  RECORD_CATEGORIES,
  RECORD_STATUSES,
  ACCESS_REQUEST_STATUSES,
  RETENTION_PERIODS,
  DATA_QUALITY_RATINGS,
} from "@/lib/services/records-management-service";
import type {
  DataQualityRating,
  AccessRequestStatus,
} from "@/lib/services/records-management-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "record_categories") {
    return NextResponse.json({ ok: true, data: RECORD_CATEGORIES });
  }
  if (type === "record_statuses") {
    return NextResponse.json({ ok: true, data: RECORD_STATUSES });
  }
  if (type === "access_request_statuses") {
    return NextResponse.json({ ok: true, data: ACCESS_REQUEST_STATUSES });
  }
  if (type === "retention_periods") {
    return NextResponse.json({ ok: true, data: RETENTION_PERIODS });
  }
  if (type === "data_quality_ratings") {
    return NextResponse.json({ ok: true, data: DATA_QUALITY_RATINGS });
  }

  // Access requests
  if (type === "access_requests") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAccessRequests(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as AccessRequestStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Audits (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAudits(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    qualityRating: (searchParams.get("qualityRating") ?? undefined) as DataQualityRating | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_audit") {
    const result = await createAudit(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_access_request") {
    const result = await createAccessRequest(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_access_request") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAccessRequest(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
