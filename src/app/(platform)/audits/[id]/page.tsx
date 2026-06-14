"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, AlertTriangle, CheckCircle2, ChevronLeft,
  User, Calendar, Brain, Sparkles, ExternalLink, Upload,
  ShieldAlert, Clock, ArrowRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useAudit, useUpdateAudit, type AuditFinding } from "@/hooks/use-audits";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraUsageBadge } from "@/components/cara/cara-usage-badge";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  medication: "Medication", health_safety: "Health & Safety",
  care_records: "Care Records", finance: "Finance",
  safeguarding: "Safeguarding", staffing: "Staffing",
  environment: "Environment", general: "General",
};

const AUDIT_CATEGORY_NEED: Record<string, string> = {
  medication: "medication_management", health_safety: "health_and_safety",
  care_records: "record_keeping", finance: "financial_management",
  safeguarding: "safeguarding", staffing: "supervision_and_appraisal",
  environment: "health_and_safety", general: "professional_practice",
};

function severityConfig(s: AuditFinding["severity"]) {
  switch (s) {
    case "critical": return { label: "Critical", colour: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" };
    case "high":     return { label: "High",     colour: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" };
    case "medium":   return { label: "Medium",   colour: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
    case "low":      return { label: "Low",      colour: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]", dot: "bg-slate-400" };
  }
}

function findingStatusConfig(s: AuditFinding["status"]) {
  switch (s) {
    case "open":        return { label: "Open",        colour: "bg-red-50 text-red-700 border-red-200" };
    case "in_progress": return { label: "In Progress", colour: "bg-amber-50 text-amber-700 border-amber-200" };
    case "resolved":    return { label: "Resolved",    colour: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
}

function scoreColour(pct: number) {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreBarColour(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-red-500";
}

// ── Finding Card ──────────────────────────────────────────────────────────────

function FindingCard({
  finding,
  index,
  onNeedCreated,
  needCreated,
}: {
  finding: AuditFinding;
  index: number;
  onNeedCreated: (id: string) => void;
  needCreated: boolean;
}) {
  const sc = severityConfig(finding.severity);
  const fc = findingStatusConfig(finding.status);
  const createNeed = useCreateTrainingNeed();

  const handleCreateNeed = () => {
    createNeed.mutate({
      title: `Audit finding: ${finding.area}`,
      need_type: "professional_practice",
      priority: finding.severity === "critical" ? "urgent" : finding.severity === "high" ? "high" : "medium",
      identified_by: "audit",
      status: "identified",
      description: `${finding.description}\n\nRequired action: ${finding.action_required}`,
    }, { onSuccess: () => onNeedCreated(finding.id) });
  };

  return (
    <div className={cn(
      "rounded-2xl border bg-white p-5 space-y-3",
      finding.severity === "critical" ? "border-red-200" :
      finding.severity === "high" ? "border-orange-200" : "border-[var(--cs-border-subtle)]"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className={cn("inline-block h-5 w-5 rounded-full shrink-0 text-white text-[10px] font-bold flex items-center justify-center mt-0.5", sc.dot)}>
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--cs-navy)]">{finding.area}</p>
            {finding.standard_ref && (
              <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{finding.standard_ref}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={cn("text-[10px] rounded-full border", sc.colour)}>{sc.label}</Badge>
          <Badge className={cn("text-[10px] rounded-full border", fc.colour)}>{fc.label}</Badge>
          <CaraUsageBadge caraAssisted={(finding as any).aria_assist_used} sourceTable="audit_findings" recordId={finding.id} />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{finding.description}</p>

      {/* Action required */}
      <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-3 space-y-1">
        <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">Action required</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">{finding.action_required}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--cs-text-muted)]">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{finding.owner}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due {formatDate(finding.due_date)}</span>
        </div>
      </div>

      {/* Training need button */}
      <div className="flex justify-end">
        {needCreated ? (
          <a
            href="/learning/training-needs"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="h-3 w-3" />Training need created
          </a>
        ) : (
          <button
            onClick={handleCreateNeed}
            disabled={createNeed.isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-2.5 py-1 text-xs font-medium text-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)] transition-colors disabled:opacity-50"
          >
            <Brain className="h-3 w-3" />Create training need
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useAudit(id);
  const updateAudit = useUpdateAudit();
  const [showCara, setShowCara] = useState(false);
  const [needsCreated, setNeedsCreated] = useState<Set<string>>(new Set());

  const audit = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Audit Detail">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!audit) {
    return (
      <PageShell title="Audit not found">
        <p className="text-[var(--cs-text-muted)] text-sm">This audit record could not be found.</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => router.push("/audits")}>
          <ChevronLeft className="h-4 w-4" />Back to audits
        </Button>
      </PageShell>
    );
  }

  const scorePct = audit.max_score > 0 ? Math.round((audit.score / audit.max_score) * 100) : 0;
  const openFindings = audit.findings_detail.filter((f) => f.status !== "resolved").length;
  const resolvedFindings = audit.findings_detail.filter((f) => f.status === "resolved").length;

  const caraContext = [
    `Audit: ${audit.title}`,
    `Category: ${CATEGORY_LABELS[audit.category] ?? audit.category}`,
    `Date: ${formatDate(audit.date)}`,
    `Completed by: ${audit.completed_by_name ?? "Not yet completed"}`,
    `Score: ${audit.score}/${audit.max_score} (${scorePct}%)`,
    `Findings: ${audit.findings} total — ${openFindings} open, ${resolvedFindings} resolved`,
    audit.findings_detail.length > 0
      ? `Finding areas: ${audit.findings_detail.map((f) => `${f.area} (${f.severity})`).join("; ")}`
      : null,
    audit.findings_detail.length > 0
      ? `Actions required: ${audit.findings_detail.filter((f) => f.status !== "resolved").map((f) => f.action_required).join("; ")}`
      : null,
  ].filter(Boolean).join("\n");

  return (
    <PageShell
      title={audit.title}
      subtitle={`${CATEGORY_LABELS[audit.category] ?? audit.category} audit — ${formatDate(audit.date)}`}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={audit.title || "Audit Report"} subtitle="Chamberlain House — Audit Record" targetId="audit-detail-content" />
          <SmartUploadButton variant="icon" uploadContext={`Audit: ${audit.title} — supporting evidence or action plan upload`} />
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => router.push("/audits")}>
            <ChevronLeft className="h-3.5 w-3.5" />All audits
          </Button>
        </div>
      }
    >
      <div id="audit-detail-content">
      {/* Cara Panel */}
      {showCara && (
        <div className="mb-6 relative">
          <button
            onClick={() => setShowCara(false)}
            className="absolute top-3 right-3 z-10 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] text-xs"
          >
            ✕ Close
          </button>
          <CaraPanel
            mode="oversee"
            pageContext={`Audit detail — ${audit.title}`}
            recordType="audit"
            sourceContent={caraContext}
          />
        </div>
      )}

      {/* Score header card */}
      <Card className="rounded-2xl shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            {/* Gauge */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9155" fill="none"
                    stroke={scorePct >= 80 ? "#10b981" : scorePct >= 60 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${scorePct} ${100 - scorePct}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-xl font-bold", scoreColour(scorePct))}>{scorePct}%</span>
                </div>
              </div>
              <span className="text-[11px] text-[var(--cs-text-muted)]">{audit.score}/{audit.max_score}</span>
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={cn(
                  "text-[11px] rounded-full border",
                  audit.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : audit.status === "in_progress" ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                )}>
                  {audit.status.replace(/_/g, " ")}
                </Badge>
                <Badge className="text-[11px] rounded-full border bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                  {CATEGORY_LABELS[audit.category] ?? audit.category}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Date", value: formatDate(audit.date), icon: Calendar },
                  { label: "Completed by", value: audit.completed_by_name ?? "—", icon: User },
                  { label: "Findings", value: String(audit.findings), icon: AlertTriangle },
                  { label: "Actions", value: String(audit.actions), icon: ClipboardCheck },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5">
                    <div className="flex items-center gap-1 mb-1">
                      <Icon className="h-3 w-3 text-[var(--cs-text-muted)]" />
                      <span className="text-[10px] text-[var(--cs-text-muted)]">{label}</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--cs-navy)] truncate">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setShowCara((v) => !v)}
              >
                <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
                Cara Analysis
              </Button>
              {audit.status === "in_progress" && (
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    updateAudit.mutate({ id: audit.id, data: { status: "completed" } })
                  }
                  disabled={updateAudit.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Findings list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            Findings
            {openFindings > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-[10px] rounded-full">
                {openFindings} open
              </Badge>
            )}
          </h2>

          {audit.findings_detail.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-[var(--cs-text-muted)]">No findings recorded for this audit</p>
            </div>
          ) : (
            audit.findings_detail.map((finding, i) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                index={i}
                needCreated={needsCreated.has(finding.id)}
                onNeedCreated={(fid) => setNeedsCreated((prev) => new Set([...prev, fid]))}
              />
            ))
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Progress summary */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                Findings progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Open", count: audit.findings_detail.filter((f) => f.status === "open").length, colour: "bg-red-500" },
                { label: "In progress", count: audit.findings_detail.filter((f) => f.status === "in_progress").length, colour: "bg-amber-500" },
                { label: "Resolved", count: audit.findings_detail.filter((f) => f.status === "resolved").length, colour: "bg-emerald-500" },
              ].map(({ label, count, colour }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", colour)} />
                  <span className="text-xs text-[var(--cs-text-secondary)] flex-1">{label}</span>
                  <span className="text-xs font-semibold text-[var(--cs-navy)]">{count}</span>
                </div>
              ))}
              {audit.findings_detail.length > 0 && (
                <div className="pt-1">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    {(["open", "in_progress", "resolved"] as const).map((s) => {
                      const c = audit.findings_detail.filter((f) => f.status === s).length;
                      const pct = Math.round((c / audit.findings_detail.length) * 100);
                      return pct > 0 ? (
                        <div
                          key={s}
                          className={cn("h-full", s === "open" ? "bg-red-500" : s === "in_progress" ? "bg-amber-500" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked training needs */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" />Linked training needs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audit.linked_training_needs.length === 0 ? (
                <p className="text-xs text-[var(--cs-text-muted)] text-center py-3">No training needs linked to this audit yet</p>
              ) : (
                <div className="space-y-2">
                  {audit.linked_training_needs.map((n) => (
                    <div key={n.id} className="rounded-lg border border-[var(--cs-border-subtle)] bg-slate-50 px-3 py-2 text-xs">
                      <div className="font-medium text-[var(--cs-navy)] truncate">{n.title}</div>
                      <div className="text-[var(--cs-text-muted)] mt-0.5 capitalize">{n.status.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs mt-3"
                onClick={() => router.push("/learning/training-needs")}
              >
                View all training needs
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Score benchmark */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                Score benchmark
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Outstanding", min: 90, colour: "bg-emerald-500" },
                { label: "Good", min: 75, colour: "bg-blue-500" },
                { label: "Requires improvement", min: 60, colour: "bg-amber-500" },
                { label: "Inadequate", min: 0, colour: "bg-red-500" },
              ].map(({ label, min, colour }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs",
                    scorePct >= min && (min === 90 || scorePct < [90, 75, 60, 0][["Outstanding", "Good", "Requires improvement", "Inadequate"].indexOf(label) - 1] || min === 90 ? true : false)
                      ? "bg-slate-100 font-semibold text-[var(--cs-navy)] ring-1 ring-slate-300"
                      : "text-[var(--cs-text-muted)]"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full shrink-0", colour)} />
                  <span className="flex-1">{label}</span>
                  <span className="text-[10px] text-[var(--cs-text-muted)]">{min}%+</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-[var(--cs-border-subtle)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--cs-text-muted)]">This audit</span>
                  <span className={cn("font-bold", scoreColour(scorePct))}>{scorePct}%</span>
                </div>
                <Progress value={scorePct} className="h-1.5 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <CareEventsPanel
        title="Care Events in Audit Period"
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
