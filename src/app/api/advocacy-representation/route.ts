// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Advocacy & Representation Intelligence API Route
//
// GET  → returns Chamberlain House demo advocacy & representation intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateAdvocacyRepresentationIntelligence } from "@/lib/advocacy-representation/advocacy-representation-engine";
import type {
  AdvocacyReferral,
  IndependentVisitor,
  AdvocacyAwareness,
  AdvocacyPolicy,
  ChildParentalContact,
} from "@/lib/advocacy-representation/advocacy-representation-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};

function getDemoData() {
  // Alex: active advocate for care plan dispute
  const referrals: AdvocacyReferral[] = [
    {
      id: "ref-01", childId: "alex", childName: "Alex",
      type: "independent_advocate", reason: "care_plan_disagreement",
      referralDate: "2025-03-01", responseDate: "2025-03-03",
      status: "active", outcome: "Ongoing support with care plan dispute",
      childSatisfaction: 8,
    },
    {
      id: "ref-02", childId: "alex", childName: "Alex",
      type: "legal_representative", reason: "review_support",
      referralDate: "2025-04-01", responseDate: "2025-04-02",
      status: "ended", outcome: "Review completed successfully",
      childSatisfaction: 9,
    },
    {
      id: "ref-03", childId: "jordan", childName: "Jordan",
      type: "independent_advocate", reason: "general_support",
      referralDate: "2025-02-15", responseDate: "2025-02-16",
      status: "declined_by_child", childSatisfaction: 7,
    },
    {
      id: "ref-04", childId: "morgan", childName: "Morgan",
      type: "childrens_commissioner", reason: "complaint",
      referralDate: "2025-01-10", responseDate: "2025-01-20",
      status: "ended", outcome: "Complaint resolved satisfactorily",
      childSatisfaction: 6,
    },
  ];

  // Jordan: Independent Visitor, no advocacy needed
  const visitors: IndependentVisitor[] = [
    {
      id: "iv-01", childId: "jordan", childName: "Jordan",
      visitorName: "Sarah Thompson", appointedDate: "2024-09-01",
      visitFrequency: "monthly", lastVisitDate: "2025-04-15",
      visitsCompleted: 7, visitsMissed: 1,
      childEngagement: 8,
      childWishes: "Wants to continue visits and go to the park more",
    },
  ];

  const awareness: AdvocacyAwareness[] = [
    {
      id: "aw-01", childId: "alex", childName: "Alex",
      understandsRights: true, informedOfAdvocacy: true,
      knowsHowToAccess: true, dateInformed: "2025-02-01",
      format: "verbal",
    },
    {
      id: "aw-02", childId: "jordan", childName: "Jordan",
      understandsRights: true, informedOfAdvocacy: true,
      knowsHowToAccess: true, dateInformed: "2025-02-15",
      format: "written",
    },
    {
      id: "aw-03", childId: "morgan", childName: "Morgan",
      understandsRights: false, informedOfAdvocacy: false,
      knowsHowToAccess: false, dateInformed: "2025-01-10",
      format: "easy_read",
    },
  ];

  const policy: AdvocacyPolicy = {
    lastReviewed: "2025-01-15",
    advocacyProvider: "National Youth Advocacy Service (NYAS)",
    contractInPlace: true,
    complaintsProcess: true,
  };

  // Morgan: declined advocacy, needs IV but doesn't have one
  const parentalContact: ChildParentalContact[] = [
    { childId: "alex", childName: "Alex", hasParentalContact: true },
    { childId: "jordan", childName: "Jordan", hasParentalContact: false },
    { childId: "morgan", childName: "Morgan", hasParentalContact: false },
  ];

  return { referrals, visitors, awareness, policy, parentalContact };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { referrals, visitors, awareness, policy, parentalContact } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const result = generateAdvocacyRepresentationIntelligence(
      referrals, visitors, awareness, policy, parentalContact,
      CHILD_IDS, CHILD_NAMES,
      "oak-house", "2025-01-01", "2025-06-30", referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate advocacy & representation intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      referrals, visitors, awareness, policy, parentalContact,
      childIds, childNames, homeId, periodStart, periodEnd, referenceDate,
    } = body;

    if (
      !referrals || !visitors || !awareness || !policy || !parentalContact ||
      !childIds || !childNames || !homeId || !periodStart || !periodEnd || !referenceDate
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: referrals, visitors, awareness, policy, parentalContact, childIds, childNames, homeId, periodStart, periodEnd, referenceDate",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(referrals) || !Array.isArray(visitors) ||
      !Array.isArray(awareness) || !Array.isArray(parentalContact) ||
      !Array.isArray(childIds)
    ) {
      return NextResponse.json(
        { error: "referrals, visitors, awareness, parentalContact, and childIds must be arrays" },
        { status: 400 },
      );
    }

    if (typeof policy !== "object" || policy === null) {
      return NextResponse.json(
        { error: "policy must be an object" },
        { status: 400 },
      );
    }

    const result = generateAdvocacyRepresentationIntelligence(
      referrals, visitors, awareness, policy, parentalContact,
      childIds, childNames, homeId, periodStart, periodEnd, referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process advocacy & representation data", details: String(error) },
      { status: 500 },
    );
  }
}
