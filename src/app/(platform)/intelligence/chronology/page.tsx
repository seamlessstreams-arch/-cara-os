"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHRONOLOGY INTELLIGENCE PAGE
// ARIA-powered chronology summaries and gap analysis
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DictationButton } from "@/components/common/dictation-button";
import { useYoungPeople } from "@/hooks/use-young-people";
import { usePatternAlerts } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";
import {
  Brain,
  Copy,
  Loader2,
  FileText,
  AlertTriangle,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = "28d" | "90d" | "6m" | "12m" | "full";
type Style = "chronology_style" | "direct_factual" | "evaluative_ofsted";

interface ChronologyRow {
  date: string;
  event: string;
  significance: string;
  isHigh?: boolean;
}

const PERIOD_OPTIONS: { value: Period; label: string; days: number }[] = [
  { value: "28d",  label: "Last 28 days",   days: 28   },
  { value: "90d",  label: "Last 90 days",   days: 90   },
  { value: "6m",   label: "Last 6 months",  days: 182  },
  { value: "12m",  label: "Last 12 months", days: 365  },
  { value: "full", label: "Full history",   days: 3650 },
];

const STYLE_OPTIONS: { value: Style; label: string; description: string }[] = [
  { value: "chronology_style",  label: "Chronology",    description: "Terse dated entries, audit-ready" },
  { value: "direct_factual",    label: "Direct Factual",description: "Plain factual — no inference"       },
  { value: "evaluative_ofsted", label: "Evaluative (Ofsted)", description: "Impact-led, ILACS language"  },
];

const SEV_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high:     "bg-orange-100 text-orange-800",
  medium:   "bg-amber-100 text-amber-800",
  low:      "bg-slate-100 text-[var(--cs-text-secondary)]",
};

// ── Parse raw ARIA text into chronology rows ──────────────────────────────────
//
// Expected format (from the ARIA chronology_summary mode):
//   "1. Date | Event | Significance"  or
//   "Date | Event | Significance"
//
// Anything that can't be split into three pipe-delimited parts is treated as a
// continuation / section header and skipped for row rendering.

