"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR data hooks
// ══════════════════════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent, CalendarFeed, CalendarSource } from "@/lib/calendar/calendar-types";

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.data as T;
}

export interface CalendarQuery {
  from: string;
  to: string;
  sources?: CalendarSource[];
}

export function useCalendarFeed(q: CalendarQuery) {
  const params = new URLSearchParams({ from: q.from, to: q.to });
  if (q.sources && q.sources.length) params.set("sources", q.sources.join(","));
  return useQuery({
    queryKey: ["calendar-feed", q.from, q.to, (q.sources ?? []).join(",")],
    queryFn: () => jfetch<CalendarFeed>(`/api/v1/calendar?${params.toString()}`),
  });
}

function useInvalidateCalendar() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["calendar-feed"] }),
      qc.invalidateQueries({ queryKey: ["calendar-event"] }),
    ]);
}

export interface CreateEventBody {
  title: string;
  description?: string;
  event_type?: string;
  start: string;
  end?: string | null;
  all_day?: boolean;
  location?: string | null;
  child_id?: string | null;
  organiser_id?: string;
  attendees?: { kind: "staff" | "external"; name: string; email?: string | null; staff_id?: string | null }[];
  reminder_minutes_before?: number | null;
  recurrence?: { freq: "daily" | "weekly" | "fortnightly" | "monthly"; interval?: number; until?: string | null; count?: number | null } | null;
  tasks?: { title: string; due_date?: string | null }[];
}

export function useCreateCalendarEvent() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (body: CreateEventBody) =>
      jfetch<{ event: CalendarEvent }>("/api/v1/calendar", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateCalendarEvent(id: string) {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      jfetch<{ event: CalendarEvent }>(`/api/v1/calendar/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => invalidate(),
  });
}

export function useCancelCalendarEvent() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (id: string) => jfetch<{ event: CalendarEvent }>(`/api/v1/calendar/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(),
  });
}

export interface InviteResult {
  event: CalendarEvent;
  notified_staff: number;
  mailto: string;
  ics_url: string;
}

export function useSendInvite() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (id: string) => jfetch<InviteResult>(`/api/v1/calendar/${id}/invite`, { method: "POST" }),
    onSuccess: () => invalidate(),
  });
}

export function useEventDetail(id: string | null) {
  return useQuery({
    queryKey: ["calendar-event", id],
    queryFn: () => jfetch<{ event: CalendarEvent }>(`/api/v1/calendar/${id}`),
    enabled: Boolean(id),
  });
}
