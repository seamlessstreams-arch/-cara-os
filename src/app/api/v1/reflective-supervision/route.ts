// ══════════════════════════════════════════════════════════════════════════════
// CARA — REFLECTIVE SUPERVISION API
// GET  /api/v1/reflective-supervision  → per-staff status rollup + records + staff
// POST /api/v1/reflective-supervision  → record a reflective supervision
//
// Wellbeing/confidence are SUPPORT indicators, never a diagnosis or performance
// verdict — surfaced for a manager to act on.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { persistReflectiveSupervision } from "@/lib/supabase/incident-persist";
import { NextRequest, NextResponse } from "next/server";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { computeSupervisionOverview, type ReflectiveSupervisionRecord, type StaffLite } from "@/lib/engines/supervision-engine";
import { readJsonBody } from "@/lib/http/read-json";

const SUPERVISEE_ROLES = new Set(["registered_manager", "deputy_manager", "team_leader", "residential_care_worker", "bank_staff"]);

function staffName(s: any): string {
  return s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id;
}
function superviseeStaff(store: any): StaffLite[] {
  return ((store.staff ?? []) as any[])
    .filter((s) => s.employment_status !== "left" && SUPERVISEE_ROLES.has(String(s.role)))
    .map((s) => ({ id: s.id, name: staffName(s), role: s.role ?? s.job_title ?? null }));
}

export async function GET() {
  const store = getStore() as any;
  const records: ReflectiveSupervisionRecord[] = store.reflectiveSupervisions ?? [];
  const staff = superviseeStaff(store);
  const today = new Date().toISOString().slice(0, 10);

  const overview = computeSupervisionOverview({ records, staff, today });
  const sortedRecords = [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return NextResponse.json({ data: { overview, records: sortedRecords, staff } });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const store = getStore() as any;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as any;

  const staff_id = String(body.staff_id ?? "").trim();
  const date = String(body.date ?? "").trim();
  if (!staff_id || !date) {
    return NextResponse.json({ ok: false, error: "Staff member and date are required." }, { status: 400 });
  }

  const staffList = (store.staff ?? []) as any[];
  const sm = staffList.find((s) => s.id === staff_id);
  const supervisor = staffList.find((s) => s.id === String(body.supervisor_id ?? "")) ?? null;
  const clampScore = (n: any) => Math.max(1, Math.min(5, Math.round(Number(n) || 3)));

  const record: ReflectiveSupervisionRecord = {
    id: generateId("rsup"),
    staff_id,
    staff_name: sm ? staffName(sm) : staff_id,
    supervisor_id: String(body.supervisor_id ?? "staff_darren"),
    supervisor_name: supervisor ? staffName(supervisor) : null,
    date: date.slice(0, 10),
    type: String(body.type ?? "1:1"),
    emotional_wellbeing: String(body.emotional_wellbeing ?? ""),
    wellbeing_score: clampScore(body.wellbeing_score),
    workload: String(body.workload ?? ""),
    safeguarding_concerns: String(body.safeguarding_concerns ?? ""),
    relationships_with_children: String(body.relationships_with_children ?? ""),
    reflective_practice: String(body.reflective_practice ?? ""),
    pace_examples: String(body.pace_examples ?? ""),
    professional_boundaries: String(body.professional_boundaries ?? ""),
    training_needs: Array.isArray(body.training_needs) ? body.training_needs.map(String).filter(Boolean) : [],
    confidence_level: clampScore(body.confidence_level),
    manager_feedback: String(body.manager_feedback ?? ""),
    actions: Array.isArray(body.actions) ? body.actions : [],
    follow_up_date: body.follow_up_date ? String(body.follow_up_date).slice(0, 10) : null,
    created_at: new Date().toISOString(),
  };

  store.reflectiveSupervisions = store.reflectiveSupervisions ?? [];
  store.reflectiveSupervisions.push(record);
  void persistReflectiveSupervision(record as unknown as Record<string, unknown>);
  return NextResponse.json({ ok: true, data: record }, { status: 201 });
}
