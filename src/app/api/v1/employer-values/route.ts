// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMPLOYER VALUES PROFILE API
// GET  /api/v1/employer-values  → the home's values profile (for matching)
// PUT  /api/v1/employer-values  → save edits (in-memory; dual-mode ready)
//
// The values profile defines what the home stands for — used by the values-based
// matching engine to SUPPORT (never replace) human recruitment judgement.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";
import { readJsonBody } from "@/lib/http/read-json";

const EDITABLE: (keyof EmployerValuesProfile)[] = [
  "organisation_name", "home_name", "core_values", "care_approach", "leadership_style",
  "therapeutic_model", "pace_commitment", "trauma_informed_expectations", "safeguarding_culture",
  "expected_behaviours", "non_negotiables", "what_makes_us_different", "relational_practice_priority",
];

export async function GET() {
  const list = (await dal.employerValuesProfiles.findAll()) ?? [];
  const profile = list[0] ?? null;
  return NextResponse.json({ data: profile });
}

export async function PUT(req: Request) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const list: EmployerValuesProfile[] = ((await dal.employerValuesProfiles.findAll()) ?? []) as EmployerValuesProfile[];
  const existing = list[0];

  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) patch[k] = (body as Record<string, unknown>)[k];

  const updated = {
    ...(existing ?? {}),
    ...patch,
    id: existing?.id ?? "evp_oak",
    home_id: existing?.home_id ?? "home_oak",
    updated_at: new Date().toISOString(),
  } as EmployerValuesProfile;

  await dal.employerValuesProfiles.upsert(updated);
  return NextResponse.json({ data: updated });
}
