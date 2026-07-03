import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReports,
  createReport,
  updateReport,
  listPolicyReviews,
  createPolicyReview,
  updatePolicyReview,
  DISCLOSURE_CATEGORIES,
  DISCLOSURE_RISK_LEVELS,
  DISCLOSURE_STATUS,
  DISCLOSURE_OUTCOMES,
  REFERRAL_BODIES,
} from "@/lib/services/whistleblowing-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "categories") {
    return NextResponse.json({ ok: true, data: DISCLOSURE_CATEGORIES });
  }
  if (type === "risk_levels") {
    return NextResponse.json({ ok: true, data: DISCLOSURE_RISK_LEVELS });
  }
  if (type === "statuses") {
    return NextResponse.json({ ok: true, data: DISCLOSURE_STATUS });
  }
  if (type === "outcomes") {
    return NextResponse.json({ ok: true, data: DISCLOSURE_OUTCOMES });
  }
  if (type === "referral_bodies") {
    return NextResponse.json({ ok: true, data: REFERRAL_BODIES });
  }

  // Policy reviews
  if (type === "policy_reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listPolicyReviews(homeId, {
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Reports (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listReports(homeId, {
    category: (searchParams.get("category") ?? undefined) as never,
    status: (searchParams.get("status") ?? undefined) as never,
    riskLevel: (searchParams.get("riskLevel") ?? undefined) as never,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_report") {
      const result = await createReport({
        homeId,
        reporterId: body.reporterId,
        reporterName: body.reporterName,
        reporterRole: body.reporterRole,
        isAnonymous: body.isAnonymous ?? false,
        disclosureDate: body.disclosureDate,
        receivedBy: body.receivedBy,
        category: body.category,
        description: body.description,
        personsInvolved: body.personsInvolved ?? [],
        evidenceProvided: body.evidenceProvided,
        location: body.location,
        riskLevel: body.riskLevel ?? "medium",
        referredTo: body.referredTo,
        referralDate: body.referralDate,
        referralReference: body.referralReference,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_report") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateReport(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_policy_review") {
      const result = await createPolicyReview({
        homeId,
        reviewDate: body.reviewDate,
        reviewedBy: body.reviewedBy,
        policyAccessible: body.policyAccessible ?? true,
        policyDisplayed: body.policyDisplayed ?? true,
        staffTrainedCount: body.staffTrainedCount ?? 0,
        totalStaffCount: body.totalStaffCount ?? 0,
        externalContactsDisplayed: body.externalContactsDisplayed ?? true,
        childrenInformed: body.childrenInformed ?? false,
        reviewNotes: body.reviewNotes,
        nextReviewDate: body.nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_policy_review") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePolicyReview(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_report, update_report, create_policy_review, or update_policy_review" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
