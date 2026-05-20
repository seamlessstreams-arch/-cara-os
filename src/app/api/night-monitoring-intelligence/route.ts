import { NextResponse } from "next/server";
import { generateNightMonitoringIntelligence } from "@/lib/night-monitoring";
import type {
  NightMonitoringRecord,
  NightMonitoringPolicy,
  StaffNightMonitoringTraining,
} from "@/lib/night-monitoring";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: NightMonitoringRecord[] = [
  // Alex — waking night checks, sleep obs, welfare checks
  { id: "nm-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "waking_night_check", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "sleep_observation", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "welfare_check", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "environmental_check", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },

  // Jordan — night incidents, medication, disturbance
  { id: "nm-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "night_incident_response", outcome: "minor_disturbance", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "medication_round", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "disturbance_management", outcome: "significant_incident", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: false },
  { id: "nm-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "waking_night_check", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },

  // Morgan — handover, welfare, environmental
  { id: "nm-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "handover_briefing", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "welfare_check", outcome: "all_settled", checkCompletedOnTime: true, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "environmental_check", outcome: "all_settled", checkCompletedOnTime: false, observationsRecorded: true, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: true, timelyRecording: true },
  { id: "nm-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "sleep_observation", outcome: "minor_disturbance", checkCompletedOnTime: true, observationsRecorded: false, incidentEscalated: true, childWelfareConfirmed: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: NightMonitoringPolicy = {
  nightMonitoringPolicy: true,
  wakingNightCheckFrequency: true,
  nightIncidentProcedure: true,
  nightMedicationProtocol: true,
  nightHandoverProcedure: true,
  sleepMonitoringGuidance: true,
  environmentalCheckPolicy: true,
};

const DEMO_STAFF: StaffNightMonitoringTraining[] = [
  { staffId: "staff-sarah", nightCareCompetency: true, nightIncidentManagement: true, sleepMonitoringSkills: true, nightMedicationHandling: true, childWelfareAssessment: true, nightHandoverProcedure: true },
  { staffId: "staff-tom", nightCareCompetency: true, nightIncidentManagement: true, sleepMonitoringSkills: true, nightMedicationHandling: true, childWelfareAssessment: true, nightHandoverProcedure: false },
  { staffId: "staff-lisa", nightCareCompetency: true, nightIncidentManagement: true, sleepMonitoringSkills: true, nightMedicationHandling: true, childWelfareAssessment: false, nightHandoverProcedure: true },
  { staffId: "staff-darren", nightCareCompetency: true, nightIncidentManagement: true, sleepMonitoringSkills: true, nightMedicationHandling: true, childWelfareAssessment: true, nightHandoverProcedure: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateNightMonitoringIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "night-monitoring-intelligence",
        version: "2.0.0",
      },
    },
  });
}
