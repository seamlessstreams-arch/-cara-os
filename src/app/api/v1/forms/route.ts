// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FORMS BULK ENDPOINT (enriched meta)
//
// Returns all care forms with computed meta matching FormsListResponse:
// total, draft, pending_review, approved, overdue, urgent counts.
// Replaces catch-all which only returned meta: { total }.
//
// GET /api/v1/forms?status=...&form_type=...
// POST /api/v1/forms (create new form)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status");
  const filterType = searchParams.get("form_type");

  let list = db.careForms.findAll();

  if (filterStatus) {
    list = list.filter((f) => f.status === filterStatus);
  }
  if (filterType) {
    list = db.careForms.findByType(filterType);
    if (filterStatus) {
      list = list.filter((f) => f.status === filterStatus);
    }
  }

  // Sort: most recently updated first
  list.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));

  // ── Compute meta over ALL forms ─────────────────────────────────────────
  const all = db.careForms.findAll();

  const draft = all.filter((f) => f.status === "draft").length;
  const pendingReview = all.filter(
    (f) => f.status === "pending_review" || f.status === "submitted"
  ).length;
  const approved = all.filter((f) => f.status === "approved").length;
  const overdue = all.filter(
    (f) => f.due_date && f.due_date < today && f.status !== "approved" && f.status !== "completed"
  ).length;
  const urgent = all.filter(
    (f) => f.priority === "urgent" || f.priority === "high"
  ).length;

  return NextResponse.json({
    data: list,
    meta: {
      total: list.length,
      draft,
      pending_review: pendingReview,
      approved,
      overdue,
      urgent,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const form = db.careForms.create(body);
  return NextResponse.json({ data: form }, { status: 201 });
}
