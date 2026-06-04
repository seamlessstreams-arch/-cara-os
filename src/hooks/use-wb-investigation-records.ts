import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WBInvestigationRecord } from "@/types/extended";

export function useWBInvestigationRecords() {
  return useQuery<WBInvestigationRecord[]>({
    queryKey: ["wb-investigation-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/wb-investigation-records");
      if (!res.ok) throw new Error("Failed to fetch WB investigation records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateWBInvestigationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<WBInvestigationRecord, "id">) => {
      const res = await fetch("/api/v1/wb-investigation-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create WB investigation record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wb-investigation-records"] }),
  });
}
