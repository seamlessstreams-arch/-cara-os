"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextValue {
  collapsed:    boolean;
  setCollapsed: (v: boolean) => void;
  isMobile:     boolean;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed:    false,
  setCollapsed: () => {},
  isMobile:     false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile breakpoint
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-collapse on tablet (md–lg) on first mount only
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
