"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown,
  Heart, Sparkles, Flower, Star, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMemorialOccasionRecords } from "@/hooks/use-memorial-occasion-records";
import type { MemorialOccasionRecord, MemorialOccasionType } from "@/types/extended";
import { MEMORIAL_OCCASION_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const occasionColour: Record<MemorialOccasionType, string> = {
  bereavement_death: "bg-purple-100 text-purple-800",
  annual_remembrance: "bg-amber-100 text-amber-800",
  pet_bereavement: "bg-pink-100 text-pink-800",
  loss_anniversary: "bg-rose-100 text-rose-800",
  family_anniversary: "bg-blue-100 text-blue-800",
  cultural_memorial_day: "bg-emerald-100 text-emerald-800",
};

export default function MemorialOccasionRecordsPage() {
  const { data: res, isLoading } = useMemorialOccasionRecords();
  const data: MemorialOccasionRecord[] = res?.data ?? [];

  const [filterOccasion, setFilterOccasion] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterOccasion !== "all") items = items.filter((m) => m.occasion === filterOccasion);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "occasion":
          return a.occasion.localeCompare(b.occasion);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterOccasion, sortBy]);

  const total = data.length;
  const annualMarkers = data.filter((m) => m.occasion === "annual_remembrance" || m.occasion === "loss_anniversary" || m.occasion === "pet_bereavement").length;
  const childrenWithRituals = new Set(data.flatMap((m) => m.affected_children)).size;

  const exportCols: ExportColumn<MemorialOccasionRecord>[] = [
    { header: "Occasion", accessor: (r) => MEMORIAL_OCCASION_TYPE_LABEL[r.occasion] },
    { header: "Date", accessor: (r) => r.date },
    { header: "Remembered", accessor: (r) => r.who_is_remembered },
    { header: "Children Affected", accessor: (r) => r.affected_children.map(getYPName).join("; ") },
    { header: "Significance", accessor: (r) => r.significance },
    { header: "Follow-Up", accessor: (r) => r.follow_up_date },
  ];

  if (isLoading) return <PageShell title="Memorial Occasions" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Memorial Occasions"
      subtitle="How the home marks significant losses, anniversaries, and remembrance — with care, dignity, and child-led ritual"
      ariaContext={{ pageTitle: "Memorial & Occasion Records", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="memorial-occasion-records" />
          <PrintButton title="Memorial Occasions" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Memorial Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{annualMarkers}</p>
          <p className="text-xs text-muted-foreground">Annual Markers</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{childrenWithRituals}/3</p>
          <p className="text-xs text-muted-foreground">Children with Rituals</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Child-Led</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Flower className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Loss touches every child who comes into care. We mark significant occasions — bereavements,
          anniversaries, pet losses, cultural memorial days — in ways the child chooses. Tradition,
          ritual, and quiet acknowledgement honoured. Never imposed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterOccasion} onValueChange={setFilterOccasion}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Occasions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Occasions</SelectItem>
            {(Object.keys(MEMORIAL_OCCASION_TYPE_LABEL) as MemorialOccasionType[]).map((k) => (
              <SelectItem key={k} value={k}>{MEMORIAL_OCCASION_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="occasion">By Occasion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;

          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Flower className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.who_is_remembered}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.date} &middot; {m.affected_children.map(getYPName).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", occasionColour[m.occasion])}>{MEMORIAL_OCCASION_TYPE_LABEL[m.occasion]}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Significance</p>
                    <p className="text-sm">{m.significance}</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Child Preferences
                    </p>
                    <p className="text-sm">{m.child_preferences}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Sparkles className="h-3 w-3 inline mr-1" />Rituals Observed
                    </p>
                    <ul className="space-y-1">
                      {m.rituals_observed.map((r: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Staff Role</p>
                    <p className="text-sm">{m.staff_role_on_day}</p>
                  </div>

                  {m.external_support && (
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">External Support</p>
                      <p className="text-sm">{m.external_support}</p>
                    </div>
                  )}

                  <div className="bg-rose-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1">Child&apos;s Expressions Observed</p>
                    <p className="text-sm italic">{m.child_expressions_observed}</p>
                  </div>

                  {m.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{m.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Follow-up: {m.follow_up_date}</span>
                    <span>Children: {m.affected_children.map(getYPName).join(", ")}</span>
                  </div>

                  <SmartLinkPanel sourceType="memorial-occasion-records" sourceId={m.id} childId={m.affected_children[0]} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Memorial occasion records support Quality Standard 1
          (child-centred care), Quality Standard 7 (health and wellbeing), trauma-informed practice
          principles, and respect for cultural / spiritual practice (UNCRC Article 30). Linked to Grief
          and Loss Support, Placement Anniversaries, Trauma-Informed Timeline, and Cultural Identity.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Memorial & Occasion Records — birthdays, anniversaries, bereavements, significant dates, how we mark occasions, child preferences, cultural considerations, emotional support"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
