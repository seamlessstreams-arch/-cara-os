// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Weekly Report / Narrative accessors
//
// getWeeklyReport(childId)     → the full sectioned, second-person weekly REPORT
// getWeeklyNarrative(childId)  → the third-person Manager-Summary NARRATIVE
//
// Both read the store, build the deterministic Weekly Intelligence Object, and
// hand it to the pure narrator. This is how every consumer (the /cpie weekly
// API, the weekly-overview page, Ask CARA, "Generate with Cara") produces the
// report the same way — deterministically, no LLM.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { getWeeklyIntelligenceObject } from "./get-weekly-intelligence-object";
import { composeWeeklyReport, type WeeklyReport } from "./weekly-report";
import { composeWeeklyNarrative, type WeeklyNarrative } from "./weekly-narrative";

type Any = Record<string, unknown>;
const rows = (v: unknown): Any[] => (Array.isArray(v) ? (v as Any[]) : []);

function childName(child: Any, childId: string): string {
  return String(child.first_name || child.preferred_name || child.full_name || childId);
}

/** The full sectioned weekly report for a child (second person, day-by-day). */
export function getWeeklyReport(childId: string, weekEnding?: string, windowDays = 7): WeeklyReport | null {
  const store = getStore() as unknown as Record<string, unknown>;
  const child = rows(store.youngPeople).find((c) => String(c.id) === childId);
  if (!child) return null;
  const now = new Date().toISOString();
  const end = (weekEnding || now).slice(0, 10);
  const wio = getWeeklyIntelligenceObject(childId, end, now, windowDays, windowDays >= 28 ? "month" : "week");
  if (!wio) return null;
  return composeWeeklyReport({
    childId,
    childName: childName(child, childId),
    now,
    weekEnding: end,
    windowDays,
    wio,
    dailyLogs: rows(store.dailyLog),
    positiveAchievements: rows(store.positiveAchievements),
    incidents: rows(store.incidents),
    behaviourLog: rows(store.behaviourLog),
    familyTimeSessions: rows(store.familyTimeSessions),
    educationRecords: rows(store.educationRecords),
    medications: rows(store.medications),
    activities: rows(store.activities),
    healthRecordEntries: rows(store.healthRecordEntries),
    ypFeedback: rows(store.ypFeedback),
    keyWorkingSessions: rows(store.keyWorkingSessions),
  });
}

/** The third-person Manager-Summary narrative for a child. */
export function getWeeklyNarrative(childId: string, weekEnding?: string, windowDays = 7): WeeklyNarrative | null {
  const now = new Date().toISOString();
  const end = (weekEnding || now).slice(0, 10);
  const wio = getWeeklyIntelligenceObject(childId, end, now, windowDays, windowDays >= 28 ? "month" : "week");
  return wio ? composeWeeklyNarrative(wio) : null;
}
