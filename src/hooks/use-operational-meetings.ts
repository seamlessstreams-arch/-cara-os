import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OperationalMeeting } from "@/types/extended";

const KEY = "operational-meetings";

async function fetchRecords(): Promise<{ data: OperationalMeeting[] }> {
  const res = await fetch("/api/v1/operational-meetings");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOperationalMeetings() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateOperationalMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OperationalMeeting>) => {
      const res = await fetch("/api/v1/operational-meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOperationalMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OperationalMeeting> & { id: string }) => {
      const res = await fetch("/api/v1/operational-meetings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
