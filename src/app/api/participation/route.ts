// ══════════════════════════════════════════════════════════════════════════════
// Children's Participation & Advocacy — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateChildParticipation,
  calculateHomeParticipationMetrics,
} from "@/lib/participation";
import type {
  ChildParticipationProfile,
  HouseMeeting,
  FeedbackRecord,
} from "@/lib/participation";

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_PROFILES: ChildParticipationProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex Turner",
    homeId: "home-oak",
    advocateOffered: true,
    advocateAccepted: true,
    advocateName: "Sue Peters (NYAS)",
    advocateLastVisit: "2026-04-15T10:00:00Z",
    complaintsProcessExplained: true,
    complaintsProcessDate: "2026-01-10T10:00:00Z",
    rightsExplained: true,
    rightsExplainedDate: "2026-01-10T10:00:00Z",
    childrenGuideGiven: true,
    preferredCommunicationMethod: "verbal",
    participationEntries: [
      { id: "pe-a1", date: "2026-05-10T10:00:00Z", decisionArea: "care_plan", method: "review_meeting", childViews: "Wants more contact with mum", viewsActedUpon: true, outcome: "Extra weekly call arranged", recordedBy: "staff-rm-01" },
      { id: "pe-a2", date: "2026-05-05T14:00:00Z", decisionArea: "activities", method: "verbal", childViews: "Would like to join football club", viewsActedUpon: true, outcome: "Signed up for local team", recordedBy: "staff-sw-01" },
      { id: "pe-a3", date: "2026-04-28T10:00:00Z", decisionArea: "food_menu", method: "house_meeting", childViews: "Wants Friday pizza night", viewsActedUpon: true, outcome: "Added to menu rota", recordedBy: "staff-sw-02" },
      { id: "pe-a4", date: "2026-04-20T14:00:00Z", decisionArea: "education", method: "keyworker", childViews: "Struggling with maths homework", viewsActedUpon: true, outcome: "Tutor referral made", recordedBy: "staff-sw-01" },
      { id: "pe-a5", date: "2026-04-10T10:00:00Z", decisionArea: "daily_routine", method: "informal", childViews: "Wants later bedtime at weekends", viewsActedUpon: false, reasonIfNotActedUpon: "Risk assessment — current routine supports sleep needs", recordedBy: "staff-rm-01" },
      { id: "pe-a6", date: "2026-05-14T09:00:00Z", decisionArea: "health", method: "keyworker", childViews: "Anxious about dentist appointment", viewsActedUpon: true, outcome: "Keyworker will attend appointment for support", recordedBy: "staff-sw-01" },
    ],
  },
  {
    childId: "child-jordan",
    childName: "Jordan Mitchell",
    homeId: "home-oak",
    advocateOffered: true,
    advocateAccepted: false,
    complaintsProcessExplained: true,
    complaintsProcessDate: "2026-02-15T10:00:00Z",
    rightsExplained: true,
    rightsExplainedDate: "2026-02-15T10:00:00Z",
    childrenGuideGiven: true,
    preferredCommunicationMethod: "written",
    participationEntries: [
      { id: "pe-j1", date: "2026-05-12T11:00:00Z", decisionArea: "room_decoration", method: "written", childViews: "Wants to repaint room blue", viewsActedUpon: true, outcome: "Paint purchased, decorating planned for weekend", recordedBy: "staff-sw-02" },
      { id: "pe-j2", date: "2026-05-08T14:00:00Z", decisionArea: "activities", method: "house_meeting", childViews: "Wants cinema trips monthly", viewsActedUpon: true, outcome: "Monthly cinema added to activities budget", recordedBy: "staff-rm-01" },
      { id: "pe-j3", date: "2026-04-25T10:00:00Z", decisionArea: "education", method: "review_meeting", childViews: "Wants to try art GCSE", viewsActedUpon: true, outcome: "School contacted re: option change", recordedBy: "staff-sw-01" },
      { id: "pe-j4", date: "2026-05-01T16:00:00Z", decisionArea: "contact", method: "verbal", childViews: "Would like to see gran more often", viewsActedUpon: true, outcome: "Fortnightly visit arranged", recordedBy: "staff-sw-02" },
    ],
  },
  {
    childId: "child-sam",
    childName: "Sam Okafor",
    homeId: "home-oak",
    advocateOffered: true,
    advocateAccepted: true,
    advocateName: "Mark Davidson (Coram Voice)",
    advocateLastVisit: "2026-05-02T14:00:00Z",
    complaintsProcessExplained: true,
    complaintsProcessDate: "2026-03-01T10:00:00Z",
    rightsExplained: true,
    rightsExplainedDate: "2026-03-01T10:00:00Z",
    childrenGuideGiven: true,
    preferredCommunicationMethod: "picture",
    participationEntries: [
      { id: "pe-s1", date: "2026-05-11T10:00:00Z", decisionArea: "food_menu", method: "picture", childViews: "Drew pictures of favourite meals for menu", viewsActedUpon: true, outcome: "Three meals added to rotation", recordedBy: "staff-sw-02" },
      { id: "pe-s2", date: "2026-05-06T14:00:00Z", decisionArea: "house_rules", method: "house_meeting", childViews: "Wants quiet time rule in shared areas after 9pm", viewsActedUpon: true, outcome: "House agreement updated", recordedBy: "staff-rm-01" },
      { id: "pe-s3", date: "2026-04-22T10:00:00Z", decisionArea: "activities", method: "verbal", childViews: "Wants to go swimming", viewsActedUpon: true, outcome: "Weekly swimming session arranged", recordedBy: "staff-sw-01" },
      { id: "pe-s4", date: "2026-05-15T11:00:00Z", decisionArea: "care_plan", method: "advocate", childViews: "Wants more life story work", viewsActedUpon: true, outcome: "Life story sessions scheduled fortnightly", recordedBy: "staff-rm-01" },
      { id: "pe-s5", date: "2026-04-18T14:00:00Z", decisionArea: "daily_routine", method: "keyworker", childViews: "Wants to help cook dinner sometimes", viewsActedUpon: true, outcome: "Added to cooking rota Wednesdays", recordedBy: "staff-sw-02" },
    ],
  },
  {
    childId: "child-casey",
    childName: "Casey Brown",
    homeId: "home-oak",
    advocateOffered: false,
    advocateAccepted: false,
    complaintsProcessExplained: false,
    rightsExplained: true,
    rightsExplainedDate: "2026-04-01T10:00:00Z",
    childrenGuideGiven: false,
    participationEntries: [
      { id: "pe-c1", date: "2026-05-09T10:00:00Z", decisionArea: "activities", method: "verbal", childViews: "Wants to join drama club", viewsActedUpon: true, outcome: "Enrolled in local youth theatre", recordedBy: "staff-sw-01" },
    ],
  },
];

