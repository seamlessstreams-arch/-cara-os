"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFER RECRUITMENT REFERENCE FORM  (public, token-authenticated)
//
// Mobile-first form a referee completes from a one-time secure link. No login.
// Honest, factual, safeguarding-led — adverse answers are routed to the
// manager for review; nothing is hidden or auto-assessed.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, use } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ReferenceSubmission } from "@/lib/safer-recruitment/reference-link-service";

interface FormContext {
  candidate_name: string;
  role_title: string;
  referee_name: string;
  is_most_recent_employer: boolean;
  expires_at: string | null;
}

const EMPTY: ReferenceSubmission = {
  referee_name: "",
  referee_job_title: "",
  organisation: "",
  work_email: "",
  phone: null,
  authorised_to_provide: false,
  relationship: "",
  employed_by_organisation: true,
  employment_dates: null,
  role_held: null,
  worked_with_children: null,
  reason_for_leaving: null,
  disciplinary_concerns: false,
  disciplinary_details: null,
  safeguarding_concerns: false,
  safeguarding_details: null,
  boundary_concerns: false,
  honesty_concerns: false,
  would_re_employ: null,
  suitable_for_children: null,
  anything_else: null,
  declaration_confirmed: false,
};

export default function PublicReferencePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [ctx, setCtx] = useState<FormContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<ReferenceSubmission>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/public/reference/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "This link could not be opened.");
        setCtx(j.data);
      })
      .catch((e) => setLoadError(e.message));
  }, [token]);

  function set<K extends keyof ReferenceSubmission>(key: K, value: ReferenceSubmission[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSubmitting(true);
    setErrors([]);
    try {
      const res = await fetch(`/api/public/reference/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) {
        setErrors(j.errors ?? [j.error ?? "Submission failed — please review and try again."]);
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <header className="border-b border-[var(--cs-border)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <img src="/icon-192.png" alt="Cara" className="h-8 w-8 rounded-lg" />
          <div>
            <p className="text-sm font-extrabold text-[var(--cs-navy)]">Safer Recruitment Reference</p>
            <p className="text-[11px] text-[var(--cs-text-muted)]">Secure one-time link · Cara OS</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 pb-16">
        {loadError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <AlertTriangle className="mb-2 h-5 w-5" />
            {loadError}
          </div>
        )}

        {done && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <h2 className="mt-2 text-lg font-bold text-emerald-900">Reference submitted — thank you</h2>
            <p className="mt-1 text-sm text-emerald-800">
              Your reference has been recorded securely and will be reviewed by the home&rsquo;s manager.
              This link has now been closed.
            </p>
          </div>
        )}

        {ctx && !done && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
              <p className="text-sm leading-relaxed text-[var(--cs-text-secondary)]">
                You&rsquo;ve been asked to provide an employment reference for{" "}
                <span className="font-semibold text-[var(--cs-navy)]">{ctx.candidate_name}</span>, who has applied for{" "}
                <span className="font-semibold text-[var(--cs-navy)]">{ctx.role_title}</span> in a children&rsquo;s residential home.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-[var(--cs-text-muted)]">
                <li>· This reference is for a role working with children — please answer honestly and factually.</li>
                <li>· It should be completed by a senior person with authority to give a reference.</li>
                <li>· Takes about 5 minutes on any device.</li>
              </ul>
            </div>

            {/* About you */}
            <Section title="About you">
              <Input label="Your full name" value={form.referee_name} onChange={(v) => set("referee_name", v)} required />
              <Input label="Your job title" value={form.referee_job_title} onChange={(v) => set("referee_job_title", v)} required />
              <Input label="Your organisation" value={form.organisation} onChange={(v) => set("organisation", v)} required />
              <Input label="Work email address" type="email" value={form.work_email} onChange={(v) => set("work_email", v)} required />
              <Input label="Phone number (optional)" value={form.phone ?? ""} onChange={(v) => set("phone", v || null)} />
              <Toggle label="I am authorised to provide this reference on behalf of my organisation" value={form.authorised_to_provide} onChange={(v) => set("authorised_to_provide", v)} />
              <Input label="How do you know the candidate?" value={form.relationship} onChange={(v) => set("relationship", v)} placeholder="e.g. Line manager, 2023–2026" />
            </Section>

            {/* Employment */}
            <Section title="Employment">
              <Toggle label="The candidate was employed by my organisation" value={form.employed_by_organisation} onChange={(v) => set("employed_by_organisation", v)} />
              <Input label="Dates they worked for you" value={form.employment_dates ?? ""} onChange={(v) => set("employment_dates", v || null)} placeholder="e.g. Jan 2023 – May 2026" />
              <Input label="Role they held" value={form.role_held ?? ""} onChange={(v) => set("role_held", v || null)} />
              <TriState label="Did the role involve working with children or vulnerable adults?" value={form.worked_with_children} onChange={(v) => set("worked_with_children", v)} />
              <Input label="What was their reason for leaving?" value={form.reason_for_leaving ?? ""} onChange={(v) => set("reason_for_leaving", v || null)} />
            </Section>

            {/* Safeguarding & conduct */}
            <Section title="Safeguarding & conduct">
              <Toggle label="Were there any disciplinary concerns?" value={form.disciplinary_concerns} onChange={(v) => set("disciplinary_concerns", v)} warn />
              {form.disciplinary_concerns && (
                <TextArea label="Brief factual details" value={form.disciplinary_details ?? ""} onChange={(v) => set("disciplinary_details", v || null)} required />
              )}
              <Toggle label="Were there any substantiated safeguarding concerns or allegations?" value={form.safeguarding_concerns} onChange={(v) => set("safeguarding_concerns", v)} warn />
              {form.safeguarding_concerns && (
                <TextArea label="Brief factual details" value={form.safeguarding_details ?? ""} onChange={(v) => set("safeguarding_details", v || null)} required />
              )}
              <Toggle label="Any concerns about professional boundaries?" value={form.boundary_concerns} onChange={(v) => set("boundary_concerns", v)} warn />
              <Toggle label="Any concerns about honesty, conduct, reliability or record-keeping?" value={form.honesty_concerns} onChange={(v) => set("honesty_concerns", v)} warn />
              <TriState label="Would you re-employ this person?" value={form.would_re_employ} onChange={(v) => set("would_re_employ", v)} />
              <TriState label="Do you consider them suitable to work with children?" value={form.suitable_for_children} onChange={(v) => set("suitable_for_children", v)} />
              <TextArea label="Anything else relevant to safer recruitment? (optional)" value={form.anything_else ?? ""} onChange={(v) => set("anything_else", v || null)} />
            </Section>

            {/* Declaration */}
            <Section title="Declaration">
              <Toggle
                label="I confirm the information provided is true and accurate to the best of my knowledge"
                value={form.declaration_confirmed}
                onChange={(v) => set("declaration_confirmed", v)}
              />
            </Section>

            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <ul className="list-inside list-disc space-y-1">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--cs-navy)] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[var(--cs-navy-soft)] disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit reference"}
            </button>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--cs-text-muted)]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Your submission is recorded securely with a timestamp for safer-recruitment audit purposes and is only
              visible to authorised managers. This link works once and expires after 7 days.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Small form primitives (mobile-first) ──────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">{label}{required && <span className="text-red-500"> *</span>}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-text)] focus:border-[var(--cs-teal)] focus:outline-none"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">{label}{required && <span className="text-red-500"> *</span>}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-text)] focus:border-[var(--cs-teal)] focus:outline-none"
      />
    </label>
  );
}

function Toggle({ label, value, onChange, warn }: { label: string; value: boolean; onChange: (v: boolean) => void; warn?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
        value
          ? warn ? "border-amber-300 bg-amber-50 text-amber-900" : "border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] text-[var(--cs-navy)]"
          : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"
      }`}
    >
      <span>{label}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${value ? "bg-[var(--cs-navy)] text-white" : "bg-[var(--cs-bg)] text-[var(--cs-text-muted)]"}`}>{value ? "Yes" : "No"}</span>
    </button>
  );
}

function TriState({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <div>
      <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">{label}</span>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {([["Yes", true], ["No", false], ["Not sure", null]] as const).map(([lbl, v]) => (
          <button
            key={lbl}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
              value === v ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
