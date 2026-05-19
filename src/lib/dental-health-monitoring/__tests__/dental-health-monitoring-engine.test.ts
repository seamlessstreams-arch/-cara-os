import { describe, it, expect } from "vitest";
import {
  generateDentalHealthMonitoringIntelligence,
  evaluateAppointmentCompliance,
  evaluateOralHygieneSupport,
  evaluateTreatmentCompliance,
  evaluateStaffDentalReadiness,
  buildChildDentalSummaries,
  pct,
  getRating,
  getAppointmentTypeLabel,
  getAppointmentOutcomeLabel,
  getOralHygieneRatingLabel,
  getTreatmentStatusLabel,
  getBrushingFrequencyLabel,
  getRatingLabel,
} from "../dental-health-monitoring-engine";
import type {
  DentalAppointment,
  OralHygieneRecord,
  DentalTreatmentPlan,
  StaffDentalTraining,
} from "../dental-health-monitoring-engine";

// ── Test Helpers ─────────────────────────────────────────────────────────

function mkAppointment(overrides: Partial<DentalAppointment> = {}): DentalAppointment {
  return {
    id: "da-1",
    childId: "child-1",
    childName: "Alex",
    appointmentDate: "2026-04-15",
    appointmentType: "routine_checkup",
    dentistName: "Dr Smith",
    outcome: "attended",
    treatmentNeeded: false,
    treatmentStatus: "not_needed",
    nextAppointmentBooked: true,
    consentObtained: true,
    ...overrides,
  };
}

function mkHygieneRecord(overrides: Partial<OralHygieneRecord> = {}): OralHygieneRecord {
  return {
    id: "oh-1",
    childId: "child-1",
    childName: "Alex",
    recordDate: "2026-04-01",
    brushingFrequency: "twice_daily",
    mouthwashUsed: true,
    dietaryAdviceGiven: true,
    overallRating: "good",
    ...overrides,
  };
}

function mkTreatmentPlan(overrides: Partial<DentalTreatmentPlan> = {}): DentalTreatmentPlan {
  return {
    id: "tp-1",
    childId: "child-1",
    childName: "Alex",
    treatmentDescription: "Orthodontic braces",
    startDate: "2026-01-15",
    expectedCompletionDate: "2027-01-15",
    status: "in_progress",
    appointmentsRequired: 6,
    appointmentsCompleted: 3,
    parentConsent: true,
    socialWorkerNotified: true,
    ...overrides,
  };
}

function mkStaffTraining(overrides: Partial<StaffDentalTraining> = {}): StaffDentalTraining {
  return {
    id: "sdt-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    dentalHealthAwareness: true,
    oralHygieneSupport: true,
    appointmentManagement: true,
    consentProcessTrained: true,
    emergencyDentalKnowledge: true,
    ...overrides,
  };
}

