import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffMeetingRecord } from "@/types/extended";

export function useStaffMeetingRecords() {
  return useQuery<StaffMeetingRecord[]>({
    queryKey: ["staff-meeting-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-meeting-records");
      if (!res.ok) throw new Error("Failed to fetch staff meeting records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffMeetingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffMeetingRecord, "id">) => {
      const res = await fetch("/api/v1/staff-meeting-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff meeting record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-meeting-records"] }),
  });
}
