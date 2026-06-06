// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Record Quality & Timeliness Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "The quality of records is a direct indicator of the quality of care."
// — Ofsted SCCIF guidance
//
// Regulatory framework:
//   CHR 2015 Reg 36         — Records (maintained, up to date, accurate)
//   CHR 2015 Schedule 3     — Records to be maintained
//   CHR 2015 Reg 37         — Access to records (secure, appropriate)
//   CHR 2015 Reg 40         — Notifications within timescales
//   SCCIF                   — "Records are clear, up to date, stored safely"
//   Data Protection Act 2018 / UK-GDPR — Accuracy principle
//   Working Together 2023    — Information sharing and recording
//
// Key requirements:
//   1. Daily logs completed for every shift
//   2. Incident records within 24 hours
//   3. Restraint records within 24 hours (ideally same shift)
//   4. Missing child records completed immediately
//   5. Key-work session records within 48 hours
//   6. Risk assessments reviewed at prescribed intervals
//   7. Medication records accurate and contemporaneous
//   8. Care plan reviews documented within 5 working days
//   9. Records signed off by appropriate staff
//  10. Cross-referencing between related records
//
// Scoring breakdown (0–100):
//   Completion rate:         25  — All required records present
//   Timeliness:              25  — Records completed within timescales
//   Quality (fields):        20  — Mandatory fields completed
//   Sign-off & approval:     15  — Manager/supervisor sign-off
//   Cross-referencing:       15  — Related records linked
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecordType =
  | "daily_log"
  | "incident"
  | "restraint"
  | "missing_child"
  | "key_work"
  | "risk_assessment"
  | "medication"
  | "care_plan_review"
  | "contact_record"
  | "supervision"
  | "health_assessment"
  | "safeguarding_referral";

export type RecordStatus =
  | "draft"
  | "completed"
  | "signed_off"
  | "queried"
  | "amended";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface RecordEntry {
  id: string;
  recordType: RecordType;
  date: string;                   // date the event/shift occurred
  createdAt: string;              // when the record was actually written
  createdBy: string;              // staff ID
  createdByName: string;
  status: RecordStatus;
  signedOffBy?: string;           // manager/supervisor who signed off
  signedOffAt?: string;
  mandatoryFieldsTotal: number;
  mandatoryFieldsCompleted: number;
  wordCount: number;              // length of narrative
  crossReferencedRecords: string[]; // IDs of linked records
  childIds: string[];             // children this record relates to
  qualityNotes?: string;          // audit notes on quality
}

export interface RecordExpectation {
  recordType: RecordType;
  date: string;                   // date a record was expected
  fulfilled: boolean;
  recordId?: string;              // matching record if fulfilled
}

export interface StaffRecordProfile {
  staffId: string;
  staffName: string;
  totalRecords: number;
  completionRate: number;
  averageTimeliness: number;      // hours from event to record
  averageFieldCompletion: number; // %
  signOffRate: number;            // %
  averageWordCount: number;
  crossReferenceRate: number;     // %
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface CompletionResult {
  totalExpected: number;
  totalFulfilled: number;
  completionRate: number;
  missingByType: { recordType: RecordType; expected: number; missing: number }[];
}

export interface TimelinessResult {
  totalRecords: number;
  withinTimescale: number;
  timelinessRate: number;
  averageDelayHours: number;
  lateByType: { recordType: RecordType; count: number; avgDelayHours: number }[];
}

export interface QualityResult {
  totalRecords: number;
  averageFieldCompletion: number; // %
  averageWordCount: number;
  recordsBelowMinWords: number;   // records with < 50 words
  typeBreakdown: { recordType: RecordType; count: number; avgFieldCompletion: number; avgWordCount: number }[];
}

export interface SignOffResult {
  totalRecords: number;
  signedOff: number;
  signOffRate: number;
  pendingSignOff: number;
  queriedRecords: number;
  typeBreakdown: { recordType: RecordType; total: number; signedOff: number }[];
}

export interface CrossReferenceResult {
  totalRecords: number;
  withCrossReferences: number;
  crossReferenceRate: number;
  incidentsWithoutDailyLog: number;
  restraintsWithoutIncident: number;
  missingWithoutSafeguarding: number;
}

export interface RecordQualityResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  completion: CompletionResult;
  timeliness: TimelinessResult;
  quality: QualityResult;
  signOff: SignOffResult;
  crossReferencing: CrossReferenceResult;
  staffProfiles: StaffRecordProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  daily_log: "Daily Log",
  incident: "Incident Record",
  restraint: "Restraint Record",
  missing_child: "Missing Child Record",
  key_work: "Key-Work Session",
  risk_assessment: "Risk Assessment",
  medication: "Medication Record",
  care_plan_review: "Care Plan Review",
  contact_record: "Contact Record",
  supervision: "Supervision Record",
  health_assessment: "Health Assessment",
  safeguarding_referral: "Safeguarding Referral",
};

