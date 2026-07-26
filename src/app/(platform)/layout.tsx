"use client";

import React, { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { PrivacyProvider } from "@/contexts/privacy-context";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { CommandPalette } from "@/components/layout/command-palette";
import { useAuthContext } from "@/contexts/auth-context";
import { CaraGlobalButton } from "@/components/cara/cara-global-button";
import { QuickCreateFab } from "@/components/common/quick-create-fab";
import { PrivacyScreenOverlay } from "@/components/privacy/privacy-screen-overlay";
import { PrivacyToggle } from "@/components/privacy/privacy-toggle";
import { GlobalEmergencyBanner } from "@/components/staffing/global-emergency-banner";
import { GlobalStaffingBanner } from "@/components/staffing/global-staffing-banner";
import { PageTransition } from "@/components/layout/page-transition";

/**
 * Realtime subscription for care events using Supabase Realtime.
 *
 * When Supabase is configured, subscribes to postgres_changes on the
 * care_events table and invalidates the React Query cache on any change.
 *
 * Falls back silently to the existing polling interval in use-care-events.ts
 * when Supabase is not configured or the client is unavailable.
 */

const realtimeSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Publishable-or-anon, same fallback as client.ts — with only the legacy anon
// key set, realtime silently disabled itself while the rest of the app worked.
const realtimeSupabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isRealtimeEnabled =
  typeof realtimeSupabaseUrl === "string" &&
  realtimeSupabaseUrl.length > 0 &&
  typeof realtimeSupabasePublishableKey === "string" &&
  realtimeSupabasePublishableKey.length > 0;

/**
 * Subscribe to live care event changes.
 *
 * Call once at an appropriate layout level — e.g. inside the care events page
 * or the platform layout. Multiple mounts are safe (each creates its own
 * channel and removes it on unmount).
 *
 * @param homeId  Supabase home UUID used to scope the filter.
 */
function useCareEventsRealtime(homeId?: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!isRealtimeEnabled) return;

    const client = createClient(realtimeSupabaseUrl!, realtimeSupabasePublishableKey!);

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

function RealtimeSubscriptions() {
  const { currentUser } = useAuthContext();
  useCareEventsRealtime(currentUser?.home_id);
  return null;
}

function PlatformContent({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar();
  return (
    <div
      className="flex-1 min-w-0 transition-all duration-300 ease-in-out pb-[72px] md:pb-0"
      style={{ marginLeft: isMobile ? 0 : collapsed ? 64 : 256 }}
    >
      <div className="sticky top-0 z-40">
        <GlobalEmergencyBanner />
        <GlobalStaffingBanner />
      </div>
      <PageTransition>{children}</PageTransition>
    </div>
  );
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <PrivacyProvider>
          <div className="flex min-h-screen bg-[var(--cs-bg)]">
            <Sidebar />
            <PlatformContent>{children}</PlatformContent>
            <BottomNav />
            <KeyboardShortcuts />
            <CommandPalette />
            <RealtimeSubscriptions />
            <CaraGlobalButton />
            <QuickCreateFab />
            <PrivacyToggle />
            <PrivacyScreenOverlay />
          </div>
        </PrivacyProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
