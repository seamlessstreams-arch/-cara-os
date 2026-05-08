import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OfstedEngagementRecord } from "@/types/extended";

const KEY = "ofsted-engagement-records";

async function fetchRecords(): Promise<{ data: OfstedEngagementRecord[] }> {
  const res = await fetch("/api/v1/ofsted-engagement-records");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOfstedEngagementLog() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateOfstedEngagementRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OfstedEngagementRecord>) => {
      const res = await fetch("/api/v1/ofsted-engagement-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOfstedEngagementRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OfstedEngagementRecord> & { id: string }) => {
      const res = await fetch("/api/v1/ofsted-engagement-records", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
