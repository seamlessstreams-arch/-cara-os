"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CHILD VOICE DASHBOARD
//
// Surfaces the voice of the child: direct quotes, wishes and feelings,
// sentiment analysis, themes, and gaps in voice capture over time.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MessageCircle, Heart, AlertTriangle, TrendingUp,
  Smile, Frown, Meh, AlertCircle, Clock, Quote,
  Sparkles, Search, Filter,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Types ───────────────────────────────────────────────────────────────────

interface VoiceEntry {
  id: string;
  childId: string;
  sourceType: string;
  sourceTitle: string | null;
  sourceDate: string | null;
  quote: string;
  context: string | null;
  sentiment: string;
  theme: string | null;
}

interface VoiceSummary {
  childId: string;
  totalEntries: number;
  recentEntries: VoiceEntry[];
  themes: { theme: string; count: number }[];
  sentimentBreakdown: Record<string, number>;
  lastCaptured: string | null;
  gapDays: number | null;
}

// ── Sentiment helpers ───────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<string, { icon: React.ElementType; colour: string; label: string }> = {
  positive: { icon: Smile, colour: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Positive" },
  negative: { icon: Frown, colour: "text-red-600 bg-red-50 border-red-200", label: "Negative" },
  neutral: { icon: Meh, colour: "text-gray-600 bg-gray-50 border-gray-200", label: "Neutral" },
  distressed: { icon: AlertTriangle, colour: "text-red-700 bg-red-100 border-red-300", label: "Distressed" },
  unknown: { icon: Meh, colour: "text-gray-400 bg-gray-50 border-gray-200", label: "Unknown" },
};

const THEME_LABELS: Record<string, string> = {
  family_contact: "Family & Contact",
  education: "Education",
  friendships: "Friendships",
  placement: "Placement",
  identity: "Identity",
  health: "Health",
  future: "Future",
  safety: "Safety",
  activities: "Activities",
  rights: "Rights",
};

// ── Children (demo) ─────────────────────────────────────────────────────────

