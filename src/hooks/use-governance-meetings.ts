import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GovernanceMeeting } from "@/types/extended";

const KEY = "governance-meetings";
const API = "/api/v1/governance-meetings";

export function useGovernanceMeetings() {
  return useQuery<{ data: GovernanceMeeting[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateGovernanceMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GovernanceMeeting>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateGovernanceMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GovernanceMeeting> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
