// ══════════════════════════════════════════════════════════════════════════════
// API: /api/digital-literacy
//
// Digital Literacy & Online Engagement Intelligence
//
// GET  — Returns digital literacy assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateDigitalLiteracyIntelligence } from "@/lib/digital-literacy";
import type {
  DigitalSkillAssessment,
  DeviceAccessRecord,
  OnlineLearningRecord,
  DigitalCitizenshipRecord,
} from "@/lib/digital-literacy";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const DEMO_CHILD_NAMES: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

const DEMO_ASSESSMENTS: DigitalSkillAssessment[] = [
  {
    id: "dsa-alex",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-02-15",
    assessedBy: "Sarah Johnson",
    skills: [
      { category: "online_safety_awareness", level: "competent" },
      { category: "communication", level: "competent" },
      { category: "content_creation", level: "developing" },
      { category: "information_literacy", level: "competent" },
      { category: "coding", level: "proficient", notes: "Enjoys Python and Scratch — attends Code Club weekly" },
      { category: "productivity_tools", level: "competent" },
      { category: "social_media_literacy", level: "developing" },
      { category: "digital_wellbeing", level: "competent" },
      { category: "privacy_management", level: "developing" },
      { category: "critical_thinking", level: "competent" },
    ],
    overallLevel: "competent",
    developmentGoals: [
      "Complete Code Club Level 3",
      "Improve privacy management skills",
      "Create first website project",
    ],
    reviewDate: "2026-08-15",
  },
  {
    id: "dsa-jordan",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-03-01",
    assessedBy: "Tom Richards",
    skills: [
      { category: "online_safety_awareness", level: "competent" },
      { category: "communication", level: "developing" },
      { category: "content_creation", level: "developing" },
      { category: "information_literacy", level: "developing" },
      { category: "coding", level: "beginner" },
      { category: "productivity_tools", level: "developing" },
      { category: "social_media_literacy", level: "competent" },
      { category: "digital_wellbeing", level: "competent" },
      { category: "privacy_management", level: "developing" },
      { category: "critical_thinking", level: "developing" },
    ],
    overallLevel: "developing",
    developmentGoals: [
      "Learn basic coding with Scratch",
      "Improve information literacy for homework research",
    ],
    reviewDate: "2026-09-01",
  },
  {
    id: "dsa-morgan",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-01-20",
    assessedBy: "Lisa Williams",
    skills: [
      { category: "online_safety_awareness", level: "proficient" },
      { category: "communication", level: "proficient" },
      { category: "content_creation", level: "competent" },
      { category: "information_literacy", level: "proficient" },
      { category: "coding", level: "competent" },
      { category: "productivity_tools", level: "proficient" },
      { category: "social_media_literacy", level: "competent" },
      { category: "digital_wellbeing", level: "proficient" },
      { category: "privacy_management", level: "competent" },
      { category: "critical_thinking", level: "proficient" },
    ],
    overallLevel: "proficient",
    developmentGoals: [
      "Develop advanced spreadsheet skills for GCSE coursework",
      "Create digital portfolio for college applications",
    ],
    reviewDate: "2026-07-20",
  },
];

