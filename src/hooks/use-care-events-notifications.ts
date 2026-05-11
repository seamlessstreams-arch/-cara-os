"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { NotificationStream } from "@/lib/care-events/notifications";

interface Response {
  data: NotificationStream;
}

export function useCareEventsNotifications(
  homeId: string,
  opts?: { includeDismissed?: boolean },
) {
  const includeDismissed = opts?.includeDismissed ?? false;
  return useQuery({
    queryKey: ["care-events-notifications", homeId, includeDismissed],
    queryFn: () => {
      const qs = new URLSearchParams({ home_id: homeId });
      if (includeDismissed) qs.set("include_dismissed", "true");
      return api.get<Response>(`/api/v1/care-events/notifications?${qs}`);
    },
    refetchInterval: 15000,
  });
}

export type NotificationAction = "read" | "unread" | "dismiss" | "undismiss";

export function useNotificationAction(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { notificationIds: string[]; action: NotificationAction }) =>
      api.post<{ data: { updated: string[]; action: NotificationAction } }>(
        "/api/v1/care-events/notifications",
        {
          home_id: homeId,
          notification_ids: input.notificationIds,
          action: input.action,
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care-events-notifications", homeId] });
    },
  });
}
