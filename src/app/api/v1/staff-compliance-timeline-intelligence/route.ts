// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF COMPLIANCE TIMELINE INTELLIGENCE
// GET /api/v1/staff-compliance-timeline-intelligence
// Surfaces per-staff compliance gaps across DBS renewal, supervision schedule,
// appraisal deadlines, and probation milestones using live store.staff data.
// CHR 2015 Reg 33 (supervision), Reg 34 (training/appraisal), Safer Recruitment.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import type { StaffMember } from "@/types";

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

type StaffComplianceSignal = "urgent" | "attention" | "due_soon" | "good";

interface DbsStatus {
  ageMonths: number;
  hasUpdateService: boolean;
  renewalDue: boolean;  // >30 months and no update service
  renewalOverdue: boolean; // >36 months and no update service
}

interface SupervisionStatus {
  nextDue: string | null;
  daysUntilDue: number | null;
  overdue: boolean;
  dueWithinWeek: boolean;
}

interface AppraisalStatus {
  nextDue: string | null;
  daysUntilDue: number | null;
  overdue: boolean;
  notScheduled: boolean;
}

interface ProbationStatus {
  onProbation: boolean;
  endDate: string | null;
  daysRemaining: number | null;
  endingSoon: boolean; // within 14 days
}

interface StaffComplianceProfile {
  staffId: string;
  name: string;
  role: string;
  jobTitle: string;
  startDate: string;
  employmentType: string;
  dbs: DbsStatus;
  supervision: SupervisionStatus;
  appraisal: AppraisalStatus;
  probation: ProbationStatus;
  issues: string[];
  signal: StaffComplianceSignal;
}

