// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME REGULATORY COMPLIANCE INTELLIGENCE ENGINE
// Home-level: synthesises Reg 44 independent visitor reports, quality audits,
// Ofsted notifiable events, inspection history, and policy review status to
// produce an overall regulatory-compliance health score.
// CHR 2015 Reg 44, 45, 46. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meanOf, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface Reg44VisitInput {
  id: string;
  visit_date: string;                     // YYYY-MM-DD
  overall_judgement: string;
  strengths_count: number;
  areas_for_development_count: number;
  recommendations: Reg44RecommendationInput[];
  report_sent_to_ofsted: boolean;
}

export interface Reg44RecommendationInput {
  id: string;
  priority: "high" | "medium" | "low";
  status: "completed" | "in_progress" | "not_started" | "overdue";
  completed_at: string | null;
}

export interface AuditInput {
  id: string;
  title: string;
  category: string;
  date: string;                           // YYYY-MM-DD
  score: number;
  max_score: number;
  status: "completed" | "scheduled" | "overdue" | "cancelled";
  findings: number;
  actions: number;
}

export interface NotifiableEventInput {
  id: string;
  date: string;                           // YYYY-MM-DD
  event_type: string;
  ofsted_status: string;                  // "notified_within_24h" | "pending" | "late" etc.
  has_follow_up: boolean;
  has_lesson_learned: boolean;
}

export interface InspectionInput {
  id: string;
  inspection_date: string;                // YYYY-MM-DD
  inspection_type: string;
  grade: string;                          // "Outstanding" | "Good" | "Requires improvement" | "Inadequate"
  actions_required: number;
  actions_completed: number;
}

export interface PolicyInput {
  id: string;
  title: string;
  category: string;
  status: "current" | "overdue" | "draft" | "archived";
  next_review_date: string;               // YYYY-MM-DD
  last_reviewed: string;                  // YYYY-MM-DD
  acknowledgement_count: number;
  total_staff_required: number;
  statutory_basis: string;
}