const DEMO_DEVICE_ACCESS: DeviceAccessRecord[] = [
  {
    id: "da-alex-1",
    childId: "child-alex",
    childName: "Alex",
    deviceType: "laptop",
    accessLevel: "monitored",
    agreementSigned: true,
    agreementDate: "2026-01-10",
    reviewDate: "2026-07-10",
    restrictionsInPlace: ["Content filtering", "Time limits 3h/day"],
    ageAppropriate: true,
  },
  {
    id: "da-alex-2",
    childId: "child-alex",
    childName: "Alex",
    deviceType: "smartphone",
    accessLevel: "independent_with_checks",
    agreementSigned: true,
    agreementDate: "2026-01-10",
    reviewDate: "2026-07-10",
    restrictionsInPlace: ["App restrictions", "Location sharing off"],
    ageAppropriate: true,
  },
  {
    id: "da-alex-3",
    childId: "child-alex",
    childName: "Alex",
    deviceType: "gaming_console",
    accessLevel: "monitored",
    agreementSigned: true,
    agreementDate: "2026-01-10",
    reviewDate: "2026-07-10",
    restrictionsInPlace: ["Communal area only", "No online chat with strangers"],
    ageAppropriate: true,
  },
  {
    id: "da-jordan-1",
    childId: "child-jordan",
    childName: "Jordan",
    deviceType: "tablet",
    accessLevel: "supervised",
    agreementSigned: true,
    agreementDate: "2026-02-01",
    reviewDate: "2026-08-01",
    restrictionsInPlace: ["Content filtering", "Parental controls active"],
    ageAppropriate: true,
  },
  {
    id: "da-jordan-2",
    childId: "child-jordan",
    childName: "Jordan",
    deviceType: "laptop",
    accessLevel: "supervised",
    agreementSigned: true,
    agreementDate: "2026-02-01",
    reviewDate: "2026-08-01",
    restrictionsInPlace: ["Content filtering", "Supervised use only for homework"],
    ageAppropriate: true,
  },
  {
    id: "da-morgan-1",
    childId: "child-morgan",
    childName: "Morgan",
    deviceType: "laptop",
    accessLevel: "independent_with_checks",
    agreementSigned: true,
    agreementDate: "2026-01-05",
    reviewDate: "2026-07-05",
    restrictionsInPlace: ["Weekly check-in on usage"],
    ageAppropriate: true,
  },
  {
    id: "da-morgan-2",
    childId: "child-morgan",
    childName: "Morgan",
    deviceType: "smartphone",
    accessLevel: "independent_with_checks",
    agreementSigned: true,
    agreementDate: "2026-01-05",
    reviewDate: "2026-07-05",
    restrictionsInPlace: ["Monthly review of apps and usage"],
    ageAppropriate: true,
  },
  {
    id: "da-morgan-3",
    childId: "child-morgan",
    childName: "Morgan",
    deviceType: "desktop",
    accessLevel: "fully_independent",
    agreementSigned: true,
    agreementDate: "2026-01-05",
    reviewDate: "2026-07-05",
    restrictionsInPlace: [],
    ageAppropriate: true,
  },
];

