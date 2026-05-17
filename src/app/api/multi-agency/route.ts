// ══════════════════════════════════════════════════════════════════════════════
// Multi-Agency Working — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateMultiAgencyCompliance,
  calculateHomeMultiAgencyMetrics,
} from "@/lib/multi-agency";
import type { ChildMultiAgencyProfile } from "@/lib/multi-agency";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

const DEMO_PROFILES: ChildMultiAgencyProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    placingAuthority: "Anyshire County Council",
    professionals: [
      { id: "pa1", childId: "child-alex", agencyType: "placing_authority", agencyName: "Anyshire CC", professionalName: "Jane Smith", role: "Social Worker", communicationStatus: "active", lastContactDate: "2026-05-10T10:00:00Z", lastContactMethod: "Phone", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
      { id: "pa2", childId: "child-alex", agencyType: "iro", agencyName: "Anyshire CC", professionalName: "Sarah Green", role: "IRO", communicationStatus: "active", lastContactDate: "2026-04-15T10:00:00Z", lastContactMethod: "LAC Review", responseTimeDays: 3, keyContact: true, escalationNeeded: false },
      { id: "pa3", childId: "child-alex", agencyType: "education", agencyName: "Oakville Academy", professionalName: "Mrs Jones", role: "Designated Teacher", communicationStatus: "active", lastContactDate: "2026-05-14T10:00:00Z", lastContactMethod: "Email", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
      { id: "pa4", childId: "child-alex", agencyType: "health_gp", agencyName: "Oakville Surgery", professionalName: "Dr Patel", role: "GP", communicationStatus: "responsive", lastContactDate: "2026-04-20T10:00:00Z", lastContactMethod: "Letter", responseTimeDays: 5, keyContact: false, escalationNeeded: false },
      { id: "pa5", childId: "child-alex", agencyType: "camhs", agencyName: "Anyshire CAMHS", professionalName: "Dr Ahmed", role: "Clinical Psychologist", communicationStatus: "active", lastContactDate: "2026-05-08T10:00:00Z", lastContactMethod: "Session feedback", responseTimeDays: 2, keyContact: true, escalationNeeded: false },
    ],
    meetings: [
      { id: "ma1", childId: "child-alex", meetingType: "lac_review", date: "2026-04-15T10:00:00Z", attendedByHome: true, homeRepresentative: "Darren Laville (RM)", childAttended: true, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "education", "iro", "camhs"], agenciesAbsent: [], actionsForHome: 3, actionsCompleted: 3, minutesReceived: true, minutesReceivedDate: "2026-04-20", outcome: "Placement stable, CAMHS progressing well" },
      { id: "ma2", childId: "child-alex", meetingType: "pep_meeting", date: "2026-03-20T10:00:00Z", attendedByHome: true, homeRepresentative: "Darren Laville (RM)", childAttended: false, childViewsSubmitted: true, agenciesPresent: ["education", "placing_authority"], agenciesAbsent: [], actionsForHome: 2, actionsCompleted: 2, minutesReceived: true, outcome: "GCSE support plan agreed" },
      { id: "ma3", childId: "child-alex", meetingType: "camhs_review", date: "2026-02-10T10:00:00Z", attendedByHome: true, homeRepresentative: "Staff RM-01", childAttended: true, childViewsSubmitted: true, agenciesPresent: ["camhs", "placing_authority"], agenciesAbsent: [], actionsForHome: 1, actionsCompleted: 1, minutesReceived: true, outcome: "Therapy continuing, good engagement" },
    ],
    referrals: [
      { id: "ra1", childId: "child-alex", agencyType: "camhs", referredTo: "Anyshire CAMHS", referralDate: "2025-09-15", status: "active", waitingDays: 0, urgency: "routine", escalated: false, outcome: "Accepted, sessions ongoing" },
    ],
    lastSWVisitDate: "2026-05-05T10:00:00Z",
    swVisitFrequencyWeeks: 4,
    lastSWPhoneContact: "2026-05-12T10:00:00Z",
    childHasAdvocate: true,
    childViewsRoutinelyShared: true,
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    homeId: "home-oak",
    placingAuthority: "Boroughton MBC",
    professionals: [
      { id: "pj1", childId: "child-jordan", agencyType: "placing_authority", agencyName: "Boroughton MBC", professionalName: "Marcus Williams", role: "Social Worker", communicationStatus: "delayed", lastContactDate: "2026-04-28T10:00:00Z", lastContactMethod: "Email", responseTimeDays: 8, keyContact: true, escalationNeeded: false },
      { id: "pj2", childId: "child-jordan", agencyType: "iro", agencyName: "Boroughton MBC", professionalName: "Tanya Rogers", role: "IRO", communicationStatus: "active", lastContactDate: "2026-03-25T10:00:00Z", lastContactMethod: "LAC Review", responseTimeDays: 2, keyContact: true, escalationNeeded: false },
      { id: "pj3", childId: "child-jordan", agencyType: "education", agencyName: "Oakville Academy", professionalName: "Mr Blake", role: "Head of Year", communicationStatus: "active", lastContactDate: "2026-05-15T10:00:00Z", lastContactMethod: "Phone", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
      { id: "pj4", childId: "child-jordan", agencyType: "youth_offending", agencyName: "Boroughton YOT", professionalName: "Kieran Phillips", role: "YOT Worker", communicationStatus: "responsive", lastContactDate: "2026-05-01T10:00:00Z", lastContactMethod: "Visit", responseTimeDays: 3, keyContact: true, escalationNeeded: false },
      { id: "pj5", childId: "child-jordan", agencyType: "camhs", agencyName: "Anyshire CAMHS", professionalName: "Waiting list", role: "TBC", communicationStatus: "unresponsive", lastContactDate: "2026-03-15T10:00:00Z", lastContactMethod: "Referral chaser", responseTimeDays: 21, keyContact: false, escalationNeeded: true },
    ],
    meetings: [
      { id: "mj1", childId: "child-jordan", meetingType: "lac_review", date: "2026-03-25T10:00:00Z", attendedByHome: true, homeRepresentative: "Darren Laville (RM)", childAttended: true, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "iro", "education", "youth_offending"], agenciesAbsent: ["camhs"], actionsForHome: 4, actionsCompleted: 3, minutesReceived: true, outcome: "CAMHS referral escalated, placement stable" },
      { id: "mj2", childId: "child-jordan", meetingType: "professionals_meeting", date: "2026-04-20T10:00:00Z", attendedByHome: true, homeRepresentative: "Staff RM-02", childAttended: false, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "youth_offending"], agenciesAbsent: ["education"], actionsForHome: 2, actionsCompleted: 2, minutesReceived: true, outcome: "Risk management plan reviewed" },
    ],
    referrals: [
      { id: "rj1", childId: "child-jordan", agencyType: "camhs", referredTo: "Anyshire CAMHS", referralDate: "2026-01-10", status: "waiting_list", waitingDays: 127, urgency: "urgent", escalated: true, escalationDate: "2026-04-01" },
      { id: "rj2", childId: "child-jordan", agencyType: "therapist", referredTo: "Right to Thrive Therapy", referralDate: "2026-04-25", status: "accepted", waitingDays: 0, urgency: "routine", escalated: false, outcome: "First session scheduled June" },
    ],
    lastSWVisitDate: "2026-04-28T10:00:00Z",
    swVisitFrequencyWeeks: 4,
    lastSWPhoneContact: "2026-05-08T10:00:00Z",
    childHasAdvocate: false,
    childViewsRoutinelyShared: true,
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    homeId: "home-oak",
    placingAuthority: "Anyshire County Council",
    professionals: [
      { id: "pm1", childId: "child-morgan", agencyType: "placing_authority", agencyName: "Anyshire CC", professionalName: "Jane Smith", role: "Social Worker", communicationStatus: "active", lastContactDate: "2026-05-12T10:00:00Z", lastContactMethod: "Visit", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
      { id: "pm2", childId: "child-morgan", agencyType: "iro", agencyName: "Anyshire CC", professionalName: "Sarah Green", role: "IRO", communicationStatus: "active", lastContactDate: "2026-05-01T10:00:00Z", lastContactMethod: "LAC Review", responseTimeDays: 2, keyContact: true, escalationNeeded: false },
      { id: "pm3", childId: "child-morgan", agencyType: "education", agencyName: "Oakville Primary", professionalName: "Ms Taylor", role: "SENCO", communicationStatus: "active", lastContactDate: "2026-05-16T10:00:00Z", lastContactMethod: "Email", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
      { id: "pm4", childId: "child-morgan", agencyType: "health_gp", agencyName: "Oakville Surgery", professionalName: "Dr Patel", role: "GP", communicationStatus: "responsive", lastContactDate: "2026-04-10T10:00:00Z", lastContactMethod: "Appointment", responseTimeDays: 4, keyContact: false, escalationNeeded: false },
    ],
    meetings: [
      { id: "mm1", childId: "child-morgan", meetingType: "lac_review", date: "2026-05-01T10:00:00Z", attendedByHome: true, homeRepresentative: "Darren Laville (RM)", childAttended: true, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "iro", "education"], agenciesAbsent: [], actionsForHome: 2, actionsCompleted: 2, minutesReceived: true, outcome: "Excellent progress in all areas" },
      { id: "mm2", childId: "child-morgan", meetingType: "pep_meeting", date: "2026-04-10T10:00:00Z", attendedByHome: true, homeRepresentative: "Staff RM-01", childAttended: false, childViewsSubmitted: true, agenciesPresent: ["education", "placing_authority"], agenciesAbsent: [], actionsForHome: 1, actionsCompleted: 1, minutesReceived: true, outcome: "Pupil Premium plan updated" },
    ],
    referrals: [],
    lastSWVisitDate: "2026-05-12T10:00:00Z",
    swVisitFrequencyWeeks: 6,
    lastSWPhoneContact: "2026-05-15T10:00:00Z",
    childHasAdvocate: true,
    childViewsRoutinelyShared: true,
  },
  {
    childId: "child-sam",
    childName: "Sam",
    homeId: "home-oak",
    placingAuthority: "Crestfield Borough Council",
    professionals: [
      { id: "ps1", childId: "child-sam", agencyType: "placing_authority", agencyName: "Crestfield BC", professionalName: "Linda Okafor", role: "Social Worker", communicationStatus: "active", lastContactDate: "2026-05-14T10:00:00Z", lastContactMethod: "Visit", responseTimeDays: 2, keyContact: true, escalationNeeded: false },
      { id: "ps2", childId: "child-sam", agencyType: "iro", agencyName: "Crestfield BC", professionalName: "David Nkomo", role: "IRO", communicationStatus: "active", lastContactDate: "2026-04-28T10:00:00Z", lastContactMethod: "LAC Review", responseTimeDays: 3, keyContact: true, escalationNeeded: false },
      { id: "ps3", childId: "child-sam", agencyType: "education", agencyName: "Oakville Academy", professionalName: "Mrs Jones", role: "Designated Teacher", communicationStatus: "active", lastContactDate: "2026-05-16T10:00:00Z", lastContactMethod: "Email", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
      { id: "ps4", childId: "child-sam", agencyType: "camhs", agencyName: "Right to Thrive Therapy", professionalName: "Dr Collins", role: "Trauma Therapist", communicationStatus: "active", lastContactDate: "2026-05-10T10:00:00Z", lastContactMethod: "Session update", responseTimeDays: 2, keyContact: true, escalationNeeded: false },
      { id: "ps5", childId: "child-sam", agencyType: "police", agencyName: "Local policing team", professionalName: "PC Martin", role: "Neighbourhood Officer", communicationStatus: "responsive", lastContactDate: "2026-04-15T10:00:00Z", lastContactMethod: "Phone", responseTimeDays: 3, keyContact: false, escalationNeeded: false },
      { id: "ps6", childId: "child-sam", agencyType: "advocacy", agencyName: "Voices for Children", professionalName: "Rebecca Ellis", role: "Independent Advocate", communicationStatus: "active", lastContactDate: "2026-05-05T10:00:00Z", lastContactMethod: "Visit to Sam", responseTimeDays: 1, keyContact: true, escalationNeeded: false },
    ],
    meetings: [
      { id: "ms1", childId: "child-sam", meetingType: "lac_review", date: "2026-04-28T10:00:00Z", attendedByHome: true, homeRepresentative: "Darren Laville (RM)", childAttended: true, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "iro", "education", "camhs", "advocacy"], agenciesAbsent: ["police"], actionsForHome: 3, actionsCompleted: 2, minutesReceived: true, outcome: "Therapy progressing, placement stable, independence skills focus" },
      { id: "ms2", childId: "child-sam", meetingType: "professionals_meeting", date: "2026-03-15T10:00:00Z", attendedByHome: true, homeRepresentative: "Staff RM-02", childAttended: false, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "camhs", "police"], agenciesAbsent: [], actionsForHome: 2, actionsCompleted: 2, minutesReceived: true, outcome: "Safety plan reviewed — risk reducing" },
      { id: "ms3", childId: "child-sam", meetingType: "transition_planning", date: "2026-05-08T10:00:00Z", attendedByHome: true, homeRepresentative: "Darren Laville (RM)", childAttended: true, childViewsSubmitted: true, agenciesPresent: ["placing_authority", "housing", "education"], agenciesAbsent: [], actionsForHome: 4, actionsCompleted: 2, minutesReceived: true, outcome: "Pathway plan updated, housing referral agreed" },
    ],
    referrals: [
      { id: "rs1", childId: "child-sam", agencyType: "housing", referredTo: "Crestfield Housing Options", referralDate: "2026-05-08", status: "made", waitingDays: 9, urgency: "routine", escalated: false },
      { id: "rs2", childId: "child-sam", agencyType: "camhs", referredTo: "Right to Thrive Therapy", referralDate: "2025-11-01", status: "active", waitingDays: 0, urgency: "urgent", escalated: false, outcome: "Sessions ongoing" },
    ],
    lastSWVisitDate: "2026-05-14T10:00:00Z",
    swVisitFrequencyWeeks: 2,
    lastSWPhoneContact: "2026-05-16T10:00:00Z",
    childHasAdvocate: true,
    childViewsRoutinelyShared: true,
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "dashboard";
  const homeId = searchParams.get("homeId") ?? "home-oak";
  const childId = searchParams.get("childId");

  if (mode === "dashboard") {
    const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
    const metrics = calculateHomeMultiAgencyMetrics(homeProfiles, homeId, NOW);
    const childResults = homeProfiles.map(p => evaluateMultiAgencyCompliance(p, NOW));
    return NextResponse.json({ metrics, childResults, profiles: homeProfiles });
  }

  if (mode === "child" && childId) {
    const profile = DEMO_PROFILES.find(p => p.childId === childId);
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    const result = evaluateMultiAgencyCompliance(profile, NOW);
    return NextResponse.json({ result, profile });
  }

  if (mode === "metrics") {
    const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
    const metrics = calculateHomeMultiAgencyMetrics(homeProfiles, homeId, NOW);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    const profile = body.profile as ChildMultiAgencyProfile;
    if (!profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 });
    }
    const result = evaluateMultiAgencyCompliance(profile, body.now ?? NOW);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const profiles = body.profiles as ChildMultiAgencyProfile[];
    const homeId = body.homeId as string;
    if (!profiles || !homeId) {
      return NextResponse.json({ error: "Missing profiles or homeId" }, { status: 400 });
    }
    const metrics = calculateHomeMultiAgencyMetrics(profiles, homeId, body.now ?? NOW);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
