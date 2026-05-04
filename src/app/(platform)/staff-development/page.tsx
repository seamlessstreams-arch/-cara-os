"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2,
  MessageSquare, GraduationCap, Calendar, ChevronRight,
  Brain, Clock, Search, ShieldAlert, Award, Sparkles,
  ClipboardCheck, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AriaPanel } from "@/components/aria/aria-panel";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { EmptyState } from "@/components/ui/empty-state";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopNeed {
  id: string;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  need_type: string;
  deadline: string | null;
}

interface StaffDevelopmentProfile {
  staff_id: string;
  full_name: string;
  job_title: string;
  role: string;
  start_date: string;
  probation_end_date: string | null;
  open_training_needs: number;
  urgent_training_needs: number;
  completed_training_needs: number;
  training_compliance_pct: number;
  last_supervision_date: string | null;
  next_supervision_date: string | null;
  supervision_overdue: boolean;
  next_appraisal_due: string | null;
  appraisal_overdue: boolean;
  wellbeing_score: number | null;
  status: "on_track" | "attention" | "at_risk";
  top_training_needs: TopNeed[];
}

interface DevelopmentSummary {
  total_staff: number;
  on_track: number;
  needs_attention: number;
  at_risk: number;
  supervision_overdue: number;
  appraisal_overdue: number;
  avg_training_compliance: number;
}

