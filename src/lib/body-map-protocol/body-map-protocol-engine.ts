import { below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// BODY MAP PROTOCOL INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing the quality and compliance of
// body map documentation — recording physical marks, bruises, and injuries
// on children in residential care. Critical safeguarding function.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Safeguarding (recording concerns)
//   - CHR 2015, Reg 35 — Behaviour management (restraint injuries)
//   - KCSIE 2024 — Record keeping and information sharing
//   - SCCIF — How well children are helped and protected
//   - NMS 3 — Safeguarding children
//   - Working Together 2023 — Information sharing
//   - UNCRC Article 19 — Protection from violence
//
// No AI. No external calls. Pure input → output.
// ==============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export type MarkType =
  | "bruise"
  | "scratch"
  | "cut"
  | "burn"
  | "bite"
  | "swelling"
  | "rash"
  | "other_mark";

export type MarkOrigin =
  | "accidental_explained"
  | "accidental_unexplained"
  | "self_inflicted"
  | "alleged_peer"
  | "alleged_adult"
  | "restraint_related"
  | "unknown"
  | "pre_existing";

export type DocumentationQuality =
  | "thorough"
  | "adequate"
  | "incomplete"
  | "not_documented";

export type BodyRegion =
  | "head_face"
  | "neck"
  | "torso_front"
  | "torso_back"
  | "upper_limbs"
  | "lower_limbs"
  | "hands_feet"
  | "intimate_areas";

export type ActionTaken =
  | "gp_referral"
  | "hospital_attendance"
  | "photograph_taken"
  | "safeguarding_referral"
  | "police_notified"
  | "parent_notified"
  | "social_worker_notified"
  | "monitoring_only"
  | "no_action_required";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface BodyMapRecord {
  id: string;
  childId: string;
  childName: string;
  dateRecorded: string;
  recordedBy: string;
  markType: MarkType;
  markOrigin: MarkOrigin;
  bodyRegion: BodyRegion;
  documentationQuality: DocumentationQuality;
  childExplanationSought: boolean;
  childExplanationRecorded: boolean;
  witnessPresent: boolean;
  photographTaken: boolean;
  dateDiscovered: string;
  timelyRecording: boolean;
  actionsTaken: ActionTaken[];
  managerInformed: boolean;
  followUpRequired: boolean;
  followUpCompleted: boolean | null;
}

export interface BodyMapAudit {
  id: string;
  auditDate: string;
  auditor: string;
  protocolAccessible: boolean;
  staffTrained: boolean;
  templatesCurrent: boolean;
  storageSecure: boolean;
  retentionCompliant: boolean;
  crossReferencedWithIncidents: boolean;
  overallCompliant: boolean;
}

export interface BodyMapTraining {
  id: string;
  staffId: string;
  staffName: string;
  trainingDate: string;
  bodyMapTrained: boolean;
  safeguardingAwareness: boolean;
  photographyProtocol: boolean;
  documentationStandards: boolean;
  escalationProcedure: boolean;
}

export interface SafeguardingEscalation {
  id: string;
  bodyMapId: string;
  childId: string;
  childName: string;
  escalationDate: string;
  escalatedTo: string;
  referralMade: boolean;
  outcomeRecorded: boolean;
  timelyEscalation: boolean;
  appropriateResponse: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RecordingQualityResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  thoroughRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childExplanationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  photographRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  managerInformedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  followUpCompletedRate: number | null;
  markTypeDistribution: Record<MarkType, number>;
  originDistribution: Record<MarkOrigin, number>;
  regionDistribution: Record<BodyRegion, number>;
}

export interface AuditComplianceResult {
  overallScore: number;
  totalAudits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  protocolAccessibleRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  storageSecureRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  crossReferencedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  overallCompliantRate: number | null;
}

export interface StaffCompetenceResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  bodyMapTrainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  photographyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  escalationRate: number | null;
}

