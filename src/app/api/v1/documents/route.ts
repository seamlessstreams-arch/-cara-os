// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENTS BULK ENDPOINT (enriched with receipts & meta)
//
// Returns all documents with read receipts and computed meta:
// total, requires_sign, expiring_soon, expired.
// Replaces catch-all which returned raw Document[] without receipts or meta.
//
// GET /api/v1/documents?category=...&requires_read_sign=true
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
  const filterCategory = searchParams.get("category");
  const filterRequiresSign = searchParams.get("requires_read_sign");

  let docs = db.documents.findAll();

  if (filterCategory) {
    docs = docs.filter((d) => (d as Record<string, unknown>).category === filterCategory);
  }
  if (filterRequiresSign === "true") {
    docs = docs.filter((d) => (d as Record<string, unknown>).requires_read_sign === true);
  }

  // Get all read receipts
  const receipts = db.documentReadReceipts.findAll();

  // ── Compute meta over ALL documents (not just filtered) ─────────────────
  const allDocs = db.documents.findAll();

  const thirtyDaysOut = new Date(today + "T00:00:00Z");
  thirtyDaysOut.setUTCDate(thirtyDaysOut.getUTCDate() + 30);
  const thirtyDaysStr = thirtyDaysOut.toISOString().slice(0, 10);

  const requiresSign = allDocs.filter(
    (d) => (d as Record<string, unknown>).requires_read_sign === true
  ).length;

  const expiringSoon = allDocs.filter((d) => {
    const exp = (d as Record<string, unknown>).expiry_date as string | null;
    return exp && exp >= today && exp <= thirtyDaysStr;
  }).length;

  const expired = allDocs.filter((d) => {
    const exp = (d as Record<string, unknown>).expiry_date as string | null;
    return exp && exp < today;
  }).length;

  return NextResponse.json({
    data: docs,
    receipts,
    meta: {
      total: docs.length,
      requires_sign: requiresSign,
      expiring_soon: expiringSoon,
      expired,
    },
  });
}
