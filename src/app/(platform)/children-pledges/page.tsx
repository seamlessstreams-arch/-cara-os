"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useChildPledges } from "@/hooks/use-child-pledges";
import type { ChildPledge } from "@/types/extended";
import { PLEDGE_CATEGORY_LABEL, PLEDGE_STATUS_LABEL } from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  Star,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
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

const statusColour: Record<string, string> = {
  consistently_met: "bg-green-100 text-green-800",
  mostly_met: "bg-blue-100 text-blue-800",
  working_on_it: "bg-amber-100 text-amber-800",
  not_yet_met: "bg-red-100 text-red-800",
};

const categoryIcons: Record<string, typeof Heart> = {
  safety: Shield,
  respect: Heart,
  opportunity: Star,
  belonging: Heart,
  voice: Heart,
  identity: Star,
};

const exportCols: ExportColumn<ChildPledge>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Category", accessor: (r) => PLEDGE_CATEGORY_LABEL[r.pledge_category] },
  { header: "Pledge", accessor: (r) => r.pledge },
  { header: "Status", accessor: (r) => PLEDGE_STATUS_LABEL[r.status] },
  { header: "Child Feedback", accessor: (r) => r.child_feedback },
  { header: "Last Review", accessor: (r) => r.last_review_date },
  { header: "UNCRC Article", accessor: (r) => r.uncrc_article },
  { header: "Reviewed With", accessor: (r) => getStaffName(r.reviewed_with) },
];

export default function ChildrenPledgesPage() {
  const { data: res, isLoading } = useChildPledges();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("child");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((p) => p.child_id === filterYP);
    if (filterCategory !== "all") items = items.filter((p) => p.pledge_category === filterCategory);

    items.sort((a, b) => {
      switch (sortBy) {
        case "child":
          return a.child_id.localeCompare(b.child_id);
        case "category":
          return a.pledge_category.localeCompare(b.pledge_category);
        case "status": {
          const ord: Record<string, number> = { consistently_met: 3, mostly_met: 2, working_on_it: 1, not_yet_met: 0 };
          return (ord[a.status] ?? 0) - (ord[b.status] ?? 0);
        }
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterCategory, sortBy]);

  const consistentlyMet = records.filter((p) => p.status === "consistently_met").length;
  const totalPledges = records.length;
  const uniqueYP = new Set(records.map((p) => p.child_id)).size;
  const categoriesCovered = new Set(records.map((p) => p.pledge_category)).size;

  if (isLoading) {
    return (
      <PageShell title="Children's Pledges" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Children's Pledges"
      subtitle="Our promises to each child — co-produced, reviewed regularly, and evidenced through practice"
      caraContext={{ pageTitle: "Children's Pledges", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="children-pledges" />
          <PrintButton title="Children's Pledges" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalPledges}</p>
          <p className="text-xs text-muted-foreground">Total Pledges</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{consistentlyMet}</p>
          <p className="text-xs text-muted-foreground">Consistently Met</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{uniqueYP}</p>
          <p className="text-xs text-muted-foreground">Children Covered</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{categoriesCovered}</p>
          <p className="text-xs text-muted-foreground">Categories Active</p>
        </div>
      </div>

      <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-green-800">
          Pledges are co-produced with each child and reviewed regularly. They form our commitment to
          rights-based care and are linked to UNCRC articles. Children hold us accountable.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(PLEDGE_CATEGORY_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No pledges match your filters.</div>
        )}
        {filtered.map((pledge) => {
          const isExpanded = expandedId === pledge.id;
          const CatIcon = categoryIcons[pledge.pledge_category] || Heart;
          const StatusIcon = pledge.status === "consistently_met" ? CheckCircle
            : pledge.status === "not_yet_met" ? AlertCircle
            : Clock;

          return (
            <div key={pledge.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : pledge.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CatIcon className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{pledge.pledge}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(pledge.child_id)} &middot; {PLEDGE_CATEGORY_LABEL[pledge.pledge_category]} &middot; {pledge.uncrc_article}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[pledge.status])}>
                    {PLEDGE_STATUS_LABEL[pledge.status]}
                  </span>
                  <StatusIcon className={cn("h-4 w-4",
                    pledge.status === "consistently_met" ? "text-green-500" :
                    pledge.status === "not_yet_met" ? "text-red-500" : "text-amber-500"
                  )} />
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">How We Deliver This</p>
                    <p className="text-sm">{pledge.how_we_deliver}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Evidence of Delivery</p>
                    <ul className="space-y-1">
                      {pledge.evidence_of_delivery.map((e, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Feedback
                    </p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{pledge.child_feedback}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>UNCRC: {pledge.uncrc_article}</span>
                    <span>Last reviewed: {pledge.last_review_date}</span>
                    <span>Reviewed with: {getStaffName(pledge.reviewed_with)}</span>
                    <span>Created: {pledge.created_date}</span>
                  </div>

                  <SmartLinkPanel sourceType="child-pledges" sourceId={pledge.id} childId={pledge.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Children&apos;s pledges demonstrate compliance with Quality Standard 1
          (child-centred care), the UNCRC, and Regulation 7 (children&apos;s views, wishes and feelings).
          Pledges are reviewed in children&apos;s meetings and during key work sessions.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Children's Pledges — corporate parent promises, entitlements, activities budget, virtual school, health, culture, identity, participation, listening to children's views"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
