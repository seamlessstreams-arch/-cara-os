import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME REGULATORY COMPLIANCE COMPOSITE ENGINE
// Aggregates regulatory evidence across Reg 44/45/46 visits, policy reviews,
// data governance, quality assurance audits, notifiable events, and document control.
// Pure deterministic engine. CHR 2015 Reg 44–46 / Schedule 7.
// ══════════════════════════════════════════════════════════════════════════════

export interface RegulatoryComplianceInput {
  today: string;

  // Reg 44 visits
  reg44_visits_due: number;
  reg44_visits_completed: number;
  reg44_actions_total: number;
  reg44_actions_resolved: number;

  // Reg 45 evidence
  reg45_domains_total: number;
  reg45_domains_with_evidence: number;

  // Reg 46 reviews
  reg46_reviews_due: number;
  reg46_reviews_completed: number;

  // Policy compliance
  policies_total: number;
  policies_current: number;
  policies_overdue_review: number;

  // Data governance
  data_breaches: number;
  data_breaches_resolved: number;
  subject_access_requests_total: number;
  subject_access_requests_completed_on_time: number;
  dpia_completed: boolean;

  // Quality assurance
  qa_audits_completed: number;
  qa_audits_due: number;
  qa_actions_total: number;
  qa_actions_resolved: number;

  // Notifiable events
  notifiable_events_total: number;
  notifiable_events_timely: number;

  // Document governance
  documents_total: number;
  documents_version_controlled: number;
  read_receipts_required: number;
  read_receipts_obtained: number;

  // Inspection readiness
  inspection_history_count: number;
  last_inspection_rating: string | null;  // "outstanding"|"good"|"requires_improvement"|"inadequate"|null
}

export type RegulatoryComplianceRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface RegDomainScore {
  name: string;
  score: number;
  max: number;
  compliant: boolean;
}

