"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CONTEXT
//
// Provides the currently selected home and a switcher to all client components.
// Persists the choice in localStorage so it survives page reloads.
//
// In production, replace localStorage with a server-side session claim
// so API routes can also scope by home without a query param.
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  HOMES,
  getHomeById,
  getActiveHomes,
  type CornerstoneHome,
} from "@/lib/homes/home-registry";

const STORAGE_KEY = "cs_current_home";
const DEFAULT_HOME_ID = "home_oak";

export interface HomeContextValue {
  /** The currently selected home. */
  currentHome: CornerstoneHome;
  /** All homes the user may switch between. */
  availableHomes: CornerstoneHome[];
  /** Switch the active home by ID. */
  setCurrentHome: (id: string) => void;
}

const HomeContext = createContext<HomeContextValue>({
  currentHome: HOMES[0],
  availableHomes: getActiveHomes(),
  setCurrentHome: () => {},
});

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const [homeId, setHomeId] = useState<string>(DEFAULT_HOME_ID);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    if (stored && getHomeById(stored)) {
      setHomeId(stored);
    }
  }, []);

  const currentHome = getHomeById(homeId) ?? HOMES[0];
  const availableHomes = getActiveHomes();

  const switchHome = useCallback((id: string) => {
    const target = getHomeById(id);
    if (!target) return;
    setHomeId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  return (
    <HomeContext.Provider
      value={{ currentHome, availableHomes, setCurrentHome: switchHome }}
    >
      {children}
    </HomeContext.Provider>
  );
}

export function useHomeContext(): HomeContextValue {
  return useContext(HomeContext);
}
