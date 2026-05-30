// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME KEYHOLDING & ACCESS CONTROL INTELLIGENCE ENGINE
// Monitors key register accuracy, access control compliance, key issue/return
// tracking, security audit outcomes, and child-safe area management across the
// home. Measures key register accuracy, access control compliance, key tracking
// timeliness, security audit pass rates, child-safe area compliance, and staff
// compliance with keyholding policy.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises — physical security and access control),
// Reg 5 (Registered person — ensuring premises are safe and secure).
// SCCIF: "Safety and security", "Leadership and management".
// Store keys: keyRegisterRecords, accessControlRecords, keyTrackingRecords,
//             securityAuditRecords, childSafeRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface KeyRegisterRecordInput {
  id: string;
  date: string;
  key_id: string;
  key_label: string;
  key_type: "master" | "room" | "external" | "vehicle" | "cabinet" | "safe" | "other";
  location_correct: boolean;
  holder_recorded: boolean;
  holder_authorised: boolean;
  register_entry_complete: boolean;
  register_entry_accurate: boolean;
  last_audit_date: string | null;
  audit_passed: boolean;
  duplicate_exists: boolean;
  spare_key_secured: boolean;
  notes: string;
  created_at: string;
}

export interface AccessControlRecordInput {
  id: string;
  date: string;
  area_name: string;
  area_type: "entrance" | "exit" | "restricted" | "office" | "medication_room" | "kitchen" | "laundry" | "bedroom" | "communal" | "external" | "other";
  access_method: "key" | "fob" | "code" | "biometric" | "manual" | "intercom" | "other";
  access_control_active: boolean;
  access_logged: boolean;
  unauthorised_access_attempt: boolean;
  visitor_protocol_followed: boolean;
  child_safe_lock_fitted: boolean;
  emergency_override_tested: boolean;
  compliant: boolean;
  staff_id: string | null;
  notes: string;
  created_at: string;
}

export interface KeyTrackingRecordInput {
  id: string;
  date: string;
  key_id: string;
  key_label: string;
  action: "issued" | "returned" | "lost" | "replaced" | "decommissioned" | "transferred";
  staff_id: string;
  staff_name: string;
  issued_at: string | null;
  returned_at: string | null;
  returned_on_time: boolean;
  handover_witnessed: boolean;
  signed_for: boolean;
  reason: string;
  shift_end_return_compliant: boolean;
  notes: string;
  created_at: string;
}

export interface SecurityAuditRecordInput {
  id: string;
  date: string;
  audit_type: "key_register" | "access_control" | "perimeter" | "cctv" | "alarm_system" | "locks" | "fire_exit" | "comprehensive" | "other";
  auditor: string;
  findings_count: number;
  critical_findings: number;
  actions_raised: number;
  actions_completed: number;
  passed: boolean;
  next_audit_due: string | null;
  overdue: boolean;
  recommendations: string;
  notes: string;
  created_at: string;
}

export interface ChildSafeRecordInput {
  id: string;
  date: string;
  area_name: string;
  area_type: "bedroom" | "bathroom" | "kitchen" | "garden" | "utility" | "medication_room" | "office" | "communal" | "entrance" | "other";
  child_safe_measures_in_place: boolean;
  lock_type_appropriate: boolean;
  child_can_exit_safely: boolean;
  restricted_items_secured: boolean;
  window_restrictor_fitted: boolean;
  hazard_free: boolean;
  compliant: boolean;
  inspection_by: string;
  actions_required: number;
  actions_completed: number;
  notes: string;
  created_at: string;
}

