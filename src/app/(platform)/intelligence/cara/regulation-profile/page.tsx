"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION PROFILE (§5.7)
//
// How this child dysregulates and — the point — how they RETURN. Regulation is
// not constant calm; it is the ability to come back towards a manageable state
// and reconnect. CARA suggests content from the emotional-safety analysis, but
// every field is written and owned by the team, in the child's words where
// possible.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useRegulationProfile } from "@/hooks/use-regulation-profile";
import { HeartPulse, Lightbulb, Loader2, Quote } from "lucide-react";
import type { RegulationProfile } from "@/lib/emotional-safety/regulation-profile-engine";

type Field = { key: keyof RegulationProfile; label: string };
const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Baseline & signs",
    fields: [
      { key: "baseline", label: "When settled, this child…" },
      { key: "early_signs", label: "Earliest, quietest signs something is changing" },
      { key: "escalation_signs", label: "Signs of escalating" },
      { key: "shutdown_signs", label: "Signs of shutting down / withdrawing" },
      { key: "body_cues", label: "Body cues, voice, movement" },
    ],
  },
  {
    title: "What helps",
    fields: [
      { key: "helpful_adults", label: "Adults who help (and the order)" },
      { key: "helpful_approaches", label: "Approaches that help" },
      { key: "unhelpful_approaches", label: "Approaches that make it worse" },
      { key: "helpful_language", label: "Language that helps" },
      { key: "sensory_preferences", label: "Sensory preferences" },
      { key: "environment_needs", label: "Environment needs" },
      { key: "safe_places", label: "Safe places" },
      { key: "grounding_activities", label: "Grounding activities" },
    ],
  },
  {
    title: "Coming back",
    fields: [
      { key: "recovery_signs", label: "What recovery looks like for this child" },
      { key: "time_needed", label: "Time usually needed" },
      { key: "readiness_for_reflection", label: "Signs they're ready to reflect" },
    ],
  },
];

export default function RegulationProfilePage() {
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map((yp) => ({ id: yp.id, name: yp.preferred_name || yp.first_name || "Child" }));
  const [selected, setSelected] = useState("");
  const childId = selected || youngPeople[0]?.id || "";
  const q = useRegulationProfile(childId);
  const d = q.data;
  const p = d?.profile;

  return (
    <PageShell
      title="Regulation Profile"
      subtitle="How this child dysregulates — and how they come back. Regulation is return, not constant calm."
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={childId}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-[var(--cs-border,#e2e8f0)] bg-[var(--cs-surface-elevated,#fff)] px-3 py-2 text-sm text-[var(--cs-navy,#1e293b)]"
          >
            {youngPeople.map((yp) => <option key={yp.id} value={yp.id}>{yp.name}</option>)}
          </select>
          {p && <span className="text-xs text-[var(--cs-text-muted,#64748b)]">Updated {p.updated_at.slice(0, 10)} by {p.updated_by}</span>}
        </div>

        {q.isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
          </div>
        )}

        {d && d.suggestions.length > 0 && (
          <Card className="border-[var(--cs-info-soft,#bae6fd)] bg-[var(--cs-info-bg,#f0f9ff)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-[var(--cs-info,#0284c7)]" /> Cara suggests — from the records, for you to weigh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {d.suggestions.map((s) => (
                <div key={s.field} className="rounded-lg border border-[var(--cs-info-soft,#bae6fd)] bg-white/60 px-3 py-2 text-sm">
                  <p className="font-semibold text-[var(--cs-navy,#1e293b)]">{s.field.replace(/_/g, " ")}</p>
                  <p className="mt-0.5 text-[var(--cs-text,#0f172a)]">{s.suggestion}</p>
                  <p className="mt-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                    <span className="font-semibold">Why Cara suggests this:</span> {s.whyShown}
                  </p>
                </div>
              ))}
              <p className="pt-1 text-xs text-[var(--cs-text-muted,#64748b)]">
                These are drafts from behaviour records — accept, edit or ignore them. Nothing is written unless a person writes it.
              </p>
            </CardContent>
          </Card>
        )}

        {d && !p && (
          <Card><CardContent className="p-6 text-sm text-[var(--cs-text-secondary,#475569)]">
            No regulation profile recorded for {d.childName} yet.
            {!d.writeEnabled && " Profile editing is gated behind the regulation_profile_write flag, which is off."}
          </CardContent></Card>
        )}

        {p && (
          <>
            {p.child_own_words && (
              <Card className="border-[var(--cs-cara-gold-soft,#fde68a)] bg-[var(--cs-cara-gold-bg,#fffbeb)]">
                <CardContent className="flex items-start gap-3 pt-5">
                  <Quote className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-cara-gold,#b45309)]" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--cs-cara-gold,#b45309)]">In {d?.childName}&rsquo;s own words</p>
                    <p className="mt-1 text-sm italic text-[var(--cs-navy,#1e293b)]">{p.child_own_words}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {GROUPS.map((g) => (
              <Card key={g.title}>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="h-4 w-4 text-[var(--cs-cara-gold,#b45309)]" /> {g.title}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {g.fields.map((f) => (
                    <div key={String(f.key)}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-secondary,#475569)]">{f.label}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-[var(--cs-text,#0f172a)]">
                        {String(p[f.key] || "").trim() || <span className="text-[var(--cs-text-muted,#94a3b8)]">Not recorded yet.</span>}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {d && !d.writeEnabled && p && (
          <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
            Read-only: editing the profile and recording adult co-regulation reflections is gated behind
            regulation_profile_write, which is off. Cara&rsquo;s evidence-based suggestions still run.
          </p>
        )}
      </div>
    </PageShell>
  );
}
