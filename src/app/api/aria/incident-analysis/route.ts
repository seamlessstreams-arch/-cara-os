// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/incident-analysis
//
// GET — Analyse incidents for a home
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseIncidents, type IncidentRecord } from "@/lib/aria/incident-analysis";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData(): IncidentRecord[] {
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);

  return [
    // Jordan — verbal aggression pattern
    { id: "inc_1", date: d(2), time: "15:45", childId: "child_jordan", childName: "Jordan P", category: "aggression_verbal", severity: "medium", description: "Verbal aggression towards staff after being asked to come off phone", trigger: "boundary", deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false, staffInvolved: ["staff_sarah", "staff_mike"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: false, notifiedParent: true },
    { id: "inc_2", date: d(5), time: "21:30", childId: "child_jordan", childName: "Jordan P", category: "aggression_verbal", severity: "medium", description: "Refused to go to bed, shouting at staff", trigger: "transition", deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: false, staffInvolved: ["staff_emma"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: false, notifiedParent: false },
    { id: "inc_3", date: d(8), time: "16:00", childId: "child_jordan", childName: "Jordan P", category: "aggression_physical", severity: "high", description: "Pushed staff member during argument about homework", trigger: "boundary", deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: true, restraintType: "physical", restraintDurationMinutes: 3, staffInvolved: ["staff_mike", "staff_sarah"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: true, notifiedSocialWorker: true, notifiedParent: true, bodyMapCompleted: true, debriefCompleted: true },
    { id: "inc_4", date: d(12), time: "07:45", childId: "child_jordan", childName: "Jordan P", category: "aggression_verbal", severity: "low", description: "Swearing at staff when woken for school", trigger: "transition", deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false, staffInvolved: ["staff_james"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: false, notifiedParent: false },
    { id: "inc_5", date: d(18), time: "17:30", childId: "child_jordan", childName: "Jordan P", category: "property_damage", severity: "medium", description: "Kicked hole in bedroom door after phone call with mum", trigger: "family_contact", deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: false, staffInvolved: ["staff_emma", "staff_lisa"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: false, notifiedParent: true },

    // Jordan — missing episode
    { id: "inc_6", date: d(14), time: "22:15", childId: "child_jordan", childName: "Jordan P", category: "missing", severity: "high", description: "Left home without permission. Found at local park after 45 minutes.", trigger: "peer_influence", deEscalationAttempted: false, deEscalationSuccessful: false, restraintUsed: false, staffInvolved: ["staff_mike", "staff_lisa"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: true, notifiedSocialWorker: true, notifiedParent: true },

    // Sam — self-harm concern
    { id: "inc_7", date: d(3), time: "22:00", childId: "child_sam", childName: "Sam W", category: "self_harm", severity: "high", description: "Found scratches on forearm. Sam disclosed feeling overwhelmed.", trigger: "emotional_distress", deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false, staffInvolved: ["staff_sarah"], injuryToChild: true, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: true, notifiedParent: true },
    { id: "inc_8", date: d(10), time: "21:45", childId: "child_sam", childName: "Sam W", category: "self_harm", severity: "medium", description: "Superficial scratches noticed during welfare check", trigger: "emotional_distress", deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false, staffInvolved: ["staff_emma"], injuryToChild: true, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: true, notifiedParent: true },
    { id: "inc_9", date: d(20), time: "23:00", childId: "child_sam", childName: "Sam W", category: "self_harm", severity: "medium", description: "Sam became distressed at bedtime, hit own head", trigger: "emotional_distress", deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false, staffInvolved: ["staff_james"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: true, notifiedParent: true },

    // Alex — physical aggression with restraint
    { id: "inc_10", date: d(4), time: "14:15", childId: "child_alex", childName: "Alex R", category: "aggression_physical", severity: "high", description: "Threw chair at peer during argument over games console", trigger: "peer_conflict", deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: true, restraintType: "physical", restraintDurationMinutes: 7, staffInvolved: ["staff_mike", "staff_emma"], injuryToChild: false, injuryToStaff: true, notifiedOfsted: true, notifiedSocialWorker: true, notifiedParent: true, bodyMapCompleted: true, debriefCompleted: true },
    { id: "inc_11", date: d(9), time: "16:30", childId: "child_alex", childName: "Alex R", category: "aggression_physical", severity: "high", description: "Attempted to leave building aggressively when told activity cancelled", trigger: "transition", deEscalationAttempted: true, deEscalationSuccessful: false, restraintUsed: true, restraintType: "physical", restraintDurationMinutes: 4, staffInvolved: ["staff_sarah", "staff_james"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: true, notifiedSocialWorker: true, notifiedParent: true, bodyMapCompleted: true, debriefCompleted: false },
    { id: "inc_12", date: d(22), time: "15:00", childId: "child_alex", childName: "Alex R", category: "aggression_verbal", severity: "medium", description: "Threatening language to peer", trigger: "peer_conflict", deEscalationAttempted: true, deEscalationSuccessful: true, restraintUsed: false, staffInvolved: ["staff_lisa"], injuryToChild: false, injuryToStaff: false, notifiedOfsted: false, notifiedSocialWorker: false, notifiedParent: false },
  ];
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "28", 10);

    const records = getDemoData();
    const analysis = analyseIncidents(records, homeId, days);

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[aria/incident-analysis] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse incidents" }, { status: 500 });
  }
}
