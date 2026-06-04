import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffCompetencyRecord } from "@/types/extended";

export function useStaffCompetencyRecords() {
  return useQuery<StaffCompetencyRecord[]>({
    queryKey: ["staff-competency-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-competency-records");
      if (!res.ok) throw new Error("Failed to fetch staff competency records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffCompetencyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffCompetencyRecord, "id">) => {
      const res = await fetch("/api/v1/staff-competency-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff competency record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-competency-records"] }),
  });
}
