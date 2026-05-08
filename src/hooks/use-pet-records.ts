import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PetRecord } from "@/types/extended";

const KEY = "pet-records";
const API = "/api/v1/pet-records";

export function usePetRecords() {
  return useQuery<{ data: PetRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreatePetRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PetRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePetRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PetRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
