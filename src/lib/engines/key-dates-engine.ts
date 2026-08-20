import { todayStr } from "@/lib/utils";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEY DATES INTELLIGENCE ENGINE
//
// Pure deterministic engine that aggregates all upcoming dates across the
// system: birthdays, training expiry, supervision deadlines, probation
// reviews, care plan reviews, LAC reviews, DBS renewals, appraisals.
//
// Severity is calculated based on proximity:
//   • overdue       → critical
//   • ≤3 days       → high
//   • ≤7 days       → medium
//   • ≤14 days      → low
//   • >14 days      → info
//
// Key Ofsted metric: regulators always check that statutory deadlines are
// met and nothing has slipped through the cracks.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export interface KeyDate {
  id: string;
  type:
    | "birthday"
    | "training_expiry"
    | "supervision"
    | "probation_end"
    | "placement_review"
    | "document_expiry"
    | "care_review";
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  entity_type: "young_person" | "staff" | "document" | "home";
  entity_id: string;
  entity_name: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  href: string;
  notes?: string;
}

export interface KeyDateStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  overdue: number;
  this_week: number;
  by_type: Record<string, number>;
}

export interface KeyDatesResult {
  data: KeyDate[];
  stats: KeyDateStats;
  meta: { total: number; today: string };
}

// ── Input types (loose shapes matching store collections) ───────────────────

export interface YPInput {
  id: string;
  first_name: string;
  last_name?: string;
  preferred_name?: string | null;
  date_of_birth: string;
  placement_start: string;
  status?: string;
}

export interface StaffInput {
  id: string;
  full_name: string;
  first_name?: string;
  employment_status?: string;
  next_supervision_due?: string | null;
  next_appraisal_due?: string | null;
  probation_end_date?: string | null;
  dbs_issue_date?: string | null;
  dbs_update_service?: boolean;
}

export interface TrainingInput {
  id: string;
  staff_id: string;
  course_name: string;
  expiry_date?: string | null;
  status?: string;
  is_mandatory?: boolean;
}

export interface SupervisionInput {
  id: string;
  staff_id: string;
  type: string;
  scheduled_date: string;
  actual_date?: string | null;
  status: string;
  next_date?: string | null;
}

export interface LACReviewInput {
  id: string;
  child_id: string;
  next_review_date?: string | null;
  review_type?: string;
}

export interface BehaviourSupportPlanInput {
  id: string;
  child_id: string;
  review_date?: string | null;
  status?: string;
}

export interface KeyDatesEngineInput {
  youngPeople: YPInput[];
  staff: StaffInput[];
  trainingRecords: TrainingInput[];
  supervisions: SupervisionInput[];
  lacReviews: LACReviewInput[];
  behaviourSupportPlans?: BehaviourSupportPlanInput[];
  staffNameLookup?: (id: string) => string;
  ypNameLookup?: (id: string) => string;
  today?: string; // allow injection for deterministic testing
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Days between two ISO date strings. Positive = future, negative = past. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Compute severity from days until the deadline. */
export function computeSeverity(daysUntil: number): KeyDate["severity"] {
  if (daysUntil < 0) return "critical"; // overdue
  if (daysUntil <= 3) return "high";
  if (daysUntil <= 7) return "medium";
  if (daysUntil <= 14) return "low";
  return "info";
}

/** Compute human-readable notes from days until. */
export function computeNotes(daysUntil: number, type: KeyDate["type"]): string | undefined {
  if (daysUntil < 0) {
    return type === "training_expiry" || type === "document_expiry"
      ? "Expired"
      : "Overdue";
  }
  if (daysUntil === 0) return "Today!";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil <= 7) return `In ${daysUntil} days`;
  return undefined; // let the UI use formatRelative
}

/**
 * Given a date_of_birth, return the next birthday as an ISO date string.
 * If this year's birthday has passed, return next year's.
 */