const DEMO_LEARNING: OnlineLearningRecord[] = [
  { id: "ol-1", childId: "child-alex", childName: "Alex", date: "2026-01-20", platform: "Code.org", activityType: "educational", durationMinutes: 45, supervised: false, outcomePositive: true, notes: "Completed Hour of Code challenge" },
  { id: "ol-2", childId: "child-alex", childName: "Alex", date: "2026-02-05", platform: "Scratch", activityType: "creative", durationMinutes: 60, supervised: false, outcomePositive: true, notes: "Built animation project — shared with Code Club" },
  { id: "ol-3", childId: "child-alex", childName: "Alex", date: "2026-02-20", platform: "BBC Bitesize", activityType: "educational", durationMinutes: 30, supervised: true, outcomePositive: true },
  { id: "ol-4", childId: "child-alex", childName: "Alex", date: "2026-03-10", platform: "Python IDLE", activityType: "educational", durationMinutes: 50, supervised: false, outcomePositive: true, notes: "Created first Python text-based game" },
  { id: "ol-5", childId: "child-alex", childName: "Alex", date: "2026-04-01", platform: "Google Scholar", activityType: "research", durationMinutes: 25, supervised: true, outcomePositive: true },
  { id: "ol-6", childId: "child-alex", childName: "Alex", date: "2026-04-15", platform: "National Careers Service", activityType: "career_exploration", durationMinutes: 30, supervised: true, outcomePositive: true, notes: "Explored software development careers" },
  { id: "ol-7", childId: "child-jordan", childName: "Jordan", date: "2026-01-25", platform: "BBC Bitesize", activityType: "educational", durationMinutes: 40, supervised: true, outcomePositive: true },
  { id: "ol-8", childId: "child-jordan", childName: "Jordan", date: "2026-02-10", platform: "Canva", activityType: "creative", durationMinutes: 35, supervised: true, outcomePositive: true, notes: "Designed birthday card for friend" },
  { id: "ol-9", childId: "child-jordan", childName: "Jordan", date: "2026-03-05", platform: "YouTube Learning", activityType: "educational", durationMinutes: 20, supervised: true, outcomePositive: true },
  { id: "ol-10", childId: "child-jordan", childName: "Jordan", date: "2026-04-10", platform: "Teams", activityType: "social", durationMinutes: 30, supervised: false, outcomePositive: true, notes: "Video call with social worker" },
  { id: "ol-11", childId: "child-jordan", childName: "Jordan", date: "2026-05-01", platform: "Google Docs", activityType: "educational", durationMinutes: 45, supervised: true, outcomePositive: false, notes: "Struggled with formatting — needs follow-up support" },
  { id: "ol-12", childId: "child-morgan", childName: "Morgan", date: "2026-01-15", platform: "Google Classroom", activityType: "educational", durationMinutes: 60, supervised: false, outcomePositive: true },
  { id: "ol-13", childId: "child-morgan", childName: "Morgan", date: "2026-01-28", platform: "Khan Academy", activityType: "educational", durationMinutes: 45, supervised: false, outcomePositive: true, notes: "GCSE maths revision — completed unit on algebra" },
  { id: "ol-14", childId: "child-morgan", childName: "Morgan", date: "2026-02-14", platform: "JSTOR", activityType: "research", durationMinutes: 40, supervised: false, outcomePositive: true },
  { id: "ol-15", childId: "child-morgan", childName: "Morgan", date: "2026-03-01", platform: "UCAS", activityType: "career_exploration", durationMinutes: 50, supervised: true, outcomePositive: true, notes: "Explored sixth-form college courses" },
  { id: "ol-16", childId: "child-morgan", childName: "Morgan", date: "2026-03-20", platform: "Google Slides", activityType: "creative", durationMinutes: 55, supervised: false, outcomePositive: true, notes: "Created science presentation for school" },
  { id: "ol-17", childId: "child-morgan", childName: "Morgan", date: "2026-04-05", platform: "BBC Bitesize", activityType: "educational", durationMinutes: 30, supervised: false, outcomePositive: true },
  { id: "ol-18", childId: "child-morgan", childName: "Morgan", date: "2026-04-20", platform: "Teams", activityType: "social", durationMinutes: 25, supervised: false, outcomePositive: true, notes: "Peer study group for exam prep" },
  { id: "ol-19", childId: "child-morgan", childName: "Morgan", date: "2026-05-10", platform: "LinkedIn Learning", activityType: "career_exploration", durationMinutes: 40, supervised: false, outcomePositive: true },
];

