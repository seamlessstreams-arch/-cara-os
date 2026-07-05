"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Workflow Assurance (Management Oversight Engine)
//
// A manager's single view of the whole professional response to an event:
// deterministic professional oversight, a safe child-addressed version, complete
// workflow visibility, Cara Intelligence, actions and role-gated sign-off.
// Choose a real event to review, or explore the worked example.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Loader2, Lock, Info, ListChecks, Sparkles } from "lucide-react";
import {
  useOversightWorkflowExample,
  useOversightRecordList,
  useOversightFromRecord,
} from "@/hooks/use-oversight-workflow";
import { OversightWorkflowPanel } from "@/components/oversight/oversight-workflow-panel";
import { OversightRecordPicker } from "@/components/oversight/oversight-record-picker";
import { EthicalCyclePanel } from "@/components/ethical-intelligence/ethical-cycle-panel";
import { TapThinkingPanel } from "@/components/tap-thinking/tap-thinking-panel";
import { BiasReflectionPanel } from "@/components/cognitive-bias/bias-reflection-panel";

export default function OversightWorkflowPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep-link support (?id=) without useSearchParams, so the static page needs no
  // Suspense boundary. Read once on mount; reflect changes via replaceState.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setSelectedId(id);
  }, []);

  function syncUrl(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("id", id);
    else url.searchParams.delete("id");
    window.history.replaceState({}, "", url);
  }
  function select(id: string) {
    setSelectedId(id);
    syncUrl(id);
  }
  function showExample() {
    setSelectedId(null);
    syncUrl(null);
  }

  const list = useOversightRecordList();
  const fromRecord = useOversightFromRecord(selectedId);
  const example = useOversightWorkflowExample();

  const usingRecord = !!selectedId;
  const active = usingRecord ? fromRecord : example;
  const payload = usingRecord ? fromRecord.data?.data : example.data?.data;
  const recordMeta = usingRecord ? fromRecord.data?.data.record : undefined;

  return (
    <PageShell
      title="Workflow Assurance"
      subtitle="Management oversight across the whole workflow — deterministic, inspection-ready"
      icon={<ShieldCheck className="h-5 w-5" />}
    >
      {/* Record picker */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
            Choose an event to review
          </CardTitle>
          <CardDescription>
            Run management oversight on a real event, or explore the worked example.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-[var(--cs-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading recent events…
            </div>
          ) : list.isError ? (
            <p className="text-sm text-[var(--cs-text-muted)]">Recent events are unavailable for your role.</p>
          ) : (
            <>
              <OversightRecordPicker
                records={list.data?.data.records ?? []}
                selectedId={selectedId}
                onSelect={select}
              />
              <button
                onClick={showExample}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--cs-teal,#0d9488)] hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" /> Explore the worked example instead
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active oversight */}
      {active.isLoading && (
        <div className="flex items-center gap-2 py-12 text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing the oversight workflow…
        </div>
      )}

      {active.isError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="text-sm font-medium text-amber-900">This oversight is not available</p>
            <p className="text-sm text-amber-800">
              {(active.error as Error)?.message ??
                "You need the add-oversight permission, or the record could not be found."}
            </p>
          </div>
        </div>
      )}

      {payload && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-teal,#0d9488)]" aria-hidden />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[var(--cs-navy)]">
                {recordMeta
                  ? `Reviewing ${recordMeta.reference} — ${recordMeta.type.replace(/_/g, " ")} for ${recordMeta.childName}`
                  : "Worked example (deterministic)"}
              </p>
              <p className="text-xs leading-relaxed text-[var(--cs-text-muted)]">{payload.disclaimer}</p>
            </div>
          </div>
          {/* Reflective bias-checks from the record's own facts, before sign-off. */}
          <BiasReflectionPanel
            compact
            signal={{
              context: "management_oversight",
              childVoiceQuoted: payload.input.childVoiceCaptured,
            }}
          />
          <OversightWorkflowPanel
            key={selectedId ?? "example"}
            input={payload.input}
            result={payload.result}
            recordId={recordMeta?.id}
            childId={recordMeta?.childId}
          />
          {/* Ethical Intelligence spine — where this child's learning cycles sit
              (Experience→…→Integration), each traced to its source records. */}
          {recordMeta?.childId && <EthicalCyclePanel childId={recordMeta.childId} />}
          {/* TAP thinking at the oversight decision point — traced to the record under review. */}
          {recordMeta?.childId && (
            <TapThinkingPanel
              childId={recordMeta.childId}
              childName={recordMeta.childName}
              defaultContext="management_oversight"
              sourceRecord={{ recordType: recordMeta.type, recordId: recordMeta.id }}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
