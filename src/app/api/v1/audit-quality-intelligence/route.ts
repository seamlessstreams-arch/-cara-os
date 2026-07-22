// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUDIT QUALITY ASSURANCE INTELLIGENCE API ROUTE
// GET /api/v1/audit-quality-intelligence
// Returns audit compliance analysis, category breakdowns, risk profiles,
// and Cara quality assurance insights.
// Reg 45 (review of quality of care), Schedule 6, SCCIF governance.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import {
  computeAuditQualityIntelligence,
  type AuditInput,
  type StaffRef,
} from "@/lib/engines/audit-quality-intelligence-engine";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  // ── Map audits ────────────────────────────────────────────────────────
  const audits: AuditInput[] = (await safeList(dal.qaAudits.findAll())).map((a: any) => ({
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
  const staff: StaffRef[] = (await safeList(dal.staff.findAll()))
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeAuditQualityIntelligence({ audits, staff });

  return NextResponse.json({ data: result });
}
