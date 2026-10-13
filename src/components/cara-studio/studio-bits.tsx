"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — SHARED UI BITS
// ChildPicker, form primitives, the GeneratorPage scaffold (form → POST →
// rendered output with review/guardrail banners, copy & print), and a generic
// OutputView that renders any Cara output schema without per-type UI code.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { YoungPerson, StaffMember } from "@/types";

interface YPEnriched extends YoungPerson {
  age: number;
  key_worker: StaffMember | null;
  secondary_worker: StaffMember | null;
  open_incidents: number;
  active_tasks: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  active_medications: number;
  risk_flags_count: number;
}

function useYoungPeople(status = "current") {
  return useQuery({
    queryKey: ["young-people", status],
    queryFn: () =>
      api.get<{ data: YPEnriched[]; meta: Record<string, number> }>(
        `/young-people?status=${status}`
      ),
  });
}
import { PageShell } from "@/components/layout/page-shell";
import { AlertTriangle, ShieldCheck, Printer, Copy, Sparkles, CheckCircle2 } from "lucide-react";
import { extractHandout, staffSheetOf, type Handout } from "@/lib/cara-studio/printable";

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

type PrintMode = "staff" | "handout" | "both";

/**
 * The piece of work, laid out to be handed over: one clear block per part, tick boxes for options and a blank answer
 * box under each prompt. Holds nothing staff-only; the draft caveat and the sign-off line sit at the foot.
 */
function HandoutSheet({ handout, reviewRequired }: { handout: Handout; reviewRequired: boolean }) {
  const forStaff = handout.audience === "staff";
  return (
    <div className="space-y-4">
      <div>
        {forStaff && <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">Script for staff — not for the child</p>}
        <h3 className="text-lg font-bold text-[var(--cs-navy)] print:text-2xl">{handout.title}</h3>
        {handout.intro && <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary)] print:text-base">{handout.intro}</p>}
      </div>
      {handout.blocks.map((b, i) => (
        <div key={i} className="break-inside-avoid space-y-1.5 rounded-xl border border-[var(--cs-border)] p-3 print:rounded-none print:border-0 print:border-b print:border-gray-300 print:px-0">
          <h4 className="text-sm font-bold text-[var(--cs-navy)] print:text-base">{b.heading}</h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--cs-text-secondary)] print:text-base">{b.body}</p>
          {b.options && (
            <ul className="space-y-1">
              {b.options.map((o, j) => <li key={j} className="flex items-start gap-2 text-sm print:text-base"><span aria-hidden className="select-none">☐</span> {o}</li>)}
            </ul>
          )}
          {b.childPrompt && (
            <div className="space-y-1">
              <p className="text-sm font-semibold italic text-[var(--cs-navy)] print:text-base">{b.childPrompt}</p>
              {!forStaff && <div className="h-16 rounded-lg border border-dashed border-[var(--cs-border)] print:h-24 print:border-gray-500" aria-hidden />}
            </div>
          )}
        </div>
      ))}
      {handout.lowWritingAlternative && !forStaff && <p className="text-xs text-[var(--cs-text-muted)] print:text-sm">No writing needed: {handout.lowWritingAlternative}</p>}
      <p className="hidden break-inside-avoid border-t border-gray-300 pt-3 text-xs text-[var(--cs-text-muted)] print:block">
        {reviewRequired ? "Needs manager review before use. " : ""}Cara draft — checked by staff before use.   Checked by: ______________________   Date: ______________
      </p>
    </div>
  );
}

