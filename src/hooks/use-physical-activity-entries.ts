import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhysicalActivityEntry } from "@/types/extended";

const KEY = "physical-activity-entries";
const API = "/api/v1/physical-activity-entries";

export function usePhysicalActivityEntries(childId?: string) {
  return useQuery<{ data: PhysicalActivityEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePhysicalActivityEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhysicalActivityEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePhysicalActivityEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhysicalActivityEntry> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
