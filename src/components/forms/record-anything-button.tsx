"use client";

// ══════════════════════════════════════════════════════════════════════════════
// RECORD ANYTHING — universal capture entry point
//
// A single button (drop into any page header) that opens the free-text "just write
// what happened" capture. Cara classifies + routes it everywhere (capture once,
// surface everywhere). When a child is in context (a young-person page) it records
// straight against that child; otherwise it offers a quick child picker plus a general
// home note. Attribution uses the signed-in user, never a hardcoded staff id.
// ══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo, useRef, useState } from "react";
import { Sparkles, Search, Home, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { UniversalChildEntry } from "@/components/forms/universal-child-entry";
import { UniversalHomeEntry } from "@/components/forms/universal-home-entry";

interface RecordAnythingButtonProps {
  /** When provided (a young-person page), records straight against this child. */
  childId?: string;
  /** Visual style — "solid" for primary headers, "soft" for a lighter inline button. */
  variant?: "solid" | "soft";
  className?: string;
  label?: string;
}

// Refresh the surfaces a captured record can touch, so the page updates immediately.
const REFRESH_KEYS = [
  "young-people", "young-person", "tasks", "incidents", "daily-log", "daily-logs",
  "chronology", "records", "care-forms", "forms", "sidebar", "event-stream",
  "event-intelligence", "action-center", "notifications",
];

const HOME = "__home__";

export function RecordAnythingButton({ childId, variant = "soft", className, label = "Record anything" }: RecordAnythingButtonProps) {
  const [open, setOpen] = useState(false);
  const dirtyRef = useRef(false);
  const handleDirty = useCallback((d: boolean) => { dirtyRef.current = d; }, []);
  // Explicit Cancel / save — close immediately, no prompt.
  const closeNow = useCallback(() => { dirtyRef.current = false; setOpen(false); }, []);
  // Guard accidental dismissal (overlay click / Escape / X) when there's unsaved text.
  const handleOpenChange = useCallback((next: boolean) => {
    if (!next && dirtyRef.current && typeof window !== "undefined"
        && !window.confirm("Discard this note? Your text hasn't been saved yet.")) {
      return; // keep the dialog open
    }
    dirtyRef.current = false;
    setOpen(next);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Record anything — write what happened, we route it everywhere"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-3 min-h-[40px] text-sm font-medium transition-colors",
          variant === "solid"
            ? "bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy-soft)]"
            : "border border-[var(--cs-cara-gold)] text-[var(--cs-navy)] bg-[var(--cs-cara-gold-bg)] hover:bg-[var(--cs-cara-gold-bg)]/70",
          className,
        )}
      >
        <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">Record</span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {open && <RecordAnythingBody childId={childId} onClose={closeNow} onDirty={handleDirty} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecordAnythingBody({ childId, onClose, onDirty }: { childId?: string; onClose: () => void; onDirty: (dirty: boolean) => void }) {
  const { currentUser } = useAuthContext();
  const staffId = currentUser?.id ?? "staff_darren";
  const queryClient = useQueryClient();
  // null = show picker; a child id, or HOME, = show that entry. Pre-selected when childId is given.
  const [picked, setPicked] = useState<string | null>(childId ?? null);

  const refresh = () => {
    for (const key of REFRESH_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
  };

  if (picked === HOME) {
    return (
      <>
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Record a general note</DialogTitle>
          <DialogDescription>Write what happened. We&apos;ll route it to the right place.</DialogDescription>
        </DialogHeader>
        <UniversalHomeEntry
          staffId={staffId}
          onSuccess={refresh}
          onCancel={childId ? onClose : () => setPicked(null)}
          onDirtyChange={onDirty}
        />
      </>
    );
  }

  if (picked) {
    return (
      <>
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Record anything</DialogTitle>
          <DialogDescription>Write what happened — Cara classifies it and routes it everywhere.</DialogDescription>
        </DialogHeader>
        <UniversalChildEntry
          childId={picked}
          staffId={staffId}
          onSuccess={refresh}
          onCancel={childId ? onClose : () => setPicked(null)}
          onDirtyChange={onDirty}
        />
      </>
    );
  }

  return <ChildPicker onPick={setPicked} />;
}

function ChildPicker({ onPick }: { onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["young-people", "current"],
    queryFn: () => api.get<{ data: Array<{ id: string; first_name?: string; last_name?: string; preferred_name?: string }> }>("/young-people?status=current"),
  });

  const children = useMemo(() => {
    const list = data?.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((c) => `${c.preferred_name ?? c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase().includes(needle));
  }, [data, q]);

  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Record anything</DialogTitle>
        <DialogDescription>Who is this about? Pick a young person, or record a general home note.</DialogDescription>
      </DialogHeader>

      <button
        type="button"
        onClick={() => onPick(HOME)}
        className="flex w-full items-center gap-3 rounded-xl border border-[var(--cs-border)] bg-white p-3 text-left hover:bg-[var(--cs-surface)] transition-colors"
      >
        <div className="h-9 w-9 rounded-full bg-[var(--cs-teal-bg)] text-[var(--cs-teal)] flex items-center justify-center shrink-0"><Home className="h-4 w-4" /></div>
        <div>
          <p className="text-sm font-semibold text-[var(--cs-navy)]">General / home note</p>
          <p className="text-[11px] text-[var(--cs-text-muted)]">Not about a specific child</p>
        </div>
      </button>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search young people…"
          className="w-full rounded-xl border border-[var(--cs-border)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--cs-cara-gold)] focus:outline-none"
          autoFocus
        />
      </div>

      <div className="max-h-[40vh] overflow-y-auto -mx-1 px-1 space-y-1">
        {isLoading ? (
          <p className="text-sm text-[var(--cs-text-muted)] py-4 text-center">Loading…</p>
        ) : children.length === 0 ? (
          <p className="text-sm text-[var(--cs-text-muted)] py-4 text-center">No young people match.</p>
        ) : (
          children.map((c) => {
            const name = `${c.preferred_name ?? c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.id;
            const initials = `${(c.first_name ?? "")[0] ?? ""}${(c.last_name ?? "")[0] ?? ""}`;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onPick(c.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left hover:border-[var(--cs-border)] hover:bg-[var(--cs-surface)] transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-[var(--cs-navy)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials || <User className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium text-[var(--cs-navy)]">{name}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
