import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffGrievanceRecord } from "@/types/extended";

export function useStaffGrievanceRecords() {
  return useQuery<StaffGrievanceRecord[]>({
    queryKey: ["staff-grievance-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-grievance-records");
      if (!res.ok) throw new Error("Failed to fetch staff grievance records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffGrievanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffGrievanceRecord, "id">) => {
      const res = await fetch("/api/v1/staff-grievance-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff grievance record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-grievance-records"] }),
  });
}
