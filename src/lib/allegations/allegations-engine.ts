// ══════════════════════════════════════════════════════════════════════════════
// ALLEGATIONS AGAINST STAFF INTELLIGENCE ENGINE
//
// Pure deterministic engine for tracking, analysing and reporting on
// allegations, complaints, and concerns about staff, including LADO
// referrals, whistleblowing, DBS notifications, and outcome tracking.
//
// Regulatory basis:
//   - CHR 2015, Reg 37 — Complaints and representations
//   - CHR 2015, Reg 38 — Allegation procedures
//   - CHR 2015, Reg 40 — Notification of serious events
//   - Working Together 2023, Ch 2 — Managing allegations against people who
//     work with children
//   - Keeping Children Safe in Education 2024 — Part 4
//   - SCCIF — "Leadership and management" — responding to allegations
//   - DBS referral duties (Safeguarding Vulnerable Groups Act 2006)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type AllegationCategory =
  | "physical_abuse"
  | "emotional_abuse"
  | "sexual_abuse"
  | "neglect"
  | "inappropriate_restraint"
  | "inappropriate_relationship"
  | "professional_boundary"
  | "substance_misuse"
  | "criminal_behaviour"
  | "failure_to_safeguard"
  | "whistleblowing";

export type AllegationSource =
  | "child"
  | "parent_carer"
  | "staff_member"
  | "external_professional"
  | "placing_authority"
  | "anonymous"
  | "self_reported"
  | "ofsted";

export type AllegationOutcome =
  | "substantiated"
  | "malicious"
  | "false"
  | "unsubstantiated"
  | "unfounded"
  | "ongoing";

export type InvestigationStatus =
  | "initial_assessment"
  | "lado_referral_made"
  | "lado_strategy_meeting"
  | "police_investigation"
  | "internal_investigation"
  | "disciplinary"
  | "resolved"
  | "closed_no_action";

export type StaffAction =
  | "no_action"
  | "suspended"
  | "restricted_duties"
  | "supervision_enhanced"
  | "redeployed"
  | "dismissed"
  | "resigned"
  | "training_required"
  | "written_warning"
  | "final_warning"
  | "dbs_referral";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  startDate: string;
  dbsNumber?: string;
  currentlyEmployed: boolean;
}

export interface Allegation {
  id: string;
  staffId: string;
  category: AllegationCategory;
  source: AllegationSource;
  dateReported: string;
  dateOfIncident?: string;
  summary: string;
  childrenInvolved: string[];

  // Investigation
  investigationStatus: InvestigationStatus;
  ladoReferralDate?: string;
  ladoReferralTimely?: boolean; // within 1 working day
  policeInvolved: boolean;
  ofstedNotified: boolean;
  ofstedNotifiedDate?: string;
  ofstedNotifiedTimely?: boolean; // within required timeframe
  placingAuthorityNotified: boolean;
  riNotified: boolean;

  // Outcome
  outcome?: AllegationOutcome;
  outcomeDate?: string;
  staffAction: StaffAction;
  dbsReferralMade?: boolean;
  dbsReferralDate?: string;
  lessonsLearned?: string;
  policyReviewRequired: boolean;
  supportOfferedToChild: boolean;
  supportOfferedToStaff: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface AllegationComplianceResult {
  totalAllegations: number;
  ladoReferralsMade: number;
  ladoReferralsRequired: number;
  ladoTimelinessRate: number;
  ofstedNotifications: number;
  ofstedNotificationsRequired: number;
  ofstedTimelinessRate: number;
  placingAuthorityNotifiedRate: number;
  riNotifiedRate: number;
  dbsReferralsMade: number;
  dbsReferralsRequired: number;
}

export interface AllegationPatternResult {
  categoryBreakdown: { category: AllegationCategory; count: number }[];
  sourceBreakdown: { source: AllegationSource; count: number }[];
  outcomeBreakdown: { outcome: AllegationOutcome; count: number }[];
  staffWithMultiple: { staffId: string; staffName: string; count: number }[];
  averageResolutionDays: number;
  ongoingCount: number;
}

export interface AllegationStaffProfile {
  staffId: string;
  staffName: string;
  role: string;
  allegationCount: number;
  categories: AllegationCategory[];
  outcomes: AllegationOutcome[];
  currentAction: StaffAction;
  isHighRisk: boolean;
  riskReason?: string;
}

export interface AllegationsIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  // Compliance
  compliance: AllegationComplianceResult;

