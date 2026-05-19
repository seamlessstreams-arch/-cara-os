"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CareEventJob, CareEventRoute } from "@/types/care-events";

export interface RoutingHealthRow {
  care_event_id: string;
  care_event_title: string;
  care_event_category: string;
  care_event_date: string;
  home_id: string;
  child_id: string | null;
  failed_routes: CareEventRoute[];
  failed_jobs: CareEventJob[];
}

export interface RoutingHealthSummary {
  home_id: string;
  generated_at: string;
  failed_route_count: number;
  failed_job_count: number;
  affected_event_count: number;
  rows: RoutingHealthRow[];
}

interface QueueResponse {
  data: RoutingHealthSummary;
}

export function useRoutingHealth(homeId: string) {
  return useQuery({
    queryKey: ["routing-health", homeId],
    queryFn: () =>
      api.get<QueueResponse>(
        `/api/v1/care-events/routing-health?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}

export function useRetryRoutes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      care_event_id: string;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<{ data: unknown }>("/api/v1/care-events/routing-health", {
        ...input,
        action: "retry_routes",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routing-health"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      job_id: string;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<{ data: CareEventJob }>("/api/v1/care-events/routing-health", {
        ...input,
        action: "retry_job",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routing-health"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
