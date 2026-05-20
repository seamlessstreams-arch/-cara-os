import { NextResponse } from "next/server";
import { generateNotifiableEventsIntelligence } from "@/lib/notifiable-events";
import type { NotifiableEventsRecord, NotifiableEventsPolicy, StaffNotifiableEventsTraining } from "@/lib/notifiable-events";

const DEMO_RECORDS: NotifiableEventsRecord[] = [
  { id: "ne-001", homeId: "home-oak", date: "2026-01-10", childId: "child-alex", childName: "Alex", category: "serious_injury", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-002", homeId: "home-oak", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "child_protection_referral", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-003", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "safeguarding_concern", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "significant_incident", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "missing_from_care", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "police_involvement", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "allegation_against_staff", outcome: "late_notification", notificationTimely: false, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: false },
  { id: "ne-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "serious_injury", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "child_protection_referral", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "safeguarding_concern", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "missing_from_care", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: false, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true },
  { id: "ne-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "child_death", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: false, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: false, timelyRecording: true },
];

const DEMO_POLICY: NotifiableEventsPolicy = {
  notifiableEventsPolicy: true, notificationTimeframePolicy: true, ofstedNotificationProcedure: true,
  localAuthorityNotificationPolicy: true, internalEscalationPolicy: true, postIncidentReviewPolicy: true, recordKeepingPolicy: true,
};

const DEMO_STAFF: StaffNotifiableEventsTraining[] = [
  { staffId: "staff-sarah", notifiableEventsKnowledge: true, ofstedNotificationProcess: true, localAuthorityReporting: true, internalEscalationProcedure: true, documentationRequirements: true, postIncidentReviewSkills: true },
  { staffId: "staff-tom", notifiableEventsKnowledge: true, ofstedNotificationProcess: true, localAuthorityReporting: true, internalEscalationProcedure: true, documentationRequirements: true, postIncidentReviewSkills: false },
  { staffId: "staff-lisa", notifiableEventsKnowledge: true, ofstedNotificationProcess: true, localAuthorityReporting: true, internalEscalationProcedure: true, documentationRequirements: false, postIncidentReviewSkills: true },
  { staffId: "staff-darren", notifiableEventsKnowledge: true, ofstedNotificationProcess: true, localAuthorityReporting: true, internalEscalationProcedure: true, documentationRequirements: true, postIncidentReviewSkills: true },
];

export async function GET() {
  const result = generateNotifiableEventsIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "notifiable-events-intelligence", version: "2.0.0" } } });
}
