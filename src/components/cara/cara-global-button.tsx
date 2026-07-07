"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Cara GLOBAL BUTTON
//
// A floating Sparkles button that appears on every platform page and opens
// the CaraDrawer with context inferred from the current URL.
//
// Drop into the platform layout once; Cara is then available everywhere.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CaraDrawer, type CaraSourceType, type CaraDrawerContext } from "@/components/cara/cara-drawer";

// ─── URL → context inference ──────────────────────────────────────────────────

function inferContext(pathname: string): CaraDrawerContext {
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
  const SOURCE_TYPES: Record<string, CaraSourceType> = {
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
  const sourceType: CaraSourceType = SOURCE_TYPES[top] ?? "general";

  // Extract child name hint from sub-path (often a UUID, skip those)
  const isUuid = /^[0-9a-f-]{20,}$/i.test(sub);
  const subLabel = !isUuid && sub ? toTitle(sub.replace(/-/g, " ")) : undefined;

  return {
    pageTitle: subLabel ? `${pageTitle} — ${subLabel}` : pageTitle,
    sourceType,
  };
}

function toTitle(s: string): string {
  if (!s) return "Cara";
  return s
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CaraGlobalButton({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const context = inferContext(pathname);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  // Don't render the global button on the Cara-specific pages — they have
  // their own more detailed Cara UI already.
  if (pathname.startsWith("/cara/")) return null;

  return (
    <>
      {/* Floating Ask CARA presence — the same spark as the Ask CARA screen,
          docked on every page so the assistant is always one tap away. */}
      <button
        onClick={handleOpen}
        aria-label="Open Ask CARA"
        className={cn(
          // Position: fixed bottom-right, above BottomNav (72px) on mobile
          "group fixed bottom-[88px] right-4 z-40 md:bottom-6 md:right-6",
          // Appearance — dark pill carrying the gradient spark
          "flex items-center gap-2.5 rounded-full py-2 pl-2 pr-3 md:pr-5",
          "border border-white/10 text-white",
          "shadow-[0_16px_40px_-8px_rgba(99,102,241,0.55)]",
          "transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b93ff]",
          className,
        )}
        style={{ background: "linear-gradient(135deg, #111a30 0%, #1a2350 100%)" }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full cara-spark-pulse">
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
            <defs>
              <linearGradient id="cara-fab-spark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2dd4bf" />
                <stop offset="0.5" stopColor="#60a5fa" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path d="M12 0C13.4 6.9 17.1 10.6 24 12C17.1 13.4 13.4 17.1 12 24C10.6 17.1 6.9 13.4 0 12C6.9 10.6 10.6 6.9 12 0Z" fill="url(#cara-fab-spark)" />
          </svg>
        </span>
        <span className="hidden text-[13.5px] font-semibold tracking-tight md:inline">Ask CARA</span>
      </button>

      {/* Drawer */}
      <CaraDrawer open={open} onClose={handleClose} context={context} />
    </>
  );
}
