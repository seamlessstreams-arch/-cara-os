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
  Mail,
  Lock,
  Heart,
  CheckCircle,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  IncomingCorrespondence,
  CorrespondenceSenderType,
  CorrespondenceItemType,
} from "@/types/extended";
import {
  CORRESPONDENCE_SENDER_TYPE_LABEL,
  CORRESPONDENCE_ITEM_TYPE_LABEL,
} from "@/types/extended";
import { useIncomingCorrespondence } from "@/hooks/use-incoming-correspondence";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const senderColour: Record<CorrespondenceSenderType, string> = {
  mother: "bg-pink-100 text-pink-800",
  father: "bg-blue-100 text-blue-800",
  sibling: "bg-purple-100 text-purple-800",
  grandparent: "bg-amber-100 text-amber-800",
  extended_family: "bg-rose-100 text-rose-800",
  birth_family: "bg-pink-100 text-pink-800",
  friend: "bg-emerald-100 text-emerald-800",
  school: "bg-indigo-100 text-indigo-800",
  solicitor_legal: "bg-slate-100 text-[var(--cs-navy)]",
  pen_pal_scheme: "bg-blue-100 text-blue-800",
  charity_anonymous: "bg-cyan-100 text-cyan-800",
  other_professional: "bg-indigo-100 text-indigo-800",
  junk_mail: "bg-slate-100 text-[var(--cs-text-secondary)]",
};

const exportCols: ExportColumn<IncomingCorrespondence>[] = [
  { header: "Date", accessor: (r: IncomingCorrespondence) => r.date_received },
  { header: "Child", accessor: (r: IncomingCorrespondence) => getYPName(r.child_id) },
  { header: "Sender Type", accessor: (r: IncomingCorrespondence) => CORRESPONDENCE_SENDER_TYPE_LABEL[r.sender_type] },
  { header: "Sender", accessor: (r: IncomingCorrespondence) => r.sender_name },
  { header: "Item Type", accessor: (r: IncomingCorrespondence) => CORRESPONDENCE_ITEM_TYPE_LABEL[r.item_type] },
  { header: "Reviewed First", accessor: (r: IncomingCorrespondence) => r.reviewed_first ? "Yes" : "No" },
  { header: "Given to Child", accessor: (r: IncomingCorrespondence) => r.child_given_item ? "Yes" : "No" },
  { header: "Kept", accessor: (r: IncomingCorrespondence) => r.kept ? "Yes" : "No" },
];

export default function ChildCorrespondenceIncomingPage() {
  const { data: res, isLoading } = useIncomingCorrespondence();
  const data = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterSender, setFilterSender] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((m) => m.child_id === filterYP);
    if (filterSender !== "all") items = items.filter((m) => m.sender_type === filterSender);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date_received.localeCompare(a.date_received);
        case "child":
          return a.child_id.localeCompare(b.child_id);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, filterSender, sortBy]);

  const total = data.length;
  const reviewed = data.filter((m) => m.reviewed_first).length;
  const replied = data.filter((m) => m.child_choose_to_reply).length;
  const kept = data.filter((m) => m.kept).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PageShell
      title="Incoming Correspondence"
      subtitle="Mail received for children — handled with respect, reviewed only when safeguarding requires"
      caraContext={{ pageTitle: "Incoming Correspondence", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-correspondence-incoming" />
          <PrintButton title="Incoming Correspondence" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Items Received</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{reviewed}/{total}</p>
          <p className="text-xs text-muted-foreground">Reviewed First</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{replied}</p>
          <p className="text-xs text-muted-foreground">Children Replied</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{kept}</p>
          <p className="text-xs text-muted-foreground">Items Kept</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Lock className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Mail is private. We only review correspondence first where safeguarding (e.g., letterbox
          arrangements per court order) or legal review requires. Children own their items, decide
          whether to reply, and choose where to keep them.
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
        <Select value={filterSender} onValueChange={setFilterSender}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Senders" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sender Types</SelectItem>
            <SelectItem value="mother">Mother</SelectItem>
            <SelectItem value="father">Father</SelectItem>
            <SelectItem value="sibling">Sibling</SelectItem>
            <SelectItem value="grandparent">Grandparent</SelectItem>
            <SelectItem value="extended_family">Extended Family</SelectItem>
            <SelectItem value="friend">Friend</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="solicitor_legal">Solicitor</SelectItem>
            <SelectItem value="junk_mail">Junk Mail</SelectItem>
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
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;

          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Mail className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(m.child_id)} — {CORRESPONDENCE_ITEM_TYPE_LABEL[m.item_type]} from {m.sender_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Received {m.date_received} &middot; {m.reviewed_first ? "Reviewed first" : "Direct to child"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", senderColour[m.sender_type])}>
                    {CORRESPONDENCE_SENDER_TYPE_LABEL[m.sender_type]}
                  </span>
                  {m.kept && <Heart className="h-4 w-4 text-pink-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {m.reviewed_first && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Eye className="h-3 w-3 inline mr-1" />Reviewed First by {getStaffName(m.reviewed_by)}
                      </p>
                      <p className="text-sm">{m.reviewed_reason}</p>
                    </div>
                  )}

                  {m.child_given_item ? (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Response</p>
                        <p className="text-sm italic">{m.child_response_observed}</p>
                      </div>

                      {m.child_choose_to_reply && (
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Reply</p>
                          <p className="text-sm">{m.support_provided_to_respond}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage</p>
                          <p className="text-sm">{m.kept ? `Kept: ${m.kept_location}` : "Not kept"}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">SW Aware</p>
                          <p className="text-sm">{m.shared_with_social_worker ? "Yes" : "No (not required)"}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Item Not Given to Child</p>
                      <p className="text-sm">{m.reviewed_reason}</p>
                    </div>
                  )}

                  {m.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{m.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><CheckCircle className="h-3 w-3 inline mr-1" />Item: {CORRESPONDENCE_ITEM_TYPE_LABEL[m.item_type]}</span>
                    <span>Received: {m.date_received}</span>
                    {m.date_child_received && <span>Given: {m.date_child_received}</span>}
                  </div>
                  <SmartLinkPanel sourceType="incoming-correspondence" sourceId={m.id} childId={m.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Incoming correspondence records support Quality Standard 1
          (child-centred care), Quality Standard 9 (positive relationships), Reg 22 (records), and UNCRC
          Article 16 (privacy in correspondence). Reviews are limited to safeguarding necessity. Linked to
          Family Contact, Letterbox arrangements, Birthday Card Tracker, Personal Belongings.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category="safeguarding"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Incoming Correspondence — letters to children from family, social workers, courts, legal, LA, professionals, letterbox contact, safe opening, redaction, information sharing"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
