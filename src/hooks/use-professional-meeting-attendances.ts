import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfessionalMeetingAttendance } from "@/types/extended";

export function useProfessionalMeetingAttendances(childId?: string) {
  return useQuery<ProfessionalMeetingAttendance[]>({
    queryKey: ["professional-meeting-attendances", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/professional-meeting-attendances?child_id=${childId}`
        : "/api/v1/professional-meeting-attendances";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch professional meeting attendances");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateProfessionalMeetingAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProfessionalMeetingAttendance>) => {
      const res = await fetch("/api/v1/professional-meeting-attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create professional meeting attendance");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-meeting-attendances"] }),
  });
}
