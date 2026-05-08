import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IncomingCorrespondence } from "@/types/extended";

const KEY = "incoming-correspondence";
const API = "/api/v1/incoming-correspondence";

export function useIncomingCorrespondence(childId?: string) {
  return useQuery<{ data: IncomingCorrespondence[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateIncomingCorrespondence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IncomingCorrespondence>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateIncomingCorrespondence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IncomingCorrespondence> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
