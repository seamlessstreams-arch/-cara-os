import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CaseFileAudit } from "@/types/extended";

const KEY = "case-file-audits";

export function useCaseFileAudits() {
  return useQuery<{ data: CaseFileAudit[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/case-file-audits").then((r) => r.json()),
  });
}

export function useCreateCaseFileAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaseFileAudit>) =>
      fetch("/api/v1/case-file-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
