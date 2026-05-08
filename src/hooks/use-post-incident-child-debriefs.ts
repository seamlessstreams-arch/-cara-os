import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PostIncidentChildDebrief } from "@/types/extended";

export function usePostIncidentChildDebriefs(childId?: string) {
  return useQuery<PostIncidentChildDebrief[]>({
    queryKey: ["post-incident-child-debriefs", childId],
    queryFn: async () => {
      const params = childId ? `?child_id=${childId}` : "";
      const res = await fetch(`/api/v1/post-incident-child-debriefs${params}`);
      if (!res.ok) throw new Error("Failed to fetch post-incident child debriefs");
      return res.json();
    },
  });
}

export function useCreatePostIncidentChildDebrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PostIncidentChildDebrief>) => {
      const res = await fetch("/api/v1/post-incident-child-debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create post-incident child debrief");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post-incident-child-debriefs"] }),
  });
}
