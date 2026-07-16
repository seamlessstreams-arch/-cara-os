"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useSuccessFactors } from "@/hooks/use-success-factors";
import type {
  SuccessFactor,
  SuccessFactorDomain,
  EvidenceStrength,
  ImplementationStatus,
} from "@/types/extended";
import {
  SUCCESS_FACTOR_DOMAIN_LABEL,
  EVIDENCE_STRENGTH_LABEL,
  IMPLEMENTATION_STATUS_LABEL,
} from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Users,
  Target,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Quote,
  TrendingUp,
  GraduationCap,
  Heart,
  Compass,
  HomeIcon,
  Stethoscope,
  Globe,
  HandHeart,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ─── domain icon ─── */
const domainIcon = (domain: SuccessFactorDomain) => {
  switch (domain) {
    case "relational":
      return <Heart className="h-4 w-4" />;
    case "practice":
      return <Target className="h-4 w-4" />;
    case "multi_agency":
      return <Globe className="h-4 w-4" />;
    case "environment":
      return <HomeIcon className="h-4 w-4" />;
    case "family":
      return <HandHeart className="h-4 w-4" />;
    case "education":
      return <GraduationCap className="h-4 w-4" />;
    case "therapeutic":
      return <Stethoscope className="h-4 w-4" />;
    case "independence":
      return <Compass className="h-4 w-4" />;
  }
};

/* ─── export columns ─── */
const exportCols: ExportColumn<SuccessFactor>[] = [
  { header: "Factor", accessor: (r) => r.factor },
  { header: "Domain", accessor: (r) => SUCCESS_FACTOR_DOMAIN_LABEL[r.domain] },
  { header: "Evidence Strength", accessor: (r) => EVIDENCE_STRENGTH_LABEL[r.evidence_strength] },
  { header: "Implementation", accessor: (r) => IMPLEMENTATION_STATUS_LABEL[r.implementation_status] },
  { header: "Supporting Cases", accessor: (r) => r.supporting_cases.join("; ") },
  { header: "Counter Cases", accessor: (r) => r.counter_cases.join("; ") },
  { header: "Recommended Actions", accessor: (r) => r.recommended_actions.join("; ") },
  { header: "Review Date", accessor: (r) => r.review_date },
  { header: "Reviewed By", accessor: (r) => getStaffName(r.reviewed_by) },
];

