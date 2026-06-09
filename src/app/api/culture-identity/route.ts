// ══════════════════════════════════════════════════════════════════════════════
// API: /api/culture-identity
//
// Culture, Identity & Diversity Intelligence
//
// GET  — Returns culture/identity assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateCultureIdentityIntelligence,
  getIdentityDimensionLabel,
  getActivityTypeLabel,
  getIncidentTypeLabel,
  getTrainingTypeLabel,
} from "@/lib/culture-identity";
import type {
  CultureChild,
  IdentityNeedsAssessment,
  IdentityActivity,
  DiversityIncident,
  StaffDiversityTraining,
} from "@/lib/culture-identity";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_CHILDREN: CultureChild[] = [
  {
    id: "child-alex",
    name: "Alex",
    dateOfBirth: "2012-03-15",
    ethnicHeritage: "White British / Jamaican",
    religion: "None specified",
    firstLanguage: "English",
    genderIdentity: "Male",
    pronouns: "he/him",
    culturalTraditions: ["Caribbean cooking", "Carnival"],
    dietaryRequirements: ["No pork (cultural preference)"],
    currentPlacement: true,
  },
  {
    id: "child-jordan",
    name: "Jordan",
    dateOfBirth: "2013-07-22",
    ethnicHeritage: "White British",
    religion: "Christian (Church of England)",
    firstLanguage: "English",
    genderIdentity: "Non-binary",
    pronouns: "they/them",
    currentPlacement: true,
  },
  {
    id: "child-morgan",
    name: "Morgan",
    dateOfBirth: "2010-12-01",
    ethnicHeritage: "Pakistani British",
    religion: "Islam",
    firstLanguage: "Urdu",
    additionalLanguages: ["English"],
    genderIdentity: "Female",
    pronouns: "she/her",
    culturalTraditions: ["Eid celebrations", "Ramadan", "Mehndi art"],
    dietaryRequirements: ["Halal only"],
    currentPlacement: true,
  },
];

const DEMO_ASSESSMENTS: IdentityNeedsAssessment[] = [
  {
    childId: "child-alex",
    assessmentDate: "2026-01-15",
    dimensionsAssessed: ["ethnic_heritage", "religious_belief", "language", "cultural_traditions"],
    needsIdentified: [
      { dimension: "ethnic_heritage", description: "Alex identifies strongly with Jamaican heritage through maternal grandmother. Needs consistent opportunities to explore and celebrate this", priority: "high", status: "met", supportPlan: "Monthly Caribbean cooking with key worker; community group link established" },
      { dimension: "cultural_traditions", description: "Wants to attend Notting Hill Carnival and local Caribbean cultural events", priority: "medium", status: "met", supportPlan: "Carnival outing planned August; local Caribbean Society contact made" },
      { dimension: "religious_belief", description: "No active religious practice — explored with Alex, who confirmed no interest at this time", priority: "low", status: "met" },
    ],
    reviewDueDate: "2026-07-15",
    assessedBy: "Sarah Johnson",
  },
  {
    childId: "child-jordan",
    assessmentDate: "2026-02-01",
    dimensionsAssessed: ["ethnic_heritage", "religious_belief", "gender_identity", "language"],
    needsIdentified: [
      { dimension: "gender_identity", description: "Jordan identifies as non-binary, uses they/them pronouns. Needs consistent affirmation and appropriate support", priority: "high", status: "met", supportPlan: "All staff briefed on pronouns; pronouns on all records; GIDS referral progressing; LGBTQ+ youth group weekly" },
      { dimension: "religious_belief", description: "Active member of local church youth group — important for peer connection and sense of belonging", priority: "medium", status: "met", supportPlan: "Weekly transport arranged; youth worker liaison established" },
    ],
    reviewDueDate: "2026-08-01",
    assessedBy: "Tom Richards",
  },
  {
    childId: "child-morgan",
    assessmentDate: "2026-01-20",
    dimensionsAssessed: ["ethnic_heritage", "religious_belief", "language", "cultural_traditions"],
    needsIdentified: [
      { dimension: "religious_belief", description: "Practising Muslim — requires prayer times respected, halal food, Ramadan support, mosque access", priority: "high", status: "met", supportPlan: "Prayer space in room; halal menu; Ramadan plan; Friday mosque transport arranged" },
      { dimension: "language", description: "Urdu first language — some academic English vocabulary gaps; wants to maintain Urdu fluency", priority: "high", status: "partially_met", supportPlan: "Urdu mentor fortnightly; bilingual books; school ESOL support in place; seeking community Urdu class" },
      { dimension: "cultural_traditions", description: "Eid celebrations, Ramadan observance, traditional dress and Mehndi art are important to Morgan", priority: "medium", status: "met", supportPlan: "Eid celebrations planned; cultural clothing budget allocated; Mehndi sessions arranged with community volunteer" },
      { dimension: "ethnic_heritage", description: "Links with local Pakistani community to maintain cultural connection", priority: "medium", status: "unmet", supportPlan: "Seeking appropriate community group — limited local options being explored" },
    ],
    reviewDueDate: "2026-07-20",
    assessedBy: "Lisa Williams",
  },
];

