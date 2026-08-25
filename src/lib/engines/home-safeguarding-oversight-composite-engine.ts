import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME SAFEGUARDING OVERSIGHT COMPOSITE ENGINE
// Correlates safeguarding referrals, exploitation screenings, missing episodes,
// restraint/restrictive practice, incidents, disclosures, and multi-agency work.
// Pure deterministic engine. CHR 2015 Reg 12/13/34/35.
// ══════════════════════════════════════════════════════════════════════════════

export interface SafeguardingCompositeInput {
  today: string;
  total_children: number;

  // Safeguarding referrals
  safeguarding_referrals_total: number;
  safeguarding_referrals_resolved: number;
  safeguarding_referrals_open: number;
  safeguarding_supervision_sessions: number;
  safeguarding_supervision_due: number;

  // Exploitation screening
  exploitation_screenings_completed: number;
  exploitation_screenings_due: number;
  children_high_risk_exploitation: number;

  // Missing episodes
  missing_episodes_total: number;
  missing_episodes_with_return_interview: number;
  children_with_repeat_missing: number;

  // Restrictive practice
  restraint_incidents: number;
  children_with_restraints: number;
  restraint_debrief_completed: number;
  restraint_debrief_due: number;

  // Incidents
  incidents_total: number;
  incidents_serious: number;
  incidents_with_followup: number;
  notifiable_events_total: number;
  notifiable_events_reported_on_time: number;

  // Disclosures
  disclosures_total: number;
  disclosures_acted_on: number;

  // Multi-agency
  lado_referrals: number;
  lado_referrals_resolved: number;
  multi_agency_meetings_attended: number;
  multi_agency_meetings_due: number;

  // Contextual safeguarding
  contextual_risks_identified: number;
  contextual_risks_mitigated: number;
}

export type SafeguardingCompositeRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface SafeguardingDomainScore {
  name: string;
  score: number;
  max: number;
  at_risk: boolean;
}

