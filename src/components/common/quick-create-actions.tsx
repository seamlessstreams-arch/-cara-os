"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUICK CREATE ACTIONS
// Toolbar trigger component rendered in every page header.
// Opens QuickCreateModal pre-configured for the current module.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Plus, CheckSquare, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { QuickCreateModal, type QuickCreateContext } from "./quick-create-modal";

interface QuickCreateActionsProps {
  context?: QuickCreateContext;
  /** Compact mode — icon only, no label (for tight headers) */
  compact?: boolean;
  className?: string;
}

export function QuickCreateActions({ context, compact = false, className }: QuickCreateActionsProps) {
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"task" | "form">("task");
  const [showMenu, setShowMenu] = useState(false);

  const canCreateTask = can(PERMISSIONS.CREATE_TASKS);
  const canCreateForm = can(PERMISSIONS.CREATE_FORMS);

  // The page's preferred primary tab (falls back to "task")
  const preferred: "task" | "form" = context?.preferredTab ?? "task";

  // Nothing to show if no permissions at all
  if (!canCreateTask && !canCreateForm) return null;

  // If only one permission — render a single button, no dropdown
  if (canCreateTask && !canCreateForm) {
    return (
      <>
        <Button
          size="sm"
          onClick={() => { setDefaultTab("task"); setOpen(true); }}
          className={cn("gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm", className)}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          {!compact && <span>New Task</span>}
        </Button>
        <QuickCreateModal open={open} onClose={() => setOpen(false)} context={context} defaultTab="task" />
      </>
    );
  }

  if (!canCreateTask && canCreateForm) {
    return (
      <>
        <Button
          size="sm"
          onClick={() => { setDefaultTab("form"); setOpen(true); }}
          className={cn("gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm", className)}
        >
          <FileText className="h-3.5 w-3.5" />
          {!compact && <span>New Form</span>}
        </Button>
        <QuickCreateModal open={open} onClose={() => setOpen(false)} context={context} defaultTab="form" />
      </>
    );
  }

  // Both permissions — split button. Label and icon adapt to the page's preferred tab.
  const primaryIsForm = preferred === "form";
  const PrimaryIcon = primaryIsForm ? FileText : CheckSquare;
  const primaryLabel = primaryIsForm ? "New Form" : "New Task";
  const primaryColor = primaryIsForm
    ? "bg-violet-600 hover:bg-violet-700 border-violet-700"
    : "bg-blue-600 hover:bg-blue-700 border-blue-700";

  return (
    <>
      <div className={cn("flex items-center", className)}>
        {/* Primary "New" button — label reflects the page's preferred creation type */}
        <Button
          size="sm"
          onClick={() => { setDefaultTab(preferred); setOpen(true); }}
          className={cn("gap-1.5 text-white shadow-sm rounded-r-none border-r", primaryColor)}
        >
          <PrimaryIcon className="h-3.5 w-3.5" />
          {!compact && <span>{primaryLabel}</span>}
        </Button>

        {/* Dropdown chevron — matches primary button colour */}
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setShowMenu((v) => !v)}
            className={cn("text-white shadow-sm rounded-l-none px-1.5", primaryIsForm ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700")}
            aria-label="Choose creation type"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMenu && "rotate-180")} />
          </Button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
                aria-hidden="true"
              />

              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                <button
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => { setDefaultTab("task"); setShowMenu(false); setOpen(true); }}
                >
                  <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                  New Task
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => { setDefaultTab("form"); setShowMenu(false); setOpen(true); }}
                >
                  <FileText className="h-3.5 w-3.5 text-violet-500" />
                  New Form
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <QuickCreateModal
        open={open}
        onClose={() => setOpen(false)}
        context={context}
        defaultTab={defaultTab}
      />
    </>
  );
}
