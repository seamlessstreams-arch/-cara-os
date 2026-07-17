"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOOR OR WALL (experience-of-help, doctrine 2.2.5)
//
// How does each child experience our help? Cara does not know and will not
// guess — the page exists to ask, to hold the answer with whose view it is
// attached, and to put the barriers WE made next to it.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperienceOfHelp, useRecordReflection } from "@/hooks/use-experience-of-help";
import { lensDefinition } from "@/lib/experience-of-help/experience-of-help-engine";
import { DoorOpen, Quote, CheckCircle2, HelpCircle, Loader2, Lock, ShieldQuestion } from "lucide-react";

const SOURCE_LABEL: Record<string, string> = {
  child: "In their words",
  family: "Their family's words",
  team_view: "The team's view — not theirs",
};

export default function ExperienceOfHelpPage() {
  const q = useExperienceOfHelp();
  const record = useRecordReflection();
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ source: "child", lens: "door", their_words: "", one_change: "", safety_consideration: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const d = q.data;

  const submit = async (childId: string) => {
    setMsg(null);
    try {
      const res = await record.mutateAsync({ child_id: childId, ...form });
      setMsg(res.data.note);
      setOpen(null);
      setForm({ source: "child", lens: "door", their_words: "", one_change: "", safety_consideration: "" });
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Could not record that.");
    }
  };

  return (
    <PageShell
      title="Door or Wall"
      subtitle="How is each child experiencing our help — and which of the barriers are ours?"
    >
      <div className="space-y-6 animate-fade-in">
        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading what people have said…
          </div>
        )}

        {d && (
          <>
            <Card>
              <CardContent className="flex items-start gap-3 pt-5">
                <DoorOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
                <div>
                  <p className="text-sm leading-relaxed text-[var(--cs-text-secondary,#475569)]">{d.summary}</p>
                  <p className="mt-2 text-xs text-[var(--cs-text-muted,#64748b)]">{d.caveat}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">The same help, six ways it can land</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {d.lenses.map((l) => (
                  <div key={l.lens} className="rounded-lg border border-[var(--cs-border,#e2e8f0)] p-2.5">
                    <p className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{l.label}</p>
                    <p className="mt-0.5 text-xs italic leading-relaxed text-[var(--cs-text-secondary,#475569)]">
                      &ldquo;{l.fromTheirView}&rdquo;
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {msg && (
              <Card className="border-sky-200 bg-sky-50">
                <CardContent className="pt-4 text-sm text-sky-900">{msg}</CardContent>
              </Card>
            )}

            {d.children.map((c) => (
              <Card key={c.childId}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {c.childName}
                    {c.latest ? (
                      <>
                        <span className="rounded-full border border-[var(--cs-cara-gold,#b45309)] bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                          {lensDefinition(c.latest.lens).label}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            c.isHypothesis
                              ? "border-violet-300 bg-violet-50 text-violet-900"
                              : "border-emerald-300 bg-emerald-50 text-emerald-800",
                          )}
                        >
                          {SOURCE_LABEL[c.latest.source]}
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                        not asked
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.isHypothesis && (
                    <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
                      {c.hypothesisNote}
                    </p>
                  )}

                  {c.latest && (
                    <div className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] p-3">
                      <div className="flex items-start gap-2">
                        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted,#64748b)]" />
                        <p className="text-sm leading-relaxed text-[var(--cs-text,#0f172a)]">
                          &ldquo;{c.latest.their_words}&rdquo;
                        </p>
                      </div>
                      <div className="mt-2 border-t border-[var(--cs-border,#e2e8f0)] pt-2">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">
                          The one change: <span className="font-normal">{c.latest.one_change}</span>
                        </p>
                        <p className="mt-0.5 flex items-start gap-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                          <ShieldQuestion className="mt-0.5 h-3 w-3 shrink-0" />
                          Keeping them safe: {c.latest.safety_consideration}
                        </p>
                      </div>
                    </div>
                  )}

                  {c.systemBarriers.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                        Barriers our own records show we made
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {c.systemBarriers.map((b) => (
                          <li key={b.id} className="text-xs text-amber-900">
                            · {b.what}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-[10px] text-amber-800">
                        These are ours, not theirs.
                      </p>
                    </div>
                  )}

                  {c.findings.map((f, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border px-3 py-2",
                        f.tone === "positive" ? "border-emerald-200 bg-emerald-50" : "border-[var(--cs-border,#e2e8f0)]",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {f.tone === "positive" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <HelpCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            f.tone === "positive" ? "text-emerald-900" : "text-[var(--cs-text,#0f172a)]",
                          )}
                        >
                          {f.headline}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--cs-text-secondary,#475569)]">{f.whyShown}</p>
                      <p className="mt-1 text-xs font-medium text-[var(--cs-cara-gold,#b45309)]">{f.question}</p>
                    </div>
                  ))}

                  {open === c.childId ? (
                    <div className="space-y-2 rounded-lg border border-[var(--cs-border,#e2e8f0)] p-3">
                      <div className="flex flex-wrap gap-2">
                        {(["child", "family", "team_view"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setForm((f) => ({ ...f, source: s }))}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold",
                              form.source === s
                                ? "border-[var(--cs-cara-gold,#b45309)] bg-[var(--cs-cara-gold,#b45309)] text-white"
                                : "border-[var(--cs-border,#e2e8f0)] text-[var(--cs-text-secondary,#475569)]",
                            )}
                          >
                            {SOURCE_LABEL[s]}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {d.lenses.map((l) => (
                          <button
                            key={l.lens}
                            onClick={() => setForm((f) => ({ ...f, lens: l.lens }))}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              form.lens === l.lens
                                ? "border-amber-400 bg-amber-100 font-semibold text-amber-900"
                                : "border-[var(--cs-border,#e2e8f0)] text-[var(--cs-text-secondary,#475569)]",
                            )}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                      {([
                        ["What they said, as close as you can get", "their_words"],
                        ["The one change", "one_change"],
                        ["How that change keeps them safe", "safety_consideration"],
                      ] as const).map(([label, key]) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-[var(--cs-text-secondary,#475569)]">{label}</label>
                          <textarea
                            rows={2}
                            value={form[key]}
                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface,#fff)] px-2.5 py-2 text-sm"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submit(c.childId)} disabled={!d.writeEnabled || record.isPending}>
                          {record.isPending ? "Recording…" : "Record"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setOpen(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm" variant="outline" onClick={() => setOpen(c.childId)} disabled={!d.writeEnabled}>
                        Record what they said
                      </Button>
                      {!d.writeEnabled && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted,#64748b)]">
                          <Lock className="h-3 w-3" /> Recording isn&rsquo;t switched on here (help_reflection_write).
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </PageShell>
  );
}
