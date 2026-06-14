"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { usePolicyImpactAnalyses } from "@/hooks/use-policy-impact-analyses";
import type { PolicyImpactAnalysis, PolicyImpactArea, PolicyReviewVerdict } from "@/types/extended";
import {
  POLICY_IMPACT_AREA_LABEL,
  POLICY_CHANGE_TYPE_LABEL,
  POLICY_REVIEW_VERDICT_LABEL,
} from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileText,
  TrendingUp,
  TrendingDown,
  Heart,
  CheckCircle,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const verdictColour: Record<PolicyReviewVerdict, string> = {
  working_as_intended: "bg-green-100 text-green-800",
  mostly_working: "bg-blue-100 text-blue-800",
  needs_amendment: "bg-amber-100 text-amber-800",
  withdrawn_replaced: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<PolicyImpactAnalysis>[] = [
  { header: "Policy", accessor: (r) => r.policy_name },
  { header: "Version", accessor: (r) => r.policy_version },
  { header: "Change Date", accessor: (r) => r.change_date },
  { header: "Area", accessor: (r) => POLICY_IMPACT_AREA_LABEL[r.policy_area] },
  { header: "Type", accessor: (r) => POLICY_CHANGE_TYPE_LABEL[r.change_type] },
  { header: "Verdict", accessor: (r) => POLICY_REVIEW_VERDICT_LABEL[r.review_verdict] },
  { header: "Child-Friendly Updated", accessor: (r) => r.child_friendly_version_updated ? "Yes" : "No" },
];

export default function PolicyImpactAnalysisPage() {
  const { data: records = [], isLoading } = usePolicyImpactAnalyses();
  const [filterArea, setFilterArea] = useState("all");
  const [filterVerdict, setFilterVerdict] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterArea !== "all") items = items.filter((p) => p.policy_area === filterArea);
    if (filterVerdict !== "all") items = items.filter((p) => p.review_verdict === filterVerdict);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.change_date.localeCompare(a.change_date);
        case "area":
          return POLICY_IMPACT_AREA_LABEL[a.policy_area].localeCompare(POLICY_IMPACT_AREA_LABEL[b.policy_area]);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterArea, filterVerdict, sortBy]);

  const total = records.length;
  const working = records.filter((p) => p.review_verdict === "working_as_intended").length;
  const childFriendlyUpdated = records.filter((p) => p.child_friendly_version_updated).length;

  if (isLoading) {
    return (
      <PageShell title="Policy Impact Analysis" subtitle="Tracking how policy changes actually land — for children, staff, and the home">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Policy Impact Analysis"
      subtitle="Tracking how policy changes actually land — for children, staff, and the home"
      caraContext={{ pageTitle: "Policy Impact Analysis", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="policy-impact-analysis" />
          <PrintButton title="Policy Impact Analysis" />
          <CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Changes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{working}</p>
          <p className="text-xs text-muted-foreground">Working as Intended</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childFriendlyUpdated}/{total}</p>
          <p className="text-xs text-muted-foreground">Child-Friendly Updated</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{total > 0 ? "100%" : "—"}</p>
          <p className="text-xs text-muted-foreground">Children Informed</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <FileText className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          A policy on paper means nothing. We track every policy change through to lived experience —
          how children are affected, how staff adapt, what works, what surprises us, and how children
          respond. Policies serve children, not the other way around.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Policy Areas</SelectItem>
            {(Object.entries(POLICY_IMPACT_AREA_LABEL) as [PolicyImpactArea, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVerdict} onValueChange={setFilterVerdict}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Verdicts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            {(Object.entries(POLICY_REVIEW_VERDICT_LABEL) as [PolicyReviewVerdict, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="area">By Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;

          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.policy_name} ({p.policy_version})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.change_date} &middot; {POLICY_IMPACT_AREA_LABEL[p.policy_area]} &middot; {POLICY_CHANGE_TYPE_LABEL[p.change_type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", verdictColour[p.review_verdict])}>
                    {POLICY_REVIEW_VERDICT_LABEL[p.review_verdict]}
                  </span>
                  {p.child_friendly_version_updated && <Heart className="h-4 w-4 text-pink-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Why This Changed</p>
                    <p className="text-sm">{p.change_reason}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What Changed</p>
                    <ul className="space-y-1">
                      {p.what_changed.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Users className="h-3 w-3 inline mr-1" />Child Involvement in Change
                    </p>
                    <p className="text-sm">{p.child_involvement_in_change}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <TrendingUp className="h-3 w-3 inline mr-1" />Expected Positive Impact
                      </p>
                      <ul className="space-y-1">
                        {p.expected_impact_positive.map((e, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Risks &amp; Mitigations
                      </p>
                      <ul className="space-y-1">
                        {p.expected_impact_risks.map((e, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">At 30 Days</p>
                      <p className="text-sm">{p.outcomes_observed_at_30d}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">At 90 Days</p>
                      <p className="text-sm">{p.outcomes_observed_at_90d}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">At 180 Days</p>
                      <p className="text-sm">{p.outcomes_observed_at_180d}</p>
                    </div>
                  </div>

                  {p.unintended_consequences.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <TrendingDown className="h-3 w-3 inline mr-1" />Unintended Consequences
                      </p>
                      <ul className="space-y-1">
                        {p.unintended_consequences.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Children&apos;s Feedback Post-Change</p>
                    <ul className="space-y-1">
                      {p.child_feedback_post_change.map((f, i) => (
                        <li key={i} className="text-sm italic">&ldquo;{f}&rdquo;</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Staff trained: {p.staff_training_delivered ? `${p.staff_training_date} (${p.staff_training_format})` : "Not yet"}</span>
                    <span>Children informed: {p.children_informed_date}</span>
                    {p.child_friendly_version_updated && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">
                        Child-friendly v {p.child_friendly_update_date}
                      </span>
                    )}
                    <span>Reviewed: {p.review_date} by {getStaffName(p.reviewed_by)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Policy impact analysis supports Quality Standard 13 (leadership
          and management — evidence-based practice), Reg 45 (review of quality of care), and continuous
          improvement principles. Linked to Policies, Child-Friendly Policies, and Lessons Learned Register.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Policy Impact Analysis — policy effectiveness review, evidence of impact, outcomes data, staff feedback, incident trends, compliance gaps, improvement actions, Reg 45 evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
