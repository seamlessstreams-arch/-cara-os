import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CpConferenceRecord } from "@/types/extended";

const KEY = "cp-conferences";
const API = "/api/v1/cp-conferences";

export function useCpConferences(childId?: string) {
  return useQuery<{ data: CpConferenceRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCpConference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CpConferenceRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCpConference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CpConferenceRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
