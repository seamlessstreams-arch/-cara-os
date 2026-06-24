// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING GAP INTELLIGENCE
// GET /api/v1/recording-gap-intelligence
//
// Detects gaps in care recording for each current resident across four
// safeguarding-critical domains:
//
//   1. Daily Log          — gap if no entry in >3 days (critical) / >1 day (warning)
//   2. Key Work Sessions  — gap if no session in >30 days (critical) / >14 days (warning)
//   3. LAC Reviews        — gap if next_review_date overdue OR >180 days since last review
//   4. Welfare Checks     — gap if no check in >7 days (critical) / >3 days (warning)
//
// "Poor and infrequent recording makes it impossible for managers to assure
//  themselves of the quality of care." — Ofsted ILACS Handbook.
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

type GapSeverity = "critical" | "warning" | "current";
type RecordingDomain =
  | "daily_log"
  | "key_working"
  | "lac_review"
  | "welfare_check";

interface DomainGap {
  domain: RecordingDomain;
  domainLabel: string;
  severity: GapSeverity;
  daysSinceLastRecord: number | null;  // null = never recorded
  lastRecordDate: string | null;
  overdueMessage: string;
}

interface ChildRecordingProfile {
  childId: string;
  childName: string;
  placementDays: number;
  gaps: DomainGap[];
  criticalGapCount: number;
  warningGapCount: number;
  overallSeverity: GapSeverity;
  supervisionPrompt: string;
}

interface DomainSummary {
  domain: RecordingDomain;
  domainLabel: string;
  childrenWithCritical: number;
  childrenWithWarning: number;
  totalChildrenAffected: number;
}

interface RecordingGapSummary {
  totalCurrentChildren: number;
  childrenWithCriticalGap: number;
  childrenWithAnyGap: number;
  totalCriticalGaps: number;
  totalWarningGaps: number;
  domainSummaries: DomainSummary[];
  ofstedNote: string;
}

// ── Thresholds ────────────────────────────────────────────────────────────────

const THRESHOLDS: Record<RecordingDomain, { critical: number; warning: number }> = {
  daily_log:     { critical: 3,   warning: 1   },
  key_working:   { critical: 30,  warning: 14  },
  lac_review:    { critical: 180, warning: 120 },
  welfare_check: { critical: 7,   warning: 3   },
};

const DOMAIN_LABELS: Record<RecordingDomain, string> = {
  daily_log:     "Daily Log",
  key_working:   "Key Work Sessions",
  lac_review:    "LAC Review",
  welfare_check: "Welfare Checks",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 9999;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86_400_000));
}

function buildGap(
  domain: RecordingDomain,
  lastDate: string | null,
  now: Date,
  overdueOverride?: string,
): DomainGap {
  const thresholds = THRESHOLDS[domain];
  const daysAgo = lastDate ? daysBetween(lastDate, now) : null;
  const age = daysAgo ?? 9999;

  let severity: GapSeverity;
  if (age >= thresholds.critical) severity = "critical";
  else if (age >= thresholds.warning) severity = "warning";
  else severity = "current";

  const overdueMessage = overdueOverride ?? buildMessage(domain, daysAgo);

  return {
    domain,
    domainLabel: DOMAIN_LABELS[domain],
    severity,
    daysSinceLastRecord: daysAgo,
    lastRecordDate: lastDate,
    overdueMessage,
  };
}

function buildMessage(domain: RecordingDomain, daysAgo: number | null): string {
  if (daysAgo === null) {
    const neverMessages: Record<RecordingDomain, string> = {
      daily_log:     "No daily log entries have been recorded for this child",
      key_working:   "No key working sessions have been recorded for this child",
      lac_review:    "No LAC reviews have been recorded for this child",
      welfare_check: "No welfare checks have been recorded for this child",
    };
    return neverMessages[domain];
  }
  const unit = daysAgo === 1 ? "day" : "days";
  const messages: Record<RecordingDomain, string> = {
    daily_log:     `Last daily log was ${daysAgo} ${unit} ago`,
    key_working:   `Last key work session was ${daysAgo} ${unit} ago`,
    lac_review:    `Last LAC review was ${daysAgo} ${unit} ago`,
    welfare_check: `Last welfare check was ${daysAgo} ${unit} ago`,
  };
  return messages[domain];
}

