// ══════════════════════════════════════════════════════════════════════════════
// API: /api/online-safety
//
// Online Safety & Digital Wellbeing Intelligence
//
// GET  — Returns online safety assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateOnlineSafetyIntelligence,
  getIncidentTypeLabel,
  getEducationTopicLabel,
} from "@/lib/online-safety";
import type {
  OnlineSafetyChild,
  OnlineRiskAssessment,
  OnlineIncident,
  OnlineEducationSession,
  StaffOnlineTraining,
  OnlineSafetyPolicy,
} from "@/lib/online-safety";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_CHILDREN: OnlineSafetyChild[] = [
  { id: "child-alex", name: "Alex", dateOfBirth: "2012-03-15", currentPlacement: true },
  { id: "child-jordan", name: "Jordan", dateOfBirth: "2013-07-22", currentPlacement: true },
  { id: "child-morgan", name: "Morgan", dateOfBirth: "2010-12-01", currentPlacement: true },
];

const DEMO_ASSESSMENTS: OnlineRiskAssessment[] = [
  {
    id: "ora-alex",
    childId: "child-alex",
    assessmentDate: "2026-01-20",
    reviewDueDate: "2026-07-20",
    assessedBy: "Sarah Johnson",
    overallRiskLevel: "medium",
    risksIdentified: [
      { category: "gaming_addiction", level: "medium", mitigations: ["Screen time agreement (3h/day)", "Console in communal area", "No gaming after 9pm", "Weekly check-in on gaming habits"] },
      { category: "cyberbullying", level: "low", mitigations: ["Privacy settings reviewed on all accounts", "Knows how to block and report", "Key-work sessions cover online relationships"] },
    ],
    devicesAccessed: ["personal_phone", "gaming_console", "home_laptop"],
    safetyMeasuresInPlace: ["content_filtering", "time_restrictions", "monitoring_software", "privacy_settings_reviewed"],
    deviceAgreementSigned: true,
    socialMediaAccounts: ["TikTok", "Instagram"],
    screenTimeAgreementHours: 3,
  },
  {
    id: "ora-jordan",
    childId: "child-jordan",
    assessmentDate: "2026-02-05",
    reviewDueDate: "2026-08-05",
    assessedBy: "Tom Richards",
    overallRiskLevel: "low",
    risksIdentified: [
      { category: "exposure_harmful_content", level: "low", mitigations: ["Content filtering active", "Regular check-ins about online activity", "Knows reporting pathways"] },
      { category: "cyberbullying", level: "medium", mitigations: ["Privacy settings maximised", "LGBTQ+ online safety discussed in key-work", "Monitoring for identity-based harassment"] },
    ],
    devicesAccessed: ["personal_phone", "home_tablet"],
    safetyMeasuresInPlace: ["content_filtering", "monitoring_software", "app_restrictions", "parental_controls"],
    deviceAgreementSigned: true,
    socialMediaAccounts: ["YouTube"],
    screenTimeAgreementHours: 2,
  },
  {
    id: "ora-morgan",
    childId: "child-morgan",
    assessmentDate: "2026-01-25",
    reviewDueDate: "2026-07-25",
    assessedBy: "Lisa Williams",
    overallRiskLevel: "high",
    risksIdentified: [
      { category: "grooming", level: "high", mitigations: ["Enhanced monitoring via Bark", "Weekly phone review with consent", "CEOP reporting pathway taught", "Regular key-work on healthy online relationships", "Social worker informed of risk level"] },
      { category: "sexting", level: "medium", mitigations: ["1:1 education on image sharing law", "Phone reviewed with consent", "Privacy settings locked", "Trusted adult discussion ongoing"] },
      { category: "data_sharing", level: "medium", mitigations: ["Location sharing disabled", "Privacy settings reviewed monthly", "Social media account privacy maximised"] },
    ],
    devicesAccessed: ["personal_phone", "home_laptop", "personal_tablet"],
    safetyMeasuresInPlace: ["content_filtering", "monitoring_software", "time_restrictions", "privacy_settings_reviewed", "app_restrictions"],
    deviceAgreementSigned: true,
    socialMediaAccounts: ["TikTok", "Instagram", "Snapchat", "WhatsApp"],
    screenTimeAgreementHours: 2.5,
  },
];

