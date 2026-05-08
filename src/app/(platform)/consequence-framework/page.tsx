"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useConsequenceRecords } from "@/hooks/use-consequence-records";
import type { ConsequenceRecord } from "@/types/extended";
import { BEHAVIOUR_LEVEL_LABEL, CONSEQUENCE_APPROACH_LABEL } from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  MessageCircle,
  RefreshCw,
  Scale,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const levelColour: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
  crisis: "bg-red-200 text-red-900",
};

const approachIcons: Record<string, typeof Heart> = {
  restorative_conversation: MessageCircle,
  natural_consequence: Scale,
  logical_consequence: Scale,
  repair_activity: RefreshCw,
  relational_repair: Heart,
  boundary_reset: AlertTriangle,
};

const exportCols: ExportColumn<ConsequenceRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Date", accessor: (r) => r.date },
  { header: "Behaviour", accessor: (r) => r.behaviour },
  { header: "Level", accessor: (r) => BEHAVIOUR_LEVEL_LABEL[r.behaviour_level] },
  { header: "Approach", accessor: (r) => CONSEQUENCE_APPROACH_LABEL[r.approach] },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "Outcome", accessor: (r) => r.outcome },
  { header: "Repaired", accessor: (r) => r.relationship_repaired ? "Yes" : "Not yet" },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
];

export default function ConsequenceFrameworkPage() {
  const { data: res, isLoading } = useConsequenceRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterYP, setFilterYP] = useState("all");
  const [filterApproach, setFilterApproach] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterApproach !== "all") items = items.filter((r) => r.approach === filterApproach);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "level": {
          const ord: Record<string, number> = { crisis: 0, high: 1, medium: 2, low: 3 };
          return (ord[a.behaviour_level] ?? 4) - (ord[b.behaviour_level] ?? 4);
        }
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterApproach, sortBy]);

  const repaired = records.filter((r) => r.relationship_repaired).length;
  const restorativeCount = records.filter((r) => r.approach === "restorative_conversation").length;
  const avgRepairRate = records.length > 0 ? Math.round((repaired / records.length) * 100) : 0;

  if (isLoading) {
    return (
      <PageShell title="Consequence Framework" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Consequence Framework"
      subtitle="Restorative approach to behaviour management — relational, proportionate, and child-centred"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="consequence-framework" />
          <PrintButton title="Consequence Framework" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{records.length}</p>
          <p className="text-xs text-muted-foreground">Total Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{avgRepairRate}%</p>
          <p className="text-xs text-muted-foreground">Repair Rate</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{restorativeCount}</p>
          <p className="text-xs text-muted-foreground">Restorative Convos</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{records.filter((r) => r.linked_behaviour_plan).length}</p>
          <p className="text-xs text-muted-foreground">Linked to BSP</p>
        </div>
      </div>

      <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-green-800">
          Our approach: Consequences are relational, not punitive. We ask &ldquo;what happened?&rdquo; not &ldquo;what&apos;s wrong with you?&rdquo;
          Every incident is an opportunity to strengthen relationships and build emotional literacy.
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
        <Select value={filterApproach} onValueChange={setFilterApproach}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Approaches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Approaches</SelectItem>
            {Object.entries(CONSEQUENCE_APPROACH_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="level">Level (High→Low)</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No records match your filters.</div>
        )}
        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const ApproachIcon = approachIcons[rec.approach] || MessageCircle;

          return (
            <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ApproachIcon className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{rec.behaviour}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rec.date} &middot; {getYPName(rec.child_id)} &middot; {CONSEQUENCE_APPROACH_LABEL[rec.approach]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", levelColour[rec.behaviour_level])}>
                    {BEHAVIOUR_LEVEL_LABEL[rec.behaviour_level]}
                  </span>
                  {rec.relationship_repaired ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What Happened</p>
                    <p className="text-sm">{rec.description}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />Child&apos;s Voice
                    </p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{rec.child_voice}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Response</p>
                    <p className="text-sm">{rec.staff_response}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Restorative Questions Used</p>
                    <ul className="space-y-1">
                      {rec.restorative_questions.map((q, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcome</p>
                    <p className="text-sm">{rec.outcome}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs pt-2 border-t">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      rec.relationship_repaired ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {rec.relationship_repaired ? "Relationship Repaired" : "Repair In Progress"}
                    </span>
                    {rec.linked_behaviour_plan && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Linked to BSP</span>
                    )}
                    <span className="text-muted-foreground">Recorded by: {getStaffName(rec.recorded_by)}</span>
                  </div>

                  {rec.follow_up && (
                    <div className="bg-green-50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Follow-Up</p>
                      <p className="text-sm text-green-900">{rec.follow_up}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="consequence-records" sourceId={rec.id} childId={rec.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> This framework aligns with Quality Standard 3 (Protection of children —
          positive behaviour management), Children&apos;s Homes Regulations 2015 Regulation 19 (behaviour management),
          and NICE guideline NG205.
        </p>
      </div>
    </PageShell>
  );
}
