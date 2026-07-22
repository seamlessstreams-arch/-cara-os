// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT BRIEFING API ROUTE
// GET /api/v1/shift-briefing
//
// Auto-generated time-boxed operational snapshot for staff coming on duty:
// who's on now, tasks & plan reviews due this shift, active medications, and
// overnight / recent significant events. Complements the written Handover and
// the severity-ranked Priority Briefing.
//
// Reads the live in-memory store (getStore) like every other engine route.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { dal } from "@/lib/db/dal";
import { getStaffName } from "@/lib/seed-data";
import {
  computeShiftBriefing,
  type OnDutyInput, type TaskInput, type ReviewInput, type MedInput, type EventInput,
} from "@/lib/engines/shift-briefing-engine";

// Verified forward-looking review-date fields (same registry proven by /plan-currency).
const REVIEW_REGISTRY: { key: string; label: string; reviewField: string; childField: string }[] = [
  { key: "lacReviews", label: "LAC Review", reviewField: "next_review_date", childField: "child_id" },
  { key: "pathwayPlans", label: "Pathway Plan", reviewField: "next_review_date", childField: "child_id" },
  { key: "pepRecords", label: "PEP", reviewField: "next_review_date", childField: "child_id" },
  { key: "selfHarmSafetyPlanRecords", label: "Self-Harm Safety Plan", reviewField: "next_review_date", childField: "child_id" },
  { key: "riskManagementPlanRecords", label: "Risk Management Plan", reviewField: "review_date", childField: "child_id" },
  { key: "attachmentProfiles", label: "Attachment Profile", reviewField: "review_date", childField: "child_id" },
  { key: "behaviourSupportPlans", label: "Behaviour Support Plan", reviewField: "review_date", childField: "child_id" },
  { key: "multiDisciplinaryFormulations", label: "MDT Formulation", reviewField: "next_review_date", childField: "child_id" },
  { key: "exploitationScreenings", label: "Exploitation Screening", reviewField: "next_review_date", childField: "child_id" },
  { key: "dietaryPlans", label: "Dietary Plan", reviewField: "next_review_date", childField: "child_id" },
  { key: "annualHealthAssessments", label: "Annual Health Assessment", reviewField: "next_assessment_date", childField: "child_id" },
  { key: "culturalIdentityPlans", label: "Cultural Identity Plan", reviewField: "next_review", childField: "child_id" },
];

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole dashboard.
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
  const store = getStore() as any;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const [y, m, d] = today.split("-").map(Number);
  const labelDate = new Date(Date.UTC(y, m - 1, d));
  const now_label = `${DOW[labelDate.getUTCDay()]}, ${d} ${MON[m - 1]} ${y}`;

  const [allYoungPeople, allShifts, allTasks, allMedications, allDailyLog, allIncidents] = await Promise.all([
    safeList(dal.youngPeople.findAll()),
    safeList(dal.shifts.findAll()),
    safeList(dal.tasks.findAll()),
    safeList(dal.medications.findAll()),
    safeList(dal.dailyLog.findAll()),
    safeList(dal.incidents.findAll()),
  ]);

  // Children name map (current only)
  const yp = ((allYoungPeople) as any[]).filter((c) => c.status === "current");
  const childName = new Map<string, string>(
    yp.map((c) => [String(c.id), c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.id)]),
  );
  const childIds = new Set(childName.keys());
  const nameOf = (id: any) => (id ? childName.get(String(id)) ?? null : null);

  // ── On duty (today's shifts) ───────────────────────────────────────────────
  const on_duty: OnDutyInput[] = ((allShifts) as any[])
    .filter((s) => String(s.date).slice(0, 10) === today)
    .map((s) => ({
      staff_id: String(s.staff_id),
      staff_name: getStaffName(s.staff_id) || String(s.staff_id),
      shift_type: String(s.shift_type ?? "shift"),
      start_time: s.start_time ?? null,
      end_time: s.end_time ?? null,
      status: String(s.status ?? "scheduled"),
      is_open_shift: !!s.is_open_shift,
      notes: s.notes ?? null,
    }));

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasks: TaskInput[] = ((allTasks) as any[]).map((t) => ({
    id: String(t.id),
    title: t.title ?? t.name ?? "Task",
    due_date: t.due_date ?? null,
    status: t.status ?? null,
    priority: t.priority ?? null,
    assigned_name: t.assigned_to ? (getStaffName(t.assigned_to) || null) : null,
    child_name: nameOf(t.linked_child_id ?? t.child_id),
  }));

  // ── Plan reviews due (verified registry, current children only) ────────────
  const reviews: ReviewInput[] = [];
  for (const reg of REVIEW_REGISTRY) {
    const recs = store[reg.key];
    if (!Array.isArray(recs)) continue;
    for (const r of recs) {
      const cid = r?.[reg.childField];
      if (!cid || !childIds.has(String(cid))) continue;
      const raw = r?.[reg.reviewField];
      const review_date = raw && String(raw).trim() ? String(raw).slice(0, 10) : null;
      if (!review_date) continue;
      reviews.push({
        id: `${reg.key}-${r.id ?? reviews.length}`,
        plan_type: reg.label,
        child_id: String(cid),
        child_name: nameOf(cid),
        review_date,
      });
    }
  }

  // ── Active medications ─────────────────────────────────────────────────────
  const medications: MedInput[] = ((allMedications) as any[])
    .filter((mm) => {
      if (mm.is_active === false) return false;
      const start = mm.start_date ? String(mm.start_date).slice(0, 10) : null;
      const end = mm.end_date ? String(mm.end_date).slice(0, 10) : null;
      if (start && start > today) return false;
      if (end && end < today) return false;
      return true;
    })
    .map((mm) => ({
      id: String(mm.id),
      child_id: String(mm.child_id),
      child_name: nameOf(mm.child_id),
      name: mm.name ?? mm.medication_name ?? "Medication",
      dosage: mm.dosage ?? mm.dose ?? null,
      frequency: mm.frequency ?? null,
      prn: String(mm.type ?? "").toLowerCase() === "prn",
    }));

  // ── Events (overnight / recent) ────────────────────────────────────────────
  const events: EventInput[] = [];
  for (const l of (allDailyLog) as any[]) {
    events.push({
      id: String(l.id),
      kind: "log",
      date: String(l.date).slice(0, 10),
      time: l.time ?? null,
      child_name: nameOf(l.child_id),
      summary: l.content ?? l.note ?? "",
      category: l.entry_type ?? null,
      is_significant: !!l.is_significant,
    });
  }
  for (const i of (allIncidents) as any[]) {
    events.push({
      id: String(i.id),
      kind: "incident",
      date: String(i.date).slice(0, 10),
      time: i.time ?? null,
      child_name: nameOf(i.child_id),
      summary: i.description ?? i.summary ?? "",
      category: i.type ?? null,
      severity: i.severity ?? null,
      status: i.status ?? null,
    });
  }

  const result = computeShiftBriefing({ today, now_label, on_duty, tasks, reviews, medications, events });
  return NextResponse.json({ data: result });
}
