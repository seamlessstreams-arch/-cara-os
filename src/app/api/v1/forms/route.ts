import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

// ── GET /api/v1/forms ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_FORMS);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status       = searchParams.get("status");
  const formType     = searchParams.get("form_type");
  const childId      = searchParams.get("linked_child_id");
  const priority     = searchParams.get("priority");
  const pendingReview = searchParams.get("pending_review") === "true";

  let results = db.careForms.findAll();
  if (status)       results = results.filter((f) => f.status === status);
  if (formType)     results = results.filter((f) => f.form_type === formType);
  if (childId)      results = results.filter((f) => f.linked_child_id === childId);
  if (priority)     results = results.filter((f) => f.priority === priority);
  if (pendingReview) results = db.careForms.findPendingReview();

  const today = todayStr();

  // Sort: urgent first, then by due date proximity
  results = results.sort((a, b) => {
    const pw: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aO = a.due_date && a.due_date < today && a.status !== "approved" ? -10 : 0;
    const bO = b.due_date && b.due_date < today && b.status !== "approved" ? -10 : 0;
    return (aO + (pw[a.priority] ?? 2)) - (bO + (pw[b.priority] ?? 2));
  });

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      draft:          results.filter((f) => f.status === "draft").length,
      pending_review: results.filter((f) => f.status === "pending_review" || f.status === "submitted").length,
      approved:       results.filter((f) => f.status === "approved").length,
      overdue:        results.filter((f) => f.due_date && f.due_date < today && f.status !== "approved").length,
      urgent:         results.filter((f) => f.priority === "urgent" && f.status !== "approved").length,
    },
  });
}

// ── POST /api/v1/forms ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.CREATE_FORMS);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const form = db.careForms.create({
    ...body,
    home_id: "home_oak",
    created_by: auth.userId,
    updated_by: auth.userId,
  });
  return NextResponse.json({ data: form }, { status: 201 });
}
