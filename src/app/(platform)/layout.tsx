"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { PrivacyProvider } from "@/contexts/privacy-context";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { useCareEventsRealtime } from "@/hooks/use-care-events-realtime";
import { useAuthContext } from "@/contexts/auth-context";
import { CaraGlobalButton } from "@/components/cara/cara-global-button";
import { QuickCreateFab } from "@/components/common/quick-create-fab";
import { PrivacyScreenOverlay } from "@/components/privacy/privacy-screen-overlay";
import { PrivacyToggle } from "@/components/privacy/privacy-toggle";
import { GlobalEmergencyBanner } from "@/components/staffing/global-emergency-banner";
import { GlobalStaffingBanner } from "@/components/staffing/global-staffing-banner";

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
        <PrivacyProvider>
          <div className="flex min-h-screen bg-[#f7f8fa]">
            <Sidebar />
            <PlatformContent>{children}</PlatformContent>
            <BottomNav />
            <KeyboardShortcuts />
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
