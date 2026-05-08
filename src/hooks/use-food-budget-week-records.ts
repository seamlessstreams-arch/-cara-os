import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FoodBudgetWeekRecord } from "@/types/extended";

const KEY = "food-budget-week-records";
const API = "/api/v1/food-budget-week-records";

export function useFoodBudgetWeekRecords() {
  return useQuery<{ data: FoodBudgetWeekRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateFoodBudgetWeekRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FoodBudgetWeekRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFoodBudgetWeekRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FoodBudgetWeekRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
