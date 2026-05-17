// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Delegated Authority & Consent Engine
//
// Deterministic engine for tracking delegated decision-making authority from
// placing authorities, managing parental/LA consent records, and ensuring
// children are not unnecessarily restricted from normal childhood activities.
//
// Aligned to:
//   - CHR 2015 Reg 5 — Quality and purpose of care (normalcy)
//   - CHR 2015 Reg 14 — Care planning (placement plan)
//   - Children Act 1989 s.33(3)(b) — Parental responsibility sharing
//   - IRO Handbook — Delegated authority
//   - DfE Guidance: Delegated authority for looked-after children
//   - SCCIF — Children enjoy normalised childhood experiences
//
// Key requirements:
//   - Delegated authority schedule agreed at placement start
//   - Clear record of what home CAN decide vs what needs LA/parent consent
//   - Review at every LAC review (minimum 6-monthly)
//   - Children not unnecessarily restricted (haircuts, sleepovers, etc.)
//   - Emergency decisions documented and reported
//   - Consent records maintained for medical, activities, travel
//   - Children informed about what's delegated (age-appropriate)
//   - Placement plan specifies delegation clearly
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type DecisionCategory =
  | "routine_medical"           // GP visits, minor treatment
  | "specialist_medical"        // referrals, assessments, operations
  | "dental"                    // routine dental
  | "overnight_stays"           // sleepovers at friends
  | "school_trips"              // day trips, residential
  | "haircut"                   // haircut/style changes
  | "ear_piercing"              // body modification
  | "social_media"              // social media accounts
  | "mobile_phone"              // own phone/device
  | "leisure_activities"        // clubs, hobbies
  | "travel_domestic"           // domestic travel
  | "travel_international"      // passport, international trips
  | "religious_observance"      // religious activities
  | "diet_changes"              // significant dietary changes
  | "education_decisions"       // school choice, exclusion appeals
  | "contact_arrangements"      // family contact changes
  | "photographs_media"         // photos in media/social media
  | "vaccinations"              // immunisations
  | "emergency_medical"         // A&E, urgent care
  | "pocket_money_amounts"      // pocket money level changes
  | "clothing_choices"          // significant purchases
  | "relationships_dating";     // relationships advice/support

export type AuthorityLevel =
  | "home_decides"              // fully delegated — home can decide
  | "home_with_notification"    // home decides but must inform LA/parent
  | "la_consent_required"       // must get LA social worker permission
  | "parent_consent_required"   // must get parent/carer permission
  | "court_order_required"      // needs court authority
  | "not_delegated";            // explicitly not delegated

export type ConsentStatus = "granted" | "refused" | "pending" | "withdrawn" | "expired" | "not_required";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface DelegatedAuthorityEntry {
  category: DecisionCategory;
  authorityLevel: AuthorityLevel;
  agreedDate: string;
  agreedBy: string;                        // who agreed (SW name)
  reviewDate: string;                      // next review due
  notes?: string;
  restrictions?: string[];
}

export interface ConsentRecord {
  id: string;
  childId: string;
  category: DecisionCategory;
  description: string;
  requestedDate: string;
  requestedBy: string;
  consentFrom: string;                     // who gave/refused consent
  consentStatus: ConsentStatus;
  responseDate?: string;
  expiryDate?: string;
  conditions?: string[];
  evidenceHeld: boolean;                   // written consent on file
  childInformed: boolean;
}

export interface ChildDelegatedAuthorityProfile {
  childId: string;
  childName: string;
  homeId: string;
  placingAuthority: string;
  socialWorkerName: string;
  // Delegation schedule
  delegatedAuthority: DelegatedAuthorityEntry[];
  scheduleAgreedDate: string;
  scheduleLastReviewDate: string;
  scheduleNextReviewDate: string;
  // Consents
  consentRecords: ConsentRecord[];
  // Status
  placementPlanSpecifiesDelegation: boolean;
  childInformedOfRights: boolean;
  // Emergency decisions
  emergencyDecisionsMade: EmergencyDecision[];
}

