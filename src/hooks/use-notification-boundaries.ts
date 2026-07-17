"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  DeliveryPlan,
  DeliverableNotification,
} from "@/lib/notifications/delivery-boundaries";

export interface NotificationBoundariesData extends DeliveryPlan {
  staffId: string;
  staffName: string;
  onShift: boolean;
  notifications: DeliverableNotification[];
}

/** What would reach this person now, and what is being held. Own plan by
 *  default; a manager may pass a staffId. */
export function useNotificationBoundaries(staffId?: string) {
  const qs = staffId ? `?staff_id=${encodeURIComponent(staffId)}` : "";
  return useQuery({
    queryKey: ["notification-boundaries", staffId ?? "me"],
    queryFn: async () =>
      (await api.get<{ data: NotificationBoundariesData }>(`/notification-boundaries${qs}`)).data,
  });
}
