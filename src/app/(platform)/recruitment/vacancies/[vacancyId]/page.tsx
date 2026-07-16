"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft, Briefcase, Users, Clock, CheckCircle2,
  AlertTriangle, Calendar, ArrowRight, Shield, User,
  Coins, MapPin,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useVacancy } from "@/hooks/use-recruitment";
import type { VacancyCandidate } from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  application_received: "Application",
  shortlisted: "Shortlisted",
  first_interview: "1st Interview",
  second_interview: "2nd Interview",
  conditional_offer: "Conditional Offer",
  pre_start_checks: "Pre-Start Checks",
  final_clearance: "Final Clearance",
  onboarding: "Onboarding",
  appointed: "Appointed",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
};

const STAGE_ORDER = [
  "application_received", "shortlisted", "first_interview", "second_interview",
  "conditional_offer", "pre_start_checks", "final_clearance", "onboarding", "appointed",
];

function riskColour(level: string) {
  switch (level) {
    case "critical": return "bg-red-100 text-red-800 border-red-200";
    case "high":     return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium":   return "bg-amber-100 text-amber-800 border-amber-200";
    default:         return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

function stageColour(stage: string) {
  switch (stage) {
    case "appointed":       return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "unsuccessful":
    case "withdrawn":       return "bg-slate-100 text-[var(--cs-text-muted)] border-[var(--cs-border)]";
    case "final_clearance":
    case "pre_start_checks":return "bg-blue-100 text-blue-800 border-blue-200";
    case "conditional_offer":return "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]";
    default:                return "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]";
  }
}

function complianceColour(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

// ── Candidate row ─────────────────────────────────────────────────────────────

function CandidateRow({
  candidate,
  onView,
}: {
  candidate: VacancyCandidate;
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-[var(--cs-surface)] transition-colors group">
      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-[var(--cs-text-secondary)] shrink-0">
        {candidate.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--cs-navy)]">{candidate.name}</div>
        <div className="text-xs text-[var(--cs-text-muted)]">{candidate.email}</div>
      </div>
      <Badge className={cn("text-[10px] rounded-full border shrink-0", stageColour(candidate.stage))}>
        {STAGE_LABELS[candidate.stage] ?? candidate.stage}
      </Badge>
      <Badge className={cn("text-[10px] rounded-full border shrink-0", riskColour(candidate.risk_level))}>
        {candidate.risk_level}
      </Badge>
      <div className="text-center w-16 shrink-0">
        <div className={cn("text-sm font-semibold tabular-nums", complianceColour(candidate.compliance_score))}>
          {candidate.compliance_score}%
        </div>
        <div className="text-[10px] text-[var(--cs-text-muted)]">SCR</div>
      </div>
      <div className="text-center w-16 shrink-0">
        <div className="text-sm font-semibold text-[var(--cs-text-secondary)]">{candidate.days_total}d</div>
        <div className="text-[10px] text-[var(--cs-text-muted)]">In process</div>
      </div>
      <button
        onClick={onView}
        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
      >
        View <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VacancyDetailPage({
  params,
}: {
  params: Promise<{ vacancyId: string }>;
}) {
  const { vacancyId } = use(params);
  const router = useRouter();
  const { data, isLoading } = useVacancy(vacancyId);
  const vacancy = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Vacancy">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!vacancy) {
    return (
      <PageShell title="Vacancy not found">
        <p className="text-[var(--cs-text-muted)] text-sm">This vacancy could not be found.</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => router.push("/recruitment")}>
          <ChevronLeft className="h-4 w-4" />Back to recruitment
        </Button>
      </PageShell>
    );
  }

  const activeCandidates = vacancy.candidates.filter(
    (c) => !["unsuccessful", "withdrawn"].includes(c.stage)
  );
  const inProgress = vacancy.candidates.filter(
    (c) => !["unsuccessful", "withdrawn", "appointed"].includes(c.stage)
  ).length;

  const salaryStr = vacancy.salary_min && vacancy.salary_max
    ? `£${vacancy.salary_min.toLocaleString()} – £${vacancy.salary_max.toLocaleString()}`
    : vacancy.salary_min
    ? `From £${vacancy.salary_min.toLocaleString()}`
    : "Salary on request";

  const statusConfig: Record<string, { label: string; colour: string }> = {
    open:      { label: "Active",   colour: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    on_hold:   { label: "On hold",  colour: "bg-amber-100 text-amber-800 border-amber-200" },
    filled:    { label: "Filled",   colour: "bg-blue-100 text-blue-800 border-blue-200" },
    cancelled: { label: "Cancelled",colour: "bg-slate-100 text-[var(--cs-text-muted)] border-[var(--cs-border)]" },
    draft:     { label: "Draft",    colour: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]" },
  };
  const sc = statusConfig[vacancy.status] ?? { label: vacancy.status, colour: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]" };

  const typeLabels: Record<string, string> = {
    permanent: "Permanent", fixed_term: "Fixed Term", bank: "Bank", agency: "Agency",
  };
  const contractLabels: Record<string, string> = {
    full_time: "Full time", part_time: "Part time", zero_hours: "Zero hours",
  };

  // Pipeline funnel data — only active stages with candidates
  const funnelStages = STAGE_ORDER.map((s) => ({
    key: s,
    label: STAGE_LABELS[s] ?? s,
    count: vacancy.by_stage[s] ?? 0,
  })).filter((s) => s.count > 0 || ["application_received", "shortlisted"].includes(s.key));

  const maxFunnelCount = Math.max(...funnelStages.map((s) => s.count), 1);

  return (
    <PageShell
      title={vacancy.title}
      subtitle={`${typeLabels[vacancy.employment_type] ?? vacancy.employment_type} · ${salaryStr} · ${vacancy.days_open} days open`}
      caraContext={{ pageTitle: "Chamberlain House — Vacancy Detail", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={vacancy.title} subtitle="Vacancy Detail" targetId="vacancy-detail-content" />
          <SmartUploadButton variant="icon" uploadContext={`Vacancy: ${vacancy.title} — job description, application or supporting document upload`} />
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => router.push("/recruitment")}>
            <ChevronLeft className="h-3.5 w-3.5" />All vacancies
          </Button>
        </div>
      }
    >
      <div id="vacancy-detail-content" className="space-y-0">
      {/* Vacancy header card */}
      <Card className="rounded-2xl shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6 items-start">
            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("text-[11px] rounded-full border", sc.colour)}>{sc.label}</Badge>
                <Badge className="text-[11px] rounded-full border bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                  {typeLabels[vacancy.employment_type] ?? vacancy.employment_type}
                </Badge>
                <Badge className="text-[11px] rounded-full border bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                  {contractLabels[vacancy.contract_type] ?? vacancy.contract_type}
                </Badge>
                <Badge className="text-[11px] rounded-full border bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)]">
                  {vacancy.role_code}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Salary",       value: salaryStr,                  icon: Coins },
                  { label: "Hours",        value: vacancy.hours ? `${vacancy.hours}h/wk` : "—", icon: Clock },
                  { label: "Reports to",   value: vacancy.reports_to ? getStaffName(vacancy.reports_to) : "—", icon: User },
                  { label: "Posted",       value: formatDate(vacancy.posted_date), icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Icon className="h-3 w-3 text-[var(--cs-text-muted)]" />
                      <span className="text-[10px] text-[var(--cs-text-muted)]">{label}</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--cs-navy)] truncate">{value}</div>
                  </div>
                ))}
              </div>

              {vacancy.shift_pattern && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
                  <MapPin className="h-3 w-3 text-[var(--cs-text-muted)] shrink-0" />
                  {vacancy.shift_pattern}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-2 shrink-0 min-w-[120px]">
              {[
                { label: "Applications", value: vacancy.applications_count, icon: Users, colour: "text-blue-600", bg: "bg-blue-50" },
                { label: "Active", value: inProgress, icon: Clock, colour: "text-amber-600", bg: "bg-amber-50" },
                { label: "Days open", value: vacancy.days_open, icon: Calendar, colour: "text-[var(--cs-text-secondary)]", bg: "bg-slate-50" },
              ].map(({ label, value, icon: Icon, colour, bg }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-[var(--cs-border-subtle)] bg-white px-3 py-2">
                  <div className={cn("rounded-lg p-1.5", bg)}>
                    <Icon className={cn("h-3.5 w-3.5", colour)} />
                  </div>
                  <div>
                    <div className={cn("text-lg font-bold tabular-nums leading-none", colour)}>{value}</div>
                    <div className="text-[10px] text-[var(--cs-text-muted)]">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)] flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Candidates
            <Badge className="text-[10px] rounded-full bg-blue-100 text-blue-700 border border-blue-200 ml-auto">
              {vacancy.applications_count} total
            </Badge>
          </h2>

          {vacancy.candidates.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center">
              <Users className="h-7 w-7 text-[var(--cs-text-gentle)] mx-auto mb-2" />
              <p className="text-sm text-[var(--cs-text-muted)]">No candidates for this vacancy yet</p>
            </div>
          ) : (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-2">
                {/* Headers */}
                <div className="flex items-center gap-4 px-3 pb-2 text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                  <div className="w-8 shrink-0" />
                  <div className="flex-1">Candidate</div>
                  <div className="shrink-0 w-28">Stage</div>
                  <div className="shrink-0 w-16">Risk</div>
                  <div className="shrink-0 w-16 text-center">SCR</div>
                  <div className="shrink-0 w-16 text-center">Days</div>
                  <div className="w-16 shrink-0" />
                </div>
                <div className="divide-y divide-slate-100">
                  {vacancy.candidates.map((c) => (
                    <CandidateRow
                      key={c.id}
                      candidate={c}
                      onView={() => router.push(`/recruitment/candidates/${c.id}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Pipeline funnel */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {funnelStages.map(({ key, label, count }) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="text-[11px] text-[var(--cs-text-secondary)] w-28 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        key === "appointed" ? "bg-emerald-500"
                          : count > 0 ? "bg-blue-500" : "bg-slate-200"
                      )}
                      style={{ width: `${(count / maxFunnelCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--cs-navy)] w-4 text-right">{count}</span>
                </div>
              ))}
              {vacancy.by_stage.unsuccessful || vacancy.by_stage.withdrawn ? (
                <div className="pt-1 border-t border-[var(--cs-border-subtle)] flex items-center justify-between text-[11px] text-[var(--cs-text-muted)]">
                  <span>Not progressed</span>
                  <span>{(vacancy.by_stage.unsuccessful ?? 0) + (vacancy.by_stage.withdrawn ?? 0)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Safer recruitment overview */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />Safer Recruitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCandidates.length === 0 ? (
                <p className="text-xs text-[var(--cs-text-muted)] text-center py-2">No active candidates</p>
              ) : (
                activeCandidates.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--cs-text-secondary)] font-medium truncate max-w-[130px]">{c.name}</span>
                      <span className={cn("text-xs font-bold tabular-nums", complianceColour(c.compliance_score))}>
                        {c.compliance_score}%
                      </span>
                    </div>
                    <Progress value={c.compliance_score} className="h-1" />
                    {c.compliance_score < 50 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600">
                        <AlertTriangle className="h-2.5 w-2.5" />Checks incomplete
                      </div>
                    )}
                    {c.compliance_score >= 80 && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <CheckCircle2 className="h-2.5 w-2.5" />Checks on track
                      </div>
                    )}
                  </div>
                ))
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs mt-2"
                onClick={() => router.push("/recruitment/safer-recruitment/checks")}
              >
                <Shield className="h-3 w-3" />SCR check tracker
              </Button>
            </CardContent>
          </Card>

          {/* Safeguarding statement */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
                Safeguarding Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
                {vacancy.safeguarding_statement}
              </p>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="rounded-2xl border border-[var(--cs-border-subtle)] bg-slate-50 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Recruitment tools</p>
            {[
              { label: "All candidates",  href: "/recruitment/candidates" },
              { label: "SCR checks",      href: "/recruitment/safer-recruitment/checks" },
              { label: "References",      href: "/recruitment/safer-recruitment/references" },
              { label: "DBS tracker",     href: "/recruitment/safer-recruitment/dbs" },
              { label: "Interviews",      href: "/recruitment/safer-recruitment/interviews" },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full text-left flex items-center justify-between rounded-lg hover:bg-white hover:shadow-sm px-3 py-2 text-xs text-[var(--cs-text-secondary)] transition-all"
              >
                {label}
                <ArrowRight className="h-3 w-3 text-[var(--cs-text-muted)]" />
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>{/* close #vacancy-detail-content */}
    </PageShell>
  );
}
