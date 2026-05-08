import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FamilyRelationshipRecord } from "@/types/extended";

const KEY = "family-relationship-records";

export function useFamilyRelationshipRecords() {
  return useQuery<{ data: FamilyRelationshipRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/family-relationship-records").then((r) => r.json()),
  });
}

export function useCreateFamilyRelationshipRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FamilyRelationshipRecord>) =>
      fetch("/api/v1/family-relationship-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
