import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SelfSoothingToolkit } from "@/types/extended";

const KEY = "self-soothing-toolkits";
const API = "/api/v1/self-soothing-toolkits";

export function useSelfSoothingToolkits(childId?: string) {
  return useQuery<{ data: SelfSoothingToolkit[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateSelfSoothingToolkit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SelfSoothingToolkit>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSelfSoothingToolkit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SelfSoothingToolkit> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
