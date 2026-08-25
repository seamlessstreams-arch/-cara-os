// ==============================================================================
// CARA -- HOME IMMUNISATION & VACCINATION COMPLIANCE INTELLIGENCE ENGINE
// Pure deterministic engine: vaccination schedule adherence, catch-up programme
// tracking, consent management, GP liaison effectiveness, and child understanding
// of immunisation.
// CHR 2015 Reg 14 (health care), Reg 5 (engaging parents and others),
// SCCIF health and wellbeing.
// Store keys: vaccinationScheduleRecords, catchUpProgrammeRecords,
//             consentManagementRecords, gpLiaisonRecords,
//             childUnderstandingRecords
// ==============================================================================

import { below, meanOf, meets, rate } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface VaccinationScheduleRecordInput {
  id: string;
  child_id: string;
  vaccine_name: string;
  vaccine_type: "routine" | "booster" | "catch_up" | "travel" | "seasonal" | "other";
  scheduled_date: string;
  administered: boolean;
  administered_date: string | null;
  administered_on_time: boolean;
  administered_by: string;
  batch_number_recorded: boolean;
  site_recorded: boolean;
  adverse_reaction_screened: boolean;
  adverse_reaction_reported: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  documented_in_health_record: boolean;
  red_book_updated: boolean;
  notes: string;
  created_at: string;
}

export interface CatchUpProgrammeRecordInput {
  id: string;
  child_id: string;
  programme_name: string;
  vaccines_required: number;
  vaccines_administered: number;
  programme_start_date: string;
  target_completion_date: string;
  programme_completed: boolean;
  on_track: boolean;
  barriers_identified: string[];
  barriers_resolved: number;
  gp_involved: boolean;
  school_nurse_involved: boolean;
  social_worker_informed: boolean;
  child_consented: boolean;
  notes: string;
  created_at: string;
}

export interface ConsentManagementRecordInput {
  id: string;
  child_id: string;
  vaccine_name: string;
  consent_type: "parental" | "gillick_competent" | "court_order" | "la_delegated" | "refused" | "pending";
  consent_obtained: boolean;
  consent_date: string | null;
  consent_giver: string;
  consent_documented: boolean;
  refusal_reason: string | null;
  refusal_followed_up: boolean;
  gillick_assessed: boolean;
  gillick_competent: boolean;
  best_interest_decision_recorded: boolean;
  escalation_required: boolean;
  escalation_completed: boolean;
  notes: string;
  created_at: string;
}

export interface GpLiaisonRecordInput {
  id: string;
  child_id: string;
  liaison_type: "registration" | "schedule_review" | "catch_up_planning" | "adverse_reaction" | "records_transfer" | "consultation" | "other";
  liaison_date: string;
  gp_registered: boolean;
  gp_responsive: boolean;
  information_shared: boolean;
  action_plan_agreed: boolean;
  action_plan_completed: boolean;
  response_within_target: boolean;
  target_days: number;
  actual_days: number;
  immunisation_history_obtained: boolean;
  records_up_to_date: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  notes: string;
  created_at: string;
}

export interface ChildUnderstandingRecordInput {
  id: string;
  child_id: string;
  session_date: string;
  session_type: "individual" | "group" | "keywork" | "health_appointment" | "other";
  age_appropriate_information_given: boolean;
  child_understood_purpose: boolean;
  child_understood_risks: boolean;
  child_understood_benefits: boolean;
  child_asked_questions: boolean;
  questions_answered: boolean;
  anxiety_addressed: boolean;
  child_felt_informed: boolean;
  child_satisfaction: number; // 1-5
  visual_aids_used: boolean;
  interpreter_used: boolean;
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  child_voice_captured: boolean;
  child_voice_summary: string;
  notes: string;
  created_at: string;
}

