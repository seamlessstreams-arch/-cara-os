// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE FORM INTELLIGENCE API ROUTE
// GET /api/v1/care-form-intelligence
// Returns care form pipeline analysis, completion rates, overdue tracking,
// form type coverage, and Cara documentation governance insights.
// Reg 35, Reg 37, Schedule 1, SCCIF documentation quality.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import {
  computeCareFormIntelligence,
  type CareFormInput,
  type StaffRef,
} from "@/lib/engines/care-form-intelligence-engine";

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
  const [careForms, staffList] = await Promise.all([
    safeList(dal.careForms.findAll()),
    safeList(dal.staff.findAll()),
  ]);

  // ── Map care forms ────────────────────────────────────────────────────
  const forms: CareFormInput[] = careForms.map((f: any) => ({
    id: f.id,
    title: f.title,
    form_type: f.form_type,
    status: f.status,
    priority: f.priority ?? "medium",
    linked_child_id: f.linked_child_id ?? null,
    linked_staff_id: f.linked_staff_id ?? null,
    linked_incident_id: f.linked_incident_id ?? null,
    description: f.description ?? null,
    submitted_at: f.submitted_at ?? null,
    submitted_by: f.submitted_by ?? null,
    reviewed_by: f.reviewed_by ?? null,
    reviewed_at: f.reviewed_at ?? null,
    approved_at: f.approved_at ?? null,
    approved_by: f.approved_by ?? null,
    due_date: f.due_date ?? null,
    tags: f.tags ?? [],
    created_at: f.created_at,
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const staff: StaffRef[] = staffList
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeCareFormIntelligence({ forms, staff });

  return NextResponse.json({ data: result });
}
