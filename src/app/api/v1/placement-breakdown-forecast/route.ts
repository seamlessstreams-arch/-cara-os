// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT BREAKDOWN FORECAST API ROUTE
// GET /api/v1/placement-breakdown-forecast
//
// Forward-looking early-warning intelligence: for each child currently in
// placement, projects breakdown risk, the trajectory (escalating / stable /
// improving), and an indicative days-to-critical horizon — synthesised from
// incidents, missing episodes, restraints, sanctions, behaviour, education and
// key-working engagement.
//
// CHR 2015 Reg 11 (positive relationships / placement stability), Reg 12, Reg 8,
// Reg 13/14. SCCIF: "Overall experiences and progress of children" — stability.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePlacementBreakdownForecast,
  type ChildInput,
  type IncidentInput,
  type MissingInput,
  type RestraintInput,
  type SanctionInput,
  type BehaviourInput,
  type EducationInput,
  type KeyworkingInput,
} from "@/lib/placement-breakdown-forecast/placement-breakdown-forecast-engine";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const store = getStore();

  // ── Current placements only — a breakdown forecast is meaningless for
  //    ended or not-yet-started placements ─────────────────────────────────
  const children: ChildInput[] = ((store.youngPeople ?? []) as any[])
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
      date_of_birth: d(yp.date_of_birth),
      placement_start: d(yp.placement_start),
      placement_type: yp.placement_type ?? "unknown",
      risk_flags: Array.isArray(yp.risk_flags) ? yp.risk_flags : [],
    }));

  const incidents: IncidentInput[] = ((store.incidents ?? []) as any[]).map((i: any) => ({
    child_id: i.child_id ?? "",
    date: d(i.date ?? i.created_at),
    severity: i.severity ?? "low",
  }));

  const missingEpisodes: MissingInput[] = ((store.missingEpisodes ?? []) as any[]).map((m: any) => ({
    child_id: m.child_id ?? "",
    date_missing: d(m.date_missing ?? m.created_at),
    risk_level: m.risk_level ?? "low",
    return_interview_completed: !!m.return_interview_completed,
  }));

  const restraints: RestraintInput[] = ((store.restraints ?? []) as any[]).map((r: any) => ({
    child_id: r.child_id ?? "",
    date: d(r.date ?? r.created_at),
  }));

  const sanctions: SanctionInput[] = ((store.sanctionRewards ?? []) as any[]).map((s: any) => ({
    child_id: s.child_id ?? "",
    date: d(s.date ?? s.created_at),
    direction: s.direction ?? "sanction",
    proportionate: s.proportionate !== false,
  }));

  const behaviour: BehaviourInput[] = ((store.behaviourLog ?? []) as any[]).map((b: any) => ({
    child_id: b.child_id ?? "",
    date: d(b.date ?? b.created_at),
    direction: b.direction ?? "concern",
    intensity: b.intensity ?? "low",
  }));

  const education: EducationInput[] = ((store.educationRecords ?? []) as any[]).map((e: any) => ({
    child_id: e.child_id ?? "",
    date: d(e.date ?? e.created_at),
    attendance_status: e.attendance_status ?? null,
  }));

  const keyworking: KeyworkingInput[] = ((store.keyWorkingSessions ?? []) as any[]).map((k: any) => ({
    child_id: k.child_id ?? "",
    date: d(k.date ?? k.created_at),
    mood_before: typeof k.mood_before === "number" ? k.mood_before : 3,
    mood_after: typeof k.mood_after === "number" ? k.mood_after : 3,
  }));

  const result = computePlacementBreakdownForecast({
    children,
    incidents,
    missingEpisodes,
    restraints,
    sanctions,
    behaviour,
    education,
    keyworking,
  });

  return NextResponse.json({ data: result });
}
