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

interface IncomingMail {
  id: string;
  dateReceived: string;
  recipientChild: string;
  senderType: "Birth family" | "Mother" | "Father" | "Sibling" | "Grandparent" | "Extended family" | "School" | "Friend" | "Solicitor/legal" | "Pen-pal scheme" | "Charity/anonymous" | "Other professional" | "Junk mail";
  senderName: string;
  itemType: "Letter" | "Card" | "Package" | "Birthday card" | "Christmas card" | "School letter" | "Solicitor letter" | "Letterbox contact";
  reviewedFirst: boolean;
  reviewedBy: string;
  reviewedReason: string;
  childGivenItem: boolean;
  dateChildReceived: string;
  childResponseObserved: string;
  childChooseToReply: boolean;
  supportProvidedToRespond: string;
  kept: boolean;
  keptLocation: string;
  sharedWithSocialWorker: boolean;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: IncomingMail[] = [
  {
    id: "im-001",
    dateReceived: d(-3),
    recipientChild: "yp_alex",
    senderType: "Grandparent",
    senderName: "Maternal Grandmother (Nan)",
    itemType: "Card",
    reviewedFirst: false,
    reviewedBy: "",
    reviewedReason: "Standard family card — no review required",
    childGivenItem: true,
    dateChildReceived: d(-3),
    childResponseObserved: "Smiled. Read it twice. 'Nan remembers.'",
    childChooseToReply: true,
    supportProvidedToRespond: "Anna provided card and stamps. Alex wrote himself.",
    kept: true,
    keptLocation: "Bedroom shelf",
    sharedWithSocialWorker: false,
    notes: "Routine family card. No safeguarding considerations.",
  },
  {
    id: "im-002",
    dateReceived: d(-7),
    recipientChild: "yp_casey",
    senderType: "Mother",
    senderName: "Birth Mother (letterbox arrangement)",
    itemType: "Letterbox contact",
    reviewedFirst: true,
    reviewedBy: "staff_darren",
    reviewedReason: "Letterbox arrangement requires SW review per court order. RM also reviews before opening with Casey.",
    childGivenItem: true,
    dateChildReceived: d(-5),
    childResponseObserved: "Casey opened letter with Anna. Used visual cards. Pointed at green for 'okay'. Set the letter down and looked at Otter.",
    childChooseToReply: false,
    supportProvidedToRespond: "Anna offered drawing or letter; Casey declined this time. Choice respected.",
    kept: true,
    keptLocation: "Casey's letterbox folder (drawer)",
    sharedWithSocialWorker: true,
    notes: "Twice-yearly letterbox arrangement. Reviewed and shared with SW. Casey's pace respected.",
  },
  {
    id: "im-003",
    dateReceived: d(-14),
    recipientChild: "yp_jordan",
    senderType: "Mother",
    senderName: "Mum (HMP)",
    itemType: "Letter",
    reviewedFirst: false,
    reviewedBy: "",
    reviewedReason: "Mother's letters not reviewed (no safeguarding requirement); standard prison correspondence",
    childGivenItem: true,
    dateChildReceived: d(-14),
    childResponseObserved: "Jordan read in his bedroom privately. Came down quieter but okay.",
    childChooseToReply: true,
    supportProvidedToRespond: "Chervelle provided pen, paper, and time. Jordan replied independently.",
    kept: true,
    keptLocation: "Bedroom — Mum's letters folder",
    sharedWithSocialWorker: false,
    notes: "Standard mother correspondence. Jordan's privacy respected.",
  },
  {
    id: "im-004",
    dateReceived: d(-21),
    recipientChild: "yp_alex",
    senderType: "School",
    senderName: "Alex's school (formal letter — exam timetable)",
    itemType: "School letter",
    reviewedFirst: false,
    reviewedBy: "",
    reviewedReason: "School communication — opened by Alex with Anna",
    childGivenItem: true,
    dateChildReceived: d(-21),
    childResponseObserved: "Read with Anna; planned exam dates together",
    childChooseToReply: false,
    supportProvidedToRespond: "N/A — informational",
    kept: true,
    keptLocation: "Alex's school folder",
    sharedWithSocialWorker: false,
    notes: "Routine school admin.",
  },
  {
    id: "im-005",
    dateReceived: d(-30),
    recipientChild: "yp_jordan",
    senderType: "Sibling",
    senderName: "Sister Tia",
    itemType: "Card",
    reviewedFirst: false,
    reviewedBy: "",
    reviewedReason: "Sibling correspondence via foster carer — known and approved",
    childGivenItem: true,
    dateChildReceived: d(-30),
    childResponseObserved: "Beamed. 'My sister.' Showed Chervelle.",
    childChooseToReply: true,
    supportProvidedToRespond: "Chervelle helped post via Tia's foster carer",
    kept: true,
    keptLocation: "Bedroom — sibling cards collection",
    sharedWithSocialWorker: false,
    notes: "Standard sibling contact through foster carer arrangement.",
  },
  {
    id: "im-006",
    dateReceived: d(-45),
    recipientChild: "yp_alex",
    senderType: "Junk mail",
    senderName: "Various marketing",
    itemType: "Letter",
    reviewedFirst: true,
    reviewedBy: "staff_anna",
    reviewedReason: "Bulk junk mail intercepted and recycled",
    childGivenItem: false,
    dateChildReceived: "",
    childResponseObserved: "",
    childChooseToReply: false,
    supportProvidedToRespond: "",
    kept: false,
    keptLocation: "",
    sharedWithSocialWorker: false,
    notes: "Junk mail with Alex's name — intercepted; child not bothered with marketing.",
  },
  {
    id: "im-007",
    dateReceived: d(-60),
    recipientChild: "yp_casey",
    senderType: "Friend",
    senderName: "Ellie (art group friend)",
    itemType: "Card",
    reviewedFirst: false,
    reviewedBy: "",
    reviewedReason: "Friend correspondence — known relationship",
    childGivenItem: true,
    dateChildReceived: d(-60),
    childResponseObserved: "Casey held the card carefully and smiled. Significant — first peer correspondence.",
    childChooseToReply: true,
    supportProvidedToRespond: "Anna provided card; Casey drew their reply (otter)",
    kept: true,
    keptLocation: "Bedroom shelf — special card",
    sharedWithSocialWorker: false,
    notes: "Casey's first independent friend card. Major milestone.",
  },
  {
    id: "im-008",
    dateReceived: d(-90),
    recipientChild: "yp_jordan",
    senderType: "Solicitor/legal",
    senderName: "LA Legal Team",
    itemType: "Solicitor letter",
    reviewedFirst: true,
    reviewedBy: "staff_darren",
    reviewedReason: "Legal correspondence reviewed by RM before sharing with Jordan",
    childGivenItem: true,
    dateChildReceived: d(-89),
    childResponseObserved: "Jordan read with Chervelle. Asked questions. Appreciated transparency.",
    childChooseToReply: false,
    supportProvidedToRespond: "Chervelle answered questions; SW followed up",
    kept: true,
    keptLocation: "Office locked file (sensitive — copy in care plan)",
    sharedWithSocialWorker: true,
    notes: "Court-related correspondence about Mum's release. Handled with care and full explanation.",
  },
];

const senderColour: Record<string, string> = {
  "Mother": "bg-pink-100 text-pink-800",
  "Father": "bg-blue-100 text-blue-800",
  "Sibling": "bg-purple-100 text-purple-800",
  "Grandparent": "bg-amber-100 text-amber-800",
  "Extended family": "bg-rose-100 text-rose-800",
  "Birth family": "bg-pink-100 text-pink-800",
  "Friend": "bg-emerald-100 text-emerald-800",
  "School": "bg-indigo-100 text-indigo-800",
  "Solicitor/legal": "bg-slate-100 text-slate-800",
  "Pen-pal scheme": "bg-blue-100 text-blue-800",
  "Charity/anonymous": "bg-cyan-100 text-cyan-800",
  "Other professional": "bg-indigo-100 text-indigo-800",
  "Junk mail": "bg-slate-100 text-slate-700",
};

const exportCols: ExportColumn<IncomingMail>[] = [
  { header: "Date", accessor: (r: IncomingMail) => r.dateReceived },
  { header: "Child", accessor: (r: IncomingMail) => getYPName(r.recipientChild) },
  { header: "Sender Type", accessor: (r: IncomingMail) => r.senderType },
  { header: "Sender", accessor: (r: IncomingMail) => r.senderName },
  { header: "Item Type", accessor: (r: IncomingMail) => r.itemType },
  { header: "Reviewed First", accessor: (r: IncomingMail) => r.reviewedFirst ? "Yes" : "No" },
  { header: "Given to Child", accessor: (r: IncomingMail) => r.childGivenItem ? "Yes" : "No" },
  { header: "Kept", accessor: (r: IncomingMail) => r.kept ? "Yes" : "No" },
];

export default function ChildCorrespondenceIncomingPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterSender, setFilterSender] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((m) => m.recipientChild === filterYP);
    if (filterSender !== "all") items = items.filter((m) => m.senderType === filterSender);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.dateReceived.localeCompare(a.dateReceived);
        case "child":
          return a.recipientChild.localeCompare(b.recipientChild);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterSender, sortBy]);

  const total = data.length;
  const reviewed = data.filter((m) => m.reviewedFirst).length;
  const replied = data.filter((m) => m.childChooseToReply).length;
  const kept = data.filter((m) => m.kept).length;

  return (
    <PageShell
      title="Incoming Correspondence"
      subtitle="Mail received for children — handled with respect, reviewed only when safeguarding requires"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-correspondence-incoming" />
          <PrintButton title="Incoming Correspondence" />
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
            <SelectItem value="Mother">Mother</SelectItem>
            <SelectItem value="Father">Father</SelectItem>
            <SelectItem value="Sibling">Sibling</SelectItem>
            <SelectItem value="Grandparent">Grandparent</SelectItem>
            <SelectItem value="Extended family">Extended Family</SelectItem>
            <SelectItem value="Friend">Friend</SelectItem>
            <SelectItem value="School">School</SelectItem>
            <SelectItem value="Solicitor/legal">Solicitor</SelectItem>
            <SelectItem value="Junk mail">Junk Mail</SelectItem>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Mail className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(m.recipientChild)} — {m.itemType} from {m.senderName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Received {m.dateReceived} &middot; {m.reviewedFirst ? "Reviewed first" : "Direct to child"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", senderColour[m.senderType])}>
                    {m.senderType}
                  </span>
                  {m.kept && <Heart className="h-4 w-4 text-pink-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {m.reviewedFirst && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Eye className="h-3 w-3 inline mr-1" />Reviewed First by {getStaffName(m.reviewedBy)}
                      </p>
                      <p className="text-sm">{m.reviewedReason}</p>
                    </div>
                  )}

                  {m.childGivenItem ? (
                    <>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Response</p>
                        <p className="text-sm italic">{m.childResponseObserved}</p>
                      </div>

                      {m.childChooseToReply && (
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Reply</p>
                          <p className="text-sm">{m.supportProvidedToRespond}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Storage</p>
                          <p className="text-sm">{m.kept ? `Kept: ${m.keptLocation}` : "Not kept"}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">SW Aware</p>
                          <p className="text-sm">{m.sharedWithSocialWorker ? "Yes" : "No (not required)"}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Item Not Given to Child</p>
                      <p className="text-sm">{m.reviewedReason}</p>
                    </div>
                  )}

                  {m.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{m.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><CheckCircle className="h-3 w-3 inline mr-1" />Item: {m.itemType}</span>
                    <span>Received: {m.dateReceived}</span>
                    {m.dateChildReceived && <span>Given: {m.dateChildReceived}</span>}
                  </div>
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
    </PageShell>
  );
}
