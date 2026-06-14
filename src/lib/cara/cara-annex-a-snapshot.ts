// ══════════════════════════════════════════════════════════════════════════════
// Cara Studio — Annex A Live Snapshot Generator
//
// Builds a point-in-time inspection-readiness snapshot from verified records.
// Snapshots are created as drafts and can be locked by an authorised manager;
// locked snapshots are immutable. Reruns refresh the latest draft for the
// same period in place — locked snapshots are never overwritten.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import {
  CARA_ANNEX_A_SECTIONS,
  type CaraAnnexAReadiness,
  type CaraAnnexASectionKey,
  type CaraAnnexASectionReading,
  type CaraAnnexASnapshot,
} from "@/types/cara-studio";

const DEFAULT_PERIOD_DAYS = 180;
const STALE_DAYS = 90;

function defaultPeriod(): { periodStart: string; periodEnd: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - DEFAULT_PERIOD_DAYS);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

function inPeriod(d: string | null | undefined, start: string, end: string): boolean {
  if (!d) return false;
  const day = d.slice(0, 10);
  return day >= start && day <= end;
}

function isStale(d: string | null | undefined, asOf: string): boolean {
  if (!d) return true;
  const ts = new Date(d).getTime();
  const cutoff = new Date(asOf).getTime() - STALE_DAYS * 24 * 60 * 60 * 1000;
  return ts < cutoff;
}

function readinessFromCounts(recordCount: number, gapCount: number, isRequired: boolean): CaraAnnexAReadiness {
  if (isRequired && recordCount === 0) return "red";
  if (gapCount === 0) return "green";
  if (recordCount === 0) return "amber";
  const ratio = gapCount / Math.max(recordCount, 1);
  if (ratio >= 0.5) return "red";
  if (ratio > 0) return "amber";
  return "green";
}

