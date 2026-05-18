// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Critical Incident Review Intelligence API Route
//
// GET  → returns Oak House demo critical incident review intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateCriticalIncidentReviewIntelligence } from "@/lib/critical-incident-review/critical-incident-review-engine";
import type {
  CriticalIncident,
  IncidentDebrief,
  LearningOutcome,
  PracticeChange,
} from "@/lib/critical-incident-review/critical-incident-review-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const incidents: CriticalIncident[] = [
    // Alex — restraint following contact visit distress
    {
      id: "inc-a1", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      incidentDate: "2025-02-10", incidentType: "restraint", severity: "medium",
      description: "Brief restraint used following escalation during contact visit transition. De-escalation attempted first. Duration: 3 minutes.",
      staffInvolved: ["Sarah Johnson", "Tom Richards"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    // Jordan — missing episode
    {
      id: "inc-j1", homeId: "oak-house", childId: "child-jordan", childName: "Jordan",
      incidentDate: "2025-03-15", incidentType: "missing_episode", severity: "high",
      description: "Jordan did not return from school at expected time. Located at friend's house after 90 minutes. Police notified per protocol.",
      staffInvolved: ["Tom Richards"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    // Morgan — self-harm ideation
    {
      id: "inc-m1", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      incidentDate: "2025-04-20", incidentType: "self_harm", severity: "high",
      description: "Morgan expressed self-harm ideation to key worker. Immediate safety plan activated. CAMHS contacted.",
      staffInvolved: ["Lisa Williams", "Sarah Johnson"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    // Near miss — medication error caught
    {
      id: "inc-nm1", homeId: "oak-house",
      incidentDate: "2025-05-10", incidentType: "medication_error", severity: "low",
      description: "Medication nearly administered at wrong time due to shift handover miscommunication. Caught before administration by second checker.",
      staffInvolved: ["Tom Richards"],
      notifiedToOfsted: false, notifiedToLA: false,
    },
    // Alex — complaint from parent
    {
      id: "inc-a2", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      incidentDate: "2025-05-25", incidentType: "complaint", severity: "medium",
      description: "Parent complaint about communication regarding contact visit changes. Resolved through discussion.",
      staffInvolved: ["Darren Laville"],
      notifiedToOfsted: false, notifiedToLA: false,
    },
  ];

  const debriefs: IncidentDebrief[] = [
    {
      id: "deb-a1", homeId: "oak-house", incidentId: "inc-a1",
      debriefDate: "2025-02-11", facilitatedBy: "Darren Laville",
      attendees: ["Sarah Johnson", "Tom Richards", "Alex"],
      childIncluded: true, childViews: "I was upset about contact not going well. I didn't want to be held but I know I was unsafe.",
      status: "completed_on_time",
      immediateActionsIdentified: ["Review de-escalation plan", "Contact team to review visit arrangements"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Contact visit distress", "Unstructured transition period"],
    },
    {
      id: "deb-j1", homeId: "oak-house", incidentId: "inc-j1",
      debriefDate: "2025-03-17", facilitatedBy: "Darren Laville",
      attendees: ["Tom Richards", "Jordan"],
      childIncluded: true, childViews: "I just wanted to see my friend, I forgot to tell anyone",
      status: "completed_late", targetDebriefDate: "2025-03-16",
      immediateActionsIdentified: ["Review missing protocol", "Safety plan update", "Phone check-in procedure"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Peer influence", "Poor communication about after-school plans"],
    },
    {
      id: "deb-m1", homeId: "oak-house", incidentId: "inc-m1",
      debriefDate: "2025-04-21", facilitatedBy: "Darren Laville",
      attendees: ["Lisa Williams", "Sarah Johnson"],
      childIncluded: false,
      status: "completed_on_time",
      immediateActionsIdentified: ["CAMHS urgent referral", "Increased observation schedule", "Safety plan review", "1:1 time with key worker"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Family contact distress", "Anniversary reaction", "Peer difficulties at school"],
    },
    {
      id: "deb-a2", homeId: "oak-house", incidentId: "inc-a2",
      debriefDate: "2025-05-26", facilitatedBy: "Darren Laville",
      attendees: ["Darren Laville"],
      childIncluded: false,
      status: "completed_on_time",
      immediateActionsIdentified: ["Review communication protocol with parents"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Shift handover gap", "No written record of contact change"],
    },
  ];

  const learnings: LearningOutcome[] = [
    {
      id: "lo-1", homeId: "oak-house", incidentId: "inc-a1",
      learningDescription: "Need for structured transition plans around contact visits to reduce escalation risk",
      status: "embedded", identifiedDate: "2025-02-12",
      responsiblePerson: "Sarah Johnson", implementationDate: "2025-03-01",
      evidenceOfImplementation: "Transition activity plan in Alex's care plan, successfully used 4 times without escalation",
      sharedWithTeam: true, sharedInSupervision: true,
    },
    {
      id: "lo-2", homeId: "oak-house", incidentId: "inc-j1",
      learningDescription: "Daily communication with young people about after-school plans and expectations",
      status: "implemented", identifiedDate: "2025-03-18",
      responsiblePerson: "Tom Richards", implementationDate: "2025-04-01",
      evidenceOfImplementation: "Daily check-in at breakfast about plans, recorded in daily log",
      sharedWithTeam: true, sharedInSupervision: true,
    },
    {
      id: "lo-3", homeId: "oak-house", incidentId: "inc-m1",
      learningDescription: "Staff need enhanced training on recognising anniversary reactions and trauma triggers",
      status: "action_planned", identifiedDate: "2025-04-22",
      responsiblePerson: "Darren Laville",
      sharedWithTeam: true, sharedInSupervision: false,
    },
    {
      id: "lo-4", homeId: "oak-house", incidentId: "inc-nm1",
      learningDescription: "Medication administration double-check process needed at shift handover",
      status: "implemented", identifiedDate: "2025-05-11",
      responsiblePerson: "Lisa Williams", implementationDate: "2025-05-15",
      evidenceOfImplementation: "New medication check sheet in use, zero errors since implementation",
      sharedWithTeam: true, sharedInSupervision: true,
    },
    {
      id: "lo-5", homeId: "oak-house", incidentId: "inc-a2",
      learningDescription: "Parent communication about schedule changes must be documented and confirmed",
      status: "implemented", identifiedDate: "2025-05-27",
      responsiblePerson: "Darren Laville", implementationDate: "2025-06-01",
      evidenceOfImplementation: "Communication log template updated, parent confirmation required",
      sharedWithTeam: true, sharedInSupervision: true,
    },
  ];

  const practiceChanges: PracticeChange[] = [
    {
      id: "pc-1", homeId: "oak-house", learningOutcomeId: "lo-1",
      changeType: "care_plan_updated",
      description: "Transition activity plan added to Alex's care plan with specific strategies for pre/post contact",
      implementedDate: "2025-03-01", implementedBy: "Sarah Johnson",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-06-01",
    },
    {
      id: "pc-2", homeId: "oak-house", learningOutcomeId: "lo-1",
      changeType: "training_delivered",
      description: "De-escalation refresher training delivered to all staff with focus on transition-related distress",
      implementedDate: "2025-03-15", implementedBy: "Darren Laville",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-09-15",
    },
    {
      id: "pc-3", homeId: "oak-house", learningOutcomeId: "lo-2",
      changeType: "procedure_change",
      description: "Daily after-school check-in procedure introduced at breakfast — young person communicates plans",
      implementedDate: "2025-04-01", implementedBy: "Tom Richards",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-07-01",
    },
    {
      id: "pc-4", homeId: "oak-house", learningOutcomeId: "lo-4",
      changeType: "procedure_change",
      description: "Medication double-check sheet introduced for shift handover with sign-off requirement",
      implementedDate: "2025-05-15", implementedBy: "Lisa Williams",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-08-15",
    },
    {
      id: "pc-5", homeId: "oak-house", learningOutcomeId: "lo-5",
      changeType: "policy_update",
      description: "Parent communication policy updated to require written confirmation of schedule changes",
      implementedDate: "2025-06-01", implementedBy: "Darren Laville",
      impactAssessed: false,
    },
  ];

  const previousPeriodIncidents: CriticalIncident[] = [
    {
      id: "prev-1", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      incidentDate: "2024-09-15", incidentType: "restraint", severity: "medium",
      description: "Restraint following peer conflict",
      staffInvolved: ["Sarah Johnson"], notifiedToOfsted: true, notifiedToLA: true,
    },
    {
      id: "prev-2", homeId: "oak-house", childId: "child-jordan", childName: "Jordan",
      incidentDate: "2024-10-20", incidentType: "missing_episode", severity: "high",
      description: "Jordan missing for 2 hours after school",
      staffInvolved: ["Tom Richards"], notifiedToOfsted: true, notifiedToLA: true,
    },
    {
      id: "prev-3", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      incidentDate: "2024-11-05", incidentType: "self_harm", severity: "high",
      description: "Self-harm incident requiring A&E attendance",
      staffInvolved: ["Lisa Williams"], notifiedToOfsted: true, notifiedToLA: true,
    },
    {
      id: "prev-4", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      incidentDate: "2024-12-10", incidentType: "property_damage", severity: "medium",
      description: "Alex damaged bedroom door during dysregulation episode",
      staffInvolved: ["Tom Richards"], notifiedToOfsted: false, notifiedToLA: false,
    },
    {
      id: "prev-5", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      incidentDate: "2024-08-22", incidentType: "restraint", severity: "high",
      description: "Restraint during aggressive episode",
      staffInvolved: ["Sarah Johnson", "Tom Richards"], notifiedToOfsted: true, notifiedToLA: true,
    },
  ];

  return { incidents, debriefs, learnings, practiceChanges, previousPeriodIncidents };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { incidents, debriefs, learnings, practiceChanges, previousPeriodIncidents } = getDemoData();
    const result = generateCriticalIncidentReviewIntelligence(
      incidents, debriefs, learnings, practiceChanges,
      previousPeriodIncidents, "oak-house", "2025-01-01", "2025-06-30",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate critical incident review intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      incidents, debriefs, learnings, practiceChanges,
      previousPeriodIncidents, homeId, periodStart, periodEnd, referenceDate,
    } = body;

    if (!homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(incidents) || !Array.isArray(debriefs) ||
      !Array.isArray(learnings) || !Array.isArray(practiceChanges) ||
      !Array.isArray(previousPeriodIncidents)
    ) {
      return NextResponse.json(
        { error: "incidents, debriefs, learnings, practiceChanges, and previousPeriodIncidents must be arrays" },
        { status: 400 },
      );
    }

    const result = generateCriticalIncidentReviewIntelligence(
      incidents, debriefs, learnings, practiceChanges,
      previousPeriodIncidents, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process critical incident review data", details: String(error) },
      { status: 500 },
    );
  }
}
