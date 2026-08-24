// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DATA GOVERNANCE INTELLIGENCE ENGINE
// Home-level: aggregates data breaches, data protection records, CCTV access
// logs, and subject access requests across the whole home.
// GDPR, Data Protection Act 2018, CHR 2015 Reg 13 (Confidentiality).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface DataBreachInput {
  id: string;
  date_discovered: string;
  date_incident: string;
  breach_type: string;
  severity: string;           // low | medium | high | critical
  near_miss: boolean;
  special_category_data: boolean;
  risk_to_individuals: string; // low | medium | high
  reported_to_ico: boolean;
  ico_reported_date: string;
  data_subjects_notified: boolean;
  notification_date: string;
  immediate_actions_taken: string[];
  root_cause_analysis: string;
  lessons_learned: string[];
  preventive_actions: string[];
  training_arising: string[];
  policy_arising: string;
  status: string;             // investigating | closed_resolved | reported_awaiting_ico | monitoring
  reported_to: string[];
  created_at: string;
}

export interface DataProtectionRecordInput {
  id: string;
  type: string;               // dsar | breach | dpia | consent_review | retention_review
  status: string;             // received | in_progress | completed | overdue | closed
  date_raised: string;
  due_date: string;
  completed_date: string | null;
  breach_severity: string | null;
  ico_notified: boolean;
  remedial_actions: string[];
  lessons_learned: string;
  created_at: string;
}

export interface CCTVAccessInput {
  id: string;
  date: string;
  reason: string;             // incident_review | safeguarding | police_request | complaint_investigation | maintenance_check | routine_review | sar_request | staff_investigation | other
  detail: string;
  accessed_by: string;
  authorised_by: string;
  witness_present: string | null;
  footage_copied: boolean;
  created_at: string;
}

export interface SubjectAccessRequestInput {
  id: string;
  date_received: string;
  deadline_date: string;
  request_type: string;
  status: string;             // received | identity_verified | in_progress | redaction | completed | refused | extended
  identity_verified: boolean;
  redactions_required: boolean;
  extension_applied: boolean;
  date_completed: string | null;
  dpo_consulted: boolean;
  created_at: string;
}

