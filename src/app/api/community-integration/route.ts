// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Community Integration Intelligence API Route
//
// GET  → returns Oak House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateCommunityIntegrationIntelligence } from "@/lib/community-integration/community-integration-engine";
import type { CommunityConnection, IntegrationGoal, ChildProfile } from "@/lib/community-integration/community-integration-engine";

// ── Oak House Demo Data ──────────────────────────────────────────────────────

function getDemoData(): {
  connections: CommunityConnection[];
  goals: IntegrationGoal[];
  children: ChildProfile[];
} {
  const children: ChildProfile[] = [
    { childId: "child-alex", childName: "Alex", age: 14, placementStartDate: "2024-06-01" },
    { childId: "child-jordan", childName: "Jordan", age: 13, placementStartDate: "2024-09-15" },
    { childId: "child-morgan", childName: "Morgan", age: 15, placementStartDate: "2024-03-01" },
  ];

  const connections: CommunityConnection[] = [
    // Alex — 3 active, 1 ended
    { id: "conn-a01", childId: "child-alex", childName: "Alex", connectionType: "club_sport", connectionName: "Oakwood Football Club", status: "active", engagementLevel: "high", startDate: "2024-09-01", frequencyPerWeek: 2, staffFacilitated: false, isChildLed: true, barriers: [] },
    { id: "conn-a02", childId: "child-alex", childName: "Alex", connectionType: "education", connectionName: "Year 10 at Meadow School", status: "active", engagementLevel: "moderate", startDate: "2024-09-05", frequencyPerWeek: 5, staffFacilitated: false, isChildLed: false, barriers: [] },
    { id: "conn-a03", childId: "child-alex", childName: "Alex", connectionType: "hobby_activity", connectionName: "Art Club at Community Centre", status: "active", engagementLevel: "moderate", startDate: "2025-01-15", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: true, barriers: [] },
    { id: "conn-a04", childId: "child-alex", childName: "Alex", connectionType: "club_sport", connectionName: "Swimming Lessons", status: "ended", engagementLevel: "low", startDate: "2024-07-01", endDate: "2024-11-30", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: false, barriers: ["anxiety"], notes: "Alex became anxious in group swimming sessions — ended by mutual agreement" },

    // Jordan — 2 active, 1 planned
    { id: "conn-j01", childId: "child-jordan", childName: "Jordan", connectionType: "education", connectionName: "Year 9 at Riverside Academy", status: "active", engagementLevel: "low", startDate: "2024-09-15", frequencyPerWeek: 5, staffFacilitated: false, isChildLed: false, barriers: ["peer_conflict"] },
    { id: "conn-j02", childId: "child-jordan", childName: "Jordan", connectionType: "hobby_activity", connectionName: "Gaming Club", status: "active", engagementLevel: "high", startDate: "2025-02-01", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: true, barriers: [] },
    { id: "conn-j03", childId: "child-jordan", childName: "Jordan", connectionType: "faith_community", connectionName: "Local Youth Group", status: "planned", engagementLevel: "moderate", startDate: "2025-07-01", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: false, barriers: ["anxiety"], notes: "Jordan expressed interest but anxious about attending alone" },

    // Morgan — 4 active, 1 paused
    { id: "conn-m01", childId: "child-morgan", childName: "Morgan", connectionType: "education", connectionName: "Year 11 at Meadow School", status: "active", engagementLevel: "high", startDate: "2024-09-05", frequencyPerWeek: 5, staffFacilitated: false, isChildLed: false, barriers: [] },
    { id: "conn-m02", childId: "child-morgan", childName: "Morgan", connectionType: "hobby_activity", connectionName: "Drama Club", status: "active", engagementLevel: "high", startDate: "2024-10-01", frequencyPerWeek: 2, staffFacilitated: false, isChildLed: true, barriers: [] },
    { id: "conn-m03", childId: "child-morgan", childName: "Morgan", connectionType: "volunteering", connectionName: "Charity Shop Volunteer", status: "active", engagementLevel: "moderate", startDate: "2025-03-01", frequencyPerWeek: 0.5, staffFacilitated: true, isChildLed: true, barriers: [] },
    { id: "conn-m04", childId: "child-morgan", childName: "Morgan", connectionType: "therapy", connectionName: "Weekly Therapy Sessions", status: "active", engagementLevel: "high", startDate: "2024-04-01", frequencyPerWeek: 1, staffFacilitated: true, isChildLed: false, barriers: [] },
    { id: "conn-m05", childId: "child-morgan", childName: "Morgan", connectionType: "friendship", connectionName: "Friendship with Sam (school friend)", status: "paused", engagementLevel: "moderate", startDate: "2024-05-01", frequencyPerWeek: 0, staffFacilitated: false, isChildLed: true, barriers: ["placement_instability"], notes: "Contact reduced after Sam's family moved" },
  ];

  const goals: IntegrationGoal[] = [
    { id: "goal-a01", childId: "child-alex", childName: "Alex", goalDescription: "Join a second community activity", targetConnectionType: "hobby_activity", targetDate: "2025-03-01", status: "in_progress" },
    { id: "goal-j01", childId: "child-jordan", childName: "Jordan", goalDescription: "Improve school engagement", targetConnectionType: "education", targetDate: "2025-04-01", status: "in_progress" },
    { id: "goal-j02", childId: "child-jordan", childName: "Jordan", goalDescription: "Join a physical activity", targetConnectionType: "club_sport", targetDate: "2025-06-01", status: "not_started" },
    { id: "goal-m01", childId: "child-morgan", childName: "Morgan", goalDescription: "Maintain volunteering commitment", targetConnectionType: "volunteering", targetDate: "2025-01-15", status: "achieved", achievedDate: "2025-01-10" },
  ];

  return { connections, goals, children };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { connections, goals, children } = getDemoData();
    const result = generateCommunityIntegrationIntelligence(
      connections, goals, children,
      "oak-house",
      "2025-01-01",
      "2025-12-31",
      new Date().toISOString().split("T")[0],
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate community integration intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { connections, goals, children, homeId, periodStart, periodEnd, referenceDate } = body;

    if (!connections || !goals || !children || !homeId || !periodStart || !periodEnd || !referenceDate) {
      return NextResponse.json(
        { error: "Missing required fields: connections, goals, children, homeId, periodStart, periodEnd, referenceDate" },
        { status: 400 },
      );
    }

    if (!Array.isArray(connections) || !Array.isArray(goals) || !Array.isArray(children)) {
      return NextResponse.json(
        { error: "connections, goals, and children must be arrays" },
        { status: 400 },
      );
    }

    const result = generateCommunityIntegrationIntelligence(
      connections, goals, children,
      homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process community integration data", details: String(error) },
      { status: 500 },
    );
  }
}