export interface EscalationEffectivenessResult {
  overallScore: number;
  totalEscalations: number;
  /** null when the population is empty — nothing measured, not 0%. */
  referralMadeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  outcomeRecordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  appropriateRate: number | null;
}

export interface ChildBodyMapProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  thoroughRate: number;
  unexplainedCount: number;
  escalationCount: number;
  commonRegions: BodyRegion[];
  overallScore: number;
}

export interface BodyMapProtocolIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  recordingQuality: RecordingQualityResult;
  auditCompliance: AuditComplianceResult;
  staffCompetence: StaffCompetenceResult;
  escalationEffectiveness: EscalationEffectivenessResult;
  childProfiles: ChildBodyMapProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ────────────────────────────────────────────────────────

const MARK_TYPE_LABELS: Record<MarkType, string> = {
  bruise: "Bruise",
  scratch: "Scratch",
  cut: "Cut",
  burn: "Burn",
  bite: "Bite",
  swelling: "Swelling",
  rash: "Rash",
  other_mark: "Other Mark",
};

const MARK_ORIGIN_LABELS: Record<MarkOrigin, string> = {
  accidental_explained: "Accidental (Explained)",
  accidental_unexplained: "Accidental (Unexplained)",
  self_inflicted: "Self-Inflicted",
  alleged_peer: "Alleged Peer",
  alleged_adult: "Alleged Adult",
  restraint_related: "Restraint Related",
  unknown: "Unknown",
  pre_existing: "Pre-Existing",
};

const DOCUMENTATION_QUALITY_LABELS: Record<DocumentationQuality, string> = {
  thorough: "Thorough",
  adequate: "Adequate",
  incomplete: "Incomplete",
  not_documented: "Not Documented",
};

const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  head_face: "Head / Face",
  neck: "Neck",
  torso_front: "Torso (Front)",
  torso_back: "Torso (Back)",
  upper_limbs: "Upper Limbs",
  lower_limbs: "Lower Limbs",
  hands_feet: "Hands / Feet",
  intimate_areas: "Intimate Areas",
};

