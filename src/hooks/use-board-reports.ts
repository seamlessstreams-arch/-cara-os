"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BoardReport } from "@/types/extended";

const KEY = "board-reports";

export function useBoardReports() {
  return useQuery<{ data: BoardReport[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/board-reports").then((r) => r.json()),
  });
}

export function useCreateBoardReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BoardReport>) =>
      fetch("/api/v1/board-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
