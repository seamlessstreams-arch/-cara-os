import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffInductionRecord } from "@/types/extended";

export function useStaffInductionRecords() {
  return useQuery<StaffInductionRecord[]>({
    queryKey: ["staff-induction-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-induction-records");
      if (!res.ok) throw new Error("Failed to fetch staff induction records");
      return res.json();
    },
  });
}

export function useCreateStaffInductionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffInductionRecord, "id">) => {
      const res = await fetch("/api/v1/staff-induction-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff induction record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-induction-records"] }),
  });
}
