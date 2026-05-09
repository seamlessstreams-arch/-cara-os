"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Award,
  Heart,
  Star,
  Users,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffRecognitionRecords } from "@/hooks/use-staff-recognition-records";
import type { StaffRecognitionRecord, StaffRecognitionType, StaffRecognitionRecognisedBy } from "@/types/extended";
import {
  STAFF_RECOGNITION_TYPE_LABEL,
  STAFF_RECOGNITION_RECOGNISED_BY_LABEL,
  STAFF_RECOGNITION_WAY_MARKED_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (colours not serializable) ─────────────────────────────── */

const TYPE_CLR: Record<StaffRecognitionType, string> = {
  above_and_beyond: "bg-amber-100 text-amber-800",
  quiet_excellence: "bg-purple-100 text-purple-800",
  team_contribution: "bg-blue-100 text-blue-800",
  child_recognised: "bg-pink-100 text-pink-800",
  anniversary_milestone: "bg-emerald-100 text-emerald-800",
  qualification_achieved: "bg-indigo-100 text-indigo-800",
  wellbeing_leadership: "bg-rose-100 text-rose-800",
  innovation: "bg-cyan-100 text-cyan-800",
  cultural_awareness: "bg-amber-100 text-amber-800",
};

/* ── component ────────────────────────────────────────────────────────────── */

export default function StaffRecognitionLogPage() {
  const { data: records = [], isLoading } = useStaffRecognitionRecords();
  const [filterType, setFilterType] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((r) => r.recognition_type === filterType);
    if (filterStaff !== "all") items = items.filter((r) => r.staff_member === filterStaff);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "type":
          return a.recognition_type.localeCompare(b.recognition_type);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterStaff, sortBy]);

  const total = records.length;
  const childRecognised = records.filter((r) => r.child_contributed_nomination).length;
  const uniqueStaff = new Set(records.map((r) => r.staff_member)).size;
  const totalSpend = records.reduce((sum, r) => sum + r.monetary_value, 0);

  const allStaff = Array.from(new Set(records.map((r) => r.staff_member)));

  const exportCols: ExportColumn<StaffRecognitionRecord>[] = [
    { header: "Date", accessor: (r: StaffRecognitionRecord) => r.date },
    { header: "Staff Member", accessor: (r: StaffRecognitionRecord) => getStaffName(r.staff_member) },
    { header: "Type", accessor: (r: StaffRecognitionRecord) => STAFF_RECOGNITION_TYPE_LABEL[r.recognition_type] },
    { header: "Recognised By", accessor: (r: StaffRecognitionRecord) => STAFF_RECOGNITION_RECOGNISED_BY_LABEL[r.recognised_by] },
    { header: "What Happened", accessor: (r: StaffRecognitionRecord) => r.what_happened },
    { header: "Marked With", accessor: (r: StaffRecognitionRecord) => r.way_marked.map((w) => STAFF_RECOGNITION_WAY_MARKED_LABEL[w]).join("; ") },
    { header: "Value £", accessor: (r: StaffRecognitionRecord) => `£${r.monetary_value}` },
    { header: "Child-Nominated", accessor: (r: StaffRecognitionRecord) => r.child_contributed_nomination ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Recognition Log" subtitle="Recognising contributions, milestones, and relational excellence — formally and warmly">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Recognition Log"
      subtitle="Recognising contributions, milestones, and relational excellence — formally and warmly"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="staff-recognition-log" />
          <PrintButton title="Staff Recognition Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recognitions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{childRecognised}</p>
          <p className="text-xs text-muted-foreground">Child-Nominated</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{uniqueStaff}/7</p>
          <p className="text-xs text-muted-foreground">Staff Recognised</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">£{totalSpend}</p>
          <p className="text-xs text-muted-foreground">Token Spend</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Award className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          People do their best work when they feel seen. We recognise above-and-beyond moments AND quiet
          excellence, AND children&apos;s nominations. Recognition is regular, specific, and shared in ways
          that match how the person likes to be celebrated.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(STAFF_RECOGNITION_TYPE_LABEL) as [StaffRecognitionType, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Staff" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {allStaff.map((s) => (
              <SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Award className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getStaffName(r.staff_member)} &middot; {STAFF_RECOGNITION_TYPE_LABEL[r.recognition_type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.date} &middot; Recognised by {r.recognised_by === "child" ? `child (${r.recognised_by_name})` : r.recognised_by === "whole_team" ? "whole team" : r.recognised_by_name.startsWith("staff_") ? getStaffName(r.recognised_by_name) : r.recognised_by_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", TYPE_CLR[r.recognition_type])}>
                    {STAFF_RECOGNITION_TYPE_LABEL[r.recognition_type]}
                  </span>
                  {r.child_contributed_nomination && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium flex items-center gap-1">
                      <Heart className="h-3 w-3" />Child
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">What Happened</p>
                    <p className="text-sm">{r.what_happened}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Impact</p>
                    <p className="text-sm">{r.impact_description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                        <Heart className="h-3 w-3 inline mr-1" />Child Impact
                      </p>
                      <p className="text-sm">{r.child_impact}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Users className="h-3 w-3 inline mr-1" />Organisational Impact
                      </p>
                      <p className="text-sm">{r.organisational_impact}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Marked With</p>
                    <div className="flex flex-wrap gap-1">
                      {r.way_marked.map((w, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />{STAFF_RECOGNITION_WAY_MARKED_LABEL[w]}
                        </span>
                      ))}
                    </div>
                    {r.monetary_value > 0 && <p className="text-xs text-emerald-700 mt-2">Token value: £{r.monetary_value}</p>}
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Staff Response</p>
                    <p className="text-sm italic">&ldquo;{r.staff_response}&rdquo;</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Manager Reflection</p>
                    <p className="text-sm">{r.reflection_from_manager}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Star className="h-3 w-3 inline mr-1" />{STAFF_RECOGNITION_TYPE_LABEL[r.recognition_type]}</span>
                    <span>Recognised: {r.date}</span>
                    {r.public_celebration && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Public Celebration</span>}
                    {r.child_contributed_nomination && <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">Child Nominated</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Staff recognition supports Quality Standard 13 (leadership and
          management — workforce wellbeing), Reg 32 (fitness of workers), and best-practice retention models.
          Recognition is a feature of the home&apos;s positive workplace culture. Linked to Staff Wellbeing,
          Annual Reviews, and Supervision.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
