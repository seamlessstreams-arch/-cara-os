// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE LANGUAGE AUDIT
// GET /api/v1/care-language-audit
//
// Batch-scans historical incident records, behaviour logs, and daily logs for
// language patterns that can pathologise, criminalise, or moralise — language
// that frames children as problems rather than communicating unmet needs.
//
// Distinct from the Writing Assistant (real-time, per-record) — this audits
// the entire archive, shows trends, and identifies development priorities.
//
// Grounded in the PACE Model and 21 Skills KB frameworks.
// All deterministic. No LLM calls.
//
// Compute lives in a pure, importable builder so other modules can reuse it and
// it is unit-testable in isolation — see src/lib/care-language-audit.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { buildCareLanguageAudit } from "@/lib/care-language-audit/care-language-audit-engine";

export async function GET() {
  const [behaviourLog, dailyLog, incidents, staff, youngPeople] = await Promise.all([dal.behaviourLog.findAll(), dal.dailyLog.findAll(), dal.incidents.findAll(), dal.staff.findAll(), dal.youngPeople.findAll()]);
  return NextResponse.json({ data: buildCareLanguageAudit({ behaviourLog, dailyLog, incidents, staff, youngPeople }) });
}
