// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME VISITOR & ACCESS INTELLIGENCE ENGINE
// Home-level: analyses visitor records to assess DBS compliance, ID
// verification, sign-in/out completion, safeguarding oversight for
// tradespeople, inspector readiness, and multi-agency engagement.
// CHR 2015 Reg 12, 22. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface VisitorInput {
  id: string;
  date: string;
  category: string;          // professional | family | tradesperson | inspector | volunteer | other
  dbs_checked: boolean;
  id_verified: boolean;
  has_sign_in: boolean;
  has_sign_out: boolean;
  children_seen_count: number;
  has_notes: boolean;
  host_staff_id: string;
}

export interface HomeVisitorInput {
  today: string;
  total_children: number;
  visitors: VisitorInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type VisitorRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AccessComplianceProfile {
  total_visitors_90d: number;
  dbs_check_rate: number;
  id_verification_rate: number;
  sign_out_completion_rate: number;
  documentation_rate: number;
}

export interface CategoryBreakdown {
  professional: number;
  family: number;
  tradesperson: number;
  inspector: number;
  volunteer: number;
  other: number;
}

export interface SafeguardingProfile {
  tradesperson_dbs_rate: number;
  tradesperson_count: number;
  family_id_verification_rate: number;
  family_count: number;
  visitors_with_child_contact: number;
  child_contact_dbs_rate: number;
}

export interface EngagementProfile {
  avg_visitors_per_month: number;
  professional_visit_rate: number;
  inspector_visits: number;
  multi_agency_engagement: boolean;
}

export interface VisitorInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface VisitorRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeVisitorResult {
  visitor_rating: VisitorRating;
  visitor_score: number;
  headline: string;
  access_compliance: AccessComplianceProfile;
  category_breakdown: CategoryBreakdown;
  safeguarding_profile: SafeguardingProfile;
  engagement_profile: EngagementProfile;
  strengths: string[];
  concerns: string[];
  recommendations: VisitorRecommendation[];
  insights: VisitorInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): VisitorRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeVisitor(
  input: HomeVisitorInput,
): HomeVisitorResult {
  const { today, total_children, visitors } = input;

  // 90-day window
  const cutoff90 = new Date(today);
  cutoff90.setDate(cutoff90.getDate() - 90);
  const cutoff90Str = cutoff90.toISOString().slice(0, 10);
  const recent = visitors.filter(v => v.date >= cutoff90Str && v.date <= today);

  // Insufficient data: 0 visitors in 90d
  if (recent.length === 0) {
    return {
      visitor_rating: "insufficient_data",
      visitor_score: 0,
      headline: "No visitor records in the last 90 days.",
      access_compliance: emptyComplianceProfile(),
      category_breakdown: emptyCategoryBreakdown(),
      safeguarding_profile: emptySafeguardingProfile(),
      engagement_profile: emptyEngagementProfile(),
      strengths: [],
      concerns: ["No visitor records found in the last 90 days."],
      recommendations: [{ rank: 1, recommendation: "Ensure all visitors are logged in the visitor management system — Ofsted expects a comprehensive visitor record.", urgency: "soon", regulatory_ref: "Reg 22" }],
      insights: [{ text: "No visitor records exist for the past 90 days. This may indicate a recording gap rather than a lack of visitors. Ofsted expects a comprehensive record of all persons entering the home, with DBS and ID verification evidence.", severity: "critical" }],
    };
  }

  // ── Access Compliance Profile ──────────────────────────────────────
  const dbsChecked = recent.filter(v => v.dbs_checked).length;
  const dbsCheckRate = pct(dbsChecked, recent.length);

  const idVerified = recent.filter(v => v.id_verified).length;
  const idVerificationRate = pct(idVerified, recent.length);

  const signedOut = recent.filter(v => v.has_sign_out).length;
  const signOutRate = pct(signedOut, recent.length);

  const documented = recent.filter(v => v.has_notes).length;
  const docRate = pct(documented, recent.length);

  const complianceProfile: AccessComplianceProfile = {
    total_visitors_90d: recent.length,
    dbs_check_rate: dbsCheckRate,
    id_verification_rate: idVerificationRate,
    sign_out_completion_rate: signOutRate,
    documentation_rate: docRate,
  };

  // ── Category Breakdown ─────────────────────────────────────────────
  const professional = recent.filter(v => v.category === "professional").length;
  const family = recent.filter(v => v.category === "family").length;
  const tradesperson = recent.filter(v => v.category === "tradesperson").length;
  const inspector = recent.filter(v => v.category === "inspector").length;
  const volunteer = recent.filter(v => v.category === "volunteer").length;
  const other = recent.filter(v => !["professional", "family", "tradesperson", "inspector", "volunteer"].includes(v.category)).length;

  const categoryBreakdown: CategoryBreakdown = {
    professional, family, tradesperson, inspector, volunteer, other,
  };

  // ── Safeguarding Profile ───────────────────────────────────────────
  const tradespeople = recent.filter(v => v.category === "tradesperson");
  const tradespersonDbs = tradespeople.filter(v => v.dbs_checked).length;
  const tradespersonDbsRate = pct(tradespersonDbs, tradespeople.length);

  const familyVisitors = recent.filter(v => v.category === "family");
  const familyIdVerified = familyVisitors.filter(v => v.id_verified).length;
  const familyIdRate = pct(familyIdVerified, familyVisitors.length);

  const withChildContact = recent.filter(v => v.children_seen_count > 0);
  const childContactDbs = withChildContact.filter(v => v.dbs_checked).length;
  const childContactDbsRate = pct(childContactDbs, withChildContact.length);

  const safeguardingProfile: SafeguardingProfile = {
    tradesperson_dbs_rate: tradespersonDbsRate,
    tradesperson_count: tradespeople.length,
    family_id_verification_rate: familyIdRate,
    family_count: familyVisitors.length,
    visitors_with_child_contact: withChildContact.length,
    child_contact_dbs_rate: childContactDbsRate,
  };

  // ── Engagement Profile ─────────────────────────────────────────────
  const avgPerMonth = Math.round((recent.length / 3) * 10) / 10; // 90d = ~3 months
  const profRate = pct(professional, recent.length);
  const uniqueOrgs = new Set(recent.filter(v => v.category === "professional").map(v => v.host_staff_id));
  const multiAgency = uniqueOrgs.size >= 2 || professional >= 3;

  const engagementProfile: EngagementProfile = {
    avg_visitors_per_month: avgPerMonth,
    professional_visit_rate: profRate,
    inspector_visits: inspector,
    multi_agency_engagement: multiAgency,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base score 52, max bonuses = 30, 52+30=82 (outstanding reachable)
  let score = 52;

  // 1. DBS check rate (±5) — professionals & visitors with child contact must be checked
  if (dbsCheckRate >= 90) score += 5;
  else if (dbsCheckRate >= 70) score += 2;
  else score -= 4;

  // 2. ID verification rate (±4)
  if (idVerificationRate >= 90) score += 4;
  else if (idVerificationRate >= 70) score += 2;
  else score -= 3;

  // 3. Sign-out completion (±3)
  if (signOutRate >= 90) score += 3;
  else if (signOutRate >= 70) score += 1;
  else score -= 2;

  // 4. Documentation rate (±3)
  if (docRate >= 70) score += 3;
  else if (docRate >= 50) score += 1;
  else score -= 2;

  // 5. Tradesperson DBS/supervision (±4)
  if (tradespeople.length > 0) {
    if (tradespersonDbsRate >= 80) score += 4;
    else if (tradespersonDbsRate >= 50) score += 1;
    else score -= 3;
  } else {
    score += 2; // no tradespeople to worry about
  }

  // 6. Child contact DBS compliance (±4)
  if (withChildContact.length > 0) {
    if (childContactDbsRate >= 90) score += 4;
    else if (childContactDbsRate >= 70) score += 1;
    else score -= 4;
  } else {
    score += 2; // no child contact visitors
  }

  // 7. Multi-agency engagement (±3)
  if (multiAgency && professional >= 3) score += 3;
  else if (professional >= 1) score += 1;
  else score -= 2;

  // 8. Inspector readiness — having inspector visits is positive (±2)
  if (inspector > 0) score += 2;
  else score += 0; // neutral

  // 9. Family visit rate — children should receive family visits (±2)
  if (family >= 2) score += 2;
  else if (family >= 1) score += 1;
  else score -= 1;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (dbsCheckRate >= 90) strengths.push(`DBS checks completed for ${dbsCheckRate}% of visitors — robust safeguarding at the door.`);
  if (idVerificationRate >= 90) strengths.push(`ID verified for ${idVerificationRate}% of visitors — consistent identity verification practice.`);
  if (signOutRate >= 90) strengths.push(`${signOutRate}% sign-out completion — accurate record of who is on premises at all times.`);
  if (childContactDbsRate >= 90 && withChildContact.length > 0) strengths.push(`All visitors with child contact are DBS-checked — safeguarding perimeter is secure.`);
  if (inspector > 0) strengths.push(`${inspector} inspector visit${inspector > 1 ? "s" : ""} in 90 days — home demonstrates openness to scrutiny.`);
  if (multiAgency && professional >= 3) strengths.push(`Strong multi-agency engagement with ${professional} professional visits — children benefit from coordinated support.`);
  if (family >= 2) strengths.push(`${family} family visits recorded — children's family connections are actively supported.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (dbsCheckRate < 70) concerns.push(`DBS checks completed for only ${dbsCheckRate}% of visitors — unsupervised access without DBS is a safeguarding risk.`);
  if (idVerificationRate < 70) concerns.push(`ID verification at only ${idVerificationRate}% — all visitors must be positively identified.`);
  if (signOutRate < 70) concerns.push(`Only ${signOutRate}% of visitors signed out — incomplete records mean the home cannot confirm who was on premises.`);
  if (tradespersonDbsRate < 50 && tradespeople.length > 0) concerns.push(`Only ${tradespersonDbsRate}% of tradespeople had DBS checks — tradespeople must be checked or escorted.`);
  if (childContactDbsRate < 70 && withChildContact.length > 0) concerns.push(`Only ${childContactDbsRate}% of visitors with child contact had DBS checks — direct safeguarding concern.`);
  if (professional === 0) concerns.push("No professional visits in 90 days — children may lack multi-agency support.");
  if (family === 0 && total_children > 0) concerns.push("No family visits recorded — children's family relationships need active promotion.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: VisitorRecommendation[] = [];
  let rank = 1;

  if (childContactDbsRate < 70 && withChildContact.length > 0) {
    recs.push({ rank: rank++, recommendation: "Ensure all visitors with direct child contact have completed DBS checks before unsupervised access.", urgency: "immediate", regulatory_ref: "Reg 12" });
  }
  if (dbsCheckRate < 70) {
    recs.push({ rank: rank++, recommendation: "Improve DBS verification for all visitors — implement a check at point of entry.", urgency: "immediate", regulatory_ref: "Reg 22" });
  }
  if (signOutRate < 70) {
    recs.push({ rank: rank++, recommendation: "Ensure all visitors sign out on departure — complete records are a regulatory requirement.", urgency: "soon", regulatory_ref: "Reg 22" });
  }
  if (idVerificationRate < 70) {
    recs.push({ rank: rank++, recommendation: "Verify ID for all visitors at point of entry — do not admit unverified individuals.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (tradespersonDbsRate < 50 && tradespeople.length > 0) {
    recs.push({ rank: rank++, recommendation: "Require DBS for tradespeople or ensure continuous escort supervision — document this in the visitor log.", urgency: "soon", regulatory_ref: "Reg 12" });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: VisitorInsight[] = [];

  if (childContactDbsRate < 70 && withChildContact.length > 0) {
    insights.push({ text: `Only ${childContactDbsRate}% of visitors who had contact with children were DBS-checked. This is a direct safeguarding concern — Ofsted expects every adult with unsupervised child contact to be vetted. Implement a zero-tolerance policy for unvetted contact.`, severity: "critical" });
  }
  if (dbsCheckRate >= 90 && idVerificationRate >= 90 && signOutRate >= 90) {
    insights.push({ text: `${dbsCheckRate}% DBS, ${idVerificationRate}% ID verification, and ${signOutRate}% sign-out completion demonstrate outstanding access control — evidence of a robust safeguarding culture that protects children and satisfies Ofsted requirements.`, severity: "positive" });
  }
  if (inspector > 0 && dbsCheckRate >= 80) {
    insights.push({ text: `Inspector visits recorded alongside strong compliance rates suggest a home that is both transparent and well-managed — two key indicators Ofsted looks for during full inspections.`, severity: "positive" });
  }
  if (tradespeople.length > 0 && tradespersonDbsRate < 50) {
    insights.push({ text: `${tradespeople.length} tradesperson visit${tradespeople.length > 1 ? "s" : ""} with only ${tradespersonDbsRate}% DBS-checked. Tradespeople without DBS must be escorted at all times — Ofsted will ask about supervision arrangements for non-DBS-checked adults.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding visitor management — ${dbsCheckRate}% DBS compliance with ${recent.length} visits in 90 days.`;
  } else if (rating === "good") {
    headline = `Good visitor management — strong compliance with ${recent.length} visits recorded.`;
  } else if (rating === "adequate") {
    headline = "Adequate visitor management — gaps in DBS, ID verification, or sign-out completion need addressing.";
  } else {
    headline = "Visitor management is inadequate — significant safeguarding gaps in access control and DBS compliance.";
  }

  return {
    visitor_rating: rating,
    visitor_score: score,
    headline,
    access_compliance: complianceProfile,
    category_breakdown: categoryBreakdown,
    safeguarding_profile: safeguardingProfile,
    engagement_profile: engagementProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ────────────────────────────────────────────────────────

function emptyComplianceProfile(): AccessComplianceProfile {
  return {
    total_visitors_90d: 0, dbs_check_rate: 0,
    id_verification_rate: 0, sign_out_completion_rate: 0,
    documentation_rate: 0,
  };
}

function emptyCategoryBreakdown(): CategoryBreakdown {
  return { professional: 0, family: 0, tradesperson: 0, inspector: 0, volunteer: 0, other: 0 };
}

function emptySafeguardingProfile(): SafeguardingProfile {
  return {
    tradesperson_dbs_rate: 0, tradesperson_count: 0,
    family_id_verification_rate: 0, family_count: 0,
    visitors_with_child_contact: 0, child_contact_dbs_rate: 0,
  };
}

function emptyEngagementProfile(): EngagementProfile {
  return {
    avg_visitors_per_month: 0, professional_visit_rate: 0,
    inspector_visits: 0, multi_agency_engagement: false,
  };
}