export interface KeyholdingAccessControlInput {
  today: string;
  total_children: number;
  total_staff: number;
  key_register_records: KeyRegisterRecordInput[];
  access_control_records: AccessControlRecordInput[];
  key_tracking_records: KeyTrackingRecordInput[];
  security_audit_records: SecurityAuditRecordInput[];
  child_safe_records: ChildSafeRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type KeyholdingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface KeyholdingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface KeyholdingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface KeyholdingAccessControlResult {
  keyholding_rating: KeyholdingRating;
  keyholding_score: number;
  headline: string;
  total_key_register_records: number;
  total_access_control_records: number;
  total_key_tracking_records: number;
  total_security_audit_records: number;
  total_child_safe_records: number;
  key_register_rate: number;
  access_control_rate: number;
  key_tracking_rate: number;
  security_audit_rate: number;
  child_safe_rate: number;
  staff_compliance_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: KeyholdingRecommendation[];
  insights: KeyholdingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): KeyholdingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: KeyholdingRating,
  score: number,
  headline: string,
): KeyholdingAccessControlResult {
  return {
    keyholding_rating: rating,
    keyholding_score: score,
    headline,
    total_key_register_records: 0,
    total_access_control_records: 0,
    total_key_tracking_records: 0,
    total_security_audit_records: 0,
    total_child_safe_records: 0,
    key_register_rate: 0,
    access_control_rate: 0,
    key_tracking_rate: 0,
    security_audit_rate: 0,
    child_safe_rate: 0,
    staff_compliance_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeKeyholdingAccessControl(
  input: KeyholdingAccessControlInput,
): KeyholdingAccessControlResult {
  const {
    total_children,
    total_staff,
    key_register_records,
    access_control_records,
    key_tracking_records,
    security_audit_records,
    child_safe_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    key_register_records.length === 0 &&
    access_control_records.length === 0 &&
    key_tracking_records.length === 0 &&
    security_audit_records.length === 0 &&
    child_safe_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess keyholding and access control.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No keyholding or access control data recorded despite children on placement — key security, access control, and premises safety require urgent attention.",
      ),
      concerns: [
        "No key register records, access control records, key tracking records, security audit records, or child-safe area records exist despite children being on placement — the home cannot evidence safe and secure premises management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Establish a comprehensive key register immediately, recording all keys held, their holders, locations, and conducting a full audit to ensure all keys are accounted for and access is appropriately controlled.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises security",
        },
        {
          rank: 2,
          recommendation:
            "Implement structured access control recording across all entry/exit points and restricted areas, ensuring visitor protocols are followed and all access is logged as required under Regulation 25.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Registered person responsibilities",
        },
      ],
      insights: [
        {
          text: "The complete absence of keyholding and access control records means the home cannot demonstrate that premises are secure, keys are managed safely, or that children are protected through appropriate physical security measures. This represents a significant regulatory gap under CHR 2015 Reg 25.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Key register metrics ---
  const totalKeyRegisterRecords = key_register_records.length;
  const accurateEntries = key_register_records.filter(
    (k) => k.register_entry_accurate && k.register_entry_complete,
  ).length;
  const keyRegisterRate = pct(accurateEntries, totalKeyRegisterRecords);

  const locationCorrect = key_register_records.filter((k) => k.location_correct).length;
  const locationCorrectRate = pct(locationCorrect, totalKeyRegisterRecords);

  const holderRecorded = key_register_records.filter((k) => k.holder_recorded).length;
  const holderRecordedRate = pct(holderRecorded, totalKeyRegisterRecords);

  const holderAuthorised = key_register_records.filter((k) => k.holder_authorised).length;
  const holderAuthorisedRate = pct(holderAuthorised, totalKeyRegisterRecords);

  const auditPassed = key_register_records.filter((k) => k.audit_passed).length;
  const keyAuditPassRate = pct(auditPassed, totalKeyRegisterRecords);

  const duplicateExists = key_register_records.filter((k) => k.duplicate_exists).length;
  const duplicateRate = pct(duplicateExists, totalKeyRegisterRecords);

  const spareKeySecured = key_register_records.filter((k) => k.spare_key_secured).length;
  const spareKeySecuredRate = pct(spareKeySecured, totalKeyRegisterRecords);

  // --- Access control metrics ---
  const totalAccessControlRecords = access_control_records.length;
  const compliantAccess = access_control_records.filter((a) => a.compliant).length;
  const accessControlRate = pct(compliantAccess, totalAccessControlRecords);

  const accessLogged = access_control_records.filter((a) => a.access_logged).length;
  const accessLoggedRate = pct(accessLogged, totalAccessControlRecords);

  const accessControlActive = access_control_records.filter((a) => a.access_control_active).length;
  const accessControlActiveRate = pct(accessControlActive, totalAccessControlRecords);

  const unauthorisedAttempts = access_control_records.filter(
    (a) => a.unauthorised_access_attempt,
  ).length;
  const unauthorisedAttemptRate = pct(unauthorisedAttempts, totalAccessControlRecords);

  const visitorProtocolFollowed = access_control_records.filter(
    (a) => a.visitor_protocol_followed,
  ).length;
  const visitorProtocolRate = pct(visitorProtocolFollowed, totalAccessControlRecords);

  const childSafeLockFitted = access_control_records.filter(
    (a) => a.child_safe_lock_fitted,
  ).length;
  const childSafeLockRate = pct(childSafeLockFitted, totalAccessControlRecords);

  const emergencyOverrideTested = access_control_records.filter(
    (a) => a.emergency_override_tested,
  ).length;
  const emergencyOverrideRate = pct(emergencyOverrideTested, totalAccessControlRecords);

  // --- Key tracking metrics ---
  const totalKeyTrackingRecords = key_tracking_records.length;
  const issueReturnRecords = key_tracking_records.filter(
    (t) => t.action === "issued" || t.action === "returned",
  );
  const totalIssueReturn = issueReturnRecords.length;

  const returnedOnTime = key_tracking_records.filter(
    (t) => (t.action === "returned" || t.action === "issued") && t.returned_on_time,
  ).length;
  const keyTrackingRate = pct(returnedOnTime, totalIssueReturn > 0 ? totalIssueReturn : totalKeyTrackingRecords);

  const handoverWitnessed = key_tracking_records.filter((t) => t.handover_witnessed).length;
  const handoverWitnessedRate = pct(handoverWitnessed, totalKeyTrackingRecords);

  const signedFor = key_tracking_records.filter((t) => t.signed_for).length;
  const signedForRate = pct(signedFor, totalKeyTrackingRecords);

  const shiftEndCompliant = key_tracking_records.filter(
    (t) => t.shift_end_return_compliant,
  ).length;
  const shiftEndComplianceRate = pct(shiftEndCompliant, totalKeyTrackingRecords);

  const lostKeys = key_tracking_records.filter((t) => t.action === "lost").length;
  const lostKeyRate = pct(lostKeys, totalKeyTrackingRecords);

  // --- Security audit metrics ---
  const totalSecurityAuditRecords = security_audit_records.length;
  const passedAudits = security_audit_records.filter((a) => a.passed).length;
  const securityAuditRate = pct(passedAudits, totalSecurityAuditRecords);

  const overdueAudits = security_audit_records.filter((a) => a.overdue).length;
  const overdueAuditRate = pct(overdueAudits, totalSecurityAuditRecords);

  const totalActionsRaised = security_audit_records.reduce(
    (sum, a) => sum + a.actions_raised,
    0,
  );
  const totalActionsCompleted = security_audit_records.reduce(
    (sum, a) => sum + a.actions_completed,
    0,
  );
  const auditActionCompletionRate = pct(totalActionsCompleted, totalActionsRaised);

  const totalCriticalFindings = security_audit_records.reduce(
    (sum, a) => sum + a.critical_findings,
    0,
  );
  const totalFindings = security_audit_records.reduce(
    (sum, a) => sum + a.findings_count,
    0,
  );
  const criticalFindingRate = pct(totalCriticalFindings, totalFindings);

  // --- Child safe area metrics ---
  const totalChildSafeRecords = child_safe_records.length;
  const compliantChildSafe = child_safe_records.filter((c) => c.compliant).length;
  const childSafeRate = pct(compliantChildSafe, totalChildSafeRecords);

  const measuresInPlace = child_safe_records.filter(
    (c) => c.child_safe_measures_in_place,
  ).length;
  const measuresInPlaceRate = pct(measuresInPlace, totalChildSafeRecords);

  const lockAppropriate = child_safe_records.filter(
    (c) => c.lock_type_appropriate,
  ).length;
  const lockAppropriateRate = pct(lockAppropriate, totalChildSafeRecords);

  const canExitSafely = child_safe_records.filter(
    (c) => c.child_can_exit_safely,
  ).length;
  const canExitSafelyRate = pct(canExitSafely, totalChildSafeRecords);

  const restrictedItemsSecured = child_safe_records.filter(
    (c) => c.restricted_items_secured,
  ).length;
  const restrictedItemsSecuredRate = pct(restrictedItemsSecured, totalChildSafeRecords);

  const windowRestrictorFitted = child_safe_records.filter(
    (c) => c.window_restrictor_fitted,
  ).length;
  const windowRestrictorRate = pct(windowRestrictorFitted, totalChildSafeRecords);

  const hazardFree = child_safe_records.filter((c) => c.hazard_free).length;
  const hazardFreeRate = pct(hazardFree, totalChildSafeRecords);

  const childSafeActionsRaised = child_safe_records.reduce(
    (sum, c) => sum + c.actions_required,
    0,
  );
  const childSafeActionsCompleted = child_safe_records.reduce(
    (sum, c) => sum + c.actions_completed,
    0,
  );
  const childSafeActionCompletionRate = pct(childSafeActionsCompleted, childSafeActionsRaised);

  // --- Staff compliance composite ---
  // Composite across: holder_authorised, handover_witnessed, signed_for, shift_end_return_compliant, visitor_protocol
  const staffCompNumerators: number[] = [];
  const staffCompDenominators: number[] = [];

  if (totalKeyRegisterRecords > 0) {
    staffCompNumerators.push(holderAuthorised);
    staffCompDenominators.push(totalKeyRegisterRecords);
  }
  if (totalKeyTrackingRecords > 0) {
    staffCompNumerators.push(handoverWitnessed);
    staffCompDenominators.push(totalKeyTrackingRecords);
    staffCompNumerators.push(signedFor);
    staffCompDenominators.push(totalKeyTrackingRecords);
    staffCompNumerators.push(shiftEndCompliant);
    staffCompDenominators.push(totalKeyTrackingRecords);
  }
  if (totalAccessControlRecords > 0) {
    staffCompNumerators.push(visitorProtocolFollowed);
    staffCompDenominators.push(totalAccessControlRecords);
  }

  const totalStaffCompNum = staffCompNumerators.reduce((a, b) => a + b, 0);
  const totalStaffCompDenom = staffCompDenominators.reduce((a, b) => a + b, 0);
  const staffComplianceRate = pct(totalStaffCompNum, totalStaffCompDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: keyRegisterRate (>=95: +5, >=80: +3) ---
  if (keyRegisterRate >= 95) score += 5;
  else if (keyRegisterRate >= 80) score += 3;

  // --- Bonus 2: accessControlRate (>=95: +5, >=80: +3) ---
  if (accessControlRate >= 95) score += 5;
  else if (accessControlRate >= 80) score += 3;

  // --- Bonus 3: keyTrackingRate (>=95: +4, >=80: +2) ---
  if (keyTrackingRate >= 95) score += 4;
  else if (keyTrackingRate >= 80) score += 2;

  // --- Bonus 4: securityAuditRate (>=90: +4, >=75: +2) ---
  if (securityAuditRate >= 90) score += 4;
  else if (securityAuditRate >= 75) score += 2;

  // --- Bonus 5: childSafeRate (>=95: +4, >=80: +2) ---
  if (childSafeRate >= 95) score += 4;
  else if (childSafeRate >= 80) score += 2;

  // --- Bonus 6: staffComplianceRate (>=95: +3, >=80: +1) ---
  if (staffComplianceRate >= 95) score += 3;
  else if (staffComplianceRate >= 80) score += 1;

  // --- Bonus 7: auditActionCompletionRate (>=90: +3, >=70: +1) ---
  if (auditActionCompletionRate >= 90) score += 3;
  else if (auditActionCompletionRate >= 70) score += 1;

  // max bonuses = 5+5+4+4+4+3+3 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // keyRegisterRate < 50 → -5 (guarded)
  if (keyRegisterRate < 50 && totalKeyRegisterRecords > 0) score -= 5;

  // accessControlRate < 50 → -5 (guarded)
  if (accessControlRate < 50 && totalAccessControlRecords > 0) score -= 5;

  // securityAuditRate < 50 → -4 (guarded)
  if (securityAuditRate < 50 && totalSecurityAuditRecords > 0) score -= 4;

  // childSafeRate < 50 → -4 (guarded)
  if (childSafeRate < 50 && totalChildSafeRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const keyholding_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (keyRegisterRate >= 95 && totalKeyRegisterRecords > 0) {
    strengths.push(
      `${keyRegisterRate}% key register accuracy — the home maintains an exemplary key register with complete and accurate entries for all keys held.`,
    );
  } else if (keyRegisterRate >= 80 && totalKeyRegisterRecords > 0) {
    strengths.push(
      `${keyRegisterRate}% key register accuracy — the home maintains a well-managed key register with strong recording practices.`,
    );
  }

  if (accessControlRate >= 95 && totalAccessControlRecords > 0) {
    strengths.push(
      `${accessControlRate}% access control compliance — all entry points, exits, and restricted areas are consistently secured and monitored to an excellent standard.`,
    );
  } else if (accessControlRate >= 80 && totalAccessControlRecords > 0) {
    strengths.push(
      `${accessControlRate}% access control compliance — the home demonstrates strong access control management across its premises.`,
    );
  }

  if (keyTrackingRate >= 95 && totalKeyTrackingRecords > 0) {
    strengths.push(
      `${keyTrackingRate}% key tracking compliance — keys are consistently issued, returned, and accounted for within required timescales.`,
    );
  } else if (keyTrackingRate >= 80 && totalKeyTrackingRecords > 0) {
    strengths.push(
      `${keyTrackingRate}% key tracking compliance — good key issue and return practices with timely handovers.`,
    );
  }

  if (securityAuditRate >= 90 && totalSecurityAuditRecords > 0) {
    strengths.push(
      `${securityAuditRate}% security audit pass rate — security audits consistently confirm that premises security measures meet required standards.`,
    );
  } else if (securityAuditRate >= 75 && totalSecurityAuditRecords > 0) {
    strengths.push(
      `${securityAuditRate}% security audit pass rate — the majority of security audits confirm satisfactory premises security.`,
    );
  }

  if (childSafeRate >= 95 && totalChildSafeRecords > 0) {
    strengths.push(
      `${childSafeRate}% child-safe area compliance — all areas assessed demonstrate excellent child-safe measures including appropriate locks, window restrictors, and hazard-free environments.`,
    );
  } else if (childSafeRate >= 80 && totalChildSafeRecords > 0) {
    strengths.push(
      `${childSafeRate}% child-safe area compliance — the home maintains strong child-safe measures across assessed areas.`,
    );
  }

  if (staffComplianceRate >= 95 && totalStaffCompDenom > 0) {
    strengths.push(
      `${staffComplianceRate}% staff compliance with keyholding protocols — staff consistently follow key management procedures including witnessed handovers, signing for keys, and shift-end returns.`,
    );
  } else if (staffComplianceRate >= 80 && totalStaffCompDenom > 0) {
    strengths.push(
      `${staffComplianceRate}% staff compliance with keyholding protocols — staff generally follow key management procedures well.`,
    );
  }

  if (auditActionCompletionRate >= 90 && totalActionsRaised > 0) {
    strengths.push(
      `${auditActionCompletionRate}% of security audit actions completed — the home follows through on security improvement actions identified through audits.`,
    );
  } else if (auditActionCompletionRate >= 70 && totalActionsRaised > 0) {
    strengths.push(
      `${auditActionCompletionRate}% of security audit actions completed — the home generally delivers on security improvement plans.`,
    );
  }

  if (locationCorrectRate >= 95 && totalKeyRegisterRecords > 0) {
    strengths.push(
      `${locationCorrectRate}% of keys in correct locations — keys are stored securely and can be located as expected.`,
    );
  }

  if (holderRecordedRate >= 95 && totalKeyRegisterRecords > 0) {
    strengths.push(
      `${holderRecordedRate}% of key holders recorded — the home maintains an accurate record of who holds each key at all times.`,
    );
  }

  if (accessLoggedRate >= 95 && totalAccessControlRecords > 0) {
    strengths.push(
      `${accessLoggedRate}% of access events logged — comprehensive access logging enables effective monitoring and audit trail maintenance.`,
    );
  }

  if (shiftEndComplianceRate >= 95 && totalKeyTrackingRecords > 0) {
    strengths.push(
      `${shiftEndComplianceRate}% shift-end key return compliance — keys are consistently returned at the end of shifts, preventing unauthorised out-of-hours access.`,
    );
  }

  if (lostKeys === 0 && totalKeyTrackingRecords > 0) {
    strengths.push(
      "Zero lost keys recorded — demonstrating excellent key management discipline and accountability across all staff.",
    );
  }

  if (canExitSafelyRate >= 95 && totalChildSafeRecords > 0) {
    strengths.push(
      `${canExitSafelyRate}% of areas confirm children can exit safely — emergency egress is not compromised by security measures.`,
    );
  }

  if (hazardFreeRate >= 95 && totalChildSafeRecords > 0) {
    strengths.push(
      `${hazardFreeRate}% of child-safe inspections found areas hazard-free — the physical environment is maintained to a high safety standard.`,
    );
  }

  if (windowRestrictorRate >= 95 && totalChildSafeRecords > 0) {
    strengths.push(
      `${windowRestrictorRate}% of areas have window restrictors fitted — window safety is comprehensively managed to protect children.`,
    );
  }

  if (spareKeySecuredRate >= 95 && totalKeyRegisterRecords > 0) {
    strengths.push(
      `${spareKeySecuredRate}% of spare keys secured appropriately — spare key management is robust, preventing unauthorised access.`,
    );
  }

  if (emergencyOverrideRate >= 90 && totalAccessControlRecords > 0) {
    strengths.push(
      `${emergencyOverrideRate}% of emergency overrides tested — the home ensures security measures do not impede emergency response.`,
    );
  }

  if (unauthorisedAttempts === 0 && totalAccessControlRecords > 0) {
    strengths.push(
      "No unauthorised access attempts recorded — access control measures are effectively deterring and preventing breaches.",
    );
  }

  if (overdueAudits === 0 && totalSecurityAuditRecords > 0) {
    strengths.push(
      "No overdue security audits — the home maintains its security audit schedule consistently, demonstrating proactive governance.",
    );
  }

  if (restrictedItemsSecuredRate >= 95 && totalChildSafeRecords > 0) {
    strengths.push(
      `${restrictedItemsSecuredRate}% of restricted items secured — hazardous materials, medications, and restricted items are consistently locked away from children.`,
    );
  }

  if (childSafeActionCompletionRate >= 90 && childSafeActionsRaised > 0) {
    strengths.push(
      `${childSafeActionCompletionRate}% of child-safe actions completed — identified safety improvements are promptly addressed.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (keyRegisterRate < 50 && totalKeyRegisterRecords > 0) {
    concerns.push(
      `Only ${keyRegisterRate}% key register accuracy — the majority of key register entries are incomplete or inaccurate, meaning the home cannot reliably account for its keys. This is a significant premises security failure under Reg 25.`,
    );
  } else if (keyRegisterRate < 80 && keyRegisterRate >= 50 && totalKeyRegisterRecords > 0) {
    concerns.push(
      `Key register accuracy at ${keyRegisterRate}% — gaps in the key register mean some keys cannot be fully accounted for, weakening the home's physical security assurance.`,
    );
  }

  if (accessControlRate < 50 && totalAccessControlRecords > 0) {
    concerns.push(
      `Only ${accessControlRate}% access control compliance — the majority of access control checks show non-compliance, indicating fundamental failures in premises security under Reg 25.`,
    );
  } else if (accessControlRate < 80 && accessControlRate >= 50 && totalAccessControlRecords > 0) {
    concerns.push(
      `Access control compliance at ${accessControlRate}% — inconsistent access control practices create potential vulnerabilities in premises security.`,
    );
  }

  if (keyTrackingRate < 50 && totalKeyTrackingRecords > 0) {
    concerns.push(
      `Only ${keyTrackingRate}% key tracking compliance — keys are not being issued and returned in accordance with policy, creating significant security risks.`,
    );
  } else if (keyTrackingRate < 80 && keyTrackingRate >= 50 && totalKeyTrackingRecords > 0) {
    concerns.push(
      `Key tracking compliance at ${keyTrackingRate}% — some key issue/return events are not meeting required standards for timeliness and accountability.`,
    );
  }

  if (securityAuditRate < 50 && totalSecurityAuditRecords > 0) {
    concerns.push(
      `Only ${securityAuditRate}% security audit pass rate — the majority of security audits are identifying failures, indicating systemic premises security weaknesses.`,
    );
  } else if (securityAuditRate < 75 && securityAuditRate >= 50 && totalSecurityAuditRecords > 0) {
    concerns.push(
      `Security audit pass rate at ${securityAuditRate}% — too many audits are identifying compliance failures that need to be addressed to ensure premises security.`,
    );
  }

  if (childSafeRate < 50 && totalChildSafeRecords > 0) {
    concerns.push(
      `Only ${childSafeRate}% child-safe area compliance — the majority of areas assessed do not meet child-safe standards, creating direct risks to children's physical safety under Reg 25.`,
    );
  } else if (childSafeRate < 80 && childSafeRate >= 50 && totalChildSafeRecords > 0) {
    concerns.push(
      `Child-safe area compliance at ${childSafeRate}% — some areas do not meet child-safe standards, requiring improvement to ensure children's physical safety.`,
    );
  }

  if (staffComplianceRate < 50 && totalStaffCompDenom > 0) {
    concerns.push(
      `Only ${staffComplianceRate}% staff compliance with keyholding protocols — staff are not consistently following key management procedures, undermining the entire security framework.`,
    );
  } else if (staffComplianceRate < 80 && staffComplianceRate >= 50 && totalStaffCompDenom > 0) {
    concerns.push(
      `Staff compliance with keyholding protocols at ${staffComplianceRate}% — inconsistent adherence to key management procedures weakens security controls.`,
    );
  }

  if (lostKeyRate >= 10 && totalKeyTrackingRecords > 0) {
    concerns.push(
      `${lostKeyRate}% of key tracking records involve lost keys — key losses represent a direct security risk requiring immediate investigation and remediation including potential lock changes.`,
    );
  } else if (lostKeyRate >= 5 && lostKeyRate < 10 && totalKeyTrackingRecords > 0) {
    concerns.push(
      `${lostKeyRate}% of key tracking records involve lost keys — while individual losses may be addressed, the rate suggests systemic weaknesses in key handling.`,
    );
  }

  if (unauthorisedAttemptRate >= 10 && totalAccessControlRecords > 0) {
    concerns.push(
      `${unauthorisedAttemptRate}% of access records include unauthorised access attempts — this indicates access control measures may not be sufficient to prevent breaches.`,
    );
  } else if (unauthorisedAttemptRate >= 5 && unauthorisedAttemptRate < 10 && totalAccessControlRecords > 0) {
    concerns.push(
      `${unauthorisedAttemptRate}% unauthorised access attempts recorded — while managed, the frequency warrants review of access control effectiveness.`,
    );
  }

  if (overdueAuditRate >= 30 && totalSecurityAuditRecords > 0) {
    concerns.push(
      `${overdueAuditRate}% of security audits are overdue — the home is not maintaining its security audit schedule, leaving potential vulnerabilities undetected.`,
    );
  } else if (overdueAuditRate >= 15 && overdueAuditRate < 30 && totalSecurityAuditRecords > 0) {
    concerns.push(
      `${overdueAuditRate}% of security audits are overdue — some audits are not being completed on schedule, creating gaps in security assurance.`,
    );
  }

  if (canExitSafelyRate < 80 && totalChildSafeRecords > 0) {
    concerns.push(
      `Only ${canExitSafelyRate}% of areas confirm children can exit safely — security measures must never compromise emergency egress. This is a critical safety concern under Reg 25.`,
    );
  }

  if (restrictedItemsSecuredRate < 80 && totalChildSafeRecords > 0) {
    concerns.push(
      `Only ${restrictedItemsSecuredRate}% of restricted items secured — hazardous materials, medications, or restricted items are not consistently locked away from children.`,
    );
  }

  if (handoverWitnessedRate < 50 && totalKeyTrackingRecords > 0) {
    concerns.push(
      `Only ${handoverWitnessedRate}% of key handovers witnessed — unwitnessed handovers create accountability gaps and undermine the chain of custody for keys.`,
    );
  }

  if (signedForRate < 50 && totalKeyTrackingRecords > 0) {
    concerns.push(
      `Only ${signedForRate}% of key transactions signed for — without signatures, the home cannot evidence accountability for key custody.`,
    );
  }

  if (auditActionCompletionRate < 50 && totalActionsRaised > 0) {
    concerns.push(
      `Only ${auditActionCompletionRate}% of security audit actions completed — identified security improvements are not being followed through, leaving known vulnerabilities unresolved.`,
    );
  }

  if (criticalFindingRate >= 30 && totalFindings > 0) {
    concerns.push(
      `${criticalFindingRate}% of security audit findings are critical — a high proportion of serious findings indicates significant premises security weaknesses.`,
    );
  }

  if (totalKeyRegisterRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No key register records despite children being on placement — the home has no auditable record of its key holdings, undermining premises security assurance.",
    );
  }

  if (totalSecurityAuditRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No security audit records — the home has not conducted or recorded any security audits, meaning premises security is not being independently verified.",
    );
  }

  if (totalChildSafeRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child-safe area records — the home has not assessed or recorded child-safe measures across its premises, creating uncertainty about physical safety provisions.",
    );
  }

  if (locationCorrectRate < 70 && totalKeyRegisterRecords > 0) {
    concerns.push(
      `Only ${locationCorrectRate}% of keys in correct locations — keys are frequently not where they should be, making it impossible to ensure they are secure and accessible when needed.`,
    );
  }

  if (emergencyOverrideRate < 50 && totalAccessControlRecords > 0) {
    concerns.push(
      `Only ${emergencyOverrideRate}% of emergency overrides tested — untested emergency overrides may fail when needed, putting children and staff at risk during emergencies.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: KeyholdingRecommendation[] = [];
  let rank = 0;

  if (keyRegisterRate < 50 && totalKeyRegisterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate full key audit — verify every key on the register, confirm holders and locations, and update all entries to ensure complete accuracy. Assign a named key custodian responsible for register integrity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (accessControlRate < 50 && totalAccessControlRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all access control points urgently — identify non-compliant areas and implement immediate measures including repair of faulty locks, activation of dormant access systems, and staff briefing on access control protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (childSafeRate < 50 && totalChildSafeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent child-safe assessment of all areas — ensure appropriate locks, window restrictors, and hazard-free environments are in place across the home. Prioritise bedrooms, bathrooms, kitchens, and areas where children are unsupervised.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety",
    });
  }

  if (securityAuditRate < 50 && totalSecurityAuditRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a comprehensive independent security audit to identify and address the root causes of persistent audit failures. Implement a corrective action plan with named owners and target dates.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person responsibilities",
    });
  }

  if (lostKeyRate >= 10 && totalKeyTrackingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all lost key incidents to identify patterns and root causes — consider whether lock changes are needed for lost keys giving access to secure areas. Implement preventive measures including key lanyards, sign-out boards, and personal accountability training.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (canExitSafelyRate < 80 && totalChildSafeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all areas where children cannot exit safely — security measures must never trap children or impede emergency evacuation. Adjust lock configurations to ensure child-safe egress while maintaining appropriate access control.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety and emergency egress",
    });
  }

  if (restrictedItemsSecuredRate < 80 && totalChildSafeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all restricted items including medications, cleaning products, sharp objects, and hazardous materials are secured behind appropriate locks. Conduct daily checks and record compliance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety",
    });
  }

  if (staffComplianceRate < 50 && totalStaffCompDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory keyholding protocol refresher training for all staff — cover witnessed handovers, signing for keys, shift-end returns, and visitor protocols. Monitor compliance through supervision and spot-checks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Staff training and competence",
    });
  }

  if (unauthorisedAttemptRate >= 10 && totalAccessControlRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review access control measures in areas with unauthorised access attempts — upgrade locks, install additional monitoring, or adjust access methods to prevent breaches.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (overdueAuditRate >= 30 && totalSecurityAuditRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring overdue security audits up to date immediately and establish a forward audit calendar with reminders to prevent future lapses. Consider whether additional audit capacity is needed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person responsibilities",
    });
  }

  if (keyRegisterRate >= 50 && keyRegisterRate < 80 && totalKeyRegisterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve key register accuracy to at least 80% — review entries for completeness, implement a weekly register check process, and ensure all staff understand the importance of accurate key recording.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (accessControlRate >= 50 && accessControlRate < 80 && totalAccessControlRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen access control compliance to at least 80% — identify the main areas of non-compliance and implement targeted improvements including staff training, equipment maintenance, and monitoring.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (keyTrackingRate < 80 && totalKeyTrackingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve key tracking compliance — ensure all key issues and returns are recorded promptly, returned on time, witnessed, and signed for. Consider implementing a digital key tracking system.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (auditActionCompletionRate < 50 && totalActionsRaised > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a security audit action tracker with named owners and deadlines — identified vulnerabilities must be addressed promptly to maintain premises security integrity.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person responsibilities",
    });
  }

  if (handoverWitnessedRate < 50 && totalKeyTrackingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all key handovers are witnessed by a second member of staff — unwitnessed handovers create accountability gaps that could compromise security if keys are misplaced or misused.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (signedForRate < 50 && totalKeyTrackingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory sign-for procedures for all key transactions — signatures provide the evidential chain of custody needed to demonstrate accountability for key security.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (emergencyOverrideRate < 50 && totalAccessControlRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular emergency override testing schedule — all access control emergency overrides must be tested at least quarterly to ensure they function correctly during emergencies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Emergency egress and premises safety",
    });
  }

  if (childSafeRate >= 50 && childSafeRate < 80 && totalChildSafeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve child-safe area compliance to at least 80% — review non-compliant areas and implement appropriate measures including child-safe locks, window restrictors, and hazard removal.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety",
    });
  }

  if (staffComplianceRate >= 50 && staffComplianceRate < 80 && totalStaffCompDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen staff compliance with keyholding protocols through regular supervision, spot-checks, and inclusion of key management compliance in performance reviews.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33 — Staff training and competence",
    });
  }

  if (securityAuditRate >= 50 && securityAuditRate < 75 && totalSecurityAuditRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a security improvement plan to address recurring audit failures — identify root causes, implement systemic solutions, and monitor progress until the audit pass rate exceeds 75%.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person responsibilities",
    });
  }

  if (locationCorrectRate < 70 && totalKeyRegisterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a key storage solution with designated key cabinets or boards for each area — keys must be returned to their designated locations after use to maintain security and accountability.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (totalKeyRegisterRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a comprehensive key register recording all keys, their types, holders, and locations — without a key register the home cannot demonstrate control of physical access to its premises.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises security",
    });
  }

  if (totalSecurityAuditRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a regular security audit programme covering key registers, access controls, perimeter security, alarms, and locks — audits should be conducted at least quarterly with findings documented and actioned.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person responsibilities",
    });
  }

  if (totalChildSafeRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a full child-safe area assessment across all rooms and external areas — record compliance with child-safe measures, lock types, window restrictors, hazard status, and restricted item security.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises safety",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: KeyholdingInsight[] = [];

  // -- Critical insights --

  if (keyRegisterRate < 50 && totalKeyRegisterRecords > 0) {
    insights.push({
      text: `Only ${keyRegisterRate}% key register accuracy. An inaccurate key register means the home cannot account for who holds keys to the premises and restricted areas. Under CHR 2015 Reg 25, the registered person must ensure the premises are secure — an unreliable key register fundamentally undermines this obligation.`,
      severity: "critical",
    });
  }

  if (accessControlRate < 50 && totalAccessControlRecords > 0) {
    insights.push({
      text: `Only ${accessControlRate}% access control compliance. Widespread access control failures mean the home cannot demonstrate that its premises are secure or that children are protected from unauthorised access. This represents a direct risk to children's safety under Reg 25.`,
      severity: "critical",
    });
  }

  if (childSafeRate < 50 && totalChildSafeRecords > 0) {
    insights.push({
      text: `Only ${childSafeRate}% child-safe area compliance. The majority of areas assessed do not meet child-safe standards — children may be exposed to hazards, inappropriate locks, unsecured restricted items, or environments where they cannot exit safely in an emergency.`,
      severity: "critical",
    });
  }

  if (securityAuditRate < 50 && totalSecurityAuditRecords > 0) {
    insights.push({
      text: `Only ${securityAuditRate}% security audit pass rate. Persistent audit failures indicate systemic premises security weaknesses that are not being resolved. The registered person must ensure that security deficiencies are identified, actioned, and verified through re-audit.`,
      severity: "critical",
    });
  }

  if (lostKeyRate >= 10 && totalKeyTrackingRecords > 0) {
    insights.push({
      text: `${lostKeyRate}% of key tracking records involve lost keys. Each lost key represents a potential security breach — locks may need changing, and the pattern of losses suggests inadequate key management controls. Lost keys to restricted areas such as medication rooms or offices create immediate safeguarding risks.`,
      severity: "critical",
    });
  }

  if (canExitSafelyRate < 70 && totalChildSafeRecords > 0) {
    insights.push({
      text: `Only ${canExitSafelyRate}% of areas confirm children can exit safely. Security measures must never compromise emergency egress — children must always be able to leave areas safely in an emergency. This is a fundamental safety requirement under fire safety regulations and Reg 25.`,
      severity: "critical",
    });
  }

  if (totalKeyRegisterRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No key register records despite children being on placement. Without a key register, the home has no auditable evidence of key control. Ofsted inspectors will expect to see a well-maintained key register as evidence of premises security under Regulation 25.",
      severity: "critical",
    });
  }

  if (totalChildSafeRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child-safe area records despite children being on placement. Without documented child-safe assessments, the home cannot demonstrate that its physical environment has been assessed for child safety risks including locks, window restrictors, hazards, and restricted items.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (keyRegisterRate >= 50 && keyRegisterRate < 80 && totalKeyRegisterRecords > 0) {
    insights.push({
      text: `Key register accuracy at ${keyRegisterRate}% — while improving, gaps in the register mean some keys cannot be fully accounted for. Regular weekly register checks and named accountability would strengthen this area.`,
      severity: "warning",
    });
  }

  if (accessControlRate >= 50 && accessControlRate < 80 && totalAccessControlRecords > 0) {
    insights.push({
      text: `Access control compliance at ${accessControlRate}% — while some areas are well-managed, inconsistency creates potential security vulnerabilities. A systematic review of all access points would identify and close gaps.`,
      severity: "warning",
    });
  }

  if (keyTrackingRate < 80 && totalKeyTrackingRecords > 0) {
    insights.push({
      text: `Key tracking compliance at ${keyTrackingRate}% — keys are not always being issued and returned according to policy. Inconsistent tracking undermines the chain of custody and creates windows where key whereabouts are uncertain.`,
      severity: "warning",
    });
  }

  if (securityAuditRate >= 50 && securityAuditRate < 75 && totalSecurityAuditRecords > 0) {
    insights.push({
      text: `Security audit pass rate at ${securityAuditRate}% — while audits are being conducted, too many are identifying failures. This suggests systemic issues that need addressing through a structured security improvement programme.`,
      severity: "warning",
    });
  }

  if (childSafeRate >= 50 && childSafeRate < 80 && totalChildSafeRecords > 0) {
    insights.push({
      text: `Child-safe area compliance at ${childSafeRate}% — some areas are not meeting child-safe standards. Consistent application of child-safe measures across all areas is essential to protect children's physical safety.`,
      severity: "warning",
    });
  }

  if (staffComplianceRate >= 50 && staffComplianceRate < 80 && totalStaffCompDenom > 0) {
    insights.push({
      text: `Staff compliance with keyholding protocols at ${staffComplianceRate}% — while many staff follow procedures, inconsistency means the security framework has weak points. Targeted training and supervision would help.`,
      severity: "warning",
    });
  }

  if (overdueAuditRate >= 15 && overdueAuditRate < 30 && totalSecurityAuditRecords > 0) {
    insights.push({
      text: `${overdueAuditRate}% of security audits overdue — while the majority are on schedule, gaps in the audit cycle mean some security measures are not being regularly verified.`,
      severity: "warning",
    });
  }

  if (auditActionCompletionRate >= 50 && auditActionCompletionRate < 70 && totalActionsRaised > 0) {
    insights.push({
      text: `Security audit action completion at ${auditActionCompletionRate}% — some identified vulnerabilities are not being addressed. Without follow-through, audits become a paper exercise rather than a genuine security improvement tool.`,
      severity: "warning",
    });
  }

  if (duplicateRate >= 20 && totalKeyRegisterRecords > 0) {
    insights.push({
      text: `${duplicateRate}% of key register entries show duplicate keys exist — while spares may be legitimate, uncontrolled duplicates create security risks. Each duplicate should be accounted for and its holder authorised.`,
      severity: "warning",
    });
  }

  if (unauthorisedAttemptRate >= 5 && unauthorisedAttemptRate < 10 && totalAccessControlRecords > 0) {
    insights.push({
      text: `${unauthorisedAttemptRate}% unauthorised access attempts recorded — while access controls are detecting these, the frequency suggests potential vulnerabilities or gaps in visitor/access management protocols.`,
      severity: "warning",
    });
  }

  if (handoverWitnessedRate >= 50 && handoverWitnessedRate < 80 && totalKeyTrackingRecords > 0) {
    insights.push({
      text: `Key handover witnessing at ${handoverWitnessedRate}% — not all key handovers are witnessed, creating accountability gaps. Witnessed handovers are essential for maintaining the chain of custody.`,
      severity: "warning",
    });
  }

  if (shiftEndComplianceRate < 80 && shiftEndComplianceRate >= 50 && totalKeyTrackingRecords > 0) {
    insights.push({
      text: `Shift-end key return compliance at ${shiftEndComplianceRate}% — some staff are not returning keys at the end of their shifts, leaving keys unaccounted for outside working hours.`,
      severity: "warning",
    });
  }

  // Identify audit type coverage
  const auditTypeCounts: Record<string, number> = {};
  for (const a of security_audit_records) {
    auditTypeCounts[a.audit_type] = (auditTypeCounts[a.audit_type] ?? 0) + 1;
  }
  const allAuditTypes = ["key_register", "access_control", "perimeter", "cctv", "alarm_system", "locks", "fire_exit"];
  const missingAuditTypes = allAuditTypes.filter(
    (t) => !auditTypeCounts[t] || auditTypeCounts[t] === 0,
  );
  if (missingAuditTypes.length >= 3 && totalSecurityAuditRecords > 3) {
    insights.push({
      text: `Security audits are not covering all domains — no audits recorded for ${missingAuditTypes.join(", ")}. A comprehensive security programme should cover all physical security aspects including keys, access controls, perimeter, CCTV, alarms, locks, and fire exits.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (keyholding_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding keyholding and access control — key registers are accurate, access controls are consistently compliant, key tracking is rigorous, security audits pass at high rates, and child-safe measures are comprehensive. This contributes directly to children's safety and the home's regulatory compliance under CHR 2015 Reg 25.",
      severity: "positive",
    });
  }

  if (
    keyRegisterRate >= 95 &&
    locationCorrectRate >= 95 &&
    totalKeyRegisterRecords > 0
  ) {
    insights.push({
      text: `${keyRegisterRate}% key register accuracy with ${locationCorrectRate}% of keys in correct locations — the home maintains exemplary key control with complete accountability for all keys. This provides strong evidence of premises security management for Ofsted inspection.`,
      severity: "positive",
    });
  }

  if (
    accessControlRate >= 95 &&
    accessLoggedRate >= 95 &&
    totalAccessControlRecords > 0
  ) {
    insights.push({
      text: `${accessControlRate}% access control compliance with ${accessLoggedRate}% of access events logged — comprehensive and consistent access control demonstrates effective premises security governance.`,
      severity: "positive",
    });
  }

  if (
    keyTrackingRate >= 95 &&
    handoverWitnessedRate >= 95 &&
    signedForRate >= 95 &&
    totalKeyTrackingRecords > 0
  ) {
    insights.push({
      text: `${keyTrackingRate}% key tracking compliance with ${handoverWitnessedRate}% witnessed handovers and ${signedForRate}% signed for — exemplary key issue and return practices with full chain of custody accountability.`,
      severity: "positive",
    });
  }

  if (
    securityAuditRate >= 90 &&
    auditActionCompletionRate >= 90 &&
    totalSecurityAuditRecords > 0 &&
    totalActionsRaised > 0
  ) {
    insights.push({
      text: `${securityAuditRate}% security audit pass rate with ${auditActionCompletionRate}% of actions completed — security audits are both identifying and resolving issues effectively, demonstrating a mature security governance cycle.`,
      severity: "positive",
    });
  }

  if (
    childSafeRate >= 95 &&
    canExitSafelyRate >= 95 &&
    hazardFreeRate >= 95 &&
    totalChildSafeRecords > 0
  ) {
    insights.push({
      text: `${childSafeRate}% child-safe compliance with ${canExitSafelyRate}% safe exit confirmation and ${hazardFreeRate}% hazard-free — children's physical safety is comprehensively protected through appropriate premises measures.`,
      severity: "positive",
    });
  }

  if (
    staffComplianceRate >= 95 &&
    totalStaffCompDenom > 0
  ) {
    insights.push({
      text: `${staffComplianceRate}% staff compliance with keyholding protocols — staff consistently follow key management procedures, demonstrating that the home's security culture is embedded in daily practice.`,
      severity: "positive",
    });
  }

  if (
    lostKeys === 0 &&
    unauthorisedAttempts === 0 &&
    totalKeyTrackingRecords > 0 &&
    totalAccessControlRecords > 0
  ) {
    insights.push({
      text: "Zero lost keys and zero unauthorised access attempts — the home's keyholding and access control measures are effectively preventing security incidents and maintaining premises integrity.",
      severity: "positive",
    });
  }

  if (
    overdueAudits === 0 &&
    totalSecurityAuditRecords > 0 &&
    totalCriticalFindings === 0
  ) {
    insights.push({
      text: "All security audits are on schedule with no critical findings — the home demonstrates proactive and effective security governance that anticipates and prevents security risks.",
      severity: "positive",
    });
  }

  if (
    restrictedItemsSecuredRate >= 95 &&
    windowRestrictorRate >= 95 &&
    totalChildSafeRecords > 0
  ) {
    insights.push({
      text: `${restrictedItemsSecuredRate}% of restricted items secured and ${windowRestrictorRate}% window restrictors fitted — the home comprehensively manages physical risks to children through consistent application of safety measures.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (keyholding_rating === "outstanding") {
    headline =
      "Outstanding keyholding and access control — key registers are accurate, access controls are robust, key tracking is rigorous, security audits consistently pass, and child-safe measures are comprehensive.";
  } else if (keyholding_rating === "good") {
    headline = `Good keyholding and access control — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (keyholding_rating === "adequate") {
    headline = `Adequate keyholding and access control — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective premises security and child safety.`;
  } else {
    headline = `Keyholding and access control is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve key management, access control, and premises security under CHR 2015 Reg 25.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    keyholding_rating,
    keyholding_score: score,
    headline,
    total_key_register_records: totalKeyRegisterRecords,
    total_access_control_records: totalAccessControlRecords,
    total_key_tracking_records: totalKeyTrackingRecords,
    total_security_audit_records: totalSecurityAuditRecords,
    total_child_safe_records: totalChildSafeRecords,
    key_register_rate: keyRegisterRate,
    access_control_rate: accessControlRate,
    key_tracking_rate: keyTrackingRate,
    security_audit_rate: securityAuditRate,
    child_safe_rate: childSafeRate,
    staff_compliance_rate: staffComplianceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