const DEMO_MEETINGS: HouseMeeting[] = [
  {
    id: "hm-001",
    homeId: "home-oak",
    date: "2026-05-13T17:00:00Z",
    type: "house_meeting",
    attendees: ["Alex", "Jordan", "Sam", "Casey", "staff-rm-01", "staff-sw-01"],
    childAttendees: ["Alex", "Jordan", "Sam", "Casey"],
    totalChildrenInHome: 4,
    agendaItems: ["Summer holiday planning", "Garden project", "WiFi schedule"],
    childSuggestedItems: ["Movie marathon weekend", "Get a pet fish"],
    actionsAgreed: [
      { action: "Research holiday activity options", assignedTo: "staff-rm-01", dueDate: "2026-05-20T10:00:00Z", completed: false },
      { action: "Get fish tank quotes", assignedTo: "staff-sw-01", dueDate: "2026-05-18T10:00:00Z", completed: true },
    ],
    minutesRecorded: true,
    chairPerson: "staff-rm-01",
    followUpFromPrevious: true,
  },
  {
    id: "hm-002",
    homeId: "home-oak",
    date: "2026-04-29T17:00:00Z",
    type: "house_meeting",
    attendees: ["Alex", "Jordan", "Sam", "staff-rm-01", "staff-sw-02"],
    childAttendees: ["Alex", "Jordan", "Sam"],
    totalChildrenInHome: 4,
    agendaItems: ["Food menu review", "House rules discussion", "Activity suggestions"],
    childSuggestedItems: ["Pizza night Fridays", "Later TV time weekends"],
    actionsAgreed: [
      { action: "Update menu rota with Friday pizza", assignedTo: "staff-sw-02", dueDate: "2026-05-02T10:00:00Z", completed: true },
      { action: "Trial later TV until 10pm Fri/Sat", assignedTo: "staff-rm-01", dueDate: "2026-05-03T10:00:00Z", completed: true },
    ],
    minutesRecorded: true,
    chairPerson: "staff-sw-02",
    followUpFromPrevious: true,
  },
  {
    id: "hm-003",
    homeId: "home-oak",
    date: "2026-04-15T17:00:00Z",
    type: "house_meeting",
    attendees: ["Alex", "Sam", "Casey", "staff-rm-01", "staff-sw-01"],
    childAttendees: ["Alex", "Sam", "Casey"],
    totalChildrenInHome: 4,
    agendaItems: ["Easter activities", "Room decoration budgets", "Visitor preferences"],
    childSuggestedItems: ["Easter egg hunt in garden"],
    actionsAgreed: [
      { action: "Organise Easter egg hunt", assignedTo: "staff-sw-01", dueDate: "2026-04-18T10:00:00Z", completed: true },
      { action: "Get decoration catalogues for rooms", assignedTo: "staff-rm-01", dueDate: "2026-04-20T10:00:00Z", completed: true },
    ],
    minutesRecorded: true,
    chairPerson: "staff-rm-01",
    followUpFromPrevious: true,
  },
  {
    id: "hm-004",
    homeId: "home-oak",
    date: "2026-04-01T17:00:00Z",
    type: "house_meeting",
    attendees: ["Alex", "Jordan", "Sam", "Casey", "staff-rm-01", "staff-sw-01", "staff-sw-02"],
    childAttendees: ["Alex", "Jordan", "Sam", "Casey"],
    totalChildrenInHome: 4,
    agendaItems: ["Spring cleaning plan", "New child welcome", "Activities for April"],
    childSuggestedItems: ["Trampoline for garden", "Weekly baking session"],
    actionsAgreed: [
      { action: "Research trampoline safety and costs", assignedTo: "staff-rm-01", dueDate: "2026-04-08T10:00:00Z", completed: true },
      { action: "Set up baking supplies and rota", assignedTo: "staff-sw-02", dueDate: "2026-04-05T10:00:00Z", completed: true },
    ],
    minutesRecorded: true,
    chairPerson: "staff-sw-01",
    followUpFromPrevious: true,
  },
  {
    id: "hm-005",
    homeId: "home-oak",
    date: "2026-03-18T17:00:00Z",
    type: "house_meeting",
    attendees: ["Alex", "Jordan", "Sam", "staff-rm-01", "staff-sw-01"],
    childAttendees: ["Alex", "Jordan", "Sam"],
    totalChildrenInHome: 4,
    agendaItems: ["Pocket money discussion", "Weekend plans", "Homework support"],
    childSuggestedItems: ["Games console tournament"],
    actionsAgreed: [
      { action: "Set up tournament bracket", assignedTo: "staff-sw-01", dueDate: "2026-03-22T10:00:00Z", completed: true },
      { action: "Review homework schedule", assignedTo: "staff-rm-01", dueDate: "2026-03-20T10:00:00Z", completed: true },
    ],
    minutesRecorded: true,
    chairPerson: "staff-rm-01",
    followUpFromPrevious: false,
  },
];

