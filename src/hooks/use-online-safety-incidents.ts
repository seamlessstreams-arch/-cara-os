import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OnlineSafetyIncident } from "@/types/extended";

const KEY = "online-safety-incidents";

async function fetchRecords(childId?: string): Promise<{ data: OnlineSafetyIncident[] }> {
  const url = childId ? `/api/v1/online-safety-incidents?child_id=${childId}` : "/api/v1/online-safety-incidents";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOnlineSafetyIncidents(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateOnlineSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnlineSafetyIncident>) => {
      const res = await fetch("/api/v1/online-safety-incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOnlineSafetyIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnlineSafetyIncident> & { id: string }) => {
      const res = await fetch("/api/v1/online-safety-incidents", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
