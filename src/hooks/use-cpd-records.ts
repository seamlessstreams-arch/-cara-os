import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CPDRecord } from "@/types/extended";

export function useCpdRecords() {
  return useQuery<CPDRecord[]>({
    queryKey: ["cpd-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/cpd-records");
      if (!res.ok) throw new Error("Failed to fetch CPD records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateCpdRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CPDRecord>) => {
      const res = await fetch("/api/v1/cpd-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create CPD record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cpd-records"] }),
  });
}
