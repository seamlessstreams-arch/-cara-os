// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE INTELLIGENCE API ROUTE
// GET /api/v1/quality-assurance-intelligence
// Returns audit quality analysis, area ratings, overdue actions, alerts,
// and ARIA quality assurance insights.
// Reg 45 (quality of care review), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeQualityAssuranceIntelligence,
  type QAAuditInput,
  type QAAuditActionInput,
  type StaffRef,
} from "@/lib/engines/quality-assurance-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map QA audit records ──────────────────────────────────────────────
  const audits: QAAuditInput[] = (store.qaAuditRecords ?? []).map((r: any) => ({
    id: r.id,
    title: r.title ?? "Untitled Audit",
    date: r.date ?? "",
    auditor: r.auditor ?? "",
    scope: r.scope ?? "general",
    overall_rating: r.overall_rating ?? "good",
    score: r.score ?? 0,
    findings: Array.isArray(r.findings) ? r.findings : [],
    strengths: Array.isArray(r.strengths) ? r.strengths : [],
    areas_for_improvement: Array.isArray(r.areas_for_improvement)
      ? r.areas_for_improvement
      : [],
    actions: Array.isArray(r.actions)
      ? r.actions.map((a: any): QAAuditActionInput => ({
          action: a.action ?? "",
          owner: a.owner ?? "",
          deadline: a.deadline ?? "",
          status: a.status ?? "pending",
        }))
      : [],
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeQualityAssuranceIntelligence({ audits, staff });

  return NextResponse.json({ data: result });
}
