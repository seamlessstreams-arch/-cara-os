import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DataBreachRecord } from "@/types/extended";

const KEY = "data-breach-records";
const API = "/api/v1/data-breach-records";

export function useDataBreachRecords() {
  return useQuery<{ data: DataBreachRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateDataBreachRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DataBreachRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDataBreachRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DataBreachRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
