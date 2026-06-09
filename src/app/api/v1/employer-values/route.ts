// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMPLOYER VALUES PROFILE API
// GET  /api/v1/employer-values  → the home's values profile (for matching)
// PUT  /api/v1/employer-values  → save edits (in-memory; dual-mode ready)
//
// The values profile defines what the home stands for — used by the values-based
// matching engine to SUPPORT (never replace) human recruitment judgement.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";

const EDITABLE: (keyof EmployerValuesProfile)[] = [
  "organisation_name", "home_name", "core_values", "care_approach", "leadership_style",
  "therapeutic_model", "pace_commitment", "trauma_informed_expectations", "safeguarding_culture",
  "expected_behaviours", "non_negotiables", "what_makes_us_different", "relational_practice_priority",
];

export async function GET() {
  const store = getStore() as any;
  const profile = (store.employerValuesProfiles ?? [])[0] ?? null;
  return NextResponse.json({ data: profile });
}

export async function PUT(req: Request) {
  const store = getStore() as any;
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const list: EmployerValuesProfile[] = store.employerValuesProfiles ?? [];
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

  if (existing) list[0] = updated; else list.push(updated);
  store.employerValuesProfiles = list;
  return NextResponse.json({ data: updated });
}
