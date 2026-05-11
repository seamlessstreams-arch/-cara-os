"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AmendmentReviewSummary } from "@/lib/care-events/amendment-review";

interface Response {
  data: AmendmentReviewSummary;
}

export function useAmendmentReview(homeId: string) {
  return useQuery({
    queryKey: ["amendment-review", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/amendment-review?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}
