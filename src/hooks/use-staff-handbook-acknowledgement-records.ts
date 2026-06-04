import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffHandbookAcknowledgementRecord } from "@/types/extended";

export function useStaffHandbookAcknowledgementRecords() {
  return useQuery<StaffHandbookAcknowledgementRecord[]>({
    queryKey: ["staff-handbook-acknowledgement-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-handbook-acknowledgement-records");
      if (!res.ok) throw new Error("Failed to fetch staff handbook acknowledgement records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffHandbookAcknowledgementRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffHandbookAcknowledgementRecord, "id">) => {
      const res = await fetch("/api/v1/staff-handbook-acknowledgement-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff handbook acknowledgement record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-handbook-acknowledgement-records"] }),
  });
}
