import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImmunisationRecord } from "@/types/extended";

const KEY = "immunisation-records";

export function useImmunisationRecords(childId?: string) {
  return useQuery<{ data: ImmunisationRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: async () => {
      const params = childId ? `?child_id=${childId}` : "";
      const res = await fetch(`/api/v1/immunisation-records${params}`);
      return res.json();
    },
  });
}

export function useCreateImmunisationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ImmunisationRecord>) => {
      const res = await fetch("/api/v1/immunisation-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
