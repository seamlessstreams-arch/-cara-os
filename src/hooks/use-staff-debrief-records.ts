import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffDebriefRecord } from "@/types/extended";

export function useStaffDebriefRecords() {
  return useQuery<StaffDebriefRecord[]>({
    queryKey: ["staff-debrief-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-debrief-records");
      if (!res.ok) throw new Error("Failed to fetch staff debrief records");
      return res.json();
    },
  });
}

export function useCreateStaffDebriefRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffDebriefRecord, "id">) => {
      const res = await fetch("/api/v1/staff-debrief-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff debrief record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-debrief-records"] }),
  });
}
