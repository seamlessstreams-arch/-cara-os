import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AccidentRecord } from "@/types/extended";

const KEY = "accident-book";
const API = "/api/v1/accident-book";

export function useAccidentBook() {
  return useQuery<{ data: AccidentRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateAccident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AccidentRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAccident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AccidentRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
