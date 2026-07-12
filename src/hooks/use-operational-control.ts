"use client";

import { useQuery } from "@tanstack/react-query";

// Hooks for the Phase-2 Operational Control surfaces. Read-only projections;
// the spine is deterministic, recurring-checks reads task state.

export interface SpineItem {
  id: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  detail?: string;
  href: string;
  child_id?: string | null;
  created_at?: string | null;
}
export interface SpineResult {
  view: string;
  items: SpineItem[];
  sources: { source: string; ok: boolean; count: number }[];
  totals: Record<"critical" | "high" | "medium" | "low", number>;
}

export function useOperationalSpine(view: "alerts" | "escalations") {
  return useQuery({
    queryKey: ["operational-spine", view],
    queryFn: async (): Promise<SpineResult> => {
      const res = await fetch(`/api/v1/operational-spine?view=${view}`);
      if (!res.ok) throw new Error(`Spine returned ${res.status}`);
      return (await res.json()).data;
    },
    refetchInterval: 60_000,
  });
}

export interface RecurringCheck {
  template_id: string;
  name: string;
  cadence: "daily" | "weekly" | "monthly";
  period: string;
  status: "done" | "pending" | "not_created";
  task_id?: string;
  due_date: string;
  regulatory_ref?: string;
}
export interface RecurringChecksResult {
  materialiser_enabled: boolean;
  checks: RecurringCheck[];
  summary: { done: number; pending: number; not_created: number };
}

export function useRecurringChecks() {
  return useQuery({
    queryKey: ["recurring-checks"],
    queryFn: async (): Promise<RecurringChecksResult> => {
      const res = await fetch("/api/v1/recurring-checks");
      if (!res.ok) throw new Error(`Recurring checks returned ${res.status}`);
      return (await res.json()).data;
    },
  });
}
