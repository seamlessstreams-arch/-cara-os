import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FireRiskItem } from "@/types/extended";

const KEY = "fire-risk-items";
const API = "/api/v1/fire-risk-items";

export function useFireRiskItems() {
  return useQuery<{ data: FireRiskItem[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateFireRiskItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FireRiskItem>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFireRiskItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FireRiskItem> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
