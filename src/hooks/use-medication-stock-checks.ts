import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedicationStockCheck } from "@/types/extended";

const KEY = "medication-stock-checks";
const API = "/api/v1/medication-stock-checks";

export function useMedicationStockChecks() {
  return useQuery<{ data: MedicationStockCheck[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateMedicationStockCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationStockCheck>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedicationStockCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationStockCheck> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
