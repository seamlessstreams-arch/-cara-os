import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffSicknessRecord } from "@/types/extended";

export function useStaffSicknessRecords() {
  return useQuery<StaffSicknessRecord[]>({
    queryKey: ["staff-sickness-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-sickness-records");
      if (!res.ok) throw new Error("Failed to fetch staff sickness records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffSicknessRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffSicknessRecord, "id">) => {
      const res = await fetch("/api/v1/staff-sickness-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff sickness record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-sickness-records"] }),
  });
}
