"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shield,
  Eye,
  Ear,
  Moon,
  Sun,
  Clock,
  AlertTriangle,
  CheckCircle,
  Heart,
  MessageSquare,
  UserCheck,
  Calendar,
  ScrollText,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── types ───────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

function checkTypeColour(t: string): string {
  switch (t) {
    case "Visual through doorway": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Knock and verbal": return "bg-purple-50 text-purple-700 border-purple-200";
    case "Sensor-only": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "Standard observation": return "bg-slate-50 text-slate-700 border-slate-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function checkTypeIcon(t: string) {
  switch (t) {
    case "Visual through doorway": return <Eye className="h-3 w-3" />;
    case "Knock and verbal": return <Ear className="h-3 w-3" />;
    case "Sensor-only": return <Activity className="h-3 w-3" />;
    case "Standard observation": return <Eye className="h-3 w-3" />;
    default: return <Shield className="h-3 w-3" />;
  }
}

import type { WelfareProtocol } from "@/types/extended";
import { useWelfareProtocols } from "@/hooks/use-welfare-protocols";

const exportCols: ExportColumn<WelfareProtocol>[] = [
  { header: "Young Person", accessor: (r: WelfareProtocol) => getYPName(r.child_id) },
  { header: "Day Frequency", accessor: (r: WelfareProtocol) => r.checkFrequencyByDay },
  { header: "Night Frequency", accessor: (r: WelfareProtocol) => r.checkFrequencyByNight },
  { header: "Check Type", accessor: (r: WelfareProtocol) => r.checkType },
  { header: "Child Can Modify", accessor: (r: WelfareProtocol) => (r.childCanRequestModifications ? "Yes" : "No") },
  { header: "Reviewed With Child", accessor: (r: WelfareProtocol) => (r.reviewedWithChild ? "Yes" : "No") },
  { header: "Reviewed By", accessor: (r: WelfareProtocol) => getStaffName(r.reviewedBy) },
  { header: "Last Reviewed", accessor: (r: WelfareProtocol) => r.reviewedDate },
  { header: "Next Review", accessor: (r: WelfareProtocol) => r.nextReviewDate },
];

// ── component ───────────────────────────────────────────────────────────────
export default function WelfareCheckProtocolPerChildPage() {
  const { data: result, isLoading } = useWelfareProtocols(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (filterType !== "all") items = items.filter((r) => r.checkType === filterType);

    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "type":
          return a.checkType.localeCompare(b.checkType);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, sortBy, data]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalProtocols = data.length;
  const reviewedWithChildCount = data.filter((r) => r.reviewedWithChild).length;
  const reviewsDueSoon = data.filter((r) => r.nextReviewDate <= d(30)).length;
  const specialisedApproaches = data.filter(
    (r) => r.checkType === "Sensor-only" || r.checkType === "Visual through doorway"
  ).length;

  return (
    <PageShell
      title="Welfare Check Protocol — Per Child"
      subtitle="Individualised welfare check plans — frequency, method, signs to watch for. Co-produced with each child."
      ariaContext={{ pageTitle: "Welfare Check Protocol — Per Child", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="welfare-check-protocol-per-child" />
          <PrintButton title="Welfare Check Protocol — Per Child" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalProtocols}</p>
          <p className="text-xs text-muted-foreground">Active Protocols</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {reviewedWithChildCount}/{totalProtocols}
          </p>
          <p className="text-xs text-muted-foreground">Reviewed With Child</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDueSoon}</p>
          <p className="text-xs text-muted-foreground">Reviews Due 30d</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{specialisedApproaches}</p>
          <p className="text-xs text-muted-foreground">Specialised Approaches</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          Welfare checks are an act of relational care, not surveillance. Each protocol is co-produced
          with the child, balances dignity with safeguarding, and is reviewed at least monthly.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Check Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Check Types</SelectItem>
            <SelectItem value="Visual through doorway">Visual through doorway</SelectItem>
            <SelectItem value="Knock and verbal">Knock and verbal</SelectItem>
            <SelectItem value="Sensor-only">Sensor-only</SelectItem>
            <SelectItem value="Standard observation">Standard observation</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">By Next Review</SelectItem>
              <SelectItem value="type">By Check Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── protocol cards ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No protocols match your filters.</div>
        )}
        {filtered.map((r) => {
          const open = expandedId === r.id;
          const reviewDue = r.nextReviewDate <= d(30);
          return (
            <div
              key={r.id}
              className={cn(
                "rounded-xl border bg-white shadow-sm transition-shadow",
                open && "shadow-md"
              )}
            >
              {/* ── header row (click to toggle) ─────────────────────── */}
              <button
                onClick={() => setExpandedId(open ? null : r.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{getYPName(r.child_id)}</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
                          checkTypeColour(r.checkType)
                        )}
                      >
                        {checkTypeIcon(r.checkType)}
                        {r.checkType}
                      </span>
                      {r.reviewedWithChild && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" />
                          Co-produced
                        </span>
                      )}
                      {reviewDue && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          Review due
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Day: {r.checkFrequencyByDay.split(",")[0]} · Night: {r.checkFrequencyByNight.split(",")[0]}
                    </p>
                  </div>
                </div>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* ── expanded body ────────────────────────────────────── */}
              {open && (
                <div className="px-4 pb-4 pt-0 border-t space-y-5 text-sm">
                  {/* frequency block */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-lg border bg-amber-50 border-amber-200 p-3">
                      <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                        <Sun className="h-4 w-4" />
                        Day frequency
                      </div>
                      <p className="text-amber-900">{r.checkFrequencyByDay}</p>
                    </div>
                    <div className="rounded-lg border bg-indigo-50 border-indigo-200 p-3">
                      <div className="flex items-center gap-2 text-indigo-800 font-medium mb-1">
                        <Moon className="h-4 w-4" />
                        Night frequency
                      </div>
                      <p className="text-indigo-900">{r.checkFrequencyByNight}</p>
                    </div>
                  </div>

                  {/* reason */}
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-muted-foreground" />
                      Reason for this frequency
                    </h4>
                    <p className="text-muted-foreground">{r.reasonForFrequency}</p>
                  </div>

                  {/* signs grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1 flex items-center gap-2 text-green-700">
                        <Heart className="h-4 w-4" />
                        Signs of wellbeing to observe
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {r.signsOfWellbeingToObserve.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Signs of concern to watch for
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {r.signsOfConcernToWatchFor.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* technique blocks */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3 bg-slate-50">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Ear className="h-4 w-4 text-muted-foreground" />
                        How to check sensitively
                      </h4>
                      <p className="text-muted-foreground">{r.howToCheckSensitivelyAware}</p>
                    </div>
                    <div className="rounded-lg border p-3 bg-slate-50">
                      <h4 className="font-medium mb-1 flex items-center gap-2">
                        <Moon className="h-4 w-4 text-muted-foreground" />
                        Night check technique
                      </h4>
                      <p className="text-muted-foreground">{r.nightCheckTechnique}</p>
                    </div>
                  </div>

                  {/* child voice */}
                  <div className="rounded-lg border bg-blue-50 border-blue-200 p-3">
                    <h4 className="font-medium mb-1 flex items-center gap-2 text-blue-800">
                      <MessageSquare className="h-4 w-4" />
                      Child's voice & preferences
                    </h4>
                    <p className="text-blue-900 mb-2">{r.childPreferences}</p>
                    <p className="text-xs text-blue-800">
                      Child can request modifications:{" "}
                      <span className="font-medium">
                        {r.childCanRequestModifications ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>

                  {/* approach when awake */}
                  <div>
                    <h4 className="font-medium mb-1 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      Staff approach when child is awake
                    </h4>
                    <p className="text-muted-foreground">{r.staffApproachWhenChildAwake}</p>
                  </div>

                  {/* escalation */}
                  <div className="rounded-lg border bg-red-50 border-red-200 p-3">
                    <h4 className="font-medium mb-1 flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      Escalation criteria
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-red-900">
                      {r.escalationCriteria.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* review footer */}
                  <div className="grid md:grid-cols-3 gap-3 pt-2 border-t text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Last reviewed:</span>
                      <span className="font-medium">{r.reviewedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Reviewed by:</span>
                      <span className="font-medium">{getStaffName(r.reviewedBy)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Next review:</span>
                      <span
                        className={cn(
                          "font-medium",
                          reviewDue ? "text-amber-700" : ""
                        )}
                      >
                        {r.nextReviewDate}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-medium mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-600" />
          Regulatory basis — Quality Standard 5 (Protection of Children)
        </p>
        <p>
          Each child has an individualised welfare check protocol that balances safeguarding with
          dignity and the child's expressed wishes. Protocols are co-produced where possible,
          recorded clearly, and reviewed at least monthly or following any significant change in risk
          or presentation. Staff are inducted on each child's protocol before lone shifts. This page
          supports compliance with the Children's Homes (England) Regulations 2015 and the Guide to
          the Children's Homes Regulations.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Welfare & Safety"
        category={["general", "health", "behaviour"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Welfare Check Protocol — individual child welfare check requirements, check frequency, overnight protocols, sleep check records, safeguarding welfare monitoring, Reg 40 evidence"
        recordType="care_plan"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
