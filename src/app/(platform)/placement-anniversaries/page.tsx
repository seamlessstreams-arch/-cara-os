"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Calendar,
  Heart,
  Star,
  Cake,
  Sparkles,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlacementAnniversaryEntry } from "@/types/extended";
import { ANNIVERSARY_SIGNIFICANCE_TYPE_LABEL, ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL, ANNIVERSARY_RECURRENCE_LABEL } from "@/types/extended";
import { usePlacementAnniversaryEntries } from "@/hooks/use-placement-anniversary-entries";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

const significanceColour: Record<string, string> = {
  celebratory: "bg-green-100 text-green-800",
  bittersweet: "bg-amber-100 text-amber-800",
  difficult: "bg-red-100 text-red-800",
  practical_only: "bg-slate-100 text-slate-800",
  mixed: "bg-purple-100 text-purple-800",
};

const exportCols: ExportColumn<PlacementAnniversaryEntry>[] = [
  { header: "Young Person", accessor: (r: PlacementAnniversaryEntry) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: PlacementAnniversaryEntry) => r.date },
  { header: "Type", accessor: (r: PlacementAnniversaryEntry) => ANNIVERSARY_SIGNIFICANCE_TYPE_LABEL[r.significance_type] },
  { header: "Description", accessor: (r: PlacementAnniversaryEntry) => r.description },
  { header: "Significance", accessor: (r: PlacementAnniversaryEntry) => ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL[r.emotional_significance] },
  { header: "Recurrence", accessor: (r: PlacementAnniversaryEntry) => ANNIVERSARY_RECURRENCE_LABEL[r.recurrence] },
  { header: "Key Worker", accessor: (r: PlacementAnniversaryEntry) => getStaffName(r.preferred_key_worker) },
  { header: "Child Agreed", accessor: (r: PlacementAnniversaryEntry) => r.child_agreed ? "Yes" : "No" },
];

export default function PlacementAnniversariesPage() {
  const { data: res, isLoading } = usePlacementAnniversaryEntries();
  const records = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterSignificance, setFilterSignificance] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterYP !== "all") items = items.filter((a) => a.child_id === filterYP);
    if (filterSignificance !== "all") items = items.filter((a) => a.emotional_significance === filterSignificance);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return a.date.localeCompare(b.date);
        case "type":
          return a.significance_type.localeCompare(b.significance_type);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterYP, filterSignificance, sortBy]);

  const total = records.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming90 = records.filter((a) => a.date >= todayStr && a.date <= new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)).length;
  const difficult = records.filter((a) => a.emotional_significance === "difficult").length;
  const allChildAgreed = records.every((a) => a.child_agreed);

  if (isLoading) {
    return (
      <PageShell title="Placement Anniversaries" subtitle="Significant dates for each child — celebrated, honoured, prepared for, never forgotten">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Placement Anniversaries"
      subtitle="Significant dates for each child — celebrated, honoured, prepared for, never forgotten"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="placement-anniversaries" />
          <PrintButton title="Placement Anniversaries" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Total Anniversaries</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{upcoming90}</p>
          <p className="text-xs text-muted-foreground">Next 90 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{difficult}</p>
          <p className="text-xs text-muted-foreground">Difficult Dates</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allChildAgreed ? "100%" : `${records.filter((a) => a.child_agreed).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Child Agreed</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Significant dates carry weight — birthdays, arrival anniversaries, trauma anniversaries, family
          birthdays. Each is approached the way the child wants. We never forget. We don&apos;t impose.
          We honour what each date means.
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
        <Select value={filterSignificance} onValueChange={setFilterSignificance}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Significances" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Significances</SelectItem>
            <SelectItem value="celebratory">{ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL.celebratory}</SelectItem>
            <SelectItem value="bittersweet">{ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL.bittersweet}</SelectItem>
            <SelectItem value="difficult">{ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL.difficult}</SelectItem>
            <SelectItem value="practical_only">{ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL.practical_only}</SelectItem>
            <SelectItem value="mixed">{ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL.mixed}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Soonest First</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const isExpanded = expandedId === a.id;

          return (
            <div key={a.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {a.significance_type === "birthday" ? <Cake className="h-5 w-5 text-pink-600 shrink-0" /> :
                   a.emotional_significance === "difficult" ? <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" /> :
                   a.emotional_significance === "celebratory" ? <Star className="h-5 w-5 text-amber-500 shrink-0" /> :
                   <Calendar className="h-5 w-5 text-blue-600 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.date} &middot; {getYPName(a.child_id)} &middot; {ANNIVERSARY_SIGNIFICANCE_TYPE_LABEL[a.significance_type]} &middot; {ANNIVERSARY_RECURRENCE_LABEL[a.recurrence]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", significanceColour[a.emotional_significance])}>
                    {ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL[a.emotional_significance]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child&apos;s Preference</p>
                    <p className="text-sm">{a.child_preference}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Agreed Approach</p>
                    <ul className="space-y-1">
                      {a.agreed_approach.map((step, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Roles</p>
                      <ul className="space-y-1">
                        {a.staff_role_on_day.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">&bull;</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Resources Needed</p>
                      <ul className="space-y-1">
                        {a.resources_needed.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">&bull;</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Emotional Support Plan</p>
                    <p className="text-sm">{a.emotional_support_plan}</p>
                  </div>

                  {a.remembrance_practices.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Remembrance Practices</p>
                      <ul className="space-y-1">
                        {a.remembrance_practices.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Heart className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {a.contingency_if_hard.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">If The Day Becomes Difficult</p>
                      <ul className="space-y-1">
                        {a.contingency_if_hard.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">&bull;</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Heart className="h-3 w-3 inline mr-1" />Key worker: {getStaffName(a.preferred_key_worker)}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />Reviewed: {a.reviewed_date}</span>
                    <span>Reviewed by: {getStaffName(a.reviewed_by)}</span>
                    {a.child_agreed && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Child Co-Produced</span>}
                  </div>

                  <SmartLinkPanel sourceType="placement-anniversaries" sourceId={a.id} childId={a.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Anniversary plans support Quality Standard 1 (child-centred care),
          Quality Standard 7 (health and wellbeing), trauma-informed practice principles, and UNCRC Article 12
          (right to be heard). Plans are co-produced annually with each child and reviewed when significance
          changes. Linked to Personal Passport, Trauma-Informed Timeline, and Bedtime Routines.
        </p>
      </div>
    </PageShell>
  );
}
