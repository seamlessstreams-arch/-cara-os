import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MultiAgencyMeeting } from "@/types/extended";

const BASE = "/api/v1/multi-agency-meetings";

async function fetchAll(childId?: string) {
  const url = childId ? `${BASE}?child_id=${childId}` : BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch multi-agency meetings");
  return res.json() as Promise<{ data: MultiAgencyMeeting[] }>;
}

export function useMultiAgencyMeetings(childId?: string) {
  return useQuery({ queryKey: ["multi-agency-meetings", childId], queryFn: () => fetchAll(childId) });
}

export function useCreateMultiAgencyMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MultiAgencyMeeting>) => {
      const res = await fetch(BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create multi-agency meeting");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multi-agency-meetings"] }),
  });
}

export function useUpdateMultiAgencyMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<MultiAgencyMeeting> & { id: string }) => {
      const res = await fetch(BASE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update multi-agency meeting");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multi-agency-meetings"] }),
  });
}
