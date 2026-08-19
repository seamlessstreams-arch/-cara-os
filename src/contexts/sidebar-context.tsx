"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useClientValue } from "@/hooks/use-client-value";

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
  // null = the user has not toggled yet, so the tablet default applies.
  // Deriving (rather than an effect writing the default into state) means no
  // second render on mount and the user's explicit choice always wins.
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  const tabletDefault = useClientValue(() => window.innerWidth < 1024, false);
  const collapsed = userCollapsed ?? tabletDefault;
  const setCollapsed = (v: boolean) => setUserCollapsed(v);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile breakpoint
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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
