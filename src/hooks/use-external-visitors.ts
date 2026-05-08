import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExternalVisitor } from "@/types/extended";

const KEY = "external-visitors";
const API = "/api/v1/external-visitors";

export function useExternalVisitors() {
  return useQuery<{ data: ExternalVisitor[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateExternalVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExternalVisitor>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateExternalVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ExternalVisitor> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
