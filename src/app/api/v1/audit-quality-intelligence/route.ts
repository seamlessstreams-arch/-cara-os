// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUDIT QUALITY ASSURANCE INTELLIGENCE API ROUTE
// GET /api/v1/audit-quality-intelligence
// Returns audit compliance analysis, category breakdowns, risk profiles,
// and ARIA quality assurance insights.
// Reg 45 (review of quality of care), Schedule 6, SCCIF governance.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAuditQualityIntelligence,
  type AuditInput,
  type StaffRef,
} from "@/lib/engines/audit-quality-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map audits ────────────────────────────────────────────────────────
  const audits: AuditInput[] = (store.audits ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    date: a.date,
    completed_by: a.completed_by ?? null,
    score: a.score ?? 0,
    max_score: a.max_score ?? 100,
    status: a.status,
    findings: a.findings ?? 0,
    actions: a.actions ?? 0,
    created_at: a.created_at,
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeAuditQualityIntelligence({ audits, staff });

  return NextResponse.json({ data: result });
}
