"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export interface ShiftSummaryEvent {
  type: "incident" | "medication" | "daily_log" | "task" | "missing" | "handover_flag";
  time: string;
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  child_id?: string;
  child_name?: string;
  staff_name?: string;
}

export interface ShiftSummary {
  date: string;
  shift_type: string;
  staff_on_shift: { id: string; name: string; role: string; start: string; end: string }[];
  young_people: { id: string; name: string; mood_score?: number; entries_count: number }[];
  events: ShiftSummaryEvent[];
  stats: {
    total_events: number;
    incidents_logged: number;
    medications_given: number;
    medications_missed: number;
    daily_log_entries: number;
    tasks_completed: number;
    missing_episodes: number;
  };
  auto_notes: string;
}

export function useShiftSummary(date?: string, shiftType: string = "day") {
  const query = new URLSearchParams();
  if (date) query.set("date", date);
  query.set("shift", shiftType);

  return useQuery({
    queryKey: ["shift-summary", date, shiftType],
    queryFn: () => api.get<{ data: ShiftSummary }>(`/shift-summary?${query}`),
  });
}
