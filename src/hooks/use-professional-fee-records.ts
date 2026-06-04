import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfessionalFeeRecord } from "@/types/extended";

export function useProfessionalFeeRecords(childId?: string) {
  return useQuery<ProfessionalFeeRecord[]>({
    queryKey: ["professional-fee-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/professional-fee-records?child_id=${childId}`
        : "/api/v1/professional-fee-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch professional fee records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateProfessionalFeeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProfessionalFeeRecord>) => {
      const res = await fetch("/api/v1/professional-fee-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create professional fee record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-fee-records"] }),
  });
}
