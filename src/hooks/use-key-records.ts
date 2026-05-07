import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { KeyRecord } from "@/types/extended";

const KEY = "key-records";

export function useKeyRecords() {
  return useQuery<{ data: KeyRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/key-records").then((r) => r.json()),
  });
}

export function useCreateKeyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KeyRecord>) =>
      fetch("/api/v1/key-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateKeyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KeyRecord> & { id: string }) =>
      fetch("/api/v1/key-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
