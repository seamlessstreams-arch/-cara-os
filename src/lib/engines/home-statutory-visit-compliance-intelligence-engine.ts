// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STATUTORY VISIT COMPLIANCE INTELLIGENCE ENGINE
// Tracks social worker visits, statutory visiting schedules, unannounced visits,
// Reg 22 records, and IRO contact to ensure children's statutory entitlements.
// Pure deterministic engine. CHR 2015 Reg 22/44/45 / IRO Handbook.
// ══════════════════════════════════════════════════════════════════════════════

export interface StatutoryVisitInput {
  id: string;
  child_id: string;
  visit_date: string;
  type: string;              // "statutory" | "additional" | "unannounced"
  completed: boolean;
  child_seen_alone: boolean;
  views_recorded: boolean;
}

export interface SocialWorkerContactInput {
  id: string;
  child_id: string;
  contact_date: string;
  method: string;            // "visit" | "phone" | "video"
  outcome_recorded: boolean;
}

export interface UnannouncedVisitInput {
  id: string;
  visit_date: string;
  completed: boolean;
  findings_documented: boolean;
  actions_raised: number;
  actions_resolved: number;
}

export interface Reg22RecordInput {
  id: string;
  child_id: string;
  date: string;
  notifications_made: boolean;
  placement_plan_updated: boolean;
}

export interface StatutoryVisitComplianceInput {
  today: string;
  total_children: number;
  statutory_visits: StatutoryVisitInput[];
  social_worker_contacts: SocialWorkerContactInput[];
  unannounced_visits: UnannouncedVisitInput[];
  reg22_records: Reg22RecordInput[];
  statutory_visits_due_per_child_per_year: number;  // typically 6 (every 6 weeks)
}

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

export type StatutoryVisitRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface StatutoryVisitResult {
  visit_rating: StatutoryVisitRating;
  visit_score: number;
  headline: string;
  // null throughout = nothing on record to measure, which is a gap to report,
  // not a pass and not a breach.
  statutory_visit_completion_rate: number | null;
  children_seen_alone_rate: number | null;
  social_worker_contact_rate: number | null;
  unannounced_visit_compliance: number | null;
  reg22_compliance_rate: number | null;
  children_without_recent_visit: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function daysBetween(a: string, b: string): number { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000); }

