"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UtilityBill } from "@/types/extended";

const KEY = "utility-bills";

export function useUtilityBills(homeId?: string) {
  const qs = homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: UtilityBill[] }>({
    queryKey: [KEY, homeId],
    queryFn: () => fetch(`/api/v1/utility-bills${qs}`).then((r) => r.json()),
  });
}

export function useCreateUtilityBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UtilityBill>) =>
      fetch("/api/v1/utility-bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
