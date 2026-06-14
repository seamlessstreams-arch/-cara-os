"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraShortcutsGuide
//
// Help panel showing available Cara keyboard shortcuts and quick access
// methods. Triggered from the Cara FAB menu or via Cmd+Shift+A.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Command,
  Keyboard,
  Mic,
  Search,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface CaraShortcutsGuideProps {
  className?: string;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Global
  { keys: ["⌘", "K"], description: "Open Cara command palette", category: "Global" },
  { keys: ["⌘", "⇧", "A"], description: "Toggle this shortcuts guide", category: "Global" },
  { keys: ["Esc"], description: "Close any Cara overlay", category: "Global" },

  // Command panel
  { keys: ["⌘", "Enter"], description: "Generate with Cara", category: "Command Panel" },
  { keys: ["Tab"], description: "Cycle through commands", category: "Command Panel" },
  { keys: ["⌘", "⇧", "C"], description: "Copy generated text", category: "Command Panel" },

  // Approval
  { keys: ["⌘", "⇧", "Y"], description: "Approve output", category: "Approval" },
  { keys: ["⌘", "⇧", "N"], description: "Reject output", category: "Approval" },
  { keys: ["⌘", "⇧", "E"], description: "Edit before approving", category: "Approval" },

  // Voice
  { keys: ["⌘", "⇧", "M"], description: "Start/stop dictation", category: "Voice" },
];

export function CaraShortcutsGuide({ className }: CaraShortcutsGuideProps) {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut: Cmd+Shift+A
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  // Group by category
  const grouped = new Map<string, Shortcut[]>();
  for (const s of SHORTCUTS) {
    const group = grouped.get(s.category) ?? [];
    group.push(s);
    grouped.set(s.category, group);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Guide panel */}
      <div
        className={cn(
          "fixed right-6 top-[10%] z-50 w-80 rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white shadow-2xl overflow-hidden",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white border-b border-[var(--cs-cara-gold-soft)]">
          <div className="h-7 w-7 rounded-lg bg-[var(--cs-navy)] flex items-center justify-center">
            <Keyboard className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--cs-navy)]">
              Cara Shortcuts
            </div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">
              Keyboard shortcuts for quick access
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[var(--cs-border)]">
          {[...grouped.entries()].map(([category, shortcuts]) => (
            <div key={category} className="py-3 px-5">
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
                {category}
              </div>
              <div className="space-y-2">
                {shortcuts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-[var(--cs-text-secondary)]">
                      {s.description}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {s.keys.map((key, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-[22px] rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-center text-[10px] font-mono text-[var(--cs-text-muted)]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-5 py-2.5 border-t border-[var(--cs-border)] bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)]" />
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              Tip: Use{" "}
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 text-[9px] font-mono">
                ⌘K
              </kbd>{" "}
              to quickly access any Cara command
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Expose for testing
export const _testing = { SHORTCUTS };
