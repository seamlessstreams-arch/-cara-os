"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ExportAbuseReport } from "@/lib/care-events/export-abuse";

interface Response { data: ExportAbuseReport }

export function useExportAbuse(homeId: string) {
  return useQuery({
    queryKey: ["export-abuse", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/export-abuse?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 60000,
  });
}
