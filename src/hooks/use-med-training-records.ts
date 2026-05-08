import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedTrainingRecord } from "@/types/extended";

const KEY = "med-training-records";
const API = "/api/v1/med-training-records";

export function useMedTrainingRecords() {
  return useQuery<{ data: MedTrainingRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateMedTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedTrainingRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedTrainingRecord> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
