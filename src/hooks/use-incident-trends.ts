import { useQuery } from "@tanstack/react-query";
import type { IncidentTrendRecord } from "@/types/extended";

const KEY = "incident-trends";

export function useIncidentTrends() {
  return useQuery<{ data: IncidentTrendRecord[] }>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch("/api/v1/incident-trends");
      return res.json();
    },
  });
}
