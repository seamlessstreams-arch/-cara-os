// ==============================================================================
// API: /api/dental-health-monitoring
//
// Dental Health Monitoring Intelligence
//
// GET  — Returns dental health assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateDentalHealthMonitoringIntelligence,
  getAppointmentTypeLabel,
  getAppointmentOutcomeLabel,
  getOralHygieneRatingLabel,
  getTreatmentStatusLabel,
  getBrushingFrequencyLabel,
  getRatingLabel,
} from "@/lib/dental-health-monitoring";
import type {
  DentalAppointment,
  OralHygieneRecord,
  DentalTreatmentPlan,
  StaffDentalTraining,
} from "@/lib/dental-health-monitoring";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_APPOINTMENTS: DentalAppointment[] = [
  {
    id: "da-1",
    childId: "child-alex",
    childName: "Alex",
    appointmentDate: "2026-04-15",
    appointmentType: "routine_checkup",
    dentistName: "Dr Patel",
    outcome: "attended",
    treatmentNeeded: false,
    treatmentStatus: "not_needed",
    nextAppointmentBooked: true,
    consentObtained: true,
  },
  {
    id: "da-2",
    childId: "child-jordan",
    childName: "Jordan",
    appointmentDate: "2026-04-10",
    appointmentType: "routine_checkup",
    dentistName: "Dr Patel",
    outcome: "attended",
    treatmentNeeded: true,
    treatmentStatus: "in_progress",
    nextAppointmentBooked: true,
    consentObtained: true,
  },
  {
    id: "da-3",
    childId: "child-jordan",
    childName: "Jordan",
    appointmentDate: "2026-05-08",
    appointmentType: "orthodontic",
    dentistName: "Dr Rahman",
    outcome: "attended",
    treatmentNeeded: true,
    treatmentStatus: "in_progress",
    nextAppointmentBooked: true,
    consentObtained: true,
  },
  {
    id: "da-4",
    childId: "child-morgan",
    childName: "Morgan",
    appointmentDate: "2026-04-22",
    appointmentType: "routine_checkup",
    dentistName: "Dr Patel",
    outcome: "attended",
    treatmentNeeded: true,
    treatmentStatus: "completed",
    nextAppointmentBooked: true,
    consentObtained: true,
  },
];

const DEMO_HYGIENE_RECORDS: OralHygieneRecord[] = [
  { id: "oh-1", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", brushingFrequency: "twice_daily", mouthwashUsed: true, dietaryAdviceGiven: true, overallRating: "good" },
  { id: "oh-2", childId: "child-alex", childName: "Alex", recordDate: "2026-05-01", brushingFrequency: "twice_daily", mouthwashUsed: true, dietaryAdviceGiven: true, overallRating: "good" },
  { id: "oh-3", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-01", brushingFrequency: "twice_daily", mouthwashUsed: true, dietaryAdviceGiven: true, overallRating: "good" },
  { id: "oh-4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-05-01", brushingFrequency: "twice_daily", mouthwashUsed: true, dietaryAdviceGiven: true, overallRating: "good" },
  { id: "oh-5", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", brushingFrequency: "twice_daily", mouthwashUsed: true, dietaryAdviceGiven: true, overallRating: "excellent" },
  { id: "oh-6", childId: "child-morgan", childName: "Morgan", recordDate: "2026-05-01", brushingFrequency: "twice_daily", mouthwashUsed: true, dietaryAdviceGiven: true, overallRating: "excellent" },
];

const DEMO_TREATMENT_PLANS: DentalTreatmentPlan[] = [
  {
    id: "tp-1",
    childId: "child-jordan",
    childName: "Jordan",
    treatmentDescription: "Orthodontic braces — upper and lower arch alignment",
    startDate: "2026-02-01",
    expectedCompletionDate: "2027-02-01",
    status: "in_progress",
    appointmentsRequired: 6,
    appointmentsCompleted: 2,
    parentConsent: true,
    socialWorkerNotified: true,
  },
];

const DEMO_STAFF_TRAINING: StaffDentalTraining[] = [
  { id: "sdt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", dentalHealthAwareness: true, oralHygieneSupport: true, appointmentManagement: true, consentProcessTrained: true, emergencyDentalKnowledge: true },
  { id: "sdt-2", staffId: "staff-tom", staffName: "Tom Richards", dentalHealthAwareness: true, oralHygieneSupport: true, appointmentManagement: true, consentProcessTrained: true, emergencyDentalKnowledge: true },
  { id: "sdt-3", staffId: "staff-lisa", staffName: "Lisa Williams", dentalHealthAwareness: true, oralHygieneSupport: true, appointmentManagement: true, consentProcessTrained: true, emergencyDentalKnowledge: true },
  { id: "sdt-4", staffId: "staff-darren", staffName: "Darren Laville", dentalHealthAwareness: true, oralHygieneSupport: true, appointmentManagement: true, consentProcessTrained: true, emergencyDentalKnowledge: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateDentalHealthMonitoringIntelligence(
    DEMO_APPOINTMENTS,
    DEMO_HYGIENE_RECORDS,
    DEMO_TREATMENT_PLANS,
    DEMO_STAFF_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        appointmentTypeLabels: Object.fromEntries(
          (["routine_checkup", "treatment", "emergency", "orthodontic", "hygienist", "specialist_referral"] as const).map(
            (t) => [t, getAppointmentTypeLabel(t)],
          ),
        ),
        appointmentOutcomeLabels: Object.fromEntries(
          (["attended", "cancelled_rearranged", "did_not_attend", "refused", "pending"] as const).map(
            (o) => [o, getAppointmentOutcomeLabel(o)],
          ),
        ),
        oralHygieneRatingLabels: Object.fromEntries(
          (["excellent", "good", "fair", "poor"] as const).map(
            (r) => [r, getOralHygieneRatingLabel(r)],
          ),
        ),
        treatmentStatusLabels: Object.fromEntries(
          (["completed", "in_progress", "awaiting", "declined", "not_needed"] as const).map(
            (s) => [s, getTreatmentStatusLabel(s)],
          ),
        ),
        brushingFrequencyLabels: Object.fromEntries(
          (["twice_daily", "once_daily", "irregular", "refuses"] as const).map(
            (b) => [b, getBrushingFrequencyLabel(b)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { appointments, hygieneRecords, treatmentPlans, staffTraining, homeId, periodStart, periodEnd } = body as {
    appointments?: DentalAppointment[];
    hygieneRecords?: OralHygieneRecord[];
    treatmentPlans?: DentalTreatmentPlan[];
    staffTraining?: StaffDentalTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateDentalHealthMonitoringIntelligence(
    appointments ?? [],
    hygieneRecords ?? [],
    treatmentPlans ?? [],
    staffTraining ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
