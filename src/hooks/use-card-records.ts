"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CardRecord } from "@/types/extended";

const KEY = "card-records";

export function useCardRecords(childId?: string) {
  const qs = childId ? `?child_id=${childId}` : "";
  return useQuery<{ data: CardRecord[] }>({
    queryKey: [KEY, childId],
    queryFn: () => fetch(`/api/v1/card-records${qs}`).then((r) => r.json()),
  });
}

export function useCreateCardRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CardRecord>) =>
      fetch("/api/v1/card-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