export interface EmergencyDecision {
  id: string;
  date: string;
  category: DecisionCategory;
  description: string;
  madeBy: string;
  rationale: string;
  laNotified: boolean;
  laNotifiedDate?: string;
  parentNotified: boolean;
  parentNotifiedDate?: string;
  outcome: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface DelegatedAuthorityComplianceResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  // Schedule
  scheduleInPlace: boolean;
  scheduleCurrentReview: boolean;          // reviewed in last 6 months
  daysUntilReviewDue: number;
  reviewOverdue: boolean;
  // Coverage
  categoriesCovered: number;
  totalCategories: number;
  coverageRate: number;                    // %
  // Normalcy
  fullyDelegatedCount: number;             // decisions home can make freely
  restrictedCount: number;                 // decisions requiring external consent
  normalcyScore: number;                   // 0-100 (higher = more normalised)
  // Consent
  pendingConsents: number;
  expiredConsents: number;
  consentEvidenceRate: number;             // % with written evidence
  // Emergency
  emergencyDecisionsLast6Months: number;
  emergencyNotificationRate: number;       // % where LA was notified
  // Child involvement
  childInformed: boolean;
  placementPlanClear: boolean;
}

export interface HomeDelegatedAuthorityMetrics {
  homeId: string;
  // Coverage
  childrenWithSchedule: number;
  totalChildren: number;
  scheduleCompletionRate: number;          // %
  averageCoverageRate: number;             // %
  // Normalcy
  averageNormalcyScore: number;            // 0-100
  mostRestrictedCategories: { category: string; count: number }[];
  // Reviews
  reviewsOverdue: number;
  nextReviewDue: string;
  // Consents
  totalPendingConsents: number;
  totalExpiredConsents: number;
  consentEvidenceRate: number;
  // Issues
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const REVIEW_INTERVAL_DAYS = 183;          // ~6 months (aligned to LAC reviews)
const ALL_CATEGORIES: DecisionCategory[] = [
  "routine_medical", "specialist_medical", "dental", "overnight_stays",
  "school_trips", "haircut", "ear_piercing", "social_media", "mobile_phone",
  "leisure_activities", "travel_domestic", "travel_international",
  "religious_observance", "diet_changes", "education_decisions",
  "contact_arrangements", "photographs_media", "vaccinations",
  "emergency_medical", "pocket_money_amounts", "clothing_choices",
  "relationships_dating",
];

const NORMALCY_WEIGHTS: Record<AuthorityLevel, number> = {
  home_decides: 100,
  home_with_notification: 80,
  la_consent_required: 40,
  parent_consent_required: 40,
  court_order_required: 10,
  not_delegated: 0,
};

// ── Core: Evaluate Delegated Authority Compliance ─────────────────────────

export function evaluateDelegatedAuthorityCompliance(
  profile: ChildDelegatedAuthorityProfile,
  now?: string,
): DelegatedAuthorityComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];

  // Schedule in place
  const scheduleInPlace = profile.delegatedAuthority.length > 0;
  if (!scheduleInPlace) {
    issues.push("No delegated authority schedule in place");
  }

  // Review status
  const reviewDueTime = new Date(profile.scheduleNextReviewDate).getTime();
  const daysUntilReviewDue = Math.round((reviewDueTime - currentTime) / (24 * 60 * 60 * 1000));
  const reviewOverdue = daysUntilReviewDue < 0;
  const scheduleCurrentReview = !reviewOverdue;

  if (reviewOverdue) {
    issues.push(`Delegated authority review overdue by ${Math.abs(daysUntilReviewDue)} day(s)`);
  } else if (daysUntilReviewDue <= 14) {
    warnings.push(`Delegated authority review due in ${daysUntilReviewDue} day(s)`);
  }

  // Coverage
  const categoriesCovered = profile.delegatedAuthority.length;
  const totalCategories = ALL_CATEGORIES.length;
  const coverageRate = Math.round((categoriesCovered / totalCategories) * 100);

  if (coverageRate < 50) {
    warnings.push(`Only ${coverageRate}% of decision categories covered in schedule`);
  }

  // Normalcy score
  const normalcyScores = profile.delegatedAuthority.map(
    da => NORMALCY_WEIGHTS[da.authorityLevel]
  );
  const normalcyScore = normalcyScores.length > 0
    ? Math.round(normalcyScores.reduce((a, b) => a + b, 0) / normalcyScores.length)
    : 0;

  const fullyDelegatedCount = profile.delegatedAuthority.filter(
    da => da.authorityLevel === "home_decides" || da.authorityLevel === "home_with_notification"
  ).length;
  const restrictedCount = profile.delegatedAuthority.filter(
    da => da.authorityLevel === "la_consent_required" ||
          da.authorityLevel === "parent_consent_required" ||
          da.authorityLevel === "court_order_required" ||
          da.authorityLevel === "not_delegated"
  ).length;

  if (normalcyScore < 50) {
    warnings.push(`Low normalcy score (${normalcyScore}%) — child may be unnecessarily restricted`);
  }

  // Consent records
  const pendingConsents = profile.consentRecords.filter(c => c.consentStatus === "pending").length;
  const expiredConsents = profile.consentRecords.filter(c => c.consentStatus === "expired").length;

  if (pendingConsents > 3) {
    warnings.push(`${pendingConsents} consent requests pending — may be delaying activities`);
  }
  if (expiredConsents > 0) {
    warnings.push(`${expiredConsents} expired consent(s) — renewal needed`);
  }

  const consentsWithEvidence = profile.consentRecords.filter(c => c.evidenceHeld);
  const consentEvidenceRate = profile.consentRecords.length > 0
    ? Math.round((consentsWithEvidence.length / profile.consentRecords.length) * 100)
    : 100;

  if (profile.consentRecords.length > 0 && consentEvidenceRate < 90) {
    issues.push(`Written consent evidence missing for ${profile.consentRecords.length - consentsWithEvidence.length} record(s)`);
  }

  // Emergency decisions
  const sixMonthsAgo = currentTime - REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
  const recentEmergencies = profile.emergencyDecisionsMade.filter(
    e => new Date(e.date).getTime() > sixMonthsAgo
  );
  const emergencyDecisionsLast6Months = recentEmergencies.length;

  const notifiedEmergencies = recentEmergencies.filter(e => e.laNotified);
  const emergencyNotificationRate = recentEmergencies.length > 0
    ? Math.round((notifiedEmergencies.length / recentEmergencies.length) * 100)
    : 100;

  if (recentEmergencies.length > 0 && emergencyNotificationRate < 100) {
    issues.push(`${recentEmergencies.length - notifiedEmergencies.length} emergency decision(s) not notified to placing authority`);
  }

  // Child informed
  if (!profile.childInformedOfRights) {
    issues.push("Child not informed about delegated authority and their rights");
  }

  // Placement plan
  if (!profile.placementPlanSpecifiesDelegation) {
    issues.push("Placement plan does not specify delegated authority arrangements");
  }

  return {
    childId: profile.childId,
    childName: profile.childName,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    scheduleInPlace,
    scheduleCurrentReview,
    daysUntilReviewDue,
    reviewOverdue,
    categoriesCovered,
    totalCategories,
    coverageRate,
    fullyDelegatedCount,
    restrictedCount,
    normalcyScore,
    pendingConsents,
    expiredConsents,
    consentEvidenceRate,
    emergencyDecisionsLast6Months,
    emergencyNotificationRate,
    childInformed: profile.childInformedOfRights,
    placementPlanClear: profile.placementPlanSpecifiesDelegation,
  };
}