const ACTION_TAKEN_LABELS: Record<ActionTaken, string> = {
  gp_referral: "GP Referral",
  hospital_attendance: "Hospital Attendance",
  photograph_taken: "Photograph Taken",
  safeguarding_referral: "Safeguarding Referral",
  police_notified: "Police Notified",
  parent_notified: "Parent Notified",
  social_worker_notified: "Social Worker Notified",
  monitoring_only: "Monitoring Only",
  no_action_required: "No Action Required",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMarkTypeLabel(v: MarkType): string { return MARK_TYPE_LABELS[v]; }
export function getMarkOriginLabel(v: MarkOrigin): string { return MARK_ORIGIN_LABELS[v]; }
export function getDocumentationQualityLabel(v: DocumentationQuality): string { return DOCUMENTATION_QUALITY_LABELS[v]; }
export function getBodyRegionLabel(v: BodyRegion): string { return BODY_REGION_LABELS[v]; }
export function getActionTakenLabel(v: ActionTaken): string { return ACTION_TAKEN_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Evaluators ─────────────────────────────────────────────────────────────

export function evaluateRecordingQuality(records: BodyMapRecord[]): RecordingQualityResult {
  const markTypeDistribution = {} as Record<MarkType, number>;
  for (const t of ["bruise", "scratch", "cut", "burn", "bite", "swelling", "rash", "other_mark"] as MarkType[]) {
    markTypeDistribution[t] = 0;
  }
  const originDistribution = {} as Record<MarkOrigin, number>;
  for (const o of ["accidental_explained", "accidental_unexplained", "self_inflicted", "alleged_peer", "alleged_adult", "restraint_related", "unknown", "pre_existing"] as MarkOrigin[]) {
    originDistribution[o] = 0;
  }
  const regionDistribution = {} as Record<BodyRegion, number>;
  for (const r of ["head_face", "neck", "torso_front", "torso_back", "upper_limbs", "lower_limbs", "hands_feet", "intimate_areas"] as BodyRegion[]) {
    regionDistribution[r] = 0;
  }

  if (records.length === 0) {
    return {
      overallScore: 25, // No marks to record = excellent
      totalRecords: 0,
      thoroughRate: null,
      childExplanationRate: null,
      timelyRecordingRate: null,
      photographRate: null,
      managerInformedRate: null,
      followUpCompletedRate: null,
      markTypeDistribution,
      originDistribution,
      regionDistribution,
    };
  }

  let thorough = 0;
  let childExplanation = 0;
  let timely = 0;
  let photograph = 0;
  let managerInformed = 0;
  let followUpRequired = 0;
  let followUpCompleted = 0;

  for (const r of records) {
    markTypeDistribution[r.markType] = (markTypeDistribution[r.markType] || 0) + 1;
    originDistribution[r.markOrigin] = (originDistribution[r.markOrigin] || 0) + 1;
    regionDistribution[r.bodyRegion] = (regionDistribution[r.bodyRegion] || 0) + 1;

    if (r.documentationQuality === "thorough") thorough++;
    if (r.childExplanationSought && r.childExplanationRecorded) childExplanation++;
    if (r.timelyRecording) timely++;
    if (r.photographTaken) photograph++;
    if (r.managerInformed) managerInformed++;
    if (r.followUpRequired) {
      followUpRequired++;
      if (r.followUpCompleted) followUpCompleted++;
    }
  }

  const thoroughRate = rate(thorough, records.length);
  const childExplanationRate = rate(childExplanation, records.length);
  const timelyRecordingRate = rate(timely, records.length);
  const photographRate = rate(photograph, records.length);
  const managerInformedRate = rate(managerInformed, records.length);
  const followUpCompletedRate = rate(followUpCompleted, followUpRequired);

  // Scoring: thorough rate (0-7), child explanation (0-5), timely (0-5),
  // manager informed (0-4), follow-up completed (0-4)
  let score = 0;
  score += Math.round(((thoroughRate ?? 0) / 100) * 7);
  score += Math.round(((childExplanationRate ?? 0) / 100) * 5);
  score += Math.round(((timelyRecordingRate ?? 0) / 100) * 5);
  score += Math.round(((managerInformedRate ?? 0) / 100) * 4);
  score += Math.round(((followUpCompletedRate ?? 0) / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    thoroughRate,
    childExplanationRate,
    timelyRecordingRate,
    photographRate,
    managerInformedRate,
    followUpCompletedRate,
    markTypeDistribution,
    originDistribution,
    regionDistribution,
  };
}

export function evaluateAuditCompliance(audits: BodyMapAudit[]): AuditComplianceResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      protocolAccessibleRate: null,
      staffTrainedRate: null,
      storageSecureRate: null,
      crossReferencedRate: null,
      overallCompliantRate: null,
    };
  }

  let protocolAccessible = 0;
  let staffTrained = 0;
  let storageSecure = 0;
  let crossReferenced = 0;
  let overallCompliant = 0;

  for (const a of audits) {
    if (a.protocolAccessible) protocolAccessible++;
    if (a.staffTrained) staffTrained++;
    if (a.storageSecure) storageSecure++;
    if (a.crossReferencedWithIncidents) crossReferenced++;
    if (a.overallCompliant) overallCompliant++;
  }

  const protocolAccessibleRate = rate(protocolAccessible, audits.length);
  const staffTrainedRate = rate(staffTrained, audits.length);
  const storageSecureRate = rate(storageSecure, audits.length);
  const crossReferencedRate = rate(crossReferenced, audits.length);
  const overallCompliantRate = rate(overallCompliant, audits.length);

  // Scoring: overall compliant (0-7), storage secure (0-5), protocol accessible (0-4),
  // cross referenced (0-5), staff trained (0-4)
  let score = 0;
  score += Math.round(((overallCompliantRate ?? 0) / 100) * 7);
  score += Math.round(((storageSecureRate ?? 0) / 100) * 5);
  score += Math.round(((protocolAccessibleRate ?? 0) / 100) * 4);
  score += Math.round(((crossReferencedRate ?? 0) / 100) * 5);
  score += Math.round(((staffTrainedRate ?? 0) / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAudits: audits.length,
    protocolAccessibleRate,
    staffTrainedRate,
    storageSecureRate,
    crossReferencedRate,
    overallCompliantRate,
  };
}

export function evaluateStaffCompetence(training: BodyMapTraining[]): StaffCompetenceResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      bodyMapTrainedRate: null,
      safeguardingRate: null,
      photographyRate: null,
      documentationRate: null,
      escalationRate: null,
    };
  }

  let bodyMapTrained = 0;
  let safeguarding = 0;
  let photography = 0;
  let documentation = 0;
  let escalation = 0;

  for (const t of training) {
    if (t.bodyMapTrained) bodyMapTrained++;
    if (t.safeguardingAwareness) safeguarding++;
    if (t.photographyProtocol) photography++;
    if (t.documentationStandards) documentation++;
    if (t.escalationProcedure) escalation++;
  }

  const bodyMapTrainedRate = rate(bodyMapTrained, training.length);
  const safeguardingRate = rate(safeguarding, training.length);
  const photographyRate = rate(photography, training.length);
  const documentationRate = rate(documentation, training.length);
  const escalationRate = rate(escalation, training.length);

  // Scoring: body map trained (0-7), safeguarding (0-6), escalation (0-5),
  // documentation (0-4), photography (0-3)
  let score = 0;
  score += Math.round(((bodyMapTrainedRate ?? 0) / 100) * 7);
  score += Math.round(((safeguardingRate ?? 0) / 100) * 6);
  score += Math.round(((escalationRate ?? 0) / 100) * 5);
  score += Math.round(((documentationRate ?? 0) / 100) * 4);
  score += Math.round(((photographyRate ?? 0) / 100) * 3);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    bodyMapTrainedRate,
    safeguardingRate,
    photographyRate,
    documentationRate,
    escalationRate,
  };
}