interface StaffComplianceSummary {
  totalActiveStaff: number;
  supervisionOverdue: number;
  supervisionDueWithinWeek: number;
  appraisalOverdue: number;
  dbsRenewalDue: number;
  onProbation: number;
  signal: StaffComplianceSignal;
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function monthsBetween(from: string, to: string): number {
  const f = new Date(from);
  const t = new Date(to);
  return (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
}

function staffSignal(issues: string[]): StaffComplianceSignal {
  if (issues.some((i) => i.startsWith("URGENT"))) return "urgent";
  if (issues.some((i) => i.startsWith("ATTENTION"))) return "attention";
  if (issues.some((i) => i.startsWith("DUE"))) return "due_soon";
  return "good";
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const staff = (await safeList(dal.staff.findAll())) as StaffMember[];
  const activeStaff = staff.filter(
    (s) => s.employment_status === "active" && s.role !== "responsible_individual"
  );

  const profiles: StaffComplianceProfile[] = activeStaff.map((s) => {
    const issues: string[] = [];

    // ── DBS ────────────────────────────────────────────────────────────────
    const dbsAgeMonths = s.dbs_issue_date ? monthsBetween(s.dbs_issue_date, today) : 0;
    const dbsRenewalOverdue = !s.dbs_update_service && dbsAgeMonths >= 36;
    const dbsRenewalDue = !s.dbs_update_service && dbsAgeMonths >= 30 && !dbsRenewalOverdue;

    if (dbsRenewalOverdue) {
      issues.push("URGENT: DBS certificate overdue for renewal (>36 months, no update service)");
    } else if (dbsRenewalDue) {
      issues.push("ATTENTION: DBS renewal approaching (>30 months, no update service)");
    }

    // ── Supervision ───────────────────────────────────────────────────────
    const nextSupDate = s.next_supervision_due ?? null;
    const supDaysUntil = nextSupDate ? daysBetween(today, nextSupDate) : null;
    const supOverdue = supDaysUntil !== null && supDaysUntil < 0;
    const supDueWithinWeek = !supOverdue && supDaysUntil !== null && supDaysUntil <= 7;

    if (supOverdue) {
      issues.push(`ATTENTION: Supervision overdue by ${Math.abs(supDaysUntil!)} day${Math.abs(supDaysUntil!) !== 1 ? "s" : ""}`);
    } else if (supDueWithinWeek) {
      issues.push(`DUE: Supervision due in ${supDaysUntil} day${supDaysUntil !== 1 ? "s" : ""}`);
    } else if (!nextSupDate) {
      issues.push("ATTENTION: No supervision date scheduled");
    }

    // ── Appraisal ─────────────────────────────────────────────────────────
    const nextAprDate = s.next_appraisal_due ?? null;
    const aprDaysUntil = nextAprDate ? daysBetween(today, nextAprDate) : null;
    const aprOverdue = aprDaysUntil !== null && aprDaysUntil < 0;
    const aprNotScheduled = !nextAprDate;

    if (aprOverdue) {
      issues.push(`ATTENTION: Appraisal overdue by ${Math.abs(aprDaysUntil!)} day${Math.abs(aprDaysUntil!) !== 1 ? "s" : ""}`);
    } else if (aprNotScheduled && s.employment_type !== "bank") {
      issues.push("DUE: No appraisal date scheduled");
    } else if (aprDaysUntil !== null && aprDaysUntil <= 14) {
      issues.push(`DUE: Appraisal due in ${aprDaysUntil} day${aprDaysUntil !== 1 ? "s" : ""}`);
    }

    // ── Probation ─────────────────────────────────────────────────────────
    const probEndDate = s.probation_end_date ?? null;
    const probDaysRemaining = probEndDate ? daysBetween(today, probEndDate) : null;
    const onProbation = probEndDate !== null && (probDaysRemaining ?? 1) > 0;
    const probEndingSoon = onProbation && (probDaysRemaining ?? 999) <= 14;

    if (probEndingSoon) {
      issues.push(`DUE: Probation ending in ${probDaysRemaining} day${probDaysRemaining !== 1 ? "s" : ""} — review required`);
    }

    const dbs: DbsStatus = {
      ageMonths: dbsAgeMonths,
      hasUpdateService: s.dbs_update_service,
      renewalDue: dbsRenewalDue,
      renewalOverdue: dbsRenewalOverdue,
    };

    const supervision: SupervisionStatus = {
      nextDue: nextSupDate,
      daysUntilDue: supDaysUntil,
      overdue: supOverdue,
      dueWithinWeek: supDueWithinWeek,
    };

    const appraisal: AppraisalStatus = {
      nextDue: nextAprDate,
      daysUntilDue: aprDaysUntil,
      overdue: aprOverdue,
      notScheduled: aprNotScheduled,
    };

    const probation: ProbationStatus = {
      onProbation,
      endDate: probEndDate,
      daysRemaining: probDaysRemaining,
      endingSoon: probEndingSoon,
    };

    return {
      staffId: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`.trim(),
      role: s.role,
      jobTitle: s.job_title ?? s.role,
      startDate: s.start_date,
      employmentType: s.employment_type,
      dbs,
      supervision,
      appraisal,
      probation,
      issues,
      signal: staffSignal(issues),
    };
  });

  const signalOrder: Record<StaffComplianceSignal, number> = {
    urgent: 0,
    attention: 1,
    due_soon: 2,
    good: 3,
  };
  profiles.sort((a, b) => signalOrder[a.signal] - signalOrder[b.signal]);

  // ── Summary ───────────────────────────────────────────────────────────────

  const supervisionOverdue = profiles.filter((p) => p.supervision.overdue).length;
  const supervisionDueWithinWeek = profiles.filter((p) => p.supervision.dueWithinWeek).length;
  const appraisalOverdue = profiles.filter((p) => p.appraisal.overdue).length;
  const dbsRenewalDue = profiles.filter(
    (p) => p.dbs.renewalDue || p.dbs.renewalOverdue
  ).length;
  const onProbation = profiles.filter((p) => p.probation.onProbation).length;

  let homeSignal: StaffComplianceSignal = "good";
  const urgentCount = profiles.filter((p) => p.signal === "urgent").length;
  const attentionCount = profiles.filter((p) => p.signal === "attention").length;
  const dueSoonCount = profiles.filter((p) => p.signal === "due_soon").length;

  if (urgentCount > 0) {
    homeSignal = "urgent";
  } else if (attentionCount > 0) {
    homeSignal = "attention";
  } else if (dueSoonCount > 0) {
    homeSignal = "due_soon";
  }

  const summary: StaffComplianceSummary = {
    totalActiveStaff: profiles.length,
    supervisionOverdue,
    supervisionDueWithinWeek,
    appraisalOverdue,
    dbsRenewalDue,
    onProbation,
    signal: homeSignal,
  };

  return NextResponse.json({ data: { staff: profiles, summary } });
}
