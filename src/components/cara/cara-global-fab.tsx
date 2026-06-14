"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraGlobalFab
//
// Floating action button that provides global Cara access across the platform.
// Appears at the bottom-right of every page. Opens a slide-out drawer with
// the CaraCommandPanel. Permission-controlled: hidden for users without
// cara.use.
//
// Placed in the platform layout so it's available everywhere.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { CaraCommandPanel } from "./cara-command-panel";

// ── Detect current module from pathname ────────────────────────────────────

function moduleFromPath(path: string): string | undefined {
  const segments = path.split("/").filter(Boolean);
  const moduleMap: Record<string, string> = {
    "daily-log": "daily_log",
    "shift-records": "shift",
    "shift-summary": "shift_summary",
    incidents: "incident",
    safeguarding: "safeguarding",
    "key-working": "key_work",
    supervision: "supervision",
    "house-meetings": "team_meeting",
    "team-meetings": "team_meeting",
    recruitment: "safer_recruitment",
    "safer-recruitment-tracker": "safer_recruitment",
    workforce: "hr",
    "staff-development": "hr",
    medication: "health",
    "risk-assessments": "risk_assessment",
    "placement-plans": "placement_plan",
    "behaviour-support": "behaviour_support_plan",
    "family-time": "family_time",
    "family-time-supervision": "family_time",
    education: "education",
    health: "health",
    independence: "independence",
    "independence-pathway": "independence",
    audits: "audit",
    calendar: "calendar",
    documents: "documents",
    "management-oversight": "management_oversight",
    "provider-oversight": "ri_dashboard",
    "kpi-dashboard": "ri_dashboard",
    "outcomes-dashboard": "quality_assurance",
    children: "child_record",
    buildings: "management_oversight",
  };

  for (const segment of segments) {
    if (moduleMap[segment]) return moduleMap[segment];
  }
  return undefined;
}

// ── Component ──────────────────────────────────────────────────────────────

export function CaraGlobalFab() {
  const [open, setOpen] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | undefined>();

  // Track pathname changes
  useEffect(() => {
    setCurrentModule(moduleFromPath(window.location.pathname));
    const handlePopState = () => {
      setCurrentModule(moduleFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Also update on Next.js navigation (MutationObserver on <title>)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentModule(moduleFromPath(window.location.pathname));
    });
    const titleEl = document.querySelector("title");
    if (titleEl) {
      observer.observe(titleEl, { childList: true });
    }
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bottom-20 right-4 md:bottom-6 md:right-6",
          "h-12 w-12 md:h-14 md:w-14",
          open
            ? "bg-[var(--cs-text-secondary)] text-white rotate-45"
            : "bg-[var(--cs-navy)] text-white hover:scale-105",
        )}
        aria-label={open ? "Close Cara" : "Open Cara assistant"}
      >
        {open ? (
          <X className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </button>

      {/* Drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed z-40 transition-transform duration-300 ease-in-out",
          "bottom-0 right-0 h-[80vh] w-full md:bottom-24 md:right-6 md:h-auto md:max-h-[70vh] md:w-[380px]",
          "rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden",
          open ? "translate-y-0 md:translate-y-0" : "translate-y-full md:translate-y-[120%]",
        )}
      >
        <CaraCommandPanel
          module={currentModule}
          defaultCollapsed={false}
          className="h-full overflow-y-auto"
        />
      </div>
    </>
  );
}
