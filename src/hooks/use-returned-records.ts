"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ReturnedRecordsSummary } from "@/lib/care-events/returned-records";

interface Response {
  data: ReturnedRecordsSummary;
}

export function useReturnedRecords(homeId: string) {
  return useQuery({
    queryKey: ["returned-records", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/returned-records?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}
