// ══════════════════════════════════════════════════════════════════════════════
// CARA — Defensible Decision API (Reasoning Layer)
//
// POST → structure a decision into the 14-point defensible-decision record and
//        score how defensible it currently is (flagging the classic gaps).
// GET  → a deterministic worked example so the endpoint is curl-verifiable.
//
// Guarded by ADD_OVERSIGHT. Deterministic; no model calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import {
  buildDefensibleDecision,
  type DefensibleDecisionInput,
} from "@/lib/cara-reasoning/defensible-decision-engine";
import { recordDecision } from "@/lib/ethical-intelligence/capture-service";
import type { EthicalSourceRef } from "@/lib/ethical-intelligence/types";

export const dynamic = "force-dynamic";

const DEMO: DefensibleDecisionInput = {
  childName: "Jordan",
  decisionSummary: "Increase staffing to 2:1 during community time for two weeks",
  whatHappened: "Two unplanned missing episodes from community time in the last fortnight.",
  informationConsidered: ["Missing-from-care records", "Risk assessment", "Key-worker observations"],
  childView: "Jordan says they feel embarrassed being followed but understands the worry.",
  whatWeKnow: ["Both episodes began at the same location", "Jordan returned safely each time"],
  whatWeDoNotKnow: ["Who Jordan is meeting", "Whether peers are involved"],
  risks: ["Possible exploitation during absences"],
  strengths: ["Strong relationship with key worker", "Returns willingly when called"],
  optionsConsidered: ["Maintain current staffing", "Increase to 2:1 for community time", "Pause community time"],
  rationaleForChoice: "2:1 keeps Jordan's freedom while reducing risk during the highest-risk activity.",
  whyAlternativesRejected: "Pausing community time would be disproportionate and harm trust; current staffing has not been sufficient.",
  actionRequired: "Roster 2:1 for community time and review with Jordan weekly.",
  responsibleRole: "registered_manager",
  reviewDate: "2026-06-29",
  whatWouldChangeThisDecision: "Two settled weeks, or clarity that no exploitation risk exists, would allow a return to 1:1.",
  riskLevel: "high",
};

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;
  const today = new Date().toISOString().slice(0, 10);
  return NextResponse.json({ data: { example: true, input: DEMO, decision: buildDefensibleDecision(DEMO, today) } });
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  let body: Partial<DefensibleDecisionInput>;
  try {
    body = (await req.json()) as Partial<DefensibleDecisionInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.decisionSummary || !body.decisionSummary.trim()) {
    return NextResponse.json({ error: "decisionSummary is required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    const decision = buildDefensibleDecision(body as DefensibleDecisionInput, today);

    // Ethical Intelligence spine: when the caller anchors this decision to a
    // learning event, PERSIST it as the event's Decision stage (previously the
    // 14-point record was computed and discarded — untraceable). Refused unless
    // it cites source records; the decision maker must be a named human.
    let persisted: { eventId: string; decisionId: string } | { refused: string } | null = null;
    const persistTo = (body as { persistTo?: { eventId?: string; decisionMaker?: string; decisionMakerRole?: string; sourceRecords?: EthicalSourceRef[] } }).persistTo;
    if (persistTo?.eventId) {
      const result = recordDecision(persistTo.eventId, {
        decisionSummary: body.decisionSummary!,
        decisionMaker: persistTo.decisionMaker ?? "",
        decisionMakerRole: persistTo.decisionMakerRole,
        evidence: (body.informationConsidered ?? []).filter((s) => typeof s === "string" && s.trim().length > 0),
        defensibleDecision: decision,
        sourceRecords: persistTo.sourceRecords ?? [],
      });
      persisted = result.ok
        ? { eventId: persistTo.eventId, decisionId: result.value.id }
        : { refused: result.reason };
    }

    return NextResponse.json({ data: { decision, persisted } });
  } catch (error) {
    console.error("[api] server error:", error);
    return NextResponse.json({ error: "Failed to build defensible decision" }, { status: 500 });
  }
}
