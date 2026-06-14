"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLIANCE RULES detail page
// The home's FIXED regulatory checks — hard pass/fail rules, deliberately
// SEPARATE from Cara. Cara suggests; these rules enforce. Every monitored duty
// is shown with its status, severity and the specific record it links to.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Brain, Loader2, Info, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplianceRules } from "@/hooks/use-compliance-rules";
import type { RuleResult, RuleCategory } from "@/lib/compliance-rules/compliance-rules-engine";

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const CATEGORY_LABEL: Record<RuleCategory, string> = {
  "mandatory-info": "Mandatory information",
  "approval-threshold": "Approval threshold",
  "safeguarding-notification": "Safeguarding notification",
  "physical-intervention-review": "Physical-intervention review",
  "medication-error-followup": "Medication-error follow-up",
  "training-expiry": "Training expiry",
  "supervision-due": "Supervision due",
};

export default function ComplianceRulesPage() {
  const { data, isLoading } = useComplianceRules();
  const intel = data?.data;

  return (
    <PageShell
      title="Compliance Rules — Fixed Checks"
      subtitle="Hard regulatory rules, pass or fail — deliberately separate from Cara's suggestions"
      icon={<ShieldCheck className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Compliance Rules — Fixed Checks", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── What this is ───────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              These are <strong>fixed regulatory rules</strong> — each one is simply <em>passing</em> or <em>failing</em> on
              the facts of the record. They are <strong>not</strong> Cara suggestions: Cara may surface a concern, but a
              rule fails on the record, not on a model&rsquo;s confidence. Covers Children&rsquo;s Homes (England)
              Regulations 2015 — Reg&nbsp;33 (supervision), Reg&nbsp;34/35 (medicines &amp; behaviour management),
              Reg&nbsp;40 (notifications) and Reg&nbsp;12/13 (protection &amp; leadership).
            </p>
          </div>

          {/* ── Overview ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Rules evaluated" value={intel.overview.rules_evaluated} />
            <OverviewStat label="Passing" value={intel.overview.passing} tone={intel.overview.passing > 0 ? "green" : "gray"} />
            <OverviewStat label="Failing" value={intel.overview.failing} tone={intel.overview.failing > 0 ? "red" : "green"} />
            <OverviewStat label="Critical" value={intel.overview.by_severity.critical} tone={intel.overview.by_severity.critical > 0 ? "red" : "gray"} />
            <OverviewStat label="High" value={intel.overview.by_severity.high} tone={intel.overview.by_severity.high > 0 ? "amber" : "gray"} />
            <OverviewStat label="Medium" value={intel.overview.by_severity.medium} tone={intel.overview.by_severity.medium > 0 ? "blue" : "gray"} />
          </div>

          {/* ── Cara posture insights ──────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> Cara Compliance Posture
              </h2>
              {(intel.insights ?? []).map((insight, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                  {insight.text}
                </div>
              ))}
            </div>
          )}

          {/* ── Failing rules ──────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Failing rules ({intel.overview.failing})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {intel.rule_results.filter((r) => r.status === "fail").length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>No fixed compliance rules are currently failing. Every monitored regulatory duty is satisfied.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {intel.rule_results.filter((r) => r.status === "fail").map((r) => (
                    <RuleRow key={r.rule_id} rule={r} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Passing rules ──────────────────────────────────────────── */}
          {intel.rule_results.some((r) => r.status === "pass") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Passing rules ({intel.overview.passing})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {intel.rule_results.filter((r) => r.status === "pass").map((r) => (
                    <RuleRow key={r.rule_id} rule={r} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}

// ── Rule row ──────────────────────────────────────────────────────────────────

function RuleRow({ rule }: { rule: RuleResult }) {
  const failing = rule.status === "fail";
  const s = SEVERITY_STYLES[rule.severity] ?? SEVERITY_STYLES.low;
  return (
    <div className={cn("rounded-lg border p-3", failing ? "border-red-100 bg-red-50/40" : "border-[var(--cs-border)]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {failing
            ? <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            : <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <p className="text-sm font-medium">{rule.title}</p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">{rule.message}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge className="text-[10px] bg-gray-100 text-gray-600">{CATEGORY_LABEL[rule.category] ?? rule.category}</Badge>
              {rule.linked_staff_id && (
                <span className="text-[10px] text-[var(--cs-text-muted)]">staff: {rule.linked_staff_id}</span>
              )}
              {rule.linked_event_id && (
                <span className="text-[10px] text-[var(--cs-text-muted)]">event: {rule.linked_event_id}</span>
              )}
            </div>
          </div>
        </div>
        <Badge className={cn("text-[10px] shrink-0", s.bg, s.text)}>{rule.severity}</Badge>
      </div>
    </div>
  );
}

// ── Overview stat ──────────────────────────────────────────────────────────────

function OverviewStat({
  label, value, tone = "neutral", hint,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "blue" | "green" | "gray";
  hint?: string;
}) {
  const toneStyles: Record<string, string> = {
    neutral: "text-[var(--cs-text-secondary)]",
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    green: "text-green-600",
    gray: "text-gray-500",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4">
      <p className={cn("text-2xl font-bold tabular-nums", toneStyles[tone] ?? toneStyles.neutral)}>{value}</p>
      <p className="text-xs text-[var(--cs-text-muted)] mt-1">{label}</p>
      {hint && <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{hint}</p>}
    </div>
  );
}
