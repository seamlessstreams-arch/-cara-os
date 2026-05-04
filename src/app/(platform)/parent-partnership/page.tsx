"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Phone, Video, Mail, Users, FileText, PenLine,
  CheckCircle2, AlertTriangle, Clock, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ContactType = "phone_call" | "visit" | "email" | "meeting" | "letter" | "video_call";
type EngagementLevel = "positive" | "neutral" | "difficult" | "disengaged" | "hostile";
type RelationshipType = "birth_parent" | "grandparent" | "sibling" | "extended_family" | "foster_carer" | "other";

interface ParentPartnershipRecord {
  id: string;
  date: string;
  youngPersonId: string;
  familyMemberName: string;
  relationshipType: RelationshipType;
  contactType: ContactType;
  engagementLevel: EngagementLevel;
  initiatedBy: "home" | "family" | "social_worker";
  duration: number;
  staffMemberId: string;
  summary: string;
  concerns: string;
  positiveOutcomes: string[];
  followUpActions: string[];
  swInformed: boolean;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CT_LABEL: Record<ContactType, string> = {
  phone_call: "Phone Call", visit: "Visit", email: "Email",
  meeting: "Meeting", letter: "Letter", video_call: "Video Call",
};
const CT_ICON: Record<ContactType, typeof Phone> = {
  phone_call: Phone, visit: Users, email: Mail,
  meeting: Users, letter: FileText, video_call: Video,
};

const ENG_LABEL: Record<EngagementLevel, string> = {
  positive: "Positive", neutral: "Neutral", difficult: "Difficult",
  disengaged: "Disengaged", hostile: "Hostile",
};
const ENG_CLR: Record<EngagementLevel, string> = {
  positive: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-100 text-slate-800",
  difficult: "bg-amber-100 text-amber-800",
  disengaged: "bg-orange-100 text-orange-800",
  hostile: "bg-red-100 text-red-800",
};
const ENG_BORDER: Record<EngagementLevel, string> = {
  positive: "border-l-emerald-400",
  neutral: "border-l-slate-300",
  difficult: "border-l-amber-400",
  disengaged: "border-l-orange-400",
  hostile: "border-l-red-500",
};

const REL_LABEL: Record<RelationshipType, string> = {
  birth_parent: "Birth Parent", grandparent: "Grandparent", sibling: "Sibling",
  extended_family: "Extended Family", foster_carer: "Foster Carer", other: "Other",
};

const INIT_LABEL: Record<"home" | "family" | "social_worker", string> = {
  home: "Home", family: "Family", social_worker: "Social Worker",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: ParentPartnershipRecord[] = [
  {
    id: "pp1",
    date: d(-3),
    youngPersonId: "yp_alex",
    familyMemberName: "Mark (birth father)",
    relationshipType: "birth_parent",
    contactType: "phone_call",
    engagementLevel: "positive",
    initiatedBy: "home",
    duration: 25,
    staffMemberId: "staff_darren",
    summary: "Telephone call with Mark to update him on Alex's progress. Mark was pleased to hear Alex has been selected for the school football team and scored twice in last week's match. Mark asked about parents' evening — Darren confirmed date and said the home would facilitate Mark attending if he wished. Mark said he would like to come. Conversation warm and constructive throughout.",
    concerns: "",
    positiveOutcomes: [
      "Mark engaged positively and asked appropriate questions about Alex's education",
      "Mark expressed interest in attending parents' evening",
      "Alex aware of call and happy that Dad knows about football",
    ],
    followUpActions: [
      "Send parents' evening details to Mark by post",
      "Discuss with Alex how he feels about Mark attending",
    ],
    swInformed: false,
    notes: "Mark's engagement has been consistently positive over the last 3 months. Good working relationship developing.",
  },
  {
    id: "pp2",
    date: d(-7),
    youngPersonId: "yp_alex",
    familyMemberName: "Sarah (birth mother)",
    relationshipType: "birth_parent",
    contactType: "visit",
    engagementLevel: "positive",
    initiatedBy: "family",
    duration: 90,
    staffMemberId: "staff_anna",
    summary: "Sarah visited the home to see Alex for his birthday. She brought age-appropriate birthday presents (art set and new trainers). Alex was visibly happy to see his mum and showed her his bedroom and recent artwork. Sarah interacted warmly with Alex and was complimentary about the home environment. She thanked staff for looking after Alex. Visit was relaxed and positive throughout.",
    concerns: "",
    positiveOutcomes: [
      "Sarah brought thoughtful, age-appropriate gifts",
      "Alex was happy and settled during and after the visit",
      "Sarah praised the care Alex is receiving",
      "Natural, warm interaction between mother and child observed",
    ],
    followUpActions: [
      "Record gifts in the gifts register",
      "Update contact log and share with SW at next scheduled call",
    ],
    swInformed: false,
    notes: "This was one of the most positive visits to date. Alex talked about it happily for the rest of the evening.",
  },
  {
    id: "pp3",
    date: d(-5),
    youngPersonId: "yp_jordan",
    familyMemberName: "Donna (birth mother)",
    relationshipType: "birth_parent",
    contactType: "video_call",
    engagementLevel: "difficult",
    initiatedBy: "social_worker",
    duration: 40,
    staffMemberId: "staff_darren",
    summary: "Video call arranged by Michael Osei (SW) between Jordan and his mother Donna. Donna became upset early in the call about Jordan being on a part-time school timetable. She accused the home of not pushing the school hard enough and said Jordan was falling behind. Michael mediated and explained the graduated return plan agreed at the PEP meeting. Donna calmed somewhat but remained unhappy. Jordan was quiet during the call and became withdrawn afterwards.",
    concerns: "Donna's frustration about education is understandable but her manner upset Jordan. Jordan was withdrawn for approximately 2 hours after the call and declined tea. Need to monitor impact of calls on Jordan's emotional state.",
    positiveOutcomes: [
      "SW mediation helped de-escalate the situation",
      "Donna's concerns about education show she cares about Jordan's progress",
    ],
    followUpActions: [
      "Key work session with Jordan to process feelings about the call",
      "Darren to send Donna a written update on the education plan",
      "Discuss with SW whether future calls need pre-call briefing for Donna",
    ],
    swInformed: true,
    notes: "Michael Osei was present throughout and is aware of the dynamic. He will speak to Donna separately about managing her frustration in front of Jordan.",
  },
  {
    id: "pp4",
    date: d(-2),
    youngPersonId: "yp_casey",
    familyMemberName: "Margaret (grandmother)",
    relationshipType: "grandparent",
    contactType: "phone_call",
    engagementLevel: "positive",
    initiatedBy: "family",
    duration: 20,
    staffMemberId: "staff_chervelle",
    summary: "Regular weekly phone call from Margaret. She is Casey's most consistent family connection and calls every Wednesday without fail. Margaret asked about Casey's college work and was pleased to hear about the distinction in the art assignment. They chatted about Margaret's garden and made plans for Casey to visit at half-term (subject to SW approval). Margaret thanked Chervelle for always being available to take her calls.",
    concerns: "",
    positiveOutcomes: [
      "Consistent weekly contact maintained — strong protective factor for Casey",
      "Margaret shows genuine interest in Casey's education and wellbeing",
      "Casey looks forward to the calls and was in good spirits afterwards",
    ],
    followUpActions: [
      "Check with Fiona Brennan (SW) re half-term visit to Margaret's",
    ],
    swInformed: false,
    notes: "Margaret is a stabilising influence in Casey's life. This relationship should be actively supported and protected.",
  },
  {
    id: "pp5",
    date: d(-10),
    youngPersonId: "yp_casey",
    familyMemberName: "Tracey (birth mother)",
    relationshipType: "birth_parent",
    contactType: "letter",
    engagementLevel: "disengaged",
    initiatedBy: "family",
    duration: 0,
    staffMemberId: "staff_darren",
    summary: "Letter received from Tracey (Casey's birth mother). There is a no-contact order in place — letter was screened by Fiona Brennan (SW) before any decision on whether to share contents with Casey. Letter was brief and did not contain inappropriate content but Fiona has decided it should not be passed to Casey at this time given the current therapeutic work around attachment. Tracey has not responded to SW's previous three attempts to arrange indirect contact through the proper channels.",
    concerns: "Tracey continues to bypass the agreed contact arrangements. This is the second unsolicited letter in 3 months. SW is monitoring.",
    positiveOutcomes: [],
    followUpActions: [
      "Letter filed securely — copy sent to SW",
      "Fiona to write to Tracey reminding her of the correct process for indirect contact",
      "Discuss in next supervision whether Casey should be told about the letter",
    ],
    swInformed: true,
    notes: "Casey is not aware of this letter. Decision made jointly with SW that informing Casey would not be in their best interests at this stage of therapy.",
  },
];

/* ── export columns ────────────────────────────────────────────────────────── */

const exportCols: ExportColumn<ParentPartnershipRecord>[] = [
  { header: "Date", accessor: (r: ParentPartnershipRecord) => r.date },
  { header: "Young Person", accessor: (r: ParentPartnershipRecord) => getYPName(r.youngPersonId) },
  { header: "Family Member", accessor: (r: ParentPartnershipRecord) => r.familyMemberName },
  { header: "Relationship", accessor: (r: ParentPartnershipRecord) => REL_LABEL[r.relationshipType] },
  { header: "Contact Type", accessor: (r: ParentPartnershipRecord) => CT_LABEL[r.contactType] },
  { header: "Engagement", accessor: (r: ParentPartnershipRecord) => ENG_LABEL[r.engagementLevel] },
  { header: "Initiated By", accessor: (r: ParentPartnershipRecord) => INIT_LABEL[r.initiatedBy] },
  { header: "Duration (mins)", accessor: (r: ParentPartnershipRecord) => String(r.duration) },
  { header: "Staff", accessor: (r: ParentPartnershipRecord) => getStaffName(r.staffMemberId) },
  { header: "Summary", accessor: (r: ParentPartnershipRecord) => r.summary },
  { header: "Concerns", accessor: (r: ParentPartnershipRecord) => r.concerns },
  { header: "SW Informed", accessor: (r: ParentPartnershipRecord) => r.swInformed ? "Yes" : "No" },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ParentPartnershipPage() {
  const [data] = useState<ParentPartnershipRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [engFilter, setEngFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.youngPersonId).toLowerCase().includes(s) ||
        r.familyMemberName.toLowerCase().includes(s) ||
        r.summary.toLowerCase().includes(s)
      );
    }
    if (childFilter !== "all") out = out.filter(r => r.youngPersonId === childFilter);
    if (engFilter !== "all") out = out.filter(r => r.engagementLevel === engFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [data, search, childFilter, engFilter, sortBy]);

  /* stats */
  const totalContacts = data.length;
  const positiveCount = data.filter(r => r.engagementLevel === "positive").length;
  const difficultCount = data.filter(r => r.engagementLevel === "difficult" || r.engagementLevel === "hostile").length;
  const disengagedCount = data.filter(r => r.engagementLevel === "disengaged").length;
  const withConcerns = data.filter(r => r.concerns.trim().length > 0).length;
  const pendingFollowUps = data.reduce((n, r) => n + r.followUpActions.length, 0);

  return (
    <PageShell
      title="Parent &amp; Carer Partnership"
      subtitle="Family engagement, contact quality and partnership working — Children Act 1989"
      actions={[
        <PrintButton key="p" title="Parent Partnership Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="parent-partnership-log" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Contact</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* ── stat strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Contacts", value: totalContacts, icon: Phone, colour: "text-blue-600" },
            { label: "Positive", value: positiveCount, icon: Heart, colour: "text-emerald-600" },
            { label: "Difficult / Hostile", value: difficultCount, icon: AlertTriangle, colour: difficultCount > 0 ? "text-amber-600" : "text-slate-400" },
            { label: "Disengaged", value: disengagedCount, icon: Clock, colour: disengagedCount > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "With Concerns", value: withConcerns, icon: AlertTriangle, colour: withConcerns > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Follow-Up Actions", value: pendingFollowUps, icon: CheckCircle2, colour: "text-indigo-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filter bar ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name, family member, summary…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-40">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Young Person</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Young People</SelectItem>
                    {childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs">Engagement</Label>
                <Select value={engFilter} onValueChange={setEngFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {(Object.entries(ENG_LABEL) as [EngagementLevel, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── contact cards ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const Icon = CT_ICON[r.contactType];
            return (
              <Card key={r.id} className={cn("border-l-4", ENG_BORDER[r.engagementLevel])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900">{getYPName(r.youngPersonId)}</span>
                          <span className="text-slate-400 text-xs">&middot;</span>
                          <span className="text-sm text-slate-700">{r.familyMemberName}</span>
                          <Badge variant="outline" className="text-xs">{REL_LABEL[r.relationshipType]}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{r.date}</span>
                          <span className="text-xs text-muted-foreground">{CT_LABEL[r.contactType]}</span>
                          {r.duration > 0 && <span className="text-xs text-muted-foreground">{r.duration} mins</span>}
                          <span className="text-xs text-muted-foreground">Staff: {getStaffName(r.staffMemberId)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.concerns && (
                        <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                          <AlertTriangle className="w-3 h-3" /> Concern
                        </Badge>
                      )}
                      <Badge className={cn("text-xs", ENG_CLR[r.engagementLevel])}>{ENG_LABEL[r.engagementLevel]}</Badge>
                      {r.swInformed && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">SW Informed</Badge>
                      )}
                      {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </button>

                {open && (
                  <CardContent className="space-y-4 pt-0 border-t">
                    {/* Summary */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{r.summary}</p>
                    </div>

                    {/* Contact details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Initiated By</p>
                        <p className="font-medium">{INIT_LABEL[r.initiatedBy]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{r.duration > 0 ? `${r.duration} minutes` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Staff Member</p>
                        <p className="font-medium">{getStaffName(r.staffMemberId)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SW Informed</p>
                        <p className="font-medium">{r.swInformed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* Concerns */}
                    {r.concerns && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Concerns
                        </p>
                        <p className="text-sm text-red-900">{r.concerns}</p>
                      </div>
                    )}

                    {/* Positive outcomes */}
                    {r.positiveOutcomes.length > 0 && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Positive Outcomes
                        </p>
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {r.positiveOutcomes.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Follow-up actions */}
                    {r.followUpActions.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                          <PenLine className="w-3.5 h-3.5" /> Follow-Up Actions
                        </p>
                        <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                          {r.followUpActions.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    {r.notes && (
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Notes</p>
                        <p className="text-sm text-blue-900">{r.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No contacts match filters.</p>
          )}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children Act 1989 — duty to promote contact and partnership with parents. Children&apos;s Homes Regulations 2015, Reg 7 — contact arrangements between children and their parents, relatives and friends. Working Together to Safeguard Children 2023 — multi-agency working and engagement with families. All contacts must be recorded accurately and made available for Ofsted inspection.</p>
        </div>
      </div>

      {/* ── new entry dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Family Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Young Person</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select young person" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Family Member Name</Label>
              <Input placeholder="e.g. Mark (birth father)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Relationship</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REL_LABEL) as [RelationshipType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Type</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CT_LABEL) as [ContactType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="e.g. 30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Engagement Level</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ENG_LABEL) as [EngagementLevel, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Initiated By</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="social_worker">Social Worker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea rows={3} placeholder="Describe the contact, how it went, and the quality of engagement…" />
            </div>
            <div>
              <Label>Concerns</Label>
              <Textarea rows={2} placeholder="Any concerns arising from this contact (leave blank if none)…" />
            </div>
            <div>
              <Label>Positive Outcomes</Label>
              <Textarea rows={2} placeholder="One per line…" />
            </div>
            <div>
              <Label>Follow-Up Actions</Label>
              <Textarea rows={2} placeholder="One per line…" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Additional notes…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
