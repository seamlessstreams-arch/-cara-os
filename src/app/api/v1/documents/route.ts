// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENTS BULK ENDPOINT (enriched with receipts & meta)
//
// Returns all documents with read receipts and computed meta:
// total, requires_sign, expiring_soon, expired.
// Replaces catch-all which returned raw Document[] without receipts or meta.
//
// GET /api/v1/documents?category=...&requires_read_sign=true
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Documents are read/written via the dual-mode dal (the documents table on a
// live tenant, the in-memory store in demo). Read receipts have no dal accessor
// yet, so they stay on the store — empty on a live home, which is correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function allDocuments(): Promise<any[]> {
  try {
    const r = await dal.documents.findAll();
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterCategory = searchParams.get("category");
  const filterRequiresSign = searchParams.get("requires_read_sign");

  const allDocsSource = await allDocuments();
  let docs = allDocsSource;

  if (filterCategory) {
    docs = docs.filter((d) => (d as unknown as Record<string, unknown>).category === filterCategory);
  }
  if (filterRequiresSign === "true") {
    docs = docs.filter((d) => (d as unknown as Record<string, unknown>).requires_read_sign === true);
  }

  // Get all read receipts
  const receipts = db.documentReadReceipts.findAll();

  // ── Compute meta over ALL documents (not just filtered) ─────────────────
  const allDocs = allDocsSource;

  const thirtyDaysOut = new Date(today + "T00:00:00Z");
  thirtyDaysOut.setUTCDate(thirtyDaysOut.getUTCDate() + 30);
  const thirtyDaysStr = thirtyDaysOut.toISOString().slice(0, 10);

  const requiresSign = allDocs.filter(
    (d) => (d as unknown as Record<string, unknown>).requires_read_sign === true
  ).length;

  const expiringSoon = allDocs.filter((d) => {
    const exp = (d as unknown as Record<string, unknown>).expiry_date as string | null;
    return exp && exp >= today && exp <= thirtyDaysStr;
  }).length;

  const expired = allDocs.filter((d) => {
    const exp = (d as unknown as Record<string, unknown>).expiry_date as string | null;
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

// POST /api/v1/documents — register/upload a document. Persists via the
// dual-mode dal (the documents table on a live tenant). Before this the route
// was GET-only, so the upload form had no endpoint to call and silently saved
// nothing.
export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "A document title is required." }, { status: 400 });
  }
  const doc = await dal.documents.create({
    version: 1,
    requires_read_sign: false,
    tags: [],
    ...body,
  });
  return NextResponse.json({ data: doc }, { status: 201 });
}