export function nextBirthday(dob: string, today: string): string {
  const todayDate = new Date(today + "T00:00:00Z");
  const birthDate = new Date(dob + "T00:00:00Z");

  const thisYearBirthday = new Date(Date.UTC(
    todayDate.getUTCFullYear(),
    birthDate.getUTCMonth(),
    birthDate.getUTCDate(),
  ));

  if (thisYearBirthday.getTime() >= todayDate.getTime()) {
    return thisYearBirthday.toISOString().slice(0, 10);
  }

  // Next year
  const nextYearBirthday = new Date(Date.UTC(
    todayDate.getUTCFullYear() + 1,
    birthDate.getUTCMonth(),
    birthDate.getUTCDate(),
  ));
  return nextYearBirthday.toISOString().slice(0, 10);
}

/**
 * Calculate age a person will be turning on the next birthday.
 */
export function ageOnNextBirthday(dob: string, today: string): number {
  const birthDate = new Date(dob + "T00:00:00Z");
  const nb = nextBirthday(dob, today);
  const nbDate = new Date(nb + "T00:00:00Z");
  return nbDate.getUTCFullYear() - birthDate.getUTCFullYear();
}

/**
 * DBS certificates without the Update Service need renewing every 3 years.
 * Returns the expiry date or null if on the Update Service.
 */
