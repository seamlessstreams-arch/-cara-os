"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { OversightSummary } from "@/lib/care-events/oversight-inbox";

interface Response {
  data: OversightSummary;
}

export function useOversightInbox(homeId: string) {
  return useQuery({
    queryKey: ["oversight-inbox", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/oversight-inbox?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}