function readinessScore(sections: CaraAnnexASectionReading[]): number {
  let total = 0;
  let earned = 0;
  for (const s of sections) {
    total += s.weight;
    const factor = s.readiness === "green" ? 1 : s.readiness === "amber" ? 0.6 : 0.2;
    earned += s.weight * factor;
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

function overallReadiness(score: number): CaraAnnexAReadiness {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildSection1(homeId: string): CaraAnnexASectionReading {
  const present = Boolean(homeId);
  const issues: string[] = present ? [] : ["Home identifier missing"];
  return {
    key: "section_1",
    label: "Section 1 — Details of the home",
    weight: 5,
    record_count: present ? 1 : 0,
    gap_count: issues.length,
    stale_count: 0,
    readiness: present ? "green" : "red",
    issues,
    notes: present ? "Home record present." : "No home record located.",
  };
}

function buildSection2(homeId: string): CaraAnnexASectionReading {
  const children = db.youngPeople.findAll().filter((y) => y.home_id === homeId && y.status === "current");
  const issues: string[] = [];
  let gaps = 0;
  for (const y of children) {
    const missing: string[] = [];
    if (!y.social_worker_name) missing.push("social worker");
    if (!y.key_worker_id) missing.push("key worker");
    if (!y.iro_name) missing.push("IRO");
    if (!y.legal_status) missing.push("legal status");
    if (missing.length > 0) {
      gaps++;
      issues.push(`${y.first_name} ${y.last_name}: missing ${missing.join(", ")}`);
    }
  }
  return {
    key: "section_2",
    label: "Section 2 — Children and young people",
    weight: 20,
    record_count: children.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(children.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${children.length} current children${gaps > 0 ? `, ${gaps} with missing key fields` : ""}.`,
  };
}

function buildSection3(homeId: string, asOf: string): CaraAnnexASectionReading {
  const staff = db.staff.findAll().filter((s) => s.home_id === homeId && s.is_active);
  const issues: string[] = [];
  let gaps = 0;
  let stale = 0;
  for (const s of staff) {
    const missing: string[] = [];
    if (!s.dbs_number) missing.push("DBS number");
    if (!s.next_supervision_due) missing.push("supervision schedule");
    if (s.next_supervision_due && s.next_supervision_due.slice(0, 10) < asOf.slice(0, 10)) {
      missing.push("overdue supervision");
      stale++;
    }
    if (missing.length > 0) {
      gaps++;
      issues.push(`${s.full_name}: ${missing.join(", ")}`);
    }
  }
  return {
    key: "section_3",
    label: "Section 3 — Staffing",
    weight: 15,
    record_count: staff.length,
    gap_count: gaps,
    stale_count: stale,
    readiness: readinessFromCounts(staff.length, gaps, true),
    issues: issues.slice(0, 10),
    notes: `${staff.length} active staff${gaps > 0 ? `, ${gaps} with compliance gaps` : ""}.`,
  };
}

function buildSection4(homeId: string, periodStart: string, periodEnd: string): CaraAnnexASectionReading {
  const incidents = db.incidents.findAll().filter(
    (i) => i.home_id === homeId && inPeriod(i.date, periodStart, periodEnd),
  );
  const issues: string[] = [];
  let gaps = 0;
  for (const i of incidents) {
    if (i.requires_oversight && !i.oversight_at) {
      gaps++;
      issues.push(`${i.reference}: oversight outstanding`);
    }
  }
  return {
    key: "section_4",
    label: "Section 4 — Incidents and notifications",
    weight: 15,
    record_count: incidents.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(incidents.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${incidents.length} incidents in period${gaps > 0 ? `, ${gaps} awaiting oversight` : ""}.`,
  };
}

function buildSection5(homeId: string, periodStart: string, periodEnd: string): CaraAnnexASectionReading {
  const childIds = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  const records = db.complaintOutcomeRecords
    .findAll()
    .filter(
      (c) =>
        (c.child_id == null || childIds.has(c.child_id)) &&
        inPeriod(c.complaint_date, periodStart, periodEnd),
    );
  const issues: string[] = [];
  let gaps = 0;
  for (const c of records) {
    const problems: string[] = [];
    if (!c.date_resolved) problems.push("not resolved");
    if (c.response_time_days > 28) problems.push("response > 28 days");
    if (problems.length > 0) {
      gaps++;
      issues.push(`${c.complainant}: ${problems.join(", ")}`);
    }
  }
  return {
    key: "section_5",
    label: "Section 5 — Complaints and representations",
    weight: 10,
    record_count: records.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(records.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${records.length} complaints in period${gaps > 0 ? `, ${gaps} unresolved or late` : ""}.`,
  };
}

function buildSection6(homeId: string, periodStart: string, periodEnd: string): CaraAnnexASectionReading {
  const childIds = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  const episodes = db.missingEpisodes
    .findAll()
    .filter((m) => childIds.has(m.child_id) && inPeriod(m.date_missing, periodStart, periodEnd));
  const issues: string[] = [];
  let gaps = 0;
  for (const m of episodes) {
    if ((m.status === "returned" || m.status === "closed") && !m.return_interview_completed) {
      gaps++;
      issues.push(`${m.reference}: return interview outstanding`);
    }
  }
  return {
    key: "section_6",
    label: "Section 6 — Missing episodes",
    weight: 10,
    record_count: episodes.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(episodes.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${episodes.length} missing episodes in period${gaps > 0 ? `, ${gaps} missing return interview` : ""}.`,
  };
}

function buildSection7(homeId: string, periodStart: string, periodEnd: string): CaraAnnexASectionReading {
  const childIds = new Set(
    db.youngPeople.findAll().filter((y) => y.home_id === homeId).map((y) => y.id),
  );
  const records = db.restraints
    .findAll()
    .filter((r) => childIds.has(r.child_id) && inPeriod(r.date, periodStart, periodEnd));
  const issues: string[] = [];
  let gaps = 0;
  for (const r of records) {
    const problems: string[] = [];
    if (r.review_status === "pending_rm" || r.review_status === "pending_ri") problems.push("review pending");
    if (!r.medical_check_completed) problems.push("medical check missing");
    if (!r.child_debriefed) problems.push("child debrief missing");
    if (problems.length > 0) {
      gaps++;
      issues.push(`${r.id.slice(-6)}: ${problems.join(", ")}`);
    }
  }
  return {
    key: "section_7",
    label: "Section 7 — Physical interventions / restraints",
    weight: 10,
    record_count: records.length,
    gap_count: gaps,
    stale_count: 0,
    readiness: readinessFromCounts(records.length, gaps, false),
    issues: issues.slice(0, 10),
    notes: `${records.length} restraints in period${gaps > 0 ? `, ${gaps} with outstanding follow-up` : ""}.`,
  };
}

function buildSection8(homeId: string, periodStart: string, periodEnd: string, asOf: string): CaraAnnexASectionReading {
  const visits = db.reg44VisitReports
    .findAll()
    .filter((v) => v.home_id === homeId && inPeriod(v.visit_date, periodStart, periodEnd));
  const issues: string[] = [];
  let gaps = 0;
  let stale = 0;
  // Expected ~1 visit/month → 6 in 180d
  const expected = 6;
  if (visits.length < expected) {
    gaps += expected - visits.length;
    issues.push(`${expected - visits.length} fewer Reg 44 visits than expected in period`);
  }
  for (const v of visits) {
    if (!v.report_sent_to_ofsted) {
      gaps++;
      issues.push(`${v.visit_date}: report not sent to Ofsted`);
    }
    if (isStale(v.visit_date, asOf)) stale++;
  }
  const isRequired = true;
  let readiness: CaraAnnexAReadiness;
  if (visits.length === 0) readiness = "red";
  else if (visits.length < expected) readiness = "amber";
  else readiness = readinessFromCounts(visits.length, gaps, isRequired);
  return {
    key: "section_8",
    label: "Section 8 — Regulation 44 visits",
    weight: 10,
    record_count: visits.length,
    gap_count: gaps,
    stale_count: stale,
    readiness,
    issues: issues.slice(0, 10),
    notes: `${visits.length} Reg 44 visits in period (expected ~${expected}).`,
  };
}

function buildSection9(homeId: string, periodStart: string, periodEnd: string): CaraAnnexASectionReading {
  const reg45Items = db.caraReg45EvidenceItems
    .findAll(homeId)
    .filter(
      (e) =>
        (e.status === "accepted" || e.status === "included_in_report") &&
        inPeriod(e.occurred_at, periodStart, periodEnd),
    );
  const recordCount = reg45Items.length;
  const issues: string[] = [];
  let gaps = 0;
  if (recordCount === 0) {
    gaps = 1;
    issues.push("No Reg 45 evidence accepted in period");
  }
  let readiness: CaraAnnexAReadiness;
  if (recordCount === 0) readiness = "red";
  else if (recordCount < 5) readiness = "amber";
  else readiness = "green";
  return {
    key: "section_9",
    label: "Section 9 — Regulation 45 reports",
    weight: 5,
    record_count: recordCount,
    gap_count: gaps,
    stale_count: 0,
    readiness,
    issues,
    notes: `${recordCount} Reg 45 evidence items accepted/included in period.`,
  };
}

const SECTION_BUILDERS: Record<
  CaraAnnexASectionKey,
  (homeId: string, periodStart: string, periodEnd: string, asOf: string) => CaraAnnexASectionReading
> = {
  section_1: (h) => buildSection1(h),
  section_2: (h) => buildSection2(h),
  section_3: (h, _ps, _pe, asOf) => buildSection3(h, asOf),
  section_4: (h, ps, pe) => buildSection4(h, ps, pe),
  section_5: (h, ps, pe) => buildSection5(h, ps, pe),
  section_6: (h, ps, pe) => buildSection6(h, ps, pe),
  section_7: (h, ps, pe) => buildSection7(h, ps, pe),
  section_8: (h, ps, pe, asOf) => buildSection8(h, ps, pe, asOf),
  section_9: (h, ps, pe) => buildSection9(h, ps, pe),
};

// ── Public API ────────────────────────────────────────────────────────────────

export function buildAnnexASnapshotData(
  homeId: string,
  opts: { periodStart?: string; periodEnd?: string } = {},
): {
  sections: CaraAnnexASectionReading[];
  readiness_score: number;
  overall_readiness: CaraAnnexAReadiness;
  total_gaps: number;
  total_stale: number;
  period_start: string;
  period_end: string;
  generated_at: string;
} {
  const { periodStart: defStart, periodEnd: defEnd } = defaultPeriod();
  const periodStart = opts.periodStart ?? defStart;
  const periodEnd = opts.periodEnd ?? defEnd;
  const generatedAt = new Date().toISOString();

  const sections = CARA_ANNEX_A_SECTIONS.map(({ key }) =>
    SECTION_BUILDERS[key](homeId, periodStart, periodEnd, generatedAt),
  );
  const score = readinessScore(sections);
  return {
    sections,
    readiness_score: score,
    overall_readiness: overallReadiness(score),
    total_gaps: sections.reduce((acc, s) => acc + s.gap_count, 0),
    total_stale: sections.reduce((acc, s) => acc + s.stale_count, 0),
    period_start: periodStart,
    period_end: periodEnd,
    generated_at: generatedAt,
  };
}

export function runAnnexASnapshot(
  homeId: string,
  opts: { periodStart?: string; periodEnd?: string } = {},
): CaraAnnexASnapshot {
  const data = buildAnnexASnapshotData(homeId, opts);
  // Refresh existing draft for the same period if present, else create.
  const existing = db.caraAnnexASnapshots
    .findAll(homeId)
    .find(
      (s) =>
        s.status === "draft" &&
        s.period_start === data.period_start &&
        s.period_end === data.period_end,
    );
  if (existing) {
    const patched = db.caraAnnexASnapshots.patch(existing.id, {
      generated_at: data.generated_at,
      sections: data.sections,
      readiness_score: data.readiness_score,
      overall_readiness: data.overall_readiness,
      total_gaps: data.total_gaps,
      total_stale: data.total_stale,
    });
    if (patched) return patched;
  }
  return db.caraAnnexASnapshots.create({
    home_id: homeId,
    period_start: data.period_start,
    period_end: data.period_end,
    generated_at: data.generated_at,
    status: "draft",
    sections: data.sections,
    readiness_score: data.readiness_score,
    overall_readiness: data.overall_readiness,
    total_gaps: data.total_gaps,
    total_stale: data.total_stale,
    locked_by: null,
    locked_at: null,
    lock_note: null,
  });
}

export function lockAnnexASnapshot(
  id: string,
  lockedBy: string,
  lockNote: string | null,
): CaraAnnexASnapshot | null {
  const snap = db.caraAnnexASnapshots.findById(id);
  if (!snap) return null;
  if (snap.status === "locked") return snap; // already locked, immutable
  return db.caraAnnexASnapshots.patch(id, {
    status: "locked",
    locked_by: lockedBy,
    locked_at: new Date().toISOString(),
    lock_note: lockNote,
  });
}

export function loadAnnexASnapshots(homeId: string): CaraAnnexASnapshot[] {
  return [...db.caraAnnexASnapshots.findAll(homeId)].sort((a, b) =>
    b.generated_at.localeCompare(a.generated_at),
  );
}
