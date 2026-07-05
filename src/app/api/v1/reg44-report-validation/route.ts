// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT VALIDATION & SIGN-OFF GATE API
// POST { draft, signOff? }
//   → { validation }               — the statutory hard-blocks + warnings.
//   → { validation, signOff }      — if signOff is supplied, the gate outcome
//                                     (a blocked report can't be approved without
//                                     a named override reason).
//
// The enforcement endpoint the Reg 44 report workflow calls before submission /
// sign-off. Pure engine; this route only parses + stamps the decision time.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { readJsonBody } from "@/lib/http/read-json";
import {
  validateReg44Report,
  applySignOffDecision,
  type Reg44ReportDraft,
  type SignOffDecision,
} from "@/lib/reg44-report-intelligence/report-validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const jb = await readJsonBody(req);
    if (!jb.ok) return jb.response;
    const body = jb.data as { draft?: Reg44ReportDraft; signOff?: { decision: SignOffDecision; decidedBy: string; overrideReason?: string } };

    if (!body?.draft || typeof body.draft !== "object") {
      return NextResponse.json({ error: "A report draft is required." }, { status: 400 });
    }

    const validation = validateReg44Report(body.draft);

    if (body.signOff) {
      const now = new Date().toISOString();
      const outcome = applySignOffDecision(body.draft, {
        decision: body.signOff.decision,
        decidedBy: String(body.signOff.decidedBy ?? ""),
        decidedAt: now,
        overrideReason: body.signOff.overrideReason,
      });
      if (!outcome.ok) {
        return NextResponse.json({ data: { validation, signOff: { ok: false, refusedReason: outcome.refusedReason } } }, { status: 422 });
      }
      return NextResponse.json({ data: { validation, signOff: { ok: true, signOff: outcome.draft!.signOff } } });
    }

    return NextResponse.json({ data: { validation } });
  } catch (error: unknown) {
    console.error("[api] reg44-report-validation error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