const DEMO_FEEDBACK: FeedbackRecord[] = [
  { id: "fb-01", homeId: "home-oak", childId: "child-alex", date: "2026-05-12T10:00:00Z", type: "suggestion", content: "Would like more trips out on weekends", acknowledged: true, actionTaken: "Staff reviewing weekend activity budget", anonymous: false },
  { id: "fb-02", homeId: "home-oak", childId: "child-jordan", date: "2026-05-10T14:00:00Z", type: "compliment", content: "Likes the new Friday pizza night", acknowledged: true, anonymous: false },
  { id: "fb-03", homeId: "home-oak", childId: "child-sam", date: "2026-05-08T10:00:00Z", type: "concern", content: "Noise in corridor at night sometimes", acknowledged: true, actionTaken: "Discussed at house meeting — quiet hours agreement updated", anonymous: false },
  { id: "fb-04", homeId: "home-oak", date: "2026-05-06T10:00:00Z", type: "suggestion", content: "Suggestion box wants a pet day with rescue animals", acknowledged: true, actionTaken: "Researching local animal therapy visits", anonymous: true },
  { id: "fb-05", homeId: "home-oak", childId: "child-casey", date: "2026-05-04T10:00:00Z", type: "concern", content: "Feels left out when others go to football", acknowledged: false, anonymous: false },
  { id: "fb-06", homeId: "home-oak", date: "2026-05-01T10:00:00Z", type: "survey_response", content: "Overall happy with home life, rates 4/5", acknowledged: true, anonymous: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") || "home-oak";
  const mode = searchParams.get("mode") || "dashboard";
  const childId = searchParams.get("childId");
  const now = new Date().toISOString();

  if (mode === "child" && childId) {
    const profile = DEMO_PROFILES.find(p => p.childId === childId && p.homeId === homeId);
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    const result = evaluateChildParticipation(profile, now);
    return NextResponse.json(result);
  }

  if (mode === "metrics") {
    const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
    const homeMeetings = DEMO_MEETINGS.filter(m => m.homeId === homeId);
    const homeFeedback = DEMO_FEEDBACK.filter(f => f.homeId === homeId);
    const metrics = calculateHomeParticipationMetrics(homeProfiles, homeMeetings, homeFeedback, homeId, now);
    return NextResponse.json(metrics);
  }

  // Dashboard mode — returns everything needed for the widget
  const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
  const homeMeetings = DEMO_MEETINGS.filter(m => m.homeId === homeId);
  const homeFeedback = DEMO_FEEDBACK.filter(f => f.homeId === homeId);
  const metrics = calculateHomeParticipationMetrics(homeProfiles, homeMeetings, homeFeedback, homeId, now);

  const childResults = homeProfiles.map(p => evaluateChildParticipation(p, now));

  const recentMeetings = homeMeetings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(m => ({
      id: m.id,
      date: m.date,
      attendanceRate: Math.round((m.childAttendees.length / m.totalChildrenInHome) * 100),
      childSuggestedItems: m.childSuggestedItems.length,
      actionsCompleted: m.actionsAgreed.filter(a => a.completed).length,
      actionsTotal: m.actionsAgreed.length,
    }));

  const recentFeedback = homeFeedback
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
    .map(f => ({
      id: f.id,
      type: f.type,
      acknowledged: f.acknowledged,
      anonymous: f.anonymous,
      date: f.date,
    }));

  return NextResponse.json({
    metrics: {
      overallParticipationScore: metrics.overallParticipationScore,
      advocacyAccessRate: metrics.advocacyAccessRate,
      complaintsAwarenessRate: metrics.complaintsAwarenessRate,
      rightsExplainedRate: metrics.rightsExplainedRate,
      houseMeetingFrequency: metrics.houseMeetingFrequency,
      houseMeetingAttendanceRate: metrics.houseMeetingAttendanceRate,
      actionCompletionRate: metrics.actionCompletionRate,
      childSuggestedItemsRate: metrics.childSuggestedItemsRate,
      viewsActedUponRate: metrics.viewsActedUponRate,
      feedbackCount30Days: metrics.feedbackCount30Days,
      feedbackAcknowledgedRate: metrics.feedbackAcknowledgedRate,
    },
    children: childResults.map(r => ({
      childId: r.childId,
      childName: r.childName,
      participationScore: r.participationScore,
      isCompliant: r.isCompliant,
      entriesLast30Days: r.entriesLast30Days,
      viewsActedUponRate: r.viewsActedUponRate,
      issues: r.issues,
    })),
    recentMeetings,
    recentFeedback,
    complianceIssues: metrics.complianceIssues,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, homeId, profile, profiles, meetings, feedback, now } = body;

  if (action === "evaluate" && profile) {
    const result = evaluateChildParticipation(profile, now);
    return NextResponse.json(result);
  }

  if (action === "metrics" && profiles) {
    const result = calculateHomeParticipationMetrics(
      profiles,
      meetings || [],
      feedback || [],
      homeId || "home-oak",
      now,
    );
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
