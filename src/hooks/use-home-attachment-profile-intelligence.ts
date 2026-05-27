"use client";

import { useQuery } from "@tanstack/react-query";
import type { AttachmentProfileResult } from "@/lib/engines/home-attachment-profile-intelligence-engine";

export function useHomeAttachmentProfileIntelligence() {
  return useQuery<AttachmentProfileResult>({
    queryKey: ["home-attachment-profile-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-attachment-profile-intelligence");
      if (!res.ok) throw new Error("Failed to fetch attachment profile intelligence");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });
}
