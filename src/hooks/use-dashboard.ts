"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<{ data: DashboardData }>("/dashboard"),
    refetchInterval: 30_000, // Live refresh every 30s
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health-check"],
    queryFn: () => api.get<{ data: import("@/types/extended").HealthCheckScore }>("/health-check"),
    refetchInterval: 60_000,
  });
}

export function useTimeSaved() {
  return useQuery({
    queryKey: ["time-saved"],
    queryFn: () => api.get<{ data: import("@/types/extended").TimeSavedSummary; formatted: Record<string, string> }>("/time-saved"),
  });
}

// ── Type (matches dashboard route response) ───────────────────────────────────
interface DashboardData {
  tasks: {
    active: number; overdue: number; due_today: number;
    urgent: number; my_tasks: number; awaiting_sign_off: number;
    completed_today: number;
    priority_queue: import("@/types").Task[];
  };
  incidents: {
    open: number; awaiting_oversight: number; critical: number;
    this_week: number;
    list: import("@/types").Incident[];
    oversight_queue: import("@/types").Incident[];
  };
  safeguarding: {
    missing_active: number; contextual_risk: number;
    missing_episodes: import("@/types/extended").MissingEpisode[];
    high_risk_yp: import("@/types").YoungPerson[];
  };
  staffing: {
    on_shift: number; open_shifts: number; on_leave: number;
    pending_leave_requests: number; supervision_overdue: number;
    today_shifts: import("@/types").Shift[];
  };
  medication: {
    exceptions_this_week: number; missed_today: number;
    scheduled_today: number; stock_alerts: number; oversight_needed: number;
  };
  compliance: {
    training_expired: number; training_expiring: number;
    cert_warnings: number; cert_warnings_list: string[];
  };
  environment: {
    building_checks_due: number; building_checks_overdue: number;
    vehicle_defects: number; vehicles_restricted: number;
  };
  young_people: {
    current: import("@/types").YoungPerson[];
    missing_episodes_total: number;
  };
}
