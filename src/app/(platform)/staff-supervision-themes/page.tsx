"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, Layers, Users, CheckCircle2,
  TrendingUp, Heart, BookOpen, MessageSquare, Briefcase, Shield,
  Brain, AlertTriangle, FileText, Target, EyeOff, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useStaffSupervisionThemeRecords } from "@/hooks/use-staff-supervision-theme-records";
import type { StaffSupervisionThemeRecord, StaffSupervisionThemeArea, StaffSupervisionThemeStatus } from "@/types/extended";
import {
  STAFF_SUPERVISION_THEME_AREA_LABEL,
  STAFF_SUPERVISION_THEME_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (colours / icons not serializable) ────────────────────── */

const AREA_CLR: Record<StaffSupervisionThemeArea, string> = {
  practice: "bg-blue-100 text-blue-800",
  wellbeing: "bg-pink-100 text-pink-800",
  training: "bg-purple-100 text-purple-800",
  communication: "bg-cyan-100 text-cyan-800",
  workload: "bg-amber-100 text-amber-800",
  safeguarding: "bg-red-100 text-red-800",
  reflective: "bg-indigo-100 text-indigo-800",
};

const AREA_BORDER: Record<StaffSupervisionThemeArea, string> = {
  practice: "border-l-blue-400",
  wellbeing: "border-l-pink-400",
  training: "border-l-purple-400",
  communication: "border-l-cyan-400",
  workload: "border-l-amber-400",
  safeguarding: "border-l-red-500",
  reflective: "border-l-indigo-400",
};

const AREA_ICON: Record<StaffSupervisionThemeArea, typeof Heart> = {
  practice: Briefcase,
  wellbeing: Heart,
  training: BookOpen,
  communication: MessageSquare,
  workload: TrendingUp,
  safeguarding: Shield,
  reflective: Brain,
};

const STATUS_CLR: Record<StaffSupervisionThemeStatus, string> = {
  emerging: "bg-amber-100 text-amber-800",
  active: "bg-blue-100 text-blue-800",
  addressed: "bg-green-100 text-green-800",
  monitoring: "bg-slate-100 text-slate-700",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StaffSupervisionThemesPage() {
  const { data: records = [], isLoading } = useStaffSupervisionThemeRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "frequency">("newest");

  /* summary stats */
  const stats = useMemo(() => {
    const active = records.filter((r) => r.status === "active" || r.status === "emerging").length;
    const addressed = records.filter((r) => r.status === "addressed").length;

    const allStaff = new Set<string>();
    records.forEach((r) => r.staff_affected.forEach((s) => allStaff.add(s)));

    const areaCounts = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.theme_area] = (acc[r.theme_area] ?? 0) + 1;
      return acc;
    }, {});
    const mostCommonArea =
      Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return {
      active,
      addressed,
      staffAffected: allStaff.size,
      mostCommonArea: mostCommonArea !== "—" ? STAFF_SUPERVISION_THEME_AREA_LABEL[mostCommonArea as StaffSupervisionThemeArea] : "—",
    };
  }, [records]);

  /* filtered & sorted */
  const filtered = useMemo(() => {
    let rows = [...records];
    if (filterArea !== "all") rows = rows.filter((r) => r.theme_area === filterArea);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => {
      if (sortBy === "frequency") return b.frequency_across_team - a.frequency_across_team;
      if (sortBy === "oldest") return a.identified_date.localeCompare(b.identified_date);
      return b.identified_date.localeCompare(a.identified_date);
    });
    return rows;
  }, [records, filterArea, filterStatus, sortBy]);

  /* export */
  const exportCols: ExportColumn<StaffSupervisionThemeRecord>[] = [
    { header: "Identified", accessor: (r: StaffSupervisionThemeRecord) => r.identified_date },
    { header: "Area", accessor: (r: StaffSupervisionThemeRecord) => STAFF_SUPERVISION_THEME_AREA_LABEL[r.theme_area] },
    { header: "Theme", accessor: (r: StaffSupervisionThemeRecord) => r.theme_title },
    { header: "Frequency", accessor: (r: StaffSupervisionThemeRecord) => String(r.frequency_across_team) },
    { header: "Staff Affected", accessor: (r: StaffSupervisionThemeRecord) => r.anonymous ? "Anonymous" : r.staff_affected.map((s) => getStaffName(s)).join("; ") },
    { header: "Status", accessor: (r: StaffSupervisionThemeRecord) => STAFF_SUPERVISION_THEME_STATUS_LABEL[r.status] },
    { header: "Reviewed By", accessor: (r: StaffSupervisionThemeRecord) => getStaffName(r.reviewed_by) },
    { header: "Next Review", accessor: (r: StaffSupervisionThemeRecord) => r.next_review_date },
    { header: "Description", accessor: (r: StaffSupervisionThemeRecord) => r.description },
    { header: "Root Cause", accessor: (r: StaffSupervisionThemeRecord) => r.root_cause_analysis },
    { header: "Organisational Response", accessor: (r: StaffSupervisionThemeRecord) => r.organisational_response.join("; ") },
    { header: "Training Implications", accessor: (r: StaffSupervisionThemeRecord) => r.training_implications.join("; ") },
    { header: "Policy Implications", accessor: (r: StaffSupervisionThemeRecord) => r.policy_implications.join("; ") },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Supervision Themes" subtitle="Aggregated learning from supervision · Organisational reflection · Training and policy implications">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Supervision Themes"
      subtitle="Aggregated learning from supervision · Organisational reflection · Training and policy implications"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Supervision Themes" />
          <ExportButton data={records} columns={exportCols} filename="staff-supervision-themes" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Themes", value: stats.active, icon: Layers, clr: "text-blue-600" },
            { label: "Staff Affected", value: stats.staffAffected, icon: Users, clr: "text-purple-600" },
            { label: "Themes Addressed", value: stats.addressed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Most Common Area", value: stats.mostCommonArea, icon: Target, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Theme area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {(Object.entries(STAFF_SUPERVISION_THEME_AREA_LABEL) as [StaffSupervisionThemeArea, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(STAFF_SUPERVISION_THEME_STATUS_LABEL) as [StaffSupervisionThemeStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="frequency">Frequency (high → low)</SelectItem>
            </SelectContent>
          </Select>

          {(filterArea !== "all" || filterStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterArea("all"); setFilterStatus("all"); }}
            >
              Clear filters
            </Button>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            Showing {filtered.length} of {records.length}
          </span>
        </div>

        {/* ── theme cards ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const Icon = AREA_ICON[r.theme_area];
            return (
              <Card key={r.id} className={cn("border-l-4", AREA_BORDER[r.theme_area])}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {r.theme_title}
                        <Badge variant="outline" className={AREA_CLR[r.theme_area]}>
                          {STAFF_SUPERVISION_THEME_AREA_LABEL[r.theme_area]}
                        </Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>
                          {STAFF_SUPERVISION_THEME_STATUS_LABEL[r.status]}
                        </Badge>
                        {r.anonymous && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />Anonymous
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Identified: {r.identified_date} · Reviewed by: {getStaffName(r.reviewed_by)} · Next review: {r.next_review_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "bg-muted/60 font-semibold",
                          r.frequency_across_team >= 6 && "bg-red-50 text-red-700 border-red-200",
                          r.frequency_across_team >= 4 && r.frequency_across_team < 6 && "bg-amber-50 text-amber-700 border-amber-200",
                          r.frequency_across_team < 4 && "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {r.frequency_across_team} staff
                      </Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Description</p>
                      <p className="text-muted-foreground text-xs">{r.description}</p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                      <p className="font-medium text-xs text-indigo-800 mb-1 flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5" />Root Cause Analysis
                      </p>
                      <p className="text-xs text-indigo-700">{r.root_cause_analysis}</p>
                    </div>

                    {!r.anonymous && r.staff_affected.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Staff Who Raised This Theme</p>
                        <div className="flex flex-wrap gap-1">
                          {r.staff_affected.map((s) => (
                            <Badge key={s} variant="outline" className="bg-muted/50 text-xs">
                              {getStaffName(s)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.anonymous && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-2 flex items-start gap-2">
                        <EyeOff className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600">
                          Identities of staff who raised this theme are protected. Aggregated frequency only.
                        </p>
                      </div>
                    )}

                    {r.organisational_response.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />Organisational Response
                        </p>
                        <ul className="space-y-1">
                          {r.organisational_response.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {r.training_implications.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-purple-600" />Training Implications
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {r.training_implications.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.policy_implications.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-blue-600" />Policy Implications
                        </p>
                        <ul className="space-y-1">
                          {r.policy_implications.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                No themes match the current filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory & Practice Framework</p>
          <p>
            Aggregated supervision themes support the registered manager&apos;s duty under the Children&apos;s Homes (England) Regulations 2015 — particularly Regulation 13 (the leadership and management standard, Quality Standard 13) which requires the registered person to lead and manage the home so that staff work effectively to meet children&apos;s needs.
            Working Together to Safeguard Children 2023 expects organisations to have clear arrangements for reflective supervision and for learning from practice to inform organisational development. Themes identified here feed into the workforce development plan, training schedule, policy review cycle, and the Statement of Purpose. Anonymity is preserved where staff disclosed concerns confidentially. Quarterly aggregated themes are shared with the Responsible Individual and reviewed at the home&apos;s clinical governance meeting.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
