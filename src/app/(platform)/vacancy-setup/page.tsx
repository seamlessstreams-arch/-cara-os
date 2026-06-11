"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — VACANCY SETUP PACK  (route: /vacancy-setup)
//
// One pack per vacancy: is it safe to recruit against? Readiness checks,
// the values-led advert draft, the structured interview pack with its
// scoring matrix, and the Schedule 2 checklist the role will require.
// Drafts only — adverts and panel decisions are the manager's.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, Users, FileText, ClipboardCheck, ShieldCheck, GraduationCap,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { useVacancySetupPack } from "@/hooks/use-vacancy-setup-pack";

export default function VacancySetupPage() {
  const [vacancyId, setVacancyId] = useState<string | null>(null);
  const { data, isLoading, error } = useVacancySetupPack(vacancyId);
  const pack = data?.pack;

  return (
    <PageShell
      title="Vacancy Setup Pack"
      subtitle="Readiness checks, the advert draft, the interview scoring pack and the Schedule 2 checklist — before the first applicant arrives"
      quickCreateContext={{ module: "recruitment" }}
    >
      {isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Assembling the pack…</p>}
      {error && <p className="text-sm text-red-600">Couldn&rsquo;t load the vacancy pack. Try refreshing.</p>}

      {data && data.vacancies.length === 0 && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-8 text-center text-sm text-[var(--cs-text-muted)]">
          No vacancies recorded yet — create one from the Safer Recruitment module.
        </div>
      )}

      {data && pack && (
        <div className="space-y-6">
          {/* ── Vacancy selector ── */}
          <div className="flex flex-wrap gap-2">
            {data.vacancies.map((v) => (
              <button
                key={v.id}
                onClick={() => setVacancyId(v.id)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  pack.vacancy.id === v.id
                    ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white"
                    : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-bg)]"
                }`}
              >
                {v.title} · {v.status.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* ── Readiness ── */}
          <div className={`rounded-2xl border p-5 shadow-[var(--cs-shadow-card)] ${pack.ready_to_recruit ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/40"}`}>
            <div className="flex items-center gap-2">
              {pack.ready_to_recruit
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              <h2 className="text-base font-bold text-[var(--cs-navy)]">
                {pack.ready_to_recruit ? "Ready to recruit against this vacancy" : "Not ready yet — actions outstanding"}
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pack.readiness.map((r) => (
                <div key={r.key} className="rounded-xl border border-[var(--cs-border)] bg-white p-3.5">
                  <div className="flex items-start gap-2">
                    {r.status === "ready"
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                    <div>
                      <p className="text-sm font-semibold text-[var(--cs-navy)]">{r.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text-secondary)]">{r.detail}</p>
                      {r.action && <p className="mt-1 text-xs font-semibold text-amber-700">→ {r.action}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panel ── */}
          <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><Users className="h-4 w-4" /> Interview panel eligibility</h3>
            <p className="mt-1 text-xs text-[var(--cs-text-muted)]">{pack.panel.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pack.panel.eligible.map((p) => (
                <span key={p.staff_id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                  <ShieldCheck className="h-3 w-3" /> {p.name} · {p.status === "expiring_soon" ? `current (expires ${p.expiry_date ?? "soon"})` : "current"}
                </span>
              ))}
              {pack.panel.lapsed.map((p) => (
                <span key={p.staff_id} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
                  <AlertTriangle className="h-3 w-3" /> {p.name} · lapsed {p.expiry_date ?? ""}
                </span>
              ))}
              {pack.panel.eligible.length === 0 && pack.panel.lapsed.length === 0 && (
                <span className="text-xs text-[var(--cs-text-muted)]">No safer-recruitment training recorded for any staff member yet.</span>
              )}
            </div>
          </section>

          {/* ── Advert draft ── */}
          <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><FileText className="h-4 w-4" /> Advert draft (values-led)</h3>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 font-sans text-xs leading-relaxed text-[var(--cs-text)]">{pack.advert_draft}</pre>
            <p className="mt-2 text-[11px] text-[var(--cs-text-muted)]">{pack.advert_disclaimer}</p>
          </section>

          {/* ── Interview pack & scoring matrix ── */}
          <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><ClipboardCheck className="h-4 w-4" /> Interview pack — {pack.interview_pack.role_label}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--cs-text-secondary)]">{pack.interview_pack.intro}</p>

            {pack.interview_pack.values_prompts.length > 0 && (
              <ul className="mt-3 space-y-1">
                {pack.interview_pack.values_prompts.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {p}</li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-2">
              {pack.interview_pack.sections.map((s) => (
                <details key={s.key} className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-4 py-2.5">
                  <summary className="cursor-pointer text-sm font-semibold text-[var(--cs-navy)]">{s.title} · {s.questions.length} questions</summary>
                  <ul className="mt-2 space-y-2 pb-1">
                    {s.questions.map((q, i) => (
                      <li key={i} className="text-xs leading-relaxed text-[var(--cs-text-secondary)]">
                        <span className="font-semibold text-[var(--cs-text)]">{q.q}</span>
                        <span className="block text-[var(--cs-text-muted)]">Strong answer: {q.guidance}</span>
                        {q.red_flags.length > 0 && <span className="block text-amber-700">Listen for concerns: {q.red_flags.join("; ")}</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>

            {/* Scoring matrix */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--cs-border)] text-left text-[var(--cs-text-muted)]">
                    <th className="py-2 pr-3 font-semibold">Scoring area</th>
                    {[1, 2, 3, 4, 5].map((n) => <th key={n} className="px-2 py-2 text-center font-semibold">{n}</th>)}
                    <th className="px-2 py-2 font-semibold">Evidence / notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pack.interview_pack.scoring_categories.map((c) => (
                    <tr key={c.key} className="border-b border-[var(--cs-border-subtle,#eee)]">
                      <td className="py-2 pr-3 font-medium text-[var(--cs-navy)]">{c.label}</td>
                      {[1, 2, 3, 4, 5].map((n) => <td key={n} className="px-2 py-2 text-center text-[var(--cs-text-muted)]">○</td>)}
                      <td className="px-2 py-2 text-[var(--cs-text-muted)]" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--cs-text-muted)]">{pack.interview_pack.scoring_guidance}</p>
            <p className="mt-1 text-[11px] text-[var(--cs-text-muted)]">{pack.interview_pack.disclaimer}</p>
          </section>

          {/* ── Schedule 2 checklist ── */}
          <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><GraduationCap className="h-4 w-4" /> Safer-recruitment checklist this role will require</h3>
            <ul className="mt-3 space-y-2">
              {pack.safer_recruitment_checklist.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal-strong)]" />
                  <span><span className="font-semibold text-[var(--cs-navy)]">{c.item}</span><span className="text-[var(--cs-text-muted)]"> — {c.detail}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-[var(--cs-text-muted)]">
              Qualification expectation for this role: {pack.qualification_expectation}
            </p>
          </section>
        </div>
      )}
    </PageShell>
  );
}
