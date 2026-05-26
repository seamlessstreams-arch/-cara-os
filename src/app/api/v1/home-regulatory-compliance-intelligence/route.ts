// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REGULATORY COMPLIANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-regulatory-compliance-intelligence
// Synthesises Reg 44 visits, quality audits, notifiable events, inspection
// history, and home policies to produce an overall regulatory compliance score.
// CHR 2015 Reg 44, 45, 46. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeRegulatoryCompliance,
  type Reg44VisitInput,
  type AuditInput,
  type NotifiableEventInput,
  type InspectionInput,
  type PolicyInput,
} from "@/lib/engines/home-regulatory-compliance-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Reg 44 Visit Reports ──────────────────────────────────────────────
  const reg44_visits: Reg44VisitInput[] = ((store.reg44VisitReports ?? []) as any[])
    .map((v: any) => ({
      id: v.id,
      visit_date: (v.visit_date ?? today).toString().slice(0, 10),
      overall_judgement: v.overall_judgement ?? "N/A",
      strengths_count: Array.isArray(v.strengths) ? v.strengths.length : 0,
      areas_for_development_count: Array.isArray(v.areas_for_development) ? v.areas_for_development.length : 0,
      recommendations: (v.recommendations ?? []).map((rec: any) => ({
        id: rec.id,
        priority: rec.priority ?? "medium",
        status: rec.status ?? "not_started",
        completed_at: rec.completed_at ?? null,
      })),
      report_sent_to_ofsted: !!v.report_sent_to_ofsted,
    }));

  // ── Quality Audits ────────────────────────────────────────────────────
  const audits: AuditInput[] = ((store.audits ?? []) as any[])
    .map((a: any) => ({
      id: a.id,
      title: a.title ?? "Untitled Audit",
      category: a.category ?? "general",
      date: (a.date ?? today).toString().slice(0, 10),
      score: typeof a.score === "number" ? a.score : 0,
      max_score: typeof a.max_score === "number" ? a.max_score : 100,
      status: a.status ?? "scheduled",
      findings: typeof a.findings === "number" ? a.findings : 0,
      actions: typeof a.actions === "number" ? a.actions : 0,
    }));

  // ── Notifiable Events ─────────────────────────────────────────────────
  const notifiable_events: NotifiableEventInput[] = ((store.notifiableEvents ?? []) as any[])
    .map((n: any) => ({
      id: n.id,
      date: (n.date ?? today).toString().slice(0, 10),
      event_type: n.event_type ?? "other",
      ofsted_status: n.ofsted_status ?? "pending",
      has_follow_up: !!(n.follow_up),
      has_lesson_learned: !!(n.lesson_learned),
    }));

  // ── Inspection History ────────────────────────────────────────────────
  const inspections: InspectionInput[] = ((store.inspectionHistory ?? []) as any[])
    .map((i: any) => ({
      id: i.id,
      inspection_date: (i.inspection_date ?? today).toString().slice(0, 10),
      inspection_type: i.inspection_type ?? "Full inspection",
      grade: i.grade ?? "N/A",
      actions_required: typeof i.actions_required === "number" ? i.actions_required : 0,
      actions_completed: typeof i.actions_completed === "number" ? i.actions_completed : 0,
    }));

  // ── Home Policies ─────────────────────────────────────────────────────
  const policies: PolicyInput[] = ((store.homePolicies ?? []) as any[])
    .map((p: any) => ({
      id: p.id,
      title: p.title ?? "Untitled Policy",
      category: p.category ?? "general",
      status: p.status ?? "current",
      next_review_date: (p.next_review_date ?? today).toString().slice(0, 10),
      last_reviewed: (p.last_reviewed ?? today).toString().slice(0, 10),
      acknowledgement_count: Array.isArray(p.read_acknowledgements) ? p.read_acknowledgements.length : (typeof p.acknowledgement_count === "number" ? p.acknowledgement_count : 0),
      total_staff_required: typeof p.total_staff_required === "number" ? p.total_staff_required : 0,
      statutory_basis: p.statutory_basis ?? "",
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeRegulatoryCompliance({
    today,
    reg44_visits,
    audits,
    notifiable_events,
    inspections,
    policies,
  });

  return NextResponse.json({ data: result });
}
