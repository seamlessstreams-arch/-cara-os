import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OnlineGamingRecord } from "@/types/extended";

const KEY = "online-gaming-records";

async function fetchRecords(childId?: string): Promise<{ data: OnlineGamingRecord[] }> {
  const url = childId ? `/api/v1/online-gaming-records?child_id=${childId}` : "/api/v1/online-gaming-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOnlineGamingRecords(childId?: string) {
  return useQuery({ queryKey: childId ? [KEY, childId] : [KEY], queryFn: () => fetchRecords(childId) });
}

export function useCreateOnlineGamingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnlineGamingRecord>) => {
      const res = await fetch("/api/v1/online-gaming-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOnlineGamingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnlineGamingRecord> & { id: string }) => {
      const res = await fetch("/api/v1/online-gaming-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
