import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SafeguardingSupervisionRecord } from "@/types/extended";

export function useSafeguardingSupervisionRecords() {
  return useQuery<SafeguardingSupervisionRecord[]>({
    queryKey: ["safeguarding-supervision-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/safeguarding-supervision-records");
      if (!res.ok) throw new Error("Failed to fetch safeguarding supervision records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSafeguardingSupervisionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SafeguardingSupervisionRecord>) => {
      const res = await fetch("/api/v1/safeguarding-supervision-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create safeguarding supervision record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safeguarding-supervision-records"] }),
  });
}
