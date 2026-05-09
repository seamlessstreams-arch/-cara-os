"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useCleaningEntries } from "@/hooks/use-cleaning-entries";
import type { CleaningEntry } from "@/types/extended";
import { CLEANING_SHIFT_LABEL, CLEANING_AREA_LABEL, CLEANING_TYPE_LABEL, CLEANING_CHILD_INVOLVEMENT_LABEL } from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
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

const cleaningTypeColour: Record<string, string> = {
  routine: "bg-blue-100 text-blue-800",
  spot_clean: "bg-emerald-100 text-emerald-800",
  deep_clean: "bg-purple-100 text-purple-800",
  post_incident: "bg-amber-100 text-amber-800",
  hygiene_escalation: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<CleaningEntry>[] = [
  { header: "Date", accessor: (r) => r.date },
  { header: "Shift", accessor: (r) => CLEANING_SHIFT_LABEL[r.shift] },
  { header: "Area", accessor: (r) => CLEANING_AREA_LABEL[r.area] },
  { header: "Staff", accessor: (r) => getStaffName(r.staff_member) },
  { header: "Type", accessor: (r) => CLEANING_TYPE_LABEL[r.cleaning_type] },
  { header: "Duration", accessor: (r) => `${r.duration_minutes}m` },
  { header: "Tasks Completed", accessor: (r) => `${r.tasks_completed.filter((t) => t.completed).length}/${r.tasks_completed.length}` },
  { header: "Child Involvement", accessor: (r) => CLEANING_CHILD_INVOLVEMENT_LABEL[r.child_involvement] },
];

export default function CleaningRotaPage() {
  const { data: res, isLoading } = useCleaningEntries();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [filterType, setFilterType] = useState("all");
  const [filterArea, setFilterArea] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((c) => c.cleaning_type === filterType);
    if (filterArea !== "all") items = items.filter((c) => c.area === filterArea);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterArea, sortBy]);

  const total = records.length;
  const totalMinutes = records.reduce((sum, c) => sum + c.duration_minutes, 0);
  const childInvolved = records.filter((c) => c.child_involvement === "helped_age_appropriate" || c.child_involvement === "lead_with_support").length;
  const allSignedOff = records.length > 0 && records.every((c) => c.signed_off);

  if (isLoading) {
    return (
      <PageShell title="Cleaning Rota" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Cleaning Rota"
      subtitle="Daily and deep cleaning records — areas, products, child involvement, and follow-up"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="cleaning-rota" />
          <PrintButton title="Cleaning Rota" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Cleaning Entries</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{Math.round(totalMinutes / 60)}h</p>
          <p className="text-xs text-muted-foreground">Total Time</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childInvolved}</p>
          <p className="text-xs text-muted-foreground">Child Involvement</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allSignedOff ? "100%" : `${records.filter((c) => c.signed_off).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Signed Off</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          A clean home is a homely home. Routine cleaning happens every shift; deep cleans quarterly;
          age-appropriate child involvement builds independence skills and accountability. Sensory-aware
          products used in Casey&apos;s spaces.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CLEANING_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {Object.entries(CLEANING_AREA_LABEL).map(([k, v]) => (
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
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;
          const taskPct = c.tasks_completed.length > 0 ? Math.round((c.tasks_completed.filter((t) => t.completed).length / c.tasks_completed.length) * 100) : 0;

          return (
            <div key={c.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.date} — {CLEANING_AREA_LABEL[c.area]} ({CLEANING_SHIFT_LABEL[c.shift]})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getStaffName(c.staff_member)} &middot; {c.duration_minutes} mins &middot; {taskPct}% tasks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cleaningTypeColour[c.cleaning_type])}>
                    {CLEANING_TYPE_LABEL[c.cleaning_type]}
                  </span>
                  {c.signed_off && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tasks Completed</p>
                    <div className="space-y-1">
                      {c.tasks_completed.map((t, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start gap-2">
                          {t.completed ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                          <div className="flex-1">
                            <span className={cn(t.completed ? "text-slate-700" : "text-slate-500")}>{t.task}</span>
                            {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Products Used</p>
                    <div className="flex flex-wrap gap-1">
                      {c.products_used.map((p, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{p}</span>
                      ))}
                    </div>
                    {c.allergy_aware && <p className="text-xs text-emerald-700 mt-1"><CheckCircle className="h-3 w-3 inline mr-1" />Allergy-aware products used</p>}
                  </div>

                  {c.child_involvement !== "none" && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child Involvement</p>
                      <p className="text-sm font-medium">{CLEANING_CHILD_INVOLVEMENT_LABEL[c.child_involvement]}</p>
                      {c.children_who_helped && <p className="text-sm">{c.children_who_helped}</p>}
                      {c.child_learning_points && <p className="text-xs text-pink-700 mt-1 italic">{c.child_learning_points}</p>}
                    </div>
                  )}

                  {c.items_requiring_attention.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Items Requiring Attention</p>
                      <ul className="space-y-1">
                        {c.items_requiring_attention.map((it, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.defects_logged.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Defects Logged</p>
                      <ul className="space-y-1">
                        {c.defects_logged.map((dl, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{dl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {c.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{c.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{c.duration_minutes} mins</span>
                    <span>Signed off: {c.signed_off ? getStaffName(c.signed_off_by) : "Pending"}</span>
                    <span><Calendar className="h-3 w-3 inline mr-1" />{CLEANING_SHIFT_LABEL[c.shift]}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Cleaning records support Quality Standard 5 (protection —
          hygiene), Quality Standard 7 (health and wellbeing), Reg 22 (records), Schedule 1 (homely
          environment), and infection control best practice.
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