function parseChronologyRows(raw: string): ChronologyRow[] {
  const rows: ChronologyRow[] = [];
  const lines = raw.split("\n");

  for (const line of lines) {
    // Strip leading list markers (1. 2. - •)
    const stripped = line.replace(/^\s*(\d+\.\s*|[-•]\s*)/, "").trim();
    if (!stripped) continue;

    const parts = stripped.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;

    const [date, event, significance] = parts;
    if (!date || !event) continue;

    const sigLower = significance?.toLowerCase() ?? "";
    const isHigh =
      sigLower.includes("critical") ||
      sigLower.includes("high") ||
      sigLower.includes("significant") ||
      sigLower.includes("heightened");

    rows.push({ date, event, significance: significance ?? "", isHigh });
  }

  return rows;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ChronologyIntelligencePage() {
  // Form state
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod]   = useState<Period>("90d");
  const [pastedNotes, setPastedNotes]         = useState("");
  const [selectedStyle, setSelectedStyle]     = useState<Style>("chronology_style");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawOutput, setRawOutput]       = useState("");
  const [isDone, setIsDone]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);

  // Data
  const ypQuery    = useYoungPeople("current");
  const youngPeople = ypQuery.data?.data ?? [];

  const patternsQuery = usePatternAlerts({ status: "active" });
  const activeAlerts  = patternsQuery.data?.data ?? [];

  // Derived
  const periodObj   = PERIOD_OPTIONS.find((p) => p.value === selectedPeriod) ?? PERIOD_OPTIONS[1];
  const selectedYP  = youngPeople.find((yp) => yp.id === selectedChildId);
  const childName   = selectedYP
    ? `${selectedYP.preferred_name ?? selectedYP.first_name} ${selectedYP.last_name}`
    : "";

  const chronoRows = parseChronologyRows(rawOutput);

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedChildId) {
      setError("Please select a young person first.");
      return;
    }

    setIsGenerating(true);
    setRawOutput("");
    setIsDone(false);
    setError(null);

    try {
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chronology_summary",
          style: selectedStyle,
          stream: true,
          page_context: "chronology",
          user_role: "registered_manager",
          question: `Generate a ${periodObj.label} chronology summary for ${childName}`,
          source_content:
            pastedNotes ||
            `Generating chronology for ${childName} over ${periodObj.label}`,
          period_days: periodObj.days,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`ARIA returned ${res.status}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setIsDone(true);
            continue;
          }

          try {
            const parsed = JSON.parse(payload) as {
              type: string;
              text?: string;
              error?: string;
            };

            if (parsed.type === "text_delta" && parsed.text) {
              setRawOutput((prev) => prev + parsed.text);
            } else if (parsed.type === "message_stop") {
              setIsDone(true);
            } else if (parsed.type === "error") {
              throw new Error(parsed.error ?? "Stream error");
            }
          } catch (parseErr) {
            // Ignore malformed SSE lines
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Copy ─────────────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    if (!rawOutput) return;
    await navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Chronology Intelligence"
      subtitle="ARIA-generated chronology summaries and gap analysis"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Chronology Intelligence" subtitle="Oak House — ARIA Chronology Analysis" targetId="chronology-content" />
          <SmartUploadButton variant="inline" label="Upload Chronology Document" uploadContext="Intelligence — chronology or historical record document upload" />
        </div>
      }
    >
      <div id="chronology-content" className="grid gap-6 lg:grid-cols-3 animate-fade-in">

        {/* ── LEFT: Generate panel (2/3) ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Brain className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                Generate Chronology Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Child selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block">
                  Young Person
                </label>
                {ypQuery.isLoading ? (
                  <div className="h-9 rounded-xl bg-slate-100 animate-pulse" />
                ) : (
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]"
                  >
                    <option value="">Select a young person…</option>
                    {youngPeople.map((yp) => {
                      const name = `${yp.preferred_name ?? yp.first_name} ${yp.last_name}`;
                      return (
                        <option key={yp.id} value={yp.id}>
                          {name} — Age {yp.age}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Period selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block">
                  Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedPeriod(opt.value)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                        selectedPeriod === opt.value
                          ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                          : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-[var(--cs-aria-gold-soft)] hover:text-[var(--cs-aria-gold)]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paste records / notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block">
                    Paste records or notes to include{" "}
                    <span className="font-normal text-[var(--cs-text-muted)]">(optional)</span>
                  </label>
                  <DictationButton
                    size="sm"
                    onTranscript={(text) =>
                      setPastedNotes((prev) => (prev ? `${prev} ${text}` : text))
                    }
                  />
                </div>
                <textarea
                  value={pastedNotes}
                  onChange={(e) => setPastedNotes(e.target.value)}
                  placeholder="Paste any relevant records, log entries, or notes here…"
                  rows={4}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)] placeholder:text-[var(--cs-text-muted)]"
                />
              </div>

              {/* Style selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block">
                  Writing Style
                </label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedStyle(opt.value)}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        selectedStyle === opt.value
                          ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] ring-1 ring-[var(--cs-aria-gold-soft)]"
                          : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]/40"
                      )}
                    >
                      <div className={cn(
                        "text-xs font-semibold mb-0.5",
                        selectedStyle === opt.value ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-secondary)]"
                      )}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-[var(--cs-text-muted)] leading-tight">
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedChildId}
                className="w-full bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with ARIA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* ── Output area ──────────────────────────────────────────────── */}
          {(rawOutput || isGenerating) && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
                    Chronology Output
                    {isGenerating && (
                      <Loader2 className="h-3.5 w-3.5 text-[var(--cs-text-muted)] animate-spin ml-1" />
                    )}
                  </CardTitle>
                  {isDone && rawOutput && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copied!" : "Copy all"}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {chronoRows.length > 0 ? (
                  <div className="space-y-1.5">
                    {/* Table header */}
                    <div className="grid grid-cols-[120px_1fr_160px] gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
                      <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Date</div>
                      <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Event</div>
                      <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Significance</div>
                    </div>

                    {/* Rows */}
                    {chronoRows.map((row, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "grid grid-cols-[120px_1fr_160px] gap-2 rounded-xl border px-3 py-2.5 text-xs",
                          row.isHigh
                            ? "border-red-200 bg-red-50"
                            : "border-[var(--cs-border-subtle)] bg-white"
                        )}
                      >
                        <div className={cn(
                          "font-medium shrink-0",
                          row.isHigh ? "text-red-700" : "text-[var(--cs-text-muted)]"
                        )}>
                          {row.date}
                        </div>
                        <div className={cn(
                          "leading-relaxed",
                          row.isHigh ? "text-red-900 font-medium" : "text-[var(--cs-navy)]"
                        )}>
                          {row.isHigh && (
                            <AlertTriangle className="h-3 w-3 inline mr-1 text-red-500 shrink-0" />
                          )}
                          {row.event}
                        </div>
                        <div className={cn(
                          "leading-relaxed",
                          row.isHigh ? "text-red-700 font-medium" : "text-[var(--cs-text-muted)]"
                        )}>
                          {row.significance}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback: raw text when parsing yields no table rows */
                  <pre className="whitespace-pre-wrap text-xs text-[var(--cs-text-secondary)] leading-relaxed font-sans">
                    {rawOutput}
                  </pre>
                )}

                {/* Streaming cursor */}
                {isGenerating && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    ARIA is writing…
                  </div>
                )}

                {/* Disclaimer */}
                {isDone && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 leading-snug">
                      AI-generated — verify against source records before use.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT: Tips + alerts (1/3) ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Chronology Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)]" />
                Chronology Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {[
                  "Include dates, events, and their significance",
                  "Flag anything with heightened significance separately",
                  "Reference source records for each entry",
                  "Identify gaps — periods with no entries",
                  "Theme your chronology by domain (health, education, placement, etc.)",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recent Pattern Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Brain className="h-4 w-4 text-amber-500" />
                Recent Patterns
                {activeAlerts.length > 0 && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {activeAlerts.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patternsQuery.isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : activeAlerts.length === 0 ? (
                <p className="text-xs text-[var(--cs-text-muted)] py-2">No active pattern alerts.</p>
              ) : (
                <div className="space-y-2">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2 rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-3 py-2"
                    >
                      <span className={cn(
                        "shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                        SEV_CLASSES[alert.severity] ?? SEV_CLASSES.low
                      )}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-[var(--cs-text-secondary)] leading-snug">{alert.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* What ARIA can do */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-[var(--cs-text-muted)]" />
                What ARIA can do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {[
                  "Build dated, terse chronology entries",
                  "Flag high-significance events",
                  "Identify gaps and missing periods",
                  "Theme entries by domain",
                  "Surface links to other records",
                ].map((cap) => (
                  <li key={cap} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <Sparkles className="h-3 w-3 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                    {cap}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </PageShell>
  );
}
