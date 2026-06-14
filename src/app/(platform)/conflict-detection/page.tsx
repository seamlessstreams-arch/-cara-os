"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONFLICT DETECTION detail page
// Records that disagree about the same child, time or situation — surfaced for a
// human to reconcile, never auto-resolved. The last automation safeguard.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Brain, Loader2, Info, AlertTriangle, CheckCircle2, ArrowRight, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConflictDetection } from "@/hooks/use-conflict-detection";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const SEV_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};
const RISK_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};
const CATEGORY_LABEL: Record<string, string> = {
  present_while_missing: "Care logged during a missing episode",
  injury_contradiction: "Injury recorded then denied",
  conflicting_severity: "Same event graded differently",
  staff_unavailable_conflict: "Working while on leave",
};

function when(iso: string): string {
  if (!iso || iso.length < 16) return iso ?? "";
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function RecordCard({ label, record, highlighted }: { label: string; record: any; highlighted: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3 space-y-1.5 flex-1 min-w-0", highlighted ? "border-brand/40 bg-brand/5" : "border-[var(--cs-border)]")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-[var(--cs-text-muted)]">{label}</span>
        <Badge className={cn("text-[9px]", RISK_BADGE[record.risk_level] ?? RISK_BADGE.low)}>{record.risk_level} risk</Badge>
      </div>
      <p className="text-xs font-medium text-[var(--cs-text-secondary)]">{record.event_type.replace(/_/g, " ")} · {when(record.occurred_at)}</p>
      <p className="text-xs text-[var(--cs-text-primary)] leading-relaxed">{record.summary}</p>
      <p className="font-mono text-[10px] text-[var(--cs-text-muted)]">{record.event_id}</p>
    </div>
  );
}

export default function ConflictDetectionPage() {
  const { data, isLoading } = useConflictDetection();
  const intel = data?.data;

  return (
    <PageShell
      title="Conflict Detection"
      subtitle="Records that disagree about the same child, time or situation — surfaced for human reconciliation, never auto-resolved"
      icon={<Scale className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Conflict Detection", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          {/* ── Safeguard contract ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Duplicate detection finds records that are the <strong>same</strong> event captured twice. Conflict detection finds
              records that <strong>disagree</strong> — a care log written while a child is recorded missing, an injury documented in
              one record and denied in another, the same incident graded "critical" and "low", a staff member delivering care while
              also booked on leave. Each is a data-integrity and often a safeguarding risk. <strong>Every conflict here is surfaced for a
              human to reconcile and is never auto-resolved</strong> — Cara may suggest which record is more likely accurate, with its
              reasoning and confidence, but it never edits either record, hides the disagreement, or silently picks a winner.
            </p>
          </div>

          {/* ── Overview KPIs ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold tabular-nums">{intel.overview.total_events}</p>
              <p className="text-xs text-[var(--cs-text-muted)]">Events scanned</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold tabular-nums", intel.overview.conflicts_found > 0 ? "text-amber-600" : "text-green-600")}>{intel.overview.conflicts_found}</p>
              <p className="text-xs text-[var(--cs-text-muted)]">Conflicts found</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold tabular-nums", intel.overview.critical_or_high > 0 ? "text-red-600" : "text-gray-500")}>{intel.overview.critical_or_high}</p>
              <p className="text-xs text-[var(--cs-text-muted)]">High / critical</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold tabular-nums text-green-600">{intel.overview.auto_resolved}</p>
              <p className="text-xs text-[var(--cs-text-muted)]">Auto-resolved (never)</p>
            </CardContent></Card>
          </div>

          {/* ── Cara insights ──────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5 text-purple-700"><Brain className="h-4 w-4" /> Cara Conflict Intelligence</p>
              {(intel.insights ?? []).map((i, idx) => (
                <div key={idx} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
              ))}
            </div>
          )}

          {/* ── Conflicts ──────────────────────────────────────────────────── */}
          {(intel.conflicts ?? []).length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-green-700 flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              No contradictions found — where two records describe the same child, time or situation, they agree.
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-600" /> Conflicts to reconcile ({intel.conflicts.length})</p>
              {intel.conflicts.map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {c.subject_kind === "staff" ? <UserCog className="h-4 w-4 text-brand" /> : <Scale className="h-4 w-4 text-brand" />}
                        {CATEGORY_LABEL[c.category] ?? c.category} — {c.subject_name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <Badge className={cn("text-[10px] border", SEV_BADGE[c.severity])}>{c.severity}</Badge>
                        <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Needs human review</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{c.description}</p>

                    {/* The two contradicting records */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <RecordCard label="Record A" record={c.event_a} highlighted={c.cara_assessment.likely_accurate_event_id === c.event_a.event_id} />
                      <div className="flex items-center justify-center text-[var(--cs-text-muted)] sm:flex-col">
                        <span className="text-[10px] font-semibold rounded-full border px-2 py-0.5 bg-[var(--cs-bg)]">vs</span>
                      </div>
                      <RecordCard label="Record B" record={c.event_b} highlighted={c.cara_assessment.likely_accurate_event_id === c.event_b.event_id} />
                    </div>

                    {/* Cara advisory assessment */}
                    <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 space-y-1">
                      <p className="text-xs font-semibold flex items-center gap-1.5 text-purple-700">
                        <Brain className="h-3.5 w-3.5" /> Cara assessment
                        <span className="ml-auto font-normal text-[10px] text-purple-500">confidence {Math.round(c.cara_assessment.confidence * 100)}%</span>
                      </p>
                      <p className="text-xs text-purple-900 leading-relaxed">
                        {c.cara_assessment.likely_accurate_event_id
                          ? <>Likely more accurate: <span className="font-mono">{c.cara_assessment.likely_accurate_event_id}</span>. </>
                          : <>No reliable signal as to which record is correct. </>}
                        {c.cara_assessment.reasoning}
                      </p>
                      <p className="text-[10px] text-purple-500 italic">Advisory only — Cara does not edit either record. The decision stays with you.</p>
                    </div>

                    {/* Recommended action */}
                    <div className="flex items-start gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                      <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand" />
                      <span>{c.recommended_action}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