const DEMO_ACTIVITIES: IdentityActivity[] = [
  // Alex — Caribbean heritage, mixed-heritage identity work
  { id: "act-001", childId: "child-alex", date: "2026-02-01", activityType: "cultural_food_provided", dimension: "ethnic_heritage", description: "Caribbean cooking session with key worker — jerk chicken and rice & peas. Alex taught recipe from grandmother", childEngaged: true, childInitiated: true, outcome: "Alex enjoyed teaching staff; talked about grandmother's cooking" },
  { id: "act-002", childId: "child-alex", date: "2026-02-15", activityType: "life_story_identity", dimension: "ethnic_heritage", description: "Life story session exploring mixed heritage identity — looked at family photos and talked about Jamaican traditions", childEngaged: true, childInitiated: false, outcome: "Engaged well; asked to do more next month" },
  { id: "act-003", childId: "child-alex", date: "2026-03-15", activityType: "heritage_activity", dimension: "ethnic_heritage", description: "Visit to Black cultural exhibition at local museum", childEngaged: true, childInitiated: false, outcome: "Alex proud to share knowledge with other children" },
  { id: "act-004", childId: "child-alex", date: "2026-04-01", activityType: "cultural_food_provided", dimension: "ethnic_heritage", description: "Monthly Caribbean cooking — ackee and saltfish. Alex FaceTimed grandmother for recipe tips", childEngaged: true, childInitiated: true, outcome: "Beautiful connection with family heritage through food" },
  { id: "act-005", childId: "child-alex", date: "2026-04-20", activityType: "community_link", dimension: "cultural_traditions", description: "First visit to local Caribbean community group with key worker", childEngaged: true, childInitiated: true, outcome: "Met other young people; wants to return" },

  // Jordan — gender identity support, religious community
  { id: "act-006", childId: "child-jordan", date: "2026-01-15", activityType: "identity_exploration", dimension: "gender_identity", description: "Session with gender identity support worker — exploring non-binary identity and expression", childEngaged: true, childInitiated: true, outcome: "Jordan felt validated and supported; positive session" },
  { id: "act-007", childId: "child-jordan", date: "2026-02-10", activityType: "community_link", dimension: "gender_identity", description: "First session at local LGBTQ+ youth group — met other non-binary young people", childEngaged: true, childInitiated: true, outcome: "Jordan made connections; keen to attend weekly" },
  { id: "act-008", childId: "child-jordan", date: "2026-03-01", activityType: "worship_facilitated", dimension: "religious_belief", description: "Weekly transport to church youth group continued", childEngaged: true, childInitiated: false },
  { id: "act-009", childId: "child-jordan", date: "2026-03-20", activityType: "resource_provision", dimension: "gender_identity", description: "Non-binary identity books and affirming items purchased for Jordan's room", childEngaged: true, childInitiated: false, outcome: "Jordan appreciated the acknowledgement of their identity" },
  { id: "act-010", childId: "child-jordan", date: "2026-04-15", activityType: "identity_exploration", dimension: "gender_identity", description: "House meeting discussion on pronouns and respectful language — Jordan led the conversation", childEngaged: true, childInitiated: true, outcome: "Empowering for Jordan; good learning for all children" },

  // Morgan — Islamic faith, Pakistani heritage, language support
  { id: "act-011", childId: "child-morgan", date: "2026-01-25", activityType: "worship_facilitated", dimension: "religious_belief", description: "Prayer space set up in Morgan's room; Friday prayer times protected in home routine", childEngaged: true, childInitiated: false },
  { id: "act-012", childId: "child-morgan", date: "2026-02-10", activityType: "language_support", dimension: "language", description: "Urdu-speaking mentor session — homework support in first language", childEngaged: true, childInitiated: false, outcome: "Morgan more confident discussing complex topics in Urdu" },
  { id: "act-013", childId: "child-morgan", date: "2026-03-01", activityType: "celebration_observed", dimension: "cultural_traditions", description: "Ramadan began — meal times adjusted, staff supported fasting, special iftar meals", childEngaged: true, childInitiated: true, outcome: "Morgan felt respected and supported in her faith" },
  { id: "act-014", childId: "child-morgan", date: "2026-03-15", activityType: "language_support", dimension: "language", description: "Urdu mentor session — Morgan also helping staff learn basic Urdu greetings", childEngaged: true, childInitiated: true, outcome: "Staff learning greetings made Morgan feel valued" },
  { id: "act-015", childId: "child-morgan", date: "2026-04-01", activityType: "celebration_observed", dimension: "cultural_traditions", description: "Eid al-Fitr — gifts, new salwar kameez, special meal, Mehndi art session with community volunteer", childEngaged: true, childInitiated: true, outcome: "Wonderful celebration; all children participated in Mehndi" },
  { id: "act-016", childId: "child-morgan", date: "2026-04-20", activityType: "cultural_food_provided", dimension: "ethnic_heritage", description: "Halal menu expanded — Morgan helped plan weekly menu incorporating Pakistani dishes", childEngaged: true, childInitiated: true, outcome: "Morgan took pride in contributing; biryani now on rotation" },
  { id: "act-017", childId: "child-morgan", date: "2026-05-01", activityType: "heritage_activity", dimension: "cultural_traditions", description: "Mehndi art workshop — Morgan taught other children basic patterns", childEngaged: true, childInitiated: true, outcome: "Cross-cultural sharing; all children enjoyed learning" },
];

