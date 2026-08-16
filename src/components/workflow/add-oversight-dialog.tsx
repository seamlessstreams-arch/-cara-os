"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ADD OVERSIGHT TO AN ATTENTION ITEM
//
// The Manager Control Centre could mark an item "reviewed" and that was all it
// could say. "Add Oversight" — the button for recording what the manager
// actually decided — had no handler, and the PATCH route had no field to write
// to even if it had.
//
// Marking something reviewed records that it was looked at. The note records
// the thinking: what was found, what was done, what happens next. That is the
// part an inspector asks for, and the part a home cannot reconstruct later.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function AddOversightDialog({
  open, onOpenChange, itemTitle, suggestedAction, pending, error, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemTitle: string;
  suggestedAction?: string;
  pending: boolean;
  error: string;
  onSave: (note: string) => void;
}) {
  const uid = useId();
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setNote(""); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add oversight</DialogTitle></DialogHeader>
        <p className="-mt-2 text-sm font-medium text-[var(--cs-navy)]">{itemTitle}</p>
        {suggestedAction && (
          <p className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-2.5 text-xs text-[var(--cs-text-secondary)]">
            <span className="font-medium">Cara suggested: </span>{suggestedAction}
          </p>
        )}

        <div className="py-2">
          <label htmlFor={`${uid}-note`} className="mb-1 block text-sm font-medium">
            What you found, and what you did *
          </label>
          <Textarea
            id={`${uid}-note`}
            rows={5}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your own analysis — not a restatement of the suggestion above."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            Your oversight was <strong>not</strong> saved — {error}. The note is still here; try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(note.trim())} disabled={!note.trim() || pending} className="gap-1.5">
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save oversight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
