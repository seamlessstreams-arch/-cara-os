// ══════════════════════════════════════════════════════════════════════════════
// API: /api/court-order-compliance
//
// Court Order Compliance Intelligence
//
// GET  — Returns court order compliance metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateCourtOrderComplianceIntelligence,
  generateDemoData,
  getOrderTypeLabel,
  getComplianceStatusLabel,
  getRatingLabel,
} from "@/lib/court-order-compliance";
import type {
  CourtOrder,
  OrderConditionReview,
  LegalMeeting,
  LegalTraining,
} from "@/lib/court-order-compliance";

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { orders, reviews, meetings, training } = generateDemoData();

  const result = generateCourtOrderComplianceIntelligence(
    orders,
    reviews,
    meetings,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        orderSummary: orders.map((o) => ({
          id: o.id,
          childName: o.childName,
          orderType: getOrderTypeLabel(o.orderType),
          isActive: o.isActive,
          conditionCount: o.conditions.length,
          complianceBreakdown: o.conditions.map((c) => ({
            type: c.conditionType,
            status: getComplianceStatusLabel(c.complianceStatus),
          })),
        })),
        ratingLabel: getRatingLabel(result.rating),
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
    orders,
    reviews,
    meetings,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    orders?: CourtOrder[];
    reviews?: OrderConditionReview[];
    meetings?: LegalMeeting[];
    training?: LegalTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateCourtOrderComplianceIntelligence(
    orders ?? [],
    reviews ?? [],
    meetings ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
