"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { MonitoringBoard } from "@/lib/monitoring-plans/monitoring-plans-engine";

export type { MonitoringBoard };

type Response = { data: MonitoringBoard };

/** The individual monitoring-plans board (read-only). */
export function useMonitoringBoard() {
  return useQuery({
    queryKey: ["monitoring-plans-board"],
    queryFn: () => api.get<Response>("/monitoring-plans"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
