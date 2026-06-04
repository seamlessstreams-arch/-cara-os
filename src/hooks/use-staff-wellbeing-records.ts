import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffWellbeingRecord } from "@/types/extended";

export function useStaffWellbeingRecords() {
  return useQuery<StaffWellbeingRecord[]>({
    queryKey: ["staff-wellbeing-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-wellbeing-records");
      if (!res.ok) throw new Error("Failed to fetch staff wellbeing records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffWellbeingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffWellbeingRecord, "id">) => {
      const res = await fetch("/api/v1/staff-wellbeing-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff wellbeing record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-wellbeing-records"] }),
  });
}
