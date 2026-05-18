// ══════════════════════════════════════════════════════════════════════════════
// API: /api/escalation-intelligence
//
// Escalation & Threshold Decision Intelligence
//
// GET  — Returns escalation metrics with demo concern data
// POST — Accepts custom concern/escalation data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateEscalationMetrics,
  getConcernCategoryLabel,
  getThresholdLevelLabel,
  getOutcomeLabel,
} from "@/lib/escalation-intelligence";
import type {
  ConcernRecord,
  EscalationRecord,
} from "@/lib/escalation-intelligence";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData(): {
  concerns: ConcernRecord[];
  escalations: EscalationRecord[];
} {
  const concerns: ConcernRecord[] = [
    {
      id: "concern-001",
      date: "2026-05-03",
      time: "16:30",
      category: "safeguarding",
      severity: 3,
      childId: "child-alex",
      childName: "Alex",
      raisedBy: "Sarah Johnson",
      description: "Alex disclosed historical abuse during key work session",
      contextFactors: ["verbal_disclosure", "trusted_adult", "calm_setting"],
      previousOccurrences: 0,
      immediateRiskPresent: false,
    },
    {
      id: "concern-002",
      date: "2026-05-07",
      time: "21:45",
      category: "missing",
      severity: 3,
      childId: "child-jordan",
      childName: "Jordan",
      raisedBy: "Tom Watson",
      description: "Jordan left the home without permission after contact with birth family",
      contextFactors: ["post_contact", "emotional_distress", "evening"],
      previousOccurrences: 2,
      immediateRiskPresent: true,
    },
    {
      id: "concern-003",
      date: "2026-05-12",
      time: "08:15",
      category: "staff_allegation",
      severity: 3,
      childId: "child-morgan",
      childName: "Morgan",
      raisedBy: "Lisa Williams",
      description: "Morgan reported feeling uncomfortable during personal care support",
      contextFactors: ["child_report", "personal_care", "boundary_concern"],
      previousOccurrences: 0,
      immediateRiskPresent: false,
    },
    {
      id: "concern-004",
      date: "2026-05-15",
      time: "19:00",
      category: "self_harm",
      severity: 2,
      childId: "child-morgan",
      childName: "Morgan",
      raisedBy: "Mike Chen",
      description: "Superficial scratches noticed on Morgan's forearm during evening routine",
      contextFactors: ["peer_conflict", "anxiety", "evening"],
      previousOccurrences: 1,
      immediateRiskPresent: false,
    },
  ];

  const escalations: EscalationRecord[] = [
    // Concern 001: Safeguarding — all escalations made promptly
    { id: "esc-001a", concernId: "concern-001", escalatedTo: "internal_manager", escalatedBy: "Sarah Johnson", escalatedAt: "2026-05-03T16:35:00", method: "in_person", responseReceived: true, responseTime: "2026-05-03T16:40:00" },
    { id: "esc-001b", concernId: "concern-001", escalatedTo: "registered_manager", escalatedBy: "Sarah Johnson", escalatedAt: "2026-05-03T16:40:00", method: "phone", responseReceived: true, responseTime: "2026-05-03T16:55:00", referenceNumber: "RM-2026-034" },
    { id: "esc-001c", concernId: "concern-001", escalatedTo: "local_authority_mash", escalatedBy: "Darren Laville", escalatedAt: "2026-05-03T17:15:00", method: "portal", responseReceived: true, responseTime: "2026-05-04T09:30:00", referenceNumber: "MASH-2026-1247" },

    // Concern 002: Missing — police and placing authority notified
    { id: "esc-002a", concernId: "concern-002", escalatedTo: "internal_manager", escalatedBy: "Tom Watson", escalatedAt: "2026-05-07T21:50:00", method: "phone", responseReceived: true, responseTime: "2026-05-07T21:55:00" },
    { id: "esc-002b", concernId: "concern-002", escalatedTo: "police", escalatedBy: "Tom Watson", escalatedAt: "2026-05-07T22:00:00", method: "phone", responseReceived: true, responseTime: "2026-05-07T22:15:00", referenceNumber: "POL-2026-8834" },
    { id: "esc-002c", concernId: "concern-002", escalatedTo: "placing_authority", escalatedBy: "Darren Laville", escalatedAt: "2026-05-08T08:00:00", method: "email", responseReceived: true, responseTime: "2026-05-08T10:30:00" },
    // Missing: registered_manager notification

    // Concern 003: Staff allegation — RM and RI notified but LADO and Ofsted missing
    { id: "esc-003a", concernId: "concern-003", escalatedTo: "registered_manager", escalatedBy: "Lisa Williams", escalatedAt: "2026-05-12T08:20:00", method: "in_person", responseReceived: true, responseTime: "2026-05-12T08:25:00" },
    { id: "esc-003b", concernId: "concern-003", escalatedTo: "responsible_individual", escalatedBy: "Darren Laville", escalatedAt: "2026-05-12T08:45:00", method: "phone", responseReceived: true, responseTime: "2026-05-12T09:00:00" },
    // Missing: LADO, Ofsted

    // Concern 004: Self-harm — only internal manager notified
    { id: "esc-004a", concernId: "concern-004", escalatedTo: "internal_manager", escalatedBy: "Mike Chen", escalatedAt: "2026-05-15T19:05:00", method: "in_person", responseReceived: true, responseTime: "2026-05-15T19:10:00" },
  ];

  return { concerns, escalations };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { concerns, escalations } = generateDemoData();
  const result = generateEscalationMetrics(
    concerns,
    escalations,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
    "2026-05-18T17:00:00",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        concernSummary: concerns.map((c) => ({
          id: c.id,
          date: c.date,
          category: getConcernCategoryLabel(c.category),
          severity: c.severity,
          childName: c.childName,
        })),
        assessmentSummary: result.assessments.map((a) => ({
          concernId: a.concernId,
          level: getThresholdLevelLabel(a.determinedLevel),
          outcome: getOutcomeLabel(a.outcome),
          missingCount: a.missingEscalations.length,
        })),
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

  const { concerns, escalations, homeId, periodStart, periodEnd, currentDate } = body as {
    concerns?: ConcernRecord[];
    escalations?: EscalationRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    currentDate?: string;
  };

  if (!concerns || !Array.isArray(concerns)) {
    return NextResponse.json({ error: "concerns array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateEscalationMetrics(
    concerns,
    escalations ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    currentDate ?? new Date().toISOString(),
  );

  return NextResponse.json({ data: result });
}
