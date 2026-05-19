// ══════════════════════════════════════════════════════════════════════════════
// useChildChronology — per-child chronology hook
// Aggregates all significant events for a child from the unified chronology API
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";

export interface ChronologyItem {
  id: string;
  source_type:
    | "care_event"
    | "incident"
    | "missing_episode"
    | "behaviour_log"
    | "key_working"
    | "daily_log"
    | "risk_assessment"
    | "chronology_entry";
  source_id: string;
  date: string;
  time: string | null;
  title: string;
  summary: string;
  severity: "routine" | "significant" | "critical";
  category: string;
  staff_id: string | null;
  links: { label: string; href: string }[];
}

export interface ChronologyStats {
  total: number;
  critical: number;
  significant: number;
  incidents: number;
  missing: number;
  keywork: number;
  behaviour: number;
}

interface ChronologyResponse {
  data: ChronologyItem[];
  stats: ChronologyStats;
  total: number;
}

interface UseChildChronologyParams {
  childId: string;
  from?: string;
  to?: string;
  types?: ChronologyItem["source_type"][];
  limit?: number;
  enabled?: boolean;
}

export function useChildChronology({
  childId,
  from,
  to,
  types,
  limit = 200,
  enabled = true,
}: UseChildChronologyParams) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (limit !== 200) qs.set("limit", String(limit));
  if (types?.length) types.forEach((t) => qs.append("type", t));
  const query = qs.toString();

  return useQuery({
    queryKey: ["child-chronology", childId, from, to, types, limit],
    queryFn: () =>
      api.get<ChronologyResponse>(
        `/api/v1/young-people/${childId}/chronology${query ? `?${query}` : ""}`
      ),
    enabled: enabled && !!childId,
    staleTime: 30_000,
  });
}
