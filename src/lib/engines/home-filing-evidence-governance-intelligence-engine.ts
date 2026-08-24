// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FILING EVIDENCE GOVERNANCE INTELLIGENCE ENGINE
// Home-level: aggregates filing cabinet items and care events to assess the
// quality and governance of evidence filing — critical for Ofsted inspection
// readiness. Ensures every significant event has properly filed, verified,
// and categorised evidence.
// CHR 2015 Reg 13 (Leadership & Management), Reg 36 (Records).
// SCCIF: "Well-Led", "Safety".
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FilingCabinetItemInput {
  id: string;
  care_event_id: string | null;
  home_id: string;
  child_id: string | null;
  category: string;
  sub_category: string | null;
  title: string;
  has_description: boolean;
  source_type: string;
  linked_record_id: string | null;
  linked_record_table: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  tags_count: number;
  filed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CareEventBasicInput {
  id: string;
  child_id: string;
  category: string;
  date: string;
  is_significant: boolean;
  has_filing: boolean;
}

export interface FilingEvidenceGovernanceInput {
  today: string;
  total_children: number;
  filing_items: FilingCabinetItemInput[];
  care_events: CareEventBasicInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FilingEvidenceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FilingEvidenceGovernanceResult {
  filing_rating: FilingEvidenceRating;
  filing_score: number;
  headline: string;
  total_filing_items: number;
  /** null when the population is empty — nothing measured, not 0%. */
  verified_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  description_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  linked_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  tagged_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  significant_event_filing_rate: number | null;
  category_diversity: number;
  verification_timeliness_hours: number;
  /** null when the population is empty — nothing measured, not 0%. */
  child_coverage_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FilingEvidenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFilingEvidenceGovernance(
  input: FilingEvidenceGovernanceInput,
): FilingEvidenceGovernanceResult {
  const { total_children, filing_items, care_events } = input;

  // ── Special case: no filing items AND no care events AND no children ────
  if (filing_items.length === 0 && care_events.length === 0 && total_children === 0) {
    return {
      filing_rating: "insufficient_data",
      filing_score: 0,
      headline: "No filing records or care events — insufficient data to assess evidence governance.",
      total_filing_items: 0,
      verified_rate: null,
      description_rate: null,
      linked_rate: null,
      tagged_rate: null,
      significant_event_filing_rate: null,
      category_diversity: 0,
      verification_timeliness_hours: 0,
      child_coverage_rate: null,
      strengths: [],
      concerns: ["No filing records or care events available for analysis."],
      recommendations: [{ rank: 1, recommendation: "Begin recording care events and filing evidence once children are placed.", urgency: "planned", regulatory_ref: "Reg 36" }],
      insights: [{ text: "No data available — the home has no children placed and no filing records. Evidence governance cannot be assessed until the home is operational.", severity: "warning" }],
    };
  }

  // ── Special case: no filing items AND no care events but children exist ──
  if (filing_items.length === 0 && care_events.length === 0 && total_children > 0) {
    return {
      filing_rating: "inadequate",
      filing_score: 20,
      headline: "No filing system in place — children are placed but no evidence is being filed or recorded.",
      total_filing_items: 0,
      verified_rate: null,
      description_rate: null,
      linked_rate: null,
      tagged_rate: null,
      significant_event_filing_rate: null,
      category_diversity: 0,
      verification_timeliness_hours: 0,
      child_coverage_rate: null,
      strengths: [],
      concerns: [
        "No filing cabinet records exist despite children being in placement — Ofsted expects a comprehensive evidence trail.",
        "No care events recorded — there is no audit trail of the care being delivered.",
      ],
      recommendations: [
        { rank: 1, recommendation: "Establish a filing system immediately — every significant event, health appointment, and safeguarding concern must have filed evidence.", urgency: "immediate", regulatory_ref: "Reg 36" },
        { rank: 2, recommendation: "Implement care event recording so that daily care, incidents, and significant events are captured and linked to filed evidence.", urgency: "immediate", regulatory_ref: "Reg 36" },
      ],
      insights: [{ text: "Children are placed in the home but there is no evidence filing system and no care events have been recorded. This represents a fundamental governance failure — Ofsted will expect to see a comprehensive evidence trail for every child.", severity: "critical" }],
    };
  }

  // ── Special case: no filing items but care events exist ──────────────────
  if (filing_items.length === 0 && care_events.length > 0) {
    return {
      filing_rating: "inadequate",
      filing_score: 15,
      headline: "Care events recorded but no evidence filed — significant events lack supporting documentation.",
      total_filing_items: 0,
      verified_rate: null,
      description_rate: null,
      linked_rate: null,
      tagged_rate: null,
      significant_event_filing_rate: null,
      category_diversity: 0,
      verification_timeliness_hours: 0,
      child_coverage_rate: null,
      strengths: [
        `${care_events.length} care event${care_events.length !== 1 ? "s" : ""} recorded — the home is capturing events but not filing supporting evidence.`,
      ],
      concerns: [
        "No filed evidence exists for any care events — Ofsted expects every significant event to have supporting documentation.",
        `${care_events.filter(e => e.is_significant).length} significant event${care_events.filter(e => e.is_significant).length !== 1 ? "s" : ""} have no filed evidence.`,
      ],
      recommendations: [
        { rank: 1, recommendation: "File supporting evidence for all existing care events, prioritising significant events such as physical interventions, safeguarding concerns, and health incidents.", urgency: "immediate", regulatory_ref: "Reg 36" },
        { rank: 2, recommendation: "Implement a workflow that automatically prompts staff to upload evidence when recording care events.", urgency: "soon", regulatory_ref: "Reg 36" },
      ],
      insights: [{ text: `The home has recorded ${care_events.length} care events but has not filed any supporting evidence. Without filed evidence, the home cannot demonstrate to Ofsted that events were properly documented, verified, and followed up.`, severity: "critical" }],
    };
  }

  // ── Core metrics ────────────────────────────────────────────────────────
  const totalItems = filing_items.length;
  const verifiedCount = filing_items.filter(f => f.is_verified).length;
  const descriptionCount = filing_items.filter(f => f.has_description).length;
  const linkedCount = filing_items.filter(f => f.care_event_id !== null || f.linked_record_id !== null).length;
  const taggedCount = filing_items.filter(f => f.tags_count >= 1).length;

  const verifiedRate = rate(verifiedCount, totalItems);
  const descriptionRate = rate(descriptionCount, totalItems);
  const linkedRate = rate(linkedCount, totalItems);
  const taggedRate = rate(taggedCount, totalItems);

  // Significant event filing rate
  const significantEvents = care_events.filter(e => e.is_significant);
  const significantWithFiling = significantEvents.filter(e => e.has_filing);
  const significantEventFilingRate = rate(significantWithFiling.length, significantEvents.length);

  // Category diversity
  const categories = new Set(filing_items.map(f => f.category));
  const categoryDiversity = categories.size;

  // Verification timeliness (average hours from filed_at to verified_at for verified items)
  const verifiedItems = filing_items.filter(f => f.is_verified && f.verified_at !== null);
  let verificationTimelinessHours = 0;
  if (verifiedItems.length > 0) {
    const totalHours = verifiedItems.reduce((sum, f) => {
      const filedDate = new Date(f.filed_at);
      const verifiedDate = new Date(f.verified_at!);
      const diffMs = verifiedDate.getTime() - filedDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);
    verificationTimelinessHours = Math.round((totalHours / verifiedItems.length) * 10) / 10;
  }

  // Child coverage rate
  const childrenWithFiling = new Set(filing_items.filter(f => f.child_id !== null).map(f => f.child_id!));
  const childCoverageRate = rate(childrenWithFiling.size, total_children);

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 52;

  // Bonus: verified_rate >= 90% -> +5, >= 75% -> +3
  if (meets(verifiedRate, 90)) score += 5;
  else if (meets(verifiedRate, 75)) score += 3;

  // Bonus: description_rate >= 95% -> +4, >= 80% -> +2
  if (meets(descriptionRate, 95)) score += 4;
  else if (meets(descriptionRate, 80)) score += 2;

  // Bonus: linked_rate >= 90% -> +4, >= 70% -> +2
  if (meets(linkedRate, 90)) score += 4;
  else if (meets(linkedRate, 70)) score += 2;

  // Bonus: significant_event_filing_rate >= 100% -> +6, >= 80% -> +3
  if (meets(significantEventFilingRate, 100)) score += 6;
  else if (meets(significantEventFilingRate, 80)) score += 3;

  // Bonus: tagged_rate >= 80% -> +3, >= 60% -> +1
  if (meets(taggedRate, 80)) score += 3;
  else if (meets(taggedRate, 60)) score += 1;

  // Bonus: category_diversity >= 5 -> +3, >= 3 -> +1
  if (categoryDiversity >= 5) score += 3;
  else if (categoryDiversity >= 3) score += 1;

  // Bonus: child_coverage_rate >= 100% -> +3, >= 80% -> +1
  if (meets(childCoverageRate, 100)) score += 3;
  else if (meets(childCoverageRate, 80)) score += 1;

  // Penalty: significant_event_filing_rate < 50% -> -8
  if (significantEvents.length > 0 && below(significantEventFilingRate, 50)) score -= 8;

  // Penalty: verified_rate < 40% -> -5
  if (below(verifiedRate, 40)) score -= 5;

  // Penalty: description_rate < 50% -> -3
  if (below(descriptionRate, 50)) score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(verifiedRate, 90)) strengths.push(`${formatRate(verifiedRate)} of filed evidence is verified — robust verification governance.`);
  else if (meets(verifiedRate, 75)) strengths.push(`${formatRate(verifiedRate)} verification rate — most evidence is being verified.`);
  if (meets(descriptionRate, 95)) strengths.push(`${formatRate(descriptionRate)} of filing items have descriptions — thorough documentation.`);
  else if (meets(descriptionRate, 80)) strengths.push(`${formatRate(descriptionRate)} description rate — good documentation practice.`);
  if (meets(linkedRate, 90)) strengths.push(`${formatRate(linkedRate)} of items linked to care events or records — strong traceability.`);
  else if (meets(linkedRate, 70)) strengths.push(`${formatRate(linkedRate)} linked rate — most evidence is connected to source events.`);
  if (meets(significantEventFilingRate, 100) && significantEvents.length > 0) strengths.push("100% of significant events have filed evidence — complete coverage of critical incidents.");
  else if (meets(significantEventFilingRate, 80) && significantEvents.length > 0) strengths.push(`${formatRate(significantEventFilingRate)} of significant events have filed evidence — good coverage.`);
  if (meets(taggedRate, 80)) strengths.push(`${formatRate(taggedRate)} of items are tagged — well-organised filing system.`);
  if (categoryDiversity >= 5) strengths.push(`Evidence filed across ${categoryDiversity} categories — comprehensive coverage of care areas.`);
  if (meets(childCoverageRate, 100) && total_children > 0) strengths.push("Every child has at least one filed evidence item — complete child coverage.");
  else if (meets(childCoverageRate, 80) && total_children > 0) strengths.push(`${formatRate(childCoverageRate)} of children have filed evidence — good coverage.`);
  if (verificationTimelinessHours > 0 && verificationTimelinessHours <= 24) strengths.push(`Average verification within ${verificationTimelinessHours} hours of filing — prompt verification process.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (below(verifiedRate, 40)) concerns.push(`Only ${formatRate(verifiedRate)} of filed evidence is verified — most items lack verification, creating governance risk.`);
  else if (below(verifiedRate, 75)) concerns.push(`${formatRate(verifiedRate)} verification rate — a significant portion of filed evidence remains unverified.`);
  if (below(descriptionRate, 50)) concerns.push(`Only ${formatRate(descriptionRate)} of items have descriptions — most filed evidence lacks context.`);
  else if (below(descriptionRate, 80)) concerns.push(`${formatRate(descriptionRate)} description rate — some filed evidence lacks adequate descriptions.`);
  if (significantEvents.length > 0 && below(significantEventFilingRate, 50)) concerns.push(`Only ${formatRate(significantEventFilingRate)} of significant events have filed evidence — critical gaps in the evidence trail.`);
  else if (significantEvents.length > 0 && below(significantEventFilingRate, 80)) concerns.push(`${formatRate(significantEventFilingRate)} of significant events have filed evidence — some critical events lack documentation.`);
  if (below(linkedRate, 50)) concerns.push(`Only ${formatRate(linkedRate)} of items are linked to care events or records — poor traceability.`);
  if (below(taggedRate, 40)) concerns.push(`Only ${formatRate(taggedRate)} of items are tagged — filing organisation is poor.`);
  if (total_children > 0 && below(childCoverageRate, 50)) concerns.push(`Only ${formatRate(childCoverageRate)} of children have filed evidence — some children have no evidence trail.`);
  if (verificationTimelinessHours > 72) concerns.push(`Average verification takes ${verificationTimelinessHours} hours — evidence is not being verified promptly.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[] = [];
  let rank = 1;

  if (significantEvents.length > 0 && below(significantEventFilingRate, 50)) {
    recs.push({ rank: rank++, recommendation: "File evidence for all significant events immediately — physical interventions, safeguarding concerns, and health incidents must have supporting documentation.", urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (below(verifiedRate, 40)) {
    recs.push({ rank: rank++, recommendation: "Implement a verification workflow — all filed evidence should be reviewed and verified by a senior staff member within 24 hours.", urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (below(descriptionRate, 50)) {
    recs.push({ rank: rank++, recommendation: "Require descriptions on all filing items — evidence without context cannot demonstrate governance.", urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (significantEvents.length > 0 && meets(significantEventFilingRate, 50) && below(significantEventFilingRate, 80)) {
    recs.push({ rank: rank++, recommendation: "Close the gaps in significant event filing — ensure every physical intervention, safeguarding, and health event has filed evidence.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (meets(verifiedRate, 40) && below(verifiedRate, 75)) {
    recs.push({ rank: rank++, recommendation: "Increase verification rate by assigning verification responsibilities and setting turnaround targets.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (below(linkedRate, 70)) {
    recs.push({ rank: rank++, recommendation: "Link filed evidence to care events and records to improve traceability and audit readiness.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (below(taggedRate, 60)) {
    recs.push({ rank: rank++, recommendation: "Tag all filing items to improve searchability and organisation of the evidence library.", urgency: "planned", regulatory_ref: "Reg 36" });
  }
  if (total_children > 0 && below(childCoverageRate, 80)) {
    recs.push({ rank: rank++, recommendation: "Ensure every child has at least one filing item — children without any filed evidence will be flagged at inspection.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (categoryDiversity < 3) {
    recs.push({ rank: rank++, recommendation: "Broaden the categories of filed evidence to cover health, education, safeguarding, behaviour, and family contact.", urgency: "planned", regulatory_ref: "Reg 36" });
  }
  if (verificationTimelinessHours > 72) {
    recs.push({ rank: rank++, recommendation: "Reduce verification turnaround time — aim for verification within 24 hours of filing.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (meets(descriptionRate, 50) && below(descriptionRate, 80)) {
    recs.push({ rank: rank++, recommendation: "Improve description coverage — make descriptions mandatory when filing evidence to provide context for inspectors.", urgency: "planned", regulatory_ref: "Reg 36" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: "critical" | "warning" | "positive" }[] = [];

  if (rating === "outstanding") {
    insights.push({ text: `Evidence filing governance is exemplary — ${formatRate(verifiedRate)} verified, ${formatRate(significantEventFilingRate)} significant event coverage, and ${categoryDiversity} categories. Ofsted will see a well-organised, inspection-ready evidence system.`, severity: "positive" });
  }
  if (significantEvents.length > 0 && below(significantEventFilingRate, 50)) {
    insights.push({ text: `Only ${formatRate(significantEventFilingRate)} of significant events have filed evidence. Ofsted expects 100% coverage of physical interventions, safeguarding, and health incidents — this is a critical gap that will be identified at inspection.`, severity: "critical" });
  }
  if (below(verifiedRate, 40)) {
    insights.push({ text: `Only ${formatRate(verifiedRate)} of filed evidence is verified. Unverified evidence cannot be relied upon to demonstrate governance — Ofsted will question whether filed records have been quality-checked.`, severity: "critical" });
  }
  if (below(descriptionRate, 50)) {
    insights.push({ text: `Only ${formatRate(descriptionRate)} of items have descriptions. Evidence filed without descriptions lacks context and cannot effectively support the care record — inspectors will not be able to understand what the evidence demonstrates.`, severity: "critical" });
  }
  if (total_children > 0 && below(childCoverageRate, 50)) {
    insights.push({ text: `Only ${formatRate(childCoverageRate)} of children have any filed evidence. Some children have no evidence trail at all — Ofsted will check evidence for each child during inspection.`, severity: "critical" });
  }
  if (meets(verifiedRate, 75) && below(verifiedRate, 90)) {
    insights.push({ text: `${formatRate(verifiedRate)} verification rate shows a functioning verification process. Extending verification to all items would strengthen the evidence trail and demonstrate rigorous governance.`, severity: "positive" });
  }
  if (significantEvents.length > 0 && meets(significantEventFilingRate, 80) && below(significantEventFilingRate, 100)) {
    insights.push({ text: `${formatRate(significantEventFilingRate)} of significant events have filed evidence — close to full coverage. Closing the remaining gaps will ensure the home can evidence every critical incident at inspection.`, severity: "warning" });
  }
  if (meets(linkedRate, 70) && below(linkedRate, 90)) {
    insights.push({ text: `${formatRate(linkedRate)} of items are linked to source records — good traceability. Linking the remaining items will create a complete audit trail from event to evidence.`, severity: "positive" });
  }
  if (verificationTimelinessHours > 0 && verificationTimelinessHours <= 24 && meets(verifiedRate, 75)) {
    insights.push({ text: `Evidence is verified within an average of ${verificationTimelinessHours} hours — demonstrating a responsive and efficient governance process.`, severity: "positive" });
  }
  if (verificationTimelinessHours > 72) {
    insights.push({ text: `Average verification takes ${verificationTimelinessHours} hours. Slow verification reduces the value of the evidence trail and may indicate insufficient management oversight.`, severity: "warning" });
  }
  if (categoryDiversity >= 5 && meets(linkedRate, 70) && meets(verifiedRate, 75)) {
    insights.push({ text: `The filing system covers ${categoryDiversity} categories with ${formatRate(linkedRate)} linkage and ${formatRate(verifiedRate)} verification — a well-structured evidence base that supports inspection readiness.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding evidence governance — ${formatRate(verifiedRate)} verified, ${formatRate(significantEventFilingRate)} significant event coverage, ${totalItems} items across ${categoryDiversity} categories.`;
  } else if (rating === "good") {
    headline = `Good evidence filing governance — ${totalItems} items filed with ${formatRate(verifiedRate)} verification and ${formatRate(significantEventFilingRate)} significant event coverage.`;
  } else if (rating === "adequate") {
    headline = `Adequate evidence filing — gaps in verification (${formatRate(verifiedRate)}) or significant event coverage (${formatRate(significantEventFilingRate)}) need attention.`;
  } else {
    headline = `Inadequate evidence governance — ${formatRate(verifiedRate)} verification rate and ${formatRate(significantEventFilingRate)} significant event filing rate indicate systemic gaps.`;
  }

  return {
    filing_rating: rating,
    filing_score: score,
    headline,
    total_filing_items: totalItems,
    verified_rate: verifiedRate,
    description_rate: descriptionRate,
    linked_rate: linkedRate,
    tagged_rate: taggedRate,
    significant_event_filing_rate: significantEventFilingRate,
    category_diversity: categoryDiversity,
    verification_timeliness_hours: verificationTimelinessHours,
    child_coverage_rate: childCoverageRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
