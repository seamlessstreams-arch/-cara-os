// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF DEVELOPMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-development-intelligence
// Synthesises supervision, training, qualifications, and induction records
// to produce an overall staff development compliance score.
// CHR 2015 Reg 32, 33. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeStaffDevelopment,
  type SupervisionInput,
  type TrainingRecordInput,
  type QualificationInput,
  type InductionInput,
  type StaffMemberInput,
} from "@/lib/engines/home-staff-development-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Staff Members ─────────────────────────────────────────────────────
  const staffList: StaffMemberInput[] = ((store.staff ?? []) as any[])
    .map((s: any) => ({
      id: s.id,
      name: s.name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
      role: s.role ?? "unknown",
    }));

  // ── Supervisions ──────────────────────────────────────────────────────
  const supervisions: SupervisionInput[] = ((store.supervisions ?? []) as any[])
    .map((s: any) => ({
      id: s.id,
      staff_id: s.staff_id ?? "",
      supervisor_id: s.supervisor_id ?? "",
      type: s.type ?? "formal",
      scheduled_date: (s.scheduled_date ?? today).toString().slice(0, 10),
      actual_date: s.actual_date ? s.actual_date.toString().slice(0, 10) : null,
      status: s.status ?? "scheduled",
      duration_minutes: typeof s.duration_minutes === "number" ? s.duration_minutes : null,
      wellbeing_score: typeof s.wellbeing_score === "number" ? s.wellbeing_score : null,
      staff_signature: !!s.staff_signature,
      supervisor_signature: !!s.supervisor_signature,
      actions_count: Array.isArray(s.actions_agreed) ? s.actions_agreed.length : (typeof s.actions_count === "number" ? s.actions_count : 0),
      next_date: s.next_date ? s.next_date.toString().slice(0, 10) : null,
    }));

  // ── Training Records ──────────────────────────────────────────────────
  const training_records: TrainingRecordInput[] = ((store.trainingRecords ?? []) as any[])
    .map((t: any) => ({
      id: t.id,
      staff_id: t.staff_id ?? "",
      course_name: t.course_name ?? "Unknown Course",
      category: t.category ?? "general",
      completed_date: t.completed_date ? t.completed_date.toString().slice(0, 10) : null,
      expiry_date: t.expiry_date ? t.expiry_date.toString().slice(0, 10) : null,
      status: t.status ?? "not_started",
      is_mandatory: !!t.is_mandatory,
    }));

  // ── Qualifications ────────────────────────────────────────────────────
  const qualifications: QualificationInput[] = ((store.qualifications ?? []) as any[])
    .map((q: any) => ({
      id: q.id,
      staff_id: q.staff_id ?? "",
      qualification_name: q.qualification_name ?? "Unknown Qualification",
      status: q.status ?? "not_started",
      is_mandatory: !!q.mandatory,
      expiry_date: q.expiry_date ? q.expiry_date.toString().slice(0, 10) : null,
      completed_at: q.completed_at ? q.completed_at.toString().slice(0, 10) : null,
    }));

  // ── Inductions ────────────────────────────────────────────────────────
  const inductions: InductionInput[] = ((store.inductionRecords ?? []) as any[])
    .map((i: any) => {
      const items = Array.isArray(i.items) ? i.items : [];
      const completedItems = items.filter((item: any) => item.status === "completed").length;
      return {
        id: i.id,
        staff_id: i.staff_id ?? "",
        overall_status: i.overall_status ?? "not_started",
        target_completion_date: (i.target_completion_date ?? today).toString().slice(0, 10),
        total_items: items.length,
        completed_items: completedItems,
        probation_passed: !!i.probation_passed,
      };
    });

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeStaffDevelopment({
    today,
    staff: staffList,
    supervisions,
    training_records,
    qualifications,
    inductions,
  });

  return NextResponse.json({ data: result });
}
