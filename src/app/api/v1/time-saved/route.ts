import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import type { TimeSavedSummary } from "@/types/extended";

const BASELINE_MINUTES: Record<string, number> = {
  auto_fill: 5,
  linked_record: 4,
  aria_draft: 15,
  auto_task: 5,
  auto_handover: 10,
  one_click_summary: 8,
  avoided_duplicate: 6,
};

// Simulated accumulated savings for demo purposes
const DEMO_SAVINGS = [
  { category: "Auto-linked records", minutes: 48, count: 12 },
  { category: "Aria-assisted drafts", minutes: 90, count: 6 },
  { category: "Auto-generated tasks", minutes: 25, count: 5 },
  { category: "Auto-populated handovers", minutes: 40, count: 4 },
  { category: "Avoided duplicate entry", minutes: 36, count: 9 },
  { category: "One-click summaries", minutes: 24, count: 3 },
];

export async function GET(_req: NextRequest) {
  const store = getStore();
  const today = todayStr();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);

  const allEntries = store.timeSaved;
  const myEntries = allEntries.filter((e) => e.staff_id === "staff_darren");

  const todayMinutes = myEntries
    .filter((e) => e.created_at.startsWith(today))
    .reduce((sum, e) => sum + e.minutes_saved, 0);

  const weekMinutes = myEntries
    .filter((e) => e.created_at.slice(0, 10) >= weekAgoStr)
    .reduce((sum, e) => sum + e.minutes_saved, 0);

  const homeWeekMinutes = allEntries
    .filter((e) => e.created_at.slice(0, 10) >= weekAgoStr)
    .reduce((sum, e) => sum + e.minutes_saved, 0);

  const homeMonthMinutes = allEntries
    .filter((e) => e.created_at.slice(0, 10) >= monthAgoStr)
    .reduce((sum, e) => sum + e.minutes_saved, 0);

  // Add demo baseline savings to make demo meaningful
  const summary: TimeSavedSummary = {
    user_today_minutes: todayMinutes + 42,
    user_week_minutes: weekMinutes + 183,
    home_week_minutes: homeWeekMinutes + 547,
    home_month_minutes: homeMonthMinutes + 1840,
    breakdown: DEMO_SAVINGS,
  };

  return NextResponse.json({
    data: summary,
    formatted: {
      user_today: formatMinutes(summary.user_today_minutes),
      user_week: formatMinutes(summary.user_week_minutes),
      home_week: formatMinutes(summary.home_week_minutes),
      home_month: formatMinutes(summary.home_month_minutes),
    },
  });
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