export interface HomeRegulatoryComplianceInput {
  today: string;                          // YYYY-MM-DD injectable
  reg44_visits: Reg44VisitInput[];
  audits: AuditInput[];
  notifiable_events: NotifiableEventInput[];
  inspections: InspectionInput[];
  policies: PolicyInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RegulatoryComplianceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface Reg44Profile {
  total_visits_12m: number;
  visits_on_schedule: boolean;            // ≥1 per calendar month
  months_without_visit: number;           // consecutive months with no visit ending at today
  latest_judgement: string;
  open_recommendations: number;
  high_priority_open: number;
  recommendation_completion_rate: number | null; // 0-100, null = no recommendations raised
  reports_sent_to_ofsted_rate: number | null;    // 0-100, null = no visits to send
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface AuditProfile {
  completed_count_12m: number;
  avg_score: number | null;               // percentage of max_score
  upcoming_count: number;
  overdue_count: number;
  total_findings_12m: number;
  total_actions_12m: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface NotifiableEventProfile {
  total_90d: number;
  total_12m: number;
  notified_within_24h_rate: number | null;  // null = no notifiable events in 12m
  pending_count: number;
  follow_up_rate: number | null;            // null = no notifiable events in 12m
  lesson_learned_rate: number | null;       // null = no notifiable events in 12m
  event_types: { type: string; count: number }[];
}

export interface InspectionProfile {
  latest_grade: string;
  grade_trend: "improving" | "stable" | "declining" | "insufficient_data";
  total_actions_required: number;
  total_actions_completed: number;
  action_completion_rate: number | null;  // null = no actions required by any inspection
  months_since_last_inspection: number | null; // null = no inspection on record
}

export interface PolicyProfile {
  total_policies: number;
  current_count: number;
  overdue_count: number;
  overdue_policies: string[];             // titles
  avg_acknowledgement_rate: number | null; // null = no policy has an acknowledgement roll
  policies_below_100_ack: number;
  review_due_within_30d: number;
}

export interface RegulatoryInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RegulatoryRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeRegulatoryComplianceResult {
  regulatory_compliance_rating: RegulatoryComplianceRating;
  regulatory_compliance_score: number;
  headline: string;
  reg44: Reg44Profile;
  audits: AuditProfile;
  notifiable_events: NotifiableEventProfile;
  inspection: InspectionProfile;
  policies: PolicyProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RegulatoryRecommendation[];
  insights: RegulatoryInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function monthsBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function toRating(score: number): RegulatoryComplianceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeRegulatoryCompliance(
  input: HomeRegulatoryComplianceInput,
): HomeRegulatoryComplianceResult {
  const { today, reg44_visits, audits, notifiable_events, inspections, policies } = input;

  const totalData = reg44_visits.length + audits.length + notifiable_events.length +
    inspections.length + policies.length;

  if (totalData < 3) {
    return {
      regulatory_compliance_rating: "insufficient_data",
      regulatory_compliance_score: 0,
      headline: "Insufficient regulatory data to produce a compliance assessment.",
      reg44: emptyReg44(),
      audits: emptyAudit(),
      notifiable_events: emptyNotifiable(),
      inspection: emptyInspection(),
      policies: emptyPolicy(),
      strengths: [],
      concerns: [],
      recommendations: [{ rank: 1, recommendation: "Begin recording regulatory data to enable compliance analysis.", urgency: "immediate", regulatory_ref: "Reg 44-46" }],
      insights: [{ text: "Not enough regulatory data points to assess compliance. Ensure Reg 44 visits, audits, and policies are being tracked.", severity: "warning" }],
    };
  }

  // ── Reg 44 Profile ──────────────────────────────────────────────────────
  const sorted44 = [...reg44_visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date));
  const visits12m = sorted44.filter(v => daysBetween(v.visit_date, today) <= 365 && daysBetween(v.visit_date, today) >= 0);

  // Monthly compliance: check each of the last 12 calendar months has ≥1 visit
  let monthsWithoutVisit = 0;
  {
    const todayDate = new Date(today);
    for (let i = 0; i < 12; i++) {
      const checkMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
      const ym = `${checkMonth.getFullYear()}-${String(checkMonth.getMonth() + 1).padStart(2, "0")}`;
      const hasVisit = visits12m.some(v => v.visit_date.startsWith(ym));
      if (!hasVisit) monthsWithoutVisit++;
      else if (i === 0) continue; // current month may not have happened yet
    }
  }

  // Consecutive months from today going backward with no visit
  let consecutiveMonthsWithout = 0;
  {
    const todayDate = new Date(today);
    // Start from the previous month (current month may not have had its visit yet)
    for (let i = 1; i <= 12; i++) {
      const checkMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
      const ym = `${checkMonth.getFullYear()}-${String(checkMonth.getMonth() + 1).padStart(2, "0")}`;
      const hasVisit = visits12m.some(v => v.visit_date.startsWith(ym));
      if (!hasVisit) consecutiveMonthsWithout++;
      else break;
    }
  }

  const allRecs = sorted44.flatMap(v => v.recommendations);
  const openRecs = allRecs.filter(r => r.status !== "completed");
  const highPriorityOpen = openRecs.filter(r => r.priority === "high").length;
  const completedRecs = allRecs.filter(r => r.status === "completed").length;
  const recCompletionRate = rate(completedRecs, allRecs.length);
  const sentToOfstedRate = rateOf(visits12m.filter(v => v.report_sent_to_ofsted), visits12m);

  const latestVisit = sorted44.length > 0 ? sorted44[sorted44.length - 1] : null;

  // Reg44 trend: compare first half vs second half of visits by AFD count
  let reg44Trend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (visits12m.length >= 2) {
    const mid = Math.floor(visits12m.length / 2);
    const firstHalf = visits12m.slice(0, mid);
    const secondHalf = visits12m.slice(mid);
    const avgAfdFirst = firstHalf.reduce((s, v) => s + v.areas_for_development_count, 0) / firstHalf.length;
    const avgAfdSecond = secondHalf.reduce((s, v) => s + v.areas_for_development_count, 0) / secondHalf.length;
    if (avgAfdSecond < avgAfdFirst - 0.3) reg44Trend = "improving";
    else if (avgAfdSecond > avgAfdFirst + 0.3) reg44Trend = "declining";
    else reg44Trend = "stable";
  }

  const reg44Profile: Reg44Profile = {
    total_visits_12m: visits12m.length,
    visits_on_schedule: visits12m.length >= 11,  // allow 1 gap
    months_without_visit: consecutiveMonthsWithout,
    latest_judgement: latestVisit?.overall_judgement ?? "N/A",
    open_recommendations: openRecs.length,
    high_priority_open: highPriorityOpen,
    recommendation_completion_rate: recCompletionRate,
    reports_sent_to_ofsted_rate: sentToOfstedRate,
    trend: reg44Trend,
  };

  // ── Audit Profile ───────────────────────────────────────────────────────
  const audits12m = audits.filter(a => daysBetween(a.date, today) <= 365 && daysBetween(a.date, today) >= 0);
  const completedAudits = audits12m.filter(a => a.status === "completed");
  const scheduledAudits = audits.filter(a => a.status === "scheduled" && a.date >= today);
  const overdueAudits = audits.filter(a => a.status === "overdue" || (a.status === "scheduled" && a.date < today));

  const auditScores = completedAudits
    .filter(a => a.max_score > 0)
    .map(a => (a.score / a.max_score) * 100);
  const avgAuditScore = auditScores.length > 0
    ? Math.round(auditScores.reduce((s, v) => s + v, 0) / auditScores.length)
    : null;

  const totalFindings = completedAudits.reduce((s, a) => s + a.findings, 0);
  const totalActions = completedAudits.reduce((s, a) => s + a.actions, 0);

  // Audit trend: compare first half vs second half scores
  let auditTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (completedAudits.length >= 2) {
    const sorted = [...completedAudits].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const firstScores = sorted.slice(0, mid).filter(a => a.max_score > 0).map(a => (a.score / a.max_score) * 100);
    const secondScores = sorted.slice(mid).filter(a => a.max_score > 0).map(a => (a.score / a.max_score) * 100);
    if (firstScores.length > 0 && secondScores.length > 0) {
      const avgFirst = firstScores.reduce((s, v) => s + v, 0) / firstScores.length;
      const avgSecond = secondScores.reduce((s, v) => s + v, 0) / secondScores.length;
      if (avgSecond > avgFirst + 3) auditTrend = "improving";
      else if (avgSecond < avgFirst - 3) auditTrend = "declining";
      else auditTrend = "stable";
    }
  }

  const auditProfile: AuditProfile = {
    completed_count_12m: completedAudits.length,
    avg_score: avgAuditScore,
    upcoming_count: scheduledAudits.length,
    overdue_count: overdueAudits.length,
    total_findings_12m: totalFindings,
    total_actions_12m: totalActions,
    trend: auditTrend,
  };

  // ── Notifiable Events Profile ───────────────────────────────────────────
  const ne90d = notifiable_events.filter(n => {
    const d = daysBetween(n.date, today);
    return d >= 0 && d <= 90;
  });
  const ne12m = notifiable_events.filter(n => {
    const d = daysBetween(n.date, today);
    return d >= 0 && d <= 365;
  });

  const notifiedOnTime = ne12m.filter(n => n.ofsted_status === "notified_within_24h");
  const pending = ne12m.filter(n => n.ofsted_status === "pending");
  const withFollowUp = ne12m.filter(n => n.has_follow_up);
  const withLesson = ne12m.filter(n => n.has_lesson_learned);

  const notifiedRate = rateOf(notifiedOnTime, ne12m);
  const followUpRate = rateOf(withFollowUp, ne12m);
  const lessonRate = rateOf(withLesson, ne12m);

  // Event type breakdown
  const typeMap = new Map<string, number>();
  ne12m.forEach(n => typeMap.set(n.event_type, (typeMap.get(n.event_type) ?? 0) + 1));
  const eventTypes = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const notifiableProfile: NotifiableEventProfile = {
    total_90d: ne90d.length,
    total_12m: ne12m.length,
    notified_within_24h_rate: notifiedRate,
    pending_count: pending.length,
    follow_up_rate: followUpRate,
    lesson_learned_rate: lessonRate,
    event_types: eventTypes,
  };

  // ── Inspection Profile ──────────────────────────────────────────────────
  const sortedInsp = [...inspections].sort((a, b) => a.inspection_date.localeCompare(b.inspection_date));
  const latestInsp = sortedInsp.length > 0 ? sortedInsp[sortedInsp.length - 1] : null;
  const monthsSinceLast = latestInsp ? monthsBetween(latestInsp.inspection_date, today) : null;

  const totalActionsReq = inspections.reduce((s, i) => s + i.actions_required, 0);
  const totalActionsComp = inspections.reduce((s, i) => s + i.actions_completed, 0);
  const actionCompRate = rate(totalActionsComp, totalActionsReq);

  // Grade trend
  const gradeValue = (g: string): number => {
    const lower = g.toLowerCase();
    if (lower.includes("outstanding")) return 4;
    if (lower.includes("good")) return 3;
    if (lower.includes("requires") || lower.includes("improvement")) return 2;
    if (lower.includes("inadequate")) return 1;
    return 2;
  };

  let gradeTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (sortedInsp.length >= 2) {
    const prev = sortedInsp[sortedInsp.length - 2];
    const latest = sortedInsp[sortedInsp.length - 1];
    const prevVal = gradeValue(prev.grade);
    const latestVal = gradeValue(latest.grade);
    if (latestVal > prevVal) gradeTrend = "improving";
    else if (latestVal < prevVal) gradeTrend = "declining";
    else gradeTrend = "stable";
  }

  const inspectionProfile: InspectionProfile = {
    latest_grade: latestInsp?.grade ?? "N/A",
    grade_trend: gradeTrend,
    total_actions_required: totalActionsReq,
    total_actions_completed: totalActionsComp,
    action_completion_rate: actionCompRate,
    months_since_last_inspection: monthsSinceLast,
  };

  // ── Policy Profile ──────────────────────────────────────────────────────
  const currentPolicies = policies.filter(p => p.status === "current");
  const overduePolicies = policies.filter(p => p.status === "overdue" || (p.status === "current" && p.next_review_date < today));
  const overdueNames = overduePolicies.map(p => p.title);

  const ackRates = policies
    .filter(p => p.total_staff_required > 0)
    .map(p => rate(p.acknowledgement_count, p.total_staff_required));
  const avgAckRate = meanOf(ackRates);
  const below100Ack = policies.filter(p => p.total_staff_required > 0 && p.acknowledgement_count < p.total_staff_required).length;

  const reviewDue30d = policies.filter(p => {
    const daysUntil = daysBetween(today, p.next_review_date);
    return daysUntil >= 0 && daysUntil <= 30;
  }).length;

  const policyProfile: PolicyProfile = {
    total_policies: policies.length,
    current_count: currentPolicies.length,
    overdue_count: overduePolicies.length,
    overdue_policies: overdueNames,
    avg_acknowledgement_rate: avgAckRate,
    policies_below_100_ack: below100Ack,
    review_due_within_30d: reviewDue30d,
  };

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 50;

  // Reg 44 (±20)
  if (reg44_visits.length > 0) {
    if (reg44Profile.visits_on_schedule) score += 8;
    else if (visits12m.length >= 9) score += 3;
    else if (visits12m.length < 6) score -= 10;
    else score -= 3;

    if (consecutiveMonthsWithout >= 3) score -= 8;
    else if (consecutiveMonthsWithout >= 2) score -= 4;

    if (meets(recCompletionRate, 90)) score += 5;
    else if (meets(recCompletionRate, 70)) score += 2;
    else if (below(recCompletionRate, 50)) score -= 5;

    if (highPriorityOpen > 0) score -= 4;

    if (meets(sentToOfstedRate, 100)) score += 3;
    else if (below(sentToOfstedRate, 80)) score -= 3;
  }

  // Audits (±15)
  if (completedAudits.length > 0) {
    if (avgAuditScore !== null) {
      if (avgAuditScore >= 85) score += 8;
      else if (avgAuditScore >= 70) score += 3;
      else if (avgAuditScore < 60) score -= 5;
    }
    if (overdueAudits.length === 0) score += 3;
    else if (overdueAudits.length >= 2) score -= 5;
    else score -= 2;

    if (auditTrend === "improving") score += 3;
    else if (auditTrend === "declining") score -= 3;
  }

  // Notifiable Events (±15)
  if (ne12m.length > 0) {
    if (meets(notifiedRate, 100)) score += 8;
    else if (meets(notifiedRate, 80)) score += 3;
    else if (below(notifiedRate, 60)) score -= 8;

    if (pending.length === 0) score += 3;
    else score -= 3 * Math.min(pending.length, 3);

    if (meets(followUpRate, 100)) score += 2;
    else if (below(followUpRate, 70)) score -= 3;

    if (meets(lessonRate, 80)) score += 2;
  }

  // Inspection (±15)
  if (latestInsp) {
    const gv = gradeValue(latestInsp.grade);
    if (gv === 4) score += 10;
    else if (gv === 3) score += 5;
    else if (gv === 2) score -= 5;
    else if (gv === 1) score -= 15;

    if (meets(actionCompRate, 100)) score += 3;
    else if (below(actionCompRate, 70)) score -= 5;

    if (gradeTrend === "improving") score += 3;
    else if (gradeTrend === "declining") score -= 5;
  }

  // Policies (±15)
  if (policies.length > 0) {
    if (overduePolicies.length === 0) score += 8;
    else if (overduePolicies.length <= 1) score += 3;
    else if (overduePolicies.length >= 4) score -= 8;
    else score -= 3;

    if (meets(avgAckRate, 100)) score += 5;
    else if (meets(avgAckRate, 90)) score += 2;
    else if (below(avgAckRate, 80)) score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (reg44Profile.visits_on_schedule) strengths.push("Reg 44 independent visits are occurring on schedule every month.");
  if (meets(recCompletionRate, 90)) strengths.push(`${completedRecs} of ${allRecs.length} Reg 44 recommendations completed — ${formatRate(recCompletionRate)} completion rate.`);
  if (meets(sentToOfstedRate, 100)) strengths.push("All Reg 44 reports have been sent to Ofsted.");
  if (avgAuditScore !== null && avgAuditScore >= 85) strengths.push(`Quality audit average score is ${avgAuditScore}% — demonstrating robust internal quality assurance.`);
  if (meets(notifiedRate, 100)) strengths.push(`All ${ne12m.length} notifiable events in 12 months were reported to Ofsted within 24 hours.`);
  if (meets(followUpRate, 100)) strengths.push("Every notifiable event has documented follow-up actions.");
  if (meets(actionCompRate, 100)) strengths.push("All inspection actions have been completed.");
  if (gradeTrend === "improving") strengths.push("Inspection grade trend is improving — evidence of sustained leadership improvement.");
  if (overduePolicies.length === 0 && policies.length > 0) strengths.push("All home policies are within their review dates.");
  if (meets(avgAckRate, 100)) strengths.push("100% staff acknowledgement across all home policies.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (consecutiveMonthsWithout >= 2) concerns.push(`${consecutiveMonthsWithout} consecutive months without a Reg 44 independent visit — this is a regulatory breach.`);
  if (highPriorityOpen > 0) concerns.push(`${highPriorityOpen} high-priority Reg 44 recommendation${highPriorityOpen > 1 ? "s" : ""} still open.`);
  if (pending.length > 0) concerns.push(`${pending.length} notifiable event${pending.length > 1 ? "s" : ""} pending Ofsted notification — immediate action required.`);
  if (below(notifiedRate, 80)) concerns.push(`Only ${formatRate(notifiedRate)} of notifiable events reported within 24 hours — non-compliance with notification regulations.`);
  if (avgAuditScore !== null && avgAuditScore < 70) concerns.push(`Audit average score is ${avgAuditScore}% — below the expected standard.`);
  if (overdueAudits.length > 0) concerns.push(`${overdueAudits.length} audit${overdueAudits.length > 1 ? "s" : ""} overdue.`);
  if (overduePolicies.length > 0) concerns.push(`${overduePolicies.length} polic${overduePolicies.length > 1 ? "ies" : "y"} overdue for review: ${overdueNames.join(", ")}.`);
  if (below100Ack > 0) concerns.push(`${below100Ack} polic${below100Ack > 1 ? "ies" : "y"} without 100% staff acknowledgement.`);
  if (gradeValue(latestInsp?.grade ?? "") <= 2 && latestInsp) concerns.push(`Latest inspection grade is "${latestInsp.grade}" — improvement plan required.`);
  if (below(actionCompRate, 100)) concerns.push(`${totalActionsReq - totalActionsComp} inspection action${totalActionsReq - totalActionsComp > 1 ? "s" : ""} remain outstanding.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: RegulatoryRecommendation[] = [];
  let rank = 1;

  if (pending.length > 0) {
    recs.push({ rank: rank++, recommendation: `Submit ${pending.length} pending Ofsted notification${pending.length > 1 ? "s" : ""} immediately — statutory 24-hour requirement.`, urgency: "immediate", regulatory_ref: "Reg 40" });
  }
  if (highPriorityOpen > 0) {
    recs.push({ rank: rank++, recommendation: `Address ${highPriorityOpen} high-priority Reg 44 recommendation${highPriorityOpen > 1 ? "s" : ""} as a matter of urgency.`, urgency: "immediate", regulatory_ref: "Reg 44" });
  }
  if (consecutiveMonthsWithout >= 2) {
    recs.push({ rank: rank++, recommendation: "Schedule Reg 44 independent visitor for this month — visits have lapsed.", urgency: "immediate", regulatory_ref: "Reg 44" });
  }
  if (overduePolicies.length > 0) {
    recs.push({ rank: rank++, recommendation: `Review ${overduePolicies.length} overdue polic${overduePolicies.length > 1 ? "ies" : "y"} and update as needed.`, urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if (below100Ack > 0) {
    recs.push({ rank: rank++, recommendation: `Ensure all staff acknowledge ${below100Ack} polic${below100Ack > 1 ? "ies" : "y"} with outstanding read-receipts.`, urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if (overdueAudits.length > 0) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueAudits.length} overdue audit${overdueAudits.length > 1 ? "s" : ""} to maintain quality assurance compliance.`, urgency: "soon", regulatory_ref: "Reg 45" });
  }
  if (policyProfile.review_due_within_30d > 0) {
    recs.push({ rank: rank++, recommendation: `${policyProfile.review_due_within_30d} polic${policyProfile.review_due_within_30d > 1 ? "ies" : "y"} due for review within 30 days — schedule reviews now.`, urgency: "planned", regulatory_ref: "Reg 45" });
  }
  if (below(lessonRate, 80)) {
    recs.push({ rank: rank++, recommendation: "Ensure lessons-learned are documented for all notifiable events — critical for continuous improvement evidence.", urgency: "planned", regulatory_ref: "Reg 45" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: RegulatoryInsight[] = [];

  if (pending.length > 0) {
    insights.push({ text: `${pending.length} notifiable event${pending.length > 1 ? "s have" : " has"} not yet been reported to Ofsted. This is a statutory breach requiring immediate rectification.`, severity: "critical" });
  }
  if (consecutiveMonthsWithout >= 3) {
    insights.push({ text: `No Reg 44 independent visit for ${consecutiveMonthsWithout} consecutive months. This is a significant regulatory gap that Ofsted will identify.`, severity: "critical" });
  }
  if (highPriorityOpen > 0) {
    insights.push({ text: `${highPriorityOpen} high-priority Reg 44 recommendation${highPriorityOpen > 1 ? "s remain" : " remains"} unactioned. Open high-priority actions are a red flag during inspection.`, severity: "critical" });
  }
  if (overduePolicies.length >= 3) {
    insights.push({ text: `${overduePolicies.length} policies are overdue for review. Multiple overdue policies suggest a systematic gap in governance.`, severity: "warning" });
  } else if (overduePolicies.length > 0) {
    insights.push({ text: `${overduePolicies.length} polic${overduePolicies.length > 1 ? "ies" : "y"} overdue for review — schedule promptly to avoid accumulation.`, severity: "warning" });
  }
  if (avgAuditScore !== null && avgAuditScore >= 85 && policies.length > 0 && overduePolicies.length === 0 && pending.length === 0) {
    insights.push({ text: `Strong regulatory position: audits averaging ${avgAuditScore}%, policies up to date, and notifications compliant. Well-placed for inspection.`, severity: "positive" });
  }
  if (gradeTrend === "improving") {
    insights.push({ text: "Inspection grade trajectory is upward — evidence of effective leadership response to feedback.", severity: "positive" });
  }
  if (reg44Trend === "improving") {
    insights.push({ text: "Reg 44 areas for development are reducing over time — independent visitor is noting sustained improvement.", severity: "positive" });
  }
  if (ne90d.length >= 4) {
    insights.push({ text: `${ne90d.length} notifiable events in the last 90 days — consider whether pattern analysis and preventative strategies are needed.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = "Regulatory compliance is outstanding — Reg 44, audits, policies, and notifications all performing strongly.";
  } else if (rating === "good") {
    headline = `Good regulatory compliance overall${overduePolicies.length > 0 ? ` — ${overduePolicies.length} polic${overduePolicies.length > 1 ? "ies" : "y"} overdue for review` : ""}.`;
  } else if (rating === "adequate") {
    const issues: string[] = [];
    if (pending.length > 0) issues.push("pending notifications");
    if (overduePolicies.length > 0) issues.push("overdue policies");
    if (highPriorityOpen > 0) issues.push("open Reg 44 actions");
    headline = `Adequate regulatory compliance — attention needed on ${issues.join(", ") || "several areas"}.`;
  } else {
    headline = "Regulatory compliance is inadequate — multiple statutory requirements are unmet and urgent action is needed.";
  }

  return {
    regulatory_compliance_rating: rating,
    regulatory_compliance_score: score,
    headline,
    reg44: reg44Profile,
    audits: auditProfile,
    notifiable_events: notifiableProfile,
    inspection: inspectionProfile,
    policies: policyProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Defaults ──────────────────────────────────────────────────────────

function emptyReg44(): Reg44Profile {
  return { total_visits_12m: 0, visits_on_schedule: false, months_without_visit: 0, latest_judgement: "N/A", open_recommendations: 0, high_priority_open: 0, recommendation_completion_rate: null, reports_sent_to_ofsted_rate: null, trend: "insufficient_data" };
}

function emptyAudit(): AuditProfile {
  return { completed_count_12m: 0, avg_score: null, upcoming_count: 0, overdue_count: 0, total_findings_12m: 0, total_actions_12m: 0, trend: "insufficient_data" };
}

function emptyNotifiable(): NotifiableEventProfile {
  return { total_90d: 0, total_12m: 0, notified_within_24h_rate: null, pending_count: 0, follow_up_rate: null, lesson_learned_rate: null, event_types: [] };
}

function emptyInspection(): InspectionProfile {
  return { latest_grade: "N/A", grade_trend: "insufficient_data", total_actions_required: 0, total_actions_completed: 0, action_completion_rate: null, months_since_last_inspection: null };
}

function emptyPolicy(): PolicyProfile {
  return { total_policies: 0, current_count: 0, overdue_count: 0, overdue_policies: [], avg_acknowledgement_rate: null, policies_below_100_ack: 0, review_due_within_30d: 0 };
}