export function dbsExpiryDate(issueDate: string, onUpdateService: boolean): string | null {
  if (onUpdateService) return null; // Never expires
  const issue = new Date(issueDate + "T00:00:00Z");
  const expiry = new Date(Date.UTC(
    issue.getUTCFullYear() + 3,
    issue.getUTCMonth(),
    issue.getUTCDate(),
  ));
  return expiry.toISOString().slice(0, 10);
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeKeyDates(input: KeyDatesEngineInput): KeyDatesResult {
  const today = input.today ?? todayStr();
  const dates: KeyDate[] = [];

  const staffName = input.staffNameLookup ?? ((id: string) =>
    input.staff.find((s) => s.id === id)?.full_name ?? id.replace("staff_", "").replace(/_/g, " ")
  );
  const ypName = input.ypNameLookup ?? ((id: string) => {
    const yp = input.youngPeople.find((y) => y.id === id);
    return yp?.preferred_name ?? yp?.first_name ?? id.replace("yp_", "");
  });

  // ── 1. Young People Birthdays ───────────────────────────────────────────
  for (const yp of input.youngPeople) {
    if (yp.status && yp.status !== "current") continue;
    if (!yp.date_of_birth) continue;

    const bd = nextBirthday(yp.date_of_birth, today);
    const daysUntil = daysBetween(today, bd);
    const age = ageOnNextBirthday(yp.date_of_birth, today);

    // Only include birthdays within 60 days
    if (daysUntil > 60) continue;

    dates.push({
      id: `kd_bday_${yp.id}`,
      type: "birthday",
      title: `${ypName(yp.id)} turns ${age}`,
      date: bd,
      entity_type: "young_person",
      entity_id: yp.id,
      entity_name: ypName(yp.id),
      severity: daysUntil === 0 ? "high" : daysUntil <= 3 ? "medium" : daysUntil <= 7 ? "low" : "info",
      href: `/young-people/${yp.id}`,
      notes: computeNotes(daysUntil, "birthday"),
    });
  }

  // ── 2. Training Expiry ────────────────────────────────────────────────────
  for (const tr of input.trainingRecords) {
    if (!tr.expiry_date) continue;
    const daysUntil = daysBetween(today, tr.expiry_date);

    // Include expired (up to 90 days overdue) and upcoming (within 60 days)
    if (daysUntil < -90 || daysUntil > 60) continue;

    const sName = staffName(tr.staff_id);
    const mandatory = tr.is_mandatory ? " (mandatory)" : "";

    dates.push({
      id: `kd_train_${tr.id}`,
      type: "training_expiry",
      title: `${tr.course_name}${mandatory} — ${sName}`,
      date: tr.expiry_date,
      entity_type: "staff",
      entity_id: tr.staff_id,
      entity_name: sName,
      severity: computeSeverity(daysUntil),
      href: "/training",
      notes: computeNotes(daysUntil, "training_expiry"),
    });
  }

  // ── 3. Supervision Due Dates ──────────────────────────────────────────────
  // Source A: Staff.next_supervision_due
  const staffWithSupervision = input.staff.filter(
    (s) => s.next_supervision_due && s.employment_status === "active"
  );
  for (const s of staffWithSupervision) {
    const daysUntil = daysBetween(today, s.next_supervision_due!);

    // Include overdue (up to 30 days) and upcoming (within 30 days)
    if (daysUntil < -30 || daysUntil > 30) continue;

    dates.push({
      id: `kd_sup_staff_${s.id}`,
      type: "supervision",
      title: `Supervision due — ${s.full_name}`,
      date: s.next_supervision_due!,
      entity_type: "staff",
      entity_id: s.id,
      entity_name: s.full_name,
      severity: computeSeverity(daysUntil),
      href: "/supervision",
      notes: computeNotes(daysUntil, "supervision"),
    });
  }

  // ── 4. Probation End Dates ────────────────────────────────────────────────
  for (const s of input.staff) {
    if (!s.probation_end_date || s.employment_status !== "active") continue;
    const daysUntil = daysBetween(today, s.probation_end_date);

    // Include overdue (up to 14 days) and upcoming (within 60 days)
    if (daysUntil < -14 || daysUntil > 60) continue;

    dates.push({
      id: `kd_prob_${s.id}`,
      type: "probation_end",
      title: `Probation ends — ${s.full_name}`,
      date: s.probation_end_date,
      entity_type: "staff",
      entity_id: s.id,
      entity_name: s.full_name,
      severity: computeSeverity(daysUntil),
      href: "/staff",
      notes: computeNotes(daysUntil, "probation_end"),
    });
  }

  // ── 5. DBS Renewal Dates ──────────────────────────────────────────────────
  for (const s of input.staff) {
    if (!s.dbs_issue_date || s.employment_status !== "active") continue;
    const expiry = dbsExpiryDate(s.dbs_issue_date, s.dbs_update_service ?? false);
    if (!expiry) continue; // On Update Service — no expiry

    const daysUntil = daysBetween(today, expiry);

    // Include overdue (up to 30 days) and upcoming (within 90 days)
    if (daysUntil < -30 || daysUntil > 90) continue;

    dates.push({
      id: `kd_dbs_${s.id}`,
      type: "document_expiry",
      title: `DBS renewal due — ${s.full_name}`,
      date: expiry,
      entity_type: "staff",
      entity_id: s.id,
      entity_name: s.full_name,
      severity: computeSeverity(daysUntil),
      href: "/staff",
      notes: computeNotes(daysUntil, "document_expiry"),
    });
  }

  // ── 6. Staff Appraisal Due Dates ──────────────────────────────────────────
  for (const s of input.staff) {
    if (!s.next_appraisal_due || s.employment_status !== "active") continue;
    const daysUntil = daysBetween(today, s.next_appraisal_due);

    // Include overdue (up to 30 days) and upcoming (within 60 days)
    if (daysUntil < -30 || daysUntil > 60) continue;

    dates.push({
      id: `kd_appraisal_${s.id}`,
      type: "care_review", // repurpose care_review type for appraisals — matches widget icon
      title: `Appraisal due — ${s.full_name}`,
      date: s.next_appraisal_due,
      entity_type: "staff",
      entity_id: s.id,
      entity_name: s.full_name,
      severity: computeSeverity(daysUntil),
      href: "/staff",
      notes: computeNotes(daysUntil, "care_review"),
    });
  }

  // ── 7. LAC Review Dates ───────────────────────────────────────────────────
  for (const lac of input.lacReviews) {
    if (!lac.next_review_date) continue;
    const daysUntil = daysBetween(today, lac.next_review_date);

    // Include overdue (up to 30 days) and upcoming (within 90 days)
    if (daysUntil < -30 || daysUntil > 90) continue;

    const name = ypName(lac.child_id);
    dates.push({
      id: `kd_lac_${lac.id}`,
      type: "care_review",
      title: `LAC review — ${name}`,
      date: lac.next_review_date,
      entity_type: "young_person",
      entity_id: lac.child_id,
      entity_name: name,
      severity: computeSeverity(daysUntil),
      href: `/young-people/${lac.child_id}`,
      notes: computeNotes(daysUntil, "care_review"),
    });
  }

  // ── 8. Placement Reviews (6 months from placement_start, then annually) ──
  for (const yp of input.youngPeople) {
    if (yp.status && yp.status !== "current") continue;
    if (!yp.placement_start) continue;

    const reviewDate = computeNextPlacementReview(yp.placement_start, today);
    if (!reviewDate) continue;

    const daysUntil = daysBetween(today, reviewDate);

    // Include overdue (up to 30 days) and upcoming (within 60 days)
    if (daysUntil < -30 || daysUntil > 60) continue;

    const name = ypName(yp.id);
    dates.push({
      id: `kd_placement_${yp.id}`,
      type: "placement_review",
      title: `Placement review — ${name}`,
      date: reviewDate,
      entity_type: "young_person",
      entity_id: yp.id,
      entity_name: name,
      severity: computeSeverity(daysUntil),
      href: `/young-people/${yp.id}`,
      notes: computeNotes(daysUntil, "placement_review"),
    });
  }

  // ── 9. Behaviour Support Plan Reviews ─────────────────────────────────────
  if (input.behaviourSupportPlans) {
    for (const bsp of input.behaviourSupportPlans) {
      if (bsp.status !== "active" || !bsp.review_date) continue;
      const daysUntil = daysBetween(today, bsp.review_date);

      if (daysUntil < -30 || daysUntil > 60) continue;

      const name = ypName(bsp.child_id);
      dates.push({
        id: `kd_bsp_${bsp.id}`,
        type: "placement_review",
        title: `Behaviour support plan review — ${name}`,
        date: bsp.review_date,
        entity_type: "young_person",
        entity_id: bsp.child_id,
        entity_name: name,
        severity: computeSeverity(daysUntil),
        href: `/young-people/${bsp.child_id}`,
        notes: computeNotes(daysUntil, "placement_review"),
      });
    }
  }

  // ── Sort: overdue first (critical), then by date ascending ────────────────
  dates.sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sevDiff = (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
    if (sevDiff !== 0) return sevDiff;
    return a.date.localeCompare(b.date);
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const byType: Record<string, number> = {};
  for (const d of dates) {
    byType[d.type] = (byType[d.type] ?? 0) + 1;
  }

  const stats: KeyDateStats = {
    total: dates.length,
    critical: dates.filter((d) => d.severity === "critical").length,
    high: dates.filter((d) => d.severity === "high").length,
    medium: dates.filter((d) => d.severity === "medium").length,
    overdue: dates.filter((d) => d.notes === "Overdue" || d.notes === "Expired").length,
    this_week: dates.filter((d) => {
      const du = daysBetween(today, d.date);
      return du >= 0 && du <= 7;
    }).length,
    by_type: byType,
  };

  return {
    data: dates,
    stats,
    meta: { total: dates.length, today },
  };
}

// ── Placement review calculation ────────────────────────────────────────────
// First review: 20 working days after placement start (≈28 calendar days)
// Second review: 3 months after first review
// Subsequent reviews: every 6 months
// We approximate with calendar days since working day calculation isn't
// needed for a dashboard widget — the exact date would come from the IRO.

export function computeNextPlacementReview(placementStart: string, today: string): string | null {
  const start = new Date(placementStart + "T00:00:00Z");

  // Generate review milestones
  const milestones: Date[] = [];

  // First review: ~28 days (20 working days)
  const first = new Date(start.getTime());
  first.setUTCDate(first.getUTCDate() + 28);
  milestones.push(first);

  // Second review: 3 months after first
  const second = new Date(first.getTime());
  second.setUTCMonth(second.getUTCMonth() + 3);
  milestones.push(second);

  // Subsequent: every 6 months from second, up to 10 years
  let current = new Date(second.getTime());
  for (let i = 0; i < 20; i++) {
    current = new Date(current.getTime());
    current.setUTCMonth(current.getUTCMonth() + 6);
    milestones.push(current);
  }

  // Find the next milestone that hasn't passed, or the most recently passed one
  // within a 30-day overdue window
  for (const m of milestones) {
    const mStr = m.toISOString().slice(0, 10);
    const daysUntil = daysBetween(today, mStr);
    if (daysUntil >= -30) {
      return mStr;
    }
  }

  return null;
}
