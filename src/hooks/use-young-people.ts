"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { YoungPerson, StaffMember } from "@/types";

export interface YPEnriched extends YoungPerson {
  age: number;
  key_worker: StaffMember | null;
  secondary_worker: StaffMember | null;
  open_incidents: number;
  active_tasks: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  active_medications: number;
  risk_flags_count: number;
}

export interface YPDetail extends YPEnriched {
  related: {
    incidents: import("@/types").Incident[];
    tasks: import("@/types").Task[];
    medications: import("@/types").Medication[];
    missing_episodes: unknown[];
    chronology: unknown[];
    care_forms: import("@/types").CareForm[];
    recent_log: import("@/types").DailyLogEntry[];
  };
  meta: {
    today: string;
    total_incidents: number;
    open_incidents: number;
    total_tasks: number;
    active_tasks: number;
  };
}

export function useYoungPerson(id: string) {
  return useQuery({
    queryKey: ["young-people", id],
    queryFn: () => api.get<{ data: YPEnriched; related: YPDetail["related"]; meta: YPDetail["meta"] }>(`/young-people/${id}`),
    enabled: !!id,
  });
}

export function useYoungPeople(status = "current") {
  return useQuery({
    queryKey: ["young-people", status],
    queryFn: () =>
      api.get<{ data: YPEnriched[]; meta: Record<string, number> }>(
        `/young-people?status=${status}`
      ),
  });
}