function deriveOverallSeverity(gaps: DomainGap[]): GapSeverity {
  if (gaps.some((g) => g.severity === "critical")) return "critical";
  if (gaps.some((g) => g.severity === "warning"))  return "warning";
  return "current";
}

function supervisionPromptFor(
  childName: string,
  overallSeverity: GapSeverity,
  criticalGaps: DomainGap[],
  warningGaps: DomainGap[],
): string {
  if (overallSeverity === "current") {
    return `${childName}'s recording is up to date across all monitored domains. In supervision, explore: is the quality of what's recorded matching its frequency?`;
  }

  const critical = criticalGaps.map((g) => g.domainLabel.toLowerCase());
  const warning  = warningGaps.map((g) => g.domainLabel.toLowerCase());

  if (critical.length > 0) {
    return `${childName} has critical recording gaps in: ${critical.join(", ")}. Address in supervision this week. Who is responsible for each of these record types, and what has been getting in the way?`;
  }

  return `${childName} has recording warnings in: ${warning.join(", ")}. Explore in supervision: what is making recording difficult, and how can we support the team to stay current?`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const now = new Date();

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string;
    status: string; placement_start?: string;
  }>;

  const dailyLog = (store.dailyLog ?? []) as Array<{
    child_id: string; date: string;
  }>;

  const keyWorkSessions = (store.keyWorkingSessions ?? []) as Array<{
    child_id: string; date: string;
  }>;

  const lacReviews = (store.lacReviews ?? []) as Array<{
    child_id: string; date: string; next_review_date?: string;
  }>;

  const welfareChecks = (store.welfareChecks ?? []) as Array<{
    child_id: string; check_date: string;
  }>;

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // ── Index: most recent record per child per domain ───────────────────────
  const latestDailyLog    = new Map<string, string>();
  const latestKeyWork     = new Map<string, string>();
  const latestLACReview   = new Map<string, string>();
  const nextLACReviewDue  = new Map<string, string>();
  const latestWelfare     = new Map<string, string>();

  for (const e of dailyLog) {
    const curr = latestDailyLog.get(e.child_id);
    // Recording recency = the entry's own date, not created_at (which on seeded
    // and back-dated entries is the write timestamp, masking real gaps).
    if (!curr || e.date > curr) latestDailyLog.set(e.child_id, e.date);
  }
  for (const s of keyWorkSessions) {
    const curr = latestKeyWork.get(s.child_id);
    if (!curr || s.date > curr) latestKeyWork.set(s.child_id, s.date);
  }
  for (const r of lacReviews) {
    const curr = latestLACReview.get(r.child_id);
    if (!curr || r.date > curr) {
      latestLACReview.set(r.child_id, r.date);
      if (r.next_review_date) nextLACReviewDue.set(r.child_id, r.next_review_date);
    }
  }
  for (const w of welfareChecks) {
    const curr = latestWelfare.get(w.child_id);
    if (!curr || w.check_date > curr) latestWelfare.set(w.child_id, w.check_date);
  }

  // ── Build per-child profiles ──────────────────────────────────────────────
  const childProfiles: ChildRecordingProfile[] = currentChildren.map((yp) => {
    const childName = `${yp.first_name} ${yp.last_name}`;
    const placementDays = yp.placement_start ? daysBetween(yp.placement_start, now) : 0;

    // Daily log gap
    const dlGap = buildGap("daily_log", latestDailyLog.get(yp.id) ?? null, now);

    // Key work gap
    const kwGap = buildGap("key_working", latestKeyWork.get(yp.id) ?? null, now);

    // LAC review gap — also check if next_review_date is overdue
    const lacLastDate = latestLACReview.get(yp.id) ?? null;
    const lacNextDue = nextLACReviewDue.get(yp.id);
    let lacGap: DomainGap;
    if (lacNextDue && daysBetween(lacNextDue, now) > 0) {
      lacGap = buildGap(
        "lac_review",
        lacLastDate,
        now,
        `LAC review was due ${daysBetween(lacNextDue, now)} day${daysBetween(lacNextDue, now) === 1 ? "" : "s"} ago`,
      );
      lacGap = { ...lacGap, severity: "critical" };
    } else {
      lacGap = buildGap("lac_review", lacLastDate, now);
    }

    // Welfare check gap — only flag if child has been placed > 7 days
    let welfareGap = buildGap("welfare_check", latestWelfare.get(yp.id) ?? null, now);
    if (placementDays < 7 && welfareGap.severity === "critical") {
      welfareGap = { ...welfareGap, severity: "warning" };
    }

    const allGaps = [dlGap, kwGap, lacGap, welfareGap];
    const onlyGaps = allGaps.filter((g) => g.severity !== "current");
    const criticalGaps = onlyGaps.filter((g) => g.severity === "critical");
    const warningGaps  = onlyGaps.filter((g) => g.severity === "warning");

    const overallSeverity = deriveOverallSeverity(allGaps);

    return {
      childId: yp.id,
      childName,
      placementDays,
      gaps: onlyGaps,
      criticalGapCount: criticalGaps.length,
      warningGapCount: warningGaps.length,
      overallSeverity,
      supervisionPrompt: supervisionPromptFor(childName, overallSeverity, criticalGaps, warningGaps),
    };
  });

  // Sort: critical first, then warning, then current
  const ORDER: Record<GapSeverity, number> = { critical: 0, warning: 1, current: 2 };
  childProfiles.sort((a, b) => ORDER[a.overallSeverity] - ORDER[b.overallSeverity]);

  // ── Domain-level summaries ────────────────────────────────────────────────
  const domains: RecordingDomain[] = ["daily_log", "key_working", "lac_review", "welfare_check"];
  const domainSummaries: DomainSummary[] = domains.map((domain) => {
    let critCount = 0;
    let warnCount = 0;
    for (const profile of childProfiles) {
      const g = profile.gaps.find((gap) => gap.domain === domain);
      if (!g) continue;
      if (g.severity === "critical") critCount++;
      else if (g.severity === "warning") warnCount++;
    }
    return {
      domain,
      domainLabel: DOMAIN_LABELS[domain],
      childrenWithCritical: critCount,
      childrenWithWarning: warnCount,
      totalChildrenAffected: critCount + warnCount,
    };
  });

  const childrenWithCritical = childProfiles.filter((c) => c.criticalGapCount > 0).length;
  const childrenWithAny      = childProfiles.filter((c) => c.overallSeverity !== "current").length;
  const totalCritical = childProfiles.reduce((s, c) => s + c.criticalGapCount, 0);
  const totalWarning  = childProfiles.reduce((s, c) => s + c.warningGapCount, 0);

  const ofstedNote =
    childrenWithCritical > 0
      ? `${childrenWithCritical} child${childrenWithCritical > 1 ? "ren" : ""} have critical recording gaps. An inspector reviewing care records would identify these immediately. Address in supervision this week.`
      : childrenWithAny > 0
      ? `Recording is up to date for most children. ${childrenWithAny} ${childrenWithAny > 1 ? "have" : "has"} early warning signs — monitor closely.`
      : "Recording is current across all monitored domains for all current residents.";

  const summary: RecordingGapSummary = {
    totalCurrentChildren: currentChildren.length,
    childrenWithCriticalGap: childrenWithCritical,
    childrenWithAnyGap: childrenWithAny,
    totalCriticalGaps: totalCritical,
    totalWarningGaps: totalWarning,
    domainSummaries,
    ofstedNote,
  };

  return NextResponse.json({ data: { childProfiles, summary } });
}
