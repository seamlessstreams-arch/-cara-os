"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Workflow sign-off panel.
// Manager confirms the assurance checks and signs off. The engine enforces the
// role gate and mandatory blockers server-side; this panel surfaces blockers and
// the resulting audit entry. A Registered Manager may override with a reason.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowSignOff } from "@/hooks/use-oversight-workflow";
import type { OversightInput, OversightResult, WorkflowSignOffResult } from "@/lib/oversight/types";

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[var(--cs-border)] text-[var(--cs-teal,#0d9488)] focus:ring-[var(--cs-teal,#0d9488)]"
      />
      <span className="text-sm text-[var(--cs-text)]">{label}</span>
    </label>
  );
}

export function OversightSignOffPanel({
  input,
  result,
  finalProfessionalOversight,
  childAddressedOversight,
  recordId,
}: {
  input?: OversightInput;
  result: OversightResult;
  finalProfessionalOversight: string;
  childAddressedOversight?: string;
  recordId?: string;
}) {
  const [actionsAssigned, setActionsAssigned] = useState(false);
  const [timescalesRecorded, setTimescalesRecorded] = useState(false);
  const [risksEscalated, setRisksEscalated] = useState(false);
  const [childSafe, setChildSafe] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const signOff = useWorkflowSignOff();
  const data: (WorkflowSignOffResult & { persistedToRecord?: boolean }) | undefined = signOff.data?.data;

  const childModeRequested = !!result.childAddressedSuppressed || !!childAddressedOversight;

  function submit() {
    signOff.mutate({
      input,
      oversightResult: input ? undefined : result,
      finalProfessionalOversight,
      childAddressedOversight,
      confirmActionsAssigned: actionsAssigned,
      confirmTimescalesRecorded: timescalesRecorded,
      confirmRisksEscalated: risksEscalated,
      confirmChildFacingSafeOrSuppressed: childSafe,
      oversightChildModeRequested: childModeRequested,
      overrideReason: overrideReason.trim() || undefined,
      recordId,
      recordType: recordId ? "incident" : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-[var(--cs-border-subtle)]">
        <Check checked={actionsAssigned} onChange={setActionsAssigned} label="All required actions have a responsible owner." />
        <Check checked={timescalesRecorded} onChange={setTimescalesRecorded} label="All required actions have a recorded timescale." />
        <Check
          checked={risksEscalated}
          onChange={setRisksEscalated}
          label="Any outstanding risks have been escalated to the appropriate level."
        />
        <Check
          checked={childSafe}
          onChange={setChildSafe}
          label="Any child-facing wording has been checked as safe to share, or withheld."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--cs-text-muted)]">
          Override reason (Registered Manager only — required to sign off past a mandatory blocker)
        </label>
        <input
          type="text"
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
          placeholder="e.g. SW on leave; cover SW emailed, awaiting confirmation"
          className="w-full rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-text)] focus:border-[var(--cs-teal,#0d9488)] focus:outline-none"
        />
      </div>

      <Button onClick={submit} disabled={signOff.isPending} className="gap-2">
        {signOff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Sign off workflow
      </Button>

      {signOff.isError && (
        <p className="text-sm text-red-700">{(signOff.error as Error)?.message ?? "Sign-off failed."}</p>
      )}

      {data && (
        <div
          className={cn(
            "rounded-xl border p-4",
            data.signed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50",
          )}
        >
          <div className="flex items-center gap-2">
            {data.signed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
            ) : (
              <XCircle className="h-5 w-5 text-amber-600" aria-hidden />
            )}
            <p className={cn("text-sm font-semibold", data.signed ? "text-emerald-900" : "text-amber-900")}>
              {data.signed ? "Workflow signed off" : "Sign-off blocked"}
            </p>
          </div>

          {data.signed && data.persistedToRecord && (
            <p className="mt-1.5 text-sm text-emerald-800">Recorded against the event — it will drop off the oversight queue.</p>
          )}

          {!data.signed && data.reason && <p className="mt-1.5 text-sm text-amber-800">{data.reason}</p>}

          {!data.signed && data.blockers.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
              {data.blockers.map((b) => (
                <li key={b.code}>{b.description}</li>
              ))}
            </ul>
          )}

          {data.signed && data.auditEntry && (
            <dl className="mt-2 space-y-1 text-sm text-emerald-900">
              <div className="flex gap-2">
                <dt className="text-emerald-700">Signed by:</dt>
                <dd className="font-medium">{data.auditEntry.signedOffByRole.replace(/_/g, " ")}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-emerald-700">Date:</dt>
                <dd className="font-medium">{data.auditEntry.signedOffAt}</dd>
              </div>
              {data.auditEntry.overrideUsed && (
                <div className="flex gap-2">
                  <dt className="text-emerald-700">Override:</dt>
                  <dd className="font-medium">{data.auditEntry.overrideReason}</dd>
                </div>
              )}
              {data.auditEntry.qualityAssuranceRoutes.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-emerald-700">Routed to:</dt>
                  <dd className="font-medium">{data.auditEntry.qualityAssuranceRoutes.join(", ")}</dd>
                </div>
              )}
            </dl>
          )}

          {data.signed && !data.auditEntry && (
            <p className="mt-1.5 text-sm text-emerald-800">{data.signOffStatement}</p>
          )}
        </div>
      )}
    </div>
  );
}