  // Patterns
  patterns: AllegationPatternResult;

  // Staff profiles with allegations
  staffProfiles: AllegationStaffProfile[];

  // Child protection
  childSupportRate: number;
  staffSupportRate: number;

  // Insights
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const LADO_REQUIRED_CATEGORIES: AllegationCategory[] = [
  "physical_abuse", "emotional_abuse", "sexual_abuse", "neglect",
  "inappropriate_restraint", "inappropriate_relationship", "failure_to_safeguard",
];

const OFSTED_NOTIFIABLE_CATEGORIES: AllegationCategory[] = [
  "physical_abuse", "sexual_abuse", "inappropriate_relationship",
  "criminal_behaviour", "failure_to_safeguard",
];

const DBS_REFERRAL_CATEGORIES: AllegationCategory[] = [
  "physical_abuse", "sexual_abuse", "inappropriate_relationship", "criminal_behaviour",
];

// ── Core: Evaluate Compliance ─────────────────────────────────────────────

export function evaluateAllegationCompliance(
  allegations: Allegation[],
  periodStart: string,
  periodEnd: string,
): AllegationComplianceResult {
  const periodAllegations = allegations.filter(
    (a) => a.dateReported >= periodStart && a.dateReported <= periodEnd,
  );

  const ladoRequired = periodAllegations.filter(
    (a) => LADO_REQUIRED_CATEGORIES.includes(a.category),
  );
  const ladoMade = ladoRequired.filter((a) => a.ladoReferralDate);
  const ladoTimely = ladoMade.filter((a) => a.ladoReferralTimely);

  const ofstedRequired = periodAllegations.filter(
    (a) => OFSTED_NOTIFIABLE_CATEGORIES.includes(a.category),
  );
  const ofstedNotified = ofstedRequired.filter((a) => a.ofstedNotified);
  const ofstedTimely = ofstedNotified.filter((a) => a.ofstedNotifiedTimely);

  const paNotified = periodAllegations.filter((a) => a.placingAuthorityNotified).length;
  const riNotified = periodAllegations.filter((a) => a.riNotified).length;

  // DBS referral tracking — only for substantiated allegations in relevant categories
  const dbsRequired = periodAllegations.filter(
    (a) => a.outcome === "substantiated" && DBS_REFERRAL_CATEGORIES.includes(a.category),
  );
  const dbsMade = dbsRequired.filter((a) => a.dbsReferralMade);

  return {
    totalAllegations: periodAllegations.length,
    ladoReferralsMade: ladoMade.length,
    ladoReferralsRequired: ladoRequired.length,
    ladoTimelinessRate: ladoMade.length > 0
      ? Math.round((ladoTimely.length / ladoMade.length) * 100) : 100,
    ofstedNotifications: ofstedNotified.length,
    ofstedNotificationsRequired: ofstedRequired.length,
    ofstedTimelinessRate: ofstedNotified.length > 0
      ? Math.round((ofstedTimely.length / ofstedNotified.length) * 100) : 100,
    placingAuthorityNotifiedRate: periodAllegations.length > 0
      ? Math.round((paNotified / periodAllegations.length) * 100) : 100,
    riNotifiedRate: periodAllegations.length > 0
      ? Math.round((riNotified / periodAllegations.length) * 100) : 100,
    dbsReferralsMade: dbsMade.length,
    dbsReferralsRequired: dbsRequired.length,
  };
}

// ── Core: Analyse Patterns ────────────────────────────────────────────────

export function analyseAllegationPatterns(
  allegations: Allegation[],
  staff: StaffMember[],
  periodStart: string,
  periodEnd: string,
): AllegationPatternResult {
  const periodAllegations = allegations.filter(
    (a) => a.dateReported >= periodStart && a.dateReported <= periodEnd,
  );
  const staffMap = new Map(staff.map((s) => [s.id, s]));

  // Category breakdown
  const categoryMap = new Map<AllegationCategory, number>();
  for (const a of periodAllegations) {
    categoryMap.set(a.category, (categoryMap.get(a.category) || 0) + 1);
  }
  const categoryBreakdown = [...categoryMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Source breakdown
  const sourceMap = new Map<AllegationSource, number>();
  for (const a of periodAllegations) {
    sourceMap.set(a.source, (sourceMap.get(a.source) || 0) + 1);
  }
  const sourceBreakdown = [...sourceMap.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Outcome breakdown
  const outcomeMap = new Map<AllegationOutcome, number>();
  for (const a of periodAllegations) {
    if (a.outcome) {
      outcomeMap.set(a.outcome, (outcomeMap.get(a.outcome) || 0) + 1);
    }
  }
  const outcomeBreakdown = [...outcomeMap.entries()]
    .map(([outcome, count]) => ({ outcome, count }))
    .sort((a, b) => b.count - a.count);

  // Staff with multiple allegations
  const staffAllegations = new Map<string, number>();
  for (const a of periodAllegations) {
    staffAllegations.set(a.staffId, (staffAllegations.get(a.staffId) || 0) + 1);
  }
  const staffWithMultiple = [...staffAllegations.entries()]
    .filter(([, count]) => count >= 2)
    .map(([staffId, count]) => ({
      staffId,
      staffName: staffMap.get(staffId)?.name ?? staffId,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Average resolution days
  const resolved = periodAllegations.filter(
    (a) => a.outcome && a.outcome !== "ongoing" && a.outcomeDate,
  );
  let avgDays = 0;
  if (resolved.length > 0) {
    const totalDays = resolved.reduce((sum, a) => {
      const start = new Date(a.dateReported).getTime();
      const end = new Date(a.outcomeDate!).getTime();
      return sum + Math.round((end - start) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDays = Math.round(totalDays / resolved.length);
  }

  const ongoingCount = periodAllegations.filter(
    (a) => !a.outcome || a.outcome === "ongoing",
  ).length;

  return {
    categoryBreakdown,
    sourceBreakdown,
    outcomeBreakdown,
    staffWithMultiple,
    averageResolutionDays: avgDays,
    ongoingCount,
  };
}

// ── Core: Build Staff Profiles ────────────────────────────────────────────

export function buildAllegationStaffProfiles(
  allegations: Allegation[],
  staff: StaffMember[],
  periodStart: string,
  periodEnd: string,
): AllegationStaffProfile[] {
  const periodAllegations = allegations.filter(
    (a) => a.dateReported >= periodStart && a.dateReported <= periodEnd,
  );

  const staffAllegationMap = new Map<string, Allegation[]>();
  for (const a of periodAllegations) {
    const existing = staffAllegationMap.get(a.staffId) || [];
    existing.push(a);
    staffAllegationMap.set(a.staffId, existing);
  }

  const staffMap = new Map(staff.map((s) => [s.id, s]));

  return [...staffAllegationMap.entries()].map(([staffId, staffAllegations]) => {
    const member = staffMap.get(staffId);
    const categories = [...new Set(staffAllegations.map((a) => a.category))];
    const outcomes = staffAllegations
      .filter((a) => a.outcome)
      .map((a) => a.outcome!);

    const latestAction = staffAllegations
      .sort((a, b) => b.dateReported.localeCompare(a.dateReported))[0].staffAction;

    // High risk determination
    let isHighRisk = false;
    let riskReason: string | undefined;

    if (staffAllegations.length >= 3) {
      isHighRisk = true;
      riskReason = `${staffAllegations.length} allegations in period — pattern of concern`;
    } else if (outcomes.includes("substantiated")) {
      isHighRisk = true;
      riskReason = "Substantiated allegation";
    } else if (categories.some((c) => ["sexual_abuse", "physical_abuse"].includes(c))) {
      isHighRisk = true;
      riskReason = "Serious category (sexual/physical abuse)";
    }

    return {
      staffId,
      staffName: member?.name ?? staffId,
      role: member?.role ?? "Unknown",
      allegationCount: staffAllegations.length,
      categories,
      outcomes,
      currentAction: latestAction,
      isHighRisk,
      riskReason,
    };
  });
}

// ── Main: Generate Allegations Intelligence ───────────────────────────────

export function generateAllegationsIntelligence(
  allegations: Allegation[],
  staff: StaffMember[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AllegationsIntelligenceResult {
  const assessedAt = new Date().toISOString();

  const periodAllegations = allegations.filter(
    (a) => a.dateReported >= periodStart && a.dateReported <= periodEnd,
  );

  const compliance = evaluateAllegationCompliance(allegations, periodStart, periodEnd);
  const patterns = analyseAllegationPatterns(allegations, staff, periodStart, periodEnd);
  const staffProfiles = buildAllegationStaffProfiles(allegations, staff, periodStart, periodEnd);

  // Child/staff support rates
  const childSupportRate = periodAllegations.length > 0
    ? Math.round(
      (periodAllegations.filter((a) => a.supportOfferedToChild).length / periodAllegations.length) * 100,
    ) : 100;

  const staffSupportRate = periodAllegations.length > 0
    ? Math.round(
      (periodAllegations.filter((a) => a.supportOfferedToStaff).length / periodAllegations.length) * 100,
    ) : 100;

  const overallScore = calculateAllegationsScore(compliance, patterns, staffProfiles, childSupportRate, staffSupportRate);
  const rating = getAllegationsRating(overallScore);

  const strengths = generateAllegationStrengths(compliance, patterns, childSupportRate, staffSupportRate);
  const concerns = generateAllegationConcerns(compliance, patterns, staffProfiles);
  const immediateActions = generateAllegationActions(compliance, patterns, staffProfiles, periodAllegations);
  const regulatoryLinks = generateAllegationRegulatoryLinks(compliance, patterns, staffProfiles);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    compliance,
    patterns,
    staffProfiles,
    childSupportRate,
    staffSupportRate,
    strengths,
    concerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateAllegationsScore(
  compliance: AllegationComplianceResult,
  patterns: AllegationPatternResult,
  staffProfiles: AllegationStaffProfile[],
  childSupportRate: number,
  staffSupportRate: number,
): number {
  let score = 50; // Start at midpoint — zero allegations = good baseline

  // LADO compliance (max +20)
  if (compliance.ladoReferralsRequired > 0) {
    const ladoCompRate = (compliance.ladoReferralsMade / compliance.ladoReferralsRequired) * 100;
    score += (ladoCompRate / 100) * 10;
    score += (compliance.ladoTimelinessRate / 100) * 10;
  } else {
    score += 20;
  }

  // Ofsted compliance (max +15)
  if (compliance.ofstedNotificationsRequired > 0) {
    const ofstedCompRate = (compliance.ofstedNotifications / compliance.ofstedNotificationsRequired) * 100;
    score += (ofstedCompRate / 100) * 8;
    score += (compliance.ofstedTimelinessRate / 100) * 7;
  } else {
    score += 15;
  }

  // Support rates (max +10)
  score += (childSupportRate / 100) * 5;
  score += (staffSupportRate / 100) * 5;

  // DBS referral compliance (max +5)
  if (compliance.dbsReferralsRequired > 0) {
    score += (compliance.dbsReferralsMade / compliance.dbsReferralsRequired) * 5;
  } else {
    score += 5;
  }

  // Penalties
  const substantiated = patterns.outcomeBreakdown.find((o) => o.outcome === "substantiated");
  if (substantiated) score -= substantiated.count * 5;

  const highRiskStaff = staffProfiles.filter((s) => s.isHighRisk);
  score -= highRiskStaff.length * 3;

  if (patterns.ongoingCount > 2) score -= (patterns.ongoingCount - 2) * 2;

  // Placing authority and RI notification
  score += (compliance.placingAuthorityNotifiedRate / 100) * 3;
  score += (compliance.riNotifiedRate / 100) * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getAllegationsRating(score: number): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateAllegationStrengths(
  compliance: AllegationComplianceResult,
  patterns: AllegationPatternResult,
  childSupportRate: number,
  staffSupportRate: number,
): string[] {
  const strengths: string[] = [];

  if (compliance.totalAllegations === 0) {
    strengths.push("No allegations received this period — reflects well on staff culture and safeguarding practice");
    return strengths;
  }

  if (compliance.ladoReferralsRequired > 0 && compliance.ladoReferralsMade === compliance.ladoReferralsRequired) {
    strengths.push("All LADO referrals made as required — robust safeguarding response");
  }
  if (compliance.ladoTimelinessRate === 100 && compliance.ladoReferralsMade > 0) {
    strengths.push("LADO referrals made within 1 working day in all cases");
  }
  if (compliance.ofstedNotificationsRequired > 0 && compliance.ofstedNotifications === compliance.ofstedNotificationsRequired) {
    strengths.push("Full compliance with Ofsted notification requirements");
  }
  if (childSupportRate >= 90) {
    strengths.push("Children involved in allegations consistently offered support");
  }
  if (staffSupportRate >= 90) {
    strengths.push("Staff subject to allegations offered appropriate support — demonstrates duty of care");
  }
  if (patterns.sourceBreakdown.some((s) => s.source === "staff_member")) {
    strengths.push("Staff feel empowered to raise concerns — healthy whistleblowing culture");
  }

  return strengths;
}

function generateAllegationConcerns(
  compliance: AllegationComplianceResult,
  patterns: AllegationPatternResult,
  staffProfiles: AllegationStaffProfile[],
): string[] {
  const concerns: string[] = [];

  if (compliance.ladoReferralsRequired > 0 && compliance.ladoReferralsMade < compliance.ladoReferralsRequired) {
    const missed = compliance.ladoReferralsRequired - compliance.ladoReferralsMade;
    concerns.push(`${missed} LADO referral(s) not made where required — serious compliance failure`);
  }

  if (compliance.ladoTimelinessRate < 100 && compliance.ladoReferralsMade > 0) {
    concerns.push("LADO referrals not consistently made within 1 working day");
  }

  if (compliance.ofstedNotificationsRequired > 0 && compliance.ofstedNotifications < compliance.ofstedNotificationsRequired) {
    concerns.push("Not all Ofsted notifications made where required");
  }

  if (compliance.dbsReferralsRequired > 0 && compliance.dbsReferralsMade < compliance.dbsReferralsRequired) {
    concerns.push("DBS referral(s) outstanding for substantiated allegation(s) — legal duty under SVGA 2006");
  }

  const highRisk = staffProfiles.filter((s) => s.isHighRisk);
  for (const profile of highRisk) {
    concerns.push(
      `${profile.staffName} (${profile.role}): ${profile.riskReason}`,
    );
  }

  if (patterns.staffWithMultiple.length > 0) {
    for (const s of patterns.staffWithMultiple) {
      concerns.push(`${s.staffName} has ${s.count} allegations this period — pattern review required`);
    }
  }

  if (patterns.ongoingCount > 0) {
    concerns.push(`${patterns.ongoingCount} allegation(s) still ongoing — monitor for timely resolution`);
  }

  return concerns;
}

function generateAllegationActions(
  compliance: AllegationComplianceResult,
  patterns: AllegationPatternResult,
  staffProfiles: AllegationStaffProfile[],
  periodAllegations: Allegation[],
): string[] {
  const actions: string[] = [];

  // Missing LADO referrals
  if (compliance.ladoReferralsRequired > compliance.ladoReferralsMade) {
    actions.push(
      `URGENT: ${compliance.ladoReferralsRequired - compliance.ladoReferralsMade} LADO referral(s) outstanding. Contact LADO immediately — Working Together 2023 requires referral within 1 working day.`,
    );
  }

  // Missing DBS referrals
  if (compliance.dbsReferralsRequired > compliance.dbsReferralsMade) {
    actions.push(
      `URGENT: ${compliance.dbsReferralsRequired - compliance.dbsReferralsMade} DBS referral(s) outstanding for substantiated allegation(s). Legal duty under Safeguarding Vulnerable Groups Act 2006.`,
    );
  }

  // Missing Ofsted notifications
  if (compliance.ofstedNotificationsRequired > compliance.ofstedNotifications) {
    actions.push(
      `HIGH: ${compliance.ofstedNotificationsRequired - compliance.ofstedNotifications} Ofsted notification(s) outstanding. Notify within statutory timeframe (Reg 40).`,
    );
  }

  // High-risk staff
  for (const profile of staffProfiles.filter((s) => s.isHighRisk)) {
    if (profile.currentAction === "no_action") {
      actions.push(
        `HIGH: ${profile.staffName} flagged high-risk (${profile.riskReason}) but no action taken. Review with LADO and HR.`,
      );
    }
  }

  // Child support gaps
  const unsupported = periodAllegations.filter((a) => !a.supportOfferedToChild);
  if (unsupported.length > 0) {
    actions.push(
      `MEDIUM: ${unsupported.length} allegation(s) where child support not recorded. Ensure therapeutic/advocacy support offered.`,
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Allegation management procedures are operating effectively.");
  }

  return actions;
}

function generateAllegationRegulatoryLinks(
  compliance: AllegationComplianceResult,
  patterns: AllegationPatternResult,
  staffProfiles: AllegationStaffProfile[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 37 — Complaints and representations");
  links.add("SCCIF: Leadership and management — Responding to allegations");

  if (compliance.ladoReferralsRequired > 0) {
    links.add("Working Together 2023, Ch 2 — Managing allegations against people who work with children");
    links.add("CHR 2015, Reg 38 — Allegation procedures");
  }

  if (compliance.ofstedNotificationsRequired > 0) {
    links.add("CHR 2015, Reg 40 — Notification of serious events");
  }

  if (compliance.dbsReferralsRequired > 0) {
    links.add("Safeguarding Vulnerable Groups Act 2006 — DBS referral duty");
    links.add("Keeping Children Safe in Education 2024, Part 4 — Allegations");
  }

  const hasSexualAbuse = patterns.categoryBreakdown.some((c) => c.category === "sexual_abuse");
  if (hasSexualAbuse) {
    links.add("Sexual Offences Act 2003 — Abuse of position of trust");
  }

  const hasWhistleblowing = patterns.sourceBreakdown.some((s) => s.source === "staff_member" || s.source === "self_reported");
  if (hasWhistleblowing) {
    links.add("Public Interest Disclosure Act 1998 — Whistleblowing protections");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getAllegationCategoryLabel(category: AllegationCategory): string {
  const labels: Record<AllegationCategory, string> = {
    physical_abuse: "Physical Abuse",
    emotional_abuse: "Emotional Abuse",
    sexual_abuse: "Sexual Abuse",
    neglect: "Neglect",
    inappropriate_restraint: "Inappropriate Restraint",
    inappropriate_relationship: "Inappropriate Relationship",
    professional_boundary: "Professional Boundary Breach",
    substance_misuse: "Substance Misuse",
    criminal_behaviour: "Criminal Behaviour",
    failure_to_safeguard: "Failure to Safeguard",
    whistleblowing: "Whistleblowing",
  };
  return labels[category];
}

export function getAllegationOutcomeLabel(outcome: AllegationOutcome): string {
  const labels: Record<AllegationOutcome, string> = {
    substantiated: "Substantiated",
    malicious: "Malicious",
    false: "False",
    unsubstantiated: "Unsubstantiated",
    unfounded: "Unfounded",
    ongoing: "Ongoing",
  };
  return labels[outcome];
}

export function getStaffActionLabel(action: StaffAction): string {
  const labels: Record<StaffAction, string> = {
    no_action: "No Action",
    suspended: "Suspended",
    restricted_duties: "Restricted Duties",
    supervision_enhanced: "Enhanced Supervision",
    redeployed: "Redeployed",
    dismissed: "Dismissed",
    resigned: "Resigned",
    training_required: "Training Required",
    written_warning: "Written Warning",
    final_warning: "Final Warning",
    dbs_referral: "DBS Referral",
  };
  return labels[action];
}

export function getSourceLabel(source: AllegationSource): string {
  const labels: Record<AllegationSource, string> = {
    child: "Child",
    parent_carer: "Parent/Carer",
    staff_member: "Staff Member",
    external_professional: "External Professional",
    placing_authority: "Placing Authority",
    anonymous: "Anonymous",
    self_reported: "Self-Reported",
    ofsted: "Ofsted",
  };
  return labels[source];
}
