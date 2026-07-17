"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DATA PERSISTENCE & AUDIT STATUS  (route: /data-persistence)
//
// Answers "is what I'm doing saved, and where's the audit trail?" honestly:
// the current mode, env readiness, a live table probe when durable, the
// per-entity coverage matrix and the exact activation runbook.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import {
  Database, ShieldCheck, AlertTriangle, CheckCircle2, CircleDashed, ScrollText, TerminalSquare,
} from "lucide-react";
import type { PersistenceEntry } from "@/lib/persistence-manifest";

interface PersistenceStatus {
  mode: "durable" | "demo";
  enabled: boolean;
  env: Record<string, boolean>;
  probe: { table: string; ok: boolean; rows: number | null; error: string | null }[];
  summary: { total: number; durable: number; pending: number };
  manifest: PersistenceEntry[];
  demo_note: string | null;
}

const RUNBOOK = [
  { step: "Create a Supabase project", detail: "supabase.com → New project (EU region recommended for UK data). You hold the credentials — never share the service-role key." },
  { step: "Apply the migrations in order", detail: "supabase/migrations/001…424 — `npx supabase db push` with the project linked (or the SQL files in numeric order in the SQL editor). 421/423 are the RLS hardening; 424 adds the super_admin role the HQ gate needs." },
  { step: "Set the environment variables in Vercel (Production)", detail: "NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (legacy ANON_KEY also works) · SUPABASE_SERVICE_ROLE_KEY (server-only) · SUPABASE_HOME_ID=<your home row's uuid> — and, for a real tenant rather than the demo, NEXT_PUBLIC_CARA_MODE=live on a SEPARATE Vercel project." },
  { step: "Redeploy, then verify", detail: "A redeploy bakes the env in; this page flips to Durable and the probe goes green. The full go-live sequence — master-admin bootstrap SQL, sign-off checklist, rollback — is docs/ACTIVATION.md in the repo." },
];

export default function DataPersistencePage() {
  const { data, isLoading } = useQuery<PersistenceStatus>({
    queryKey: ["persistence-status"],
    queryFn: async () => (await (await fetch("/api/v1/system/persistence")).json()).data,
  });

  const areas = data ? [...new Set(data.manifest.map((m) => m.area))] : [];

  return (
    <PageShell
      title="Data persistence & audit"
      subtitle="What survives a redeploy, where every audit trail lives, and exactly how to switch on durable storage"
      quickCreateContext={{ module: "dashboard" }}
    >
      {isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Checking persistence status…</p>}
      {data && (
        <div className="space-y-6">
          {/* ── Mode banner ── */}
          <div className={`rounded-2xl border p-5 shadow-[var(--cs-shadow-card)] ${data.mode === "durable" ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"}`}>
            <div className="flex items-start gap-3">
              {data.mode === "durable"
                ? <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                : <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />}
              <div>
                <h2 className="text-base font-bold text-[var(--cs-navy)]">
                  {data.mode === "durable" ? "Durable mode — changes are saved to your database" : "Demo mode — changes reset on redeploy"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary)]">
                  {data.demo_note ?? `Write-through is live for ${data.summary.durable} of ${data.summary.total} entity groups; every write lands in its real table with the audit fields shown below.`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(data.env).map(([k, v]) => (
                    <span key={k} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${v ? "bg-emerald-100 text-emerald-800" : "bg-[var(--cs-bg)] text-[var(--cs-text-muted)]"}`}>
                      {v ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />} {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Live probe (durable mode) ── */}
          {data.probe.length > 0 && (
            <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><Database className="h-4 w-4" /> Live table probe</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {data.probe.map((p) => (
                  <div key={p.table} className={`rounded-xl border px-3 py-2.5 text-sm ${p.ok ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"}`}>
                    <p className="font-mono text-xs font-semibold text-[var(--cs-navy)]">{p.table}</p>
                    <p className="text-xs text-[var(--cs-text-secondary)]">{p.ok ? `${p.rows} rows` : p.error}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Coverage matrix ── */}
          <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><ScrollText className="h-4 w-4" /> What persists, and where the audit trail lives</h3>
            <p className="mt-1 text-xs text-[var(--cs-text-muted)]">“Write-through” entities are saved to their real table the moment they're created (once durable mode is on) — and read back identically in both modes.</p>
            {areas.map((area) => (
              <div key={area} className="mt-4">
                <p className="text-xs font-bold text-[var(--cs-teal-strong)]">{area}</p>
                <div className="mt-1.5 space-y-1.5">
                  {data.manifest.filter((m) => m.area === area).map((m) => (
                    <div key={m.entity} className="flex flex-col gap-1 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-bg)] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2">
                        {m.write_through
                          ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                        <div>
                          <p className="text-sm font-semibold text-[var(--cs-navy)]">{m.entity}</p>
                          <p className="text-xs text-[var(--cs-text-secondary)]">Audit: {m.audit_trail}{m.note ? ` · ${m.note}` : ""}</p>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-[var(--cs-text-muted)]">{m.table ?? "in-memory"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* ── Activation runbook ── */}
          <section className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><TerminalSquare className="h-4 w-4" /> Switching on durable mode (about 20 minutes)</h3>
            <ol className="mt-3 space-y-3">
              {RUNBOOK.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cs-navy)] text-xs font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--cs-navy)]">{r.step}</p>
                    <p className="text-xs leading-relaxed text-[var(--cs-text-secondary)]">{r.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--cs-text-muted)]">
              Security note: the credentials stay yours — set them directly in Vercel. Cara never exposes keys to the
              browser; the service-role key is used server-side only, and this page reports presence as true/false, never values.
              Full details: docs/ACTIVATION.md in the repository.
            </p>
          </section>
        </div>
      )}
    </PageShell>
  );
}
