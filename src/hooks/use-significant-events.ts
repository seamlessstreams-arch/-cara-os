import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SignificantEvent } from "@/types/extended";

const KEY = "significant-events";
const API = "/api/v1/significant-events";

export function useSignificantEvents(childId?: string) {
  return useQuery<{ data: SignificantEvent[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateSignificantEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SignificantEvent>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSignificantEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SignificantEvent> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
