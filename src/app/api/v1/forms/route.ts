// ══════════════════════════════════════════════════════════════════════════════
// CARA — FORMS BULK ENDPOINT (enriched meta)
//
// Returns all care forms with computed meta matching FormsListResponse:
// total, draft, pending_review, approved, overdue, urgent counts.
// Replaces catch-all which only returned meta: { total }.
//
// GET /api/v1/forms?status=...&form_type=...
// POST /api/v1/forms (create new form)
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status");
  const filterType = searchParams.get("form_type");

  // Dual-mode: real Supabase `care_forms` table when enabled, in-memory store otherwise.
  const all = await dal.careForms.findAll();

  let list = all;
  if (filterType) {
    list = list.filter((f) => f.form_type === filterType);
  }
  if (filterStatus) {
    list = list.filter((f) => f.status === filterStatus);
  }

  // Sort: most recently updated first
  list = [...list].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));

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
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const form = await dal.careForms.create(body);
  return NextResponse.json({ data: form }, { status: 201 });
}
