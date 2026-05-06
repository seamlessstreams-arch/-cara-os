import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HomeworkSession } from "@/types/extended";

const KEY = "homework-sessions";

export function useHomeworkSessions(childId?: string) {
  return useQuery<{ data: HomeworkSession[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: async () => {
      const params = childId ? `?child_id=${childId}` : "";
      const res = await fetch(`/api/v1/homework-sessions${params}`);
      return res.json();
    },
  });
}

export function useCreateHomeworkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<HomeworkSession>) => {
      const res = await fetch("/api/v1/homework-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
