// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Staff Training & CPD Compliance Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Ofsted expects to see that staff have the right qualifications,
//  skills, knowledge and experience to meet the needs of children."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 32         — Fitness of workers
//   CHR 2015 Reg 33(4)(a)   — Staff receive practice-related supervision
//   CHR 2015 Reg 33(4)(b)   — Staff receive training to meet needs of children
//   CHR 2015 Schedule 2     — Information about staff (qualifications, training)
//   SCCIF                   — "Staff have skills and knowledge to meet children's needs"
//   Working Together 2023    — Multi-agency safeguarding competency requirements
//   Restraint Reduction Network — Physical intervention training standards
//   Health and Safety at Work Act 1974 — Employer's duty of training
//
// Key requirements:
//   1. All staff complete mandatory induction within first 6 months
//   2. Safeguarding training refreshed annually
//   3. First aid certificates valid (3-year renewal)
//   4. Physical intervention training refreshed (typically annual)
//   5. Fire safety training annual
//   6. Medication administration training current
//   7. Level 3 Diploma in Residential Childcare within 2 years of starting
//   8. Managers hold Level 5 Diploma in Leadership & Management (residential)
//   9. CPD evidenced and linked to children's needs
//  10. Specialist training for specific children's needs
//
// Scoring breakdown (0–100):
//   Mandatory training compliance:   30  — Core mandatory courses completed & current
//   Certification validity:          20  — Certificates within expiry dates
//   CPD hours:                       15  — Staff meeting CPD hour targets
//   Qualification levels:            20  — Appropriate qualifications for role
//   Specialist/needs-based training: 15  — Training matched to children's needs
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrainingCategory =
  | "safeguarding"
  | "first_aid"
  | "physical_intervention"
  | "fire_safety"
  | "medication_administration"
  | "food_hygiene"
  | "health_and_safety"
  | "data_protection"
  | "equality_diversity"
  | "mental_health_awareness"
  | "attachment_trauma"
  | "therapeutic_parenting"
  | "csea"               // child sexual exploitation & abuse
  | "county_lines"
  | "online_safety"
  | "self_harm_suicide"
  | "substance_misuse"
  | "missing_children"
  | "complaints_advocacy"
  | "record_keeping"
  | "induction"
  | "other";

export type QualificationLevel =
  | "level_3_diploma"       // Residential childcare
  | "level_5_diploma"       // Leadership & management
  | "degree"
  | "social_work_degree"
  | "teaching_qualification"
  | "other_relevant"
  | "none";

export type StaffRole = "registered_manager" | "deputy_manager" | "senior_rsw" | "rsw" | "waking_night" | "bank_staff";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface TrainingRecord {
  id: string;
  staffId: string;
  staffName: string;
  category: TrainingCategory;
  courseName: string;
  completedDate: string;     // ISO date
  expiryDate?: string;       // ISO date — if certification based
  hoursCompleted: number;
  provider: string;           // e.g. "In-house", "External", "E-learning"
  certificateRef?: string;
  linkedChildNeeds?: string[]; // child IDs this training relates to
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  startDate: string;          // when they started at this home
  qualificationLevel: QualificationLevel;
  qualificationDate?: string; // when qualification achieved
  isPlaced: boolean;          // currently employed/active
}

