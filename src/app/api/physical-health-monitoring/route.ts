// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Physical Health Monitoring API Route
//
// GET  → returns Chamberlain House demo physical health intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generatePhysicalHealthIntelligence } from "@/lib/physical-health-monitoring/physical-health-monitoring-engine";
import type {
  HealthAppointment,
  HealthAssessment,
  HealthNeed,
  HealthPromotion,
  ImmunisationRecord,
} from "@/lib/physical-health-monitoring/physical-health-monitoring-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const appointments: HealthAppointment[] = [
    { id: "appt-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", appointmentDate: "2025-01-10", appointmentType: "gp_registration", provider: "Oak Hill Surgery", status: "attended", accompaniedBy: "Sarah Johnson", consentStatus: "gillick_competent", outcome: "Registered successfully", followUpRequired: false, healthActionPlanUpdated: false },
    { id: "appt-02", homeId: "oak-house", childId: "child-alex", childName: "Alex", appointmentDate: "2025-02-15", appointmentType: "dental_check", provider: "Smile Dental", status: "attended", accompaniedBy: "Tom Richards", consentStatus: "gillick_competent", outcome: "Good oral health, no treatment needed", followUpRequired: false, healthActionPlanUpdated: true },
    { id: "appt-03", homeId: "oak-house", childId: "child-alex", childName: "Alex", appointmentDate: "2025-03-01", appointmentType: "specialist_referral", provider: "Respiratory Clinic", status: "attended", accompaniedBy: "Sarah Johnson", consentStatus: "gillick_competent", outcome: "Asthma well controlled", followUpRequired: true, followUpBooked: true, healthActionPlanUpdated: true },
    { id: "appt-04", homeId: "oak-house", childId: "child-alex", childName: "Alex", appointmentDate: "2025-05-01", appointmentType: "optician", provider: "Clear Vision", status: "attended", accompaniedBy: "Lisa Williams", consentStatus: "gillick_competent", outcome: "Vision normal", followUpRequired: false, healthActionPlanUpdated: false },
    { id: "appt-05", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", appointmentDate: "2025-01-15", appointmentType: "gp_consultation", provider: "Oak Hill Surgery", status: "attended", accompaniedBy: "Tom Richards", consentStatus: "parental_consent", outcome: "Routine check, healthy", followUpRequired: false, healthActionPlanUpdated: true },
    { id: "appt-06", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", appointmentDate: "2025-02-20", appointmentType: "dental_check", provider: "Smile Dental", status: "attended", accompaniedBy: "Sarah Johnson", consentStatus: "parental_consent", outcome: "No issues", followUpRequired: false, healthActionPlanUpdated: true },
    { id: "appt-07", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", appointmentDate: "2025-04-15", appointmentType: "optician", provider: "Clear Vision", status: "attended", accompaniedBy: "Tom Richards", consentStatus: "parental_consent", outcome: "Vision normal", followUpRequired: false, healthActionPlanUpdated: true },
    { id: "appt-08", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-01-20", appointmentType: "gp_consultation", provider: "Oak Hill Surgery", status: "attended", accompaniedBy: "Lisa Williams", consentStatus: "gillick_competent", outcome: "Anxiety discussed, CAMHS referral", followUpRequired: true, followUpBooked: true, healthActionPlanUpdated: true },
    { id: "appt-09", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-02-25", appointmentType: "dental_check", provider: "Smile Dental", status: "child_refused", consentStatus: "gillick_competent", followUpRequired: false, healthActionPlanUpdated: false },
    { id: "appt-10", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", appointmentDate: "2025-04-20", appointmentType: "optician", provider: "Clear Vision", status: "missed", consentStatus: "gillick_competent", followUpRequired: false, healthActionPlanUpdated: false },
  ];

  const assessments: HealthAssessment[] = [
    { id: "ha-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", assessmentType: "review", assessmentDate: "2025-03-15", assessor: "Dr Smith", dueDate: "2025-03-31", completedOnTime: true, healthNeedsIdentified: ["Asthma management", "Nut allergy"], actionPlanCreated: true, childParticipated: true, sharedWithCarers: true, nextDueDate: "2025-09-15" },
    { id: "ha-02", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", assessmentType: "review", assessmentDate: "2025-04-01", assessor: "Dr Smith", dueDate: "2025-04-15", completedOnTime: true, healthNeedsIdentified: [], actionPlanCreated: true, childParticipated: true, sharedWithCarers: true, nextDueDate: "2025-10-01" },
    { id: "ha-03", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", assessmentType: "review", assessmentDate: "2025-05-01", assessor: "Dr Smith", dueDate: "2025-04-15", completedOnTime: false, healthNeedsIdentified: ["Vision correction", "Dental treatment needed"], actionPlanCreated: true, childParticipated: true, sharedWithCarers: true, nextDueDate: "2025-11-01" },
  ];

  const healthNeeds: HealthNeed[] = [
    { id: "hn-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", category: "chronic_condition", description: "Mild asthma", identifiedDate: "2024-06-01", managementPlan: true, managementPlanReviewDate: "2025-06-01", currentlyManaged: true, medicationRequired: true, specialistInvolved: true, specialistName: "Respiratory Nurse", lastReviewDate: "2025-03-01", status: "active" },
    { id: "hn-02", homeId: "oak-house", childId: "child-alex", childName: "Alex", category: "allergy", description: "Nut allergy — EpiPen in medication cabinet", identifiedDate: "2024-06-01", managementPlan: true, currentlyManaged: true, medicationRequired: true, specialistInvolved: false, status: "active" },
    { id: "hn-03", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", category: "vision", description: "Short-sighted, wears glasses", identifiedDate: "2024-11-01", managementPlan: true, currentlyManaged: true, medicationRequired: false, specialistInvolved: true, specialistName: "Optometrist", status: "active" },
    { id: "hn-04", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", category: "dental", description: "Requires dental treatment — refusing appointments", identifiedDate: "2025-02-25", managementPlan: false, currentlyManaged: false, medicationRequired: false, specialistInvolved: false, status: "active" },
  ];

  const healthPromotion: HealthPromotion[] = [
    { id: "hp-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", date: "2025-03-01", topic: "healthy_eating", deliveredBy: "Sarah Johnson", format: "group", childEngagement: 7, followUpPlanned: true },
    { id: "hp-02", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", date: "2025-03-01", topic: "healthy_eating", deliveredBy: "Sarah Johnson", format: "group", childEngagement: 8, followUpPlanned: true },
    { id: "hp-03", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", date: "2025-03-01", topic: "healthy_eating", deliveredBy: "Sarah Johnson", format: "group", childEngagement: 5, followUpPlanned: true },
    { id: "hp-04", homeId: "oak-house", childId: "child-alex", childName: "Alex", date: "2025-04-15", topic: "exercise", deliveredBy: "Tom Richards", format: "activity_based", childEngagement: 9, followUpPlanned: false },
    { id: "hp-05", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", date: "2025-04-15", topic: "exercise", deliveredBy: "Tom Richards", format: "activity_based", childEngagement: 9, followUpPlanned: false },
    { id: "hp-06", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", date: "2025-05-01", topic: "sleep_hygiene", deliveredBy: "Lisa Williams", format: "one_to_one", childEngagement: 6, followUpPlanned: true },
    { id: "hp-07", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", date: "2025-05-10", topic: "dental_hygiene", deliveredBy: "Sarah Johnson", format: "one_to_one", childEngagement: 7, followUpPlanned: false },
  ];

  const immunisations: ImmunisationRecord[] = [
    { id: "imm-01", homeId: "oak-house", childId: "child-alex", childName: "Alex", immunisationType: "Td/IPV Booster", dueDate: "2025-01-15", administeredDate: "2025-01-20", status: "up_to_date", consentObtained: true },
    { id: "imm-02", homeId: "oak-house", childId: "child-alex", childName: "Alex", immunisationType: "MenACWY", dueDate: "2025-01-15", administeredDate: "2025-01-20", status: "up_to_date", consentObtained: true },
    { id: "imm-03", homeId: "oak-house", childId: "child-jordan", childName: "Jordan", immunisationType: "HPV Dose 1", dueDate: "2025-02-01", administeredDate: "2025-02-10", status: "up_to_date", consentObtained: true },
    { id: "imm-04", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", immunisationType: "Td/IPV Booster", dueDate: "2025-01-15", status: "overdue", consentObtained: false },
    { id: "imm-05", homeId: "oak-house", childId: "child-morgan", childName: "Morgan", immunisationType: "MenACWY", dueDate: "2025-02-01", administeredDate: "2025-02-01", status: "up_to_date", consentObtained: true },
  ];

  return { appointments, assessments, healthNeeds, healthPromotion, immunisations };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { appointments, assessments, healthNeeds, healthPromotion, immunisations } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const childIds = ["child-alex", "child-jordan", "child-morgan"];
    const result = generatePhysicalHealthIntelligence(
      appointments, assessments, healthNeeds, healthPromotion, immunisations,
      childIds, "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate physical health intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointments, assessments, healthNeeds, healthPromotion, immunisations, childIds, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!childIds || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: childIds, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(appointments) || !Array.isArray(assessments) || !Array.isArray(healthNeeds) || !Array.isArray(healthPromotion) || !Array.isArray(immunisations) || !Array.isArray(childIds)) {
      return NextResponse.json(
        { error: "appointments, assessments, healthNeeds, healthPromotion, immunisations, and childIds must be arrays" },
        { status: 400 },
      );
    }

    const result = generatePhysicalHealthIntelligence(
      appointments, assessments, healthNeeds, healthPromotion, immunisations,
      childIds, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process physical health data", details: String(error) },
      { status: 500 },
    );
  }
}
