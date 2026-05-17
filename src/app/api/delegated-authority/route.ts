// ══════════════════════════════════════════════════════════════════════════════
// Delegated Authority & Consent — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateDelegatedAuthorityCompliance,
  calculateHomeDelegatedAuthorityMetrics,
  getDecisionCategoryLabel,
  getAuthorityLevelLabel,
} from "@/lib/delegated-authority";
import type {
  ChildDelegatedAuthorityProfile,
  DelegatedAuthorityEntry,
  ConsentRecord,
  EmergencyDecision,
} from "@/lib/delegated-authority";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeDelegation(
  category: DelegatedAuthorityEntry["category"],
  authorityLevel: DelegatedAuthorityEntry["authorityLevel"],
  notes?: string,
): DelegatedAuthorityEntry {
  return {
    category,
    authorityLevel,
    agreedDate: "2026-01-15T10:00:00Z",
    agreedBy: "SW Jane Smith",
    reviewDate: "2026-07-15T10:00:00Z",
    notes,
  };
}

const DEMO_PROFILES: ChildDelegatedAuthorityProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    placingAuthority: "Anyshire County Council",
    socialWorkerName: "Jane Smith",
    delegatedAuthority: [
      makeDelegation("routine_medical", "home_decides"),
      makeDelegation("dental", "home_decides"),
      makeDelegation("haircut", "home_decides"),
      makeDelegation("leisure_activities", "home_decides"),
      makeDelegation("clothing_choices", "home_decides"),
      makeDelegation("pocket_money_amounts", "home_decides"),
      makeDelegation("emergency_medical", "home_decides"),
      makeDelegation("diet_changes", "home_decides"),
      makeDelegation("overnight_stays", "home_with_notification"),
      makeDelegation("school_trips", "home_with_notification"),
      makeDelegation("social_media", "home_with_notification"),
      makeDelegation("mobile_phone", "home_with_notification"),
      makeDelegation("ear_piercing", "home_with_notification"),
      makeDelegation("religious_observance", "home_decides"),
      makeDelegation("relationships_dating", "home_with_notification"),
      makeDelegation("travel_domestic", "home_with_notification"),
      makeDelegation("specialist_medical", "la_consent_required"),
      makeDelegation("vaccinations", "parent_consent_required"),
      makeDelegation("travel_international", "la_consent_required"),
      makeDelegation("education_decisions", "la_consent_required"),
      makeDelegation("contact_arrangements", "la_consent_required"),
      makeDelegation("photographs_media", "parent_consent_required"),
    ],
    scheduleAgreedDate: "2026-01-15T10:00:00Z",
    scheduleLastReviewDate: "2026-01-15T10:00:00Z",
    scheduleNextReviewDate: "2026-07-15T10:00:00Z",
    consentRecords: [
      { id: "con-001", childId: "child-alex", category: "school_trips", description: "Year 9 residential trip to Wales", requestedDate: "2026-05-01T10:00:00Z", requestedBy: "staff-rm-01", consentFrom: "Anyshire CC (SW)", consentStatus: "granted", responseDate: "2026-05-03T10:00:00Z", expiryDate: "2026-06-30T00:00:00Z", evidenceHeld: true, childInformed: true },
      { id: "con-002", childId: "child-alex", category: "photographs_media", description: "School newsletter photo", requestedDate: "2026-04-20T10:00:00Z", requestedBy: "staff-rm-01", consentFrom: "Parent (Mother)", consentStatus: "granted", responseDate: "2026-04-22T10:00:00Z", evidenceHeld: true, childInformed: true },
      { id: "con-003", childId: "child-alex", category: "vaccinations", description: "MMR booster", requestedDate: "2026-05-10T10:00:00Z", requestedBy: "staff-rm-02", consentFrom: "Parent (Mother)", consentStatus: "pending", evidenceHeld: false, childInformed: true },
    ],
    placementPlanSpecifiesDelegation: true,
    childInformedOfRights: true,
    emergencyDecisionsMade: [
      { id: "em-001", date: "2026-03-15T19:00:00Z", category: "emergency_medical", description: "A&E visit — suspected fracture after football", madeBy: "staff-rm-01", rationale: "Immediate medical attention required — wrist swelling", laNotified: true, laNotifiedDate: "2026-03-16T09:00:00Z", parentNotified: true, parentNotifiedDate: "2026-03-15T20:00:00Z", outcome: "Hairline fracture — cast fitted, follow-up in 4 weeks" },
    ],
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    homeId: "home-oak",
    placingAuthority: "Boroughton MBC",
    socialWorkerName: "Marcus Williams",
    delegatedAuthority: [
      makeDelegation("routine_medical", "home_decides"),
      makeDelegation("dental", "home_decides"),
      makeDelegation("haircut", "home_decides"),
      makeDelegation("leisure_activities", "home_decides"),
      makeDelegation("clothing_choices", "home_decides"),
      makeDelegation("pocket_money_amounts", "home_decides"),
      makeDelegation("emergency_medical", "home_decides"),
      makeDelegation("overnight_stays", "home_with_notification", "Only pre-approved friends — max 1 night"),
      makeDelegation("school_trips", "home_with_notification"),
      makeDelegation("social_media", "la_consent_required", "Risk assessment required — online safety concerns"),
      makeDelegation("mobile_phone", "home_with_notification"),
      makeDelegation("specialist_medical", "la_consent_required"),
      makeDelegation("vaccinations", "la_consent_required", "Parent consent not available — s.20"),
      makeDelegation("travel_international", "la_consent_required"),
      makeDelegation("education_decisions", "la_consent_required"),
      makeDelegation("contact_arrangements", "la_consent_required"),
      makeDelegation("photographs_media", "la_consent_required"),
      makeDelegation("ear_piercing", "la_consent_required"),
      makeDelegation("travel_domestic", "home_with_notification"),
      makeDelegation("diet_changes", "home_decides"),
      makeDelegation("religious_observance", "home_decides"),
      makeDelegation("relationships_dating", "home_with_notification"),
    ],
    scheduleAgreedDate: "2026-02-01T10:00:00Z",
    scheduleLastReviewDate: "2026-02-01T10:00:00Z",
    scheduleNextReviewDate: "2026-08-01T10:00:00Z",
    consentRecords: [
      { id: "con-004", childId: "child-jordan", category: "specialist_medical", description: "CAMHS initial assessment", requestedDate: "2026-04-01T10:00:00Z", requestedBy: "staff-rm-02", consentFrom: "Boroughton MBC (SW)", consentStatus: "granted", responseDate: "2026-04-05T10:00:00Z", evidenceHeld: true, childInformed: true },
      { id: "con-005", childId: "child-jordan", category: "photographs_media", description: "Sports day photos for website", requestedDate: "2026-05-05T10:00:00Z", requestedBy: "staff-rm-01", consentFrom: "Boroughton MBC (SW)", consentStatus: "pending", evidenceHeld: false, childInformed: true },
    ],
    placementPlanSpecifiesDelegation: true,
    childInformedOfRights: true,
    emergencyDecisionsMade: [],
  },
  {
    childId: "child-morgan",
    childName: "Morgan",
    homeId: "home-oak",
    placingAuthority: "Anyshire County Council",
    socialWorkerName: "Jane Smith",
    delegatedAuthority: [
      makeDelegation("routine_medical", "home_decides"),
      makeDelegation("dental", "home_decides"),
      makeDelegation("haircut", "home_decides"),
      makeDelegation("leisure_activities", "home_decides"),
      makeDelegation("clothing_choices", "home_decides"),
      makeDelegation("pocket_money_amounts", "home_decides"),
      makeDelegation("emergency_medical", "home_decides"),
      makeDelegation("overnight_stays", "home_decides"),
      makeDelegation("school_trips", "home_decides"),
      makeDelegation("social_media", "home_with_notification"),
      makeDelegation("mobile_phone", "home_decides"),
      makeDelegation("specialist_medical", "la_consent_required"),
      makeDelegation("vaccinations", "parent_consent_required"),
      makeDelegation("travel_international", "la_consent_required"),
      makeDelegation("education_decisions", "la_consent_required"),
      makeDelegation("contact_arrangements", "la_consent_required"),
      makeDelegation("photographs_media", "parent_consent_required"),
      makeDelegation("ear_piercing", "home_with_notification"),
      makeDelegation("travel_domestic", "home_decides"),
      makeDelegation("diet_changes", "home_decides"),
      makeDelegation("religious_observance", "home_decides"),
      makeDelegation("relationships_dating", "home_with_notification"),
    ],
    scheduleAgreedDate: "2025-11-20T10:00:00Z",
    scheduleLastReviewDate: "2025-11-20T10:00:00Z",
    scheduleNextReviewDate: "2026-05-20T10:00:00Z",
    consentRecords: [
      { id: "con-006", childId: "child-morgan", category: "travel_international", description: "School trip to France — July 2026", requestedDate: "2026-04-15T10:00:00Z", requestedBy: "staff-rm-01", consentFrom: "Anyshire CC (SW)", consentStatus: "granted", responseDate: "2026-04-28T10:00:00Z", expiryDate: "2026-08-01T00:00:00Z", evidenceHeld: true, childInformed: true },
      { id: "con-007", childId: "child-morgan", category: "vaccinations", description: "HPV vaccination (school programme)", requestedDate: "2026-03-01T10:00:00Z", requestedBy: "staff-rm-02", consentFrom: "Parent (Father)", consentStatus: "granted", responseDate: "2026-03-10T10:00:00Z", evidenceHeld: true, childInformed: true },
    ],
    placementPlanSpecifiesDelegation: true,
    childInformedOfRights: true,
    emergencyDecisionsMade: [],
  },
  {
    childId: "child-sam",
    childName: "Sam",
    homeId: "home-oak",
    placingAuthority: "Crestfield Borough Council",
    socialWorkerName: "Linda Okafor",
    delegatedAuthority: [
      makeDelegation("routine_medical", "home_decides"),
      makeDelegation("dental", "home_decides"),
      makeDelegation("haircut", "home_decides"),
      makeDelegation("leisure_activities", "home_decides"),
      makeDelegation("clothing_choices", "home_decides"),
      makeDelegation("pocket_money_amounts", "home_decides"),
      makeDelegation("emergency_medical", "home_decides"),
      makeDelegation("overnight_stays", "la_consent_required", "No unsupervised overnight stays — safety plan"),
      makeDelegation("school_trips", "home_with_notification"),
      makeDelegation("social_media", "la_consent_required", "CSE risk — supervised access only"),
      makeDelegation("mobile_phone", "la_consent_required", "Monitored device only"),
      makeDelegation("specialist_medical", "la_consent_required"),
      makeDelegation("vaccinations", "la_consent_required"),
      makeDelegation("travel_international", "court_order_required"),
      makeDelegation("education_decisions", "la_consent_required"),
      makeDelegation("contact_arrangements", "court_order_required"),
      makeDelegation("photographs_media", "la_consent_required"),
    ],
    scheduleAgreedDate: "2026-03-01T10:00:00Z",
    scheduleLastReviewDate: "2026-03-01T10:00:00Z",
    scheduleNextReviewDate: "2026-09-01T10:00:00Z",
    consentRecords: [
      { id: "con-008", childId: "child-sam", category: "specialist_medical", description: "Therapeutic assessment — trauma therapy", requestedDate: "2026-04-10T10:00:00Z", requestedBy: "staff-rm-02", consentFrom: "Crestfield BC (SW)", consentStatus: "granted", responseDate: "2026-04-15T10:00:00Z", evidenceHeld: true, childInformed: true },
      { id: "con-009", childId: "child-sam", category: "overnight_stays", description: "Approved sleepover at friend Kai's house", requestedDate: "2026-05-12T10:00:00Z", requestedBy: "staff-rm-01", consentFrom: "Crestfield BC (SW)", consentStatus: "pending", evidenceHeld: false, childInformed: true },
    ],
    placementPlanSpecifiesDelegation: true,
    childInformedOfRights: true,
    emergencyDecisionsMade: [
      { id: "em-002", date: "2026-04-20T23:00:00Z", category: "emergency_medical", description: "999 call — breathing difficulty/panic attack", madeBy: "staff-rm-02", rationale: "Child in acute distress, difficulty breathing — ambulance called", laNotified: true, laNotifiedDate: "2026-04-21T09:00:00Z", parentNotified: false, parentNotifiedDate: undefined, outcome: "Assessed at hospital — panic attack, discharged same night" },
    ],
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
    const metrics = calculateHomeDelegatedAuthorityMetrics(homeProfiles, homeId, NOW);
    const childResults = homeProfiles.map(p => evaluateDelegatedAuthorityCompliance(p, NOW));
    return NextResponse.json({ metrics, childResults, profiles: homeProfiles });
  }

  if (mode === "child" && childId) {
    const profile = DEMO_PROFILES.find(p => p.childId === childId);
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    return NextResponse.json({ result, profile });
  }

  if (mode === "metrics") {
    const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
    const metrics = calculateHomeDelegatedAuthorityMetrics(homeProfiles, homeId, NOW);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "evaluate") {
    const profile = body.profile as ChildDelegatedAuthorityProfile;
    if (!profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 });
    }
    const result = evaluateDelegatedAuthorityCompliance(profile, body.now ?? NOW);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const profiles = body.profiles as ChildDelegatedAuthorityProfile[];
    const homeId = body.homeId as string;
    if (!profiles || !homeId) {
      return NextResponse.json({ error: "Missing profiles or homeId" }, { status: 400 });
    }
    const metrics = calculateHomeDelegatedAuthorityMetrics(profiles, homeId, body.now ?? NOW);
    return NextResponse.json(metrics);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
