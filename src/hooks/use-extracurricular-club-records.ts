import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExtracurricularClubRecord } from "@/types/extended";

const KEY = "extracurricular-club-records";
const API = "/api/v1/extracurricular-club-records";

export function useExtracurricularClubRecords(childId?: string) {
  return useQuery<{ data: ExtracurricularClubRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateExtracurricularClubRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExtracurricularClubRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateExtracurricularClubRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExtracurricularClubRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
