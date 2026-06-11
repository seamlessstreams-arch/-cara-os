"use client";

// CARA STUDIO — /cara-studio/review  (manager review centre)
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { OutputView, type CaraApiResult } from "@/components/cara-studio/studio-bits";
import { AlertTriangle, ShieldCheck, CheckCircle2, Archive, MessageSquare } from "lucide-react";
import type { CaraSavedOutput, CaraGuardrailEvent } from "@/lib/cara-studio/cara-types";

interface ReviewData {
  queue: CaraSavedOutput[];
  recent: CaraSavedOutput[];
  guardrail_events: CaraGuardrailEvent[];
}

export default function CaraReviewPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<ReviewData>({
    queryKey: ["cara-review"],
    queryFn: async () => (await (await fetch("/api/cara/review")).json()).data,
    refetchInterval: 60_000,
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: async (p: { id: string; decision: string }) => {
      const res = await fetch(`/api/cara/review/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-role": "registered_manager" },
        body: JSON.stringify({ decision: p.decision, note: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Review failed");
      return json.data;
    },
    onSuccess: () => { setOpenId(null); setNote(""); qc.invalidateQueries({ queryKey: ["cara-review"] }); },
  });

  return (
    <PageShell title="Cara Review Centre" subtitle="Drafts and safety flags awaiting a manager's eyes — approve, request changes, or archive" quickCreateContext={{ module: "dashboard" }}>
      {isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Loading the review queue…</p>}
      {data && (
        <div className="space-y-6">
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><AlertTriangle className="h-4 w-4 text-amber-600" /> Awaiting review ({data.queue.length})</h2>
            {data.queue.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--cs-text-muted)]">Nothing waiting — all Cara drafts are reviewed.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {data.queue.map((o) => (
                  <div key={o.id} className={`rounded-2xl border bg-white p-4 shadow-[var(--cs-shadow-card)] ${o.guardrail_severity === "critical" || o.guardrail_severity === "high" ? "border-red-200" : "border-[var(--cs-border)]"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--cs-navy)]">{o.title}</p>
                        <p className="text-xs text-[var(--cs-text-muted)]">{o.module.replace(/_/g, " ")} · by {o.created_by} · {new Date(o.created_at).toLocaleString("en-GB")}{o.child_id ? ` · child ${o.child_id}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {o.guardrail_severity && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold uppercase text-red-700">{o.guardrail_severity}</span>}
                        <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="rounded-lg border border-[var(--cs-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]">{openId === o.id ? "Close" : "Review"}</button>
                      </div>
                    </div>
                    {o.manager_review_reasons.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {o.manager_review_reasons.map((r, i) => <li key={i} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">{r}</li>)}
                      </ul>
                    )}
                    {openId === o.id && (
                      <div className="mt-3 space-y-3 border-t border-[var(--cs-border)] pt-3">
                        <OutputView result={{ id: o.id, title: o.title, manager_review_status: o.manager_review_status, manager_review_reasons: o.manager_review_reasons, guardrails: { severity: o.guardrail_severity, flags: o.guardrail_flags }, blocked: false, review_banner: null, blocked_message: null, output: o.output as Record<string, unknown> } as CaraApiResult} />
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note (optional)" className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-sm" />
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => decide.mutate({ id: o.id, decision: "approve" })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>
                          <button onClick={() => decide.mutate({ id: o.id, decision: "request_changes" })} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"><MessageSquare className="h-3.5 w-3.5" /> Request changes</button>
                          <button onClick={() => decide.mutate({ id: o.id, decision: "archive" })} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] px-3 py-2 text-xs font-bold text-[var(--cs-navy)] hover:bg-[var(--cs-bg)]"><Archive className="h-3.5 w-3.5" /> Archive</button>
                        </div>
                        {decide.isError && <p className="text-xs text-red-600">{decide.error.message}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--cs-navy)]"><ShieldCheck className="h-4 w-4 text-[var(--cs-teal-strong)]" /> Recent guardrail events</h2>
            {data.guardrail_events.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--cs-text-muted)]">No guardrail flags raised recently.</p>
            ) : (
              <div className="mt-3 space-y-1.5">
                {data.guardrail_events.map((g) => (
                  <p key={g.id} className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-xs text-[var(--cs-text-secondary)]">
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${g.severity === "critical" ? "bg-red-100 text-red-700" : g.severity === "high" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>{g.severity}</span>
                    {g.risk_type.replace(/_/g, " ")} in {g.module.replace(/_/g, " ")} — “{g.flagged_text}” → {g.action_taken.replace(/_/g, " ")}
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
