"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2, Save, Check, Sparkles, ArrowRight, Heart } from "lucide-react";
import { useEmployerValues, useSaveEmployerValues } from "@/hooks/use-employer-values";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";

type FormState = {
  organisation_name: string; home_name: string;
  core_values: string; expected_behaviours: string; non_negotiables: string;
  care_approach: string; leadership_style: string; therapeutic_model: string;
  pace_commitment: string; trauma_informed_expectations: string; safeguarding_culture: string;
  what_makes_us_different: string; relational_practice_priority: "high" | "medium" | "low";
};

const LINES = (a?: string[]) => (a ?? []).join("\n");
const TO_ARR = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function toForm(p: EmployerValuesProfile | null): FormState {
  return {
    organisation_name: p?.organisation_name ?? "", home_name: p?.home_name ?? "",
    core_values: LINES(p?.core_values), expected_behaviours: LINES(p?.expected_behaviours), non_negotiables: LINES(p?.non_negotiables),
    care_approach: p?.care_approach ?? "", leadership_style: p?.leadership_style ?? "", therapeutic_model: p?.therapeutic_model ?? "",
    pace_commitment: p?.pace_commitment ?? "", trauma_informed_expectations: p?.trauma_informed_expectations ?? "", safeguarding_culture: p?.safeguarding_culture ?? "",
    what_makes_us_different: p?.what_makes_us_different ?? "", relational_practice_priority: (p?.relational_practice_priority as FormState["relational_practice_priority"]) ?? "high",
  };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{label}</span>
      {hint && <span className="ml-2 text-[11px] font-normal text-[var(--cs-text-gentle)]">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-text)] focus:border-[var(--cs-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--cs-teal)]";

export default function EmployerValuesPage() {
  const { data, isLoading } = useEmployerValues();
  const save = useSaveEmployerValues();
  const [form, setForm] = useState<FormState | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => { if (data !== undefined && form === null) setForm(toForm(data)); }, [data, form]);
  const set = (k: keyof FormState, v: string) => setForm((f) => (f ? ({ ...f, [k]: v } as FormState) : f));

  const onSave = () => {
    if (!form) return;
    save.mutate(
      {
        organisation_name: form.organisation_name, home_name: form.home_name,
        core_values: TO_ARR(form.core_values), expected_behaviours: TO_ARR(form.expected_behaviours), non_negotiables: TO_ARR(form.non_negotiables),
        care_approach: form.care_approach, leadership_style: form.leadership_style, therapeutic_model: form.therapeutic_model,
        pace_commitment: form.pace_commitment, trauma_informed_expectations: form.trauma_informed_expectations, safeguarding_culture: form.safeguarding_culture,
        what_makes_us_different: form.what_makes_us_different, relational_practice_priority: form.relational_practice_priority,
      },
      { onSuccess: () => setSavedAt(Date.now()) },
    );
  };

  return (
    <PageShell
      title="Employer Values Profile"
      subtitle="Define what your home stands for — your values, care approach and non-negotiables. This profile powers values-based candidate matching, so you recruit for fit, not just CVs."
      caraContext={{ pageTitle: "Employer Values Profile", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/values-match" className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            View matches <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button onClick={onSave} disabled={!form || save.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-50">
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedAt ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {save.isPending ? "Saving…" : savedAt ? "Saved" : "Save profile"}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-5">
        {(isLoading || !form) && <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

        {form && (
          <>
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]/50 px-4 py-3">
              <Heart className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-teal-strong)]" />
              <p className="text-sm text-[var(--cs-text-secondary)]"><span className="font-semibold text-[var(--cs-navy)]">Care quality starts with workforce quality.</span> A clear values profile helps you attract and recruit people who fit how your home works — and gives every interview a shared yardstick.</p>
            </div>

            <Card>
              <CardContent className="space-y-4 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Organisation"><input className={inputCls} value={form.organisation_name} onChange={(e) => set("organisation_name", e.target.value)} /></Field>
                  <Field label="Home"><input className={inputCls} value={form.home_name} onChange={(e) => set("home_name", e.target.value)} /></Field>
                </div>
                <Field label="Core values" hint="one per line — used directly in matching">
                  <textarea className={cn(inputCls, "min-h-[110px] font-mono text-xs")} value={form.core_values} onChange={(e) => set("core_values", e.target.value)} placeholder={"child-centred\nwarmth\nresilience"} />
                </Field>
                <Field label="Relational practice priority" hint="how heavily relational/therapeutic practice weighs in matching">
                  <select className={inputCls} value={form.relational_practice_priority} onChange={(e) => set("relational_practice_priority", e.target.value)}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 py-5">
                <p className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Sparkles className="h-4 w-4 text-[var(--cs-teal-strong)]" /> How you care &amp; lead</p>
                <Field label="Care approach"><textarea className={cn(inputCls, "min-h-[80px]")} value={form.care_approach} onChange={(e) => set("care_approach", e.target.value)} /></Field>
                <Field label="Leadership style"><textarea className={cn(inputCls, "min-h-[70px]")} value={form.leadership_style} onChange={(e) => set("leadership_style", e.target.value)} /></Field>
                <Field label="Therapeutic model"><textarea className={cn(inputCls, "min-h-[70px]")} value={form.therapeutic_model} onChange={(e) => set("therapeutic_model", e.target.value)} /></Field>
                <Field label="PACE commitment" hint="Playfulness, Acceptance, Curiosity, Empathy"><textarea className={cn(inputCls, "min-h-[70px]")} value={form.pace_commitment} onChange={(e) => set("pace_commitment", e.target.value)} /></Field>
                <Field label="Trauma-informed expectations"><textarea className={cn(inputCls, "min-h-[70px]")} value={form.trauma_informed_expectations} onChange={(e) => set("trauma_informed_expectations", e.target.value)} /></Field>
                <Field label="Safeguarding culture"><textarea className={cn(inputCls, "min-h-[70px]")} value={form.safeguarding_culture} onChange={(e) => set("safeguarding_culture", e.target.value)} /></Field>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 py-5">
                <p className="text-sm font-bold text-[var(--cs-navy)]">Expectations &amp; identity</p>
                <Field label="Expected staff behaviours" hint="one per line">
                  <textarea className={cn(inputCls, "min-h-[90px] font-mono text-xs")} value={form.expected_behaviours} onChange={(e) => set("expected_behaviours", e.target.value)} />
                </Field>
                <Field label="Non-negotiables" hint="one per line — explored at every interview">
                  <textarea className={cn(inputCls, "min-h-[90px] font-mono text-xs")} value={form.non_negotiables} onChange={(e) => set("non_negotiables", e.target.value)} />
                </Field>
                <Field label="What makes this home different"><textarea className={cn(inputCls, "min-h-[80px]")} value={form.what_makes_us_different} onChange={(e) => set("what_makes_us_different", e.target.value)} /></Field>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-4">
              {savedAt && !save.isPending && <span className="text-xs text-[var(--cs-teal-strong)]">Saved — matching updated.</span>}
              <button onClick={onSave} disabled={save.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-50">
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
              </button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