export function computeStatutoryVisitCompliance(input: StatutoryVisitComplianceInput): StatutoryVisitResult {
  const { today, total_children, statutory_visits, social_worker_contacts, unannounced_visits, reg22_records } = input;

  if (total_children === 0) {
    return {
      visit_rating: "insufficient_data", visit_score: 0,
      headline: "No children in placement — statutory visit compliance cannot be assessed.",
      statutory_visit_completion_rate: null, children_seen_alone_rate: null,
      social_worker_contact_rate: null, unannounced_visit_compliance: null,
      reg22_compliance_rate: null, children_without_recent_visit: 0,
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Statutory visits (last 12 months) ───────────────────────────────────
  const recent = statutory_visits.filter(v => daysBetween(v.visit_date, today) <= 365 && daysBetween(v.visit_date, today) >= 0);
  const completed = recent.filter(v => v.completed);
  const seenAlone = completed.filter(v => v.child_seen_alone);
  const viewsRecorded = completed.filter(v => v.views_recorded);
  const expectedVisits = total_children * input.statutory_visits_due_per_child_per_year;
  const completionRate = rate(completed.length, expectedVisits);
  const seenAloneRate = rate(seenAlone.length, completed.length);
  const viewsRate = rate(viewsRecorded.length, completed.length);

  // Children without recent visit (>49 days = missed statutory interval)
  const childLastVisit: Record<string, string> = {};
  completed.forEach(v => {
    if (!childLastVisit[v.child_id] || v.visit_date > childLastVisit[v.child_id]) {
      childLastVisit[v.child_id] = v.visit_date;
    }
  });
  let childrenWithoutRecent = 0;
  for (let i = 0; i < total_children; i++) {
    const cid = Object.keys(childLastVisit)[i];
    if (!cid || daysBetween(childLastVisit[cid], today) > 49) childrenWithoutRecent++;
  }
  // Also count children with no visits at all
  const childrenVisited = new Set(completed.map(v => v.child_id));
  const neverVisited = total_children - childrenVisited.size;
  childrenWithoutRecent = Math.max(childrenWithoutRecent, neverVisited);

  // ── Social worker contacts ──────────────────────────────────────────────
  const recentSWC = social_worker_contacts.filter(c => daysBetween(c.contact_date, today) <= 90 && daysBetween(c.contact_date, today) >= 0);
  const childrenWithSWContact = new Set(recentSWC.map(c => c.child_id)).size;
  const swContactRate = rate(childrenWithSWContact, total_children);
  const outcomeRecorded = recentSWC.filter(c => c.outcome_recorded).length;
  const outcomeRate = rate(outcomeRecorded, recentSWC.length);

  // ── Unannounced visits ──────────────────────────────────────────────────
  const recentUV = unannounced_visits.filter(v => daysBetween(v.visit_date, today) <= 365 && daysBetween(v.visit_date, today) >= 0);
  const uvCompleted = recentUV.filter(v => v.completed);
  const uvDocumented = uvCompleted.filter(v => v.findings_documented);
  const uvCompletionRate = rate(uvCompleted.length, recentUV.length);
  const uvActions = uvCompleted.reduce((s, v) => s + v.actions_raised, 0);
  const uvResolved = uvCompleted.reduce((s, v) => s + v.actions_resolved, 0);

  // ── Reg 22 records ──────────────────────────────────────────────────────
  const recentReg22 = reg22_records.filter(r => daysBetween(r.date, today) <= 365 && daysBetween(r.date, today) >= 0);
  const reg22Notified = recentReg22.filter(r => r.notifications_made).length;
  const reg22Updated = recentReg22.filter(r => r.placement_plan_updated).length;
  const reg22Rate = rate(reg22Notified + reg22Updated, recentReg22.length * 2);

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 52; // base

  // Mod 1: Visit completion (±8)
  if (meets(completionRate, 95)) score += 8;
  else if (meets(completionRate, 85)) score += 5;
  else if (meets(completionRate, 70)) score += 1;
  else if (meets(completionRate, 50)) score -= 3;
  else if (completionRate !== null) score -= 8;

  // Mod 2: Seen alone & views (±6)
  if (meets(seenAloneRate, 95) && meets(viewsRate, 95)) score += 6;
  else if (meets(seenAloneRate, 80) && meets(viewsRate, 80)) score += 3;
  else if (meets(seenAloneRate, 60)) score += 0;
  else if (seenAloneRate !== null) score -= 6;

  // Mod 3: Children without recent visit (±5)
  if (childrenWithoutRecent === 0) score += 5;
  else if (childrenWithoutRecent <= 1) score += 1;
  else if (childrenWithoutRecent <= 2) score -= 2;
  else score -= 5;

  // Mod 4: Social worker contact (±5)
  if (meets(swContactRate, 90)) score += 5;
  else if (meets(swContactRate, 70)) score += 2;
  else if (meets(swContactRate, 50)) score += 0;
  else if (swContactRate !== null) score -= 5;

  // Mod 5: Unannounced visits (±4)
  if (recentUV.length === 0) score += 0; // neutral
  else if (meets(uvCompletionRate, 100) && uvDocumented.length === uvCompleted.length) score += 4;
  else if (meets(uvCompletionRate, 80)) score += 2;
  else score -= 4;

  // Mod 6: Reg 22 compliance (±3)
  if (recentReg22.length === 0) score += 2; // neutral — no placement changes to notify
  else if (meets(reg22Rate, 90)) score += 3;
  else if (meets(reg22Rate, 70)) score += 1;
  else score -= 3;

  // Mod 7: Outcome recording (±3)
  if (recentSWC.length === 0) score += 0; // neutral
  else if (meets(outcomeRate, 95)) score += 3;
  else if (meets(outcomeRate, 80)) score += 1;
  else score -= 3;

  score = Math.max(0, Math.min(score, 100));

  const visit_rating: StatutoryVisitRating =
    score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(completionRate, 95)) strengths.push(`${formatRate(completionRate)} statutory visit completion — children's entitlements consistently met.`);
  if (meets(seenAloneRate, 95)) strengths.push("Over 95% of children seen alone during visits — private opportunity for children to share views.");
  if (childrenWithoutRecent === 0 && total_children > 0) strengths.push("All children have received a recent statutory visit — no gaps in professional oversight.");
  if (meets(swContactRate, 90)) strengths.push("Over 90% of children have had social worker contact in the last 90 days — strong professional relationships.");
  if (meets(reg22Rate, 90)) strengths.push("Reg 22 notifications and plan updates fully compliant — placement changes managed properly.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (childrenWithoutRecent >= 2) concerns.push(`${childrenWithoutRecent} children have not had a recent statutory visit — statutory duty not met.`);
  else if (childrenWithoutRecent === 1) concerns.push("1 child has not had a recent statutory visit — gap in professional oversight.");
  if (below(completionRate, 70)) concerns.push(`Statutory visit completion at ${formatRate(completionRate)} — significant shortfall against statutory requirements.`);
  if (below(seenAloneRate, 60)) concerns.push(`Only ${formatRate(seenAloneRate)} of children seen alone — children may not have private opportunity to disclose.`);
  if (below(swContactRate, 60)) concerns.push(`Only ${formatRate(swContactRate)} of children have had social worker contact in 90 days — professional relationship gaps.`);
  if (below(reg22Rate, 60)) concerns.push(`Reg 22 compliance at ${formatRate(reg22Rate)} — notifications and plan updates falling below statutory requirements.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (childrenWithoutRecent >= 1) recommendations.push({ rank: ++rank, recommendation: `Schedule immediate statutory visits for ${childrenWithoutRecent} child(ren) without recent visit.`, urgency: "immediate", regulatory_ref: "Reg 22" });
  if (below(seenAloneRate, 70)) recommendations.push({ rank: ++rank, recommendation: `Improve "child seen alone" rate from ${formatRate(seenAloneRate)} — statutory requirement for private consultation.`, urgency: "immediate", regulatory_ref: "IRO Handbook" });
  if (below(completionRate, 80)) recommendations.push({ rank: ++rank, recommendation: `Increase visit completion rate from ${formatRate(completionRate)} to meet statutory minimum.`, urgency: "soon", regulatory_ref: "Reg 22" });
  if (below(swContactRate, 70)) recommendations.push({ rank: ++rank, recommendation: "Ensure all children have social worker contact at least quarterly.", urgency: "soon", regulatory_ref: "Care Planning Regs" });
  if (score < 65) recommendations.push({ rank: ++rank, recommendation: "Develop statutory visiting improvement plan with local authority.", urgency: "planned", regulatory_ref: "Reg 44" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (visit_rating === "outstanding") insights.push({ text: "Statutory visit compliance is outstanding — children receive consistent, high-quality professional oversight.", severity: "positive" });
  if (visit_rating === "inadequate") insights.push({ text: "Statutory visiting is inadequate — children are not receiving the professional oversight they are legally entitled to.", severity: "critical" });
  if (below(seenAloneRate, 60) && childrenWithoutRecent >= 1) insights.push({ text: "Low seen-alone rates combined with missed visits suggest children lack opportunity to express concerns privately — safeguarding risk.", severity: "critical" });
  if (meets(swContactRate, 90) && below(completionRate, 70)) insights.push({ text: "Social worker contacts are frequent but formal statutory visits are low — consider whether informal contact is replacing required formal oversight.", severity: "warning" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (visit_rating === "outstanding") headline = `Outstanding statutory visit compliance — ${formatRate(completionRate)} completion, all children seen recently.`;
  else if (visit_rating === "good") headline = `Good statutory visit compliance — ${childrenWithoutRecent > 0 ? `${childrenWithoutRecent} child(ren) need visit` : "consistent visiting schedule"}.`;
  else if (visit_rating === "adequate") headline = `Adequate statutory visiting — ${childrenWithoutRecent} child(ren) overdue, ${formatRate(completionRate)} completion rate.`;
  else headline = `Statutory visiting inadequate — ${childrenWithoutRecent} child(ren) without recent visit, ${formatRate(completionRate)} completion.`;

  return {
    visit_rating, visit_score: score, headline,
    statutory_visit_completion_rate: completionRate,
    children_seen_alone_rate: seenAloneRate,
    social_worker_contact_rate: swContactRate,
    unannounced_visit_compliance: uvCompletionRate,
    reg22_compliance_rate: reg22Rate,
    children_without_recent_visit: childrenWithoutRecent,
    strengths, concerns, recommendations, insights,
  };
}
