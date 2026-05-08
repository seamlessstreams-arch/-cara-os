import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OpticiansRecord } from "@/types/extended";

const KEY = "opticians-records";

async function fetchRecords(childId?: string): Promise<{ data: OpticiansRecord[] }> {
  const url = childId ? `/api/v1/opticians-records?child_id=${childId}` : "/api/v1/opticians-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOpticiansRecords(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateOpticiansRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OpticiansRecord>) => {
      const res = await fetch("/api/v1/opticians-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOpticiansRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OpticiansRecord> & { id: string }) => {
      const res = await fetch("/api/v1/opticians-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