const DEMO_INCIDENTS: OnlineIncident[] = [
  {
    id: "oi-001",
    childId: "child-alex",
    date: "2026-03-10",
    incidentType: "excessive_screen_time",
    severity: 1 as const,
    description: "Alex exceeded agreed screen time by 2 hours playing Fortnite on Saturday. Gaming console timer bypassed by restarting console",
    reportedTo: ["key_worker"],
    ceopReferral: false,
    policeInvolved: false,
    socialWorkerNotified: false,
    parentNotified: false,
    deviceSeized: false,
    safeguardingActionTaken: ["Discussed in key-work session", "Screen time agreement revisited and re-signed", "Console timer settings updated with parental lock"],
    outcome: "Alex understood and agreed to new system; no repeat since",
    resolved: true,
    resolvedDate: "2026-03-12",
  },
  {
    id: "oi-002",
    childId: "child-morgan",
    date: "2026-02-15",
    incidentType: "contact_from_unknown_adult",
    severity: 4 as const,
    description: "Bark monitoring flagged suspicious DMs to Morgan from unknown adult male on Instagram. Messages showed grooming pattern — flattery, requests for photos, attempts to move conversation to Snapchat",
    reportedTo: ["registered_manager", "social_worker", "CEOP"],
    ceopReferral: true,
    policeInvolved: true,
    socialWorkerNotified: true,
    parentNotified: false,
    deviceSeized: true,
    safeguardingActionTaken: [
      "Phone seized immediately with Morgan's understanding",
      "CEOP report submitted within 1 hour",
      "Police notified — crime reference obtained",
      "Social worker informed same day",
      "1:1 support session with Morgan — discussed what happened and reassured not her fault",
      "Risk assessment updated to reflect grooming attempt",
      "Account blocked and reported to Instagram",
      "Enhanced monitoring put in place across all platforms",
    ],
    outcome: "CEOP investigation opened; perpetrator account removed by Instagram; Morgan well-supported throughout",
    resolved: true,
    resolvedDate: "2026-03-01",
  },
  {
    id: "oi-003",
    childId: "child-jordan",
    date: "2026-04-05",
    incidentType: "cyberbullying_victim",
    severity: 2 as const,
    description: "Jordan received transphobic comments on YouTube video they had commented on. Comments referenced their identity directly",
    reportedTo: ["key_worker", "registered_manager"],
    ceopReferral: false,
    policeInvolved: false,
    socialWorkerNotified: true,
    parentNotified: false,
    deviceSeized: false,
    safeguardingActionTaken: [
      "Comments reported to YouTube and removed within 24 hours",
      "Emotional support session with Jordan — felt upset but resilient",
      "Privacy settings further tightened — commenting disabled on public content",
      "Discussed blocking, reporting, and not engaging with trolls",
      "Linked to LGBTQ+ online safety resources",
    ],
    outcome: "Jordan felt supported; comments removed; privacy settings improved",
    resolved: true,
    resolvedDate: "2026-04-08",
  },
];

const DEMO_EDUCATION: OnlineEducationSession[] = [
  { id: "edu-001", date: "2026-01-20", topic: "recognising_grooming", childIds: ["child-alex", "child-jordan", "child-morgan"], deliveredBy: "Sarah Johnson", method: "group_session", childrenEngaged: true, followUpNeeded: false, notes: "All children engaged well; Morgan asked good questions about warning signs" },
  { id: "edu-002", date: "2026-02-10", topic: "image_sharing_law", childIds: ["child-morgan"], deliveredBy: "Lisa Williams", method: "one_to_one", childrenEngaged: true, followUpNeeded: true, notes: "Focused session following risk assessment — Morgan now understands legal implications" },
  { id: "edu-003", date: "2026-02-25", topic: "cyberbullying_awareness", childIds: ["child-alex", "child-jordan", "child-morgan"], deliveredBy: "Tom Richards", method: "group_session", childrenEngaged: true, followUpNeeded: false },
  { id: "edu-004", date: "2026-03-15", topic: "privacy_settings", childIds: ["child-alex", "child-jordan", "child-morgan"], deliveredBy: "Sarah Johnson", method: "group_session", childrenEngaged: true, followUpNeeded: false, notes: "Hands-on session — each child reviewed their own settings with staff" },
  { id: "edu-005", date: "2026-03-25", topic: "screen_time_balance", childIds: ["child-alex"], deliveredBy: "Sarah Johnson", method: "one_to_one", childrenEngaged: true, followUpNeeded: false, notes: "Following gaming incident — Alex reflected on impact of excessive gaming" },
  { id: "edu-006", date: "2026-04-10", topic: "social_media_safety", childIds: ["child-jordan", "child-morgan"], deliveredBy: "Lisa Williams", method: "group_session", childrenEngaged: true, followUpNeeded: false },
  { id: "edu-007", date: "2026-04-20", topic: "reporting_concerns", childIds: ["child-alex", "child-jordan", "child-morgan"], deliveredBy: "Darren Laville", method: "group_session", childrenEngaged: true, followUpNeeded: false, notes: "Covered CEOP button, Childline, telling a trusted adult. All children can demonstrate" },
  { id: "edu-008", date: "2026-05-05", topic: "digital_footprint", childIds: ["child-morgan"], deliveredBy: "Lisa Williams", method: "one_to_one", childrenEngaged: true, followUpNeeded: true, notes: "Morgan increasingly aware of permanence of online actions — good progress" },
];

