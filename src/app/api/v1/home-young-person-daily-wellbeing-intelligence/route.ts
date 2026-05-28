// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME YOUNG PERSON DAILY WELLBEING INTELLIGENCE API ROUTE
// GET /api/v1/home-young-person-daily-wellbeing-intelligence
// Synthesises child daily summaries, daily log entries, and behaviour logs
// to assess daily recording coverage, mood tracking, behaviour documentation,
// de-escalation practice, and child coverage equity.
// CHR 2015 Reg 12, 36, 5. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeYoungPersonDailyWellbeing,
  type DailySummaryInput,
  type DailyLogEntryInput,
  type BehaviourLogEntryInput,
} from "@/lib/engines/home-young-person-daily-wellbeing-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const youngPeople = (store.youngPeople ?? []) as any[];
    const total_children = youngPeople.length;

    // Child daily summaries
    const rawSummaries = (store.childDailySummaries ?? []) as any[];
    const summaries: DailySummaryInput[] = rawSummaries.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      date: (s.summary_date ?? today).toString().slice(0, 10),
      event_count: s.event_count ?? 0,
      significant_count: s.significant_count ?? 0,
      avg_mood_score: typeof s.avg_mood_score === "number" ? s.avg_mood_score : 0,
      category_count: Array.isArray(s.categories) ? s.categories.length : 0,
      requires_followup: s.requires_followup ?? false,
    }));

    // Daily logs
    const rawLogs = (store.dailyLog ?? []) as any[];
    const daily_logs: DailyLogEntryInput[] = rawLogs.map((l: any) => ({
      id: l.id ?? "",
      child_id: l.child_id ?? "",
      date: (l.date ?? today).toString().slice(0, 10),
      has_content: !!(l.content && l.content.trim().length > 0),
      mood_score: typeof l.mood_score === "number" ? l.mood_score : 0,
      is_significant: l.is_significant ?? false,
    }));

    // Behaviour logs
    const rawBehaviour = (store.behaviourLog ?? []) as any[];
    const behaviour_logs: BehaviourLogEntryInput[] = rawBehaviour.map((b: any) => ({
      id: b.id ?? "",
      child_id: b.child_id ?? "",
      date: (b.date ?? today).toString().slice(0, 10),
      severity: b.severity ?? "low",
      de_escalation_used: b.de_escalation_used ?? false,
      has_antecedent: !!(b.antecedent && b.antecedent.trim().length > 0),
      has_consequence: !!(b.consequence && b.consequence.trim().length > 0),
      has_outcome: !!(b.outcome && b.outcome.trim().length > 0),
    }));

    const result = computeYoungPersonDailyWellbeing({
      today, total_children, summaries, daily_logs, behaviour_logs,
    });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
