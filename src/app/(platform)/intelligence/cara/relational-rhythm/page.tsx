"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONAL RHYTHM (doctrine 2.1.3)
//
// The home's circles: what's coming up, what the team keeps naming, what
// they're grateful for, and what still needs to go somewhere.
//
// What this page must never become: a compliance board. No attendance, no
// completion ring, no red for a circle that didn't happen. If it ever grows
// one, the circle has stopped being a circle.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useRelationalRhythm,
  useCaptureCircle,
  useConfigureRhythm,
} from "@/hooks/use-relational-rhythm";
import { suggestPrompt, type CircleKind } from "@/lib/relational-rhythm/rhythm-engine";
import { Users, Heart, ArrowUpRight, MessageCircle, Loader2, Lock, Sparkles } from "lucide-react";

const fmtWhen = (iso: string | null): string => {
  if (!iso) return "no next date";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const today = () => new Date().toISOString().slice(0, 10);
const lines = (s: string): string[] => s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function RelationalRhythmPage() {
  const q = useRelationalRhythm();
  const capture = useCaptureCircle();
  const configure = useConfigureRhythm();
  const [kind, setKind] = useState<CircleKind>("check_out");
  const [themes, setThemes] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [concerns, setConcerns] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const d = q.data;

  const submit = async () => {
    setMsg(null);
    try {
      const res = await capture.mutateAsync({
        kind,
        date: today(),
        themes: lines(themes),
        gratitude: lines(gratitude),
        emerging_concerns: lines(concerns),
      });
      setThemes(""); setGratitude(""); setConcerns("");
      setMsg(res.data.handoffReminder ?? "Captured — thank you.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Could not capture that.");
    }
  };

  return (
    <PageShell
      title="Relational Rhythm"
      subtitle="Check In, Check Up, Check Out — the circles a home keeps, and what they surface"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the rhythm…
          </div>
        )}

        {d && (
          <>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">{d.summary}</p>
                <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">
                  Circles are relational structures, not compliance tasks. Cara will never count attendance, score a
                  circle, or tell you one was missed — a circle that didn&rsquo;t happen isn&rsquo;t a finding.
                </p>
              </CardContent>
            </Card>

            {d.upcoming.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> Coming up
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {d.upcoming.map((u) => (
                    <div key={u.kind} className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] p-3">
                      <p className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{u.label}</p>
                      <p className="text-xs text-[var(--cs-text-muted,#64748b)]">{fmtWhen(u.nextAt)}</p>
                      <p className="mt-1.5 text-xs italic text-[var(--cs-text-secondary,#475569)]">{u.purpose}</p>
                      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-[var(--cs-info-bg,#f0f9ff)] px-2 py-1.5">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[var(--cs-info,#0284c7)]" />
                        <p className="text-xs text-[var(--cs-text-secondary,#475569)]">
                          Try: &ldquo;{u.suggestedPrompt}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {d.handoffs.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                    <ArrowUpRight className="h-4 w-4" /> Raised in a circle — still needs a home
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {d.handoffs.map((h, i) => (
                    <div key={i} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                      <p className="text-sm font-medium text-[var(--cs-text,#0f172a)]">&ldquo;{h.concern}&rdquo;</p>
                      <p className="mt-1 text-xs font-semibold text-amber-900">→ {h.suggestedRoute}</p>
                      <p className="text-xs text-[var(--cs-text-secondary,#475569)]">{h.why}</p>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-amber-800">
                    A circle is where it was said, not where it gets dealt with. Cara points at the door; you decide and
                    you walk through it.
                  </p>
                </CardContent>
              </Card>
            )}

            {d.themes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> What the team keeps naming
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {d.themes.map((t) => (
                    <div key={t.theme} className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{t.theme}</span>
                        <span className="rounded-full border border-[var(--cs-border,#e2e8f0)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--cs-text-secondary,#475569)]">
                          {t.circles} circles
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">{t.whyShown}</p>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                    Counted across circles, never across people — this is what the team is telling you, not a record of
                    who said what.
                  </p>
                </CardContent>
              </Card>
            )}

            {d.gratitude.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4 text-rose-500" /> Named out loud
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {d.gratitude.map((g, i) => (
                    <span key={i} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-900">
                      {g.text}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Capture a circle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {d.definitions.map((def) => (
                    <button
                      key={def.kind}
                      onClick={() => setKind(def.kind)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition",
                        kind === def.kind
                          ? "border-[var(--cs-cara-gold,#b45309)] bg-[var(--cs-cara-gold,#b45309)] text-white"
                          : "border-[var(--cs-border,#e2e8f0)] text-[var(--cs-text-secondary,#475569)]",
                      )}
                    >
                      {def.label}
                    </button>
                  ))}
                </div>
                <p className="flex items-start gap-1.5 text-xs text-[var(--cs-text-muted,#64748b)]">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                  Suggested opener: &ldquo;{suggestPrompt(kind, today())}&rdquo;
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([
                    ["What came up", themes, setThemes, "One per line"],
                    ["Thank yous", gratitude, setGratitude, "Who or what was named"],
                    ["Anything that came up", concerns, setConcerns, "These get routed onward"],
                  ] as const).map(([label, val, set, hint]) => (
                    <div key={label}>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</label>
                      <textarea
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        rows={3}
                        placeholder={hint}
                        className="mt-1 w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] px-2.5 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" onClick={submit} disabled={!d.writeEnabled || capture.isPending}>
                    {capture.isPending ? "Saving…" : "Capture"}
                  </Button>
                  {!d.writeEnabled && (
                    <span className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted,#64748b)]">
                      <Lock className="h-3 w-3" /> Capture isn&rsquo;t switched on here (relational_rhythm_write) — the
                      rhythm above is live and read-only.
                    </span>
                  )}
                </div>
                {msg && <p className="text-xs text-[var(--cs-text-secondary,#475569)]">{msg}</p>}
                <p className="border-t border-[var(--cs-border,#e2e8f0)] pt-3 text-xs text-[var(--cs-text-muted,#64748b)]">
                  A few words is plenty. Cara doesn&rsquo;t record who was there — themes belong to the circle, not to a
                  person. Anything that sounds like a safeguarding matter belongs in the safeguarding record today;
                  nothing here delays that.
                </p>
              </CardContent>
            </Card>

            {d.upcoming.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">The rhythm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {d.upcoming.map((u) => (
                    <div key={`cfg_${u.kind}`} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cs-border,#e2e8f0)] px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--cs-text,#0f172a)]">{u.label}</p>
                        <p className="text-xs text-[var(--cs-text-muted,#64748b)]">{u.purpose}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!d.writeEnabled || configure.isPending}
                        onClick={() => {
                          const id = u.kind === "check_in" ? "crh_checkin" : u.kind === "check_up" ? "crh_checkup" : "crh_checkout";
                          configure.mutate({ id, enabled: false });
                        }}
                      >
                        Switch off
                      </Button>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                    A home chooses its own rhythm. Switch one off and it disappears — Cara won&rsquo;t ask about it again.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
