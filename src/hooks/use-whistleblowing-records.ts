import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WhistleblowingRecord } from "@/types/extended";

export function useWhistleblowingRecords() {
  return useQuery<WhistleblowingRecord[]>({
    queryKey: ["whistleblowing-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/whistleblowing-records");
      if (!res.ok) throw new Error("Failed to fetch whistleblowing records");
      return res.json();
    },
  });
}

export function useCreateWhistleblowingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<WhistleblowingRecord, "id">) => {
      const res = await fetch("/api/v1/whistleblowing-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create whistleblowing record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whistleblowing-records"] }),
  });
}