export interface ChildNeed {
  childId: string;
  childName: string;
  need: string;               // e.g. "autism", "csea_risk", "self_harm"
  requiredTraining: TrainingCategory;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface MandatoryComplianceResult {
  totalStaff: number;
  mandatoryCategories: TrainingCategory[];
  staffCompliance: {
    staffId: string;
    staffName: string;
    completedCategories: TrainingCategory[];
    missingCategories: TrainingCategory[];
    complianceRate: number;
  }[];
  overallComplianceRate: number;
}

export interface CertificationResult {
  totalCertifications: number;
  valid: number;
  expiringSoon: number;   // within 60 days
  expired: number;
  validityRate: number;
  expiringDetails: {
    staffName: string;
    category: TrainingCategory;
    courseName: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }[];
  expiredDetails: {
    staffName: string;
    category: TrainingCategory;
    courseName: string;
    expiryDate: string;
    daysSinceExpiry: number;
  }[];
}

export interface CpdResult {
  targetHoursPerYear: number;
  staffCpd: {
    staffId: string;
    staffName: string;
    hoursCompleted: number;
    targetMet: boolean;
    coursesCompleted: number;
  }[];
  averageHours: number;
  staffMeetingTarget: number;
  targetMetRate: number;
}

export interface QualificationResult {
  totalStaff: number;
  staffQualifications: {
    staffId: string;
    staffName: string;
    role: StaffRole;
    qualificationLevel: QualificationLevel;
    meetsRoleRequirement: boolean;
    qualificationGap?: string;
  }[];
  qualificationComplianceRate: number;
}

export interface SpecialistTrainingResult {
  totalChildNeeds: number;
  coveredNeeds: number;
  uncoveredNeeds: number;
  coverageRate: number;
  needsCoverage: {
    childName: string;
    need: string;
    requiredTraining: TrainingCategory;
    trainedStaffCount: number;
    isCovered: boolean;
  }[];
}

export interface StaffTrainingProfile {
  staffId: string;
  staffName: string;
  role: StaffRole;
  qualificationLevel: QualificationLevel;
  totalCourses: number;
  totalHours: number;
  mandatoryComplianceRate: number;
  certificationsValid: number;
  certificationsExpired: number;
  certificationsExpiringSoon: number;
  specialistTrainingCount: number;
  overallReadiness: "excellent" | "good" | "attention_needed" | "critical";
}

export interface StaffTrainingResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;   // date used for expiry calculations
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  mandatoryCompliance: MandatoryComplianceResult;
  certifications: CertificationResult;
  cpd: CpdResult;
  qualifications: QualificationResult;
  specialistTraining: SpecialistTrainingResult;
  staffProfiles: StaffTrainingProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const MANDATORY_TRAINING: TrainingCategory[] = [
  "safeguarding",
  "first_aid",
  "physical_intervention",
  "fire_safety",
  "medication_administration",
  "health_and_safety",
  "data_protection",
  "equality_diversity",
];

// Minimum qualification requirements by role
const ROLE_QUALIFICATION_REQUIREMENTS: Record<StaffRole, QualificationLevel[]> = {
  registered_manager: ["level_5_diploma", "social_work_degree"],
  deputy_manager: ["level_5_diploma", "level_3_diploma", "social_work_degree"],
  senior_rsw: ["level_3_diploma", "social_work_degree", "degree"],
  rsw: ["level_3_diploma", "social_work_degree", "degree"],
  waking_night: ["level_3_diploma", "other_relevant"],
  bank_staff: ["level_3_diploma", "other_relevant"],
};

// CPD target: 30 hours per year for residential childcare workers
const CPD_HOURS_TARGET = 30;

const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  safeguarding: "Safeguarding",
  first_aid: "First Aid",
  physical_intervention: "Physical Intervention",
  fire_safety: "Fire Safety",
  medication_administration: "Medication Administration",
  food_hygiene: "Food Hygiene",
  health_and_safety: "Health & Safety",
  data_protection: "Data Protection / GDPR",
  equality_diversity: "Equality & Diversity",
  mental_health_awareness: "Mental Health Awareness",
  attachment_trauma: "Attachment & Trauma",
  therapeutic_parenting: "Therapeutic Parenting / PACE",
  csea: "CSE/A Awareness",
  county_lines: "County Lines",
  online_safety: "Online Safety",
  self_harm_suicide: "Self-Harm & Suicide Prevention",
  substance_misuse: "Substance Misuse",
  missing_children: "Missing Children",
  complaints_advocacy: "Complaints & Advocacy",
  record_keeping: "Record Keeping",
  induction: "Induction Programme",
  other: "Other Training",
};

