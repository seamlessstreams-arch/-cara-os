"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIDEBAR BADGE COUNTS
// Polls key API endpoints to keep sidebar badges live.
// Refetches every 60 s; stale for 30 s so navigating between pages is instant.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";

function userId(): string {
  if (typeof window === "undefined") return "staff_darren";
  try { return localStorage.getItem("cs_user_id") ?? "staff_darren"; } catch { return "staff_darren"; }
}

const OPTS = { refetchInterval: 60_000, staleTime: 30_000 };

function get(url: string) {
  return fetch(url, { headers: { "X-User-Id": userId() } }).then((r) =>
    r.ok ? r.json() : null
  );
}

export interface SidebarCounts {
  /** Overdue (past due + not completed) task count */
  tasks: number;
  /** Open incident count */
  incidents: number;
  /** Care forms currently awaiting review/approval */
  forms: number;
}

export function useSidebarCounts(): SidebarCounts {
  const tasksQ = useQuery<{ meta: { overdue: number; urgent: number } } | null>({
    queryKey: ["sidebar", "tasks"],
    queryFn: () => get("/api/v1/tasks"),
    ...OPTS,
  });

  const incidentsQ = useQuery<{ meta: { open: number } } | null>({
    queryKey: ["sidebar", "incidents"],
    queryFn: () => get("/api/v1/incidents"),
    ...OPTS,
  });

  const formsQ = useQuery<{ meta: { pending_review: number } } | null>({
    queryKey: ["sidebar", "forms"],
    queryFn: () => get("/api/v1/forms"),
    ...OPTS,
  });

  // Show overdue + urgent for tasks — the most actionable number
  const taskOverdue = tasksQ.data?.meta?.overdue ?? 0;
  const taskUrgent  = tasksQ.data?.meta?.urgent  ?? 0;

  return {
    tasks:     Math.max(taskOverdue, taskUrgent), // pick the larger attention signal
    incidents: incidentsQ.data?.meta?.open          ?? 0,
    forms:     formsQ.data?.meta?.pending_review    ?? 0,
  };
}