export interface SafeguardingCompositeResult {
  safeguarding_rating: SafeguardingCompositeRating;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguarding_score: number | null;
  headline: string;
  domain_scores: SafeguardingDomainScore[];
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

export function computeSafeguardingOversight(input: SafeguardingCompositeInput): SafeguardingCompositeResult {
  const tc = input.total_children;

  if (tc === 0) {
    return {
      safeguarding_rating: "insufficient_data", safeguarding_score: 0,
      headline: "No children in placement — safeguarding composite cannot be assessed.",
      domain_scores: [], strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Domain: Referral Management (0–20) ──────────────────────────────────
  let refScore = 0;
  const refResRate = rate(input.safeguarding_referrals_resolved, input.safeguarding_referrals_total);
  if (input.safeguarding_referrals_total === 0) {
    refScore += 10; // neutral — no referrals
  } else {
    if (meets(refResRate, 90)) refScore += 10;
    else if (meets(refResRate, 70)) refScore += 7;
    else if (meets(refResRate, 50)) refScore += 4;
    else refScore += 1;
  }
  const supRate = rate(input.safeguarding_supervision_sessions, input.safeguarding_supervision_due);
  if (input.safeguarding_supervision_due === 0) {
    refScore += 5; // neutral
  } else {
    if (meets(supRate, 90)) refScore += 10;
    else if (meets(supRate, 75)) refScore += 7;
    else if (meets(supRate, 50)) refScore += 4;
    else refScore += 1;
  }
  refScore = Math.min(refScore, 20);
  const refAtRisk = (input.safeguarding_referrals_open >= 3 || (input.safeguarding_referrals_total > 0 && below(refResRate, 50)));

  // ── Domain: Exploitation Screening (0–15) ───────────────────────────────
  let expScore = 0;
  const expRate = rate(input.exploitation_screenings_completed, input.exploitation_screenings_due);
  if (input.exploitation_screenings_due === 0) {
    expScore += 8; // neutral
  } else {
    if (meets(expRate, 95)) expScore += 10;
    else if (meets(expRate, 80)) expScore += 7;
    else if (meets(expRate, 60)) expScore += 4;
    else expScore += 1;
  }
  if (input.children_high_risk_exploitation === 0) expScore += 5;
  else if (input.children_high_risk_exploitation <= 1) expScore += 2;
  else expScore += 0;
  expScore = Math.min(expScore, 15);
  const expAtRisk = (input.children_high_risk_exploitation >= 2 || (input.exploitation_screenings_due > 0 && below(expRate, 60)));

  // ── Domain: Missing Episodes (0–15) ─────────────────────────────────────
  let misScore = 0;
  const riRate = rate(input.missing_episodes_with_return_interview, input.missing_episodes_total);
  if (input.missing_episodes_total === 0) {
    misScore += 15; // excellent — no missing episodes
  } else {
    if (meets(riRate, 95)) misScore += 10;
    else if (meets(riRate, 80)) misScore += 7;
    else if (meets(riRate, 60)) misScore += 4;
    else misScore += 1;
    if (input.children_with_repeat_missing === 0) misScore += 5;
    else if (input.children_with_repeat_missing <= 1) misScore += 2;
    else misScore += 0;
  }
  misScore = Math.min(misScore, 15);
  const misAtRisk = (input.children_with_repeat_missing >= 2 || (input.missing_episodes_total > 0 && below(riRate, 60)));

  // ── Domain: Restrictive Practice (0–15) ─────────────────────────────────
  let resScore = 0;
  if (input.restraint_incidents === 0) {
    resScore += 15; // excellent
  } else {
    const debriefRate = rate(input.restraint_debrief_completed, input.restraint_debrief_due);
    if (meets(debriefRate, 95)) resScore += 8;
    else if (meets(debriefRate, 80)) resScore += 5;
    else resScore += 2;
    if (input.restraint_incidents <= 2) resScore += 5;
    else if (input.restraint_incidents <= 5) resScore += 2;
    else resScore += 0;
    const childrenRate = rate(input.children_with_restraints, tc);
    if (childrenRate !== null && childrenRate <= 20) resScore += 2;
  }
  resScore = Math.min(resScore, 15);
  const resAtRisk = (input.restraint_incidents >= 5 || above(rate(input.children_with_restraints, tc), 50));

  // ── Domain: Incident & Notifiable Event Management (0–20) ───────────────
  let incScore = 0;
  const followupRate = rate(input.incidents_with_followup, input.incidents_total);
  if (input.incidents_total === 0) {
    incScore += 10; // neutral
  } else {
    if (meets(followupRate, 95)) incScore += 10;
    else if (meets(followupRate, 80)) incScore += 7;
    else if (meets(followupRate, 60)) incScore += 4;
    else incScore += 1;
  }
  if (input.incidents_serious === 0) incScore += 5;
  else if (input.incidents_serious <= 2) incScore += 2;
  else incScore += 0;

  const neRate = rate(input.notifiable_events_reported_on_time, input.notifiable_events_total);
  if (input.notifiable_events_total === 0) {
    incScore += 5; // neutral
  } else {
    if (meets(neRate, 100)) incScore += 5;
    else if (meets(neRate, 80)) incScore += 3;
    else incScore += 1;
  }
  incScore = Math.min(incScore, 20);
  const incAtRisk = (input.incidents_serious >= 3 || (input.notifiable_events_total > 0 && below(neRate, 80)));

  // ── Domain: Disclosure Response (0–10) ──────────────────────────────────
  let disScore = 0;
  if (input.disclosures_total === 0) {
    disScore += 5; // neutral
  } else {
    const actRate = rate(input.disclosures_acted_on, input.disclosures_total);
    if (meets(actRate, 100)) disScore += 10;
    else if (meets(actRate, 90)) disScore += 7;
    else if (meets(actRate, 70)) disScore += 4;
    else disScore += 1;
  }
  disScore = Math.min(disScore, 10);
  const disAtRisk = (input.disclosures_total > 0 && below(rate(input.disclosures_acted_on, input.disclosures_total), 70));

  // ── Domain: Multi-Agency & Contextual (0–5) ────────────────────────────
  let maScore = 0;
  const maRate = rate(input.multi_agency_meetings_attended, input.multi_agency_meetings_due);
  if (input.multi_agency_meetings_due === 0) {
    maScore += 2; // neutral
  } else {
    if (meets(maRate, 90)) maScore += 3;
    else if (meets(maRate, 70)) maScore += 2;
    else maScore += 1;
  }
  const ctxMitRate = rate(input.contextual_risks_mitigated, input.contextual_risks_identified);
  if (input.contextual_risks_identified === 0) {
    maScore += 2;
  } else {
    if (meets(ctxMitRate, 80)) maScore += 2;
    else if (meets(ctxMitRate, 50)) maScore += 1;
    else maScore += 0;
  }
  maScore = Math.min(maScore, 5);
  const maAtRisk = (input.lado_referrals > 0 && below(rate(input.lado_referrals_resolved, input.lado_referrals), 50));

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalScore = refScore + expScore + misScore + resScore + incScore + disScore + maScore;
  const maxScore = 20 + 15 + 15 + 15 + 20 + 10 + 5; // = 100
  const safeguarding_score = rate(totalScore, maxScore);
  const safeguarding_rating: SafeguardingCompositeRating =
    meets(safeguarding_score, 80) ? "outstanding" :
    meets(safeguarding_score, 65) ? "good" :
    meets(safeguarding_score, 45) ? "adequate" : "inadequate";

  // ── Domain scores ───────────────────────────────────────────────────────
  const domain_scores: SafeguardingDomainScore[] = [
    { name: "referral_management", score: refScore, max: 20, at_risk: refAtRisk },
    { name: "exploitation_screening", score: expScore, max: 15, at_risk: expAtRisk },
    { name: "missing_episodes", score: misScore, max: 15, at_risk: misAtRisk },
    { name: "restrictive_practice", score: resScore, max: 15, at_risk: resAtRisk },
    { name: "incident_management", score: incScore, max: 20, at_risk: incAtRisk },
    { name: "disclosure_response", score: disScore, max: 10, at_risk: disAtRisk },
    { name: "multi_agency", score: maScore, max: 5, at_risk: maAtRisk },
  ];

  const domainsAtRisk = domain_scores.filter(d => d.at_risk);

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (input.missing_episodes_total === 0) strengths.push("No missing episodes recorded — children are settled and secure in placement.");
  if (input.restraint_incidents === 0) strengths.push("No restraint incidents — positive behaviour support is effective.");
  if (input.disclosures_total > 0 && rate(input.disclosures_acted_on, input.disclosures_total) === 100) strengths.push("All disclosures acted upon promptly — children's voices are heard and responded to.");
  if (input.notifiable_events_total > 0 && neRate === 100) strengths.push("All notifiable events reported on time — regulatory compliance is strong.");
  if (domainsAtRisk.length === 0 && meets(safeguarding_score, 65)) strengths.push("No safeguarding domains at risk — comprehensive protective oversight.");
  if (input.exploitation_screenings_due > 0 && meets(expRate, 95)) strengths.push("Exploitation screening coverage exceeds 95% — proactive protective practice.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (input.children_high_risk_exploitation >= 2) concerns.push(`${input.children_high_risk_exploitation} children identified as high risk for exploitation — immediate safety planning required.`);
  if (input.children_with_repeat_missing >= 2) concerns.push(`${input.children_with_repeat_missing} children with repeat missing episodes — pattern suggests ongoing safety concern.`);
  if (input.restraint_incidents >= 5) concerns.push(`${input.restraint_incidents} restraint incidents — frequency indicates systemic behaviour support failures.`);
  if (input.incidents_serious >= 3) concerns.push(`${input.incidents_serious} serious incidents — significant pattern of harm or risk within the home.`);
  if (input.safeguarding_referrals_open >= 3) concerns.push(`${input.safeguarding_referrals_open} safeguarding referrals remain open — potential backlog in protective responses.`);
  if (domainsAtRisk.length >= 3) concerns.push(`${domainsAtRisk.length} safeguarding domains at risk — widespread protective failures.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (input.children_high_risk_exploitation >= 1) recommendations.push({ rank: ++rank, recommendation: `Urgent exploitation safety plans for ${input.children_high_risk_exploitation} high-risk child(ren) — multi-agency strategy needed.`, urgency: "immediate", regulatory_ref: "Reg 34" });
  if (input.children_with_repeat_missing >= 2) recommendations.push({ rank: ++rank, recommendation: `Review missing episode response for ${input.children_with_repeat_missing} children with repeat patterns.`, urgency: "immediate", regulatory_ref: "Reg 34" });
  if (input.restraint_incidents >= 5) recommendations.push({ rank: ++rank, recommendation: "Review behaviour support plans — high restraint frequency indicates de-escalation strategies are failing.", urgency: "soon", regulatory_ref: "Reg 35" });
  if (input.safeguarding_referrals_open >= 3) recommendations.push({ rank: ++rank, recommendation: `Clear safeguarding referral backlog — ${input.safeguarding_referrals_open} remain unresolved.`, urgency: "soon", regulatory_ref: "Reg 12" });
  if (above(input.exploitation_screenings_due, 0) && below(expRate, 80)) recommendations.push({ rank: ++rank, recommendation: `Complete exploitation screenings — ${100 - expRate!}% gap in coverage.`, urgency: "soon", regulatory_ref: "Reg 34" });
  if (below(safeguarding_score, 65)) recommendations.push({ rank: ++rank, recommendation: "Develop comprehensive safeguarding improvement plan across all at-risk domains.", urgency: "planned", regulatory_ref: "Reg 13" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (safeguarding_rating === "outstanding") insights.push({ text: "Safeguarding oversight is outstanding — children are effectively protected across all domains.", severity: "positive" });
  if (safeguarding_rating === "inadequate") insights.push({ text: "Safeguarding oversight is inadequate — children may not be sufficiently protected. Urgent regulatory attention required.", severity: "critical" });
  if (input.children_high_risk_exploitation >= 1 && input.children_with_repeat_missing >= 1) insights.push({ text: "Exploitation risk and repeat missing episodes co-occur — these may be linked; consider contextual safeguarding approach.", severity: "warning" });
  if (input.restraint_incidents >= 3 && input.incidents_serious >= 2) insights.push({ text: "High restraint use correlates with serious incidents — consider whether current approach is escalating rather than resolving behaviours.", severity: "warning" });
  if (input.disclosures_total > 0 && below(rate(input.disclosures_acted_on, input.disclosures_total), 70)) insights.push({ text: "Disclosure response is poor — children who disclose and aren't heard may stop communicating concerns.", severity: "critical" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (safeguarding_rating === "outstanding") headline = `Outstanding safeguarding oversight — ${domainsAtRisk.length === 0 ? "no domains at risk" : `${domainsAtRisk.length} domain(s) to monitor`}, children well-protected.`;
  else if (safeguarding_rating === "good") headline = `Good safeguarding oversight — ${domainsAtRisk.length > 0 ? `${domainsAtRisk.length} domain(s) need attention` : "solid protective practice"}.`;
  else if (safeguarding_rating === "adequate") headline = `Adequate safeguarding oversight — ${domainsAtRisk.length} domain(s) at risk, improvement needed to ensure consistent protection.`;
  else headline = `Safeguarding oversight inadequate — ${domainsAtRisk.length} domain(s) at risk, urgent whole-home safeguarding review required.`;

  return {
    safeguarding_rating, safeguarding_score, headline,
    domain_scores, strengths, concerns, recommendations, insights,
  };
}
