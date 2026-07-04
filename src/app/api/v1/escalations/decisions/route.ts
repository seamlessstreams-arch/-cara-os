// ══════════════════════════════════════════════════════════════════════════════
// CARA — Risk Escalation Decisions API (the 4-level suggest→confirm→log workflow)
//
// GET  → list escalation decisions (filter: childId / status), plus the four
//        level definitions so the UI renders actions/timeframes from one truth.
// POST → kind:"suggest" — Cara suggests a level from structured evidence
//        (any care staff; traceability enforced: ≥1 source record or 422);
//        kind:"decide"  — a NAMED manager confirms/amends/rejects (ADD_OVERSIGHT;
//        amend requires a different level + reason; reject requires a reason).
//
// The suggestion has no effect until the human decision is recorded.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { ESCALATION_LEVEL_DEFINITIONS } from "@/lib/risk-escalation/risk-escalation-engine";
import {
  createEscalationSuggestion,
  listEscalationDecisions,
  recordManagerDecision,
} from "@/lib/risk-escalation/decision-service";
import type { EscalationAgreement, EscalationLevel } from "@/lib/risk-escalation/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const data = listEscalationDecisions({
    childId: params.get("childId") ?? undefined,
    status: status === "awaiting_decision" || status === "decided" ? status : undefined,
  });
  return NextResponse.json({
    data,
    meta: { total: data.length },
    levels: ESCALATION_LEVEL_DEFINITIONS,
  });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const kind = typeof body.kind === "string" ? body.kind : "";

  if (kind === "suggest") {
    // Any care staff can raise an assessment.
    const auth = requirePermission(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
    if (auth instanceof NextResponse) return auth;

    const createdBy = str(body.actor) ?? auth.userId;
    const result = createEscalationSuggestion(createdBy, {
      childId: str(body.childId),
      childName: str(body.childName),
      summary: str(body.summary) ?? "",
      disclosureOfAbuse: bool(body.disclosureOfAbuse),
      immediateDanger: bool(body.immediateDanger),
      missingNow: bool(body.missingNow),
      whereaboutsUnknown: bool(body.whereaboutsUnknown),
      seriousAssault: bool(body.seriousAssault),
      significantHarmIndicators: bool(body.significantHarmIndicators),
      exploitationIndicators: bool(body.exploitationIndicators),
      persistentOrEscalating: bool(body.persistentOrEscalating),
      missingRisk: bool(body.missingRisk),
      patternDeveloping: bool(body.patternDeveloping),
      riskFactorsIncreasing: bool(body.riskFactorsIncreasing),
      presentationChanges: bool(body.presentationChanges),
      childCurrentlySafe: bool(body.childCurrentlySafe),
      recentIncidentCount30d: num(body.recentIncidentCount30d),
      notes: strArr(body.notes),
      sourceRecords: Array.isArray(body.sourceRecords) ? (body.sourceRecords as never[]) : [],
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json({ data: result.value }, { status: 201 });
  }

  if (kind === "decide") {
    // Deciding is manager work.
    const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
    if (auth instanceof NextResponse) return auth;

    const decisionId = str(body.decisionId);
    if (!decisionId) return NextResponse.json({ error: "decisionId is required" }, { status: 422 });

    const result = recordManagerDecision(decisionId, {
      decisionMaker: str(body.decisionMaker) ?? "",
      decisionMakerRole: str(body.decisionMakerRole) ?? auth.role,
      agreement: (str(body.agreement) ?? "") as EscalationAgreement,
      amendedLevel: str(body.amendedLevel) as EscalationLevel | undefined,
      reason: str(body.reason),
      evidenceUsed: strArr(body.evidenceUsed),
      ethicalEventId: str(body.ethicalEventId),
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json({ data: result.value }, { status: 201 });
  }

  return NextResponse.json(
    { error: `Unknown kind "${kind}". Expected suggest | decide.` },
    { status: 422 },
  );
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const bool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);
