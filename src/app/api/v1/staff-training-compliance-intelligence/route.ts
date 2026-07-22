// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF TRAINING COMPLIANCE INTELLIGENCE
// GET /api/v1/staff-training-compliance-intelligence
//
// Produces per-staff and home-level training compliance intelligence from the
// real seeded store.trainingRecords — unlike existing phantom-engine routes
// which use empty mandatoryTrainingRecords / cpdRecords collections.
//
// Ofsted SCCIF: "Are staff trained and competent for their roles?"
// CHR 2015 Reg 32 (staffing), Reg 33 (qualifications and experience).
//
// Signal per staff: compliant / expiring / non_compliant
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

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

// ── Types ─────────────────────────────────────────────────────────────────────

type TrainingSignal = "non_compliant" | "expiring" | "compliant";

interface TrainingIssue {
  courseName: string;
  category: string;
  status: string;
  expiryDate: string | null;
  notes: string | null;
}

interface StaffTrainingProfile {
  staffId: string;
  staffName: string;
  role: string;
  totalRecords: number;
  mandatoryTotal: number;
  mandatoryCompliant: number;
  mandatoryExpiringSoon: number;
  mandatoryExpired: number;
  mandatoryNotStarted: number;
  complianceRate: number;
  issues: TrainingIssue[];
  signal: TrainingSignal;
  supervisionPrompt: string;
}

interface CategoryRisk {
  category: string;
  affectedStaff: number;
  statuses: string[];
}

