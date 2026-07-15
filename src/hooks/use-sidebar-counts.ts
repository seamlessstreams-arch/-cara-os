"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SIDEBAR BADGE COUNTS
// Polls key API endpoints to keep sidebar badges live.
// Refetches every 60 s; stale for 30 s so navigating between pages is instant.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { currentUserId } from "@/lib/auth/current-user";

function userId(): string {
  if (typeof window === "undefined") return "staff_darren";
  return currentUserId();
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
  /** Unread notifications count */
  notifications: number;
  /** Care events awaiting manager review */
  care_events_review: number;
  /** Live action items needing the user (emergencies / acks / staffing / sign-offs) */
  action_center: number;
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

  const notifsQ = useQuery<Notification[] | null>({
    queryKey: ["sidebar", "notifications"],
    queryFn: () => get(`/api/v1/notifications?recipient_id=${userId()}&unread_only=true`),
    ...OPTS,
  });

  const careEventsReviewQ = useQuery<{ meta: { status_counts: Record<string, number> } } | null>({
    queryKey: ["sidebar", "care-events-review"],
    queryFn: () => get("/api/v1/care-events?status=manager_review_required&limit=1"),
    ...OPTS,
  });

  const actionCenterQ = useQuery<{ data: { total: number } } | null>({
    queryKey: ["sidebar", "action-center"],
    queryFn: () => get("/api/v1/action-center"),
    ...OPTS,
  });

  // Show overdue + urgent for tasks — the most actionable number
  const taskOverdue = tasksQ.data?.meta?.overdue ?? 0;
  const taskUrgent  = tasksQ.data?.meta?.urgent  ?? 0;

  return {
    tasks:              Math.max(taskOverdue, taskUrgent),
    incidents:          incidentsQ.data?.meta?.open          ?? 0,
    forms:              formsQ.data?.meta?.pending_review    ?? 0,
    notifications:      Array.isArray(notifsQ.data) ? notifsQ.data.length : 0,
    care_events_review: careEventsReviewQ.data?.meta?.status_counts?.manager_review_required ?? 0,
    action_center:      actionCenterQ.data?.data?.total ?? 0,
  };
}
