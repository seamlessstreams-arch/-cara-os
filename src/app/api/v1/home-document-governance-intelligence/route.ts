// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DOCUMENT GOVERNANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-document-governance-intelligence
// Synthesises document management, expiry tracking, read receipt compliance,
// and version control to assess document governance.
// CHR 2015 Reg 13 (Leadership & Management). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeDocumentGovernance,
  type DocumentInput,
  type ReadReceiptInput,
} from "@/lib/engines/home-document-governance-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const staffList = (store.staff ?? []) as any[];
  const totalStaff = staffList.filter((s: any) => s.status === "active" || !s.status).length;

  const documents: DocumentInput[] = ((store.documents ?? []) as any[])
    .map((d: any) => ({
      id: d.id ?? "",
      category: d.category ?? "",
      requires_read_sign: !!(d.requires_read_sign),
      expiry_date: d.expiry_date ? d.expiry_date.toString().slice(0, 10) : null,
      version: d.version ?? 1,
      has_linked_child: !!(d.linked_child_id),
      has_linked_incident: !!(d.linked_incident_id),
      tags: Array.isArray(d.tags) ? d.tags : [],
      created_date: (d.created_at ?? "").toString().slice(0, 10),
      updated_date: (d.updated_at ?? "").toString().slice(0, 10),
    }));

  const read_receipts: ReadReceiptInput[] = ((store.documentReadReceipts ?? []) as any[])
    .map((r: any) => ({
      document_id: r.document_id ?? "",
      staff_id: r.staff_id ?? "",
      has_signed: !!(r.signed_at),
    }));

  const result = computeHomeDocumentGovernance({
    today,
    documents,
    read_receipts,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
