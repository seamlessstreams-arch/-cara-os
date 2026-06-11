"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — SHARED UI BITS
// ChildPicker, form primitives, the GeneratorPage scaffold (form → POST →
// rendered output with review/guardrail banners, copy & print), and a generic
// OutputView that renders any Cara output schema without per-type UI code.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useYoungPeople } from "@/hooks/use-young-people";
import { PageShell } from "@/components/layout/page-shell";
import { AlertTriangle, ShieldCheck, Printer, Copy, Sparkles, CheckCircle2 } from "lucide-react";

// ── Form primitives ───────────────────────────────────────────────────────────

export function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2.5 text-sm text-[var(--cs-text)] focus:border-[var(--cs-teal)] focus:outline-none";

export function TextInput(props: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className={inputCls} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />;
}

export function TextArea(props: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return <textarea className={inputCls} rows={props.rows ?? 3} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />;
}

export function Pills<T extends string>(props: { options: readonly T[] | T[]; value: T; onChange: (v: T) => void; labels?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {props.options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => props.onChange(o)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            props.value === o ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-bg)]"
          }`}
        >
          {props.labels?.[o] ?? o.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

export function ChildPicker({ value, onChange, allowNone }: { value: string; onChange: (v: string) => void; allowNone?: boolean }) {
  const { data } = useYoungPeople();
  const children = (data?.data ?? []) as { id: string; first_name: string; last_name: string }[];
  return (
    <div className="flex flex-wrap gap-1.5">
      {allowNone && (
        <button type="button" onClick={() => onChange("")} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${value === "" ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"}`}>No child (general)</button>
      )}
      {children.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${value === c.id ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-bg)]"}`}
        >
          {c.first_name} {c.last_name}
        </button>
      ))}
    </div>
  );
}

// ── Generic output renderer ───────────────────────────────────────────────────

function pretty(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()).trim();
}

function ValueView({ value }: { value: unknown }) {
  if (value == null || value === "") return null;
  if (typeof value === "string") return <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--cs-text-secondary)]">{value}</p>;
  if (typeof value === "number" || typeof value === "boolean") return <p className="text-sm text-[var(--cs-text-secondary)]">{String(value)}</p>;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === "string" || typeof value[0] === "number") {
      return (
        <ul className="space-y-1">
          {value.map((v, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-teal)]" /> {String(v)}</li>
          ))}
        </ul>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((v, i) => (
          <div key={i} className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-bg)] p-3"><ObjectView obj={v as Record<string, unknown>} /></div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") return <ObjectView obj={value as Record<string, unknown>} />;
  return null;
}

function ObjectView({ obj }: { obj: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {Object.entries(obj).map(([k, v]) => {
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0) || k === "managerReviewNeeded" || k === "materialType") return null;
        return (
          <div key={k}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{pretty(k)}</p>
            <div className="mt-0.5"><ValueView value={v} /></div>
          </div>
        );
      })}
    </div>
  );
}

export interface CaraApiResult {
  id: string;
  title: string;
  manager_review_status: string;
  manager_review_reasons: string[];
  guardrails: { severity: string | null; flags: { risk_type: string; severity: string; guidance: string }[] };
  blocked: boolean;
  review_banner: string | null;
  blocked_message: string | null;
  output: Record<string, unknown> | null;
}

export function OutputView({ result }: { result: CaraApiResult }) {
  return (
    <div className="space-y-4">
      {result.review_banner && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">{result.review_banner}</p>
            {result.manager_review_reasons.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-xs">{result.manager_review_reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            )}
          </div>
        </div>
      )}
      {result.blocked ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
          <p className="font-bold">Held for manager review</p>
          <p className="mt-1">{result.blocked_message}</p>
        </div>
      ) : result.output ? (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)]"><Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" /> Cara draft — saved · ID {result.id}</span>
            <span className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result.output, null, 2)).catch(() => {})} className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"><Copy className="h-3 w-3" /> Copy</button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"><Printer className="h-3 w-3" /> Print</button>
            </span>
          </div>
          <h3 className="mb-3 text-base font-bold text-[var(--cs-navy)]">{result.title}</h3>
          <ObjectView obj={result.output} />
        </div>
      ) : null}
      <p className="flex items-start gap-2 text-[11px] text-[var(--cs-text-muted)]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Cara drafts support your thinking — they never replace professional judgement, therapy or safeguarding procedures. Adapt freely; the child in front of you beats any plan.
      </p>
    </div>
  );
}

// ── Generator page scaffold ───────────────────────────────────────────────────

export function GeneratorPage({
  title, subtitle, endpoint, buildBody, children, generateLabel,
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  buildBody: () => Record<string, unknown> | string; // string = validation error
  children: React.ReactNode;
  generateLabel: string;
}) {
  const [result, setResult] = useState<CaraApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    const body = buildBody();
    if (typeof body === "string") { setError(body); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title={title} subtitle={subtitle} quickCreateContext={{ module: "dashboard" }}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)] print:hidden">
          {children}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={generate} disabled={busy} className="w-full rounded-xl bg-[var(--cs-navy)] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--cs-navy-soft)] disabled:opacity-60">
            {busy ? "Cara is drafting…" : generateLabel}
          </button>
        </div>
        <div>
          {result ? <OutputView result={result} /> : (
            <div className="rounded-2xl border border-dashed border-[var(--cs-border)] bg-white/50 p-10 text-center text-sm text-[var(--cs-text-muted)]">
              Fill in the left side and Cara will draft it here — adapted to the child, with safety notes, signs to pause and a recording prompt built in.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
