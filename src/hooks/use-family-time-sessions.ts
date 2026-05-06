import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FamilyTimeSession } from "@/types/extended";

const KEY = "family-time-sessions";
const API = "/api/v1/family-time-sessions";

export function useFamilyTimeSessions(childId?: string) {
  return useQuery<{ data: FamilyTimeSession[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateFamilyTimeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FamilyTimeSession>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFamilyTimeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FamilyTimeSession> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
