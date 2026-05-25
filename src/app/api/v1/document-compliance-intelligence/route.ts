// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT COMPLIANCE INTELLIGENCE API ROUTE
// GET /api/v1/document-compliance-intelligence
// Returns document sign-off compliance, expiry tracking, category analysis,
// and ARIA document governance insights.
// Reg 35, Reg 37, Schedule 1, SCCIF policy implementation.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDocumentComplianceIntelligence,
  type DocumentInput,
  type ReadReceiptInput,
  type StaffRef,
} from "@/lib/engines/document-compliance-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map documents ─────────────────────────────────────────────────────
  const documents: DocumentInput[] = (store.documents ?? []).map((d: any) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    version: d.version ?? 1,
    requires_read_sign: Boolean(d.requires_read_sign),
    expiry_date: d.expiry_date ?? null,
    tags: d.tags ?? [],
    linked_child_id: d.linked_child_id ?? null,
    linked_staff_id: d.linked_staff_id ?? null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));

  // ── Map read receipts ─────────────────────────────────────────────────
  const read_receipts: ReadReceiptInput[] = (store.documentReadReceipts ?? []).map((r: any) => ({
    id: r.id,
    document_id: r.document_id,
    staff_id: r.staff_id,
    read_at: r.read_at,
    signed_at: r.signed_at ?? null,
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const active_staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
      is_active: true,
    }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeDocumentComplianceIntelligence({
    documents,
    read_receipts,
    active_staff,
  });

  return NextResponse.json({ data: result });
}
