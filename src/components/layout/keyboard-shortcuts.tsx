"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEYBOARD SHORTCUTS OVERLAY
// Press '?' from anywhere to see available keyboard shortcuts.
// Provides rapid navigation for power users — especially managers who
// need to move quickly between pages during a busy shift.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Keyboard, X } from "lucide-react";

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string; action?: () => void }[];
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const groups: ShortcutGroup[] = [
    {
      label: "Navigation",
      shortcuts: [
        { keys: ["G", "D"], description: "Go to Dashboard", action: () => router.push("/dashboard") },
        { keys: ["G", "T"], description: "Go to Tasks", action: () => router.push("/tasks") },
        { keys: ["G", "I"], description: "Go to Incidents", action: () => router.push("/incidents") },
        { keys: ["G", "L"], description: "Go to Daily Log", action: () => router.push("/daily-log") },
        { keys: ["G", "M"], description: "Go to Medication", action: () => router.push("/medication") },
        { keys: ["G", "R"], description: "Go to Rota", action: () => router.push("/rota") },
        { keys: ["G", "H"], description: "Go to Handover", action: () => router.push("/handover") },
        { keys: ["G", "S"], description: "Go to Safeguarding", action: () => router.push("/safeguarding") },
        { keys: ["G", "Y"], description: "Go to Young People", action: () => router.push("/young-people") },
        { keys: ["G", "F"], description: "Go to Staff", action: () => router.push("/dashboard/staff") },
        { keys: ["G", "W"], description: "Go to Welfare Checks", action: () => router.push("/welfare-checks") },
        { keys: ["G", "O"], description: "Go to Outcomes", action: () => router.push("/outcomes") },
      ],
    },
    {
      label: "Actions",
      shortcuts: [
        { keys: ["⌘", "K"], description: "Open command palette (search everything)" },
        { keys: ["⌘", "J"], description: "Quick create (record anything)" },
        { keys: ["N"], description: "New entry (context-dependent)" },
        { keys: ["?"], description: "Show this help" },
      ],
    },
    {
      label: "Within lists",
      shortcuts: [
        { keys: ["J"], description: "Next item" },
        { keys: ["K"], description: "Previous item" },
        { keys: ["Enter"], description: "Open selected item" },
        { keys: ["Esc"], description: "Close modal / deselect" },
      ],
    },
  ];

  // ── "G then X" two-key sequence tracking ──────────────────────────────
  const [gPending, setGPending] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) {
      return;
    }

    // '?' opens help overlay
    if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      setOpen((v) => !v);
      return;
    }

    // Escape closes
    if (e.key === "Escape" && open) {
      setOpen(false);
      return;
    }

    // "G" starts a navigation sequence
    if (e.key === "g" && !e.metaKey && !e.ctrlKey && !open) {
      setGPending(true);
      setTimeout(() => setGPending(false), 1500); // reset after 1.5s
      return;
    }

    // Second key in "G then X" sequence
    if (gPending && !e.metaKey && !e.ctrlKey) {
      setGPending(false);
      const navGroup = groups[0];
      const match = navGroup.shortcuts.find(
        (s) => s.keys[1]?.toLowerCase() === e.key.toLowerCase(),
      );
      if (match?.action) {
        e.preventDefault();
        match.action();
      }
    }

    // "N" for new entry
    if (e.key === "n" && !e.metaKey && !e.ctrlKey && !open) {
      // Let the page handle this via its own listener
      return;
    }
  }, [open, gPending, groups, router]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-[var(--cs-shadow-elevated)] border border-[var(--cs-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cs-border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-[var(--cs-navy)]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-[var(--cs-text-secondary)]">{shortcut.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {shortcut.keys.map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <span className="text-[10px] text-[var(--cs-text-gentle)] mx-0.5">then</span>
                            )}
                            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-1.5 text-[11px] font-medium text-[var(--cs-text-secondary)] shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--cs-border-subtle)] bg-[var(--cs-surface)]">
          <p className="text-[11px] text-[var(--cs-text-muted)] text-center">
            Press <kbd className="inline-flex h-4 items-center rounded border border-[var(--cs-border)] bg-white px-1 text-[9px] font-medium text-[var(--cs-text-muted)] mx-0.5">?</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