const DEMO_CHILDREN = [
  { id: "child_1", name: "Jayden" },
  { id: "child_2", name: "Amara" },
  { id: "child_3", name: "Reuben" },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function ChildVoicePage() {
  const [selectedChild, setSelectedChild] = useState(demoSeed(DEMO_CHILDREN)[0]?.id ?? "");
  const [summary, setSummary] = useState<VoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cara-studio/child-voice?childId=${selectedChild}&mode=summary`)
      .then((r) => r.json())
      .then((data) => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedChild]);

  const filteredEntries = (summary?.recentEntries ?? []).filter((e) => {
    if (sentimentFilter && e.sentiment !== sentimentFilter) return false;
    if (themeFilter && e.theme !== themeFilter) return false;
    return true;
  });

  const totalSentiment = Object.values(summary?.sentimentBreakdown ?? {}).reduce((a, b) => a + b, 0);

  return (
    <PageShell title="Child Voice" subtitle="Capturing wishes, feelings, and direct quotes">
      <div className="space-y-6 pb-12">

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <MessageCircle className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Child Voice Engine</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Extracts and tracks direct quotes, wishes, feelings, and perspectives from across all evidence sources.
              </p>
            </div>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
            >
              {demoSeed(DEMO_CHILDREN).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-12 text-center">
            <Sparkles className="h-8 w-8 animate-pulse text-[var(--cs-cara-gold)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">Scanning evidence for child voice...</p>
          </div>
        ) : summary ? (
          <>
            {/* ── Stats row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Total Entries</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.totalEntries}</p>
              </div>
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Themes</span>
                </div>
                <p className="text-2xl font-bold text-[var(--cs-navy)]">{summary.themes.length}</p>
              </div>
              <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Last Captured</span>
                </div>
                <p className="text-sm font-bold text-[var(--cs-navy)]">
                  {summary.lastCaptured ? new Date(summary.lastCaptured).toLocaleDateString("en-GB") : "—"}
                </p>
              </div>
              <div className={cn("rounded-xl border p-4", summary.gapDays && summary.gapDays > 7 ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white")}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className={cn("h-4 w-4", summary.gapDays && summary.gapDays > 7 ? "text-amber-600" : "text-[var(--cs-text-muted)]")} />
                  <span className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Gap (Days)</span>
                </div>
                <p className={cn("text-2xl font-bold", summary.gapDays && summary.gapDays > 7 ? "text-amber-700" : "text-[var(--cs-navy)]")}>
                  {summary.gapDays ?? "—"}
                </p>
              </div>
            </div>

            {/* ── Sentiment breakdown ────────────────────────────────────────── */}
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-4">
              <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Sentiment Breakdown</h3>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(summary.sentimentBreakdown).map(([sentiment, count]) => {
                  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.unknown;
                  const Icon = config.icon;
                  const pct = totalSentiment > 0 ? Math.round((count / totalSentiment) * 100) : 0;
                  return (
                    <button
                      key={sentiment}
                      onClick={() => setSentimentFilter(sentimentFilter === sentiment ? null : sentiment)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                        sentimentFilter === sentiment ? "ring-2 ring-[var(--cs-cara-gold)]" : "",
                        config.colour,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{config.label}</span>
                      <span className="text-xs font-bold">{count}</span>
                      <span className="text-[10px] opacity-70">({pct}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Theme pills ────────────────────────────────────────────────── */}
            {summary.themes.length > 0 && (
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-3">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.themes.map(({ theme, count }) => (
                    <button
                      key={theme}
                      onClick={() => setThemeFilter(themeFilter === theme ? null : theme)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        themeFilter === theme
                          ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] ring-2 ring-[var(--cs-cara-gold-soft)]"
                          : "border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:border-[var(--cs-cara-gold-soft)]",
                      )}
                    >
                      {THEME_LABELS[theme] ?? theme}
                      <Badge className="text-[9px] px-1.5 py-0 bg-white border-[var(--cs-border)]">{count}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Voice entries ───────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">
                  Voice Entries {sentimentFilter || themeFilter ? `(filtered: ${filteredEntries.length})` : `(${summary.recentEntries.length})`}
                </h3>
                {(sentimentFilter || themeFilter) && (
                  <button
                    onClick={() => { setSentimentFilter(null); setThemeFilter(null); }}
                    className="text-[10px] text-[var(--cs-cara-gold)] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              {filteredEntries.length === 0 ? (
                <div className="rounded-xl border border-[var(--cs-border)] bg-white p-6 text-center">
                  <Search className="h-6 w-6 text-[var(--cs-text-muted)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--cs-text-muted)]">No voice entries match the current filters.</p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const sentConfig = SENTIMENT_CONFIG[entry.sentiment] ?? SENTIMENT_CONFIG.unknown;
                  const SentIcon = sentConfig.icon;
                  return (
                    <div key={entry.id} className="rounded-xl border border-[var(--cs-border)] bg-white p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <blockquote className="text-sm text-[var(--cs-navy)] font-medium italic leading-relaxed border-l-2 border-[var(--cs-cara-gold)] pl-3">
                            &ldquo;{entry.quote}&rdquo;
                          </blockquote>
                        </div>
                        <Badge className={cn("text-[10px] border shrink-0", sentConfig.colour)}>
                          <SentIcon className="h-3 w-3 mr-1" />
                          {sentConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--cs-text-muted)]">
                        {entry.sourceTitle && <span>{entry.sourceTitle}</span>}
                        {entry.sourceDate && <span>{new Date(entry.sourceDate).toLocaleDateString("en-GB")}</span>}
                        {entry.theme && (
                          <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                            {THEME_LABELS[entry.theme] ?? entry.theme}
                          </Badge>
                        )}
                      </div>
                      {entry.context && (
                        <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">{entry.context}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
