import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VisitorReport } from "@/types/extended";

const KEY = "visitor-reports";

export function useVisitorReports() {
  return useQuery<{ data: VisitorReport[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/visitor-reports").then((r) => r.json()),
  });
}

export function useCreateVisitorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VisitorReport>) =>
      fetch("/api/v1/visitor-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
