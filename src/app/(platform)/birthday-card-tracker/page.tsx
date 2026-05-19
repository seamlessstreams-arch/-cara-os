"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useCardRecords } from "@/hooks/use-card-records";
import type { CardRecord } from "@/types/extended";
import {
  CARD_OCCASION_LABEL,
  CARD_TYPE_LABEL,
  SENDER_TYPE_LABEL,
} from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Cake,
  Heart,
  Sparkles,
  Mail,
  Star,
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
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const occasionColour: Record<string, string> = {
  birthday: "bg-pink-100 text-pink-800",
  christmas: "bg-red-100 text-red-800",
  eid: "bg-emerald-100 text-emerald-800",
  other_religious_festival: "bg-amber-100 text-amber-800",
  anniversary_of_arrival: "bg-blue-100 text-blue-800",
  achievement: "bg-purple-100 text-purple-800",
  just_because: "bg-rose-100 text-rose-800",
  get_well: "bg-cyan-100 text-cyan-800",
};

const exportCols: ExportColumn<CardRecord>[] = [
  { header: "Young Person", accessor: (r: CardRecord) => getYPName(r.child_id) },
  { header: "Occasion", accessor: (r: CardRecord) => CARD_OCCASION_LABEL[r.occasion] },
  { header: "Date Received", accessor: (r: CardRecord) => r.received_date },
  { header: "Sender Type", accessor: (r: CardRecord) => SENDER_TYPE_LABEL[r.sender_type] },
  { header: "Sender", accessor: (r: CardRecord) => r.sender_name },
  { header: "Type", accessor: (r: CardRecord) => CARD_TYPE_LABEL[r.card_type] },
  { header: "Kept", accessor: (r: CardRecord) => r.child_kept_card ? "Yes" : "No" },
  { header: "Acknowledged", accessor: (r: CardRecord) => r.acknowledgement_sent ? "Yes" : "No" },
];

export default function BirthdayCardTrackerPage() {
  const { data: res, isLoading } = useCardRecords();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [filterYP, setFilterYP] = useState("all");
  const [filterOccasion, setFilterOccasion] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Cards & Letters Tracker" subtitle="Cards and letters received by children — celebrating connection across all relationships">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filtered = (() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((c) => c.child_id === filterYP);
    if (filterOccasion !== "all") items = items.filter((c) => c.occasion === filterOccasion);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.received_date.localeCompare(a.received_date);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  })();

  const total = data.length;
  const allKept = data.every((c) => c.child_kept_card);
  const acknowledged = data.filter((c) => c.acknowledgement_sent).length;
  const uniqueChildren = new Set(data.map((c) => c.child_id)).size;

  return (
    <PageShell
      title="Cards & Letters Tracker"
      subtitle="Cards and letters received by children — celebrating connection across all relationships"
      ariaContext={{ pageTitle: "Cards & Letters Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="birthday-card-tracker" />
          <PrintButton title="Cards & Letters Tracker" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Cards Received</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allKept ? "100%" : `${data.filter((c) => c.child_kept_card).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Children Kept</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{acknowledged}/{total}</p>
          <p className="text-xs text-muted-foreground">Acknowledged Back</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{uniqueChildren}/3</p>
          <p className="text-xs text-muted-foreground">Children Receiving</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Cake className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          A card from someone who matters can be the highlight of a year. We track every birthday card,
          Christmas card, achievement card, and letterbox letter — celebrating connection, helping the
          child reply, and honouring the meaning of being remembered.
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
        <Select value={filterOccasion} onValueChange={setFilterOccasion}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Occasions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Occasions</SelectItem>
            <SelectItem value="birthday">{CARD_OCCASION_LABEL.birthday}</SelectItem>
            <SelectItem value="christmas">{CARD_OCCASION_LABEL.christmas}</SelectItem>
            <SelectItem value="achievement">{CARD_OCCASION_LABEL.achievement}</SelectItem>
            <SelectItem value="eid">{CARD_OCCASION_LABEL.eid}</SelectItem>
            <SelectItem value="anniversary_of_arrival">{CARD_OCCASION_LABEL.anniversary_of_arrival}</SelectItem>
            <SelectItem value="just_because">{CARD_OCCASION_LABEL.just_because}</SelectItem>
            <SelectItem value="get_well">{CARD_OCCASION_LABEL.get_well}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;

          return (
            <div key={c.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Cake className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(c.child_id)} — {CARD_OCCASION_LABEL[c.occasion]} card from {c.sender_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Received {c.received_date} &middot; {CARD_TYPE_LABEL[c.card_type]} &middot; {SENDER_TYPE_LABEL[c.sender_type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", occasionColour[c.occasion])}>
                    {CARD_OCCASION_LABEL[c.occasion]}
                  </span>
                  {c.child_kept_card && <Heart className="h-4 w-4 text-pink-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child&apos;s Response</p>
                    <p className="text-sm italic">{c.child_response_observed}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      <Sparkles className="h-3 w-3 inline mr-1" />Significance
                    </p>
                    <p className="text-sm">{c.significance}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Card Stored</p>
                      <p className="text-sm">{c.card_location}</p>
                      {c.item_value > 0 && <p className="text-xs text-muted-foreground mt-1">Value enclosed: £{c.item_value}</p>}
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Mail className="h-3 w-3 inline mr-1" />Acknowledgement
                      </p>
                      <p className="text-sm">{c.acknowledgement_sent ? "Yes — " + c.acknowledgement_method : "Not yet"}</p>
                    </div>
                  </div>

                  {c.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{c.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Star className="h-3 w-3 inline mr-1" />Type: {CARD_TYPE_LABEL[c.card_type]}</span>
                    <span>Sender: {SENDER_TYPE_LABEL[c.sender_type]}</span>
                    <span>Recorded: {getStaffName(c.recorded_by)}</span>
                    {c.child_kept_card && <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium"><Heart className="h-3 w-3 inline mr-1" />Kept by child</span>}
                  </div>

                  <SmartLinkPanel sourceType="card-records" sourceId={c.id} childId={c.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Card and letter records support Quality Standard 9 (positive
          relationships), Quality Standard 1 (child-centred care), and the home&apos;s commitment to honouring
          every connection. Linked to Family Contact, Personal Belongings, Life Story Work, and Anniversaries.
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
        pageContext="Cards & Letters Tracker — birthday and occasion cards sent to or from children, family contact support, letterbox contact, birthdays remembered, looked-after child duties"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
