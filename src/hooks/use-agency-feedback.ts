"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AgencyFeedback } from "@/types/extended";

const KEY = "agency-feedback";

export function useAgencyFeedback() {
  return useQuery<{ data: AgencyFeedback[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/agency-feedback").then((r) => r.json()),
  });
}

export function useCreateAgencyFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AgencyFeedback>) =>
      fetch("/api/v1/agency-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
