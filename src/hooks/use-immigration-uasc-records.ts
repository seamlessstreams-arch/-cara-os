import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImmigrationUascRecord } from "@/types/extended";

const KEY = "immigration-uasc-records";
const API = "/api/v1/immigration-uasc-records";

export function useImmigrationUascRecords(childId?: string) {
  return useQuery<{ data: ImmigrationUascRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateImmigrationUascRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ImmigrationUascRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateImmigrationUascRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ImmigrationUascRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