export interface ImmunisationInput {
  today: string;
  total_children: number;
  vaccination_schedule_records: VaccinationScheduleRecordInput[];
  catch_up_programme_records: CatchUpProgrammeRecordInput[];
  consent_management_records: ConsentManagementRecordInput[];
  gp_liaison_records: GpLiaisonRecordInput[];
  child_understanding_records: ChildUnderstandingRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type ImmunisationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ImmunisationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ImmunisationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ImmunisationResult {
  immunisation_rating: ImmunisationRating;
  immunisation_score: number;
  headline: string;
  // schedule_adherence_rate uses rate() directly (deterministic 0 on empty).
  // The 5 composite rates below are null on empty: no source records ⇒ no
  // signal. "0% catch-up / 0% consent / 0% GP liaison / 0% understanding /
  // 0% documentation" would read as a home not administering, consenting,
  // or documenting any vaccinations, not "unmeasured". Fab-0 doctrine.
  /** null when the population is empty — nothing measured, not 0%. */
  schedule_adherence_rate: number | null;
  catch_up_rate: number | null;
  consent_management_rate: number | null;
  gp_liaison_rate: number | null;
  child_understanding_rate: number | null;
  documentation_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: ImmunisationRecommendation[];
  insights: ImmunisationInsight[];
}

// -- Helpers ------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): ImmunisationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: ImmunisationRating,
  score: number,
  headline: string,
): ImmunisationResult {
  return {
    immunisation_rating: rating,
    immunisation_score: score,
    headline,
    schedule_adherence_rate: null,
    catch_up_rate: null,
    consent_management_rate: null,
    gp_liaison_rate: null,
    child_understanding_rate: null,
    documentation_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeImmunisationVaccinationCompliance(
  input: ImmunisationInput,
): ImmunisationResult {
  const {
    total_children,
    vaccination_schedule_records,
    catch_up_programme_records,
    consent_management_records,
    gp_liaison_records,
    child_understanding_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    vaccination_schedule_records.length === 0 &&
    catch_up_programme_records.length === 0 &&
    consent_management_records.length === 0 &&
    gp_liaison_records.length === 0 &&
    child_understanding_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess immunisation and vaccination compliance.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No immunisation or vaccination compliance data recorded despite children on placement -- vaccination schedule tracking, consent management, and GP liaison require urgent attention.",
      ),
      concerns: [
        "No vaccination schedule, catch-up programme, consent management, GP liaison, or child understanding records exist despite children being on placement -- the home cannot evidence that children's immunisation needs are being managed.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of vaccination schedules, consent management, GP liaison, and child immunisation understanding to evidence compliance with health care duties under Reg 14.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Health care",
        },
        {
          rank: 2,
          recommendation:
            "Obtain full immunisation histories for every child via GP registration and ensure all vaccination records are up to date in health files.",
          urgency: "immediate",
          regulatory_ref: "SCCIF -- Health and wellbeing",
        },
      ],
      insights: [
        {
          text: "The complete absence of immunisation and vaccination records means Ofsted cannot verify that children's health care needs are being met. This represents a fundamental gap in Reg 14 compliance and the home's duty to promote children's physical health.",
          severity: "critical",
        },
      ],
    };
  }

  // =========================================================================
  // COMPUTE CORE METRICS
  // =========================================================================

  // --- 1. Vaccination schedule adherence ---
  const totalScheduleRecords = vaccination_schedule_records.length;
  const administered = vaccination_schedule_records.filter((r) => r.administered).length;
  const administeredOnTime = vaccination_schedule_records.filter((r) => r.administered_on_time).length;
  const scheduleAdherenceRate = rate(administeredOnTime, totalScheduleRecords);

  const administrationRate = rate(administered, totalScheduleRecords);

  const uniqueChildrenVaccinated = new Set(
    vaccination_schedule_records.filter((r) => r.administered).map((r) => r.child_id),
  ).size;
  const vaccinationCoverageRate = rate(uniqueChildrenVaccinated, total_children);

  const adverseReactionScreened = vaccination_schedule_records.filter(
    (r) => r.administered && r.adverse_reaction_screened,
  ).length;
  const adverseScreeningRate = rate(adverseReactionScreened, administered);

  const adverseReactionsReported = vaccination_schedule_records.filter(
    (r) => r.adverse_reaction_reported,
  ).length;

  const followUpRequired = vaccination_schedule_records.filter((r) => r.follow_up_required).length;
  const followUpCompleted = vaccination_schedule_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const followUpCompletionRate = rate(followUpCompleted, followUpRequired);

  const batchNumberRecorded = vaccination_schedule_records.filter(
    (r) => r.administered && r.batch_number_recorded,
  ).length;
  const batchRecordingRate = rate(batchNumberRecorded, administered);

  const documentedInHealthRecord = vaccination_schedule_records.filter(
    (r) => r.administered && r.documented_in_health_record,
  ).length;
  const healthRecordDocRate = rate(documentedInHealthRecord, administered);

  const redBookUpdated = vaccination_schedule_records.filter(
    (r) => r.administered && r.red_book_updated,
  ).length;
  const redBookUpdateRate = rate(redBookUpdated, administered);

  // --- 2. Catch-up programme tracking ---
  const totalCatchUpRecords = catch_up_programme_records.length;
  const catchUpCompleted = catch_up_programme_records.filter((r) => r.programme_completed).length;
  const catchUpCompletionRate = rate(catchUpCompleted, totalCatchUpRecords);

  const catchUpOnTrack = catch_up_programme_records.filter((r) => r.on_track).length;
  const catchUpOnTrackRate = rate(catchUpOnTrack, totalCatchUpRecords);

  const totalCatchUpVaccinesRequired = catch_up_programme_records.reduce(
    (sum, r) => sum + r.vaccines_required, 0,
  );
  const totalCatchUpVaccinesAdministered = catch_up_programme_records.reduce(
    (sum, r) => sum + r.vaccines_administered, 0,
  );
  const catchUpVaccineProgressRate = rate(totalCatchUpVaccinesAdministered, totalCatchUpVaccinesRequired);

  // catchUpVaccineProgressRate is per REQUIRED vaccine — meanOf drops it when
  // no vaccines were required instead of averaging a phantom term.
  const catchUpRate: number | null = meanOf([
    catchUpCompletionRate, catchUpOnTrackRate, catchUpVaccineProgressRate,
  ]);

  const catchUpBarriersTotal = catch_up_programme_records.filter(
    (r) => r.barriers_identified.length > 0,
  ).length;
  const catchUpBarrierRate = rate(catchUpBarriersTotal, totalCatchUpRecords);

  const totalBarriersIdentified = catch_up_programme_records.reduce(
    (sum, r) => sum + r.barriers_identified.length, 0,
  );
  const totalBarriersResolved = catch_up_programme_records.reduce(
    (sum, r) => sum + r.barriers_resolved, 0,
  );
  const barrierResolutionRate = rate(totalBarriersResolved, totalBarriersIdentified);

  const catchUpGpInvolved = catch_up_programme_records.filter((r) => r.gp_involved).length;
  const catchUpGpInvolvementRate = rate(catchUpGpInvolved, totalCatchUpRecords);

  const catchUpSocialWorkerInformed = catch_up_programme_records.filter(
    (r) => r.social_worker_informed,
  ).length;
  const catchUpSwInformedRate = rate(catchUpSocialWorkerInformed, totalCatchUpRecords);

  // --- 3. Consent management ---
  const totalConsentRecords = consent_management_records.length;
  const consentObtained = consent_management_records.filter((r) => r.consent_obtained).length;
  const consentObtainedRate = rate(consentObtained, totalConsentRecords);

  const consentDocumented = consent_management_records.filter(
    (r) => r.consent_documented,
  ).length;
  const consentDocumentedRate = rate(consentDocumented, totalConsentRecords);

  const consentManagementRate: number | null =
    totalConsentRecords > 0 ? Math.round((consentObtainedRate! + consentDocumentedRate!) / 2) : null;

  const refusals = consent_management_records.filter(
    (r) => r.consent_type === "refused",
  );
  const refusalsFollowedUp = refusals.filter((r) => r.refusal_followed_up).length;
  const refusalFollowUpRate = rate(refusalsFollowedUp, refusals.length);

  const gillickAssessed = consent_management_records.filter(
    (r) => r.gillick_assessed,
  ).length;
  const gillickAssessedRate = rate(gillickAssessed, totalConsentRecords);

  const escalationRequired = consent_management_records.filter(
    (r) => r.escalation_required,
  ).length;
  const escalationCompleted = consent_management_records.filter(
    (r) => r.escalation_required && r.escalation_completed,
  ).length;
  const escalationCompletionRate = rate(escalationCompleted, escalationRequired);

  const bestInterestRecorded = consent_management_records.filter(
    (r) => r.best_interest_decision_recorded,
  ).length;
  const bestInterestRate = rate(bestInterestRecorded, totalConsentRecords);

  // --- 4. GP liaison effectiveness ---
  const totalGpLiaisonRecords = gp_liaison_records.length;
  const gpRegistered = gp_liaison_records.filter((r) => r.gp_registered).length;
  const gpRegistrationRate = rate(gpRegistered, totalGpLiaisonRecords);

  const gpResponsive = gp_liaison_records.filter((r) => r.gp_responsive).length;
  const gpResponsiveRate = rate(gpResponsive, totalGpLiaisonRecords);

  const infoShared = gp_liaison_records.filter((r) => r.information_shared).length;
  const infoSharedRate = rate(infoShared, totalGpLiaisonRecords);

  const actionPlanAgreed = gp_liaison_records.filter((r) => r.action_plan_agreed).length;

  const actionPlanCompleted = gp_liaison_records.filter(
    (r) => r.action_plan_agreed && r.action_plan_completed,
  ).length;
  const actionPlanCompletionRate = rate(actionPlanCompleted, actionPlanAgreed);

  const responseWithinTarget = gp_liaison_records.filter(
    (r) => r.response_within_target,
  ).length;
  const responseTimelinessRate = rate(responseWithinTarget, totalGpLiaisonRecords);

  const immunisationHistoryObtained = gp_liaison_records.filter(
    (r) => r.immunisation_history_obtained,
  ).length;
  const historyObtainedRate = rate(immunisationHistoryObtained, totalGpLiaisonRecords);

  const recordsUpToDate = gp_liaison_records.filter((r) => r.records_up_to_date).length;
  const recordsUpToDateRate = rate(recordsUpToDate, totalGpLiaisonRecords);

  const gpFollowUpRequired = gp_liaison_records.filter((r) => r.follow_up_required).length;
  const gpFollowUpCompleted = gp_liaison_records.filter(
    (r) => r.follow_up_required && r.follow_up_completed,
  ).length;
  const gpFollowUpCompletionRate = rate(gpFollowUpCompleted, gpFollowUpRequired);

  const gpLiaisonRate: number | null =
    totalGpLiaisonRecords > 0 ? Math.round(
          (gpRegistrationRate! + gpResponsiveRate! + infoSharedRate! + responseTimelinessRate!) / 4) : null;

  // --- 5. Child understanding of immunisation ---
  const totalUnderstandingRecords = child_understanding_records.length;
  const childUnderstoodPurpose = child_understanding_records.filter(
    (r) => r.child_understood_purpose,
  ).length;
  const purposeUnderstandingRate = rate(childUnderstoodPurpose, totalUnderstandingRecords);

  const ageAppropriateInfoGiven = child_understanding_records.filter(
    (r) => r.age_appropriate_information_given,
  ).length;
  const ageAppropriateRate = rate(ageAppropriateInfoGiven, totalUnderstandingRecords);

  const childFeltInformed = child_understanding_records.filter(
    (r) => r.child_felt_informed,
  ).length;
  const feltInformedRate = rate(childFeltInformed, totalUnderstandingRecords);

  const anxietyAddressed = child_understanding_records.filter(
    (r) => r.anxiety_addressed,
  ).length;
  const anxietyAddressedRate = rate(anxietyAddressed, totalUnderstandingRecords);

  const childAskedQuestions = child_understanding_records.filter(
    (r) => r.child_asked_questions,
  ).length;
  const questionsAnswered = child_understanding_records.filter(
    (r) => r.child_asked_questions && r.questions_answered,
  ).length;
  const questionsAnsweredRate = rate(questionsAnswered, childAskedQuestions);

  const childVoiceCaptured = child_understanding_records.filter(
    (r) => r.child_voice_captured,
  ).length;
  const childVoiceRate = rate(childVoiceCaptured, totalUnderstandingRecords);

  const childSatisfactionSum = child_understanding_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const childSatisfactionAvg: number | null =
    totalUnderstandingRecords > 0
      ? Math.round((childSatisfactionSum / totalUnderstandingRecords) * 100) / 100
      : null;

  const visualAidsUsed = child_understanding_records.filter(
    (r) => r.visual_aids_used,
  ).length;
  const visualAidsRate = rate(visualAidsUsed, totalUnderstandingRecords);

  const childUnderstandingRate: number | null =
    totalUnderstandingRecords > 0 ? Math.round(
          (purposeUnderstandingRate! + feltInformedRate! + ageAppropriateRate! + childVoiceRate!) / 4) : null;

  // --- 6. Documentation rate (composite) ---
  // The schedule-doc rates are measured over ADMINISTERED vaccines, which can
  // be zero even when schedules exist — meanOf drops unmeasured components.
  const docComponents: (number | null)[] = [];
  if (totalScheduleRecords > 0) {
    docComponents.push(healthRecordDocRate);
    docComponents.push(redBookUpdateRate);
    docComponents.push(batchRecordingRate);
  }
  if (totalConsentRecords > 0) docComponents.push(consentDocumentedRate!);
  const documentationRate: number | null = meanOf(docComponents);

  // =========================================================================
  // SCORING: base 52, max bonuses +28, 4 penalties guarded by array.length>0
  // =========================================================================

  let score = 52;

  // --- Bonus 1: scheduleAdherenceRate (>=90: +5, >=70: +2) ---
  if (meets(scheduleAdherenceRate, 90)) score += 5;
  else if (meets(scheduleAdherenceRate, 70)) score += 2;

  // --- Bonus 2: administrationRate (>=90: +4, >=70: +2) ---
  if (meets(administrationRate, 90)) score += 4;
  else if (meets(administrationRate, 70)) score += 2;

  // --- Bonus 3: catchUpRate (>=80: +3, >=60: +1) ---
  if (meets(catchUpRate, 80)) score += 3;
  else if (meets(catchUpRate, 60)) score += 1;

  // --- Bonus 4: consentManagementRate (>=90: +4, >=70: +2) ---
  if (meets(consentManagementRate, 90)) score += 4;
  else if (meets(consentManagementRate, 70)) score += 2;

  // --- Bonus 5: gpLiaisonRate (>=85: +3, >=65: +1) ---
  if (meets(gpLiaisonRate, 85)) score += 3;
  else if (meets(gpLiaisonRate, 65)) score += 1;

  // --- Bonus 6: childUnderstandingRate (>=80: +3, >=60: +1) ---
  if (meets(childUnderstandingRate, 80)) score += 3;
  else if (meets(childUnderstandingRate, 60)) score += 1;

  // --- Bonus 7: documentationRate (>=90: +3, >=70: +1) ---
  if (meets(documentationRate, 90)) score += 3;
  else if (meets(documentationRate, 70)) score += 1;

  // --- Bonus 8: vaccinationCoverageRate (>=90: +3, >=70: +1) ---
  if (meets(vaccinationCoverageRate, 90)) score += 3;
  else if (meets(vaccinationCoverageRate, 70)) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // scheduleAdherenceRate < 50 -> -5
  if (below(scheduleAdherenceRate, 50) && vaccination_schedule_records.length > 0) score -= 5;

  // below(consentManagementRate, 50) -> -5
  if (below(consentManagementRate, 50) && consent_management_records.length > 0) score -= 5;

  // below(gpLiaisonRate, 50) -> -4
  if (below(gpLiaisonRate, 50) && gp_liaison_records.length > 0) score -= 4;

  // below(childUnderstandingRate, 40) -> -4
  if (below(childUnderstandingRate, 40) && child_understanding_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const immunisation_rating = toRating(score);

  // =========================================================================
  // STRENGTHS
  // =========================================================================

  const strengths: string[] = [];

  // -- Schedule adherence strengths --

  if (meets(scheduleAdherenceRate, 90) && totalScheduleRecords > 0) {
    strengths.push(
      `${scheduleAdherenceRate}% of vaccinations administered on time -- the home demonstrates excellent adherence to the NHS vaccination schedule, ensuring children are protected against preventable diseases.`,
    );
  } else if (meets(scheduleAdherenceRate, 70) && totalScheduleRecords > 0) {
    strengths.push(
      `${scheduleAdherenceRate}% schedule adherence rate -- most vaccinations are administered on time, providing good protection for children.`,
    );
  }

  if (meets(administrationRate, 90) && totalScheduleRecords > 0) {
    strengths.push(
      `${administrationRate}% vaccination administration rate -- nearly all scheduled vaccinations have been delivered, demonstrating strong health care management.`,
    );
  }

  if (meets(vaccinationCoverageRate, 90) && total_children > 0) {
    strengths.push(
      `${vaccinationCoverageRate}% of children have received vaccinations -- comprehensive coverage across the home ensures herd immunity and individual protection.`,
    );
  }

  if (meets(adverseScreeningRate, 90) && administered > 0) {
    strengths.push(
      `${adverseScreeningRate}% adverse reaction screening rate -- the home consistently monitors for adverse reactions post-vaccination, demonstrating diligent health surveillance.`,
    );
  }

  if (meets(followUpCompletionRate, 90) && followUpRequired > 0) {
    strengths.push(
      `${followUpCompletionRate}% of vaccination follow-ups completed -- the home reliably ensures follow-up actions are carried through.`,
    );
  }

  // -- Catch-up programme strengths --

  if (meets(catchUpRate, 80) && totalCatchUpRecords > 0) {
    strengths.push(
      `Catch-up programme composite rate at ${catchUpRate}% -- programmes are well-managed with strong completion, on-track progress, and vaccine delivery.`,
    );
  } else if (meets(catchUpRate, 60) && totalCatchUpRecords > 0) {
    strengths.push(
      `Catch-up programme rate at ${catchUpRate}% -- good progress in managing catch-up vaccination programmes for children who arrived with incomplete records.`,
    );
  }

  if (meets(catchUpCompletionRate, 80) && totalCatchUpRecords > 0) {
    strengths.push(
      `${catchUpCompletionRate}% of catch-up programmes completed -- children who arrived with incomplete vaccination histories are being brought up to date effectively.`,
    );
  }

  if (meets(catchUpGpInvolvementRate, 80) && totalCatchUpRecords > 0) {
    strengths.push(
      `GP involved in ${catchUpGpInvolvementRate}% of catch-up programmes -- strong multi-agency working ensures clinical oversight of catch-up vaccination delivery.`,
    );
  }

  if (meets(barrierResolutionRate, 80) && totalBarriersIdentified > 0) {
    strengths.push(
      `${barrierResolutionRate}% of catch-up programme barriers resolved -- the home proactively identifies and removes obstacles to vaccination completion.`,
    );
  }

  if (meets(catchUpSwInformedRate, 80) && totalCatchUpRecords > 0) {
    strengths.push(
      `Social workers informed in ${catchUpSwInformedRate}% of catch-up programmes -- good communication with placing authorities about children's vaccination status.`,
    );
  }

  // -- Consent management strengths --

  if (meets(consentManagementRate, 90) && totalConsentRecords > 0) {
    strengths.push(
      `${consentManagementRate}% consent management rate -- consent is consistently obtained and documented for vaccinations, demonstrating robust governance.`,
    );
  } else if (meets(consentManagementRate, 70) && totalConsentRecords > 0) {
    strengths.push(
      `${consentManagementRate}% consent management rate -- good practice in obtaining and documenting vaccination consent.`,
    );
  }

  if (meets(consentDocumentedRate, 90) && totalConsentRecords > 0) {
    strengths.push(
      `${consentDocumentedRate}% of consent decisions documented -- the home maintains comprehensive consent records as required under Reg 14.`,
    );
  }

  if (meets(refusalFollowUpRate, 90) && refusals.length > 0) {
    strengths.push(
      `${refusalFollowUpRate}% of consent refusals followed up -- the home takes appropriate action when consent is refused, including exploring alternatives and recording best-interest decisions.`,
    );
  }

  if (meets(escalationCompletionRate, 90) && escalationRequired > 0) {
    strengths.push(
      `${escalationCompletionRate}% of consent escalations completed -- the home effectively manages complex consent situations requiring escalation.`,
    );
  }

  if (meets(gillickAssessedRate, 70) && totalConsentRecords > 0) {
    strengths.push(
      `Gillick competence assessed in ${gillickAssessedRate}% of consent cases -- the home respects children's evolving capacity to make informed health decisions.`,
    );
  }

  if (meets(bestInterestRate, 80) && totalConsentRecords > 0) {
    strengths.push(
      `Best-interest decisions recorded in ${bestInterestRate}% of consent cases -- robust decision-making governance that Ofsted will view as evidence of child-centred practice.`,
    );
  }

  // -- GP liaison strengths --

  if (meets(gpLiaisonRate, 85) && totalGpLiaisonRecords > 0) {
    strengths.push(
      `GP liaison effectiveness at ${gpLiaisonRate}% -- excellent communication and coordination with GPs ensures children's immunisation needs are clinically managed.`,
    );
  } else if (meets(gpLiaisonRate, 65) && totalGpLiaisonRecords > 0) {
    strengths.push(
      `GP liaison rate at ${gpLiaisonRate}% -- good working relationships with GPs support children's vaccination management.`,
    );
  }

  if (meets(gpRegistrationRate, 90) && totalGpLiaisonRecords > 0) {
    strengths.push(
      `${gpRegistrationRate}% GP registration rate -- nearly all children are registered with a GP, enabling timely access to vaccination services.`,
    );
  }

  if (meets(historyObtainedRate, 85) && totalGpLiaisonRecords > 0) {
    strengths.push(
      `Immunisation histories obtained in ${historyObtainedRate}% of GP liaison contacts -- the home ensures comprehensive vaccination records inform care planning.`,
    );
  }

  if (meets(responseTimelinessRate, 85) && totalGpLiaisonRecords > 0) {
    strengths.push(
      `${responseTimelinessRate}% GP responses within target timeframes -- effective liaison arrangements ensure timely clinical input for vaccination decisions.`,
    );
  }

  if (meets(actionPlanCompletionRate, 85) && actionPlanAgreed > 0) {
    strengths.push(
      `${actionPlanCompletionRate}% of GP action plans completed -- agreed immunisation plans are reliably followed through to completion.`,
    );
  }

  if (meets(recordsUpToDateRate, 85) && totalGpLiaisonRecords > 0) {
    strengths.push(
      `${recordsUpToDateRate}% of GP records confirmed up to date -- the home and GP maintain accurate, current immunisation records.`,
    );
  }

  if (meets(gpFollowUpCompletionRate, 85) && gpFollowUpRequired > 0) {
    strengths.push(
      `${gpFollowUpCompletionRate}% of GP liaison follow-ups completed -- the home ensures continuity in GP communication about vaccination matters.`,
    );
  }

  // -- Child understanding strengths --

  if (meets(childUnderstandingRate, 80) && totalUnderstandingRecords > 0) {
    strengths.push(
      `Child understanding composite rate at ${childUnderstandingRate}% -- children are well-informed about immunisation purpose, risks, and benefits through age-appropriate education.`,
    );
  } else if (meets(childUnderstandingRate, 60) && totalUnderstandingRecords > 0) {
    strengths.push(
      `Child understanding rate at ${childUnderstandingRate}% -- good practice in helping children understand the purpose and importance of vaccinations.`,
    );
  }

  if (meets(purposeUnderstandingRate, 85) && totalUnderstandingRecords > 0) {
    strengths.push(
      `${purposeUnderstandingRate}% of children understood the purpose of their vaccinations -- children are empowered with knowledge about why immunisation matters.`,
    );
  }

  if (meets(feltInformedRate, 85) && totalUnderstandingRecords > 0) {
    strengths.push(
      `${feltInformedRate}% of children felt fully informed about their vaccinations -- children's right to information is being respected.`,
    );
  }

  if (meets(anxietyAddressedRate, 80) && totalUnderstandingRecords > 0) {
    strengths.push(
      `Anxiety addressed in ${anxietyAddressedRate}% of immunisation education sessions -- the home takes children's emotional wellbeing seriously when managing vaccinations.`,
    );
  }

  if (meets(questionsAnsweredRate, 90) && childAskedQuestions > 0) {
    strengths.push(
      `${questionsAnsweredRate}% of children's questions answered -- when children ask about vaccinations, staff provide responsive, informed answers.`,
    );
  }

  if (meets(childVoiceRate, 80) && totalUnderstandingRecords > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of immunisation education sessions -- children's views and concerns about vaccination genuinely inform the approach taken.`,
    );
  }

  if (meets(childSatisfactionAvg, 4.0) && totalUnderstandingRecords > 0) {
    strengths.push(
      `Children's satisfaction with immunisation education averages ${childSatisfactionAvg}/5 -- children feel positively about how vaccination information is communicated to them.`,
    );
  }

  if (meets(visualAidsRate, 60) && totalUnderstandingRecords > 0) {
    strengths.push(
      `Visual aids used in ${visualAidsRate}% of sessions -- the home uses age-appropriate resources to support children's understanding of immunisation.`,
    );
  }

  // -- Documentation strengths --

  if (meets(documentationRate, 90)) {
    strengths.push(
      `Documentation rate at ${documentationRate}% -- the home maintains exemplary vaccination records across health files, red books, batch numbers, and consent forms.`,
    );
  } else if (meets(documentationRate, 70)) {
    strengths.push(
      `Documentation rate at ${documentationRate}% -- good record-keeping supports accountability and continuity of care for children's immunisation.`,
    );
  }

  if (meets(healthRecordDocRate, 90) && administered > 0) {
    strengths.push(
      `${healthRecordDocRate}% of vaccinations documented in health records -- comprehensive health file maintenance ensures vaccination history is always available.`,
    );
  }

  if (meets(redBookUpdateRate, 90) && administered > 0) {
    strengths.push(
      `Red books updated for ${redBookUpdateRate}% of vaccinations -- the child's personal health record is consistently maintained.`,
    );
  }

  // =========================================================================
  // CONCERNS
  // =========================================================================

  const concerns: string[] = [];

  // -- Schedule adherence concerns --

  if (below(scheduleAdherenceRate, 50) && totalScheduleRecords > 0) {
    concerns.push(
      `Only ${scheduleAdherenceRate}% of vaccinations administered on time -- the majority of children are not receiving vaccinations in line with the NHS schedule, leaving them unprotected against preventable diseases.`,
    );
  } else if (below(scheduleAdherenceRate, 70) && meets(scheduleAdherenceRate, 50) && totalScheduleRecords > 0) {
    concerns.push(
      `Schedule adherence at ${scheduleAdherenceRate}% -- a significant proportion of vaccinations are not being administered on time.`,
    );
  }

  if (below(administrationRate, 50) && totalScheduleRecords > 0) {
    concerns.push(
      `Only ${administrationRate}% of scheduled vaccinations administered -- the majority of planned vaccinations have not been delivered, putting children at significant health risk.`,
    );
  } else if (below(administrationRate, 70) && meets(administrationRate, 50) && totalScheduleRecords > 0) {
    concerns.push(
      `Vaccination administration rate at ${administrationRate}% -- some scheduled vaccinations are not being delivered.`,
    );
  }

  if (below(vaccinationCoverageRate, 50) && total_children > 0 && totalScheduleRecords > 0) {
    concerns.push(
      `Only ${vaccinationCoverageRate}% of children have received vaccinations -- low coverage undermines individual protection and herd immunity within the home.`,
    );
  }

  if (below(adverseScreeningRate, 70) && administered > 0) {
    concerns.push(
      `Adverse reaction screening at only ${adverseScreeningRate}% -- not all children are being monitored for adverse reactions post-vaccination, which is a clinical safety concern.`,
    );
  }

  if (below(followUpCompletionRate, 60) && followUpRequired > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of vaccination follow-ups completed -- outstanding follow-up actions may mean children's health needs are not being properly managed.`,
    );
  }

  // -- Catch-up programme concerns --

  if (below(catchUpRate, 50) && totalCatchUpRecords > 0) {
    concerns.push(
      `Catch-up programme composite rate at only ${catchUpRate}% -- children who arrived with incomplete vaccination histories are not being effectively brought up to date, perpetuating health inequalities.`,
    );
  } else if (below(catchUpRate, 60) && meets(catchUpRate, 50) && totalCatchUpRecords > 0) {
    concerns.push(
      `Catch-up programme rate at ${catchUpRate}% -- progress in bringing children's vaccinations up to date needs improvement.`,
    );
  }

  if (below(catchUpCompletionRate, 50) && totalCatchUpRecords > 0) {
    concerns.push(
      `Only ${catchUpCompletionRate}% of catch-up programmes completed -- the majority of children in catch-up programmes have not yet completed their vaccination courses.`,
    );
  }

  if (meets(catchUpBarrierRate, 40) && totalCatchUpRecords > 0) {
    concerns.push(
      `Barriers identified in ${catchUpBarrierRate}% of catch-up programmes -- persistent obstacles are preventing children from completing their vaccination catch-up.`,
    );
  }

  if (below(catchUpGpInvolvementRate, 50) && totalCatchUpRecords > 0) {
    concerns.push(
      `GP involved in only ${catchUpGpInvolvementRate}% of catch-up programmes -- insufficient clinical oversight of catch-up vaccination delivery.`,
    );
  }

  // -- Consent management concerns --

  if (below(consentManagementRate, 50) && totalConsentRecords > 0) {
    concerns.push(
      `Consent management rate at only ${consentManagementRate}% -- the majority of vaccination consent decisions are not properly obtained or documented, creating significant governance risk.`,
    );
  } else if (below(consentManagementRate, 70) && meets(consentManagementRate, 50) && totalConsentRecords > 0) {
    concerns.push(
      `Consent management at ${consentManagementRate}% -- consent processes for vaccinations need strengthening.`,
    );
  }

  if (below(consentDocumentedRate, 60) && totalConsentRecords > 0) {
    concerns.push(
      `Only ${consentDocumentedRate}% of consent decisions documented -- poor documentation of vaccination consent leaves the home vulnerable at inspection and unable to evidence lawful authority for health interventions.`,
    );
  }

  if (below(refusalFollowUpRate, 50) && refusals.length > 0) {
    concerns.push(
      `Only ${refusalFollowUpRate}% of consent refusals followed up -- when consent is refused, the home is not consistently exploring alternatives or recording best-interest decisions.`,
    );
  }

  if (below(escalationCompletionRate, 60) && escalationRequired > 0) {
    concerns.push(
      `Only ${escalationCompletionRate}% of consent escalations completed -- unresolved consent escalations may mean children are missing vaccinations unnecessarily.`,
    );
  }

  // -- GP liaison concerns --

  if (below(gpLiaisonRate, 50) && totalGpLiaisonRecords > 0) {
    concerns.push(
      `GP liaison effectiveness at only ${gpLiaisonRate}% -- poor communication with GPs means children's immunisation needs are not being clinically managed, undermining the home's duty under Reg 14.`,
    );
  } else if (below(gpLiaisonRate, 65) && meets(gpLiaisonRate, 50) && totalGpLiaisonRecords > 0) {
    concerns.push(
      `GP liaison rate at ${gpLiaisonRate}% -- liaison with GPs about vaccination matters needs improvement.`,
    );
  }

  if (below(gpRegistrationRate, 70) && totalGpLiaisonRecords > 0) {
    concerns.push(
      `GP registration rate at only ${gpRegistrationRate}% -- not all children are registered with a GP, creating barriers to vaccination access and health care continuity.`,
    );
  }

  if (below(historyObtainedRate, 60) && totalGpLiaisonRecords > 0) {
    concerns.push(
      `Immunisation histories obtained in only ${historyObtainedRate}% of GP contacts -- without complete vaccination histories, the home cannot identify gaps or plan catch-up programmes effectively.`,
    );
  }

  if (below(responseTimelinessRate, 60) && totalGpLiaisonRecords > 0) {
    concerns.push(
      `Only ${responseTimelinessRate}% of GP responses within target -- slow GP responses are delaying vaccination decisions and potentially leaving children unprotected.`,
    );
  }

  if (below(recordsUpToDateRate, 60) && totalGpLiaisonRecords > 0) {
    concerns.push(
      `Only ${recordsUpToDateRate}% of GP records confirmed up to date -- discrepancies between home and GP vaccination records may mean children's immunisation status is inaccurate.`,
    );
  }

  // -- Child understanding concerns --

  if (below(childUnderstandingRate, 40) && totalUnderstandingRecords > 0) {
    concerns.push(
      `Child understanding rate at only ${childUnderstandingRate}% -- children are not adequately informed about immunisation, undermining their capacity to participate in health decisions and potentially increasing anxiety.`,
    );
  } else if (below(childUnderstandingRate, 60) && meets(childUnderstandingRate, 40) && totalUnderstandingRecords > 0) {
    concerns.push(
      `Child understanding rate at ${childUnderstandingRate}% -- more work is needed to help children understand the purpose and importance of their vaccinations.`,
    );
  }

  if (below(purposeUnderstandingRate, 50) && totalUnderstandingRecords > 0) {
    concerns.push(
      `Only ${purposeUnderstandingRate}% of children understood the purpose of their vaccinations -- children are not being given adequate information to make sense of their health care.`,
    );
  }

  if (below(feltInformedRate, 50) && totalUnderstandingRecords > 0) {
    concerns.push(
      `Only ${feltInformedRate}% of children felt informed about their vaccinations -- children's right to health information is not being consistently respected.`,
    );
  }

  if (below(childVoiceRate, 50) && totalUnderstandingRecords > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceRate}% of immunisation sessions -- children's views and concerns are not sufficiently shaping how vaccination information is delivered and decisions are made.`,
    );
  }

  if (below(childSatisfactionAvg, 3.0) && totalUnderstandingRecords > 0) {
    concerns.push(
      `Children's satisfaction with immunisation education averages only ${childSatisfactionAvg}/5 -- children do not feel positively about how vaccination is communicated to them.`,
    );
  }

  // -- Documentation concerns --

  if (below(documentationRate, 50)) {
    concerns.push(
      `Documentation rate at only ${documentationRate}% -- poor record-keeping means the home cannot evidence vaccination compliance and children's health records are incomplete.`,
    );
  } else if (below(documentationRate, 70) && meets(documentationRate, 50)) {
    concerns.push(
      `Documentation rate at ${documentationRate}% -- vaccination record-keeping needs improvement to meet regulatory expectations.`,
    );
  }

  if (below(healthRecordDocRate, 60) && administered > 0) {
    concerns.push(
      `Only ${healthRecordDocRate}% of vaccinations documented in health records -- incomplete health files undermine continuity of care and inspection readiness.`,
    );
  }

  if (below(redBookUpdateRate, 60) && administered > 0) {
    concerns.push(
      `Red books updated for only ${redBookUpdateRate}% of vaccinations -- the child's personal health record is not being consistently maintained.`,
    );
  }

  // -- Missing data concerns --

  if (totalScheduleRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No vaccination schedule records despite children being on placement -- the home has no evidence of tracking or managing children's vaccination schedules.",
    );
  }

  if (totalConsentRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No vaccination consent records -- the home cannot evidence that lawful consent has been obtained for any vaccinations administered.",
    );
  }

  if (totalGpLiaisonRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No GP liaison records relating to immunisation -- the home cannot evidence clinical coordination for children's vaccination needs.",
    );
  }

  if (totalUnderstandingRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child understanding records -- the home has not documented whether children understand the purpose and importance of their vaccinations.",
    );
  }

  // =========================================================================
  // RECOMMENDATIONS
  // =========================================================================

  const recommendations: ImmunisationRecommendation[] = [];
  let rank = 0;

  // -- Immediate recommendations --

  if (below(scheduleAdherenceRate, 50) && totalScheduleRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review all overdue vaccinations and establish a tracking system with automated reminders to ensure every child receives vaccinations in line with the NHS schedule. Liaise with GPs and school nurses to expedite delivery.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(consentManagementRate, 50) && totalConsentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust consent management process for all vaccinations -- obtain consent from the appropriate person (parent, LA, or Gillick-competent child), document every decision, and ensure refusals trigger best-interest reviews.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; Reg 5 -- Engaging parents",
    });
  }

  if (below(gpLiaisonRate, 50) && totalGpLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish regular, structured liaison with GPs for every child -- ensure GP registration is prioritised on admission, immunisation histories are obtained, and action plans are agreed and followed through.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(childUnderstandingRate, 40) && totalUnderstandingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and deliver age-appropriate immunisation education for every child -- ensure children understand why vaccinations matter, what the risks and benefits are, and that their questions and anxieties are addressed.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (totalScheduleRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin immediately tracking vaccination schedules for every child -- obtain immunisation histories from GPs and map each child's vaccination status against the NHS schedule.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalConsentRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish vaccination consent recording for all children immediately -- document consent type, who gave consent, and any refusals with follow-up actions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; Reg 5 -- Engaging parents",
    });
  }

  if (below(administrationRate, 50) && totalScheduleRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address undelivered vaccinations -- identify barriers to administration and work with GPs, school nurses, and placing authorities to ensure every scheduled vaccination is completed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(catchUpRate, 50) && totalCatchUpRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all catch-up programmes and establish clear timelines, GP involvement, and barrier-resolution plans to bring every child's vaccinations up to date.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  // -- Soon recommendations --

  if (meets(scheduleAdherenceRate, 50) && below(scheduleAdherenceRate, 70) && totalScheduleRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve vaccination timeliness to at least 70% -- implement a reminder system and ensure staff understand the importance of timely vaccination delivery.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (meets(consentManagementRate, 50) && below(consentManagementRate, 70) && totalConsentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen consent documentation and processes -- ensure every vaccination consent decision is recorded with the consent type, date, giver, and any Gillick assessment outcome.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; Reg 5 -- Engaging parents",
    });
  }

  if (meets(gpLiaisonRate, 50) && below(gpLiaisonRate, 65) && totalGpLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve GP liaison effectiveness to at least 65% -- ensure information sharing is reciprocal, response times are tracked, and action plans are consistently completed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (meets(childUnderstandingRate, 40) && below(childUnderstandingRate, 60) && totalUnderstandingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance immunisation education for children -- use visual aids, age-appropriate resources, and one-to-one sessions to improve understanding and reduce anxiety about vaccinations.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (below(refusalFollowUpRate, 50) && refusals.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Follow up on all vaccination consent refusals -- explore the reasons, provide additional information, consider Gillick competence assessment, and record best-interest decisions where appropriate.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care; Reg 5 -- Engaging parents",
    });
  }

  if (below(gpRegistrationRate, 70) && totalGpLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise GP registration for all children -- ensure every child is registered with a GP within 5 working days of admission to enable timely access to vaccination services.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(historyObtainedRate, 60) && totalGpLiaisonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Obtain complete immunisation histories for all children from their registered GPs -- this is essential for identifying vaccination gaps and planning catch-up programmes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(documentationRate, 50)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a standardised vaccination documentation checklist covering health records, red books, batch numbers, and consent forms -- every vaccination must be fully documented.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (meets(catchUpBarrierRate, 40) && totalCatchUpRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a barriers analysis for catch-up programmes and develop targeted solutions -- involve GPs, school nurses, and placing authorities in removing obstacles to vaccination completion.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (totalGpLiaisonRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish formal GP liaison processes for immunisation management -- schedule regular review meetings and ensure every child's GP is engaged in vaccination planning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalUnderstandingRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin documenting immunisation education sessions with every child -- record whether children understand the purpose, risks, and benefits of their vaccinations and capture their views.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  // -- Planned recommendations --

  if (meets(documentationRate, 50) && below(documentationRate, 70)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve vaccination documentation to at least 70% -- audit current record-keeping practices and address gaps in health records, red book updates, and batch number recording.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (meets(catchUpRate, 50) && below(catchUpRate, 80) && totalCatchUpRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen catch-up programme management -- set clear milestones, monitor progress monthly, and ensure every programme has GP involvement and social worker notification.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (below(childVoiceRate, 60) && meets(childVoiceRate, 50) && totalUnderstandingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed child voice more consistently in immunisation discussions -- use keywork sessions and health appointments to explore children's views and concerns about vaccination.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (below(adverseScreeningRate, 70) && meets(adverseScreeningRate, 50) && administered > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a post-vaccination adverse reaction screening protocol -- every child should be monitored after vaccination with any reactions documented and reported.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(gillickAssessedRate, 50) && totalConsentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess Gillick competence for age-appropriate children in relation to vaccination consent -- respect children's evolving capacity to make informed decisions about their own health care.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (below(visualAidsRate, 40) && totalUnderstandingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Source and use age-appropriate visual aids and resources for immunisation education -- picture books, animations, and interactive materials can significantly improve children's understanding and reduce anxiety.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  // =========================================================================
  // INSIGHTS
  // =========================================================================

  const insights: ImmunisationInsight[] = [];

  // --- Critical insights ---

  if (below(scheduleAdherenceRate, 50) && totalScheduleRecords > 0) {
    insights.push({
      text: `Only ${scheduleAdherenceRate}% of vaccinations administered on time. Ofsted will view failure to maintain children's vaccination schedules as evidence that the home is not meeting its health care duties under Reg 14. Children in care are already at higher risk of health inequalities -- delayed or missed vaccinations compound this disadvantage.`,
      severity: "critical",
    });
  }

  if (below(consentManagementRate, 50) && totalConsentRecords > 0) {
    insights.push({
      text: `Consent management at only ${consentManagementRate}%. Without properly obtained and documented consent, vaccinations may have been administered unlawfully. This creates significant safeguarding and governance risk. Ofsted expects clear evidence of who consented to each vaccination and on what basis.`,
      severity: "critical",
    });
  }

  if (below(gpLiaisonRate, 50) && totalGpLiaisonRecords > 0) {
    insights.push({
      text: `GP liaison effectiveness at only ${gpLiaisonRate}%. Poor coordination with GPs means children's immunisation needs are not being clinically managed. Ofsted expects homes to work proactively with health professionals to ensure children receive comprehensive health care under Reg 14.`,
      severity: "critical",
    });
  }

  if (below(administrationRate, 50) && totalScheduleRecords > 0) {
    insights.push({
      text: `Only ${administrationRate}% of scheduled vaccinations delivered. The majority of planned vaccinations have not been administered, leaving children unprotected against serious diseases. This is a direct failure of the home's health care duty.`,
      severity: "critical",
    });
  }

  if (totalScheduleRecords === 0 && totalConsentRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No vaccination schedule or consent records despite children being on placement. Ofsted cannot verify that children's immunisation needs are being identified, planned for, or delivered. This is a fundamental gap in health care provision under Reg 14.",
      severity: "critical",
    });
  }

  if (below(catchUpCompletionRate, 30) && totalCatchUpRecords > 0) {
    insights.push({
      text: `Only ${catchUpCompletionRate}% of catch-up programmes completed. Children who entered care with incomplete vaccinations are not being brought up to date, perpetuating the health inequalities that care is supposed to address.`,
      severity: "critical",
    });
  }

  if (below(gpRegistrationRate, 50) && totalGpLiaisonRecords > 0) {
    insights.push({
      text: `GP registration rate at only ${gpRegistrationRate}%. Children who are not registered with a GP cannot access routine vaccination services. Ofsted views GP registration as a basic requirement of health care under Reg 14.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (meets(scheduleAdherenceRate, 50) && below(scheduleAdherenceRate, 70) && totalScheduleRecords > 0) {
    insights.push({
      text: `Schedule adherence at ${scheduleAdherenceRate}% -- improving but some children are still receiving vaccinations late. Timely vaccination is essential for maximum protection and the home should aim for at least 90% on-time delivery.`,
      severity: "warning",
    });
  }

  if (meets(consentManagementRate, 50) && below(consentManagementRate, 70) && totalConsentRecords > 0) {
    insights.push({
      text: `Consent management at ${consentManagementRate}% -- some vaccinations lack properly obtained or documented consent. Ofsted inspectors will want to see clear consent trails for every vaccination.`,
      severity: "warning",
    });
  }

  if (meets(catchUpRate, 50) && below(catchUpRate, 80) && totalCatchUpRecords > 0) {
    insights.push({
      text: `Catch-up programme rate at ${catchUpRate}% -- children are making some progress but catch-up programmes need more structured management to ensure all children achieve full vaccination status.`,
      severity: "warning",
    });
  }

  if (meets(gpLiaisonRate, 50) && below(gpLiaisonRate, 65) && totalGpLiaisonRecords > 0) {
    insights.push({
      text: `GP liaison at ${gpLiaisonRate}% -- communication with GPs about vaccination matters is inconsistent. The home should establish regular, structured liaison to ensure clinical oversight of immunisation management.`,
      severity: "warning",
    });
  }

  if (meets(childUnderstandingRate, 40) && below(childUnderstandingRate, 60) && totalUnderstandingRecords > 0) {
    insights.push({
      text: `Child understanding at ${childUnderstandingRate}% -- children need more support to understand why immunisation matters. Looked-after children may have missed health education opportunities and deserve additional investment in their understanding.`,
      severity: "warning",
    });
  }

  if (meets(documentationRate, 50) && below(documentationRate, 70)) {
    insights.push({
      text: `Documentation rate at ${documentationRate}% -- while some records are maintained, gaps in health record documentation, red book updates, or batch number recording could undermine inspection readiness.`,
      severity: "warning",
    });
  }

  if (meets(childVoiceRate, 50) && below(childVoiceRate, 80) && totalUnderstandingRecords > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of immunisation sessions -- while consultation is happening, children's views need to be more consistently informing how vaccination information is delivered and decisions are made.`,
      severity: "warning",
    });
  }

  if (below(refusalFollowUpRate, 50) && refusals.length > 0) {
    insights.push({
      text: `Only ${refusalFollowUpRate}% of consent refusals followed up. When consent for vaccination is refused, the home must explore reasons, provide additional information, and record best-interest decisions. Unresolved refusals may leave children unprotected.`,
      severity: "warning",
    });
  }

  if (meets(catchUpBarrierRate, 40) && totalCatchUpRecords > 0) {
    insights.push({
      text: `Barriers identified in ${catchUpBarrierRate}% of catch-up programmes -- persistent obstacles to vaccination completion need a coordinated, multi-agency approach to resolve.`,
      severity: "warning",
    });
  }

  if (adverseReactionsReported > 0 && totalScheduleRecords > 0) {
    insights.push({
      text: `${adverseReactionsReported} adverse reaction${adverseReactionsReported !== 1 ? "s" : ""} reported across ${totalScheduleRecords} vaccination records. While adverse reactions are usually mild and expected, the home should ensure each is properly documented, reported via the Yellow Card scheme where appropriate, and followed up.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (immunisation_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding immunisation and vaccination compliance -- children's vaccination schedules are managed proactively, consent processes are robust, GP liaison is effective, and children understand why immunisation matters. This is strong evidence for Reg 14 compliance.",
      severity: "positive",
    });
  }

  if (meets(scheduleAdherenceRate, 90) && meets(administrationRate, 90) && totalScheduleRecords > 0) {
    insights.push({
      text: `${scheduleAdherenceRate}% on-time delivery with ${administrationRate}% administration rate -- the home achieves near-complete, timely vaccination delivery. This level of compliance exceeds most community settings and demonstrates the home's commitment to children's physical health.`,
      severity: "positive",
    });
  }

  if (meets(consentManagementRate, 90) && totalConsentRecords > 0) {
    insights.push({
      text: `Consent management at ${consentManagementRate}% -- the home maintains exemplary consent governance for vaccinations. Every consent decision is properly obtained, documented, and traceable. Ofsted will view this as evidence of strong leadership and child-centred practice.`,
      severity: "positive",
    });
  }

  if (meets(gpLiaisonRate, 85) && totalGpLiaisonRecords > 0) {
    insights.push({
      text: `GP liaison effectiveness at ${gpLiaisonRate}% -- the home has established excellent working relationships with GPs that ensure children receive clinically informed, coordinated immunisation management.`,
      severity: "positive",
    });
  }

  if (meets(childUnderstandingRate, 80) && totalUnderstandingRecords > 0) {
    insights.push({
      text: `Child understanding rate at ${childUnderstandingRate}% -- children are well-informed about immunisation and their views actively shape how vaccination information is communicated. This empowers children to participate meaningfully in their own health decisions.`,
      severity: "positive",
    });
  }

  if (meets(catchUpRate, 80) && totalCatchUpRecords > 0) {
    insights.push({
      text: `Catch-up programme rate at ${catchUpRate}% -- the home is effectively bringing children's vaccinations up to date, addressing health inequalities and ensuring children in care receive the same standard of immunisation as their peers.`,
      severity: "positive",
    });
  }

  if (meets(documentationRate, 90)) {
    insights.push({
      text: `Documentation rate at ${documentationRate}% -- vaccination records are exemplary across health files, red books, batch numbers, and consent forms. This level of documentation provides full traceability and strong inspection evidence.`,
      severity: "positive",
    });
  }

  if (meets(vaccinationCoverageRate, 90) && total_children > 0 && totalScheduleRecords > 0) {
    insights.push({
      text: `${vaccinationCoverageRate}% of children have received vaccinations -- comprehensive coverage demonstrates that the home ensures every child is included in immunisation programmes.`,
      severity: "positive",
    });
  }

  if (meets(barrierResolutionRate, 80) && totalBarriersIdentified > 0) {
    insights.push({
      text: `${barrierResolutionRate}% of catch-up barriers resolved -- the home takes a proactive, problem-solving approach to removing obstacles that prevent children from completing their vaccinations.`,
      severity: "positive",
    });
  }

  if (meets(childVoiceRate, 80) && meets(childSatisfactionAvg, 4.0) && totalUnderstandingRecords > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of sessions with satisfaction averaging ${childSatisfactionAvg}/5 -- children feel heard and positive about how immunisation is discussed with them. This is exemplary child-centred health practice.`,
      severity: "positive",
    });
  }

  if (meets(followUpCompletionRate, 90) && meets(gpFollowUpCompletionRate, 90) && followUpRequired > 0 && gpFollowUpRequired > 0) {
    insights.push({
      text: `${followUpCompletionRate}% vaccination follow-ups and ${gpFollowUpCompletionRate}% GP liaison follow-ups completed -- the home demonstrates consistent follow-through on all immunisation-related actions, ensuring nothing falls through the gaps.`,
      severity: "positive",
    });
  }

  if (meets(gillickAssessedRate, 70) && meets(bestInterestRate, 80) && totalConsentRecords > 0) {
    insights.push({
      text: `Gillick competence assessed in ${gillickAssessedRate}% of cases with best-interest decisions recorded at ${bestInterestRate}% -- the home respects children's evolving autonomy while maintaining robust governance. This balanced approach to consent is exactly what Ofsted expects to see.`,
      severity: "positive",
    });
  }

  // =========================================================================
  // HEADLINE
  // =========================================================================

  let headline: string;

  if (immunisation_rating === "outstanding") {
    headline =
      "Outstanding immunisation and vaccination compliance -- children's vaccination schedules are proactively managed, consent is robust, GP liaison is effective, and children understand their immunisation.";
  } else if (immunisation_rating === "good") {
    headline = `Good immunisation compliance -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (immunisation_rating === "adequate") {
    headline = `Adequate immunisation compliance -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure all children are fully vaccinated and protected.`;
  } else {
    headline = `Immunisation compliance is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's vaccination needs are met.`;
  }

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    immunisation_rating,
    immunisation_score: score,
    headline,
    schedule_adherence_rate: scheduleAdherenceRate,
    catch_up_rate: catchUpRate,
    consent_management_rate: consentManagementRate,
    gp_liaison_rate: gpLiaisonRate,
    child_understanding_rate: childUnderstandingRate,
    documentation_rate: documentationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