// Maximum hours from event to record before considered "late"
const TIMESCALES: Record<RecordType, number> = {
  daily_log: 4,              // end of shift
  incident: 24,              // within 24 hours
  restraint: 24,             // within 24 hours (ideally same shift)
  missing_child: 2,          // immediately / within 2 hours
  key_work: 48,              // within 2 working days
  risk_assessment: 120,      // within 5 working days
  medication: 1,             // contemporaneous
  care_plan_review: 120,     // within 5 working days of review
  contact_record: 24,        // within 24 hours
  supervision: 72,           // within 3 working days
  health_assessment: 120,    // within 5 working days
  safeguarding_referral: 4,  // same day / within 4 hours
};

// Minimum word count before flagged as too brief
const MIN_WORD_COUNTS: Record<RecordType, number> = {
  daily_log: 50,
  incident: 100,
  restraint: 150,
  missing_child: 100,
  key_work: 80,
  risk_assessment: 100,
  medication: 20,
  care_plan_review: 100,
  contact_record: 50,
  supervision: 80,
  health_assessment: 80,
  safeguarding_referral: 100,
};

export function getRecordTypeLabel(t: RecordType): string {
  return RECORD_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getTimescaleHours(t: RecordType): number {
  return TIMESCALES[t];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function hoursBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.max(0, diff / (1000 * 60 * 60));
}

// ── Core Functions ────────────────────────────────────────────────────────────

export function evaluateCompletion(
  expectations: RecordExpectation[],
  periodStart: string,
  periodEnd: string,
): CompletionResult {
  const periodExpectations = expectations.filter((e) =>
    inPeriod(e.date, periodStart, periodEnd),
  );
  const totalExpected = periodExpectations.length;
  const totalFulfilled = periodExpectations.filter((e) => e.fulfilled).length;
  const completionRate = pct(totalFulfilled, totalExpected);

  // Missing by type
  const typeMap = new Map<RecordType, { expected: number; missing: number }>();
  for (const e of periodExpectations) {
    const existing = typeMap.get(e.recordType) ?? { expected: 0, missing: 0 };
    existing.expected++;
    if (!e.fulfilled) existing.missing++;
    typeMap.set(e.recordType, existing);
  }
  const missingByType = Array.from(typeMap.entries())
    .map(([recordType, { expected, missing }]) => ({ recordType, expected, missing }))
    .filter((t) => t.missing > 0)
    .sort((a, b) => b.missing - a.missing);

  return { totalExpected, totalFulfilled, completionRate, missingByType };
}

export function evaluateTimeliness(
  records: RecordEntry[],
  periodStart: string,
  periodEnd: string,
): TimelinessResult {
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = periodRecords.length;

  let withinTimescale = 0;
  let totalDelayHours = 0;
  const lateMap = new Map<RecordType, { count: number; totalDelay: number }>();

  for (const r of periodRecords) {
    const maxHours = TIMESCALES[r.recordType];
    const delay = hoursBetween(r.date, r.createdAt);
    if (delay <= maxHours) {
      withinTimescale++;
    } else {
      const existing = lateMap.get(r.recordType) ?? { count: 0, totalDelay: 0 };
      existing.count++;
      existing.totalDelay += delay;
      lateMap.set(r.recordType, existing);
    }
    totalDelayHours += delay;
  }

  const timelinessRate = pct(withinTimescale, totalRecords);
  const averageDelayHours =
    totalRecords === 0
      ? 0
      : Math.round((totalDelayHours / totalRecords) * 10) / 10;

  const lateByType = Array.from(lateMap.entries())
    .map(([recordType, { count, totalDelay }]) => ({
      recordType,
      count,
      avgDelayHours: Math.round((totalDelay / count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  return { totalRecords, withinTimescale, timelinessRate, averageDelayHours, lateByType };
}

export function evaluateQuality(
  records: RecordEntry[],
  periodStart: string,
  periodEnd: string,
): QualityResult {
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = periodRecords.length;

  const totalFieldCompletion = periodRecords.reduce(
    (sum, r) =>
      sum +
      (r.mandatoryFieldsTotal > 0
        ? (r.mandatoryFieldsCompleted / r.mandatoryFieldsTotal) * 100
        : 100),
    0,
  );
  const averageFieldCompletion =
    totalRecords === 0 ? 0 : Math.round(totalFieldCompletion / totalRecords);

  const totalWordCount = periodRecords.reduce(
    (sum, r) => sum + r.wordCount,
    0,
  );
  const averageWordCount =
    totalRecords === 0 ? 0 : Math.round(totalWordCount / totalRecords);

  const recordsBelowMinWords = periodRecords.filter(
    (r) => r.wordCount < (MIN_WORD_COUNTS[r.recordType] ?? 50),
  ).length;

  // Type breakdown
  const typeMap = new Map<
    RecordType,
    { count: number; fieldSum: number; wordSum: number }
  >();
  for (const r of periodRecords) {
    const existing = typeMap.get(r.recordType) ?? {
      count: 0,
      fieldSum: 0,
      wordSum: 0,
    };
    existing.count++;
    existing.fieldSum +=
      r.mandatoryFieldsTotal > 0
        ? (r.mandatoryFieldsCompleted / r.mandatoryFieldsTotal) * 100
        : 100;
    existing.wordSum += r.wordCount;
    typeMap.set(r.recordType, existing);
  }
  const typeBreakdown = Array.from(typeMap.entries())
    .map(([recordType, { count, fieldSum, wordSum }]) => ({
      recordType,
      count,
      avgFieldCompletion: Math.round(fieldSum / count),
      avgWordCount: Math.round(wordSum / count),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRecords,
    averageFieldCompletion,
    averageWordCount,
    recordsBelowMinWords,
    typeBreakdown,
  };
}

export function evaluateSignOff(
  records: RecordEntry[],
  periodStart: string,
  periodEnd: string,
): SignOffResult {
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = periodRecords.length;
  const signedOff = periodRecords.filter(
    (r) => r.status === "signed_off",
  ).length;
  const signOffRate = pct(signedOff, totalRecords);
  const pendingSignOff = periodRecords.filter(
    (r) => r.status === "completed",
  ).length;
  const queriedRecords = periodRecords.filter(
    (r) => r.status === "queried",
  ).length;

  // Type breakdown
  const typeMap = new Map<RecordType, { total: number; signedOff: number }>();
  for (const r of periodRecords) {
    const existing = typeMap.get(r.recordType) ?? { total: 0, signedOff: 0 };
    existing.total++;
    if (r.status === "signed_off") existing.signedOff++;
    typeMap.set(r.recordType, existing);
  }
  const typeBreakdown = Array.from(typeMap.entries())
    .map(([recordType, { total, signedOff: so }]) => ({
      recordType,
      total,
      signedOff: so,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalRecords,
    signedOff,
    signOffRate,
    pendingSignOff,
    queriedRecords,
    typeBreakdown,
  };
}

export function evaluateCrossReferencing(
  records: RecordEntry[],
  periodStart: string,
  periodEnd: string,
): CrossReferenceResult {
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = periodRecords.length;
  const withCrossReferences = periodRecords.filter(
    (r) => r.crossReferencedRecords.length > 0,
  ).length;
  const crossReferenceRate = pct(withCrossReferences, totalRecords);

  // Incidents should have a daily log cross-reference
  const incidents = periodRecords.filter((r) => r.recordType === "incident");
  const dailyLogs = periodRecords.filter((r) => r.recordType === "daily_log");
  const dailyLogIds = new Set(dailyLogs.map((r) => r.id));
  const incidentsWithoutDailyLog = incidents.filter(
    (r) => !r.crossReferencedRecords.some((ref) => dailyLogIds.has(ref)),
  ).length;

  // Restraints should reference an incident
  const restraints = periodRecords.filter((r) => r.recordType === "restraint");
  const incidentIds = new Set(incidents.map((r) => r.id));
  const restraintsWithoutIncident = restraints.filter(
    (r) => !r.crossReferencedRecords.some((ref) => incidentIds.has(ref)),
  ).length;

  // Missing child should reference safeguarding if applicable
  const missing = periodRecords.filter((r) => r.recordType === "missing_child");
  const safeguarding = periodRecords.filter(
    (r) => r.recordType === "safeguarding_referral",
  );
  const safeguardingIds = new Set(safeguarding.map((r) => r.id));
  const missingWithoutSafeguarding = missing.filter(
    (r) => !r.crossReferencedRecords.some((ref) => safeguardingIds.has(ref)),
  ).length;

  return {
    totalRecords,
    withCrossReferences,
    crossReferenceRate,
    incidentsWithoutDailyLog,
    restraintsWithoutIncident,
    missingWithoutSafeguarding,
  };
}

export function buildStaffProfiles(
  records: RecordEntry[],
  periodStart: string,
  periodEnd: string,
): StaffRecordProfile[] {
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));

  const staffMap = new Map<
    string,
    {
      name: string;
      records: RecordEntry[];
    }
  >();

  for (const r of periodRecords) {
    const existing = staffMap.get(r.createdBy) ?? {
      name: r.createdByName,
      records: [],
    };
    existing.records.push(r);
    staffMap.set(r.createdBy, existing);
  }

  return Array.from(staffMap.entries()).map(([staffId, { name, records: staffRecords }]) => {
    const totalRecords = staffRecords.length;
    const signedOff = staffRecords.filter((r) => r.status === "signed_off").length;
    const withCrossRef = staffRecords.filter((r) => r.crossReferencedRecords.length > 0).length;

    const totalDelay = staffRecords.reduce(
      (sum, r) => sum + hoursBetween(r.date, r.createdAt),
      0,
    );
    const totalFieldPct = staffRecords.reduce(
      (sum, r) =>
        sum +
        (r.mandatoryFieldsTotal > 0
          ? (r.mandatoryFieldsCompleted / r.mandatoryFieldsTotal) * 100
          : 100),
      0,
    );
    const totalWords = staffRecords.reduce((sum, r) => sum + r.wordCount, 0);

    return {
      staffId,
      staffName: name,
      totalRecords,
      completionRate: 100, // all records here exist = 100% for their authored records
      averageTimeliness: totalRecords === 0 ? 0 : Math.round((totalDelay / totalRecords) * 10) / 10,
      averageFieldCompletion: totalRecords === 0 ? 0 : Math.round(totalFieldPct / totalRecords),
      signOffRate: pct(signedOff, totalRecords),
      averageWordCount: totalRecords === 0 ? 0 : Math.round(totalWords / totalRecords),
      crossReferenceRate: pct(withCrossRef, totalRecords),
    };
  }).sort((a, b) => b.totalRecords - a.totalRecords);
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateRecordQualityIntelligence(
  records: RecordEntry[],
  expectations: RecordExpectation[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RecordQualityResult {
  const completion = evaluateCompletion(expectations, periodStart, periodEnd);
  const timeliness = evaluateTimeliness(records, periodStart, periodEnd);
  const quality = evaluateQuality(records, periodStart, periodEnd);
  const signOff = evaluateSignOff(records, periodStart, periodEnd);
  const crossReferencing = evaluateCrossReferencing(records, periodStart, periodEnd);
  const staffProfiles = buildStaffProfiles(records, periodStart, periodEnd);

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Completion rate (25)
  let completionScore = 0;
  if (completion.completionRate >= 98) completionScore = 25;
  else if (completion.completionRate >= 95) completionScore = 20;
  else if (completion.completionRate >= 90) completionScore = 15;
  else if (completion.completionRate >= 80) completionScore = 10;
  else if (completion.completionRate >= 60) completionScore = 5;

  // 2. Timeliness (25)
  let timelinessScore = 0;
  if (timeliness.timelinessRate >= 95) timelinessScore = 25;
  else if (timeliness.timelinessRate >= 90) timelinessScore = 20;
  else if (timeliness.timelinessRate >= 80) timelinessScore = 15;
  else if (timeliness.timelinessRate >= 70) timelinessScore = 10;
  else if (timeliness.timelinessRate >= 50) timelinessScore = 5;

  // 3. Quality / fields (20)
  let qualityScore = 0;
  if (quality.averageFieldCompletion >= 95) qualityScore += 10;
  else if (quality.averageFieldCompletion >= 85) qualityScore += 7;
  else if (quality.averageFieldCompletion >= 70) qualityScore += 4;

  const belowMinRate = pct(quality.recordsBelowMinWords, quality.totalRecords);
  if (quality.totalRecords > 0 && belowMinRate <= 5) qualityScore += 10;
  else if (quality.totalRecords > 0 && belowMinRate <= 15) qualityScore += 7;
  else if (quality.totalRecords > 0 && belowMinRate <= 30) qualityScore += 3;

  qualityScore = Math.min(qualityScore, 20);

  // 4. Sign-off (15)
  let signOffScore = 0;
  if (signOff.signOffRate >= 90) signOffScore = 15;
  else if (signOff.signOffRate >= 75) signOffScore = 10;
  else if (signOff.signOffRate >= 60) signOffScore = 7;
  else if (signOff.signOffRate >= 40) signOffScore = 3;

  // 5. Cross-referencing (15)
  let crossRefScore = 0;
  if (crossReferencing.crossReferenceRate >= 80) crossRefScore += 8;
  else if (crossReferencing.crossReferenceRate >= 60) crossRefScore += 5;
  else if (crossReferencing.crossReferenceRate >= 40) crossRefScore += 2;

  const gapPenalty =
    crossReferencing.incidentsWithoutDailyLog +
    crossReferencing.restraintsWithoutIncident +
    crossReferencing.missingWithoutSafeguarding;
  if (crossReferencing.totalRecords > 0 && gapPenalty === 0) crossRefScore += 7;
  else if (crossReferencing.totalRecords > 0 && gapPenalty <= 2) crossRefScore += 4;
  else if (crossReferencing.totalRecords > 0 && gapPenalty <= 5) crossRefScore += 1;

  crossRefScore = Math.min(crossRefScore, 15);

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      completionScore + timelinessScore + qualityScore + signOffScore + crossRefScore,
    ),
  );

  const rating: RecordQualityResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (completion.completionRate >= 98) {
    strengths.push("Outstanding record completion — virtually no missing records");
  } else if (completion.completionRate >= 95) {
    strengths.push("Excellent record completion rate above 95%");
  }
  if (timeliness.timelinessRate >= 95) {
    strengths.push("Records consistently completed within required timescales");
  }
  if (signOff.signOffRate >= 90) {
    strengths.push("Strong management oversight — 90%+ records signed off");
  }
  if (crossReferencing.crossReferenceRate >= 80) {
    strengths.push("Good cross-referencing between related records");
  }
  if (quality.averageFieldCompletion >= 95) {
    strengths.push("Mandatory fields consistently completed across all record types");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — record quality requires attention");
  }

  if (completion.completionRate < 90) {
    areasForDevelopment.push(
      `Record completion rate at ${completion.completionRate}% — target 95%+`,
    );
  }
  if (timeliness.timelinessRate < 80) {
    areasForDevelopment.push(
      `${timeliness.timelinessRate}% records within timescale — target 90%+`,
    );
  }
  if (signOff.signOffRate < 75) {
    areasForDevelopment.push(
      `Sign-off rate at ${signOff.signOffRate}% — manager review needed more frequently`,
    );
  }
  if (quality.recordsBelowMinWords > 0) {
    areasForDevelopment.push(
      `${quality.recordsBelowMinWords} record${quality.recordsBelowMinWords !== 1 ? "s" : ""} below minimum word count — improve detail`,
    );
  }
  if (crossReferencing.crossReferenceRate < 60) {
    areasForDevelopment.push("Cross-referencing between related records needs improvement");
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  if (completion.missingByType.some((t) =>
    t.recordType === "safeguarding_referral" || t.recordType === "restraint" || t.recordType === "missing_child",
  )) {
    const critical = completion.missingByType.filter(
      (t) =>
        t.recordType === "safeguarding_referral" ||
        t.recordType === "restraint" ||
        t.recordType === "missing_child",
    );
    for (const c of critical) {
      immediateActions.push(
        `URGENT: ${c.missing} missing ${getRecordTypeLabel(c.recordType)} record${c.missing !== 1 ? "s" : ""} — complete immediately`,
      );
    }
  }
  if (timeliness.lateByType.some((t) =>
    (t.recordType === "safeguarding_referral" || t.recordType === "missing_child") && t.avgDelayHours > 24,
  )) {
    immediateActions.push(
      "URGENT: Critical records completed significantly past timescale — review recording processes",
    );
  }
  if (signOff.queriedRecords > 0) {
    immediateActions.push(
      `HIGH: ${signOff.queriedRecords} record${signOff.queriedRecords !== 1 ? "s" : ""} queried by management — address and resubmit`,
    );
  }
  if (crossReferencing.restraintsWithoutIncident > 0) {
    immediateActions.push(
      `HIGH: ${crossReferencing.restraintsWithoutIncident} restraint record${crossReferencing.restraintsWithoutIncident !== 1 ? "s" : ""} without linked incident record — cross-reference immediately`,
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — record quality standards are well maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 36 — Records (maintained, up to date, accurate)",
    "CHR 2015 Schedule 3 — Records to be maintained",
    "CHR 2015 Reg 37 — Access to records and secure storage",
    "CHR 2015 Reg 40 — Notifications within prescribed timescales",
    "SCCIF — Records are clear, up to date, and stored safely",
    "Data Protection Act 2018 — Accuracy principle",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    completion,
    timeliness,
    quality,
    signOff,
    crossReferencing,
    staffProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
