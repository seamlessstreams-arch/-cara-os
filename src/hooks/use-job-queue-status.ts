"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { JobQueueStatus } from "@/lib/care-events/job-queue-status";

interface Response {
  data: JobQueueStatus;
}

export function useJobQueueStatus(homeId: string) {
  return useQuery({
    queryKey: ["job-queue-status", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/job-queue?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 15000,
  });
}
