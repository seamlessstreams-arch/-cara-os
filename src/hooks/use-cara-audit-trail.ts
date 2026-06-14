"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CaraAuditAction, CaraStudioAuditLog } from "@/types/cara-studio";

interface ListResponse<T> {
  data: T[];
}

export interface AuditTrailFilters {
  actorId?: string;
  actionType?: CaraAuditAction;
  artifactId?: string;
  sinceIso?: string;
  limit?: number;
}

/**
 * Live tail of the Cara Studio audit log. Refreshes every 15s.
 */
export function useAuditTrail(homeId: string, filters: AuditTrailFilters = {}) {
  const qs = new URLSearchParams({ home_id: homeId });
  if (filters.actorId) qs.set("actor_id", filters.actorId);
  if (filters.actionType) qs.set("action_type", filters.actionType);
  if (filters.artifactId) qs.set("artifact_id", filters.artifactId);
  if (filters.sinceIso) qs.set("since", filters.sinceIso);
  if (filters.limit) qs.set("limit", String(filters.limit));

  return useQuery({
    queryKey: [
      "cara-audit-trail",
      homeId,
      filters.actorId ?? "*",
      filters.actionType ?? "*",
      filters.artifactId ?? "*",
      filters.sinceIso ?? "*",
      filters.limit ?? 200,
    ],
    queryFn: () =>
      api.get<ListResponse<CaraStudioAuditLog>>(
        `/api/v1/cara-studio/audit-trail?${qs.toString()}`,
      ),
    refetchInterval: 15000,
  });
}

/**
 * Distinct actor ids seen in the home's audit trail. Used by the
 * filter dropdown.
 */
export function useAuditActors(homeId: string) {
  return useQuery({
    queryKey: ["cara-audit-actors", homeId],
    queryFn: () =>
      api.get<ListResponse<string>>(
        `/api/v1/cara-studio/audit-trail?home_id=${encodeURIComponent(homeId)}&actors=1`,
      ),
    refetchInterval: 60000,
  });
}
