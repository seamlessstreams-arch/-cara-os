// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ERROR TREND & REPEAT-PATTERN API ROUTE
// GET /api/v1/medication-error-trends
//
// Temporal + pattern intelligence over medication errors: trend direction/rate,
// repeat patterns (medication / child / error type / time of day), and
// learning-loop closure (recurrence despite recorded lessons, open remedial
// actions, incomplete duty of candour).
//
// CHR 2015 Reg 23 (medicines), Reg 13 (learning), Reg 40 (notifications).
// SCCIF: "How well children are helped and protected" — safe medicines & learning.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeMedicationErrorTrends,
  type MedErrorInput,
  type AdministrationInput,
} from "@/lib/medication-error-trends/medication-error-trends-engine";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const store = getStore();

  // Resolve child display names.
  const nameById = new Map<string, string>();
  for (const yp of (store.youngPeople ?? []) as any[]) {
    nameById.set(yp.id, yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id);
  }

  const errors: MedErrorInput[] = ((store.medicationErrors ?? []) as any[]).map((e: any) => ({
    id: e.id,
    child_id: e.child_id ?? "",
    child_name: nameById.get(e.child_id) ?? e.child_id ?? "Unknown",
    date_occurred: d(e.date_occurred ?? e.created_at),
    time_occurred: (e.time_occurred ?? "00:00").toString(),
    error_type: e.error_type ?? "documentation_error",
    severity: e.severity ?? "no_harm",
    medication: e.medication ?? "Unknown medication",
    lessons_learned: e.lessons_learned ?? "",
    remedial_actions: Array.isArray(e.remedial_actions)
      ? e.remedial_actions.map((a: any) => ({ status: a?.status ?? "pending" }))
      : [],
    duty_of_candour: !!e.duty_of_candour,
    duty_of_candour_completed: e.duty_of_candour_completed ?? null,
    status: e.status ?? "reported",
  }));

  const administrations: AdministrationInput[] = ((store.medicationAdministrations ?? []) as any[]).map((a: any) => ({
    date: d(a.scheduled_time ?? a.actual_time ?? a.created_at),
    status: a.status ?? "",
  }));

  const result = computeMedicationErrorTrends({ errors, administrations });

  return NextResponse.json({ data: result });
}