const DEMO_INCIDENTS: DiversityIncident[] = [
  {
    id: "inc-001",
    date: "2026-03-05",
    incidentType: "racism",
    perpetrator: "external",
    victimChildIds: ["child-alex"],
    reported: true,
    reportedDate: "2026-03-05",
    investigated: true,
    investigationOutcome: "Racial slur directed at Alex by member of public during community outing. Staff intervened immediately, provided comfort, and recorded incident",
    resolved: true,
    resolvedDate: "2026-03-12",
    actionsTaken: ["Immediate emotional support provided", "Discussed with Alex in key-work next day", "Recorded as racist incident in LA monitoring system", "Staff debriefed", "Pre-planning outings to include diversity awareness"],
    lessonLearned: "Staff to pre-plan community outings considering diversity of group; carry incident reporting cards; ensure all staff confident in responding to racial abuse in public",
  },
  {
    id: "inc-002",
    date: "2026-04-15",
    incidentType: "transphobia",
    perpetrator: "child",
    victimChildIds: ["child-jordan"],
    reported: true,
    reportedDate: "2026-04-15",
    investigated: true,
    investigationOutcome: "Alex deliberately used wrong pronouns for Jordan during mealtime after being reminded. Key work session addressed this — Alex apologised and committed to using they/them",
    resolved: true,
    resolvedDate: "2026-04-20",
    actionsTaken: ["Immediate gentle correction by staff", "Key work session with Alex about respectful language", "Support session for Jordan", "Group house meeting on pronouns added to agenda", "Revisited pronoun awareness with all staff"],
    lessonLearned: "Regular reinforcement of pronoun respect needed — added as standing house meeting agenda item; positive peer culture around diversity to be actively promoted",
  },
];

