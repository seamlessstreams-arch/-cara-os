// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/shift-safety
//
// GET  — Check current shift safety for a home
// POST — Check safety for a provided shift context
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { checkShiftSafety, type ShiftContext } from "@/lib/cara/shift-safety";

// ── Demo context ────────────────────────────────────────────────────────────

function getDemoContext(): ShiftContext {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 20 * 86400000).toISOString().slice(0, 10);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);

  return {
    homeId: "home_oak",
    shiftType: now.getHours() < 14 ? "day" : now.getHours() < 22 ? "evening" : "waking_night",
    staffOnDuty: [
      {
        id: "staff_darren",
        name: "Olivia H",
        role: "senior",
        qualifications: ["medication", "restraint", "first_aid", "senior_on_duty"],
        hoursWorkedToday: 6,
        isKeyWorkerFor: ["child_jordan"],
      },
      {
        id: "staff_pat",
        name: "Pat M",
        role: "residential",
        qualifications: ["medication", "first_aid"],
        hoursWorkedToday: 4,
        isKeyWorkerFor: ["child_sam"],
      },
    ],
    childrenPresent: [
      {
        id: "child_jordan",
        name: "Jordan P",
        riskLevel: "high",
        needsPresent: ["medication", "bed_routine_support"],
        hasScheduledContact: true,
        behaviourSupportPlanActive: true,
        knownTriggers: ["family contact", "transitions", "Sunday evenings"],
      },
      {
        id: "child_sam",
        name: "Sam W",
        riskLevel: "medium",
        needsPresent: ["medication"],
        hasScheduledContact: false,
        behaviourSupportPlanActive: false,
        knownTriggers: ["phone calls with mum"],
      },
      {
        id: "child_alex",
        name: "Alex T",
        riskLevel: "low",
        needsPresent: [],
        hasScheduledContact: false,
        behaviourSupportPlanActive: false,
      },
    ],
    scheduledEvents: [
      { time: "15:00", type: "family_contact", childId: "child_jordan", description: "Phone call with mum" },
      { time: "16:30", type: "activity", description: "Cooking session — all children invited" },
      { time: "18:00", type: "medication", childId: "child_jordan", description: "Evening medication round" },
      { time: "18:00", type: "medication", childId: "child_sam", description: "Evening medication round" },
    ],
    lastHandoverComplete: true,
    lastFireDrill: twoWeeksAgo,
    lastEnvironmentCheck: threeDaysAgo,
    medicationsToAdminister: [
      { childId: "child_jordan", childName: "Jordan P", medicationName: "Melatonin 3mg", dueTime: "20:00", requiresTrainedStaff: true, isControlled: false },
      { childId: "child_sam", childName: "Sam W", medicationName: "Fluoxetine 20mg", dueTime: "18:00", requiresTrainedStaff: true, isControlled: false },
    ],
    openRisks: [
      { id: "risk_1", childId: "child_jordan", category: "aggression", level: "high", description: "Verbal and physical aggression following family contact", mitigations: ["PACE approach", "De-escalation", "Safe space available"] },
    ],
  };
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";

    // For now, always use demo context (live version would pull from rota + child records)
    const ctx = getDemoContext();
    ctx.homeId = homeId;

    const result = checkShiftSafety(ctx);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[cara/shift-safety] GET error:", err);
    return NextResponse.json({ error: "Failed to check shift safety" }, { status: 500 });
  }
}

// ── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const ctx = body as ShiftContext;

    if (!ctx.staffOnDuty || !ctx.childrenPresent) {
      return NextResponse.json({ error: "staffOnDuty and childrenPresent are required" }, { status: 400 });
    }

    const result = checkShiftSafety(ctx);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[cara/shift-safety] POST error:", err);
    return NextResponse.json({ error: "Failed to check shift safety" }, { status: 500 });
  }
}
