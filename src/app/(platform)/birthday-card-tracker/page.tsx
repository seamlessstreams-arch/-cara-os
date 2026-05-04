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
  Cake,
  Heart,
  Sparkles,
  Mail,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CardRecord {
  id: string;
  youngPerson: string;
  occasion: "Birthday" | "Christmas" | "Eid" | "Other religious festival" | "Anniversary of arrival" | "Achievement" | "Just because" | "Get well";
  occasionDate: string;
  receivedDate: string;
  cardType: "Card" | "Card with money" | "Card with gift" | "Letter" | "Postcard" | "Drawing/handmade";
  senderType: "Mother" | "Father" | "Sibling" | "Grandparent" | "Aunt/Uncle" | "Cousin" | "Family friend" | "Coach/mentor" | "School staff" | "Former carer" | "Cornerstone staff" | "Anonymous well-wisher";
  senderName: string;
  childResponseObserved: string;
  childKeptCard: boolean;
  cardLocation: string;
  itemValue: number;
  acknowledgementSent: boolean;
  acknowledgementMethod: string;
  recordedBy: string;
  significance: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: CardRecord[] = [
  {
    id: "bc-001",
    youngPerson: "yp_alex",
    occasion: "Birthday",
    occasionDate: "2024-08-15",
    receivedDate: "2024-08-13",
    cardType: "Card with money",
    senderType: "Mother",
    senderName: "Mum (Sarah)",
    childResponseObserved: "Alex opened it carefully, read it twice. Smiled. Put money in his special box.",
    childKeptCard: true,
    cardLocation: "Alex's Life Story book",
    itemValue: 20,
    acknowledgementSent: true,
    acknowledgementMethod: "Phone call same evening + thank-you letter Anna helped Alex write",
    recordedBy: "staff_anna",
    significance: "Mum's birthday card is hugely meaningful — represents continuity of relationship through complex circumstances",
    notes: "Card displayed on bedroom shelf during birthday week, then moved to Life Story book for safekeeping.",
  },
  {
    id: "bc-002",
    youngPerson: "yp_alex",
    occasion: "Birthday",
    occasionDate: "2024-08-15",
    receivedDate: "2024-08-14",
    cardType: "Card with gift",
    senderType: "Grandparent",
    senderName: "Maternal Grandmother (Nan)",
    childResponseObserved: "Alex's face lit up — Nan included a photo of them at the seaside (age 6). Real emotional moment.",
    childKeptCard: true,
    cardLocation: "Bedroom — alongside the photo on shelf",
    itemValue: 15,
    acknowledgementSent: true,
    acknowledgementMethod: "Sunday lunch visit; Alex thanked Nan in person and showed her the displayed photo",
    recordedBy: "staff_anna",
    significance: "Nan is a stable, loving figure. The photo connects to pre-care memory.",
    notes: "Photo now part of bedroom personalisation — wrapped in deeper meaning.",
  },
  {
    id: "bc-003",
    youngPerson: "yp_alex",
    occasion: "Birthday",
    occasionDate: "2024-08-15",
    receivedDate: "2024-08-14",
    cardType: "Card",
    senderType: "Coach/mentor",
    senderName: "Coach James (Boxing)",
    childResponseObserved: "Alex was visibly proud — wasn't expecting it. Brought it to boxing club to show.",
    childKeptCard: true,
    cardLocation: "Bedroom shelf",
    itemValue: 0,
    acknowledgementSent: true,
    acknowledgementMethod: "In person at next training session",
    recordedBy: "staff_anna",
    significance: "Coach James as positive male role model — recognised birthday is meaningful",
    notes: "Card had a hand-written note about Alex's progress in the sport.",
  },
  {
    id: "bc-004",
    youngPerson: "yp_jordan",
    occasion: "Birthday",
    occasionDate: "2024-11-22",
    receivedDate: "2024-11-22",
    cardType: "Letter",
    senderType: "Mother",
    senderName: "Mum (Janice — from HMP)",
    childResponseObserved: "Jordan went to his bedroom to read it privately. Came down quieter. Said 'It's good. Mum's still mum.'",
    childKeptCard: true,
    cardLocation: "Bedroom — special envelope (Mum's letters together)",
    itemValue: 0,
    acknowledgementSent: true,
    acknowledgementMethod: "Phone call to prison the next day",
    recordedBy: "staff_chervelle",
    significance: "Mother's letter from prison on birthday is deeply emotional. Continuity through separation.",
    notes: "Standard letterbox arrangement followed. Letter pre-reviewed by SW. No concerns.",
  },
  {
    id: "bc-005",
    youngPerson: "yp_jordan",
    occasion: "Birthday",
    occasionDate: "2024-11-22",
    receivedDate: "2024-11-21",
    cardType: "Card with money",
    senderType: "Sibling",
    senderName: "Sister Tia",
    childResponseObserved: "Jordan beamed. 'She did one for me.' Tia drew on the back — shared sibling humour.",
    childKeptCard: true,
    cardLocation: "Bedroom — sister-cards collection",
    itemValue: 5,
    acknowledgementSent: true,
    acknowledgementMethod: "Video call + thank-you card sent via foster carer",
    recordedBy: "staff_chervelle",
    significance: "Sibling bond through care system — Tia drawing a personal touch",
    notes: "Tia's foster carer facilitated thoughtfully.",
  },
  {
    id: "bc-006",
    youngPerson: "yp_casey",
    occasion: "Birthday",
    occasionDate: "2025-04-08",
    receivedDate: "2025-04-07",
    cardType: "Card",
    senderType: "Cornerstone staff",
    senderName: "Anna (key worker)",
    childResponseObserved: "Casey held the card carefully. Visual smile. Pointed at the otter Anna drew.",
    childKeptCard: true,
    cardLocation: "Bedroom — Otter shelf",
    itemValue: 0,
    acknowledgementSent: false,
    acknowledgementMethod: "N/A — Anna present; mutual moment",
    recordedBy: "staff_anna",
    significance: "Anna's hand-drawn otter card recognises Casey's primary attachment item",
    notes: "Card beside Otter (soft toy) — Casey checked location daily for first week.",
  },
  {
    id: "bc-007",
    youngPerson: "yp_casey",
    occasion: "Achievement",
    occasionDate: d(-30),
    receivedDate: d(-28),
    cardType: "Card",
    senderType: "School staff",
    senderName: "Sarah (art group leader at Reach Out Arts CIC)",
    childResponseObserved: "Casey re-read it three times. Lit up.",
    childKeptCard: true,
    cardLocation: "Bedroom shelf",
    itemValue: 0,
    acknowledgementSent: true,
    acknowledgementMethod: "Casey wrote 'thank you' on next art group attendance",
    recordedBy: "staff_anna",
    significance: "Recognition of Casey's exhibition piece — meaningful adult outside the home",
    notes: "Art-themed card with personal note about 'Finding Home' piece.",
  },
  {
    id: "bc-008",
    youngPerson: "yp_jordan",
    occasion: "Christmas",
    occasionDate: "2024-12-25",
    receivedDate: "2024-12-22",
    cardType: "Card with gift",
    senderType: "Aunt/Uncle",
    senderName: "Aunt Joy",
    childResponseObserved: "Jordan spoke about Aunt Joy's letterbox card. 'She still thinks of me.'",
    childKeptCard: true,
    cardLocation: "Bedroom — letterbox cards collection",
    itemValue: 10,
    acknowledgementSent: true,
    acknowledgementMethod: "Letterbox reply via SW",
    recordedBy: "staff_chervelle",
    significance: "Extended family contact through letterbox arrangement — meaningful continuity",
    notes: "Christmas card with small gift voucher. Within letterbox terms.",
  },
];

const occasionColour: Record<string, string> = {
  Birthday: "bg-pink-100 text-pink-800",
  Christmas: "bg-red-100 text-red-800",
  Eid: "bg-emerald-100 text-emerald-800",
  "Other religious festival": "bg-amber-100 text-amber-800",
  "Anniversary of arrival": "bg-blue-100 text-blue-800",
  Achievement: "bg-purple-100 text-purple-800",
  "Just because": "bg-rose-100 text-rose-800",
  "Get well": "bg-cyan-100 text-cyan-800",
};

const exportCols: ExportColumn<CardRecord>[] = [
  { header: "Young Person", accessor: (r: CardRecord) => getYPName(r.youngPerson) },
  { header: "Occasion", accessor: (r: CardRecord) => r.occasion },
  { header: "Date Received", accessor: (r: CardRecord) => r.receivedDate },
  { header: "Sender Type", accessor: (r: CardRecord) => r.senderType },
  { header: "Sender", accessor: (r: CardRecord) => r.senderName },
  { header: "Type", accessor: (r: CardRecord) => r.cardType },
  { header: "Kept", accessor: (r: CardRecord) => r.childKeptCard ? "Yes" : "No" },
  { header: "Acknowledged", accessor: (r: CardRecord) => r.acknowledgementSent ? "Yes" : "No" },
];

export default function BirthdayCardTrackerPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterOccasion, setFilterOccasion] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((c) => c.youngPerson === filterYP);
    if (filterOccasion !== "all") items = items.filter((c) => c.occasion === filterOccasion);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.receivedDate.localeCompare(a.receivedDate);
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterOccasion, sortBy]);

  const total = data.length;
  const allKept = data.every((c) => c.childKeptCard);
  const acknowledged = data.filter((c) => c.acknowledgementSent).length;
  const uniqueChildren = new Set(data.map((c) => c.youngPerson)).size;

  return (
    <PageShell
      title="Cards & Letters Tracker"
      subtitle="Cards and letters received by children — celebrating connection across all relationships"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="birthday-card-tracker" />
          <PrintButton title="Cards & Letters Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Cards Received</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allKept ? "100%" : `${data.filter((c) => c.childKeptCard).length}/${total}`}</p>
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
            <SelectItem value="Birthday">Birthday</SelectItem>
            <SelectItem value="Christmas">Christmas</SelectItem>
            <SelectItem value="Achievement">Achievement</SelectItem>
            <SelectItem value="Eid">Eid</SelectItem>
            <SelectItem value="Anniversary of arrival">Arrival Anniversary</SelectItem>
            <SelectItem value="Just because">Just Because</SelectItem>
            <SelectItem value="Get well">Get Well</SelectItem>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Cake className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(c.youngPerson)} — {c.occasion} card from {c.senderName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Received {c.receivedDate} &middot; {c.cardType} &middot; {c.senderType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", occasionColour[c.occasion])}>
                    {c.occasion}
                  </span>
                  {c.childKeptCard && <Heart className="h-4 w-4 text-pink-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child&apos;s Response</p>
                    <p className="text-sm italic">{c.childResponseObserved}</p>
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
                      <p className="text-sm">{c.cardLocation}</p>
                      {c.itemValue > 0 && <p className="text-xs text-muted-foreground mt-1">Value enclosed: £{c.itemValue}</p>}
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Mail className="h-3 w-3 inline mr-1" />Acknowledgement
                      </p>
                      <p className="text-sm">{c.acknowledgementSent ? "Yes — " + c.acknowledgementMethod : "Not yet"}</p>
                    </div>
                  </div>

                  {c.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{c.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Star className="h-3 w-3 inline mr-1" />Type: {c.cardType}</span>
                    <span>Sender: {c.senderType}</span>
                    <span>Recorded: {getStaffName(c.recordedBy)}</span>
                    {c.childKeptCard && <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium"><Heart className="h-3 w-3 inline mr-1" />Kept by child</span>}
                  </div>
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
    </PageShell>
  );
}
