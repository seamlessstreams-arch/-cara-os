"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — External-AI declaration page (§20)
// A non-punitive place to declare external AI use. If it was more than spelling,
// CARA offers the safer route and flags it for manager review. Managers see the
// review queue.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { useAuthContext } from "@/contexts/auth-context";
import { apiFetch } from "@/hooks/use-api";
import { ShieldCheck, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

type DeclType = "no" | "yes" | "not_sure" | "spelling_grammar_only";
const OPTIONS: { value: DeclType; label: string }[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
  { value: "not_sure", label: "Not sure" },
  { value: "spelling_grammar_only", label: "Spelling / grammar only" },
];

const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);

type DeclarationResult = { declaration: Record<string, unknown>; acknowledgement: string };

export default function DeclarePage() {
  const { currentUser, currentRole } = useAuthContext();
  const isManager = MANAGEMENT.has(String(currentRole));
  const [declarationType, setDeclarationType] = useState<DeclType>("no");
  const [declaredTaskType, setTask] = useState("");
  const [toolName, setTool] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<DeclarationResult | null>(null);

  // The declaration route gates manager actions on x-user-role, so the header
  // rides along explicitly (apiFetch only adds x-user-id by itself).
  const submitDeclaration = useMutation({
    mutationFn: () =>
      apiFetch<{ data?: DeclarationResult }>("/api/v1/ask-cara/declaration", {
        method: "POST",
        headers: { "x-user-role": String(currentRole) },
        body: JSON.stringify({ userId: currentUser?.full_name, role: currentRole, declarationType, declaredTaskType, toolName, confidentialDataEntered: confidential, outputCopiedIntoCara: copied, explanation }),
      }),
    onSuccess: (d) => setResult(d.data ?? null),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    submitDeclaration.mutate();
  }

  const saferRoute = result?.declaration?.saferCaraRoute as { message?: string; routes?: { label: string; href?: string }[] } | undefined;

  return (
    <PageShell title="Declare external AI use" subtitle="A safe, non-punitive way to keep CARA's records honest and governed">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
          <p className="text-sm text-teal-900">Declaring external AI use takes integrity and helps keep children&apos;s information safe. There&apos;s no blame here — CARA will simply show you the safer route for next time.</p>
        </div>

        {!result && (
          <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--cs-border,#e2e8ec)] bg-white p-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--cs-navy,#1e293b)]">Did you use an external AI tool for this?</label>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => setDeclarationType(o.value)}
                    className={`rounded-full border px-3 py-1 text-sm ${declarationType === o.value ? "border-teal-500 bg-teal-500 text-white" : "border-[var(--cs-border,#e2e8ec)] text-[var(--cs-navy,#1e293b)]"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {(declarationType === "yes" || declarationType === "not_sure") && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--cs-navy,#1e293b)]">What were you trying to use it for?</label>
                  <input value={declaredTaskType} onChange={(e) => setTask(e.target.value)} placeholder="e.g. make an incident report sound professional" className="w-full rounded-lg border border-[var(--cs-border,#e2e8ec)] px-3 py-2 text-sm" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--cs-navy,#1e293b)]">Which tool? (if known)</label>
                    <input value={toolName} onChange={(e) => setTool(e.target.value)} placeholder="e.g. ChatGPT" className="w-full rounded-lg border border-[var(--cs-border,#e2e8ec)] px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={confidential} onChange={(e) => setConfidential(e.target.checked)} /> Did you enter any child / staff / family / confidential information?</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={copied} onChange={(e) => setCopied(e.target.checked)} /> Did you copy the output into a CARA record?</label>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--cs-navy,#1e293b)]">Anything else? (optional)</label>
                  <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} className="w-full rounded-lg border border-[var(--cs-border,#e2e8ec)] px-3 py-2 text-sm" />
                </div>
              </>
            )}

            {submitDeclaration.isError && (
              <p className="text-sm text-red-600">Your declaration didn&apos;t save — {submitDeclaration.error.message}. Nothing has been recorded; please try again.</p>
            )}

            <button type="submit" disabled={submitDeclaration.isPending} className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {submitDeclaration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit declaration
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-900">{result.acknowledgement}</p>
            {saferRoute && (
              <div className="rounded-lg border border-emerald-200 bg-white p-3">
                <p className="mb-2 text-sm text-[var(--cs-navy,#1e293b)]">{saferRoute.message}</p>
                <div className="flex flex-wrap gap-2">
                  {saferRoute.routes?.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[12px] font-medium text-teal-700">
                      {r.label} <ArrowRight className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={() => setResult(null)} className="text-xs font-medium text-teal-700">Make another declaration</button>
          </div>
        )}

        {isManager && <ManagerReviewQueue role={String(currentRole)} />}
      </div>
    </PageShell>
  );
}

function ManagerReviewQueue({ role }: { role: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ask-cara-declarations", role],
    queryFn: () => apiFetch<{ data?: { declarations?: Array<Record<string, unknown>> } }>("/api/v1/ask-cara/declaration", { headers: { "x-user-role": role } }),
  });
  const items = data?.data?.declarations ?? [];

  const review = useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome: string }) =>
      apiFetch("/api/v1/ask-cara/declaration", { method: "PATCH", headers: { "x-user-role": role }, body: JSON.stringify({ id, outcome }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ask-cara-declarations"] }),
  });

  const pending = items.filter((d) => d.managerReviewStatus === "pending");
  return (
    <div className="rounded-xl border border-[var(--cs-border,#e2e8ec)] bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-[var(--cs-navy,#1e293b)]">Manager review queue {pending.length > 0 && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">{pending.length} pending</span>}</h3>
      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">Couldn&apos;t load the review queue — {error.message}. Declarations may be waiting; retry before assuming the queue is clear.</p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-slate-500">No declarations awaiting review.</p>
      ) : (
        <div className="space-y-2">
          {pending.map((d) => (
            <div key={String(d.id)} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
              <p className="text-[var(--cs-navy,#1e293b)]"><span className="font-semibold">{String(d.userId || "Staff")}</span> · {String(d.declaredTaskType || "unspecified task")}{d.confidentialDataEntered ? " · ⚠ confidential data entered" : ""}</p>
              <div className="mt-1.5 flex gap-2">
                <button disabled={review.isPending} onClick={() => review.mutate({ id: String(d.id), outcome: "no_concern" })} className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] text-white disabled:opacity-60">No concern</button>
                <button disabled={review.isPending} onClick={() => review.mutate({ id: String(d.id), outcome: "guidance_given" })} className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[11px] text-white disabled:opacity-60">Guidance given</button>
                <button disabled={review.isPending} onClick={() => review.mutate({ id: String(d.id), outcome: "escalated" })} className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] text-white disabled:opacity-60">Escalate</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
