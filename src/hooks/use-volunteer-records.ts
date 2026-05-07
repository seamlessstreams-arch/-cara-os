import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VolunteerRecord } from "@/types/extended";

const KEY = "volunteer-records";

export function useVolunteerRecords() {
  return useQuery<{ data: VolunteerRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/volunteer-records").then((r) => r.json()),
  });
}

export function useCreateVolunteerRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VolunteerRecord>) =>
      fetch("/api/v1/volunteer-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
