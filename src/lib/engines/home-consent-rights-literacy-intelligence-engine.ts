// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CONSENT & RIGHTS LITERACY INTELLIGENCE ENGINE
// Tracks consent management, children's rights knowledge, parental responsibility
// documentation, and rights exercise to ensure children are empowered and protected.
// Pure deterministic engine. CHR 2015 Reg 5/7.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ConsentRecordInput {
  id: string;
  child_id: string;
  category: string;          // "medical" | "education" | "activity" | "photo" | "social_media" | "contact" | "other"
  status: string;            // "granted" | "refused" | "pending" | "expired" | "withdrawn"
  date_decided: string;
  expiry_date: string;
  review_date: string;
}

export interface RightsLiteracyInput {
  id: string;
  child_id: string;
  recorded_date: string;
  knows_how_to_complain: boolean;
  knows_advocate: boolean;
  knows_ofsted_contact: boolean;
  knows_right_to_records: boolean;
  knows_right_to_refuse_contact: boolean;
  rights_used_count: number;
}

export interface ParentalResponsibilityInput {
  id: string;
  child_id: string;
  pr_documented: boolean;
  delegated_authorities_clear: boolean;
  reviewed_recently: boolean;
  signed_off_by_la: boolean;
}

export interface ConsentRightsInput {
  today: string;
  total_children: number;
  consent_records: ConsentRecordInput[];
  rights_literacy: RightsLiteracyInput[];
  parental_responsibility: ParentalResponsibilityInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ConsentRightsRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface ConsentRightsResult {
  consent_rights_rating: ConsentRightsRating;
  consent_rights_score: number;
  headline: string;
  active_consents: number;
  expired_consents: number;
  children_rights_assessed: number;
  rights_knowledge_rate: number;
  pr_documentation_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeConsentRightsIntelligence(
  input: ConsentRightsInput,
): ConsentRightsResult {
  const { total_children, consent_records, rights_literacy, parental_responsibility } = input;

  // ── Insufficient data ─────────────────────────────────────────────────
  if (total_children === 0) {
    return {
      consent_rights_rating: "insufficient_data",
      consent_rights_score: 0,
      headline: "No children — insufficient data for consent & rights analysis.",
      active_consents: 0,
      expired_consents: 0,
      children_rights_assessed: 0,
      rights_knowledge_rate: 0,
      pr_documentation_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ───────────────────────────────────────────────────────────

  const activeConsents = consent_records.filter(
    (c) => c.status === "granted" || c.status === "refused",
  ).length;
  const expiredConsents = consent_records.filter((c) => c.status === "expired").length;
  const pendingConsents = consent_records.filter((c) => c.status === "pending").length;
  const totalConsents = consent_records.length;

  // Children with at least 1 non-expired consent
  const childrenWithConsent = new Set(
    consent_records
      .filter((c) => c.status !== "expired")
      .map((c) => c.child_id),
  ).size;
  const coverageRate = pct(childrenWithConsent, total_children);

  // Expired + pending rate
  const expiredRate = pct(expiredConsents + pendingConsents, totalConsents);

  // Rights literacy
  const childrenRightsAssessed = rights_literacy.length;

  // Count literate children (knows >= 4 out of 5)
  const literateChildren = rights_literacy.filter((r) => {
    const knowsCount = [
      r.knows_how_to_complain,
      r.knows_advocate,
      r.knows_ofsted_contact,
      r.knows_right_to_records,
      r.knows_right_to_refuse_contact,
    ].filter(Boolean).length;
    return knowsCount >= 4;
  }).length;
  const rightsRate = pct(literateChildren, total_children);

  // Rights exercise
  const childrenExercised = rights_literacy.filter((r) => r.rights_used_count > 0).length;
  const exerciseRate = rights_literacy.length > 0
    ? pct(childrenExercised, rights_literacy.length)
    : 0;

  // Parental responsibility
  const prDocumented = parental_responsibility.filter(
    (p) => p.pr_documented && p.delegated_authorities_clear,
  ).length;
  const prRate = pct(prDocumented, total_children);

  // PR review & LA sign-off
  const prReviewed = parental_responsibility.filter(
    (p) => p.reviewed_recently && p.signed_off_by_la,
  ).length;
  const reviewedRate = parental_responsibility.length > 0
    ? pct(prReviewed, parental_responsibility.length)
    : 0;

  const rightsKnowledgeRate = rightsRate;
  const prDocumentationRate = prRate;

  // ── Score ─────────────────────────────────────────────────────────────

  let score = 52;

  // Mod 1: Consent coverage (±6)
  if (coverageRate >= 90) score += 6;
  else if (coverageRate >= 75) score += 3;
  else if (coverageRate >= 50) score += 0;
  else score -= 6;

  // Mod 2: Expired/pending consent management (±5)
  if (expiredRate <= 5) score += 5;
  else if (expiredRate <= 15) score += 2;
  else if (expiredRate <= 30) score += 0;
  else score -= 5;

  // Mod 3: Rights knowledge (±6)
  if (rightsRate >= 90) score += 6;
  else if (rightsRate >= 70) score += 3;
  else if (rightsRate >= 50) score += 0;
  else score -= 6;

  // Mod 4: Rights exercise (±4)
  if (rights_literacy.length === 0) {
    score += 0;
  } else if (exerciseRate >= 50) {
    score += 4;
  } else if (exerciseRate >= 25) {
    score += 2;
  } else if (exerciseRate >= 10) {
    score += 0;
  } else {
    score -= 4;
  }

  // Mod 5: PR documentation (±5)
  if (prRate >= 95) score += 5;
  else if (prRate >= 80) score += 3;
  else if (prRate >= 60) score += 0;
  else score -= 5;

  // Mod 6: PR review & LA sign-off (±4)
  if (parental_responsibility.length === 0) {
    score += 0;
  } else if (reviewedRate >= 90) {
    score += 4;
  } else if (reviewedRate >= 70) {
    score += 2;
  } else if (reviewedRate >= 50) {
    score += 0;
  } else {
    score -= 4;
  }

  // Clamp
  score = Math.max(0, Math.min(score, 100));

  // ── Rating ────────────────────────────────────────────────────────────

  const consent_rights_rating: ConsentRightsRating =
    score >= 80 ? "outstanding" :
    score >= 65 ? "good" :
    score >= 45 ? "adequate" :
    "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (coverageRate >= 90 && totalConsents > 0) {
    strengths.push("Consent records in place for over 90% of children — decisions are properly documented.");
  }
  if (rightsRate >= 90 && rights_literacy.length > 0) {
    strengths.push("Over 90% of children understand their key rights — children are empowered.");
  }
  if (prRate >= 95) {
    strengths.push("Parental responsibility documentation is comprehensive — delegated authority is clear.");
  }
  if (expiredRate <= 5 && totalConsents > 0) {
    strengths.push("Less than 5% of consents expired — proactive consent management.");
  }
  if (exerciseRate >= 50 && rights_literacy.length > 0) {
    strengths.push("Children are actively exercising their rights — voice is lived, not theoretical.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (expiredConsents > 3) {
    concerns.push(`${expiredConsents} expired consents need renewal — children may lack proper authorisation.`);
  }
  if (rightsRate < 50 && total_children > 0) {
    concerns.push("Under 50% of children know their key rights — rights literacy programme needed.");
  }
  if (prRate < 60) {
    concerns.push(`Parental responsibility documentation incomplete for ${100 - prRate}% of children.`);
  }
  if (coverageRate < 60) {
    concerns.push("Consent coverage below 60% — significant gaps in documented authority.");
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;

  if (rightsRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Implement structured rights literacy programme to ensure all children understand their rights to complain, access advocacy, contact Ofsted, and refuse contact.",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });
  }
  if (expiredConsents > 2) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Renew ${expiredConsents} expired consent records to ensure all children have current authorisation in place.`,
      urgency: "soon",
      regulatory_ref: "Reg 5",
    });
  }
  if (prRate < 80) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete parental responsibility documentation for all children, ensuring delegated authorities are clearly recorded and understood.",
      urgency: "immediate",
      regulatory_ref: "Reg 5",
    });
  }
  if (score < 65) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Develop consent and rights improvement plan covering consent renewal, rights literacy sessions, and parental responsibility reviews.",
      urgency: "planned",
      regulatory_ref: "Reg 5",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: { text: string; severity: string }[] = [];

  if (consent_rights_rating === "outstanding") {
    insights.push({
      text: "Consent management and rights literacy is outstanding — children's autonomy and legal protections are fully assured.",
      severity: "positive",
    });
  }
  if (consent_rights_rating === "inadequate") {
    insights.push({
      text: "Consent and rights literacy is inadequate — children may not understand their entitlements or have proper legal authorisation.",
      severity: "critical",
    });
  }
  if (exerciseRate >= 50 && rightsRate >= 80) {
    insights.push({
      text: "Children both know and use their rights — this reflects a genuinely rights-respecting culture.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;
  if (consent_rights_rating === "outstanding") {
    headline = "Outstanding consent & rights literacy — children are empowered and properly authorised.";
  } else if (consent_rights_rating === "good") {
    headline = `Good consent & rights management — ${concerns.length > 0 ? `${concerns.length} area(s) to address` : "consistent practice"}.`;
  } else if (consent_rights_rating === "adequate") {
    headline = `Adequate consent & rights — gaps in ${rightsRate < 70 ? "rights literacy" : "consent coverage"} need addressing.`;
  } else {
    headline = "Consent & rights inadequate — children's legal protections and awareness are significantly compromised.";
  }

  return {
    consent_rights_rating,
    consent_rights_score: score,
    headline,
    active_consents: activeConsents,
    expired_consents: expiredConsents,
    children_rights_assessed: childrenRightsAssessed,
    rights_knowledge_rate: rightsKnowledgeRate,
    pr_documentation_rate: prDocumentationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
