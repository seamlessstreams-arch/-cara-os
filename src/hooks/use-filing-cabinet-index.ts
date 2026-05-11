"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { FilingCabinetIndex } from "@/lib/care-events/filing-cabinet-index";

interface Response {
  data: FilingCabinetIndex;
}

export function useFilingCabinetIndex(homeId: string) {
  return useQuery({
    queryKey: ["filing-cabinet-index", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/filing-cabinet?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}
