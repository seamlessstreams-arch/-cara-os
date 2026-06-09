/* ──────────────────────────────────────────────────────────────
   API: /api/health — Health Intelligence

   GET  — Returns health intelligence with Chamberlain House demo data
   ────────────────────────────────────────────────────────────── */

import { NextResponse } from "next/server";
import {
  generateHealthIntelligence,
  getAssessmentTypeLabel,
  getOutcomeLabel,
  getRatingLabel,
} from "@/lib/health";
import type {
  HealthRecord,
  HealthPolicy,
  StaffHealthTraining,
} from "@/lib/health";

// ── Demo Data: Chamberlain House ───────────────────────────────────────────────────

const DEMO_RECORDS: HealthRecord[] = [
  // Alex — solid compliance, diverse assessments
  { id: "hr-a1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-01-15", assessmentType: "initial_health_assessment", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-a2", childId: "child-alex", childName: "Alex", assessmentDate: "2026-02-20", assessmentType: "dental_check", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-a3", childId: "child-alex", childName: "Alex", assessmentDate: "2026-03-10", assessmentType: "optical_check", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: false, parentCarerInformed: true },
  { id: "hr-a4", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-05", assessmentType: "immunisation_review", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-a5", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-20", assessmentType: "sdq_assessment", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },

  // Jordan — some late, one missed
  { id: "hr-j1", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-01-10", assessmentType: "initial_health_assessment", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-j2", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-02-15", assessmentType: "review_health_assessment", outcome: "completed_late", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-j3", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-20", assessmentType: "mental_health_review", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-j4", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-10", assessmentType: "dental_check", outcome: "missed", childConsented: false, actionPlanCreated: false, gpNotified: false, documentedInCareFile: false, followUpScheduled: true, parentCarerInformed: false },
  { id: "hr-j5", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-05-01", assessmentType: "specialist_referral", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },

  // Morgan — good compliance
  { id: "hr-m1", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-01-25", assessmentType: "initial_health_assessment", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-m2", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-03-05", assessmentType: "dental_check", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
  { id: "hr-m3", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-15", assessmentType: "optical_check", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: false, parentCarerInformed: true },
  { id: "hr-m4", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-05-10", assessmentType: "sdq_assessment", outcome: "completed_on_time", childConsented: true, actionPlanCreated: true, gpNotified: true, documentedInCareFile: true, followUpScheduled: true, parentCarerInformed: true },
];

const DEMO_POLICY: HealthPolicy = {
  id: "pol-oak",
  healthAssessmentSchedule: true,
  mentalHealthStrategy: true,
  medicationProtocol: true,
  consentFramework: true,
  dentalOpticalTracking: true,
  immunisationMonitoring: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffHealthTraining[] = [
  { id: "ht-sarah", staffId: "staff-sarah", staffName: "Sarah Johnson", healthAssessmentProcess: true, mentalHealthAwareness: true, medicationAdministration: true, consentAndCapacity: true, firstAidCertified: true, healthPromotionSkills: true },
  { id: "ht-tom", staffId: "staff-tom", staffName: "Tom Richards", healthAssessmentProcess: true, mentalHealthAwareness: true, medicationAdministration: true, consentAndCapacity: true, firstAidCertified: true, healthPromotionSkills: false },
  { id: "ht-lisa", staffId: "staff-lisa", staffName: "Lisa Williams", healthAssessmentProcess: true, mentalHealthAwareness: true, medicationAdministration: true, consentAndCapacity: true, firstAidCertified: true, healthPromotionSkills: true },
  { id: "ht-darren", staffId: "staff-darren", staffName: "Darren Laville", healthAssessmentProcess: true, mentalHealthAwareness: true, medicationAdministration: true, consentAndCapacity: true, firstAidCertified: true, healthPromotionSkills: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateHealthIntelligence(
    DEMO_RECORDS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        assessmentTypeLabels: Object.fromEntries(
          ([
            "initial_health_assessment",
            "review_health_assessment",
            "dental_check",
            "optical_check",
            "immunisation_review",
            "sdq_assessment",
            "mental_health_review",
            "specialist_referral",
          ] as const).map((t) => [t, getAssessmentTypeLabel(t)]),
        ),
        outcomeLabels: Object.fromEntries(
          ([
            "completed_on_time",
            "completed_late",
            "overdue",
            "missed",
            "not_due",
          ] as const).map((o) => [o, getOutcomeLabel(o)]),
        ),
        ratingLabels: Object.fromEntries(
          ([
            "outstanding",
            "good",
            "requires_improvement",
            "inadequate",
          ] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}