export interface HomeDataGovernanceInput {
  today: string;
  data_breaches: DataBreachInput[];
  data_protection_records: DataProtectionRecordInput[];
  cctv_accesses: CCTVAccessInput[];
  subject_access_requests: SubjectAccessRequestInput[];
  total_staff: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type DataGovernanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BreachProfile {
  total_breaches: number;
  open_breaches: number;
  high_critical_breaches: number;
  near_miss_count: number;
  special_category_count: number;
  ico_reported_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  subjects_notified_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  lessons_documented_rate: number | null;
  by_type: Record<string, number>;
}

export interface DataProtectionProfile {
  total_records: number;
  overdue_records: number;
  completed_records: number;
  /** null when the population is empty — nothing measured, not 0%. */
  completion_rate: number | null;
  retention_reviews: number;
  consent_reviews: number;
  dpias_completed: number;
}

export interface CCTVProfile {
  total_accesses: number;
  accesses_90d: number;
  /** null when the population is empty — nothing measured, not 0%. */
  justified_access_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  authorised_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  witness_rate: number | null;
  by_reason: Record<string, number>;
}

export interface SARProfile {
  total_requests: number;
  open_requests: number;
  completed_on_time: number;
  overdue_requests: number;
  /** null when the population is empty — nothing measured, not 0%. */
  on_time_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  identity_verified_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dpo_consulted_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  extension_rate: number | null;
}

export interface HomeDataGovernanceResult {
  data_governance_rating: DataGovernanceRating;
  data_governance_score: number;
  headline: string;
  breaches: BreachProfile;
  data_protection: DataProtectionProfile;
  cctv: CCTVProfile;
  sars: SARProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Justified CCTV reasons ─────────────────────────────────────────────────

const JUSTIFIED_REASONS = new Set([
  "incident_review", "safeguarding", "police_request",
  "complaint_investigation", "sar_request", "staff_investigation",
]);

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeDataGovernance(
  input: HomeDataGovernanceInput,
): HomeDataGovernanceResult {
  const { today, data_breaches, data_protection_records, cctv_accesses, subject_access_requests, total_staff } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_staff === 0 && data_breaches.length === 0 && data_protection_records.length === 0 && cctv_accesses.length === 0 && subject_access_requests.length === 0) {
    return {
      data_governance_rating: "insufficient_data",
      data_governance_score: 0,
      headline: "No staff or data governance records — assessment cannot be completed.",
      breaches: { total_breaches: 0, open_breaches: 0, high_critical_breaches: 0, near_miss_count: 0, special_category_count: 0, ico_reported_count: 0, subjects_notified_rate: null, lessons_documented_rate: null, by_type: {} },
      data_protection: { total_records: 0, overdue_records: 0, completed_records: 0, completion_rate: null, retention_reviews: 0, consent_reviews: 0, dpias_completed: 0 },
      cctv: { total_accesses: 0, accesses_90d: 0, justified_access_rate: null, authorised_rate: null, witness_rate: null, by_reason: {} },
      sars: { total_requests: 0, open_requests: 0, completed_on_time: 0, overdue_requests: 0, on_time_rate: null, identity_verified_rate: null, dpo_consulted_rate: null, extension_rate: null },
      strengths: [],
      concerns: ["No data governance records available — unable to assess compliance posture."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Breach profile ───────────────────────────────────────────────────
  const openBreaches = data_breaches.filter(b => b.status === "investigating" || b.status === "monitoring" || b.status === "reported_awaiting_ico").length;
  const highCriticalBreaches = data_breaches.filter(b => b.severity === "high" || b.severity === "critical").length;
  const nearMissCount = data_breaches.filter(b => b.near_miss).length;
  const specialCategoryCount = data_breaches.filter(b => b.special_category_data).length;
  const icoReportedCount = data_breaches.filter(b => b.reported_to_ico).length;

  const breachesRequiringNotification = data_breaches.filter(b => b.risk_to_individuals === "high");
  const subjectsNotifiedRate = pct(
    breachesRequiringNotification.filter(b => b.data_subjects_notified).length,
    breachesRequiringNotification.length,
  );

  const breachesWithLessons = data_breaches.filter(b => b.lessons_learned.length > 0);
  const lessonsDocumentedRate = pct(breachesWithLessons.length, data_breaches.length);

  const byBreachType: Record<string, number> = {};
  for (const b of data_breaches) {
    byBreachType[b.breach_type] = (byBreachType[b.breach_type] ?? 0) + 1;
  }

  const breachProfile: BreachProfile = {
    total_breaches: data_breaches.length,
    open_breaches: openBreaches,
    high_critical_breaches: highCriticalBreaches,
    near_miss_count: nearMissCount,
    special_category_count: specialCategoryCount,
    ico_reported_count: icoReportedCount,
    subjects_notified_rate: subjectsNotifiedRate,
    lessons_documented_rate: lessonsDocumentedRate,
    by_type: byBreachType,
  };

  // ── Data protection profile ──────────────────────────────────────────
  const overdueRecords = data_protection_records.filter(r => r.status === "overdue" || (r.status !== "completed" && r.status !== "closed" && daysBetween(r.due_date, today) > 0)).length;
  const completedRecords = data_protection_records.filter(r => r.status === "completed" || r.status === "closed").length;
  const completionRate = pct(completedRecords, data_protection_records.length);
  const retentionReviews = data_protection_records.filter(r => r.type === "retention_review").length;
  const consentReviews = data_protection_records.filter(r => r.type === "consent_review").length;
  const dpiasCompleted = data_protection_records.filter(r => r.type === "dpia" && (r.status === "completed" || r.status === "closed")).length;

  const dataProtectionProfile: DataProtectionProfile = {
    total_records: data_protection_records.length,
    overdue_records: overdueRecords,
    completed_records: completedRecords,
    completion_rate: completionRate,
    retention_reviews: retentionReviews,
    consent_reviews: consentReviews,
    dpias_completed: dpiasCompleted,
  };

  // ── CCTV profile ─────────────────────────────────────────────────────
  const accesses90d = cctv_accesses.filter(c => {
    const d = daysBetween(c.date, today);
    return d >= 0 && d <= 90;
  });

  const justifiedAccesses = cctv_accesses.filter(c => JUSTIFIED_REASONS.has(c.reason));
  const justifiedAccessRate = pct(justifiedAccesses.length, cctv_accesses.length);

  const authorisedAccesses = cctv_accesses.filter(c => c.authorised_by !== "" && c.authorised_by !== c.accessed_by);
  const authorisedRate = pct(authorisedAccesses.length, cctv_accesses.length);

  const witnessedAccesses = cctv_accesses.filter(c => c.witness_present !== null && c.witness_present !== "");
  const witnessRate = pct(witnessedAccesses.length, cctv_accesses.length);

  const byReason: Record<string, number> = {};
  for (const c of cctv_accesses) {
    byReason[c.reason] = (byReason[c.reason] ?? 0) + 1;
  }

  const cctvProfile: CCTVProfile = {
    total_accesses: cctv_accesses.length,
    accesses_90d: accesses90d.length,
    justified_access_rate: justifiedAccessRate,
    authorised_rate: authorisedRate,
    witness_rate: witnessRate,
    by_reason: byReason,
  };

  // ── SAR profile ──────────────────────────────────────────────────────
  const openSARs = subject_access_requests.filter(s => s.status !== "completed" && s.status !== "refused").length;

  const completedSARs = subject_access_requests.filter(s => s.status === "completed");
  const completedOnTime = completedSARs.filter(s => {
    if (!s.date_completed) return false;
    return daysBetween(s.date_completed, s.deadline_date) >= 0;
  }).length;

  const overdueSARs = subject_access_requests.filter(s =>
    s.status !== "completed" && s.status !== "refused" && daysBetween(s.deadline_date, today) > 0,
  ).length;

  const onTimeRate = pct(completedOnTime, completedSARs.length);

  const identityVerifiedRate = pct(
    subject_access_requests.filter(s => s.identity_verified).length,
    subject_access_requests.length,
  );

  const dpoConsultedRate = pct(
    subject_access_requests.filter(s => s.dpo_consulted).length,
    subject_access_requests.length,
  );

  const extensionRate = pct(
    subject_access_requests.filter(s => s.extension_applied).length,
    subject_access_requests.length,
  );

  const sarProfile: SARProfile = {
    total_requests: subject_access_requests.length,
    open_requests: openSARs,
    completed_on_time: completedOnTime,
    overdue_requests: overdueSARs,
    on_time_rate: onTimeRate,
    identity_verified_rate: identityVerifiedRate,
    dpo_consulted_rate: dpoConsultedRate,
    extension_rate: extensionRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: Breach management (±5) — open breaches, severity
  if (data_breaches.length === 0) {
    score += 5; // No breaches is ideal
  } else if (openBreaches === 0 && highCriticalBreaches === 0) {
    score += 3;
  } else if (openBreaches <= 1 && highCriticalBreaches <= 1) {
    score += 0;
  } else if (openBreaches <= 2) {
    score -= 2;
  } else {
    score -= 5;
  }

  // mod2: Data protection training / record keeping (±4) — staff coverage via DP records
  const dpRecordCoverage = data_protection_records.length;
  if (dpRecordCoverage >= 5 && completionRate >= 80) {
    score += 4;
  } else if (dpRecordCoverage >= 3 && completionRate >= 60) {
    score += 2;
  } else if (dpRecordCoverage >= 1) {
    score += 0;
  } else if (total_staff > 0) {
    score -= 2;
  } else {
    score -= 4;
  }

  // mod3: SAR compliance (±5) — response timeliness
  if (subject_access_requests.length === 0) {
    score += 1; // No SARs is neutral-positive
  } else if (onTimeRate >= 100 && overdueSARs === 0) {
    score += 5;
  } else if (onTimeRate >= 75) {
    score += 2;
  } else if (onTimeRate >= 50) {
    score += 0;
  } else {
    score -= 4;
  }

  // mod4: CCTV governance (±3) — access logging, justified access rate
  if (cctv_accesses.length === 0) {
    score += 1; // Slightly positive — no CCTV access needed
  } else if (justifiedAccessRate >= 90 && authorisedRate >= 80) {
    score += 3;
  } else if (justifiedAccessRate >= 70) {
    score += 1;
  } else if (justifiedAccessRate >= 50) {
    score += 0;
  } else {
    score -= 3;
  }

  // mod5: Breach reporting timeliness (±3) — reported within required window
  const breachesRequiringICO = data_breaches.filter(b => b.severity === "high" || b.severity === "critical" || b.special_category_data);
  if (breachesRequiringICO.length === 0) {
    score += 3; // No high-risk breaches
  } else {
    const reportedTimely = breachesRequiringICO.filter(b => {
      if (!b.reported_to_ico) return false;
      if (!b.ico_reported_date || !b.date_discovered) return false;
      return daysBetween(b.date_discovered, b.ico_reported_date) <= 3; // 72 hours
    });
    const timelyRate = pct(reportedTimely.length, breachesRequiringICO.length);
    if (timelyRate >= 100) score += 3;
    else if (timelyRate >= 75) score += 1;
    else if (timelyRate >= 50) score += 0;
    else score -= 3;
  }

  // mod6: DPA/GDPR policy compliance (±3) — records current
  if (overdueRecords === 0 && data_protection_records.length > 0) {
    score += 3;
  } else if (overdueRecords === 0) {
    score += 1; // No records at all, slightly positive
  } else if (overdueRecords <= 2) {
    score += 0;
  } else {
    score -= 3;
  }

  // mod7: Data retention compliance (±3) — expired records properly handled
  const retentionReviewsCompleted = data_protection_records.filter(
    r => r.type === "retention_review" && (r.status === "completed" || r.status === "closed"),
  ).length;
  if (retentionReviews === 0) {
    score -= 1; // Should have retention reviews
  } else {
    const retentionCompletionRate = pct(retentionReviewsCompleted, retentionReviews);
    if (retentionCompletionRate >= 100) score += 3;
    else if (retentionCompletionRate >= 75) score += 1;
    else if (retentionCompletionRate >= 50) score += 0;
    else score -= 3;
  }

  // mod8: Incident learning (±3) — breach lessons documented
  if (data_breaches.length === 0) {
    score += 2; // No breaches — positive
  } else if (lessonsDocumentedRate >= 100) {
    score += 3;
  } else if (lessonsDocumentedRate >= 75) {
    score += 1;
  } else if (lessonsDocumentedRate >= 50) {
    score += 0;
  } else {
    score -= 3;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let data_governance_rating: DataGovernanceRating;
  if (score >= 80) data_governance_rating = "outstanding";
  else if (score >= 65) data_governance_rating = "good";
  else if (score >= 45) data_governance_rating = "adequate";
  else data_governance_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (data_breaches.length === 0) strengths.push("No data breaches recorded — strong data protection culture.");
  if (data_breaches.length > 0 && openBreaches === 0) strengths.push("All data breaches resolved — effective breach management process.");
  if (data_breaches.length > 0 && lessonsDocumentedRate >= 100) strengths.push("Lessons documented for every breach — continuous improvement embedded.");
  if (subject_access_requests.length > 0 && onTimeRate >= 100) strengths.push("All subject access requests completed on time — excellent GDPR compliance.");
  if (cctv_accesses.length > 0 && justifiedAccessRate >= 90) strengths.push("CCTV access consistently justified — proper governance of surveillance data.");
  if (cctv_accesses.length > 0 && authorisedRate >= 90) strengths.push("CCTV accesses properly authorised by a separate individual — robust oversight.");
  if (overdueRecords === 0 && data_protection_records.length >= 3) strengths.push("All data protection records up to date — proactive compliance management.");
  if (dpiasCompleted >= 1) strengths.push(`${dpiasCompleted} data protection impact assessment${dpiasCompleted > 1 ? "s" : ""} completed — privacy by design in practice.`);

  // Concerns
  if (openBreaches >= 2) concerns.push(`${openBreaches} data breaches remain open — timely resolution is critical.`);
  if (highCriticalBreaches >= 2) concerns.push(`${highCriticalBreaches} high/critical severity breaches — significant data protection risk.`);
  if (specialCategoryCount > 0) concerns.push(`${specialCategoryCount} breach${specialCategoryCount > 1 ? "es" : ""} involved special category data — enhanced safeguards required.`);
  if (overdueSARs > 0) concerns.push(`${overdueSARs} subject access request${overdueSARs > 1 ? "s" : ""} overdue — statutory deadline breach.`);
  if (overdueRecords > 0) concerns.push(`${overdueRecords} data protection record${overdueRecords > 1 ? "s" : ""} overdue — compliance gap.`);
  if (cctv_accesses.length > 0 && justifiedAccessRate < 70) concerns.push(`Only ${justifiedAccessRate}% of CCTV accesses have justified reasons — potential misuse.`);
  if (cctv_accesses.length > 0 && authorisedRate < 50) concerns.push(`Only ${authorisedRate}% of CCTV accesses independently authorised — weak oversight.`);
  if (data_breaches.length > 0 && lessonsDocumentedRate < 50) concerns.push(`Only ${lessonsDocumentedRate}% of breaches have lessons documented — learning opportunity missed.`);
  if (retentionReviews === 0 && data_protection_records.length > 0) concerns.push("No data retention reviews conducted — risk of holding data beyond lawful basis.");

  // Recommendations
  if (openBreaches > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Resolve all open data breaches — assign owners and set resolution targets.", urgency: openBreaches >= 3 ? "immediate" : "soon", regulatory_ref: "GDPR Art 33" });
  }
  if (overdueSARs > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Complete overdue subject access requests — statutory 30-day deadline applies.", urgency: "immediate", regulatory_ref: "GDPR Art 15" });
  }
  if (overdueRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address overdue data protection records to maintain compliance posture.", urgency: overdueRecords > 3 ? "immediate" : "soon", regulatory_ref: "DPA 2018" });
  }
  if (retentionReviews === 0 && data_protection_records.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Conduct data retention reviews — ensure records are not held beyond lawful retention periods.", urgency: "soon", regulatory_ref: "GDPR Art 5(1)(e)" });
  }
  if (cctv_accesses.length > 0 && justifiedAccessRate < 80) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen CCTV access governance — ensure all accesses have documented justification.", urgency: "soon", regulatory_ref: "GDPR Art 6" });
  }
  if (data_breaches.length > 0 && lessonsDocumentedRate < 75) {
    recommendations.push({ rank: ++rank, recommendation: "Document lessons learned from all data breaches to drive continuous improvement.", urgency: "planned", regulatory_ref: "Reg 13" });
  }
  if (subject_access_requests.length > 0 && identityVerifiedRate < 80) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure identity verification for all subject access requests before disclosure.", urgency: "soon", regulatory_ref: "GDPR Art 12" });
  }

  // Cara Insights
  if (data_breaches.length === 0 && overdueRecords === 0 && overdueSARs === 0 && data_protection_records.length >= 3) {
    insights.push({ text: "Data governance is exemplary. No breaches, all records current, and SARs handled on time. This demonstrates a mature data protection culture that regulators will view positively.", severity: "positive" });
  }
  if (highCriticalBreaches >= 3) {
    insights.push({ text: `${highCriticalBreaches} high/critical breaches indicate systemic data protection weaknesses. Consider a comprehensive data protection audit and mandatory refresher training for all staff.`, severity: "critical" });
  }
  if (openBreaches >= 3) {
    insights.push({ text: `${openBreaches} open breaches suggest breach management capacity is overwhelmed. This risks ICO enforcement action — assign a dedicated breach coordinator.`, severity: "critical" });
  }
  if (overdueSARs >= 2) {
    insights.push({ text: `${overdueSARs} overdue subject access requests. The ICO can issue fines for failure to comply within the statutory timeframe. Prioritise immediate clearance.`, severity: "critical" });
  }
  if (specialCategoryCount >= 2) {
    insights.push({ text: `${specialCategoryCount} breaches involved special category data (health, ethnicity, etc.). Children's homes routinely handle sensitive data — review encryption, access controls, and staff awareness.`, severity: "warning" });
  }
  if (cctv_accesses.length > 0 && authorisedRate < 50) {
    insights.push({ text: `Only ${authorisedRate}% of CCTV accesses are independently authorised. Self-authorised surveillance access creates safeguarding and privacy risks. Implement a dual-authorisation policy.`, severity: "warning" });
  }
  if (subject_access_requests.length > 0 && dpoConsultedRate >= 80) {
    insights.push({ text: "DPO consultation rate is strong across subject access requests. This demonstrates good governance and reduces the risk of inappropriate disclosure.", severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (data_governance_rating === "outstanding") {
    headline = `Outstanding data governance — ${data_breaches.length === 0 ? "zero breaches" : "all breaches managed"}, compliance records current.`;
  } else if (data_governance_rating === "good") {
    headline = `Good data governance — ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : "governance processes functioning well."}`;
  } else if (data_governance_rating === "adequate") {
    headline = `Data governance requires improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Data governance is inadequate — significant gaps in breach management, compliance, or SAR handling.`;
  }

  return {
    data_governance_rating,
    data_governance_score: score,
    headline,
    breaches: breachProfile,
    data_protection: dataProtectionProfile,
    cctv: cctvProfile,
    sars: sarProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
