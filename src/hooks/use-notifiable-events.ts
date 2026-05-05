import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotifiableEvent } from "@/types/extended";

const KEY = "notifiable-events";
const API = "/api/v1/notifiable-events";

export function useNotifiableEvents(childId?: string) {
  return useQuery<{ data: NotifiableEvent[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateNotifiableEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotifiableEvent>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateNotifiableEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotifiableEvent> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
