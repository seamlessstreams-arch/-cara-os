import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RegistrationChangeRecord } from "@/types/extended";

export function useRegistrationChangeRecords() {
  return useQuery<RegistrationChangeRecord[]>({
    queryKey: ["registration-change-records"],
    queryFn: () => fetch("/api/v1/registration-change-records").then((r) => r.json()),
  });
}

export function useCreateRegistrationChangeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RegistrationChangeRecord>) =>
      fetch("/api/v1/registration-change-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["registration-change-records"] }),
  });
}
