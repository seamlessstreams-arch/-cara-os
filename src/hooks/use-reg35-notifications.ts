import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reg35Notification } from "@/types/extended";

export function useReg35Notifications(childId?: string) {
  return useQuery<Reg35Notification[]>({
    queryKey: ["reg35-notifications", childId],
    queryFn: () => {
      const url = childId
        ? `/api/v1/reg35-notifications?child_id=${childId}`
        : "/api/v1/reg35-notifications";
      return fetch(url).then((r) => r.json());
    },
  });
}

export function useCreateReg35Notification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reg35Notification>) =>
      fetch("/api/v1/reg35-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reg35-notifications"] }),
  });
}