const DEMO_CITIZENSHIP: DigitalCitizenshipRecord[] = [
  { id: "dc-1", childId: "child-jordan", childName: "Jordan", date: "2026-01-18", area: "kindness_online", demonstratedPositively: true, context: "Sent supportive messages to friend going through difficult time", staffWitnessedBy: "Tom Richards" },
  { id: "dc-2", childId: "child-jordan", childName: "Jordan", date: "2026-02-05", area: "reporting_concerns", demonstratedPositively: true, context: "Reported suspicious message from unknown account to staff immediately", staffWitnessedBy: "Sarah Johnson" },
  { id: "dc-3", childId: "child-jordan", childName: "Jordan", date: "2026-02-20", area: "balanced_usage", demonstratedPositively: true, context: "Voluntarily put phone away during family activity evening", staffWitnessedBy: "Lisa Williams" },
  { id: "dc-4", childId: "child-jordan", childName: "Jordan", date: "2026-03-10", area: "respecting_privacy", demonstratedPositively: true, context: "Asked permission before sharing group photo online", staffWitnessedBy: "Tom Richards" },
  { id: "dc-5", childId: "child-jordan", childName: "Jordan", date: "2026-04-01", area: "critical_evaluation", demonstratedPositively: true, context: "Questioned misleading news article and fact-checked before sharing", staffWitnessedBy: "Sarah Johnson" },
  { id: "dc-6", childId: "child-alex", childName: "Alex", date: "2026-01-25", area: "digital_footprint", demonstratedPositively: true, context: "Reviewed and cleaned up old social media posts proactively", staffWitnessedBy: "Sarah Johnson" },
  { id: "dc-7", childId: "child-alex", childName: "Alex", date: "2026-02-15", area: "balanced_usage", demonstratedPositively: false, context: "Exceeded screen time agreement by 2 hours on gaming — discussed in key-work session", staffWitnessedBy: "Darren Laville" },
  { id: "dc-8", childId: "child-alex", childName: "Alex", date: "2026-03-05", area: "kindness_online", demonstratedPositively: true, context: "Helped younger child learn to use video calling app to speak with family", staffWitnessedBy: "Tom Richards" },
  { id: "dc-9", childId: "child-alex", childName: "Alex", date: "2026-04-10", area: "critical_evaluation", demonstratedPositively: true, context: "Identified phishing email and reported it to staff", staffWitnessedBy: "Lisa Williams" },
  { id: "dc-10", childId: "child-morgan", childName: "Morgan", date: "2026-01-22", area: "digital_footprint", demonstratedPositively: true, context: "Set up professional LinkedIn profile for career exploration with staff support", staffWitnessedBy: "Lisa Williams" },
  { id: "dc-11", childId: "child-morgan", childName: "Morgan", date: "2026-02-28", area: "respecting_privacy", demonstratedPositively: true, context: "Ensured all research sources were properly cited in coursework", staffWitnessedBy: "Darren Laville" },
  { id: "dc-12", childId: "child-morgan", childName: "Morgan", date: "2026-03-15", area: "balanced_usage", demonstratedPositively: true, context: "Maintained agreed screen time limits during exam revision period", staffWitnessedBy: "Sarah Johnson" },
  { id: "dc-13", childId: "child-morgan", childName: "Morgan", date: "2026-04-20", area: "reporting_concerns", demonstratedPositively: true, context: "Flagged inappropriate content on study forum to moderators", staffWitnessedBy: "Tom Richards" },
];

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateDigitalLiteracyIntelligence(
    DEMO_ASSESSMENTS,
    DEMO_DEVICE_ACCESS,
    DEMO_LEARNING,
    DEMO_CITIZENSHIP,
    DEMO_CHILD_IDS,
    DEMO_CHILD_NAMES,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({ data: result });
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      assessments,
      deviceAccess,
      learning,
      citizenship,
      childIds,
      childNames,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    // Validation
    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return NextResponse.json(
        { error: "childIds is required and must be a non-empty array" },
        { status: 400 },
      );
    }
    if (!childNames || typeof childNames !== "object") {
      return NextResponse.json(
        { error: "childNames is required and must be an object mapping childId to name" },
        { status: 400 },
      );
    }
    if (!homeId || typeof homeId !== "string") {
      return NextResponse.json(
        { error: "homeId is required and must be a string" },
        { status: 400 },
      );
    }
    if (!periodStart || typeof periodStart !== "string") {
      return NextResponse.json(
        { error: "periodStart is required and must be a date string (YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (!periodEnd || typeof periodEnd !== "string") {
      return NextResponse.json(
        { error: "periodEnd is required and must be a date string (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const result = generateDigitalLiteracyIntelligence(
      (assessments ?? []) as DigitalSkillAssessment[],
      (deviceAccess ?? []) as DeviceAccessRecord[],
      (learning ?? []) as OnlineLearningRecord[],
      (citizenship ?? []) as DigitalCitizenshipRecord[],
      childIds as string[],
      childNames as Record<string, string>,
      homeId as string,
      periodStart as string,
      periodEnd as string,
      (referenceDate as string) ?? undefined,
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 },
    );
  }
}
