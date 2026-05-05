import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VisitorEntry } from "@/types/extended";

const KEY = "visitors";
const API = "/api/v1/visitors";

export function useVisitors() {
  return useQuery<{ data: VisitorEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VisitorEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VisitorEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