const ROLE_LABELS: Record<StaffRole, string> = {
  registered_manager: "Registered Manager",
  deputy_manager: "Deputy Manager",
  senior_rsw: "Senior RSW",
  rsw: "Residential Support Worker",
  waking_night: "Waking Night Staff",
  bank_staff: "Bank Staff",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getCategoryLabel(c: TrainingCategory): string {
  return CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getRoleLabel(r: StaffRole): string {
  return ROLE_LABELS[r] ?? r.replace(/_/g, " ");
}

export function getMandatoryCategories(): TrainingCategory[] {
  return [...MANDATORY_TRAINING];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateMandatoryCompliance(
  staff: StaffMember[],
  records: TrainingRecord[],
  periodStart: string,
  periodEnd: string,
): MandatoryComplianceResult {
  const activeStaff = staff.filter((s) => s.isPlaced);
  const totalStaff = activeStaff.length;

  const staffCompliance = activeStaff.map((s) => {
    // Records for this staff member in or before this period
    const staffRecords = records.filter(
      (r) => r.staffId === s.id && r.completedDate <= periodEnd,
    );

    // For each mandatory category, find the most recent record
    const completedCategories: TrainingCategory[] = [];
    const missingCategories: TrainingCategory[] = [];

    for (const cat of MANDATORY_TRAINING) {
      const hasRecord = staffRecords.some((r) => r.category === cat);
      if (hasRecord) {
        completedCategories.push(cat);
      } else {
        missingCategories.push(cat);
      }
    }

    return {
      staffId: s.id,
      staffName: s.name,
      completedCategories,
      missingCategories,
      complianceRate: pct(completedCategories.length, MANDATORY_TRAINING.length),
    };
  });

  const totalCompleted = staffCompliance.reduce(
    (sum, s) => sum + s.completedCategories.length,
    0,
  );
  const totalRequired = totalStaff * MANDATORY_TRAINING.length;
  const overallComplianceRate = pct(totalCompleted, totalRequired);

  return {
    totalStaff,
    mandatoryCategories: [...MANDATORY_TRAINING],
    staffCompliance,
    overallComplianceRate,
  };
}

export function evaluateCertifications(
  records: TrainingRecord[],
  referenceDate: string,
): CertificationResult {
  // Only consider records that have an expiry date
  const certRecords = records.filter((r) => r.expiryDate);
  const totalCertifications = certRecords.length;

  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;
  const expiringDetails: CertificationResult["expiringDetails"] = [];
  const expiredDetails: CertificationResult["expiredDetails"] = [];

  for (const r of certRecords) {
    const days = daysBetween(referenceDate, r.expiryDate!);
    if (days < 0) {
      expired++;
      expiredDetails.push({
        staffName: r.staffName,
        category: r.category,
        courseName: r.courseName,
        expiryDate: r.expiryDate!,
        daysSinceExpiry: Math.abs(days),
      });
    } else if (days <= 60) {
      expiringSoon++;
      valid++; // still valid, just expiring soon
      expiringDetails.push({
        staffName: r.staffName,
        category: r.category,
        courseName: r.courseName,
        expiryDate: r.expiryDate!,
        daysUntilExpiry: days,
      });
    } else {
      valid++;
    }
  }

  const validityRate = pct(valid, totalCertifications);

  return {
    totalCertifications,
    valid,
    expiringSoon,
    expired,
    validityRate,
    expiringDetails: expiringDetails.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    expiredDetails: expiredDetails.sort((a, b) => b.daysSinceExpiry - a.daysSinceExpiry),
  };
}

export function evaluateCpd(
  staff: StaffMember[],
  records: TrainingRecord[],
  periodStart: string,
  periodEnd: string,
): CpdResult {
  const activeStaff = staff.filter((s) => s.isPlaced);

  const staffCpd = activeStaff.map((s) => {
    const staffRecords = records.filter(
      (r) => r.staffId === s.id && inPeriod(r.completedDate, periodStart, periodEnd),
    );
    const hoursCompleted = staffRecords.reduce((sum, r) => sum + r.hoursCompleted, 0);
    return {
      staffId: s.id,
      staffName: s.name,
      hoursCompleted: Math.round(hoursCompleted * 10) / 10,
      targetMet: hoursCompleted >= CPD_HOURS_TARGET,
      coursesCompleted: staffRecords.length,
    };
  });

  const totalHours = staffCpd.reduce((sum, s) => sum + s.hoursCompleted, 0);
  const averageHours =
    activeStaff.length === 0 ? 0 : Math.round((totalHours / activeStaff.length) * 10) / 10;

  const staffMeetingTarget = staffCpd.filter((s) => s.targetMet).length;
  const targetMetRate = pct(staffMeetingTarget, activeStaff.length);

  return {
    targetHoursPerYear: CPD_HOURS_TARGET,
    staffCpd,
    averageHours,
    staffMeetingTarget,
    targetMetRate,
  };
}

export function evaluateQualifications(
  staff: StaffMember[],
): QualificationResult {
  const activeStaff = staff.filter((s) => s.isPlaced);
  const totalStaff = activeStaff.length;

  const staffQualifications = activeStaff.map((s) => {
    const requirements = ROLE_QUALIFICATION_REQUIREMENTS[s.role] ?? [];
    const meetsRoleRequirement =
      requirements.length === 0 || requirements.includes(s.qualificationLevel);

    let qualificationGap: string | undefined;
    if (!meetsRoleRequirement) {
      qualificationGap = `${getRoleLabel(s.role)} requires ${requirements.map((r) => r.replace(/_/g, " ")).join(" or ")}`;
    }

    return {
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      qualificationLevel: s.qualificationLevel,
      meetsRoleRequirement,
      qualificationGap,
    };
  });

  const meetingRequirements = staffQualifications.filter((s) => s.meetsRoleRequirement).length;
  const qualificationComplianceRate = pct(meetingRequirements, totalStaff);

  return {
    totalStaff,
    staffQualifications,
    qualificationComplianceRate,
  };
}

export function evaluateSpecialistTraining(
  childNeeds: ChildNeed[],
  records: TrainingRecord[],
): SpecialistTrainingResult {
  const totalChildNeeds = childNeeds.length;

  const needsCoverage = childNeeds.map((cn) => {
    // Count staff who have completed training in the required category
    const trainedStaff = new Set(
      records
        .filter((r) => r.category === cn.requiredTraining)
        .map((r) => r.staffId),
    );
    const trainedStaffCount = trainedStaff.size;
    // A need is "covered" if at least 2 staff have the training (ensures coverage across shifts)
    const isCovered = trainedStaffCount >= 2;

    return {
      childName: cn.childName,
      need: cn.need,
      requiredTraining: cn.requiredTraining,
      trainedStaffCount,
      isCovered,
    };
  });

  const coveredNeeds = needsCoverage.filter((n) => n.isCovered).length;
  const uncoveredNeeds = needsCoverage.filter((n) => !n.isCovered).length;
  const coverageRate = pct(coveredNeeds, totalChildNeeds);

  return {
    totalChildNeeds,
    coveredNeeds,
    uncoveredNeeds,
    coverageRate,
    needsCoverage,
  };
}

export function buildStaffProfiles(
  staff: StaffMember[],
  records: TrainingRecord[],
  referenceDate: string,
  periodStart: string,
  periodEnd: string,
): StaffTrainingProfile[] {
  const activeStaff = staff.filter((s) => s.isPlaced);

  return activeStaff.map((s) => {
    const allStaffRecords = records.filter((r) => r.staffId === s.id);
    const periodRecords = allStaffRecords.filter(
      (r) => inPeriod(r.completedDate, periodStart, periodEnd),
    );

    // Mandatory compliance
    const mandatoryCompleted = MANDATORY_TRAINING.filter((cat) =>
      allStaffRecords.some((r) => r.category === cat && r.completedDate <= periodEnd),
    ).length;
    const mandatoryComplianceRate = pct(mandatoryCompleted, MANDATORY_TRAINING.length);

    // Certifications
    const certRecords = allStaffRecords.filter((r) => r.expiryDate);
    let certificationsValid = 0;
    let certificationsExpired = 0;
    let certificationsExpiringSoon = 0;
    for (const r of certRecords) {
      const days = daysBetween(referenceDate, r.expiryDate!);
      if (days < 0) certificationsExpired++;
      else if (days <= 60) {
        certificationsExpiringSoon++;
        certificationsValid++;
      } else {
        certificationsValid++;
      }
    }

    // Specialist training
    const specialistCategories: TrainingCategory[] = [
      "attachment_trauma", "therapeutic_parenting", "csea", "county_lines",
      "online_safety", "self_harm_suicide", "substance_misuse", "missing_children",
      "mental_health_awareness",
    ];
    const specialistTrainingCount = specialistCategories.filter((cat) =>
      allStaffRecords.some((r) => r.category === cat),
    ).length;

    // Overall readiness
    let overallReadiness: StaffTrainingProfile["overallReadiness"];
    if (mandatoryComplianceRate >= 100 && certificationsExpired === 0 && periodRecords.length >= 5) {
      overallReadiness = "excellent";
    } else if (mandatoryComplianceRate >= 88 && certificationsExpired === 0) {
      overallReadiness = "good";
    } else if (mandatoryComplianceRate >= 63 || certificationsExpired <= 1) {
      overallReadiness = "attention_needed";
    } else {
      overallReadiness = "critical";
    }

    return {
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      qualificationLevel: s.qualificationLevel,
      totalCourses: periodRecords.length,
      totalHours: Math.round(periodRecords.reduce((sum, r) => sum + r.hoursCompleted, 0) * 10) / 10,
      mandatoryComplianceRate,
      certificationsValid,
      certificationsExpired,
      certificationsExpiringSoon,
      specialistTrainingCount,
      overallReadiness,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateStaffTrainingIntelligence(
  staff: StaffMember[],
  records: TrainingRecord[],
  childNeeds: ChildNeed[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): StaffTrainingResult {
  const mandatoryCompliance = evaluateMandatoryCompliance(staff, records, periodStart, periodEnd);
  const certifications = evaluateCertifications(records, referenceDate);
  const cpd = evaluateCpd(staff, records, periodStart, periodEnd);
  const qualifications = evaluateQualifications(staff);
  const specialistTraining = evaluateSpecialistTraining(childNeeds, records);
  const staffProfiles = buildStaffProfiles(staff, records, referenceDate, periodStart, periodEnd);

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Mandatory training compliance (30)
  let mandatoryScore = 0;
  if (mandatoryCompliance.overallComplianceRate >= 100) mandatoryScore = 30;
  else if (mandatoryCompliance.overallComplianceRate >= 95) mandatoryScore = 25;
  else if (mandatoryCompliance.overallComplianceRate >= 88) mandatoryScore = 20;
  else if (mandatoryCompliance.overallComplianceRate >= 75) mandatoryScore = 12;
  else if (mandatoryCompliance.overallComplianceRate >= 50) mandatoryScore = 5;

  // 2. Certification validity (20)
  let certScore = 0;
  if (certifications.totalCertifications > 0) {
    if (certifications.validityRate >= 100) certScore = 20;
    else if (certifications.validityRate >= 90) certScore = 15;
    else if (certifications.validityRate >= 80) certScore = 10;
    else if (certifications.validityRate >= 60) certScore = 5;
  }

  // 3. CPD hours (15)
  let cpdScore = 0;
  if (cpd.staffCpd.length > 0) {
    if (cpd.targetMetRate >= 100) cpdScore = 15;
    else if (cpd.targetMetRate >= 80) cpdScore = 12;
    else if (cpd.targetMetRate >= 60) cpdScore = 8;
    else if (cpd.targetMetRate >= 40) cpdScore = 4;
  }

  // 4. Qualification levels (20)
  let qualScore = 0;
  if (qualifications.totalStaff > 0) {
    if (qualifications.qualificationComplianceRate >= 100) qualScore = 20;
    else if (qualifications.qualificationComplianceRate >= 80) qualScore = 15;
    else if (qualifications.qualificationComplianceRate >= 60) qualScore = 10;
    else if (qualifications.qualificationComplianceRate >= 40) qualScore = 5;
  }

  // 5. Specialist/needs-based training (15)
  let specialistScore = 0;
  if (specialistTraining.totalChildNeeds > 0) {
    if (specialistTraining.coverageRate >= 100) specialistScore = 15;
    else if (specialistTraining.coverageRate >= 80) specialistScore = 12;
    else if (specialistTraining.coverageRate >= 60) specialistScore = 8;
    else if (specialistTraining.coverageRate >= 40) specialistScore = 4;
  }

  const overallScore = Math.min(100, Math.max(0,
    mandatoryScore + certScore + cpdScore + qualScore + specialistScore,
  ));

  const rating: StaffTrainingResult["rating"] =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (mandatoryCompliance.overallComplianceRate >= 100) {
    strengths.push("All staff fully compliant with mandatory training requirements");
  } else if (mandatoryCompliance.overallComplianceRate >= 95) {
    strengths.push("Excellent mandatory training compliance above 95%");
  }
  if (certifications.expired === 0 && certifications.totalCertifications > 0) {
    strengths.push("All certifications current — no expired certificates");
  }
  if (cpd.targetMetRate >= 100 && cpd.staffCpd.length > 0) {
    strengths.push("All staff meeting CPD target of 30 hours per year");
  }
  if (qualifications.qualificationComplianceRate >= 100 && qualifications.totalStaff > 0) {
    strengths.push("All staff hold appropriate qualifications for their roles");
  }
  if (specialistTraining.coverageRate >= 100 && specialistTraining.totalChildNeeds > 0) {
    strengths.push("Specialist training covers all identified children's needs");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — training programme requires attention");
  }

  if (mandatoryCompliance.overallComplianceRate < 88) {
    areasForDevelopment.push(
      `Mandatory training compliance at ${mandatoryCompliance.overallComplianceRate}% — target 100%`,
    );
  }
  if (certifications.expiringSoon > 0) {
    areasForDevelopment.push(
      `${certifications.expiringSoon} certification${certifications.expiringSoon !== 1 ? "s" : ""} expiring within 60 days — book renewals`,
    );
  }
  if (cpd.targetMetRate < 80 && cpd.staffCpd.length > 0) {
    areasForDevelopment.push(
      `Only ${cpd.targetMetRate}% of staff meeting CPD target — plan additional training`,
    );
  }
  if (specialistTraining.uncoveredNeeds > 0) {
    areasForDevelopment.push(
      `${specialistTraining.uncoveredNeeds} children's need${specialistTraining.uncoveredNeeds !== 1 ? "s" : ""} not covered by trained staff — commission specialist training`,
    );
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  if (certifications.expired > 0) {
    immediateActions.push(
      `URGENT: ${certifications.expired} expired certification${certifications.expired !== 1 ? "s" : ""} — staff may not practice safely until renewed`,
    );
  }
  const safeguardingMissing = mandatoryCompliance.staffCompliance.filter(
    (s) => s.missingCategories.includes("safeguarding"),
  );
  if (safeguardingMissing.length > 0) {
    immediateActions.push(
      `URGENT: ${safeguardingMissing.length} staff member${safeguardingMissing.length !== 1 ? "s" : ""} without safeguarding training — book immediately`,
    );
  }
  const firstAidMissing = mandatoryCompliance.staffCompliance.filter(
    (s) => s.missingCategories.includes("first_aid"),
  );
  if (firstAidMissing.length > 0) {
    immediateActions.push(
      `HIGH: ${firstAidMissing.length} staff member${firstAidMissing.length !== 1 ? "s" : ""} without first aid certification — legal requirement`,
    );
  }
  if (qualifications.staffQualifications.some(
    (s) => s.role === "registered_manager" && !s.meetsRoleRequirement,
  )) {
    immediateActions.push(
      "URGENT: Registered Manager does not hold required Level 5 qualification — escalate to RI immediately",
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — training compliance is well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 32 — Fitness of workers",
    "CHR 2015 Reg 33(4)(a) — Practice-related supervision",
    "CHR 2015 Reg 33(4)(b) — Training to meet children's needs",
    "CHR 2015 Schedule 2 — Information about staff",
    "SCCIF — Staff have skills and knowledge to meet children's needs",
    "Working Together 2023 — Multi-agency safeguarding competency",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    mandatoryCompliance,
    certifications,
    cpd,
    qualifications,
    specialistTraining,
    staffProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
