// ══════════════════════════════════════════════════════════════════════════════
// CARA — SANCTIONS & REWARDS INTELLIGENCE API ROUTE
// GET /api/v1/sanctions-rewards-intelligence
// Returns behaviour management analysis: reward/sanction ratios,
// proportionality, per-child breakdown, and Cara behaviour intelligence.
// Reg 19 (behaviour management), Reg 35 (behaviour standards), SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeSanctionsRewardsIntelligence,
  type SanctionRewardInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/sanctions-rewards-intelligence-engine";

export async function GET() {
  const [sanctionRewardsList, staffList, youngPeopleList] = await Promise.all([
      dal.sanctionRewards.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);

  // ── Map sanction/reward entries ──────────────────────────────────────
  const entries: SanctionRewardInput[] = (sanctionRewardsList ?? []).map((e) => ({
    id: e.id,
    child_id: e.child_id,
    date: typeof e.date === "string" ? e.date.slice(0, 10) : e.date,
    time: e.time,
    direction: e.direction,
    reward_type: e.reward_type ?? null,
    sanction_type: e.sanction_type ?? null,
    // absence-ok: dead default — SanctionRewardRecord.proportionate is a required boolean (verified 2026-08-31), so the fallback is unreachable
    proportionate: e.proportionate ?? true,
    recorded_by: e.recorded_by,
    created_at: e.created_at,
  }));

  // ── Map young people ─────────────────────────────────────────────────
  const children: ChildRef[] = (youngPeopleList ?? []).map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  // ── Map staff ────────────────────────────────────────────────────────
  const staff: StaffRef[] = (staffList ?? [])
    .filter((s) => s.is_active)
    .map((s) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ───────────────────────────────────────────────────────
  const result = computeSanctionsRewardsIntelligence({ entries, children, staff });

  return NextResponse.json({ data: result });
}