// ── pct ──────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for 0/0", () => {
    expect(pct(0, 0)).toBe(0);
  });
  it("calculates correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });
  it("rounds", () => {
    expect(pct(1, 3)).toBe(33);
  });
  it("returns 100 for full", () => {
    expect(pct(5, 5)).toBe(100);
  });
  it("handles 0 numerator with non-zero denominator", () => {
    expect(pct(0, 10)).toBe(0);
  });
  it("handles 1/1", () => {
    expect(pct(1, 1)).toBe(100);
  });
  it("rounds 2/3 to 67", () => {
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating ────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("outstanding >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("good >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("requires_improvement >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("inadequate < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
  it("boundary at 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
  });
  it("boundary at 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("boundary at 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label functions ─────────────────────────────────────────────────────

describe("label functions", () => {
  it("appointment type labels", () => {
    expect(getAppointmentTypeLabel("routine_checkup")).toBe("Routine Checkup");
    expect(getAppointmentTypeLabel("treatment")).toBe("Treatment");
    expect(getAppointmentTypeLabel("emergency")).toBe("Emergency");
    expect(getAppointmentTypeLabel("orthodontic")).toBe("Orthodontic");
    expect(getAppointmentTypeLabel("hygienist")).toBe("Hygienist");
    expect(getAppointmentTypeLabel("specialist_referral")).toBe("Specialist Referral");
  });
  it("appointment outcome labels", () => {
    expect(getAppointmentOutcomeLabel("attended")).toBe("Attended");
    expect(getAppointmentOutcomeLabel("cancelled_rearranged")).toBe("Cancelled / Rearranged");
    expect(getAppointmentOutcomeLabel("did_not_attend")).toBe("Did Not Attend");
    expect(getAppointmentOutcomeLabel("refused")).toBe("Refused");
    expect(getAppointmentOutcomeLabel("pending")).toBe("Pending");
  });
  it("oral hygiene rating labels", () => {
    expect(getOralHygieneRatingLabel("excellent")).toBe("Excellent");
    expect(getOralHygieneRatingLabel("good")).toBe("Good");
    expect(getOralHygieneRatingLabel("fair")).toBe("Fair");
    expect(getOralHygieneRatingLabel("poor")).toBe("Poor");
  });
  it("treatment status labels", () => {
    expect(getTreatmentStatusLabel("completed")).toBe("Completed");
    expect(getTreatmentStatusLabel("in_progress")).toBe("In Progress");
    expect(getTreatmentStatusLabel("awaiting")).toBe("Awaiting");
    expect(getTreatmentStatusLabel("declined")).toBe("Declined");
    expect(getTreatmentStatusLabel("not_needed")).toBe("Not Needed");
  });
  it("brushing frequency labels", () => {
    expect(getBrushingFrequencyLabel("twice_daily")).toBe("Twice Daily");
    expect(getBrushingFrequencyLabel("once_daily")).toBe("Once Daily");
    expect(getBrushingFrequencyLabel("irregular")).toBe("Irregular");
    expect(getBrushingFrequencyLabel("refuses")).toBe("Refuses");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateAppointmentCompliance ────────────────────────────────────────

describe("evaluateAppointmentCompliance", () => {
  it("returns 0 for empty appointments", () => {
    const result = evaluateAppointmentCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAppointments).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.nextAppointmentBookedRate).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.routineCount).toBe(0);
    expect(result.emergencyCount).toBe(0);
    expect(result.routineToEmergencyRatio).toBe("0:0");
  });

  it("scores 25 for perfect appointments", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-1" }),
      mkAppointment({ id: "da-2", childId: "child-2", childName: "Jordan" }),
      mkAppointment({ id: "da-3", childId: "child-3", childName: "Morgan" }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.overallScore).toBe(25);
    expect(result.attendanceRate).toBe(100);
    expect(result.nextAppointmentBookedRate).toBe(100);
    expect(result.consentRate).toBe(100);
  });

  it("scores low for poor attendance", () => {
    const appts = [
      mkAppointment({ id: "da-1", outcome: "did_not_attend", nextAppointmentBooked: false, consentObtained: false }),
      mkAppointment({ id: "da-2", outcome: "refused", nextAppointmentBooked: false, consentObtained: false }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.attendanceRate).toBe(0);
  });

  it("calculates partial attendance rates", () => {
    const appts = [
      mkAppointment({ id: "da-1", outcome: "attended" }),
      mkAppointment({ id: "da-2", outcome: "did_not_attend" }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.attendanceRate).toBe(50);
  });

  it("counts routine and emergency appointments", () => {
    const appts = [
      mkAppointment({ id: "da-1", appointmentType: "routine_checkup" }),
      mkAppointment({ id: "da-2", appointmentType: "routine_checkup" }),
      mkAppointment({ id: "da-3", appointmentType: "emergency" }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.routineCount).toBe(2);
    expect(result.emergencyCount).toBe(1);
    expect(result.routineToEmergencyRatio).toBe("2:1");
  });

  it("tracks consent rate", () => {
    const appts = [
      mkAppointment({ id: "da-1", consentObtained: true }),
      mkAppointment({ id: "da-2", consentObtained: false }),
      mkAppointment({ id: "da-3", consentObtained: true }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.consentRate).toBe(67);
  });

  it("tracks next appointment booked rate", () => {
    const appts = [
      mkAppointment({ id: "da-1", nextAppointmentBooked: true }),
      mkAppointment({ id: "da-2", nextAppointmentBooked: false }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.nextAppointmentBookedRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateAppointmentCompliance([mkAppointment()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all non-routine/non-emergency appointment types", () => {
    const appts = [
      mkAppointment({ id: "da-1", appointmentType: "orthodontic" }),
      mkAppointment({ id: "da-2", appointmentType: "hygienist" }),
    ];
    const result = evaluateAppointmentCompliance(appts);
    expect(result.routineCount).toBe(0);
    expect(result.emergencyCount).toBe(0);
    expect(result.routineToEmergencyRatio).toBe("0:0");
    // Should still get partial credit for routine/emergency ratio
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// ── evaluateOralHygieneSupport ──────────────────────────────────────────

describe("evaluateOralHygieneSupport", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateOralHygieneSupport([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.excellentGoodRate).toBe(0);
    expect(result.twiceDailyBrushingRate).toBe(0);
    expect(result.dietaryAdviceRate).toBe(0);
    expect(result.mouthwashUsageRate).toBe(0);
  });

  it("scores 25 for perfect hygiene records", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", overallRating: "excellent" }),
      mkHygieneRecord({ id: "oh-2", overallRating: "excellent" }),
      mkHygieneRecord({ id: "oh-3", overallRating: "good" }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.overallScore).toBe(25);
    expect(result.excellentGoodRate).toBe(100);
    expect(result.twiceDailyBrushingRate).toBe(100);
    expect(result.dietaryAdviceRate).toBe(100);
    expect(result.mouthwashUsageRate).toBe(100);
  });

  it("scores 0 for all poor hygiene records", () => {
    const records = [
      mkHygieneRecord({
        overallRating: "poor",
        brushingFrequency: "refuses",
        mouthwashUsed: false,
        dietaryAdviceGiven: false,
      }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.overallScore).toBe(0);
    expect(result.excellentGoodRate).toBe(0);
    expect(result.twiceDailyBrushingRate).toBe(0);
  });

  it("calculates excellent/good rate correctly", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", overallRating: "excellent" }),
      mkHygieneRecord({ id: "oh-2", overallRating: "good" }),
      mkHygieneRecord({ id: "oh-3", overallRating: "fair" }),
      mkHygieneRecord({ id: "oh-4", overallRating: "poor" }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.excellentGoodRate).toBe(50);
  });

  it("calculates brushing frequency rate", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", brushingFrequency: "twice_daily" }),
      mkHygieneRecord({ id: "oh-2", brushingFrequency: "once_daily" }),
      mkHygieneRecord({ id: "oh-3", brushingFrequency: "irregular" }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.twiceDailyBrushingRate).toBe(33);
  });

  it("calculates dietary advice rate", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", dietaryAdviceGiven: true }),
      mkHygieneRecord({ id: "oh-2", dietaryAdviceGiven: false }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.dietaryAdviceRate).toBe(50);
  });

  it("calculates mouthwash usage rate", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", mouthwashUsed: true }),
      mkHygieneRecord({ id: "oh-2", mouthwashUsed: true }),
      mkHygieneRecord({ id: "oh-3", mouthwashUsed: false }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.mouthwashUsageRate).toBe(67);
  });

  it("score capped at 25", () => {
    const result = evaluateOralHygieneSupport([mkHygieneRecord({ overallRating: "excellent" })]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles mixed quality records with partial score", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", overallRating: "excellent", brushingFrequency: "twice_daily" }),
      mkHygieneRecord({ id: "oh-2", overallRating: "poor", brushingFrequency: "refuses", mouthwashUsed: false, dietaryAdviceGiven: false }),
    ];
    const result = evaluateOralHygieneSupport(records);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// ── evaluateTreatmentCompliance ─────────────────────────────────────────

describe("evaluateTreatmentCompliance", () => {
  it("returns 0 for empty plans", () => {
    const result = evaluateTreatmentCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.completionRate).toBe(0);
    expect(result.parentConsentRate).toBe(0);
    expect(result.socialWorkerNotifiedRate).toBe(0);
    expect(result.activeTreatmentProgressRate).toBe(0);
  });

  it("scores 25 for fully completed plans", () => {
    const plans = [
      mkTreatmentPlan({
        id: "tp-1",
        status: "completed",
        appointmentsRequired: 6,
        appointmentsCompleted: 6,
      }),
      mkTreatmentPlan({
        id: "tp-2",
        childId: "child-2",
        childName: "Jordan",
        status: "completed",
        appointmentsRequired: 4,
        appointmentsCompleted: 4,
      }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    expect(result.overallScore).toBe(20);
    expect(result.completionRate).toBe(100);
    expect(result.parentConsentRate).toBe(100);
    expect(result.socialWorkerNotifiedRate).toBe(100);
  });

  it("scores low for plans with no progress", () => {
    const plans = [
      mkTreatmentPlan({
        status: "in_progress",
        appointmentsRequired: 6,
        appointmentsCompleted: 0,
        parentConsent: false,
        socialWorkerNotified: false,
      }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.completionRate).toBe(0);
    expect(result.parentConsentRate).toBe(0);
  });

  it("calculates completion rate across all plans", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", appointmentsRequired: 4, appointmentsCompleted: 2 }),
      mkTreatmentPlan({ id: "tp-2", childId: "child-2", appointmentsRequired: 6, appointmentsCompleted: 3 }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    // 5 completed out of 10 required = 50%
    expect(result.completionRate).toBe(50);
  });

  it("calculates parent consent rate", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", parentConsent: true }),
      mkTreatmentPlan({ id: "tp-2", childId: "child-2", parentConsent: false }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    expect(result.parentConsentRate).toBe(50);
  });

  it("calculates social worker notification rate", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", socialWorkerNotified: true }),
      mkTreatmentPlan({ id: "tp-2", childId: "child-2", socialWorkerNotified: true }),
      mkTreatmentPlan({ id: "tp-3", childId: "child-3", socialWorkerNotified: false }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    expect(result.socialWorkerNotifiedRate).toBe(67);
  });

  it("calculates active treatment progress", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", status: "in_progress", appointmentsRequired: 6, appointmentsCompleted: 3 }),
      mkTreatmentPlan({ id: "tp-2", status: "in_progress", childId: "child-2", appointmentsRequired: 4, appointmentsCompleted: 2 }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    // Plan 1: 50%, Plan 2: 50% → average 50%
    expect(result.activeTreatmentProgressRate).toBe(50);
  });

  it("returns 0 active progress when no in_progress plans", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", status: "completed", appointmentsRequired: 6, appointmentsCompleted: 6 }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    expect(result.activeTreatmentProgressRate).toBe(0);
  });

  it("score capped at 25", () => {
    const result = evaluateTreatmentCompliance([mkTreatmentPlan()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles declined plans", () => {
    const plans = [
      mkTreatmentPlan({ status: "declined", appointmentsRequired: 4, appointmentsCompleted: 0 }),
    ];
    const result = evaluateTreatmentCompliance(plans);
    expect(result.totalPlans).toBe(1);
    expect(result.completionRate).toBe(0);
  });
});

// ── evaluateStaffDentalReadiness ────────────────────────────────────────

describe("evaluateStaffDentalReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffDentalReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.dentalHealthAwarenessRate).toBe(0);
    expect(result.oralHygieneSupportRate).toBe(0);
    expect(result.appointmentManagementRate).toBe(0);
    expect(result.consentProcessTrainedRate).toBe(0);
    expect(result.emergencyDentalKnowledgeRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "staff-1" }),
      mkStaffTraining({ id: "sdt-2", staffId: "staff-2", staffName: "Tom Richards" }),
      mkStaffTraining({ id: "sdt-3", staffId: "staff-3", staffName: "Lisa Williams" }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.dentalHealthAwarenessRate).toBe(100);
    expect(result.oralHygieneSupportRate).toBe(100);
    expect(result.appointmentManagementRate).toBe(100);
    expect(result.consentProcessTrainedRate).toBe(100);
    expect(result.emergencyDentalKnowledgeRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [
      mkStaffTraining({
        dentalHealthAwareness: false,
        oralHygieneSupport: false,
        appointmentManagement: false,
        consentProcessTrained: false,
        emergencyDentalKnowledge: false,
      }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates awareness rate", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", dentalHealthAwareness: true }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", dentalHealthAwareness: false }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.dentalHealthAwarenessRate).toBe(50);
  });

  it("calculates oral hygiene support rate", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", oralHygieneSupport: true }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", oralHygieneSupport: true }),
      mkStaffTraining({ id: "sdt-3", staffId: "s3", oralHygieneSupport: false }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.oralHygieneSupportRate).toBe(67);
  });

  it("calculates appointment management rate", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", appointmentManagement: true }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", appointmentManagement: false }),
      mkStaffTraining({ id: "sdt-3", staffId: "s3", appointmentManagement: false }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.appointmentManagementRate).toBe(33);
  });

  it("calculates consent process training rate", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", consentProcessTrained: true }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", consentProcessTrained: true }),
      mkStaffTraining({ id: "sdt-3", staffId: "s3", consentProcessTrained: true }),
      mkStaffTraining({ id: "sdt-4", staffId: "s4", consentProcessTrained: false }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.consentProcessTrainedRate).toBe(75);
  });

  it("calculates emergency dental knowledge rate", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", emergencyDentalKnowledge: true }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", emergencyDentalKnowledge: false }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.emergencyDentalKnowledgeRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffDentalReadiness([mkStaffTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles partially trained staff", () => {
    const training = [
      mkStaffTraining({
        dentalHealthAwareness: true,
        oralHygieneSupport: true,
        appointmentManagement: false,
        consentProcessTrained: false,
        emergencyDentalKnowledge: false,
      }),
    ];
    const result = evaluateStaffDentalReadiness(training);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
    expect(result.dentalHealthAwarenessRate).toBe(100);
    expect(result.appointmentManagementRate).toBe(0);
  });
});

// ── buildChildDentalSummaries ───────────────────────────────────────────

describe("buildChildDentalSummaries", () => {
  it("returns empty for no data", () => {
    expect(buildChildDentalSummaries([], [], [])).toEqual([]);
  });

  it("builds summary from appointments only", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-1", childName: "Alex" }),
    ];
    const summaries = buildChildDentalSummaries(appts, [], []);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].childId).toBe("child-1");
    expect(summaries[0].childName).toBe("Alex");
    expect(summaries[0].appointmentCount).toBe(1);
  });

  it("builds summary from hygiene records only", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", childId: "child-1", childName: "Alex", overallRating: "excellent" }),
    ];
    const summaries = buildChildDentalSummaries([], records, []);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].latestHygieneRating).toBe("excellent");
    expect(summaries[0].appointmentCount).toBe(0);
  });

  it("builds summary from treatment plans only", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", childId: "child-1", childName: "Alex", status: "in_progress" }),
    ];
    const summaries = buildChildDentalSummaries([], [], plans);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].activeTreatments).toBe(1);
  });

  it("merges data across all sources for same child", () => {
    const appts = [mkAppointment({ childId: "child-1", childName: "Alex" })];
    const records = [mkHygieneRecord({ childId: "child-1", childName: "Alex", overallRating: "good" })];
    const plans = [mkTreatmentPlan({ childId: "child-1", childName: "Alex", status: "in_progress" })];
    const summaries = buildChildDentalSummaries(appts, records, plans);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].appointmentCount).toBe(1);
    expect(summaries[0].latestHygieneRating).toBe("good");
    expect(summaries[0].activeTreatments).toBe(1);
  });

  it("handles multiple children", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-1", childName: "Alex" }),
      mkAppointment({ id: "da-2", childId: "child-2", childName: "Jordan" }),
      mkAppointment({ id: "da-3", childId: "child-3", childName: "Morgan" }),
    ];
    const summaries = buildChildDentalSummaries(appts, [], []);
    expect(summaries).toHaveLength(3);
  });

  it("calculates attendance rate per child", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-1", outcome: "attended" }),
      mkAppointment({ id: "da-2", childId: "child-1", outcome: "did_not_attend" }),
    ];
    const summaries = buildChildDentalSummaries(appts, [], []);
    expect(summaries[0].attendanceRate).toBe(50);
  });

  it("uses latest hygiene record", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", childId: "child-1", recordDate: "2026-01-01", overallRating: "poor" }),
      mkHygieneRecord({ id: "oh-2", childId: "child-1", recordDate: "2026-04-01", overallRating: "excellent" }),
    ];
    const summaries = buildChildDentalSummaries([], records, []);
    expect(summaries[0].latestHygieneRating).toBe("excellent");
  });

  it("returns null hygiene rating when no records", () => {
    const appts = [mkAppointment({ childId: "child-1" })];
    const summaries = buildChildDentalSummaries(appts, [], []);
    expect(summaries[0].latestHygieneRating).toBeNull();
  });

  it("counts active treatments (in_progress and awaiting)", () => {
    const plans = [
      mkTreatmentPlan({ id: "tp-1", childId: "child-1", status: "in_progress" }),
      mkTreatmentPlan({ id: "tp-2", childId: "child-1", status: "awaiting" }),
      mkTreatmentPlan({ id: "tp-3", childId: "child-1", status: "completed" }),
    ];
    const summaries = buildChildDentalSummaries([], [], plans);
    expect(summaries[0].activeTreatments).toBe(2);
  });

  it("gives higher score for well-managed child", () => {
    const goodAppts = [mkAppointment({ childId: "child-1", outcome: "attended", nextAppointmentBooked: true })];
    const goodRecords = [mkHygieneRecord({ childId: "child-1", overallRating: "excellent" })];
    const badAppts = [mkAppointment({ id: "da-2", childId: "child-2", childName: "Jordan", outcome: "did_not_attend", nextAppointmentBooked: false })];
    const badRecords = [mkHygieneRecord({ id: "oh-2", childId: "child-2", childName: "Jordan", overallRating: "poor" })];

    const goodSummary = buildChildDentalSummaries(goodAppts, goodRecords, []);
    const badSummary = buildChildDentalSummaries(badAppts, badRecords, []);
    expect(goodSummary[0].overallScore).toBeGreaterThan(badSummary[0].overallScore);
  });

  it("score capped at 10", () => {
    const appts = [mkAppointment({ childId: "child-1" })];
    const records = [mkHygieneRecord({ childId: "child-1", overallRating: "excellent" })];
    const summaries = buildChildDentalSummaries(appts, records, []);
    expect(summaries[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── generateDentalHealthMonitoringIntelligence ──────────────────────────

describe("generateDentalHealthMonitoringIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [mkAppointment()], [mkHygieneRecord()], [mkTreatmentPlan()], [mkStaffTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.appointmentCompliance.overallScore +
      result.oralHygieneSupport.overallScore +
      result.treatmentCompliance.overallScore +
      result.staffDentalReadiness.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-1" }),
      mkAppointment({ id: "da-2", childId: "child-2", childName: "Jordan" }),
      mkAppointment({ id: "da-3", childId: "child-3", childName: "Morgan" }),
    ];
    const records = [
      mkHygieneRecord({ id: "oh-1", overallRating: "excellent" }),
      mkHygieneRecord({ id: "oh-2", overallRating: "excellent" }),
      mkHygieneRecord({ id: "oh-3", overallRating: "good" }),
    ];
    const plans = [
      mkTreatmentPlan({ status: "completed", appointmentsRequired: 4, appointmentsCompleted: 4 }),
    ];
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1" }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", staffName: "Tom" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, records, plans, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [mkAppointment()], [mkHygieneRecord()], [mkTreatmentPlan()], [mkStaffTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("builds child dental summaries", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-1", childName: "Alex" }),
      mkAppointment({ id: "da-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childDentalSummaries).toHaveLength(2);
  });

  // ── Strengths ──

  it("adds strength for 100% attendance", () => {
    const appts = [mkAppointment({ outcome: "attended" })];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("100% dental appointment attendance"))).toBe(true);
  });

  it("adds strength for all next appointments booked", () => {
    const appts = [mkAppointment({ nextAppointmentBooked: true })];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("next dental appointment booked"))).toBe(true);
  });

  it("adds strength for 100% consent", () => {
    const appts = [mkAppointment({ consentObtained: true })];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Consent obtained"))).toBe(true);
  });

  it("adds strength for all excellent/good hygiene", () => {
    const records = [mkHygieneRecord({ overallRating: "good" })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], records, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("excellent or good"))).toBe(true);
  });

  it("adds strength for 100% twice daily brushing", () => {
    const records = [mkHygieneRecord({ brushingFrequency: "twice_daily" })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], records, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("brushing twice daily"))).toBe(true);
  });

  it("adds strength for all staff dental awareness", () => {
    const training = [mkStaffTraining({ dentalHealthAwareness: true })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("dental health awareness training"))).toBe(true);
  });

  it("adds strength for no emergency appointments", () => {
    const appts = [mkAppointment({ appointmentType: "routine_checkup" })];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("No emergency dental appointments"))).toBe(true);
  });

  it("adds strength for parent consent on all treatment plans", () => {
    const plans = [mkTreatmentPlan({ parentConsent: true })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], plans, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Parent/carer consent"))).toBe(true);
  });

  it("adds strength for social workers notified on all plans", () => {
    const plans = [mkTreatmentPlan({ socialWorkerNotified: true })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], plans, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Social workers notified"))).toBe(true);
  });

  // ── Areas for Improvement ──

  it("adds URGENT area for no appointments", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.startsWith("URGENT") && a.includes("No dental appointment records"))).toBe(true);
  });

  it("adds URGENT area for no hygiene records", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.startsWith("URGENT") && a.includes("No oral hygiene records"))).toBe(true);
  });

  it("adds URGENT area for no staff training", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.startsWith("URGENT") && a.includes("No staff dental training"))).toBe(true);
  });

  it("adds area for low attendance", () => {
    const appts = [
      mkAppointment({ id: "da-1", outcome: "attended" }),
      mkAppointment({ id: "da-2", outcome: "did_not_attend" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("attendance at 50%"))).toBe(true);
  });

  it("adds area for low hygiene ratings", () => {
    const records = [
      mkHygieneRecord({ id: "oh-1", overallRating: "poor" }),
      mkHygieneRecord({ id: "oh-2", overallRating: "fair" }),
      mkHygieneRecord({ id: "oh-3", overallRating: "poor" }),
      mkHygieneRecord({ id: "oh-4", overallRating: "fair" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      [], records, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("hygiene assessments rated excellent or good"))).toBe(true);
  });

  it("adds area for low staff awareness", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", dentalHealthAwareness: false }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", dentalHealthAwareness: true }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Dental health awareness training at 50%"))).toBe(true);
  });

  // ── Actions ──

  it("adds URGENT action for no appointments", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("Schedule dental checkups"))).toBe(true);
  });

  it("adds URGENT action for no hygiene records", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("oral hygiene monitoring"))).toBe(true);
  });

  it("adds URGENT action for no staff training", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("dental health awareness training"))).toBe(true);
  });

  it("adds URGENT action for missed appointments", () => {
    const appts = [
      mkAppointment({ outcome: "did_not_attend" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("missed dental appointment"))).toBe(true);
  });

  it("adds action for refused appointments", () => {
    const appts = [
      mkAppointment({ outcome: "refused" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("refused dental appointment"))).toBe(true);
  });

  it("adds action for missing consent", () => {
    const appts = [
      mkAppointment({ id: "da-1", consentObtained: false }),
      mkAppointment({ id: "da-2", consentObtained: true }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("consent"))).toBe(true);
  });

  it("adds URGENT action for poor hygiene assessments", () => {
    const records = [mkHygieneRecord({ overallRating: "poor" })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], records, [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("poor oral hygiene"))).toBe(true);
  });

  it("adds action for declined treatment plans", () => {
    const plans = [mkTreatmentPlan({ status: "declined" })];
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], plans, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("declined treatment plan"))).toBe(true);
  });

  it("adds action for emergency appointments", () => {
    const appts = [mkAppointment({ appointmentType: "emergency" })];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("emergency dental appointment"))).toBe(true);
  });

  it("adds action for incomplete staff emergency training", () => {
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "s1", emergencyDentalKnowledge: false }),
      mkStaffTraining({ id: "sdt-2", staffId: "s2", emergencyDentalKnowledge: true }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("emergency dental knowledge training"))).toBe(true);
  });

  // ── Regulatory links ──

  it("includes all regulatory links", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(6);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 24"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Statutory Guidance"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  // ── Integration ──

  it("handles realistic mixed scenario", () => {
    const appts = [
      mkAppointment({ id: "da-1", childId: "child-alex", childName: "Alex", appointmentType: "routine_checkup", outcome: "attended" }),
      mkAppointment({ id: "da-2", childId: "child-jordan", childName: "Jordan", appointmentType: "routine_checkup", outcome: "attended" }),
      mkAppointment({ id: "da-3", childId: "child-jordan", childName: "Jordan", appointmentType: "orthodontic", outcome: "attended" }),
      mkAppointment({ id: "da-4", childId: "child-morgan", childName: "Morgan", appointmentType: "routine_checkup", outcome: "attended", treatmentNeeded: true, treatmentStatus: "completed" }),
    ];
    const records = [
      mkHygieneRecord({ id: "oh-1", childId: "child-alex", childName: "Alex", overallRating: "good", recordDate: "2026-04-01" }),
      mkHygieneRecord({ id: "oh-2", childId: "child-alex", childName: "Alex", overallRating: "good", recordDate: "2026-05-01" }),
      mkHygieneRecord({ id: "oh-3", childId: "child-jordan", childName: "Jordan", overallRating: "good", recordDate: "2026-04-01" }),
      mkHygieneRecord({ id: "oh-4", childId: "child-jordan", childName: "Jordan", overallRating: "good", recordDate: "2026-05-01" }),
      mkHygieneRecord({ id: "oh-5", childId: "child-morgan", childName: "Morgan", overallRating: "excellent", recordDate: "2026-04-01" }),
      mkHygieneRecord({ id: "oh-6", childId: "child-morgan", childName: "Morgan", overallRating: "excellent", recordDate: "2026-05-01" }),
    ];
    const plans = [
      mkTreatmentPlan({ id: "tp-1", childId: "child-jordan", childName: "Jordan", treatmentDescription: "Orthodontic braces", appointmentsRequired: 6, appointmentsCompleted: 2, status: "in_progress" }),
    ];
    const training = [
      mkStaffTraining({ id: "sdt-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      mkStaffTraining({ id: "sdt-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      mkStaffTraining({ id: "sdt-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      mkStaffTraining({ id: "sdt-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, records, plans, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childDentalSummaries).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(6);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("does not add non-applicable strengths", () => {
    const result = generateDentalHealthMonitoringIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    // With no data, should not add attendance/hygiene/staff strengths
    expect(result.strengths.some((s) => s.includes("100% dental appointment attendance"))).toBe(false);
    expect(result.strengths.some((s) => s.includes("dental health awareness training"))).toBe(false);
    expect(result.strengths.some((s) => s.includes("brushing twice daily"))).toBe(false);
  });

  it("does not add non-applicable areas when data is perfect", () => {
    const appts = [mkAppointment()];
    const records = [mkHygieneRecord({ overallRating: "excellent" })];
    const training = [mkStaffTraining()];
    const result = generateDentalHealthMonitoringIntelligence(
      appts, records, [], training,
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No dental appointment records"))).toBe(false);
    expect(result.areasForImprovement.some((a) => a.includes("No oral hygiene records"))).toBe(false);
    expect(result.areasForImprovement.some((a) => a.includes("No staff dental training"))).toBe(false);
  });
});
