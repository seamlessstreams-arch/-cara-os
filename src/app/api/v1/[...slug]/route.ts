// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE API — Catch-all handler for /api/v1/[...slug]
//
// Consolidates 434 standardised v1 collection routes into a single
// serverless function to stay within Vercel's function limit.
//
// Routing: the first slug segment is looked up in SLUG_MAP to find the
// corresponding db collection name. Unknown slugs return 404.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// ---------------------------------------------------------------------------
// Slug -> db collection mapping (434 entries)
// ---------------------------------------------------------------------------
const SLUG_MAP: Record<string, string> = {
  "absence-tracking": "absenceTracking",
  "accident-book": "accidentBook",
  "activities": "activities",
  "activity-feed": "incidents",
  "adhd-plans": "adhdPlans",
  "admissions": "admissionReferrals",
  "adoption-records": "adoptionRecords",
  "advocacy": "advocacyRecords",
  "after-care": "afterCareRecords",
  "agency-feedback": "agencyFeedback",
  "agency-inductions": "agencyInductions",
  "agency-staff-log": "agencyStaffLog",
  "alert-notifications": "alertNotifications",
  "allergy-plans": "allergyPlans",
  "annex-a-readiness": "annexAEvidenceQueue",
  "annual-development-reviews": "annualDevelopmentReviews",
  "annual-health-assessments": "annualHealthAssessments",
  "annual-outcomes": "annualOutcomes",
  "appointments": "appointments",
  "asbestos-records": "asbestosRecords",
  "aspiration-records": "aspirationRecords",
  "asthma-plans": "asthmaPlans",
  "attachment-profiles": "attachmentProfiles",
  "audits": "audits",
  "autism-plans": "autismPlans",
  "bcp-scenarios": "bcpScenarios",
  "bedroom-profiles": "bedroomProfiles",
  "bedtime-routines": "bedtimeRoutines",
  "behaviour-log": "behaviourLog",
  "behaviour-map-entries": "behaviourMapEntries",
  "behaviour-support-plans": "behaviourSupportPlans",
  "belongings-records": "belongingsRecords",
  "bereavement-records": "bereavementRecords",
  "board-reports": "boardReports",
  "body-map": "bodyMap",
  "buildings": "buildings",
  "bullying-incidents": "bullyingIncidents",
  "camhs-referrals": "camhsReferrals",
  "card-records": "cardRecords",
  "care-anniversary-records": "careAnniversaryRecords",
  "care-event-audit": "careEvents",
  "care-events": "staff",
  "case-file-audits": "caseFileAudits",
  "cctv-accesses": "cctvAccesses",
  "charity-grant-records": "charityGrantRecords",
  "child-bank-accounts": "childBankAccounts",
  "child-daily-summaries": "childDailySummaries",
  "child-expert-entries": "childExpertEntries",
  "child-feedback-loops": "childFeedbackLoops",
  "child-friendly-policies": "childFriendlyPolicies",
  "child-injury-records": "childInjuryRecords",
  "child-key-documents": "childKeyDocuments",
  "child-led-meetings": "childLedMeetings",
  "child-phone-records": "childPhoneRecords",
  "child-photo-entries": "childPhotoEntries",
  "child-pledges": "childPledges",
  "child-staff-feedback": "childStaffFeedback",
  "childrens-meeting-records": "childrensMeetingRecords",
  "childrens-rights": "childrensRights",
  "chosen-family-records": "chosenFamilyRecords",
  "chronology-entries": "chronology",
  "civic-records": "civicRecords",
  "cleaning-entries": "cleaningEntries",
  "clothing-allowance-records": "clothingAllowanceRecords",
  "clothing-shopping-trips": "clothingShoppingTrips",
  "club-records": "clubRecords",
  "cme-records": "cmeRecords",
  "cohort-analyses": "cohortAnalyses",
  "commissioning-feedback-records": "commissioningFeedbackRecords",
  "communication-book-entries": "communicationBookEntries",
  "communication-profiles": "communicationProfiles",
  "community-engagements": "communityEngagements",
  "community-feedback-records": "communityFeedbackRecords",
  "complaint-outcome-records": "complaintOutcomeRecords",
  "complaint-trends": "complaintTrends",
  "compliments": "compliments",
  "consent-records": "consentRecords",
  "consequence-records": "consequenceRecords",
  "contact-directory-entries": "contactDirectoryEntries",
  "contact-plans": "contactPlans",
  "contact-supervision-sessions": "contactSupervisionSessions",
  "contextual-safeguarding-risks": "contextualSafeguardingRisks",
  "continence-plans": "continencePlans",
  "cooking-baking-records": "cookingBakingRecords",
  "correspondence-entries": "correspondenceEntries",
  "court-attendance-records": "courtAttendanceRecords",
  "cp-conferences": "cpConferences",
  "cpd-records": "cpdRecords",
  "creative-project-records": "creativeProjectRecords",
  "critical-incident-debrief-records": "criticalIncidentDebriefRecords",
  "cultural-identity-plans": "culturalIdentityPlans",
  "cultural-religious-mentors": "culturalReligiousMentors",
  "cultural-visits": "culturalVisits",
  "curiosity-log-entries": "curiosityLogEntries",
  "cycling-bike-records": "cyclingBikeRecords",
  "daily-log": "dailyLog",
  "daily-risk-briefings": "dailyRiskBriefings",
  "daily-routine-plans": "dailyRoutinePlans",
  "dashboard": "tasks",
  "data-breach-records": "dataBreachRecords",
  "data-protection-records": "dataProtectionRecords",
  "deaf-hearing-support-records": "deafHearingSupportRecords",
  "debrief-records": "debriefRecords",
  "delegated-authority": "delegatedAuthority",
  "dental-records": "dentalRecords",
  "device-policy-records": "devicePolicyRecords",
  "diabetic-care-plans": "diabeticCarePlans",
  "dietary-plans": "dietaryPlans",
  "digital-literacy-skill-records": "digitalLiteracySkillRecords",
  "digital-plans": "digitalPlans",
  "discharge-records": "dischargeRecords",
  "disclosures": "disclosures",
  "disruption-prevention-plans": "disruptionPreventionPlans",
  "diversity-calendar-events": "diversityCalendarEvents",
  "doc-intelligence": "uploadedDocuments",
  "documents": "documents",
  "dol-records": "dolRecords",
  "driving-records": "drivingRecords",
  "duty-log-entries": "dutyLogEntries",
  "eating-support-plans": "eatingSupportPlans",
  "edu-attendance-records": "eduAttendanceRecords",
  "education-records": "educationRecords",
  "ehcp-records": "ehcpRecords",
  "emergency-child-contacts": "emergencyChildContacts",
  "emergency-medication-protocols": "emergencyMedicationProtocols",
  "emergency-plans": "emergencyPlans",
  "emergency-referrals": "emergencyReferrals",
  "emotional-vocab-records": "emotionalVocabRecords",
  "environmental-risks": "environmentalRisks",
  "epilepsy-seizure-plans": "epilepsySeizurePlans",
  "equality-initiatives": "equalityInitiatives",
  "equality-training": "equalityTraining",
  "escalations": "escalations",
  "evacuation-plans": "evacuationPlans",
  "expenses": "expenses",
  "exploitation-screenings": "exploitationScreenings",
  "external-visitors": "externalVisitors",
  "extracurricular-club-records": "extracurricularClubRecords",
  "family-relationship-records": "familyRelationshipRecords",
  "family-time-sessions": "familyTimeSessions",
  "filing-cabinet": "filingCabinet",
  "fire-drills": "fireDrills",
  "fire-equipment-checks": "fireEquipmentChecks",
  "fire-risk-items": "fireRiskItems",
  "first-aider-records": "firstAiderRecords",
  "first-relationship-records": "firstRelationshipRecords",
  "food-budget-week-records": "foodBudgetWeekRecords",
  "food-hygiene-records": "foodHygieneRecords",
  "forms": "careForms",
  "friendship-maps": "friendshipMaps",
  "funeral-records": "funeralRecords",
  "garden-plot-records": "gardenPlotRecords",
  "genogram-entries": "genogramEntries",
  "gift-records": "giftRecords",
  "governance-meetings": "governanceMeetings",
  "grab-bags": "grabBags",
  "grief-records": "griefRecords",
  "hair-appointments": "hairAppointments",
  "handover": "handovers",
  "handover-audits": "handoverAudits",
  "hate-incidents": "hateIncidents",
  "health-assessments": "healthAssessments",
  "health-check": "tasks",
  "health-monitoring": "healthMonitoring",
  "health-passports": "healthPassports",
  "health-records": "healthRecordEntries",
  "healthcare-plans": "healthcarePlans",
  "heritage-language-records": "heritageLanguageRecords",
  "holiday-records": "holidayRecords",
  "home-emergency-contacts": "homeEmergencyContacts",
  "home-policies": "homePolicies",
  "homework-sessions": "homeworkSessions",
  "house-meetings": "houseMeetings",
  "house-rules": "houseRules",
  "household-tasks": "householdTasks",
  "immigration-uasc-records": "immigrationUascRecords",
  "immunisation-records": "immunisationRecords",
  "impact-assessments": "impactAssessments",
  "improvement-objectives": "improvementObjectives",
  "incident-trends": "incidentTrends",
  "incidents": "incidents",
  "incoming-correspondence": "incomingCorrespondence",
  "independence-living-assessments": "independenceLivingAssessments",
  "independence-pathways": "independencePathways",
  "independence-skills-records": "independenceSkillsRecords",
  "independent-travel-records": "independentTravelRecords",
  "infection-records": "infectionRecords",
  "inspection-history": "inspectionHistory",
  "insurance-policies": "insurancePolicies",
  "inventory-items": "inventoryItems",
  "iro-correspondences": "iroCorrespondences",
  "key-dates": "youngPeople",
  "key-records": "keyRecords",
  "key-working": "keyWorkingSessions",
  "keywork-sessions": "keyworkerSessions",
  "kitchen-hygiene-checks": "kitchenHygieneChecks",
  "kpi-entries": "kpiEntries",
  "lac-review-preps": "lacReviewPreps",
  "lac-reviews": "lacReviews",
  "lado-referrals": "ladoReferrals",
  "laundry-self-care-records": "laundrySelfCareRecords",
  "leave": "leave",
  "leaving-care-packages": "leavingCarePackages",
  "lessons-learned": "lessonsLearned",
  "lgbtq-inclusion-records": "lgbtqInclusionRecords",
  "life-story-entries": "lifeStoryEntries",
  "local-offer-sections": "localOfferSections",
  "locality-risks": "localityRisks",
  "location-assessment-areas": "locationAssessmentAreas",
  "lone-working-records": "loneWorkingRecords",
  "lone-working-risk-assessments": "loneWorkingRiskAssessments",
  "maintenance": "maintenance",
  "maintenance-schedule-items": "maintenanceScheduleItems",
  "management-oversight": "careEvents",
  "management-walkrounds": "managementWalkrounds",
  "mar-entries": "marEntries",
  "matching-referrals": "matchingReferrals",
  "meal-plans": "mealPlans",
  "med-training-records": "medTrainingRecords",
  "media-publicity-consents": "mediaPublicityConsents",
  "medication": "medications",
  "medication-audits": "medicationAuditRecords",
  "medication-error-investigations": "medicationErrorInvestigations",
  "medication-errors": "medicationErrors",
  "medication-near-misses": "medicationNearMisses",
  "medication-stock-checks": "medicationStockChecks",
  "medication-storage-audits": "medicationStorageAudits",
  "memorial-occasion-records": "memorialOccasionRecords",
  "menstrual-health-plans": "menstrualHealthPlans",
  "mental-health-check-ins": "mentalHealthCheckIns",
  "missing-episodes": "missingEpisodes",
  "mobility-disability-plans": "mobilityDisabilityPlans",
  "money-records": "moneyRecords",
  "multi-agency-meetings": "multiAgencyMeetings",
  "multi-disciplinary-formulations": "multiDisciplinaryFormulations",
  "needs-assessments": "needsAssessments",
  "night-anxiety-support-records": "nightAnxietySupportRecords",
  "night-checks": "nightChecks",
  "night-logs": "nightLogs",
  "night-staff-guidance-sections": "nightStaffGuidanceSections",
  "night-staff-handovers": "nightStaffHandovers",
  "notifiable-events": "notifiableEvents",
  "notification-log-entries": "notificationLogEntries",
  "notifications": "notifications",
  "occupational-therapy-records": "occupationalTherapyRecords",
  "ofsted-action-items": "ofstedActionItems",
  "ofsted-engagement-records": "ofstedEngagementRecords",
  "on-call-shifts": "onCallShifts",
  "online-gaming-records": "onlineGamingRecords",
  "online-safety-agreements": "onlineSafetyAgreements",
  "online-safety-incidents": "onlineSafetyIncidents",
  "operational-meetings": "operationalMeetings",
  "opticians-records": "opticiansRecords",
  "ortho-records": "orthoRecords",
  "outcome-measures": "outcomeMeasures",
  "outcome-metrics": "outcomeMetrics",
  "outcome-star-assessments": "outcomeStarAssessments",
  "outcomes": "outcomeTargets",
  "outdoor-activity-risk-assessments": "outdoorActivityRiskAssessments",
  "parent-partnership-records": "parentPartnershipRecords",
  "parental-responsibility-records": "parentalResponsibilityRecords",
  "participation-entries": "participationEntries",
  "pathway-plans": "pathwayPlans",
  "peer-dynamics": "peerDynamics",
  "peer-group-dynamics": "peerGroupDynamics",
  "pep-records": "pepRecords",
  "personal-passports": "personalPassports",
  "pest-records": "pestRecords",
  "pet-records": "petRecords",
  "petty-cash-entries": "pettyCashEntries",
  "photo-album-records": "photoAlbumRecords",
  "photo-consent-records": "photoConsentRecords",
  "photo-id-records": "photoIdRecords",
  "physical-activity-entries": "physicalActivityEntries",
  "physio-ot-plans": "physioOtPlans",
  "placement-anniversary-entries": "placementAnniversaryEntries",
  "placement-budget-trackers": "placementBudgetTrackers",
  "placement-end-summaries": "placementEndSummaries",
  "placement-impact-assessments": "placementImpactAssessments",
  "placement-meetings": "placementMeetings",
  "placement-objectives": "placementObjectives",
  "placement-stability-meetings": "placementStabilityMeetings",
  "placement-stability-records": "placementStabilityRecords",
  "pocket-money-accounts": "pocketMoneyAccounts",
  "pocket-money-transactions": "pocketMoneyTransactions",
  "police-contact-records": "policeContactRecords",
  "policy-impact-analyses": "policyImpactAnalyses",
  "policy-review-records": "policyReviewRecords",
  "positive-achievements": "positiveAchievements",
  "positive-handling": "positiveHandling",
  "post-incident-child-debriefs": "postIncidentChildDebriefs",
  "pre-admission-checklists": "preAdmissionChecklists",
  "prevent-records": "preventRecords",
  "prevent-screenings": "preventScreenings",
  "professional-consultations": "professionalConsultations",
  "professional-fee-records": "professionalFeeRecords",
  "professional-meeting-attendances": "professionalMeetingAttendances",
  "professional-network-contacts": "professionalNetworkContacts",
  "property-damage-records": "propertyDamageRecords",
  "protocol-drills": "protocolDrills",
  "qa-audit-records": "qaAuditRecords",
  "quality-of-care-reviews": "qualityOfCareReviews",
  "readiness-items": "readinessItems",
  "recruitment": "conditionalOffers",
  "referral-tracker-records": "referralTrackerRecords",
  "reg22-records": "reg22Records",
  "reg35-notifications": "reg35Notifications",
  "reg40-staff-entries": "reg40StaffEntries",
  "reg40-triage": "careEvents",
  "reg44": "reg44VisitReports",
  "reg44-action-records": "reg44ActionRecords",
  "reg45-evidence": "reg45EvidenceQueue",
  "reg46-reviews": "reg46Reviews",
  "registration-change-records": "registrationChangeRecords",
  "regulatory-correspondence-letters": "regulatoryCorrespondenceLetters",
  "religious-festival-records": "religiousFestivalRecords",
  "religious-observance-records": "religiousObservanceRecords",
  "resolution-meetings": "resolutionMeetings",
  "restraints": "restraints",
  "restrictions-log-records": "restrictionsLogRecords",
  "return-interviews": "returnInterviews",
  "ri-governance-reports": "riGovernanceReports",
  "rights-literacy-records": "rightsLiteracyRecords",
  "risk-appetite-domains": "riskAppetiteDomains",
  "risk-assessments": "riskAssessments",
  "risk-management-plan-records": "riskManagementPlanRecords",
  "risk-register-entries": "riskRegisterEntries",
  "rite-records": "riteRecords",
  "room-allocation-records": "roomAllocationRecords",
  "room-search-records": "roomSearchRecords",
  "rota": "shifts",
  "rse-tracker-records": "rseTrackerRecords",
  "safe-touch-protocol-records": "safeTouchProtocolRecords",
  "safeguarding": "chronology",
  "safeguarding-supervision-records": "safeguardingSupervisionRecords",
  "safer-recruitment-records": "saferRecruitmentRecords",
  "safety-check-records": "safetyCheckRecords",
  "salt-records": "saltRecords",
  "sanction-rewards": "sanctionRewards",
  "saved-time": "savedTimeMetrics",
  "school-engagement-events": "schoolEngagementEvents",
  "secure-storage-records": "secureStorageRecords",
  "self-evaluation-areas": "selfEvaluationAreas",
  "self-harm-safety-plan-records": "selfHarmSafetyPlanRecords",
  "self-soothing-toolkits": "selfSoothingToolkits",
  "sensory-equipment-records": "sensoryEquipmentRecords",
  "sensory-profile-records": "sensoryProfileRecords",
  "sensory-room-usage-records": "sensoryRoomUsageRecords",
  "serious-incident-review-records": "seriousIncidentReviewRecords",
  "service-improvement-records": "serviceImprovementRecords",
  "service-user-agreement-records": "serviceUserAgreementRecords",
  "shift-checklists": "shiftChecklists",
  "shift-note-records": "shiftNoteRecords",
  "shift-summary": "youngPeople",
  "sibling-contact-protocol-records": "siblingContactProtocolRecords",
  "significant-events": "significantEvents",
  "skin-condition-plans": "skinConditionPlans",
  "sleep-assessment-records": "sleepAssessmentRecords",
  "sleep-in-records": "sleepInRecords",
  "sleep-log": "sleepLog",
  "smoking-vaping-records": "smokingVapingRecords",
  "social-worker-contact-records": "socialWorkerContactRecords",
  "spld-support-plans": "spldSupportPlans",
  "staff": "staff",
  "staff-communication-preference-records": "staffCommunicationPreferenceRecords",
  "staff-competency-records": "staffCompetencyRecords",
  "staff-debrief-records": "staffDebriefRecords",
  "staff-disciplinary-records": "staffDisciplinaryRecords",
  "staff-exit-interview-records": "staffExitInterviewRecords",
  "staff-grievance-records": "staffGrievanceRecords",
  "staff-handbook-acknowledgement-records": "staffHandbookAcknowledgementRecords",
  "staff-induction-records": "staffInductionRecords",
  "staff-meeting-records": "staffMeetingRecords",
  "staff-recognition-records": "staffRecognitionRecords",
  "staff-reflection-records": "staffReflectionRecords",
  "staff-safer-caring-records": "staffSaferCaringRecords",
  "staff-shadowing-records": "staffShadowingRecords",
  "staff-sickness-records": "staffSicknessRecords",
  "staff-supervision-theme-records": "staffSupervisionThemeRecords",
  "staff-wellbeing-records": "staffWellbeingRecords",
  "stakeholder-feedback-records": "stakeholderFeedbackRecords",
  "statutory-check-records": "statutoryCheckRecords",
  "statutory-visit-records": "statutoryVisitRecords",
  "strategic-risk-records": "strategicRiskRecords",
  "style-identity-records": "styleIdentityRecords",
  "subject-access-request-records": "subjectAccessRequestRecords",
  "substance-screenings": "substanceScreenings",
  "success-factors": "successFactors",
  "supervision": "supervisions",
  "supervision-matrix-records": "supervisionMatrixRecords",
  "supervision-tracker-records": "supervisionTrackerRecords",
  "swim-records": "swimRecords",
  "tasks": "tasks",
  "therapeutic-child-impact": "therapeuticChildImpact",
  "therapeutic-input-records": "therapeuticInputRecords",
  "therapeutic-staff-training": "therapeuticStaffTraining",
  "timeline-events": "timelineEvents",
  "tracked-documents": "trackedDocuments",
  "training": "training",
  "training-matrix-rows": "trainingMatrixRows",
  "trans-affirming-plans": "transAffirmingPlans",
  "transition-planning-records": "transitionPlanningRecords",
  "transport-log-records": "transportLogRecords",
  "transport-risk-assessments": "transportRAs",
  "trauma-therapy-logs": "traumaTherapyLogs",
  "trip-plans": "tripPlans",
  "tutoring-records": "tutoringRecords",
  "unannounced-visit-records": "unannouncedVisitRecords",
  "uniform-records": "uniformRecords",
  "utility-bills": "utilityBills",
  "utility-monitoring-records": "utilityMonitoringRecords",
  "vehicle-pre-use-checks": "vehiclePreUseChecks",
  "vehicles": "vehicles",
  "vision-care-records": "visionCareRecords",
  "visitor-reports": "visitorReports",
  "visitors": "visitors",
  "visitors-feedback-records": "visitorsFeedbackRecords",
  "volunteer-records": "volunteerRecords",
  "wake-up-routines": "wakeUpRoutines",
  "warm-welcome-packs": "warmWelcomePacks",
  "water-hygiene-records": "waterHygieneRecords",
  "wb-investigation-records": "wbInvestigationRecords",
  "welcome-tours": "welcomeTours",
  "welfare-checks": "welfareCheckRounds",
  "welfare-protocols": "welfareProtocols",
  "wellbeing-pulse-survey-records": "wellbeingPulseSurveyRecords",
  "whistleblowing-records": "whistleblowingRecords",
  "window-checks": "windowChecks",
  "work-exp-records": "workExpRecords",
  "young-carer-records": "youngCarerRecords",
  "young-people": "youngPeople",
  "yp-feedback": "ypFeedback",
  "yp-jobs": "ypJobs",
  "yp-savings-account-records": "ypSavingsAccountRecords",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RouteContext {
  params: Promise<{ slug: string[] }>;
}

/** Resolve slug to its db collection (or null). */
function resolveCollection(slug: string): Record<string, (...args: unknown[]) => unknown> | null {
  const collectionName = SLUG_MAP[slug];
  if (!collectionName) return null;
  const collection = (db as Record<string, unknown>)[collectionName];
  if (!collection || typeof collection !== "object") return null;
  return collection as Record<string, (...args: unknown[]) => unknown>;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function notFound(slug: string) {
  return json({ error: `Unknown v1 route: ${slug}` }, 404);
}

function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : "Internal server error";
  return json({ error: message }, 500);
}

// ---------------------------------------------------------------------------
// GET /api/v1/[slug]
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { slug } = await ctx.params;
    const slugKey = slug[0];
    const collection = resolveCollection(slugKey);
    if (!collection) return notFound(slugKey);

    // Check for child_id query param
    const childId = req.nextUrl.searchParams.get("child_id");

    if (childId && typeof collection.findByChild === "function") {
      const data = collection.findByChild(childId);
      const list = Array.isArray(data) ? data : [data];
      return json({ data: list, meta: { total: list.length } });
    }

    // Try findAll first, then getAll
    if (typeof collection.findAll === "function") {
      const data = collection.findAll();
      const list = Array.isArray(data) ? data : [data];
      return json({ data: list, meta: { total: list.length } });
    }

    if (typeof collection.getAll === "function") {
      const data = collection.getAll();
      return json({ data });
    }

    return json({ error: `Collection "${slugKey}" has no list method` }, 500);
  } catch (err) {
    return serverError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/[slug]
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { slug } = await ctx.params;
    const slugKey = slug[0];
    const collection = resolveCollection(slugKey);
    if (!collection) return notFound(slugKey);

    const body = await req.json();

    // If body has an id and collection supports update, treat as upsert
    if (body.id && typeof collection.update === "function") {
      const existing =
        typeof collection.findById === "function"
          ? collection.findById(body.id)
          : null;
      if (existing) {
        const updated = collection.update(body.id, body);
        return json({ data: updated });
      }
    }

    if (typeof collection.create !== "function") {
      return json({ error: `Collection "${slugKey}" does not support create` }, 405);
    }

    const record = collection.create(body);
    return json({ data: record }, 201);
  } catch (err) {
    return serverError(err);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/v1/[slug]
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const { slug } = await ctx.params;
    const slugKey = slug[0];
    const collection = resolveCollection(slugKey);
    if (!collection) return notFound(slugKey);

    if (typeof collection.update !== "function") {
      return json({ error: `Collection "${slugKey}" does not support update` }, 405);
    }

    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return json({ error: "Missing required field: id" }, 400);
    }

    const record = collection.update(id, rest);
    if (!record) {
      return json({ error: "Not found" }, 404);
    }

    return json({ data: record });
  } catch (err) {
    return serverError(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/[slug]
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { slug } = await ctx.params;
    const slugKey = slug[0];
    const collection = resolveCollection(slugKey);
    if (!collection) return notFound(slugKey);

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return json({ error: "Missing required field: id" }, 400);
    }

    // Prefer patch() if available, fall back to update()
    if (typeof collection.patch === "function") {
      const record = collection.patch(id, data);
      if (!record) return json({ error: "Not found" }, 404);
      return json({ data: record });
    }

    if (typeof collection.update === "function") {
      const record = collection.update(id, data);
      if (!record) return json({ error: "Not found" }, 404);
      return json({ data: record });
    }

    return json({ error: `Collection "${slugKey}" does not support patch or update` }, 405);
  } catch (err) {
    return serverError(err);
  }
}
