import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WindowCheck } from "@/types/extended";

const KEY = "window-checks";

export function useWindowChecks() {
  return useQuery<{ data: WindowCheck[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/window-checks").then((r) => r.json()),
  });
}

export function useCreateWindowCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WindowCheck>) =>
      fetch("/api/v1/window-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
