"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { useCareEventsRealtime } from "@/hooks/use-care-events-realtime";
import { useAuthContext } from "@/contexts/auth-context";

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
      {children}
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
        <div className="flex min-h-screen bg-[#f7f8fa]">
          <Sidebar />
          <PlatformContent>{children}</PlatformContent>
          <BottomNav />
          <KeyboardShortcuts />
          <RealtimeSubscriptions />
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