export interface RegulatoryComplianceResult {
  compliance_rating: RegulatoryComplianceRating;
  /** null when the population is empty — nothing measured, not 0%. */
  compliance_score: number | null;
  headline: string;
  domain_scores: RegDomainScore[];
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

export function computeRegulatoryCompliance(input: RegulatoryComplianceInput): RegulatoryComplianceResult {
  const {
    reg44_visits_due, reg44_visits_completed, reg44_actions_total, reg44_actions_resolved,
    reg45_domains_total, reg45_domains_with_evidence,
    reg46_reviews_due, reg46_reviews_completed,
    policies_total, policies_current, policies_overdue_review,
    data_breaches, data_breaches_resolved, subject_access_requests_total,
    subject_access_requests_completed_on_time, dpia_completed,
    qa_audits_completed, qa_audits_due, qa_actions_total, qa_actions_resolved,
    notifiable_events_total, notifiable_events_timely,
    documents_total, documents_version_controlled, read_receipts_required, read_receipts_obtained, last_inspection_rating,
  } = input;

  // ── Domain: Reg 44 Compliance (0–20) ────────────────────────────────────
  let reg44Score = 0;
  const visitRate = rate(reg44_visits_completed, reg44_visits_due);
  if (reg44_visits_due === 0) {
    reg44Score += 5; // neutral — no visits due yet
  } else {
    if (meets(visitRate, 100)) reg44Score += 10;
    else if (meets(visitRate, 80)) reg44Score += 7;
    else if (meets(visitRate, 60)) reg44Score += 4;
    else reg44Score += 1;
  }
  const actionRate = rate(reg44_actions_resolved, reg44_actions_total);
  if (reg44_actions_total === 0) {
    reg44Score += 10; // no actions outstanding
  } else {
    if (meets(actionRate, 90)) reg44Score += 10;
    else if (meets(actionRate, 70)) reg44Score += 7;
    else if (meets(actionRate, 50)) reg44Score += 4;
    else reg44Score += 1;
  }
  reg44Score = Math.min(reg44Score, 20);
  const reg44Compliant = meets(visitRate, 80) || reg44_visits_due === 0;

  // ── Domain: Reg 45/46 Evidence (0–15) ───────────────────────────────────
  let reg4546Score = 0;
  const evRate = rate(reg45_domains_with_evidence, reg45_domains_total);
  if (reg45_domains_total === 0) {
    reg4546Score += 5;
  } else {
    if (meets(evRate, 95)) reg4546Score += 8;
    else if (meets(evRate, 80)) reg4546Score += 5;
    else if (meets(evRate, 60)) reg4546Score += 3;
    else reg4546Score += 1;
  }
  const revRate = rate(reg46_reviews_completed, reg46_reviews_due);
  if (reg46_reviews_due === 0) {
    reg4546Score += 4;
  } else {
    if (meets(revRate, 100)) reg4546Score += 7;
    else if (meets(revRate, 80)) reg4546Score += 5;
    else if (meets(revRate, 60)) reg4546Score += 3;
    else reg4546Score += 1;
  }
  reg4546Score = Math.min(reg4546Score, 15);
  const reg4546Compliant = (meets(evRate, 80) || reg45_domains_total === 0) && (meets(revRate, 80) || reg46_reviews_due === 0);

  // ── Domain: Policy Compliance (0–15) ────────────────────────────────────
  let polScore = 0;
  const polRate = rate(policies_current, policies_total);
  if (policies_total === 0) {
    polScore += 8;
  } else {
    if (meets(polRate, 95)) polScore += 10;
    else if (meets(polRate, 85)) polScore += 7;
    else if (meets(polRate, 70)) polScore += 4;
    else polScore += 1;
  }
  if (policies_overdue_review === 0) polScore += 5;
  else if (policies_overdue_review <= 2) polScore += 3;
  else if (policies_overdue_review <= 5) polScore += 1;
  else polScore += 0;
  polScore = Math.min(polScore, 15);
  const polCompliant = meets(polRate, 85) || policies_total === 0;

  // ── Domain: Data Governance (0–15) ──────────────────────────────────────
  let dgScore = 0;
  if (data_breaches === 0) {
    dgScore += 6;
  } else {
    const brResolveRate = rate(data_breaches_resolved, data_breaches);
    if (meets(brResolveRate, 100)) dgScore += 3;
    else if (meets(brResolveRate, 80)) dgScore += 2;
    else dgScore += 0;
  }
  const sarRate = rate(subject_access_requests_completed_on_time, subject_access_requests_total);
  if (subject_access_requests_total === 0) {
    dgScore += 4;
  } else {
    if (meets(sarRate, 100)) dgScore += 5;
    else if (meets(sarRate, 80)) dgScore += 3;
    else dgScore += 1;
  }
  if (dpia_completed) dgScore += 4;
  dgScore = Math.min(dgScore, 15);
  const dgCompliant = data_breaches <= 1 && dpia_completed;

  // ── Domain: Quality Assurance (0–15) ────────────────────────────────────
  let qaScore = 0;
  const qaRate = rate(qa_audits_completed, qa_audits_due);
  if (qa_audits_due === 0) {
    qaScore += 5;
  } else {
    if (meets(qaRate, 95)) qaScore += 8;
    else if (meets(qaRate, 80)) qaScore += 6;
    else if (meets(qaRate, 60)) qaScore += 3;
    else qaScore += 1;
  }
  const qaActionRate = rate(qa_actions_resolved, qa_actions_total);
  if (qa_actions_total === 0) {
    qaScore += 7;
  } else {
    if (meets(qaActionRate, 90)) qaScore += 7;
    else if (meets(qaActionRate, 70)) qaScore += 5;
    else if (meets(qaActionRate, 50)) qaScore += 3;
    else qaScore += 1;
  }
  qaScore = Math.min(qaScore, 15);
  const qaCompliant = (meets(qaRate, 80) || qa_audits_due === 0) && (meets(qaActionRate, 70) || qa_actions_total === 0);

  // ── Domain: Notifiable Events (0–10) ────────────────────────────────────
  let neScore = 0;
  const neRate = rate(notifiable_events_timely, notifiable_events_total);
  if (notifiable_events_total === 0) {
    neScore += 10;
  } else {
    if (meets(neRate, 100)) neScore += 10;
    else if (meets(neRate, 80)) neScore += 7;
    else if (meets(neRate, 60)) neScore += 4;
    else neScore += 1;
  }
  neScore = Math.min(neScore, 10);
  const neCompliant = meets(neRate, 80) || notifiable_events_total === 0;

  // ── Domain: Document Governance (0–10) ──────────────────────────────────
  let docScore = 0;
  const vcRate = rate(documents_version_controlled, documents_total);
  if (documents_total === 0) {
    docScore += 5;
  } else {
    if (meets(vcRate, 95)) docScore += 5;
    else if (meets(vcRate, 80)) docScore += 3;
    else docScore += 1;
  }
  const rrRate = rate(read_receipts_obtained, read_receipts_required);
  if (read_receipts_required === 0) {
    docScore += 5;
  } else {
    if (meets(rrRate, 90)) docScore += 5;
    else if (meets(rrRate, 70)) docScore += 3;
    else docScore += 1;
  }
  docScore = Math.min(docScore, 10);
  const docCompliant = (meets(vcRate, 80) || documents_total === 0);

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalScore = reg44Score + reg4546Score + polScore + dgScore + qaScore + neScore + docScore;
  const maxScore = 20 + 15 + 15 + 15 + 15 + 10 + 10; // = 100
  const compliance_score = rate(totalScore, maxScore);
  const compliance_rating: RegulatoryComplianceRating =
    meets(compliance_score, 80) ? "outstanding" :
    meets(compliance_score, 65) ? "good" :
    meets(compliance_score, 45) ? "adequate" : "inadequate";

  // ── Domain scores ───────────────────────────────────────────────────────
  const domain_scores: RegDomainScore[] = [
    { name: "reg44_visits", score: reg44Score, max: 20, compliant: reg44Compliant },
    { name: "reg45_46_evidence", score: reg4546Score, max: 15, compliant: reg4546Compliant },
    { name: "policy_compliance", score: polScore, max: 15, compliant: polCompliant },
    { name: "data_governance", score: dgScore, max: 15, compliant: dgCompliant },
    { name: "quality_assurance", score: qaScore, max: 15, compliant: qaCompliant },
    { name: "notifiable_events", score: neScore, max: 10, compliant: neCompliant },
    { name: "document_governance", score: docScore, max: 10, compliant: docCompliant },
  ];

  const compliantDomains = domain_scores.filter(d => d.compliant);
  const nonCompliant = domain_scores.filter(d => !d.compliant);

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (compliantDomains.length === 7) strengths.push("Full regulatory compliance across all 7 domains — exemplary governance.");
  else if (compliantDomains.length >= 5) strengths.push(`${compliantDomains.length} of 7 regulatory domains are compliant — strong governance framework.`);
  if (reg44_visits_due > 0 && visitRate === 100) strengths.push("100% Reg 44 visit completion — independent scrutiny is fully maintained.");
  if (policies_overdue_review === 0 && policies_total > 0) strengths.push("All policies current with no overdue reviews — proactive document management.");
  if (data_breaches === 0) strengths.push("Zero data breaches — information governance is robust.");
  if (notifiable_events_total > 0 && neRate === 100) strengths.push("All notifiable events reported on time — regulatory transparency maintained.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (nonCompliant.length >= 4) concerns.push(`${nonCompliant.length} of 7 regulatory domains non-compliant — systemic governance failure.`);
  else if (nonCompliant.length >= 2) concerns.push(`${nonCompliant.length} regulatory domains non-compliant — targeted improvement needed.`);
  if (reg44_visits_due > 0 && below(visitRate, 80)) concerns.push(`Reg 44 visit compliance at ${visitRate}% — independent monitoring gaps.`);
  if (policies_overdue_review >= 5) concerns.push(`${policies_overdue_review} policies overdue for review — outdated policies create safeguarding risk.`);
  if (data_breaches >= 3) concerns.push(`${data_breaches} data breaches — serious information governance failures.`);
  if (reg44_actions_total > 0 && below(actionRate, 50)) concerns.push(`Only ${actionRate}% of Reg 44 actions resolved — audit trail shows poor follow-through.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (reg44_visits_due > 0 && below(visitRate, 80)) recommendations.push({ rank: ++rank, recommendation: "Restore Reg 44 visit schedule — missed visits weaken independent oversight.", urgency: "immediate", regulatory_ref: "Reg 44" });
  if (data_breaches >= 2) recommendations.push({ rank: ++rank, recommendation: `Address ${data_breaches} data breaches and strengthen information governance.`, urgency: "immediate", regulatory_ref: "Data Protection Act 2018" });
  if (policies_overdue_review >= 3) recommendations.push({ rank: ++rank, recommendation: `Bring ${policies_overdue_review} overdue policies back into review cycle.`, urgency: "soon", regulatory_ref: "Reg 46" });
  if (qa_audits_due > 0 && below(qaRate, 80)) recommendations.push({ rank: ++rank, recommendation: "Increase QA audit completion rate to ensure systematic quality oversight.", urgency: "soon", regulatory_ref: "Reg 45" });
  if (!dpia_completed) recommendations.push({ rank: ++rank, recommendation: "Complete Data Protection Impact Assessment — statutory requirement.", urgency: "soon", regulatory_ref: "GDPR Art 35" });
  if (below(compliance_score, 65)) recommendations.push({ rank: ++rank, recommendation: "Develop regulatory compliance improvement plan covering all non-compliant domains.", urgency: "planned", regulatory_ref: "Schedule 7" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (compliance_rating === "outstanding") insights.push({ text: "Regulatory compliance is outstanding — the home maintains exemplary governance across all domains.", severity: "positive" });
  if (compliance_rating === "inadequate") insights.push({ text: "Regulatory compliance is inadequate — multiple governance failures create significant inspection risk.", severity: "critical" });
  if (last_inspection_rating === "outstanding" && below(compliance_score, 65)) insights.push({ text: "Compliance has deteriorated since the last outstanding inspection — risk of downgrade at next visit.", severity: "warning" });
  if (last_inspection_rating === "requires_improvement" && meets(compliance_score, 80)) insights.push({ text: "Compliance has improved significantly since last inspection — strong trajectory towards upgraded rating.", severity: "positive" });
  if (data_breaches >= 1 && !dpia_completed) insights.push({ text: "Data breaches occurring without DPIA in place — this is a serious regulatory vulnerability.", severity: "critical" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (compliance_rating === "outstanding") headline = `Outstanding regulatory compliance — ${compliantDomains.length}/7 domains compliant, strong governance.`;
  else if (compliance_rating === "good") headline = `Good regulatory compliance — ${nonCompliant.length > 0 ? `${nonCompliant.length} domain(s) to address` : "consistent compliance"}.`;
  else if (compliance_rating === "adequate") headline = `Adequate regulatory compliance — ${nonCompliant.length} domain(s) non-compliant, improvement plan needed.`;
  else headline = `Regulatory compliance inadequate — ${nonCompliant.length} domain(s) non-compliant, urgent governance overhaul required.`;

  return {
    compliance_rating, compliance_score, headline,
    domain_scores, strengths, concerns, recommendations, insights,
  };
}