export function evaluateEscalationEffectiveness(
  escalations: SafeguardingEscalation[],
  records: BodyMapRecord[],
): EscalationEffectivenessResult {
  // If no records exist, no escalations needed = excellent
  if (records.length === 0) {
    return {
      overallScore: 25,
      totalEscalations: 0,
      referralMadeRate: null,
      outcomeRecordedRate: null,
      timelyRate: null,
      appropriateRate: null,
    };
  }

  // If records exist but no escalations, check if any needed escalation
  const concerningOrigins = records.filter(
    (r) => r.markOrigin === "accidental_unexplained" || r.markOrigin === "alleged_peer" ||
           r.markOrigin === "alleged_adult" || r.markOrigin === "unknown",
  );

  if (escalations.length === 0) {
    // No escalations but concerning marks exist = bad
    if (concerningOrigins.length > 0) return {
      overallScore: 0,
      totalEscalations: 0,
      referralMadeRate: null,
      outcomeRecordedRate: null,
      timelyRate: null,
      appropriateRate: null,
    };
    // No escalations, no concerning marks = good
    return {
      overallScore: 25,
      totalEscalations: 0,
      referralMadeRate: null,
      outcomeRecordedRate: null,
      timelyRate: null,
      appropriateRate: null,
    };
  }

  let referrals = 0;
  let outcomes = 0;
  let timely = 0;
  let appropriate = 0;

  for (const e of escalations) {
    if (e.referralMade) referrals++;
    if (e.outcomeRecorded) outcomes++;
    if (e.timelyEscalation) timely++;
    if (e.appropriateResponse) appropriate++;
  }

  const referralMadeRate = rate(referrals, escalations.length);
  const outcomeRecordedRate = rate(outcomes, escalations.length);
  const timelyRate = rate(timely, escalations.length);
  const appropriateRate = rate(appropriate, escalations.length);

  // Scoring: timely (0-8), appropriate response (0-7), referral (0-5), outcome recorded (0-5)
  let score = 0;
  score += Math.round(((timelyRate ?? 0) / 100) * 8);
  score += Math.round(((appropriateRate ?? 0) / 100) * 7);
  score += Math.round(((referralMadeRate ?? 0) / 100) * 5);
  score += Math.round(((outcomeRecordedRate ?? 0) / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalEscalations: escalations.length,
    referralMadeRate,
    outcomeRecordedRate,
    timelyRate,
    appropriateRate,
  };
}

// ── Child Profiles ─────────────────────────────────────────────────────────

export function buildChildBodyMapProfiles(
  records: BodyMapRecord[],
  escalations: SafeguardingEscalation[],
): ChildBodyMapProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const r of records) {
    childIds.add(r.childId);
    childNames.set(r.childId, r.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childEscalations = escalations.filter((e) => e.childId === childId);

    const thorough = childRecords.filter((r) => r.documentationQuality === "thorough").length;
    const thoroughRate = rate(thorough, childRecords.length)!;

    const unexplained = childRecords.filter(
      (r) => r.markOrigin === "accidental_unexplained" || r.markOrigin === "unknown",
    ).length;

    // Most common regions
    const regionCounts = new Map<BodyRegion, number>();
    for (const r of childRecords) {
      regionCounts.set(r.bodyRegion, (regionCounts.get(r.bodyRegion) || 0) + 1);
    }
    const commonRegions = Array.from(regionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([region]) => region);

    // Score 0-10
    let score = 0;
    score += Math.round(((thoroughRate ?? 0) / 100) * 4);
    if (unexplained === 0) score += 3;
    else if (unexplained === 1) score += 1;
    if (childEscalations.length > 0) {
      const escalationTimely = childEscalations.filter((e) => e.timelyEscalation).length;
      score += Math.round((rate(escalationTimely, childEscalations.length)! / 100) * 3);
    } else if (unexplained === 0) {
      score += 3;
    }

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      totalRecords: childRecords.length,
      thoroughRate,
      unexplainedCount: unexplained,
      escalationCount: childEscalations.length,
      commonRegions,
      overallScore: Math.min(10, score),
    };
  });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateBodyMapProtocolIntelligence(
  records: BodyMapRecord[],
  audits: BodyMapAudit[],
  training: BodyMapTraining[],
  escalations: SafeguardingEscalation[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): BodyMapProtocolIntelligence {
  const recordingQuality = evaluateRecordingQuality(records);
  const auditCompliance = evaluateAuditCompliance(audits);
  const staffCompetence = evaluateStaffCompetence(training);
  const escalationEffectiveness = evaluateEscalationEffectiveness(escalations, records);

  const rawScore =
    recordingQuality.overallScore +
    auditCompliance.overallScore +
    staffCompetence.overallScore +
    escalationEffectiveness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildBodyMapProfiles(records, escalations);

  // ── Strengths ──
  const strengths: string[] = [];
  if (records.length === 0)
    strengths.push("No body map records in period — no physical marks reported");
  if (records.length > 0 && meets(recordingQuality.thoroughRate, 90))
    strengths.push("Excellent documentation quality with " + recordingQuality.thoroughRate + "% thorough records");
  if (records.length > 0 && meets(recordingQuality.timelyRecordingRate, 95))
    strengths.push("Consistent timely recording of body maps");
  if (records.length > 0 && meets(recordingQuality.childExplanationRate, 90))
    strengths.push("Child's voice consistently sought and recorded in body map documentation");
  if (records.length > 0 && recordingQuality.managerInformedRate === 100)
    strengths.push("Manager informed of all body map recordings");
  if (auditCompliance.overallCompliantRate === 100 && audits.length > 0)
    strengths.push("All body map protocol audits fully compliant");
  if (staffCompetence.bodyMapTrainedRate === 100 && training.length > 0)
    strengths.push("All staff trained in body map protocol");
  if (escalations.length > 0 && escalationEffectiveness.timelyRate === 100)
    strengths.push("All safeguarding escalations made in a timely manner");
  if (escalations.length > 0 && escalationEffectiveness.appropriateRate === 100)
    strengths.push("All safeguarding responses assessed as appropriate");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (records.length > 0 && below(recordingQuality.thoroughRate, 80))
    areasForImprovement.push("Documentation quality at " + recordingQuality.thoroughRate + "% thorough — target 80%+");
  if (records.length > 0 && below(recordingQuality.childExplanationRate, 80))
    areasForImprovement.push("Child explanation sought/recorded in only " + recordingQuality.childExplanationRate + "% of body maps");
  if (records.length > 0 && below(recordingQuality.timelyRecordingRate, 90))
    areasForImprovement.push("Timely recording at " + recordingQuality.timelyRecordingRate + "% — all marks should be recorded immediately");
  if (audits.length === 0)
    areasForImprovement.push("No body map protocol audits completed — schedule at least quarterly");
  if (below(staffCompetence.bodyMapTrainedRate, 100) && training.length > 0)
    areasForImprovement.push("Body map training coverage at " + staffCompetence.bodyMapTrainedRate + "% — all staff must be trained");
  if (records.length > 0 && below(recordingQuality.photographRate, 50))
    areasForImprovement.push("Photographs taken in only " + recordingQuality.photographRate + "% of body maps — consider increasing photographic evidence");
  if (records.length > 0 && below(recordingQuality.followUpCompletedRate, 80))
    areasForImprovement.push("Follow-up completion rate at " + recordingQuality.followUpCompletedRate + "%");

  // ── Actions ──
  const actions: string[] = [];
  const unexplainedRecords = records.filter(
    (r) => r.markOrigin === "accidental_unexplained" || r.markOrigin === "unknown" ||
           r.markOrigin === "alleged_adult",
  );
  if (unexplainedRecords.length > 0 && escalations.length === 0)
    actions.push("URGENT: " + unexplainedRecords.length + " unexplained/concerning marks recorded without safeguarding escalation — review immediately");
  if (records.length > 0 && below(recordingQuality.managerInformedRate, 100))
    actions.push("URGENT: Ensure manager is informed of ALL body map recordings — statutory requirement");
  if (staffCompetence.totalStaff > 0 && below(staffCompetence.bodyMapTrainedRate, 75))
    actions.push("URGENT: Arrange body map training for untrained staff — " + (100 - (staffCompetence.bodyMapTrainedRate ?? 0)) + "% require training");
  if (audits.length === 0)
    actions.push("Schedule body map protocol audit within 4 weeks");
  if (records.length > 0 && below(recordingQuality.timelyRecordingRate, 80))
    actions.push("Review timeliness of body map recording — consider same-shift recording policy");
  if (escalations.length > 0 && below(escalationEffectiveness.timelyRate, 80))
    actions.push("Review escalation timeliness — " + (100 - (escalationEffectiveness.timelyRate ?? 0)) + "% were not escalated promptly");
  if (records.length > 0 && below(recordingQuality.childExplanationRate, 60))
    actions.push("Reinforce importance of seeking and recording child's explanation for all marks");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 12 — Safeguarding: duty to record concerns and physical marks on children",
    "CHR 2015, Reg 35 — Behaviour management: recording injuries from physical interventions",
    "KCSIE 2024 — Record keeping: maintaining accurate records for safeguarding purposes",
    "SCCIF — How well children are helped and protected: quality of recording and escalation",
    "NMS 3 — Safeguarding children: robust systems for recording and reporting concerns",
    "Working Together 2023 — Information sharing: timely sharing of safeguarding information",
    "UNCRC Article 19 — Protection from all forms of physical or mental violence",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    recordingQuality,
    auditCompliance,
    staffCompetence,
    escalationEffectiveness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
