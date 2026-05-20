import { NextResponse } from "next/server";
import {
  generateComplaintsFeedbackIntelligence,
} from "@/lib/complaints-feedback";
import type {
  ComplaintRecord,
  ComplaintPolicy,
  StaffComplaintTraining,
} from "@/lib/complaints-feedback";

function demoData() {
  const records: ComplaintRecord[] = [
    { id: "cf-1", childId: "child-alex", childName: "Alex", complaintDate: "2026-01-20", category: "food_nutrition", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true },
    { id: "cf-2", childId: "child-alex", childName: "Alex", complaintDate: "2026-02-15", category: "activities_opportunities", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true },
    { id: "cf-3", childId: "child-alex", childName: "Alex", complaintDate: "2026-03-10", category: "communication", status: "resolved_partially", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: false, complainantInformed: true, advocacyOffered: true },
    { id: "cf-4", childId: "child-jordan", childName: "Jordan", complaintDate: "2026-01-28", category: "privacy_dignity", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true },
    { id: "cf-5", childId: "child-jordan", childName: "Jordan", complaintDate: "2026-02-22", category: "staff_behaviour", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: false },
    { id: "cf-6", childId: "child-jordan", childName: "Jordan", complaintDate: "2026-04-05", category: "care_quality", status: "resolved_partially", childViewsSought: true, respondedWithinTimescale: false, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true },
    { id: "cf-7", childId: "child-morgan", childName: "Morgan", complaintDate: "2026-02-08", category: "environment_facilities", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true },
    { id: "cf-8", childId: "child-morgan", childName: "Morgan", complaintDate: "2026-03-20", category: "safety_concerns", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true },
  ];

  const policy: ComplaintPolicy = {
    id: "pol-cf-1",
    complaintsProcess: true,
    childFriendlyGuide: true,
    independentAdvocacyAccess: true,
    escalationPathway: true,
    feedbackMechanism: true,
    regulatoryNotification: true,
    regularReview: true,
  };

  const training: StaffComplaintTraining[] = [
    { id: "tr-cf-1", staffId: "staff-sarah", staffName: "Sarah Johnson", complaintsHandling: true, activeListening: true, conflictResolution: true, childRightsAwareness: true, documentationSkills: true, escalationProcess: true },
    { id: "tr-cf-2", staffId: "staff-tom", staffName: "Tom Richards", complaintsHandling: true, activeListening: true, conflictResolution: true, childRightsAwareness: true, documentationSkills: true, escalationProcess: true },
    { id: "tr-cf-3", staffId: "staff-lisa", staffName: "Lisa Williams", complaintsHandling: true, activeListening: true, conflictResolution: true, childRightsAwareness: true, documentationSkills: true, escalationProcess: true },
    { id: "tr-cf-4", staffId: "staff-darren", staffName: "Darren Laville", complaintsHandling: true, activeListening: true, conflictResolution: true, childRightsAwareness: true, documentationSkills: true, escalationProcess: true },
  ];

  return { records, policy, training };
}

export async function GET() {
  const { records, policy, training } = demoData();
  const result = generateComplaintsFeedbackIntelligence(
    records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
  );
  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "complaints-feedback-engine", version: "1.0.0" },
    },
  });
}