/* ─── component ─── */
export default function PlacementSuccessFactorsPage() {
  const homeName = useHomeName();
  const { data = [], isLoading } = useSuccessFactors();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("evidence");

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterDomain !== "all") list = list.filter((r) => r.domain === filterDomain);
    if (filterStatus !== "all") list = list.filter((r) => r.implementation_status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "evidence": {
          const order: Record<EvidenceStrength, number> = { strong: 0, moderate: 1, emerging: 2 };
          return order[a.evidence_strength] - order[b.evidence_strength];
        }
        case "domain":
          return SUCCESS_FACTOR_DOMAIN_LABEL[a.domain].localeCompare(SUCCESS_FACTOR_DOMAIN_LABEL[b.domain]);
        case "status": {
          const order: Record<ImplementationStatus, number> = {
            standard_practice: 0,
            emerging_practice: 1,
            identified_gap: 2,
          };
          return order[a.implementation_status] - order[b.implementation_status];
        }
        case "review":
          return b.review_date.localeCompare(a.review_date);
        default:
          return 0;
      }
    });
    return list;
  }, [data, filterDomain, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const strong = data.filter((f) => f.evidence_strength === "strong").length;
    const standard = data.filter((f) => f.implementation_status === "standard_practice").length;
    const gaps = data.filter((f) => f.implementation_status === "identified_gap").length;
    const domains = new Set(data.map((f) => f.domain)).size;
    return { strong, standard, gaps, domains };
  }, [data]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const evidenceBadge = (e: EvidenceStrength) => {
    switch (e) {
      case "strong":
        return <Badge className="bg-green-100 text-green-800 text-xs">{EVIDENCE_STRENGTH_LABEL[e]} evidence</Badge>;
      case "moderate":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">{EVIDENCE_STRENGTH_LABEL[e]} evidence</Badge>;
      case "emerging":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">{EVIDENCE_STRENGTH_LABEL[e]} evidence</Badge>;
    }
  };

  const statusBadge = (s: ImplementationStatus) => {
    switch (s) {
      case "standard_practice":
        return <Badge className="bg-emerald-100 text-emerald-800 text-xs">{IMPLEMENTATION_STATUS_LABEL[s]}</Badge>;
      case "emerging_practice":
        return <Badge className="bg-indigo-100 text-indigo-800 text-xs">{IMPLEMENTATION_STATUS_LABEL[s]}</Badge>;
      case "identified_gap":
        return <Badge className="bg-red-100 text-red-800 text-xs">{IMPLEMENTATION_STATUS_LABEL[s]}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Placement Success Factors" subtitle="Meta-analysis of what makes placements work — informing future practice across the home">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Placement Success Factors"
      subtitle="Meta-analysis of what makes placements work — informing future practice across the home"
      caraContext={{ pageTitle: "Placement Success Factors", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="placement-success-factors" />
          <PrintButton title="Placement Success Factors" />
          <CaraStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ─── learning banner ─── */}
      <div className="mb-6 rounded-lg border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[var(--cs-cara-gold-bg)] p-2 shrink-0">
            <Sparkles className="h-5 w-5 text-[var(--cs-cara-gold)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--cs-navy)]">
              Systematic learning across all placements
            </p>
            <p className="mt-1 text-xs text-[var(--cs-navy)]">
              This analysis brings together what we have learned from every placement {homeName} has
              held — those that thrived, those that disrupted, and those still in progress. Each
              factor is triangulated against supporting cases, counter-cases, child voice, staff
              reflection, and external evidence. The aim is not to produce a list of good ideas, but
              to identify the conditions, mechanisms and actions that make the difference. This
              record is reviewed quarterly and feeds directly into the Statement of Purpose, the
              Reg 45 review, and the home&apos;s development plan.
            </p>
          </div>
        </div>
      </div>

      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.strong}</p>
            <p className="text-xs text-muted-foreground">Strong evidence factors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.standard}</p>
            <p className="text-xs text-muted-foreground">Standard practice items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.gaps}</p>
            <p className="text-xs text-muted-foreground">Identified gaps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.domains}</p>
            <p className="text-xs text-muted-foreground">Domains covered</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── filters / sort ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterDomain} onValueChange={setFilterDomain}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {(Object.entries(SUCCESS_FACTOR_DOMAIN_LABEL) as [SuccessFactorDomain, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Implementation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All implementation states</SelectItem>
            {(Object.entries(IMPLEMENTATION_STATUS_LABEL) as [ImplementationStatus, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="evidence">Evidence strength</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
              <SelectItem value="status">Implementation</SelectItem>
              <SelectItem value="review">Most recently reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── factor cards ─── */}
      <div className="space-y-4">
        {filtered.map((f) => {
          const expanded = expandedId === f.id;

          return (
            <Card
              key={f.id}
              className={cn(
                "overflow-hidden",
                f.implementation_status === "identified_gap" && "border-red-200",
                f.implementation_status === "emerging_practice" && "border-indigo-200",
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(f.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        f.implementation_status === "identified_gap"
                          ? "bg-red-100 text-red-700"
                          : f.implementation_status === "emerging_practice"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {domainIcon(f.domain)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{f.factor}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {SUCCESS_FACTOR_DOMAIN_LABEL[f.domain]}
                        </Badge>
                        {evidenceBadge(f.evidence_strength)}
                        {statusBadge(f.implementation_status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                      <p className="text-sm">{f.review_date}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* cases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-sm font-medium text-green-900 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4" /> Supporting cases
                      </p>
                      <ul className="space-y-0.5">
                        {f.supporting_cases.map((c, i) => (
                          <li key={i} className="text-xs text-green-900 flex items-start gap-1.5">
                            <span className="mt-1">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-medium text-amber-900 flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" /> Counter cases (absence correlated with disruption)
                      </p>
                      <ul className="space-y-0.5">
                        {f.counter_cases.map((c, i) => (
                          <li key={i} className="text-xs text-amber-900 flex items-start gap-1.5">
                            <span className="mt-1">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* mechanisms / conditions / actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Key mechanisms (why it works)
                      </p>
                      <ul className="space-y-0.5">
                        {f.key_mechanisms.map((m, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {m}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Target className="h-3 w-3" /> Conditions for success
                      </p>
                      <ul className="space-y-0.5">
                        {f.conditions_for_success.map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Recommended actions
                      </p>
                      <ul className="space-y-0.5">
                        {(f.recommended_actions ?? []).map((a, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* voices */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                      <p className="text-xs font-medium text-blue-900 flex items-center gap-1 mb-1">
                        <Quote className="h-3 w-3" /> Child voice on this factor
                      </p>
                      <p className="text-xs text-blue-900">{f.child_voice_on_factor}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 border border-[var(--cs-border)] p-3">
                      <p className="text-xs font-medium text-[var(--cs-text-secondary)] flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" /> Staff perspective
                      </p>
                      <p className="text-xs text-[var(--cs-text-secondary)]">{f.staff_perspective}</p>
                    </div>
                  </div>

                  {/* sources */}
                  <div>
                    <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Evidence sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.evidence_sources.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Domain</p>
                      <p className="text-sm font-medium">{SUCCESS_FACTOR_DOMAIN_LABEL[f.domain]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Evidence</p>
                      <p className="text-sm font-medium">{EVIDENCE_STRENGTH_LABEL[f.evidence_strength]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                      <p className="text-sm font-medium">{f.review_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reviewed by</p>
                      <p className="text-sm font-medium">{getStaffName(f.reviewed_by)}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Quality Standard 13 (the Leadership and Management Standard) requires the registered
          person to lead and manage the home in a way that uses learning to continuously improve
          practice. Regulation 45 of the Children&apos;s Homes Regulations 2015 requires the
          registered person to complete a six-monthly review of the quality of care, drawing on
          internal and external evidence to evaluate effectiveness and inform improvement. This
          meta-analysis directly supports both: it identifies the conditions and mechanisms
          associated with placement success, triangulates supporting and counter cases drawn from
          the home&apos;s history, and translates findings into recommended actions that feed the
          development plan and the Statement of Purpose. Children&apos;s voices and staff
          reflection are weighted alongside external evidence to keep the analysis grounded in
          lived experience.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Placement Evidence"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Placement Success Factors — what works for this child, strengths, protective factors, placement fit, key relationships, routines, interests, learning from previous placements, Reg 45"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