export function OutputView({ result }: { result: CaraApiResult }) {
  const [mode, setMode] = useState<PrintMode | null>(null);
  const handout = extractHandout(result.output);
  const staffSheet = result.output ? staffSheetOf(result.output) : null;
  const reviewRequired = result.manager_review_status === "review_required";

  // Print one part (or both) by laying the page out for it first, then opening the print dialog. While printing, every other
  // generated output on the page is hidden (see globals.css), so a list of outputs never prints as one run.
  useEffect(() => {
    if (!mode) return;
    const done = () => { document.body.removeAttribute("data-cs-print"); setMode(null); };
    document.body.setAttribute("data-cs-print", "1");
    window.addEventListener("afterprint", done, { once: true });
    window.print();
    return () => { window.removeEventListener("afterprint", done); document.body.removeAttribute("data-cs-print"); };
  }, [mode]);

  const printBtn = "inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]";
  const staffHidden = mode === "handout" ? "print:hidden" : "";
  const handoutHidden = mode === "staff" ? "print:hidden" : mode === "handout" ? "" : "print:break-before-page";
  return (
    <div className={`cs-output space-y-4 ${mode ? "cs-output-active" : ""}`}>
      {result.review_banner && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
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
        <>
          <div className={`cara-studio-print rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)] print:rounded-none print:border-0 print:p-0 print:shadow-none ${staffHidden}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text-muted)]"><Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" /> Cara draft — saved · ID {result.id}</span>
              <span className="flex flex-wrap gap-2">
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result.output, null, 2)).catch(() => {})} className={printBtn}><Copy className="h-3 w-3" /> Copy</button>
                {handout ? (
                  <>
                    <button onClick={() => setMode("staff")} className={printBtn}><Printer className="h-3 w-3" /> Print staff sheet</button>
                    <button onClick={() => setMode("handout")} className={printBtn}><Printer className="h-3 w-3" /> Print {handout.audience === "staff" ? "script" : "hand-out"}</button>
                    <button onClick={() => setMode("both")} className={printBtn}><Printer className="h-3 w-3" /> Print both</button>
                  </>
                ) : (
                  <button onClick={() => setMode("staff")} className={printBtn}><Printer className="h-3 w-3" /> Print</button>
                )}
              </span>
            </div>
            <h3 className="mb-3 text-base font-bold text-[var(--cs-navy)] print:mb-1 print:text-xl">{result.title}</h3>
            {/* Print-only document caption: carries the draft caveat onto the printed session / piece of work. */}
            <p className="mb-4 hidden text-xs text-[var(--cs-text-muted)] print:block">
              Staff sheet — not for the child. Cara draft — review before use with the child. Printed {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}.
            </p>
            {handout && (
              <p className="mb-3 text-xs text-[var(--cs-text-muted)] print:hidden">
                The piece of work for {handout.audience === "staff" ? "you to use" : "the child"} is below: &ldquo;{handout.title}&rdquo;. It prints on its own page, without these staff notes.
              </p>
            )}
            <ObjectView obj={staffSheet ?? result.output} />
          </div>
          {handout && (
            <div className={`rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)] print:rounded-none print:border-0 print:p-0 print:shadow-none ${handoutHidden}`}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[var(--cs-text-muted)] print:hidden">{handout.audience === "staff" ? "Script" : "Hand-out"} (prints separately)</p>
              <HandoutSheet handout={handout} reviewRequired={reviewRequired} />
            </div>
          )}
        </>
      ) : null}
      <p className="flex items-start gap-2 text-[11px] text-[var(--cs-text-muted)] print:hidden">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Cara supports professional judgement. Staff and managers remain responsible for decisions, recording, and
        safeguarding actions. Adapt freely — the child in front of you beats any plan.
      </p>
    </div>
  );
}

// ── Generator page scaffold ───────────────────────────────────────────────────

export function GeneratorPage({
  title, subtitle, endpoint, buildBody, children, generateLabel, afterResult,
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  buildBody: () => Record<string, unknown> | string; // string = validation error
  children: React.ReactNode;
  generateLabel: string;
  afterResult?: React.ReactNode; // e.g. chain-to-material links, shown once generated
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
          {result ? <div className="space-y-3"><OutputView result={result} /><div className="print:hidden">{afterResult}</div></div> : (
            <div className="rounded-2xl border border-dashed border-[var(--cs-border)] bg-white/50 p-10 text-center text-sm text-[var(--cs-text-muted)]">
              Fill in the left side and Cara will draft it here — adapted to the child, with safety notes, signs to pause and a recording prompt built in.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
