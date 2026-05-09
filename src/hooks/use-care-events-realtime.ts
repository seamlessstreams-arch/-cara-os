"use client";

/**
 * Realtime subscription for care events using Supabase Realtime.
 *
 * When Supabase is configured, subscribes to postgres_changes on the
 * care_events table and invalidates the React Query cache on any change.
 *
 * Falls back silently to the existing polling interval in use-care-events.ts
 * when Supabase is not configured or the client is unavailable.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const isRealtimeEnabled =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabasePublishableKey === "string" &&
  supabasePublishableKey.length > 0;

/**
 * Subscribe to live care event changes.
 *
 * Call once at an appropriate layout level — e.g. inside the care events page
 * or the platform layout. Multiple mounts are safe (each creates its own
 * channel and removes it on unmount).
 *
 * @param homeId  Supabase home UUID used to scope the filter.
 */
export function useCareEventsRealtime(homeId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!isRealtimeEnabled) return;

    const client = createClient(supabaseUrl!, supabasePublishableKey!);

    const filter = homeId
      ? `home_id=eq.${homeId}`
      : undefined;

    const channel = client
      .channel("care_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "care_events",
          ...(filter ? { filter } : {}),
        },
        () => {
          // Invalidate all care-events queries so lists and detail views refresh
          queryClient.invalidateQueries({ queryKey: ["care-events"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "care_event_routes",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["care-events"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reg45_evidence_queue",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reg45"] });
          queryClient.invalidateQueries({ queryKey: ["annex-a"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "oversight_tasks",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["management-oversight"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "annex_a_evidence_queue",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["annex-a"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "child_daily_summaries",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["child-daily-summaries"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "filing_cabinet_items",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["filing-cabinet"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ofsted_inspections",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inspection-history"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "care_event_jobs",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["care-event-jobs"] });
          // Jobs affect care event status display
          queryClient.invalidateQueries({ queryKey: ["care-events"] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      client.removeChannel(channel);
    };
  }, [queryClient, homeId]);
}
