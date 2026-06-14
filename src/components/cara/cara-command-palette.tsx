"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraCommandPalette
//
// Keyboard-triggered command palette for quick access to Cara commands.
// Press Cmd/Ctrl+K to open from anywhere in the platform. Shows a
// searchable list of available commands with category filtering.
//
// Renders as a modal overlay. Delegates actual command execution to the
// CaraCommandPanel via a callback.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Search,
  X,
  FileText,
  AlertTriangle,
  Heart,
  ClipboardCheck,
  Users,
  Shield,
  Calendar,
  BookOpen,
  Mic,
  Wand2,
  BarChart3,
  ListTodo,
} from "lucide-react";

// ── Command definition ──────────────────────────────────────────────────────

export interface PaletteCommand {
  id: string;
  label: string;
  description: string;
  category: string;
  module: string;
  icon?: React.ElementType;
}

// ── Default command list (matches the 96-command registry) ──────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  writing: Wand2,
  daily_log: BookOpen,
  incident: AlertTriangle,
  key_work: Heart,
  management: ClipboardCheck,
  supervision: Users,
  care: FileText,
  safeguarding: Shield,
  handover: Calendar,
  dictation: Mic,
  analysis: BarChart3,
  tasks: ListTodo,
};

const DEFAULT_COMMANDS: PaletteCommand[] = [
  // Writing
  { id: "improve_writing", label: "Improve Writing", description: "Enhance clarity and professionalism", category: "writing", module: "general" },
  { id: "summarise_text", label: "Summarise Text", description: "Create a concise summary", category: "writing", module: "general" },
  { id: "expand_text", label: "Expand Text", description: "Add detail and depth", category: "writing", module: "general" },
  { id: "simplify_language", label: "Simplify Language", description: "Make text more accessible", category: "writing", module: "general" },
  { id: "professional_tone", label: "Professional Tone", description: "Adjust to professional register", category: "writing", module: "general" },
  // Daily log
  { id: "draft_daily_log", label: "Draft Daily Log", description: "Generate a daily log entry", category: "daily_log", module: "daily_log" },
  { id: "daily_log_summary", label: "Daily Log Summary", description: "Summarise the day for handover", category: "daily_log", module: "daily_log" },
  // Incidents
  { id: "incident_risk_analysis", label: "Incident Risk Analysis", description: "Analyse risk patterns from incident", category: "incident", module: "incident" },
  { id: "suggest_incident_follow_up_tasks", label: "Incident Follow-up Tasks", description: "Generate follow-up actions", category: "incident", module: "incident" },
  { id: "draft_incident_notification", label: "Incident Notification", description: "Draft notification for an incident", category: "incident", module: "incident" },
  // Management
  { id: "draft_management_oversight", label: "Management Oversight", description: "Draft oversight note for incident", category: "management", module: "management" },
  { id: "create_management_action_plan", label: "Management Action Plan", description: "Create actions from oversight review", category: "management", module: "management" },
  // Key work
  { id: "draft_key_work_session", label: "Key Work Session", description: "Draft key work session notes", category: "key_work", module: "key_work" },
  { id: "key_work_prep", label: "Key Work Prep", description: "Prepare for upcoming key work", category: "key_work", module: "key_work" },
  // Supervision
  { id: "supervision_prep", label: "Supervision Prep", description: "Prepare for supervision session", category: "supervision", module: "supervision" },
  { id: "supervision_summary", label: "Supervision Summary", description: "Summarise supervision outcomes", category: "supervision", module: "supervision" },
  // Care plans
  { id: "draft_care_plan_review", label: "Care Plan Review", description: "Draft care plan review notes", category: "care", module: "care" },
  // Safeguarding
  { id: "safeguarding_review", label: "Safeguarding Review", description: "Review safeguarding concerns", category: "safeguarding", module: "safeguarding" },
  // Tasks
  { id: "extract_actions", label: "Extract Actions", description: "Pull action items from text", category: "tasks", module: "general" },
  { id: "create_task_list", label: "Create Task List", description: "Generate a structured task list", category: "tasks", module: "general" },
  // Analysis
  { id: "risk_assessment", label: "Risk Assessment", description: "Analyse risk factors", category: "analysis", module: "incident" },
  { id: "pattern_analysis", label: "Pattern Analysis", description: "Identify recurring patterns", category: "analysis", module: "general" },
  // Handover
  { id: "handover_summary", label: "Handover Summary", description: "Generate shift handover brief", category: "handover", module: "handover" },
];

// ── Component ───────────────────────────────────────────────────────────────

interface CaraCommandPaletteProps {
  onSelectCommand?: (commandId: string) => void;
  commands?: PaletteCommand[];
}

export function CaraCommandPalette({
  onSelectCommand,
  commands = DEFAULT_COMMANDS,
}: CaraCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
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

  // Focus input on open
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter commands by search
  const filtered = useMemo(() => {
    if (!search.trim()) return commands;
    const q = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        cmd.id.toLowerCase().includes(q),
    );
  }, [search, commands]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        selectCommand(filtered[selectedIndex].id);
      }
    },
    [filtered, selectedIndex],
  );

  function selectCommand(commandId: string) {
    setOpen(false);
    onSelectCommand?.(commandId);
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  // Group by category
  const categories = new Map<string, PaletteCommand[]>();
  for (const cmd of filtered) {
    const group = categories.get(cmd.category) ?? [];
    group.push(cmd);
    categories.set(cmd.category, group);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white shadow-2xl overflow-hidden">
          {/* Search header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--cs-border)]">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Cara commands..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm text-[var(--cs-navy)] outline-none placeholder:text-[var(--cs-text-gentle)] bg-transparent"
            />
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Command list */}
          <div
            ref={listRef}
            className="max-h-80 overflow-y-auto py-2"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="h-6 w-6 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                <p className="text-xs text-[var(--cs-text-muted)]">
                  No commands found for &quot;{search}&quot;
                </p>
              </div>
            ) : (
              [...categories.entries()].map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                    {category.replace(/_/g, " ")}
                  </div>
                  {cmds.map((cmd) => {
                    const globalIndex = filtered.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const CategoryIcon = CATEGORY_ICONS[cmd.category] ?? Sparkles;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => selectCommand(cmd.id)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-[var(--cs-cara-gold-bg)]"
                            : "hover:bg-gray-50",
                        )}
                      >
                        <CategoryIcon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isSelected
                              ? "text-[var(--cs-cara-gold)]"
                              : "text-[var(--cs-text-gentle)]",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "text-sm font-medium truncate",
                              isSelected
                                ? "text-[var(--cs-navy)]"
                                : "text-[var(--cs-text-secondary)]",
                            )}
                          >
                            {cmd.label}
                          </div>
                          <div className="text-[10px] text-[var(--cs-text-muted)] truncate">
                            {cmd.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--cs-border)] bg-gray-50/50">
            <div className="flex items-center gap-3">
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-[var(--cs-text-muted)]">
                ↑↓
              </kbd>
              <span className="text-[10px] text-[var(--cs-text-muted)]">
                navigate
              </span>
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-[var(--cs-text-muted)]">
                ↵
              </kbd>
              <span className="text-[10px] text-[var(--cs-text-muted)]">
                select
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-[var(--cs-text-muted)]">
                esc
              </kbd>
              <span className="text-[10px] text-[var(--cs-text-muted)]">
                close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Expose for testing
export const _testing = { DEFAULT_COMMANDS, CATEGORY_ICONS };