const STAFF_DEV_EXPORT_COLS: ExportColumn<StaffDevelopmentProfile>[] = [
  { header: "Name", accessor: (s) => s.full_name },
  { header: "Job Title", accessor: (s) => s.job_title },
  { header: "Role", accessor: (s) => s.role },
  { header: "Status", accessor: (s) => s.status },
  { header: "Training Compliance", accessor: (s) => `${s.training_compliance_pct}%` },
  { header: "Open Needs", accessor: (s) => String(s.open_training_needs) },
  { header: "Urgent Needs", accessor: (s) => String(s.urgent_training_needs) },
  { header: "Last Supervision", accessor: (s) => s.last_supervision_date ?? "" },
  { header: "Supervision Overdue", accessor: (s) => s.supervision_overdue ? "Yes" : "No" },
  { header: "Next Appraisal", accessor: (s) => s.next_appraisal_due ?? "" },
  { header: "Appraisal Overdue", accessor: (s) => s.appraisal_overdue ? "Yes" : "No" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusConfig(status: StaffDevelopmentProfile["status"]) {
  switch (status) {
    case "on_track":
      return { label: "On Track", colour: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    case "attention":
      return { label: "Attention", colour: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" };
    case "at_risk":
      return { label: "At Risk", colour: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" };
  }
}

function priorityColour(p: string) {
  switch (p) {
    case "urgent": return "border-red-300 bg-red-50 text-red-700";
    case "high": return "border-orange-300 bg-orange-50 text-orange-700";
    default: return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function ComplianceBar({ pct }: { pct: number }) {
  const colour = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", colour)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-600 w-7 text-right">{pct}%</span>
    </div>
  );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  colour = "text-slate-600",
  accent = "bg-slate-50",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  colour?: string;
  accent?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 p-4 flex items-center gap-4", accent)}>
      <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-slate-100")}>
        <Icon className={cn("h-5 w-5", colour)} />
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({
  profile,
  onViewProfile,
}: {
  profile: StaffDevelopmentProfile;
  onViewProfile: (id: string) => void;
}) {
  const sc = statusConfig(profile.status);

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("inline-block h-2 w-2 rounded-full shrink-0", sc.dot)} />
              <h3 className="font-semibold text-slate-900 text-sm truncate">{profile.full_name}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 ml-4">{profile.job_title}</p>
          </div>
          <Badge className={cn("text-[10px] rounded-full border shrink-0", sc.colour)}>
            {sc.label}
          </Badge>
        </div>

        {/* Training compliance */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> Training compliance
            </span>
          </div>
          <ComplianceBar pct={profile.training_compliance_pct} />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 border border-slate-100 py-2 px-1">
            <div className={cn("text-base font-bold", profile.urgent_training_needs > 0 ? "text-red-600" : "text-slate-800")}>
              {profile.open_training_needs}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Open needs</div>
          </div>
          <div className={cn("rounded-xl border py-2 px-1", profile.supervision_overdue ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100")}>
            <div className={cn("text-base font-bold", profile.supervision_overdue ? "text-red-600" : "text-slate-800")}>
              {profile.last_supervision_date ? formatDate(profile.last_supervision_date)?.split(" ").slice(0, 2).join(" ") : "None"}
            </div>
            <div className={cn("text-[10px] leading-tight mt-0.5", profile.supervision_overdue ? "text-red-500" : "text-slate-400")}>
              {profile.supervision_overdue ? "Supervision overdue" : "Last supervision"}
            </div>
          </div>
          <div className={cn("rounded-xl border py-2 px-1", profile.wellbeing_score !== null ? "bg-slate-50 border-slate-100" : "bg-slate-50 border-slate-100")}>
            <div className="text-base font-bold text-slate-800">
              {profile.wellbeing_score !== null ? `${profile.wellbeing_score}/10` : "—"}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Wellbeing</div>
          </div>
        </div>

        {/* Top training needs */}
        {profile.top_training_needs.length > 0 && (
          <div className="space-y-1.5">
            {profile.top_training_needs.map((n) => (
              <div
                key={n.id}
                className={cn("rounded-lg border px-2.5 py-1.5 text-[11px]", priorityColour(n.priority))}
              >
                <div className="font-medium truncate">{n.title}</div>
                {n.deadline && (
                  <div className="flex items-center gap-1 mt-0.5 opacity-70">
                    <Clock className="h-2.5 w-2.5" />
                    Due {formatDate(n.deadline)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Appraisal alert */}
        {profile.appraisal_overdue && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800">
            <Calendar className="h-3 w-3 shrink-0" />
            Appraisal overdue — due {formatDate(profile.next_appraisal_due)}
          </div>
        )}

        {/* View profile button */}
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 text-xs h-8"
          onClick={() => onViewProfile(profile.staff_id)}
        >
          View full profile
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffDevelopmentPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "at_risk" | "attention" | "on_track">("all");
  const [sortBy, setSortBy] = useState<"name" | "compliance" | "status" | "needs">("status");
  const [showAria, setShowAria] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["staff-development"],
    queryFn: () =>
      api.get<{ data: StaffDevelopmentProfile[]; summary: DevelopmentSummary }>(
        "/staff/development"
      ),
  });

  const profiles = data?.data ?? [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    let result = profiles;
    if (filter !== "all") result = result.filter((p) => p.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.job_title.toLowerCase().includes(q)
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "compliance":
          return a.training_compliance_pct - b.training_compliance_pct;
        case "needs":
          return b.urgent_training_needs - a.urgent_training_needs || b.open_training_needs - a.open_training_needs;
        case "status":
        default: {
          const so: Record<string, number> = { at_risk: 0, attention: 1, on_track: 2 };
          return (so[a.status] ?? 9) - (so[b.status] ?? 9);
        }
      }
    });

    return result;
  }, [profiles, filter, search, sortBy]);

  // Build ARIA context from at-risk profiles
  const ariaContext = useMemo(() => {
    const atRisk = profiles.filter((p) => p.status === "at_risk");
    const attention = profiles.filter((p) => p.status === "attention");
    const lines = [
      `Staff development overview for Oak House — ${profiles.length} active staff.`,
      `On track: ${summary?.on_track ?? 0} | Needs attention: ${summary?.needs_attention ?? 0} | At risk: ${summary?.at_risk ?? 0}`,
      `Average training compliance: ${summary?.avg_training_compliance ?? 0}%`,
      summary?.supervision_overdue
        ? `${summary.supervision_overdue} staff have overdue supervisions.`
        : null,
      summary?.appraisal_overdue
        ? `${summary.appraisal_overdue} staff have overdue appraisals.`
        : null,
      atRisk.length > 0
        ? `At-risk staff: ${atRisk.map((p) => `${p.full_name} (${p.urgent_training_needs} urgent needs${p.supervision_overdue ? ", supervision overdue" : ""})`).join("; ")}`
        : null,
      attention.length > 0
        ? `Needs attention: ${attention.map((p) => p.full_name).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    return lines;
  }, [profiles, summary]);

  return (
    <PageShell
      title="Staff Development Hub"
      subtitle="Team-wide development overview — training needs, supervisions, appraisals and compliance"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={STAFF_DEV_EXPORT_COLS} filename="staff-development" />
          <PrintButton title="Staff Development" subtitle="Oak House — Development & CPD" targetId="staff-dev-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Staff Development — training certificate or appraisal upload" />
        </div>
      }
    >
      <div id="staff-dev-content">
      {/* ARIA Panel */}
      {showAria && (
        <div className="mb-6 relative">
          <button
            onClick={() => setShowAria(false)}
            className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕ Close
          </button>
          <AriaPanel
            mode="staff_development_summary"
            pageContext="Staff Development Hub — team overview"
            recordType="staff_development"
            sourceContent={ariaContext}
          />
        </div>
      )}

      {/* Summary tiles */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatTile icon={Users} label="Active staff" value={summary.total_staff} accent="bg-slate-50" />
          <StatTile
            icon={CheckCircle2}
            label="On track"
            value={summary.on_track}
            colour="text-emerald-600"
            accent="bg-emerald-50"
          />
          <StatTile
            icon={AlertTriangle}
            label="Needs attention"
            value={summary.needs_attention}
            colour="text-amber-600"
            accent="bg-amber-50"
          />
          <StatTile
            icon={ShieldAlert}
            label="At risk"
            value={summary.at_risk}
            colour="text-red-600"
            accent="bg-red-50"
          />
          <StatTile
            icon={GraduationCap}
            label="Avg compliance"
            value={`${summary.avg_training_compliance}%`}
            colour="text-blue-600"
            accent="bg-blue-50"
          />
          <StatTile
            icon={MessageSquare}
            label="Supervision overdue"
            value={summary.supervision_overdue}
            colour={summary.supervision_overdue > 0 ? "text-red-600" : "text-slate-500"}
            accent={summary.supervision_overdue > 0 ? "bg-red-50" : "bg-slate-50"}
          />
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="status">Status (at risk first)</option>
            <option value="name">Name A–Z</option>
            <option value="compliance">Compliance (lowest)</option>
            <option value="needs">Urgent needs (most)</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          {(["all", "at_risk", "attention", "on_track"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="h-9 rounded-xl text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All staff" : f.replace("_", " ")}
              {f !== "all" && summary && (
                <span className="ml-1 opacity-70">
                  ({f === "at_risk" ? summary.at_risk : f === "attention" ? summary.needs_attention : summary.on_track})
                </span>
              )}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-9 rounded-xl ml-auto"
          onClick={() => setShowAria((v) => !v)}
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          ARIA Team Analysis
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No staff match your filter"
          description="Try changing the status filter or clearing your search to see all staff members."
          compact
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((profile) => (
            <StaffCard
              key={profile.staff_id}
              profile={profile}
              onViewProfile={(id) => router.push(`/staff/${id}`)}
            />
          ))}
        </div>
      )}

      {/* Learning Studio quick links */}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          Learning Studio — quick links
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Training Needs", href: "/learning/training-needs", icon: AlertTriangle },
            { label: "Workshop Planner", href: "/learning/workshops", icon: Users },
            { label: "Resource Generator", href: "/learning/resources", icon: Sparkles },
            { label: "Knowledge Gaps", href: "/learning/knowledge-gaps", icon: Brain },
            { label: "Supervision", href: "/supervision", icon: MessageSquare },
            { label: "Training Records", href: "/training", icon: GraduationCap },
          ].map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs rounded-xl h-8"
              onClick={() => router.push(href)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>
      </div>
    </PageShell>
  );
}