// ── Core: Calculate Home Delegated Authority Metrics ──────────────────────

export function calculateHomeDelegatedAuthorityMetrics(
  profiles: ChildDelegatedAuthorityProfile[],
  homeId: string,
  now?: string,
): HomeDelegatedAuthorityMetrics {
  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const totalChildren = homeProfiles.length;

  if (totalChildren === 0) {
    return {
      homeId,
      childrenWithSchedule: 0,
      totalChildren: 0,
      scheduleCompletionRate: 100,
      averageCoverageRate: 0,
      averageNormalcyScore: 0,
      mostRestrictedCategories: [],
      reviewsOverdue: 0,
      nextReviewDue: new Date().toISOString(),
      totalPendingConsents: 0,
      totalExpiredConsents: 0,
      consentEvidenceRate: 100,
      complianceIssues: [],
    };
  }

  const results = homeProfiles.map(p => evaluateDelegatedAuthorityCompliance(p, now));

  const childrenWithSchedule = homeProfiles.filter(p => p.delegatedAuthority.length > 0).length;
  const scheduleCompletionRate = Math.round((childrenWithSchedule / totalChildren) * 100);

  const averageCoverageRate = Math.round(
    results.reduce((s, r) => s + r.coverageRate, 0) / results.length
  );
  const averageNormalcyScore = Math.round(
    results.reduce((s, r) => s + r.normalcyScore, 0) / results.length
  );

  // Most restricted categories
  const restrictionCounts: Record<string, number> = {};
  homeProfiles.forEach(p => {
    p.delegatedAuthority
      .filter(da => da.authorityLevel === "la_consent_required" || da.authorityLevel === "parent_consent_required" || da.authorityLevel === "not_delegated")
      .forEach(da => {
        restrictionCounts[da.category] = (restrictionCounts[da.category] || 0) + 1;
      });
  });
  const mostRestrictedCategories = Object.entries(restrictionCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Reviews
  const reviewsOverdue = results.filter(r => r.reviewOverdue).length;
  const nextReviewDates = homeProfiles.map(p => new Date(p.scheduleNextReviewDate).getTime());
  const nextReviewDue = new Date(Math.min(...nextReviewDates)).toISOString();

  // Consents
  const totalPendingConsents = results.reduce((s, r) => s + r.pendingConsents, 0);
  const totalExpiredConsents = results.reduce((s, r) => s + r.expiredConsents, 0);
  const allConsents = homeProfiles.flatMap(p => p.consentRecords);
  const withEvidence = allConsents.filter(c => c.evidenceHeld);
  const consentEvidenceRate = allConsents.length > 0
    ? Math.round((withEvidence.length / allConsents.length) * 100)
    : 100;

  const complianceIssues = [...new Set(results.flatMap(r => r.issues))];

  return {
    homeId,
    childrenWithSchedule,
    totalChildren,
    scheduleCompletionRate,
    averageCoverageRate,
    averageNormalcyScore,
    mostRestrictedCategories,
    reviewsOverdue,
    nextReviewDue,
    totalPendingConsents,
    totalExpiredConsents,
    consentEvidenceRate,
    complianceIssues,
  };
}

// ── Label Helpers ────────────────────────────────────────────────────────

export function getDecisionCategoryLabel(category: DecisionCategory): string {
  const labels: Record<DecisionCategory, string> = {
    routine_medical: "Routine Medical",
    specialist_medical: "Specialist Medical",
    dental: "Dental Treatment",
    overnight_stays: "Overnight Stays/Sleepovers",
    school_trips: "School Trips",
    haircut: "Haircuts/Style Changes",
    ear_piercing: "Ear Piercing/Body Mod",
    social_media: "Social Media",
    mobile_phone: "Mobile Phone/Devices",
    leisure_activities: "Leisure Activities/Clubs",
    travel_domestic: "Domestic Travel",
    travel_international: "International Travel",
    religious_observance: "Religious Observance",
    diet_changes: "Diet Changes",
    education_decisions: "Education Decisions",
    contact_arrangements: "Contact Arrangements",
    photographs_media: "Photographs/Media",
    vaccinations: "Vaccinations",
    emergency_medical: "Emergency Medical",
    pocket_money_amounts: "Pocket Money",
    clothing_choices: "Clothing/Purchases",
    relationships_dating: "Relationships/Dating",
  };
  return labels[category] ?? category;
}

export function getAuthorityLevelLabel(level: AuthorityLevel): string {
  const labels: Record<AuthorityLevel, string> = {
    home_decides: "Home Decides",
    home_with_notification: "Home Decides (Notify)",
    la_consent_required: "LA Consent Required",
    parent_consent_required: "Parent Consent Required",
    court_order_required: "Court Order Required",
    not_delegated: "Not Delegated",
  };
  return labels[level] ?? level;
}
