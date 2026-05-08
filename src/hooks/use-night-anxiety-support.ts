import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NightAnxietySupportRecord } from "@/types/extended";

const KEY = "night-anxiety-support-records";

async function fetchRecords(childId?: string): Promise<{ data: NightAnxietySupportRecord[] }> {
  const url = childId ? `/api/v1/night-anxiety-support-records?child_id=${childId}` : "/api/v1/night-anxiety-support-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useNightAnxietySupport(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateNightAnxietySupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightAnxietySupportRecord>) => {
      const res = await fetch("/api/v1/night-anxiety-support-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateNightAnxietySupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<NightAnxietySupportRecord> & { id: string }) => {
      const res = await fetch("/api/v1/night-anxiety-support-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