const DEMO_TRAINING: StaffDiversityTraining[] = [
  // Sarah Johnson — KW, comprehensive training
  { staffId: "staff-sarah", staffName: "Sarah Johnson", trainingType: "equality_diversity", completionDate: "2025-09-15", expiryDate: "2027-09-15", certificateHeld: true },
  { staffId: "staff-sarah", staffName: "Sarah Johnson", trainingType: "cultural_competence", completionDate: "2025-11-01", certificateHeld: true },
  { staffId: "staff-sarah", staffName: "Sarah Johnson", trainingType: "anti_racism", completionDate: "2026-03-15", certificateHeld: true },

  // Tom Richards — trained with LGBTQ+ focus for Jordan
  { staffId: "staff-tom", staffName: "Tom Richards", trainingType: "equality_diversity", completionDate: "2025-08-20", expiryDate: "2027-08-20", certificateHeld: true },
  { staffId: "staff-tom", staffName: "Tom Richards", trainingType: "lgbtq_awareness", completionDate: "2026-01-10", certificateHeld: true },

  // Lisa Williams — trained with religious literacy for Morgan
  { staffId: "staff-lisa", staffName: "Lisa Williams", trainingType: "equality_diversity", completionDate: "2025-10-01", expiryDate: "2027-10-01", certificateHeld: true },
  { staffId: "staff-lisa", staffName: "Lisa Williams", trainingType: "religious_literacy", completionDate: "2025-12-15", certificateHeld: true },

  // Darren Laville (RM) — broad training portfolio
  { staffId: "staff-darren", staffName: "Darren Laville", trainingType: "equality_diversity", completionDate: "2025-07-01", expiryDate: "2027-07-01", certificateHeld: true },
  { staffId: "staff-darren", staffName: "Darren Laville", trainingType: "anti_racism", completionDate: "2025-11-20", certificateHeld: true },
  { staffId: "staff-darren", staffName: "Darren Laville", trainingType: "unconscious_bias", completionDate: "2026-01-05", certificateHeld: true },
  { staffId: "staff-darren", staffName: "Darren Laville", trainingType: "lgbtq_awareness", completionDate: "2026-02-15", certificateHeld: true },
];

const STAFF_IDS = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateCultureIdentityIntelligence(
    DEMO_CHILDREN,
    DEMO_ASSESSMENTS,
    DEMO_ACTIVITIES,
    DEMO_INCIDENTS,
    DEMO_TRAINING,
    STAFF_IDS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  // Enrich with labels
  const enrichedActivityBreakdown = result.activityProvision.activityTypeBreakdown.map((a) => ({
    ...a,
    activityTypeLabel: getActivityTypeLabel(a.activityType),
  }));
  const enrichedDimensionBreakdown = result.activityProvision.dimensionBreakdown.map((d) => ({
    ...d,
    dimensionLabel: getIdentityDimensionLabel(d.dimension),
  }));
  const enrichedIncidentTypes = result.incidentAnalysis.typeBreakdown.map((t) => ({
    ...t,
    incidentTypeLabel: getIncidentTypeLabel(t.incidentType),
  }));
  const enrichedTrainingTypes = result.staffCompetence.trainingTypeBreakdown.map((t) => ({
    ...t,
    trainingTypeLabel: getTrainingTypeLabel(t.trainingType),
  }));

  return NextResponse.json({
    data: {
      ...result,
      activityProvision: {
        ...result.activityProvision,
        activityTypeBreakdown: enrichedActivityBreakdown,
        dimensionBreakdown: enrichedDimensionBreakdown,
      },
      incidentAnalysis: {
        ...result.incidentAnalysis,
        typeBreakdown: enrichedIncidentTypes,
      },
      staffCompetence: {
        ...result.staffCompetence,
        trainingTypeBreakdown: enrichedTrainingTypes,
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
    children,
    assessments,
    activities,
    incidents,
    training,
    staffIds,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    children?: CultureChild[];
    assessments?: IdentityNeedsAssessment[];
    activities?: IdentityActivity[];
    incidents?: DiversityIncident[];
    training?: StaffDiversityTraining[];
    staffIds?: string[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateCultureIdentityIntelligence(
    children,
    assessments ?? [],
    activities ?? [],
    incidents ?? [],
    training ?? [],
    staffIds ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
