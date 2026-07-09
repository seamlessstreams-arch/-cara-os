"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Redaction Tool Panel
//
// Paste text that names children or staff; Cara replaces every name with a
// stable, readable code (Child A, Staff 1) using the home's codebook, so a pack
// you share externally reads naturally and consistently. An authorised person can
// rehydrate. The codebook re-identifies, so it is shown as sensitive.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldOff, Copy, AlertTriangle, KeyRound } from "lucide-react";
import { useRedactDocuments } from "@/hooks/use-entity-redaction";

const SAMPLE =
  "Alex Smith became distressed after a phone call and was supported by Edward. Casey Jones helped settle the group. Later, Alex asked to speak to their key worker.";

export function RedactionToolPanel() {
  const [text, setText] = useState(SAMPLE);
  const redact = useRedactDocuments();
  const result = redact.data?.data;
  const outText = result?.documents?.[0]?.text ?? "";
  const residual = (result && "residualNames" in result ? result.residualNames : [])?.[0]?.names ?? [];

  const run = (mode: "redact" | "rehydrate") => redact.mutate({ documents: [{ id: "d1", text }], mode });

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldOff className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          Redaction Tool
        </CardTitle>
        <CardDescription>Replace names with stable codes (Child A, Staff 1) before anything leaves the building.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-lg border border-[var(--cs-border,#e2e8ec)] p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--cs-teal,#0d9488)]/30"
          placeholder="Paste text that names children or staff…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => run("redact")}
            disabled={redact.isPending || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--cs-teal,#0d9488)" }}
          >
            {redact.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
            Redact with home codebook
          </button>
          <button
            type="button"
            onClick={() => run("rehydrate")}
            disabled={redact.isPending || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cs-border,#e2e8ec)] px-3 py-1 text-[12px] font-medium text-[var(--cs-navy,#1e293b)] disabled:opacity-60"
          >
            <KeyRound className="h-3.5 w-3.5" /> Rehydrate
          </button>
        </div>

        {redact.isError && <p className="text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t process that right now.</p>}

        {result && (
          <div className="space-y-2">
            <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface-subtle,#f7fafb)] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">Output</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(outText)}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--cs-teal,#0d9488)]"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--cs-text,#1f2a30)]">{outText}</p>
            </div>

            {residual.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--cs-warning-soft)] bg-[var(--cs-warning-bg)] px-3 py-2 text-[12px] text-[var(--cs-warning)]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>A known name still appears after redaction: {residual.join(", ")}. Check the text before sharing.</span>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">
          Codes are deterministic and stable — the same child is &ldquo;Child A&rdquo; in every document of a set. The codebook that maps
          codes back to real identities is sensitive; keep it separate from anything you share.
        </p>
      </CardContent>
    </Card>
  );
}
