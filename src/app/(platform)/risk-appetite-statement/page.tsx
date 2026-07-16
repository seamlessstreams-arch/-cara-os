"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  TreePine,
  Users,
  Wifi,
  Heart,
  Clock,
  GraduationCap,
  AlertTriangle,
  Scale,
  Activity,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useRiskAppetiteDomains } from "@/hooks/use-risk-appetite-domains";
import type { RiskAppetiteDomain, RiskAppetiteLevel } from "@/types/extended";
import { RISK_APPETITE_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local config (icons cannot be serialized to store) ───────────── */

const ICON_MAP: Record<string, React.ElementType> = {
  dom_1: TreePine,
  dom_2: Users,
  dom_3: Wifi,
  dom_4: Heart,
  dom_5: Clock,
  dom_6: GraduationCap,
  dom_7: AlertTriangle,
  dom_8: Shield,
};

const APPETITE_META: Record<RiskAppetiteLevel, { color: string }> = {
  high: { color: "bg-green-100 text-green-800" },
  medium_high: { color: "bg-emerald-100 text-emerald-800" },
  medium: { color: "bg-amber-100 text-amber-800" },
  low: { color: "bg-red-100 text-red-800" },
  graduated: { color: "bg-blue-100 text-blue-800" },
};

const STATEMENT_META = {
  reviewDate: "2026-03-23",
  nextReview: "2026-09-19",
  approvedBy: "staff_darren",
};

const PRINCIPLES = [
  "Would a good parent allow this?",
  "Is restriction proportionate?",
  "Are we protecting or controlling?",
];

/* ── page ──────────────────────────────────────────────────────────── */

export default function RiskAppetiteStatementPage() {
  const homeName = useHomeName();
  const { data: records = [], isLoading } = useRiskAppetiteDomains();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const toleranceMap: Record<RiskAppetiteLevel, number> = {
      high: 5,
      medium_high: 4,
      medium: 3,
      graduated: 3,
      low: 1,
    };
    const levels = records.map((d) => d.appetite_level);
    const avg = levels.length > 0 ? levels.reduce((sum, l) => sum + toleranceMap[l], 0) / levels.length : 0;
    return {
      domainsCovered: records.length,
      averageTolerance: avg.toFixed(1),
      lastReview: STATEMENT_META.reviewDate,
    };
  }, [records]);

  const exportCols: ExportColumn<RiskAppetiteDomain>[] = [
    { header: "Domain", accessor: (r) => r.name },
    { header: "Appetite Level", accessor: (r) => RISK_APPETITE_LEVEL_LABEL[r.appetite_level] },
    { header: "Rationale", accessor: (r) => r.rationale },
    { header: "Red Lines", accessor: (r) => r.red_lines.join("; ") },
    { header: "Decision Authority", accessor: (r) => r.decision_authority },
  ];

  if (isLoading) {
    return (
      <PageShell title="Risk Appetite Statement" subtitle={`Framework for balancing proportionate risk-taking with safeguarding at ${homeName}`}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Risk Appetite Statement"
      subtitle={`Framework for balancing proportionate risk-taking with safeguarding at ${homeName}`}
      caraContext={{ pageTitle: "Risk Appetite Statement", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="risk-appetite-statement" />
          <PrintButton title="Risk Appetite Statement" />
          <CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><Activity className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Domains Covered</p><p className="text-xl font-semibold">{stats.domainsCovered}</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><Scale className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Avg Risk Tolerance</p><p className="text-xl font-semibold">{stats.averageTolerance} / 5</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">Last Review</p><p className="text-xl font-semibold">{STATEMENT_META.reviewDate}</p></div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Guiding Principles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {PRINCIPLES.map((p) => (
              <Badge key={p} variant="outline" className="text-sm py-1 px-3">{p}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Every decision about restricting a child&apos;s liberty, movement, or access should pass through these three questions. If the answer to any is &quot;no&quot;, the restriction must be reconsidered.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {records.map((domain) => {
          const isExpanded = expandedId === domain.id;
          const Icon = ICON_MAP[domain.id] || Shield;
          const meta = APPETITE_META[domain.appetite_level];

          return (
            <Card key={domain.id} className="overflow-hidden">
              <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : domain.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{domain.name}</CardTitle>
                      <Badge className={cn("text-xs", meta.color)}>{RISK_APPETITE_LEVEL_LABEL[domain.appetite_level]}</Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Rationale</p>
                    <p className="text-sm">{domain.rationale}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Examples of Practice</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {domain.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Red Lines</p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-red-700">
                      {domain.red_lines.map((rl, i) => <li key={i}>{rl}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Decision Authority</p>
                    <p className="text-sm">{domain.decision_authority}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Regulatory Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            This statement is informed by the UN Convention on the Rights of the Child (UNCRC), which affirms children&apos;s rights to play (Article 31), privacy (Article 16), freedom of association (Article 15), and participation in decisions affecting them (Article 12).
          </p>
          <p>
            The Children&apos;s Homes (England) Regulations 2015, Quality Standard 3, requires that any restriction on a child&apos;s liberty or autonomy is proportionate and necessary. Blanket restrictions — rules applied to all children regardless of individual risk — are not acceptable.
          </p>
          <p>
            Ofsted has consistently criticised homes that are overly restrictive, noting that excessive risk aversion deprives children of normal childhood experiences and fails to prepare them for independence. A good children&apos;s home enables children to take age-appropriate risks as part of their development.
          </p>
          <p className="text-muted-foreground italic">
            Proportionality is the key principle: restrictions must be the minimum necessary to keep a child safe, individually assessed, regularly reviewed, and clearly recorded with the child&apos;s views captured.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t pt-4">
        <span>Approved by: <span className="font-medium text-foreground">{getStaffName(STATEMENT_META.approvedBy)}</span></span>
        <span>Review date: <span className="font-medium text-foreground">{STATEMENT_META.reviewDate}</span></span>
        <span>Next review: <span className="font-medium text-foreground">{STATEMENT_META.nextReview}</span></span>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Risk Appetite Statement — organisational risk tolerance, domain risk levels, decision thresholds, positive risk-taking, governance, board oversight, QA framework"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