const DEMO_TRAINING: StaffOnlineTraining[] = [
  { staffId: "staff-sarah", staffName: "Sarah Johnson", trainingName: "Online Safety in Children's Homes", completionDate: "2025-09-15", expiryDate: "2026-09-15", provider: "NSPCC", certificateHeld: true },
  { staffId: "staff-tom", staffName: "Tom Richards", trainingName: "Online Safety in Children's Homes", completionDate: "2025-10-01", expiryDate: "2026-10-01", provider: "NSPCC", certificateHeld: true },
  { staffId: "staff-lisa", staffName: "Lisa Williams", trainingName: "Online Safety in Children's Homes", completionDate: "2025-11-15", expiryDate: "2026-11-15", provider: "NSPCC", certificateHeld: true },
  { staffId: "staff-darren", staffName: "Darren Laville", trainingName: "Online Safety for Managers — CEOP Ambassador", completionDate: "2025-08-01", expiryDate: "2026-08-01", provider: "Internet Watch Foundation / CEOP", certificateHeld: true },
];

const STAFF_IDS = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];

const DEMO_POLICY: OnlineSafetyPolicy = {
  lastReviewDate: "2026-01-15",
  nextReviewDue: "2027-01-15",
  filteringProvider: "NetNanny",
  monitoringProvider: "Bark",
  reportingPathwayDocumented: true,
  childFriendlyVersion: true,
  staffBriefedDate: "2026-01-20",
};

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateOnlineSafetyIntelligence(
    DEMO_CHILDREN,
    DEMO_ASSESSMENTS,
    DEMO_INCIDENTS,
    DEMO_EDUCATION,
    DEMO_TRAINING,
    STAFF_IDS,
    DEMO_POLICY,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  // Enrich with labels
  const enrichedIncidentTypes = result.incidentAnalysis.typeBreakdown.map((t) => ({
    ...t,
    incidentTypeLabel: getIncidentTypeLabel(t.incidentType),
  }));
  const enrichedTopics = result.education.topicBreakdown.map((t) => ({
    ...t,
    topicLabel: getEducationTopicLabel(t.topic),
  }));

  return NextResponse.json({
    data: {
      ...result,
      incidentAnalysis: {
        ...result.incidentAnalysis,
        typeBreakdown: enrichedIncidentTypes,
      },
      education: {
        ...result.education,
        topicBreakdown: enrichedTopics,
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    children, assessments, incidents, educationSessions, staffTraining,
    staffIds, policy, homeId, periodStart, periodEnd,
  } = body as {
    children?: OnlineSafetyChild[];
    assessments?: OnlineRiskAssessment[];
    incidents?: OnlineIncident[];
    educationSessions?: OnlineEducationSession[];
    staffTraining?: StaffOnlineTraining[];
    staffIds?: string[];
    policy?: OnlineSafetyPolicy;
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!policy) {
    return NextResponse.json({ error: "policy object is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateOnlineSafetyIntelligence(
    children, assessments ?? [], incidents ?? [], educationSessions ?? [],
    staffTraining ?? [], staffIds ?? [], policy, homeId ?? "unknown",
    periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