interface TrainingComplianceSummary {
  totalStaff: number;
  compliantStaff: number;
  expiringStaff: number;
  nonCompliantStaff: number;
  overallMandatoryComplianceRate: number;
  totalMandatoryRecords: number;
  compliantMandatoryRecords: number;
  expiringSoonRecords: number;
  expiredRecords: number;
  notStartedRecords: number;
  categoriesAtRisk: CategoryRisk[];
  ofstedNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trainingSignal(
  mandatoryExpired: number,
  mandatoryNotStarted: number,
  mandatoryExpiringSoon: number,
): TrainingSignal {
  if (mandatoryExpired > 0 || mandatoryNotStarted > 0) return "non_compliant";
  if (mandatoryExpiringSoon > 0) return "expiring";
  return "compliant";
}

function buildSupervisionPrompt(
  name: string,
  signal: TrainingSignal,
  issues: TrainingIssue[],
): string {
  if (signal === "non_compliant") {
    const expired = issues.filter((i) => i.status === "expired" || i.status === "not_started");
    const courseList = expired.map((i) => i.courseName).join(", ");
    return `${name} has ${expired.length} mandatory training record${expired.length > 1 ? "s" : ""} that ${expired.length > 1 ? "are" : "is"} expired or not started: ${courseList}. In supervision: when will this be completed? Staff must not be deployed in roles requiring this training until it is current. Is this on their development plan?`;
  }
  if (signal === "expiring") {
    const expiring = issues.filter((i) => i.status === "expiring_soon");
    const courseList = expiring.map((i) => `${i.courseName} (expires ${i.expiryDate ?? "soon"})`).join(", ");
    return `${name}'s mandatory training is currently compliant but ${expiring.length} record${expiring.length > 1 ? "s are" : " is"} expiring soon: ${courseList}. In supervision: confirm a refresher is booked and the date is in the development plan.`;
  }
  return `${name}'s mandatory training is fully compliant. In supervision, explore: are there any CPD or specialist development opportunities that would benefit ${name.split(" ")[0]} in their current role?`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const staffMembers = (await safeList(dal.staff.findAll())) as Array<{
    id: string;
    full_name: string;
    role: string;
    status?: string;
  }>;

  const trainingRecords = (await safeList(dal.training.findAll())) as Array<{
    staff_id: string;
    course_name: string;
    category: string;
    completed_date: string | null;
    expiry_date: string | null;
    status: string;
    is_mandatory: boolean;
    notes: string | null;
  }>;

  // Only active staff
  const activeStaff = staffMembers.filter(
    (s) => !s.status || s.status === "active",
  );

  // Index training records by staff
  const recordsByStaff = new Map<string, typeof trainingRecords>();
  for (const r of trainingRecords) {
    const arr = recordsByStaff.get(r.staff_id) ?? [];
    arr.push(r);
    recordsByStaff.set(r.staff_id, arr);
  }

  // ── Per-staff profiles ────────────────────────────────────────────────────
  const staffProfiles: StaffTrainingProfile[] = activeStaff.map((s) => {
    const records = recordsByStaff.get(s.id) ?? [];
    const mandatory = records.filter((r) => r.is_mandatory);

    const mandatoryCompliant = mandatory.filter((r) => r.status === "compliant").length;
    const mandatoryExpiringSoon = mandatory.filter((r) => r.status === "expiring_soon").length;
    const mandatoryExpired = mandatory.filter((r) => r.status === "expired").length;
    const mandatoryNotStarted = mandatory.filter((r) => r.status === "not_started").length;

    const complianceRate = mandatory.length > 0
      ? Math.round((mandatoryCompliant / mandatory.length) * 100)
      : 100;

    // Build issues: only non-compliant and expiring mandatory records
    const issues: TrainingIssue[] = mandatory
      .filter((r) => r.status !== "compliant")
      .map((r) => ({
        courseName: r.course_name,
        category: r.category,
        status: r.status,
        expiryDate: r.expiry_date,
        notes: r.notes,
      }));

    const signal = trainingSignal(mandatoryExpired, mandatoryNotStarted, mandatoryExpiringSoon);

    return {
      staffId: s.id,
      staffName: s.full_name,
      role: s.role,
      totalRecords: records.length,
      mandatoryTotal: mandatory.length,
      mandatoryCompliant,
      mandatoryExpiringSoon,
      mandatoryExpired,
      mandatoryNotStarted,
      complianceRate,
      issues,
      signal,
      supervisionPrompt: buildSupervisionPrompt(s.full_name, signal, issues),
    };
  });

  // Sort: non_compliant → expiring → compliant
  const SIGNAL_ORDER: Record<TrainingSignal, number> = {
    non_compliant: 0, expiring: 1, compliant: 2,
  };
  staffProfiles.sort((a, b) => SIGNAL_ORDER[a.signal] - SIGNAL_ORDER[b.signal]);

  // ── Home summary ──────────────────────────────────────────────────────────
  const compliantStaff = staffProfiles.filter((p) => p.signal === "compliant").length;
  const expiringStaff = staffProfiles.filter((p) => p.signal === "expiring").length;
  const nonCompliantStaff = staffProfiles.filter((p) => p.signal === "non_compliant").length;

  const mandatoryRecords = trainingRecords.filter((r) => r.is_mandatory);
  const totalMandatoryRecords = mandatoryRecords.length;
  const compliantMandatoryRecords = mandatoryRecords.filter((r) => r.status === "compliant").length;
  const expiringSoonRecords = mandatoryRecords.filter((r) => r.status === "expiring_soon").length;
  const expiredRecords = mandatoryRecords.filter((r) => r.status === "expired").length;
  const notStartedRecords = mandatoryRecords.filter((r) => r.status === "not_started").length;

  const overallMandatoryComplianceRate = totalMandatoryRecords > 0
    ? Math.round((compliantMandatoryRecords / totalMandatoryRecords) * 100)
    : 100;

  // Category risk: which categories have the most non-compliant staff?
  const categoryStaffMap = new Map<string, { statuses: string[]; staffSet: Set<string> }>();
  for (const r of mandatoryRecords) {
    if (r.status !== "compliant") {
      const entry = categoryStaffMap.get(r.category) ?? { statuses: [], staffSet: new Set() };
      entry.statuses.push(r.status);
      entry.staffSet.add(r.staff_id);
      categoryStaffMap.set(r.category, entry);
    }
  }
  const categoriesAtRisk: CategoryRisk[] = [...categoryStaffMap.entries()]
    .map(([category, { statuses, staffSet }]) => ({
      category,
      affectedStaff: staffSet.size,
      statuses: [...new Set(statuses)],
    }))
    .sort((a, b) => b.affectedStaff - a.affectedStaff);

  // Ofsted note
  const ofstedNote =
    nonCompliantStaff > 0
      ? `${nonCompliantStaff} staff member${nonCompliantStaff > 1 ? "s" : ""} with expired or not-started mandatory training. Ofsted will ask whether staff are suitably qualified and whether deployment decisions consider current training status.`
      : expiringStaff > 0
      ? `${expiringSoonRecords} mandatory training record${expiringSoonRecords > 1 ? "s are" : " is"} expiring soon across ${expiringStaff} staff member${expiringStaff > 1 ? "s" : ""}. An inspector will look for evidence that refreshers are booked and planned.`
      : overallMandatoryComplianceRate === 100
      ? "All mandatory training records are compliant. Maintain this by ensuring renewal dates are tracked and refreshers are booked at least 6 weeks before expiry."
      : `Overall mandatory training compliance: ${overallMandatoryComplianceRate}%. Continue monitoring to ensure this remains above 95%.`;

  const summary: TrainingComplianceSummary = {
    totalStaff: activeStaff.length,
    compliantStaff,
    expiringStaff,
    nonCompliantStaff,
    overallMandatoryComplianceRate,
    totalMandatoryRecords,
    compliantMandatoryRecords,
    expiringSoonRecords,
    expiredRecords,
    notStartedRecords,
    categoriesAtRisk,
    ofstedNote,
  };

  return NextResponse.json({ data: { staffProfiles, summary } });
}
