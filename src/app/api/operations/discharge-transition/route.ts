import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReviews,
  createReview,
  updateReview,
  DISCHARGE_REASONS,
  READINESS_LEVELS,
  REVIEW_STATUSES,
  SUPPORT_PACKAGES,
} from "@/lib/services/discharge-transition-service";
import type {
  DischargeReason,
  ReadinessLevel,
  ReviewStatus,
} from "@/lib/services/discharge-transition-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "discharge_reasons") return NextResponse.json({ ok: true, data: DISCHARGE_REASONS });
  if (type === "readiness_levels") return NextResponse.json({ ok: true, data: READINESS_LEVELS });
  if (type === "review_statuses") return NextResponse.json({ ok: true, data: REVIEW_STATUSES });
  if (type === "support_packages") return NextResponse.json({ ok: true, data: SUPPORT_PACKAGES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listReviews(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    dischargeReason: (searchParams.get("dischargeReason") ?? undefined) as DischargeReason | undefined,
    readinessLevel: (searchParams.get("readinessLevel") ?? undefined) as ReadinessLevel | undefined,
    reviewStatus: (searchParams.get("reviewStatus") ?? undefined) as ReviewStatus | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_review") {
    const result = await createReview(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_review") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateReview(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
