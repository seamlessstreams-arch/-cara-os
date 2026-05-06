import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FoodHygieneRecord } from "@/types/extended";

const KEY = "food-hygiene-records";
const API = "/api/v1/food-hygiene-records";

export function useFoodHygieneRecords() {
  return useQuery<{ data: FoodHygieneRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateFoodHygieneRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FoodHygieneRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFoodHygieneRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FoodHygieneRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
