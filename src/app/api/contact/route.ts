// ══════════════════════════════════════════════════════════════════════════════
// API: /api/contact — Contact & Family Time
//
// Returns contact compliance, attendance data, mood trends, risk assessment
// status, and upcoming sessions. Powers the contact dashboard and IRO reviews.
//
// CHR 2015 Reg 11(3)(d) — Contact arrangements.
// Children Act 1989 s.34 — Contact with children in care.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateContactCompliance,
  calculateHomeContactMetrics,
} from "@/lib/contact";
import type { ContactArrangement, ContactSession, ChildMood } from "@/lib/contact";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const childId = url.searchParams.get("childId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, childId, view);
    }

    return NextResponse.json(getDemoData(homeId, childId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string, childId: string | null, view: string) {
  let query = (sb.from("contact_arrangements") as SB)
    .select("*, contact_sessions(*)")
    .eq("home_id", homeId);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const arrangements: ContactArrangement[] = (rows ?? []).map(mapToArrangement);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateHomeContactMetrics(arrangements, homeId));
    case "compliance":
      return NextResponse.json({ results: arrangements.map(a => evaluateContactCompliance(a)) });
    case "child":
      if (!childId || arrangements.length === 0) {
        return NextResponse.json({ error: "No contact arrangements found" }, { status: 404 });
      }
      return NextResponse.json({
        arrangements,
        compliance: arrangements.map(a => evaluateContactCompliance(a)),
      });
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToArrangement(row: any): ContactArrangement {
  return {
    id: row.id,
    childId: row.child_id,
    childName: row.child_name,
    homeId: row.home_id,
    contactPersonName: row.contact_person_name,
    relationship: row.relationship,
    contactType: row.contact_type,
    venue: row.venue,
    frequency: {
      timesPerWeek: row.frequency_per_week,
      timesPerMonth: row.frequency_per_month,
      timesPerYear: row.frequency_per_year,
      notes: row.frequency_notes,
    },
    supervisorRequired: row.supervisor_required ?? false,
    courtOrdered: row.court_ordered ?? false,
    careplanAgreed: row.careplan_agreed ?? false,
    riskLevel: row.risk_level ?? "medium",
    lastRiskAssessmentDate: row.last_risk_assessment_date,
    conditions: row.conditions ?? [],
    childWishesRecorded: row.child_wishes_recorded ?? false,
    childWishesDate: row.child_wishes_date,
    childWishesSummary: row.child_wishes_summary,
    placementStartDate: row.placement_start_date,
    contactPlanDate: row.contact_plan_date,
    sessions: (row.contact_sessions ?? []).map(mapToSession),
  };
}

function mapToSession(row: any): ContactSession {
  return {
    id: row.id,
    scheduledDate: row.scheduled_date,
    actualDate: row.actual_date,
    duration: row.duration ?? 60,
    actualDuration: row.actual_duration,
    status: row.status ?? "scheduled",
    supervisorName: row.supervisor_name,
    venue: row.venue ?? "contact_centre",
    outcome: row.outcome ?? "not_assessed",
    childMood: {
      before: row.mood_before ?? 3,
      during: row.mood_during ?? 3,
      after: row.mood_after ?? 3,
    },
    observations: row.observations ?? [],
    concerns: row.concerns ?? [],
    positives: row.positives ?? [],
    actionRequired: row.action_required ?? false,
    actionNotes: row.action_notes,
    recordedBy: row.recorded_by ?? "",
    recordedAt: row.recorded_at ?? "",
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string) {
  const allArrangements = getDemoArrangements(homeId);
  const arrangements = childId
    ? allArrangements.filter(a => a.childId === childId)
    : allArrangements;

  switch (view) {
    case "overview":
      return calculateHomeContactMetrics(allArrangements, homeId);
    case "compliance":
      return { results: arrangements.map(a => evaluateContactCompliance(a)) };
    case "child":
      if (arrangements.length === 0) return { error: "No contact arrangements found" };
      return { arrangements, compliance: arrangements.map(a => evaluateContactCompliance(a)) };
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function makeDemoMood(before: number, during: number, after: number): ChildMood {
  return { before, during, after };
}

function getDemoArrangements(homeId: string): ContactArrangement[] {
  return [
    // ── Jordan — Birth mother, supervised, stable ──
    {
      id: "arr-jordan-mum",
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      contactPersonName: "Lisa Williams",
      relationship: "birth_mother",
      contactType: "supervised",
      venue: "contact_centre",
      frequency: { timesPerWeek: 1 },
      supervisorRequired: true,
      courtOrdered: false,
      careplanAgreed: true,
      riskLevel: "medium",
      lastRiskAssessmentDate: "2026-04-01T00:00:00Z",
      conditions: ["No discussion of court proceedings", "No mobile phones during contact"],
      childWishesRecorded: true,
      childWishesDate: "2026-04-15T00:00:00Z",
      childWishesSummary: "Jordan enjoys seeing mum and looks forward to weekly visits.",
      placementStartDate: "2024-09-01T00:00:00Z",
      contactPlanDate: "2024-09-04T00:00:00Z",
      sessions: [
        { id: "js1", scheduledDate: "2026-05-10T14:00:00Z", actualDate: "2026-05-10T14:05:00Z", duration: 60, actualDuration: 55, status: "attended", supervisorName: "Sarah Jones", venue: "contact_centre", outcome: "positive", childMood: makeDemoMood(4, 4, 4), observations: ["Good interaction", "Mum brought photos from home"], concerns: [], positives: ["Warm greeting", "Age-appropriate conversation"], actionRequired: false, recordedBy: "Sarah Jones", recordedAt: "2026-05-10T15:30:00Z" },
        { id: "js2", scheduledDate: "2026-05-03T14:00:00Z", actualDate: "2026-05-03T14:00:00Z", duration: 60, actualDuration: 60, status: "attended", supervisorName: "Sarah Jones", venue: "contact_centre", outcome: "positive", childMood: makeDemoMood(3, 4, 4), observations: ["Played board game together"], concerns: [], positives: ["Relaxed interaction"], actionRequired: false, recordedBy: "Sarah Jones", recordedAt: "2026-05-03T15:15:00Z" },
        { id: "js3", scheduledDate: "2026-04-26T14:00:00Z", actualDate: "2026-04-26T14:10:00Z", duration: 60, actualDuration: 50, status: "attended", supervisorName: "Sarah Jones", venue: "contact_centre", outcome: "mixed", childMood: makeDemoMood(3, 3, 3), observations: ["Mum arrived late", "Jordan quiet initially"], concerns: ["Mum smelled of alcohol — noted"], positives: ["Recovered well after slow start"], actionRequired: true, actionNotes: "Discuss alcohol concern with SW", recordedBy: "Sarah Jones", recordedAt: "2026-04-26T15:20:00Z" },
        { id: "js4", scheduledDate: "2026-04-19T14:00:00Z", actualDate: "2026-04-19T14:00:00Z", duration: 60, actualDuration: 60, status: "attended", supervisorName: "Sarah Jones", venue: "contact_centre", outcome: "positive", childMood: makeDemoMood(4, 5, 4), observations: ["Birthday celebration — mum brought cake"], concerns: [], positives: ["Lovely atmosphere", "Jordan beaming"], actionRequired: false, recordedBy: "Sarah Jones", recordedAt: "2026-04-19T15:30:00Z" },
        { id: "js5", scheduledDate: "2026-05-17T14:00:00Z", duration: 60, status: "scheduled", venue: "contact_centre", outcome: "not_assessed", childMood: makeDemoMood(3, 3, 3), observations: [], concerns: [], positives: [], actionRequired: false, recordedBy: "", recordedAt: "" },
      ],
    },

    // ── Jordan — Sibling (younger brother still at home) ──
    {
      id: "arr-jordan-sib",
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      contactPersonName: "Tyler Williams",
      relationship: "sibling",
      contactType: "unsupervised",
      venue: "community",
      frequency: { timesPerMonth: 2 },
      supervisorRequired: false,
      courtOrdered: false,
      careplanAgreed: true,
      riskLevel: "low",
      lastRiskAssessmentDate: "2026-03-15T00:00:00Z",
      conditions: [],
      childWishesRecorded: true,
      childWishesDate: "2026-04-15T00:00:00Z",
      childWishesSummary: "Jordan wants to see Tyler more often; misses him.",
      placementStartDate: "2024-09-01T00:00:00Z",
      contactPlanDate: "2024-09-05T00:00:00Z",
      sessions: [
        { id: "jt1", scheduledDate: "2026-05-11T10:00:00Z", actualDate: "2026-05-11T10:00:00Z", duration: 120, actualDuration: 120, status: "attended", venue: "community", outcome: "positive", childMood: makeDemoMood(4, 5, 5), observations: ["Went to park together", "Great rapport"], concerns: [], positives: ["Very natural sibling bond"], actionRequired: false, recordedBy: "Key Worker", recordedAt: "2026-05-11T13:00:00Z" },
        { id: "jt2", scheduledDate: "2026-04-27T10:00:00Z", actualDate: "2026-04-27T10:00:00Z", duration: 120, actualDuration: 90, status: "attended", venue: "community", outcome: "positive", childMood: makeDemoMood(3, 5, 4), observations: ["Cinema trip"], concerns: [], positives: ["Laughing together"], actionRequired: false, recordedBy: "Key Worker", recordedAt: "2026-04-27T12:30:00Z" },
      ],
    },

    // ── Alex — Birth father, erratic attendance ──
    {
      id: "arr-alex-dad",
      childId: "child-alex",
      childName: "Alex Reeves",
      homeId,
      contactPersonName: "Mark Reeves",
      relationship: "birth_father",
      contactType: "supervised",
      venue: "contact_centre",
      frequency: { timesPerMonth: 2 },
      supervisorRequired: true,
      courtOrdered: true,
      careplanAgreed: true,
      riskLevel: "high",
      lastRiskAssessmentDate: "2026-04-10T00:00:00Z",
      conditions: ["No discussion of case details", "No physical contact beyond handshake", "Exit plan if father becomes agitated"],
      childWishesRecorded: true,
      childWishesDate: "2026-03-20T00:00:00Z",
      childWishesSummary: "Alex ambivalent about seeing dad; agreed to try fortnightly.",
      placementStartDate: "2025-06-15T00:00:00Z",
      contactPlanDate: "2025-06-18T00:00:00Z",
      sessions: [
        { id: "as1", scheduledDate: "2026-05-10T11:00:00Z", duration: 60, status: "dna_family", venue: "contact_centre", outcome: "not_assessed", childMood: makeDemoMood(2, 2, 2), observations: ["Father did not attend"], concerns: ["Alex visibly disappointed, then relieved"], positives: [], actionRequired: true, actionNotes: "Discuss with Alex — emotional impact of DNA", recordedBy: "Mark Thompson", recordedAt: "2026-05-10T12:00:00Z" },
        { id: "as2", scheduledDate: "2026-04-26T11:00:00Z", actualDate: "2026-04-26T11:00:00Z", duration: 60, actualDuration: 35, status: "cut_short", supervisorName: "Mark Thompson", venue: "contact_centre", outcome: "negative", childMood: makeDemoMood(2, 2, 1), observations: ["Father raised voice", "Alex became withdrawn"], concerns: ["Father made inappropriate promises about returning home", "Alex distressed after"], positives: [], actionRequired: true, actionNotes: "Review with SW — consider reducing contact", recordedBy: "Mark Thompson", recordedAt: "2026-04-26T12:00:00Z" },
        { id: "as3", scheduledDate: "2026-04-12T11:00:00Z", duration: 60, status: "cancelled_by_family", venue: "contact_centre", outcome: "not_assessed", childMood: makeDemoMood(3, 3, 3), observations: [], concerns: [], positives: [], actionRequired: false, recordedBy: "Admin", recordedAt: "2026-04-11T09:00:00Z" },
        { id: "as4", scheduledDate: "2026-03-29T11:00:00Z", actualDate: "2026-03-29T11:00:00Z", duration: 60, actualDuration: 60, status: "attended", supervisorName: "Mark Thompson", venue: "contact_centre", outcome: "mixed", childMood: makeDemoMood(3, 3, 2), observations: ["Father appropriate but Alex guarded"], concerns: [], positives: ["Father made effort to be calm"], actionRequired: false, recordedBy: "Mark Thompson", recordedAt: "2026-03-29T12:30:00Z" },
      ],
    },

    // ── Mia — Birth mother, letterbox only (recent placement) ──
    {
      id: "arr-mia-mum",
      childId: "child-mia",
      childName: "Mia Chen",
      homeId,
      contactPersonName: "Wei Chen",
      relationship: "birth_mother",
      contactType: "letterbox",
      venue: "other",
      frequency: { timesPerYear: 4 },
      supervisorRequired: false,
      courtOrdered: false,
      careplanAgreed: true,
      riskLevel: "low",
      lastRiskAssessmentDate: "2026-05-05T00:00:00Z",
      conditions: ["Letters screened by social worker before forwarding"],
      childWishesRecorded: true,
      childWishesDate: "2026-05-08T00:00:00Z",
      childWishesSummary: "Mia happy with letterbox for now; not ready for face-to-face.",
      placementStartDate: "2026-05-01T00:00:00Z",
      contactPlanDate: "2026-05-05T00:00:00Z",
      sessions: [
        { id: "ms1", scheduledDate: "2026-05-15T00:00:00Z", actualDate: "2026-05-15T00:00:00Z", duration: 0, actualDuration: 0, status: "attended", venue: "other", outcome: "positive", childMood: makeDemoMood(3, 4, 4), observations: ["Letter received and read by Mia", "Mia smiled when reading"], concerns: [], positives: ["Mia chose to write a reply"], actionRequired: false, recordedBy: "Key Worker", recordedAt: "2026-05-15T16:00:00Z" },
      ],
    },

    // ── Mia — Grandparent, video call ──
    {
      id: "arr-mia-gran",
      childId: "child-mia",
      childName: "Mia Chen",
      homeId,
      contactPersonName: "Mei Lin Chen",
      relationship: "grandparent",
      contactType: "video_call",
      venue: "home",
      frequency: { timesPerWeek: 1 },
      supervisorRequired: false,
      courtOrdered: false,
      careplanAgreed: true,
      riskLevel: "low",
      lastRiskAssessmentDate: "2026-05-05T00:00:00Z",
      conditions: [],
      childWishesRecorded: true,
      childWishesDate: "2026-05-08T00:00:00Z",
      childWishesSummary: "Mia loves speaking with grandmother; highlights of her week.",
      placementStartDate: "2026-05-01T00:00:00Z",
      contactPlanDate: "2026-05-04T00:00:00Z",
      sessions: [
        { id: "mg1", scheduledDate: "2026-05-14T18:00:00Z", actualDate: "2026-05-14T18:00:00Z", duration: 30, actualDuration: 40, status: "attended", venue: "home", outcome: "positive", childMood: makeDemoMood(4, 5, 5), observations: ["Mia showed gran her artwork", "Extended by mutual agreement"], concerns: [], positives: ["Very warm relationship", "Mia animated and happy"], actionRequired: false, recordedBy: "Key Worker", recordedAt: "2026-05-14T19:00:00Z" },
        { id: "mg2", scheduledDate: "2026-05-07T18:00:00Z", actualDate: "2026-05-07T18:00:00Z", duration: 30, actualDuration: 30, status: "attended", venue: "home", outcome: "positive", childMood: makeDemoMood(3, 5, 5), observations: ["Gran read story in Mandarin"], concerns: [], positives: ["Cultural connection maintained"], actionRequired: false, recordedBy: "Key Worker", recordedAt: "2026-05-07T19:00:00Z" },
        { id: "mg3", scheduledDate: "2026-05-21T18:00:00Z", duration: 30, status: "scheduled", venue: "home", outcome: "not_assessed", childMood: makeDemoMood(3, 3, 3), observations: [], concerns: [], positives: [], actionRequired: false, recordedBy: "", recordedAt: "" },
      ],
    },
  ];
}
