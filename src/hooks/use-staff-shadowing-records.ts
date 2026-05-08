import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffShadowingRecord } from "@/types/extended";

export function useStaffShadowingRecords() {
  return useQuery<StaffShadowingRecord[]>({
    queryKey: ["staff-shadowing-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-shadowing-records");
      if (!res.ok) throw new Error("Failed to fetch staff shadowing records");
      return res.json();
    },
  });
}

export function useCreateStaffShadowingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffShadowingRecord, "id">) => {
      const res = await fetch("/api/v1/staff-shadowing-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff shadowing record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-shadowing-records"] }),
  });
}
