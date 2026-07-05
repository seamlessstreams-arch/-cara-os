"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Child Voice Dimensions Panel
//
// How well this child's voice is being HEARD and ACTED ON — read from the
// records that already hold it. Two honest kinds: what the CHILD said (their own
// sentiment) and how the SETTING responds (capture / acting on it / advocacy).
// Highlights surface the dissonance that matters most: "we record the voice, but
// the child says they aren't heard." Cara prompts a conversation, never replaces
// one, and never claims to measure how a child feels inside.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  Ear,
  Heart,
  Loader2,
  Minus,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useChildVoiceDimensions } from "@/hooks/use-child-voice-dimensions";
import type {
  ChildVoiceDimensionProfile,
  VoiceDimension,
  VoiceDimensionStatus,
  VoiceHighlight,
  VoiceHighlightSeverity,
  VoiceTrend,
} from "@/lib/child-voice-dimensions/types";

const STATUS_STYLE: Record<VoiceDimensionStatus, { label: string; bg: string; fg: string }> = {
  strong: { label: "Strong", bg: "#e6f7f2", fg: "#0d9488" },
  developing: { label: "Developing", bg: "#fdf4e3", fg: "#b7791f" },
  needs_attention: { label: "Needs attention", bg: "#fdeceb", fg: "#c0392b" },
  not_asked: { label: "Not asked", bg: "#eef1f3", fg: "#6c7a83" },
  insufficient_data: { label: "Not enough yet", bg: "#eef1f3", fg: "#6c7a83" },
};

const SEVERITY_STYLE: Record<VoiceHighlightSeverity, { border: string; bg: string; fg: string; Icon: typeof ShieldAlert }> = {
  priority: { border: "#f0b8b2", bg: "#fdeceb", fg: "#c0392b", Icon: ShieldAlert },
  watch: { border: "#f0dcb0", bg: "#fdf4e3", fg: "#b7791f", Icon: Ear },
  strength: { border: "#b6e4d7", bg: "#e6f7f2", fg: "#0d9488", Icon: Sparkles },
};

function TrendIcon({ trend }: { trend: VoiceTrend }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5" style={{ color: "#0d9488" }} aria-label="improving" />;
  if (trend === "declining") return <TrendingDown className="h-3.5 w-3.5" style={{ color: "#c0392b" }} aria-label="declining" />;
  if (trend === "steady") return <Minus className="h-3.5 w-3.5" style={{ color: "#6c7a83" }} aria-label="steady" />;
  return null;
}

function StatusPill({ status }: { status: VoiceDimensionStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

function DimensionRow({ dim }: { dim: VoiceDimension }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--cs-text,#14202a)]">{dim.label}</span>
          <TrendIcon trend={dim.trend} />
        </span>
        <span className="flex items-center gap-2">
          {dim.score !== null && (
            <span className="text-xs tabular-nums text-[var(--cs-text-muted,#6c7a83)]">{dim.score}</span>
          )}
          <StatusPill status={dim.status} />
          {open ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--cs-border,#e2e8ec)] px-3 py-2">
          <p className="text-xs leading-relaxed text-[var(--cs-text,#14202a)]">{dim.note}</p>
          <p className="mt-1.5 text-[11px] text-[var(--cs-text-muted,#6c7a83)]">
            {dim.kind === "child_expressed" ? "From the child's own words" : "About the home's practice"}
            {dim.sources.length > 0 && ` · ${dim.sources.length} record${dim.sources.length === 1 ? "" : "s"}`}
            {` · ${dim.recentCount} recent / ${dim.priorCount} earlier`}
          </p>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ h }: { h: VoiceHighlight }) {
  const s = SEVERITY_STYLE[h.severity];
  const { Icon } = s;
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: s.border, backgroundColor: s.bg }}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: s.fg }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: s.fg }}>
            {h.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text,#14202a)]">{h.detail}</p>
        </div>
      </div>
    </div>
  );
}

export function ChildVoiceDimensionsPanel({ childId }: { childId: string; childName?: string }) {
  const { data, isLoading, isError } = useChildVoiceDimensions(childId);
  const [showAll, setShowAll] = useState(false);
  const profile: ChildVoiceDimensionProfile | undefined = data?.data;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          Voice Intelligence
        </CardTitle>
        <CardDescription>
          How well {profile?.childName ?? "this child"}&apos;s voice is being heard and acted on — over the last{" "}
          {profile?.windowDays ?? 90} days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the records…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load voice intelligence right now.</p>}

        {profile && !profile.hasData && (
          <div className="rounded-lg border border-dashed border-[var(--cs-border,#e2e8ec)] p-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            No voice records for {profile.childName} in the last {profile.windowDays} days yet. That absence is itself worth
            noting — plan a key-work session, capture their view at the next review, or involve their advocate.
          </div>
        )}

        {profile && profile.hasData && (
          <>
            {profile.highlights.length > 0 && (
              <div className="space-y-2">
                {profile.highlights.map((h) => (
                  <HighlightCard key={h.id} h={h} />
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
                What {profile.childName} has told us
              </p>
              {profile.dimensions.filter((d) => d.kind === "child_expressed").map((d) => (
                <DimensionRow key={d.key} dim={d} />
              ))}
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
                How we&apos;re hearing &amp; acting
              </p>
              {profile.dimensions.filter((d) => d.kind === "practice").map((d) => (
                <DimensionRow key={d.key} dim={d} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-medium text-[var(--cs-teal,#0d9488)]"
            >
              {showAll ? "Hide" : "Why this matters"}
            </button>
            {showAll && (
              <div className="rounded-lg bg-[var(--cs-surface-subtle,#f6f8f9)] p-3">
                <p className="text-xs italic leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{profile.disclaimer}</p>
                <ul className="mt-2 space-y-1">
                  {profile.regulatoryLinks.map((r) => (
                    <li key={r} className="text-[11px] text-[var(--cs-text-muted,#6c7a83)]">
                      · {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ChildVoiceDimensionsPanel;
