"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { AriaGlobalFab } from "@/components/aria/aria-global-fab";
import { AriaCommandPalette } from "@/components/aria/aria-command-palette";

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
        <div className="flex min-h-screen" style={{ background: 'var(--cs-bg)' }}>
          <Sidebar />
          <PlatformContent>{children}</PlatformContent>
          <BottomNav />
          <KeyboardShortcuts />
          <AriaGlobalFab />
          <AriaCommandPalette />
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
