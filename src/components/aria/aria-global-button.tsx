"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ARIA GLOBAL BUTTON
//
// A floating Sparkles button that appears on every platform page and opens
// the AriaDrawer with context inferred from the current URL.
//
// Drop into the platform layout once; ARIA is then available everywhere.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AriaDrawer, type AriaSourceType, type AriaDrawerContext } from "@/components/aria/aria-drawer";

// ─── URL → context inference ──────────────────────────────────────────────────

function inferContext(pathname: string): AriaDrawerContext {
  const seg = pathname.split("/").filter(Boolean);
  const top = seg[0] ?? "";
  const sub = seg[1] ?? "";

  // Page-title mapping (first segment)
  const PAGE_TITLES: Record<string, string> = {
    "daily-log": "Daily Log",
    incidents: "Incidents",
    safeguarding: "Safeguarding",
    "care-plans": "Care Plans",
    "behaviour-support-plans": "Behaviour Support Plans",
    "risk-assessment": "Risk Assessment",
    medication: "Medication",
    "missing-episodes": "Missing Episodes",
    "key-work": "Key Work Sessions",
    contacts: "Contact Log",
    "family-time": "Family Time",
    health: "Health Records",
    education: "Education",
    "management-oversight": "Management Oversight",
    "regulation-45": "Regulation 45",
    "regulation-44": "Regulation 44",
    "annex-a": "Annex A",
    audits: "Audits",
    supervision: "Supervision",
    recruitment: "Recruitment",
    staff: "Staff Record",
    "workforce": "Workforce",
    documents: "Documents",
    tasks: "Tasks",
    calendar: "Calendar",
    complaints: "Complaints",
    "children": "Children's Records",
    "young-people": "Young People",
    "placement-plans": "Placement Plans",
    "independence": "Independence & Life Skills",
    "after-care": "After Care",
  };

  // Source type mapping
  const SOURCE_TYPES: Record<string, AriaSourceType> = {
    incidents: "incident",
    safeguarding: "child_record",
    "care-plans": "care_plan",
    "behaviour-support-plans": "child_record",
    "risk-assessment": "child_record",
    medication: "medication",
    "missing-episodes": "child_record",
    contacts: "contact_log",
    "family-time": "contact_log",
    "regulation-45": "reg45",
    "regulation-44": "reg45",
    "annex-a": "reg45",
    complaints: "complaint",
    "pi-debrief": "pi_debrief",
    "positive-handling": "pi_debrief",
    staff: "staff",
    workforce: "staff",
    "care-events": "child_record",
    documents: "document",
  };

  const pageTitle = PAGE_TITLES[top] ?? toTitle(top);
  const sourceType: AriaSourceType = SOURCE_TYPES[top] ?? "general";

  // Extract child name hint from sub-path (often a UUID, skip those)
  const isUuid = /^[0-9a-f-]{20,}$/i.test(sub);
  const subLabel = !isUuid && sub ? toTitle(sub.replace(/-/g, " ")) : undefined;

  return {
    pageTitle: subLabel ? `${pageTitle} — ${subLabel}` : pageTitle,
    sourceType,
  };
}

function toTitle(s: string): string {
  if (!s) return "Cornerstone";
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AriaGlobalButton({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const context = inferContext(pathname);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  // Don't render the global button on the ARIA-specific pages — they have
  // their own more detailed ARIA UI already.
  if (pathname.startsWith("/aria/")) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={handleOpen}
        aria-label="Open ARIA assistant"
        className={cn(
          // Position: fixed bottom-right, above BottomNav (72px) on mobile
          "fixed bottom-[88px] right-4 z-40",
          "md:bottom-6 md:right-6",
          // Appearance
          "flex h-12 w-12 items-center justify-center rounded-full",
          "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30",
          "hover:bg-indigo-700 hover:shadow-indigo-700/40 hover:scale-105",
          "active:scale-95 transition-all duration-150",
          // Accessibility
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
          className,
        )}
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Drawer */}
      <AriaDrawer open={open} onClose={handleClose} context={context} />
    </>
  );
}
