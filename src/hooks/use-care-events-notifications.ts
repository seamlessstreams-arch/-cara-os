"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { NotificationStream } from "@/lib/care-events/notifications";

interface Response {
  data: NotificationStream;
}

export function useCareEventsNotifications(homeId: string) {
  return useQuery({
    queryKey: ["care-events-notifications", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/notifications?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 15000,
  });
}
