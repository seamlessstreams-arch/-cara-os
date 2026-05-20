import { NextResponse } from "next/server";
import {
  generateSocialMediaOnlineSafetyIntelligence,
  getOnlineSafetyTopicLabel,
  getComprehensionLevelLabel,
  getRatingLabel,
} from "@/lib/social-media-online-safety";
import type { OnlineSafetySession, OnlineSafetyPolicy, StaffOnlineSafetyTraining } from "@/lib/social-media-online-safety";

const DEMO_SESSIONS: OnlineSafetySession[] = [
  { id: "os-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-01", topic: "cyberbullying_awareness", comprehensionLevel: "excellent", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-15", topic: "privacy_settings", comprehensionLevel: "good", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-10", topic: "digital_footprint", comprehensionLevel: "excellent", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-4", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-05", topic: "online_grooming_awareness", comprehensionLevel: "excellent", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-5", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-20", topic: "safe_social_media_use", comprehensionLevel: "good", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-6", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-15", topic: "screen_time_management", comprehensionLevel: "excellent", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-7", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-12", topic: "content_filtering", comprehensionLevel: "good", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
  { id: "os-8", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-20", topic: "reporting_mechanisms", comprehensionLevel: "excellent", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true },
];

const DEMO_POLICY: OnlineSafetyPolicy = {
  id: "osp-1", esafetyStrategy: true, socialMediaGuidance: true, screenTimeFramework: true, incidentReportingProtocol: true, contentFilteringPolicy: true, parentalEngagementPlan: true, regularReview: true,
};

const DEMO_TRAINING: StaffOnlineSafetyTraining[] = [
  { id: "ost-1", staffId: "staff-sarah", staffName: "Sarah Johnson", esafetyKnowledge: true, socialMediaAwareness: true, onlineGroomingRecognition: true, incidentResponse: true, ageAppropriateGuidance: true, digitalToolsCompetency: true },
  { id: "ost-2", staffId: "staff-tom", staffName: "Tom Richards", esafetyKnowledge: true, socialMediaAwareness: true, onlineGroomingRecognition: true, incidentResponse: true, ageAppropriateGuidance: true, digitalToolsCompetency: true },
  { id: "ost-3", staffId: "staff-lisa", staffName: "Lisa Williams", esafetyKnowledge: true, socialMediaAwareness: true, onlineGroomingRecognition: true, incidentResponse: true, ageAppropriateGuidance: true, digitalToolsCompetency: true },
  { id: "ost-4", staffId: "staff-darren", staffName: "Darren Laville", esafetyKnowledge: true, socialMediaAwareness: true, onlineGroomingRecognition: true, incidentResponse: true, ageAppropriateGuidance: true, digitalToolsCompetency: true },
];

export async function GET() {
  const result = generateSocialMediaOnlineSafetyIntelligence(DEMO_SESSIONS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-20");
  return NextResponse.json({
    data: {
      ...result,
      meta: {
        topicLabels: Object.fromEntries(
          (["cyberbullying_awareness", "privacy_settings", "screen_time_management", "digital_footprint", "online_grooming_awareness", "safe_social_media_use", "content_filtering", "reporting_mechanisms"] as const).map((t) => [t, getOnlineSafetyTopicLabel(t)]),
        ),
        comprehensionLevelLabels: Object.fromEntries(
          (["excellent", "good", "developing", "limited", "not_assessed"] as const).map((l) => [l, getComprehensionLevelLabel(l)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: OnlineSafetySession[]; policy?: OnlineSafetyPolicy | null; training?: StaffOnlineSafetyTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };
  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  const result = generateSocialMediaOnlineSafetyIntelligence(sessions ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd);
  return NextResponse.json({ data: result });
}
