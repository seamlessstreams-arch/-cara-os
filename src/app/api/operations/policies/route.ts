import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPolicies,
  createPolicy,
  updatePolicy,
  listAcknowledgements,
  createAcknowledgement,
  listReviewHistory,
  createReviewHistory,
  POLICY_CATEGORIES,
  POLICY_STATUSES,
  REVIEW_FREQUENCIES,
  REVIEW_OUTCOMES,
  REQUIRED_POLICIES,
} from "@/lib/services/policies-register-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "categories") {
    return NextResponse.json({ ok: true, data: POLICY_CATEGORIES });
  }
  if (type === "statuses") {
    return NextResponse.json({ ok: true, data: POLICY_STATUSES });
  }
  if (type === "review_frequencies") {
    return NextResponse.json({ ok: true, data: REVIEW_FREQUENCIES });
  }
  if (type === "review_outcomes") {
    return NextResponse.json({ ok: true, data: REVIEW_OUTCOMES });
  }
  if (type === "required_policies") {
    return NextResponse.json({ ok: true, data: REQUIRED_POLICIES });
  }

  // Acknowledgements
  if (type === "acknowledgements") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAcknowledgements(homeId, {
      policyId: searchParams.get("policyId") ?? undefined,
      staffId: searchParams.get("staffId") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Review history
  if (type === "review_history") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listReviewHistory(homeId, {
      policyId: searchParams.get("policyId") ?? undefined,
      reviewedBy: searchParams.get("reviewedBy") ?? undefined,
      outcome: searchParams.get("outcome") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Policies (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPolicies(homeId, {
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    owner: searchParams.get("owner") ?? undefined,
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

    if (action === "create_policy") {
      const result = await createPolicy({
        home_id: homeId,
        policy_name: body.policyName,
        policy_reference: body.policyReference ?? null,
        category: body.category,
        regulation_reference: body.regulationReference ?? null,
        description: body.description ?? "",
        version: body.version ?? "1.0",
        status: body.status ?? "active",
        owner: body.owner,
        approved_by: body.approvedBy ?? null,
        approval_date: body.approvalDate ?? null,
        effective_date: body.effectiveDate,
        review_date: body.reviewDate,
        last_reviewed_date: body.lastReviewedDate ?? null,
        reviewed_by: body.reviewedBy ?? null,
        review_frequency: body.reviewFrequency ?? "annual",
        document_url: body.documentUrl ?? null,
        staff_acknowledgement_required: body.staffAcknowledgementRequired ?? true,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_policy") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePolicy(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_acknowledgement") {
      const result = await createAcknowledgement({
        home_id: homeId,
        policy_id: body.policyId,
        staff_id: body.staffId,
        staff_name: body.staffName,
        acknowledged_date: body.acknowledgedDate,
        acknowledged: body.acknowledged ?? true,
        notes: body.notes ?? null,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_review") {
      const result = await createReviewHistory({
        home_id: homeId,
        policy_id: body.policyId,
        review_date: body.reviewDate,
        reviewed_by: body.reviewedBy,
        previous_version: body.previousVersion ?? null,
        new_version: body.newVersion ?? null,
        changes_summary: body.changesSummary ?? "",
        outcome: body.outcome ?? "no_changes",
        next_review_date: body.nextReviewDate ?? null,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_policy, update_policy, create_acknowledgement, or create_review" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
