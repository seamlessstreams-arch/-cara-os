// ══════════════════════════════════════════════════════════════════════════════
// API: /api/missing-from-care — Missing From Care Episode Management
//
// Returns episode compliance data, pattern analysis, home metrics, and
// active missing children status. Powers the missing from care dashboard,
// Reg 44 reports, and risk management screens.
//
// CHR 2015 Reg 34(1)(f) — Procedures for when a child goes missing.
// DfE Statutory Guidance: Children who run away or go missing from care.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateEpisodeCompliance,
  analyzePattern,
  calculateHomeMetrics,
} from "@/lib/missing-from-care";
import type { MissingEpisode, ReturnInterview } from "@/lib/missing-from-care";

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
  let query = (sb.from("missing_episodes") as SB)
    .select("*, return_interviews(*)")
    .eq("home_id", homeId)
    .order("reported_missing_at", { ascending: false });

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const episodes: MissingEpisode[] = (rows ?? []).map(mapToEpisode);

  switch (view) {
    case "overview":
      return NextResponse.json({
        metrics: calculateHomeMetrics(episodes, homeId),
        activeEpisodes: episodes.filter(e => e.status === "active"),
        recentEpisodes: episodes.slice(0, 10),
      });
    case "compliance":
      return NextResponse.json({
        results: episodes.map(evaluateEpisodeCompliance),
      });
    case "pattern":
      if (!childId) {
        return NextResponse.json({ error: "childId required for pattern view" }, { status: 400 });
      }
      const childName = episodes[0]?.childName ?? "Unknown";
      return NextResponse.json(analyzePattern(episodes, childId, childName));
    case "metrics":
      return NextResponse.json(calculateHomeMetrics(episodes, homeId));
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToEpisode(row: any): MissingEpisode {
  const ri = row.return_interviews?.[0];
  return {
    id: row.id,
    childId: row.child_id,
    childName: row.child_name,
    homeId: row.home_id,
    status: row.status,
    riskGrading: row.risk_grading,
    reportedMissingAt: row.reported_missing_at,
    lastSeenAt: row.last_seen_at,
    lastSeenLocation: row.last_seen_location,
    returnedAt: row.returned_at,
    durationMinutes: row.duration_minutes,
    policeNotifiedAt: row.police_notified_at,
    policeRef: row.police_ref,
    socialWorkerNotifiedAt: row.social_worker_notified_at,
    ofstedNotified: row.ofsted_notified ?? false,
    parentCarerNotified: row.parent_carer_notified ?? false,
    triggerDescription: row.trigger_description ?? "",
    pushFactors: row.push_factors ?? [],
    pullFactors: row.pull_factors ?? [],
    associatesInvolved: row.associates_involved ?? false,
    exploitationConcern: row.exploitation_concern ?? false,
    returnInterview: ri ? mapToReturnInterview(ri) : undefined,
    riskAssessmentUpdated: row.risk_assessment_updated ?? false,
    loggedBy: row.logged_by,
    loggedAt: row.logged_at,
  };
}

function mapToReturnInterview(row: any): ReturnInterview {
  return {
    status: row.status,
    interviewerId: row.interviewer_id,
    interviewerName: row.interviewer_name,
    interviewDate: row.interview_date,
    isIndependent: row.is_independent ?? true,
    childAccount: row.child_account ?? "",
    pushFactorsIdentified: row.push_factors_identified ?? [],
    pullFactorsIdentified: row.pull_factors_identified ?? [],
    safeguardingConcerns: row.safeguarding_concerns ?? [],
    actionsTaken: row.actions_taken ?? [],
    referralsMade: row.referrals_made ?? [],
    childAgreesToSafetyPlan: row.child_agrees_to_safety_plan ?? false,
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string) {
  const allEpisodes = getDemoEpisodes(homeId);
  const episodes = childId ? allEpisodes.filter(e => e.childId === childId) : allEpisodes;

  switch (view) {
    case "overview":
      return {
        metrics: calculateHomeMetrics(allEpisodes, homeId),
        activeEpisodes: allEpisodes.filter(e => e.status === "active"),
        recentEpisodes: allEpisodes.slice(0, 10),
      };
    case "compliance":
      return {
        results: episodes.map(evaluateEpisodeCompliance),
      };
    case "pattern":
      if (!childId) return { error: "childId required for pattern view" };
      const childName = episodes[0]?.childName ?? "Unknown";
      return analyzePattern(episodes, childId, childName);
    case "metrics":
      return calculateHomeMetrics(allEpisodes, homeId);
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function getDemoEpisodes(homeId: string): MissingEpisode[] {
  return [
    // ── Jordan Williams — Pattern of evening missing ──
    {
      id: "ep-001",
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      status: "found_safe",
      riskGrading: "medium",
      reportedMissingAt: "2026-05-10T19:30:00Z",
      lastSeenAt: "2026-05-10T18:45:00Z",
      lastSeenLocation: "Home garden area",
      returnedAt: "2026-05-11T08:00:00Z",
      durationMinutes: 750,
      policeNotifiedAt: "2026-05-10T20:00:00Z",
      policeRef: "POL-2026-4421",
      socialWorkerNotifiedAt: "2026-05-10T20:10:00Z",
      ofstedNotified: true,
      parentCarerNotified: true,
      triggerDescription: "Left after argument with peer at dinner. Did not return for bedtime.",
      pushFactors: ["peer_influence", "placement_unhappy"],
      pullFactors: ["peer_group"],
      associatesInvolved: true,
      exploitationConcern: false,
      returnInterview: {
        status: "completed",
        interviewerId: "ind-001",
        interviewerName: "Maria Lopez (Independent)",
        interviewDate: "2026-05-12T10:00:00Z",
        isIndependent: true,
        childAccount: "I went to see my friend. I was bored and felt trapped here.",
        pushFactorsIdentified: ["boredom", "placement_unhappy"],
        pullFactorsIdentified: ["peer_group"],
        safeguardingConcerns: [],
        actionsTaken: ["Updated safety plan", "Keyworker session scheduled"],
        referralsMade: [],
        childAgreesToSafetyPlan: true,
      },
      riskAssessmentUpdated: true,
      loggedBy: "staff-001",
      loggedAt: "2026-05-10T19:35:00Z",
    },
    {
      id: "ep-002",
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      status: "returned_self",
      riskGrading: "low",
      reportedMissingAt: "2026-04-22T20:15:00Z",
      lastSeenAt: "2026-04-22T19:30:00Z",
      lastSeenLocation: "Lounge area",
      returnedAt: "2026-04-22T23:45:00Z",
      durationMinutes: 210,
      policeNotifiedAt: "2026-04-22T21:00:00Z",
      policeRef: "POL-2026-3890",
      socialWorkerNotifiedAt: "2026-04-22T21:10:00Z",
      ofstedNotified: true,
      parentCarerNotified: true,
      triggerDescription: "Left without telling staff. Said was going for a walk.",
      pushFactors: ["boredom"],
      pullFactors: ["peer_group"],
      associatesInvolved: false,
      exploitationConcern: false,
      returnInterview: {
        status: "completed",
        interviewerId: "ind-001",
        interviewerName: "Maria Lopez (Independent)",
        interviewDate: "2026-04-23T14:00:00Z",
        isIndependent: true,
        childAccount: "I just wanted fresh air. I didn't realise I'd be so long.",
        pushFactorsIdentified: ["boredom"],
        pullFactorsIdentified: [],
        safeguardingConcerns: [],
        actionsTaken: ["Discussed boundaries", "Agreed signal for needing space"],
        referralsMade: [],
        childAgreesToSafetyPlan: true,
      },
      riskAssessmentUpdated: true,
      loggedBy: "staff-002",
      loggedAt: "2026-04-22T20:20:00Z",
    },
    {
      id: "ep-003",
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      status: "returned_police",
      riskGrading: "medium",
      reportedMissingAt: "2026-03-15T21:00:00Z",
      lastSeenAt: "2026-03-15T20:00:00Z",
      lastSeenLocation: "Bedroom (window open)",
      returnedAt: "2026-03-16T14:00:00Z",
      durationMinutes: 1020,
      policeNotifiedAt: "2026-03-15T21:45:00Z",
      policeRef: "POL-2026-2814",
      socialWorkerNotifiedAt: "2026-03-15T22:00:00Z",
      ofstedNotified: true,
      parentCarerNotified: true,
      triggerDescription: "Left via bedroom window after lights out. Found at associate's address.",
      pushFactors: ["peer_influence", "boundary_testing"],
      pullFactors: ["peer_group", "specific_location"],
      associatesInvolved: true,
      exploitationConcern: false,
      returnInterview: {
        status: "completed",
        interviewerId: "ind-002",
        interviewerName: "James Carter (Independent)",
        interviewDate: "2026-03-17T11:00:00Z",
        isIndependent: true,
        childAccount: "My friend asked me to come over. I knew I shouldn't but I wanted to.",
        pushFactorsIdentified: ["peer_influence", "boundary_testing"],
        pullFactorsIdentified: ["peer_group"],
        safeguardingConcerns: ["Associate address not previously known"],
        actionsTaken: ["Peer map updated", "Window lock review", "Professionals meeting requested"],
        referralsMade: ["Youth worker referral"],
        childAgreesToSafetyPlan: true,
      },
      riskAssessmentUpdated: true,
      loggedBy: "staff-001",
      loggedAt: "2026-03-15T21:05:00Z",
    },

    // ── Alex Reeves — Higher risk, exploitation concern ──
    {
      id: "ep-004",
      childId: "child-alex",
      childName: "Alex Reeves",
      homeId,
      status: "active",
      riskGrading: "high",
      reportedMissingAt: "2026-05-16T01:30:00Z",
      lastSeenAt: "2026-05-15T23:00:00Z",
      lastSeenLocation: "Bedroom area — bed not slept in",
      durationMinutes: undefined,
      policeNotifiedAt: "2026-05-16T02:00:00Z",
      policeRef: "POL-2026-4510",
      socialWorkerNotifiedAt: "2026-05-16T02:15:00Z",
      ofstedNotified: true,
      parentCarerNotified: true,
      triggerDescription: "Not in room at 01:30 check. Bed not slept in. Phone switched off.",
      pushFactors: ["peer_influence", "substance_use"],
      pullFactors: ["exploitation", "peer_group"],
      associatesInvolved: true,
      exploitationConcern: true,
      returnInterview: undefined,
      riskAssessmentUpdated: false,
      loggedBy: "staff-003",
      loggedAt: "2026-05-16T01:35:00Z",
    },
    {
      id: "ep-005",
      childId: "child-alex",
      childName: "Alex Reeves",
      homeId,
      status: "found_safe",
      riskGrading: "high",
      reportedMissingAt: "2026-04-28T22:00:00Z",
      lastSeenAt: "2026-04-28T20:30:00Z",
      lastSeenLocation: "Left home on foot after phone call",
      returnedAt: "2026-04-30T09:00:00Z",
      durationMinutes: 2100,
      policeNotifiedAt: "2026-04-28T22:30:00Z",
      policeRef: "POL-2026-3995",
      socialWorkerNotifiedAt: "2026-04-28T22:45:00Z",
      ofstedNotified: true,
      parentCarerNotified: true,
      triggerDescription: "Received phone call and left immediately. Would not say who called.",
      pushFactors: ["peer_influence"],
      pullFactors: ["exploitation", "social_media_contact"],
      associatesInvolved: true,
      exploitationConcern: true,
      returnInterview: {
        status: "completed",
        interviewerId: "ind-002",
        interviewerName: "James Carter (Independent)",
        interviewDate: "2026-05-01T10:00:00Z",
        isIndependent: true,
        childAccount: "I was with friends. Nothing happened. Leave me alone.",
        pushFactorsIdentified: ["peer_influence"],
        pullFactorsIdentified: ["exploitation"],
        safeguardingConcerns: ["Possible county lines involvement", "New expensive items"],
        actionsTaken: ["MACE referral submitted", "NRM referral discussed", "Strategy meeting held"],
        referralsMade: ["MACE panel", "Exploitation team"],
        childAgreesToSafetyPlan: false,
      },
      riskAssessmentUpdated: true,
      loggedBy: "staff-001",
      loggedAt: "2026-04-28T22:05:00Z",
    },

    // ── Mia Chen — Single low-risk absence ──
    {
      id: "ep-006",
      childId: "child-mia",
      childName: "Mia Chen",
      homeId,
      status: "returned_self",
      riskGrading: "absent",
      reportedMissingAt: "2026-05-05T16:30:00Z",
      lastSeenAt: "2026-05-05T15:30:00Z",
      lastSeenLocation: "School bus drop-off point",
      returnedAt: "2026-05-05T18:00:00Z",
      durationMinutes: 90,
      policeNotifiedAt: undefined,
      socialWorkerNotifiedAt: undefined,
      ofstedNotified: false,
      parentCarerNotified: true,
      triggerDescription: "Did not come home from school on time. Went to friend's house without telling staff.",
      pushFactors: ["boredom"],
      pullFactors: ["peer_group"],
      associatesInvolved: false,
      exploitationConcern: false,
      returnInterview: {
        status: "completed",
        interviewerId: "staff-002",
        interviewerName: "Tom Richards (Keyworker)",
        interviewDate: "2026-05-05T19:00:00Z",
        isIndependent: false,
        childAccount: "I forgot to tell you I was going to Sarah's. Sorry.",
        pushFactorsIdentified: [],
        pullFactorsIdentified: ["peer_group"],
        safeguardingConcerns: [],
        actionsTaken: ["Reminder about letting staff know plans"],
        referralsMade: [],
        childAgreesToSafetyPlan: true,
      },
      riskAssessmentUpdated: true,
      loggedBy: "staff-002",
      loggedAt: "2026-05-05T16:35:00Z",
    },
  ];
}
