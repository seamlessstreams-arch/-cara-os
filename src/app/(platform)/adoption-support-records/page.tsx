"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Heart, Users, BookOpen, Sparkles, Home, Calendar, FileText, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AdoptionStatus =
  | "Plan being explored"
  | "Placement order granted"
  | "Family-finding"
  | "Matched"
  | "Introductions"
  | "Placed for adoption"
  | "Adopted"
  | "Plan changed";

interface IntroductionPhase {
  phase: string;
  dates: string;
  activities: string;
}

interface AdoptionRecord {
  id: string;
  childInitials: string;
  age: number;
  arrivalDate: string;
  adoptionStatus: AdoptionStatus;
  localAuthority: string;
  placementOrderDate: string;
  matchingPanelDate: string;
  adoptionFamilyInfo: string;
  introductionPlan: IntroductionPhase[];
  preparationActivities: string[];
  lifeStoryCompleted: boolean;
  laterLifeLetter: boolean;
  goodbyeRitualsPlanned: string[];
  supportProvidedPostPlacement: string[];
  contactArrangements: string;
  homeKeyWorkerInvolvement: string;
  adoptionSupportPlan: string[];
  childContribution: string;
  socialWorker: string;
  adoptionSocialWorker: string;
  internalLead: string;
  reviewDate: string;
  lastUpdate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_CLR: Record<AdoptionStatus, string> = {
  "Plan being explored": "bg-slate-100 text-slate-800",
  "Placement order granted": "bg-blue-100 text-blue-800",
  "Family-finding": "bg-amber-100 text-amber-800",
  "Matched": "bg-purple-100 text-purple-800",
  "Introductions": "bg-pink-100 text-pink-800",
  "Placed for adoption": "bg-teal-100 text-teal-800",
  "Adopted": "bg-green-100 text-green-800",
  "Plan changed": "bg-gray-100 text-gray-800",
};

const STATUS_BORDER: Record<AdoptionStatus, string> = {
  "Plan being explored": "border-slate-400 bg-slate-50",
  "Placement order granted": "border-blue-400 bg-blue-50",
  "Family-finding": "border-amber-400 bg-amber-50",
  "Matched": "border-purple-400 bg-purple-50",
  "Introductions": "border-pink-400 bg-pink-50",
  "Placed for adoption": "border-teal-400 bg-teal-50",
  "Adopted": "border-green-400 bg-green-50",
  "Plan changed": "border-gray-400 bg-gray-50",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AdoptionRecord[] = [
  {
    id: "ar1",
    childInitials: "M.J. (age 6)",
    age: 6,
    arrivalDate: d(-410),
    adoptionStatus: "Family-finding",
    localAuthority: "Millbrook County Council",
    placementOrderDate: d(-95),
    matchingPanelDate: "",
    adoptionFamilyInfo: "Awaiting matching — profile shared with regional adoption agency. Two prospective families being considered (single adopter; two-parent family with no children).",
    introductionPlan: [],
    preparationActivities: [
      "Weekly life story sessions with key worker",
      "Memory box creation — ongoing",
      "Story books about adoption (age-appropriate)",
      "Therapeutic play sessions with CAMHS",
      "Conversations about families and 'forever homes'",
    ],
    lifeStoryCompleted: false,
    laterLifeLetter: false,
    goodbyeRitualsPlanned: [],
    supportProvidedPostPlacement: [],
    contactArrangements: "Letterbox contact with birth mother twice per year (to be continued post-adoption per care plan). No direct contact with birth father — risk-assessed.",
    homeKeyWorkerInvolvement: "Anna leading life story work and emotional preparation. M.J. has formed strong attachment to Anna; transition planning will need to honour this relationship.",
    adoptionSupportPlan: [
      "Therapeutic life story work to continue post-placement",
      "CAMHS referral to follow child to new area",
      "Letterbox contact to be facilitated by adoption agency",
      "Adopters to receive full attachment profile and behaviour support plan",
    ],
    childContribution: "M.J. has drawn pictures of 'my family I want' — included a dog. Wants a sibling. Has expressed mixed feelings about leaving Oak House.",
    socialWorker: "Fiona Brennan — Millbrook County",
    adoptionSocialWorker: "Helen Ashcroft — Regional Adoption Agency South",
    internalLead: "staff_anna",
    reviewDate: d(28),
    lastUpdate: d(-4),
  },
  {
    id: "ar2",
    childInitials: "T.R. (age 4)",
    age: 4,
    arrivalDate: d(-280),
    adoptionStatus: "Introductions",
    localAuthority: "Southgate Borough Council",
    placementOrderDate: d(-180),
    matchingPanelDate: d(-35),
    adoptionFamilyInfo: "Two-parent family, one adopted older sibling (age 7). Parents have prior experience supporting trauma-informed parenting. Live in semi-rural area.",
    introductionPlan: [
      { phase: "Phase 1 — First meetings", dates: `${d(-7)} to ${d(-3)}`, activities: "Adopters visit Oak House for short play sessions in T.R.'s room. Key worker present throughout. Building familiarity." },
      { phase: "Phase 2 — Extended visits", dates: `${d(-2)} to ${d(2)}`, activities: "Half-day outings with adopters and key worker — park, café, soft play. T.R. shows toys to adopters. Bath/bedtime routines shared." },
      { phase: "Phase 3 — Overnight stays", dates: `${d(3)} to ${d(7)}`, activities: "Overnight stays at adopters' home. Key worker available by phone. Familiar comfort items travel with T.R." },
      { phase: "Phase 4 — Move", dates: d(8), activities: "Goodbye ceremony at Oak House. Adopters collect T.R. with all belongings. Memory book and life story shared." },
    ],
    preparationActivities: [
      "Life story book completed and shared with adopters",
      "Memory box with photos, drawings, and Oak House mementos",
      "Sensory items moving with T.R. (familiar blanket, teddy, bedtime book)",
      "Visits to adopters' home (virtual and in-person)",
      "Photos and short videos of adopters' home, garden, pets",
    ],
    lifeStoryCompleted: true,
    laterLifeLetter: true,
    goodbyeRitualsPlanned: [
      "Goodbye party with home staff and other children",
      "Planting a small tree in the garden — 'T.R.'s tree'",
      "Each staff member writes a short note for T.R.'s memory box",
      "Photo wall — group photo to keep at Oak House and a copy for T.R.",
    ],
    supportProvidedPostPlacement: [],
    contactArrangements: "Letterbox contact twice yearly with birth mother and maternal grandmother. Adopters supportive of indirect contact.",
    homeKeyWorkerInvolvement: "Ryan as key worker leading transition. Will be present for all phases of introductions. Phone contact available to adopters during first month after move.",
    adoptionSupportPlan: [
      "Six-week post-placement visit by Oak House key worker (subject to adopter agreement)",
      "Therapeutic post-adoption support via Regional Adoption Agency",
      "Adoption Support Fund application for sensory therapy",
      "School transition plan in development",
    ],
    childContribution: "T.R. has helped pack his memory box, chosen which toys travel with him, and drawn a picture of his 'new house' from the photos shown. Has named his new parents in conversations.",
    socialWorker: "Michael Osei — Southgate Borough",
    adoptionSocialWorker: "Helen Ashcroft — Regional Adoption Agency South",
    internalLead: "staff_ryan",
    reviewDate: d(14),
    lastUpdate: d(-1),
  },
  {
    id: "ar3",
    childInitials: "S.L. (age 5)",
    age: 5,
    arrivalDate: d(-520),
    adoptionStatus: "Placed for adoption",
    localAuthority: "Fairfield Council",
    placementOrderDate: d(-310),
    matchingPanelDate: d(-95),
    adoptionFamilyInfo: "Single adopter (female), works flexibly from home. Has extended family network nearby. Previous fostering experience.",
    introductionPlan: [
      { phase: "Phase 1 — First meetings", dates: `${d(-65)} to ${d(-58)}`, activities: "Initial visits at Oak House — short structured play and reading sessions. Adopter brought a small gift book." },
      { phase: "Phase 2 — Outings", dates: `${d(-57)} to ${d(-50)}`, activities: "Visits to local park and library with key worker. Mealtimes shared at Oak House." },
      { phase: "Phase 3 — Overnight stays", dates: `${d(-49)} to ${d(-42)}`, activities: "First overnight stays at adopter's home. Familiar bedtime routines maintained." },
      { phase: "Phase 4 — Move", dates: d(-41), activities: "Goodbye ceremony held — staff, peers and adopter present. S.L. left with all belongings, life story book and memory box." },
    ],
    preparationActivities: [
      "Life story book completed and shared with adopter",
      "Memory box with photos and drawings from Oak House",
      "Familiar bedtime book and blanket transferred",
      "Pre-placement visits to adopter's home",
    ],
    lifeStoryCompleted: true,
    laterLifeLetter: true,
    goodbyeRitualsPlanned: [
      "Farewell tea with home staff and children",
      "Memory wall — handprint added to Oak House memory wall",
      "Notes from each staff member placed in memory box",
    ],
    supportProvidedPostPlacement: [
      "Two post-placement phone calls with adopter (week 2 and week 6)",
      "One in-person visit by key worker at six weeks (with adopter consent)",
      "Letterbox contact arrangements activated via adoption agency",
      "Sensory profile and behaviour support plan transferred to adopter and new school",
      "Adoption Support Fund application supported",
    ],
    contactArrangements: "Letterbox contact once yearly with birth mother. Adopter committed to maintaining indirect contact.",
    homeKeyWorkerInvolvement: "Darren led the transition. Has had two follow-up calls with adopter. S.L. is settling well — adopter reports continuing bedtime routines from Oak House. Adoption order hearing scheduled.",
    adoptionSupportPlan: [
      "Therapeutic post-adoption support via Regional Adoption Agency",
      "Adoption Support Fund — funding sensory occupational therapy",
      "School transition supported by EHCP team",
      "Letterbox contact reviewed annually",
    ],
    childContribution: "S.L. helped choose contents of memory box and contributed pages to her life story book. Asked for a photo of Oak House to keep on her bedside table — provided.",
    socialWorker: "Jane Holloway — Fairfield",
    adoptionSocialWorker: "Helen Ashcroft — Regional Adoption Agency South",
    internalLead: "staff_darren",
    reviewDate: d(45),
    lastUpdate: d(-9),
  },
  {
    id: "ar4",
    childInitials: "K.B. (age 8)",
    age: 8,
    arrivalDate: d(-820),
    adoptionStatus: "Adopted",
    localAuthority: "Millbrook County Council",
    placementOrderDate: d(-540),
    matchingPanelDate: d(-380),
    adoptionFamilyInfo: "Two-parent family, one adopted older sibling (age 11). Live in coastal town. Adopters previously known to K.B. through extended introductions.",
    introductionPlan: [
      { phase: "Phase 1 — Meetings", dates: `${d(-340)} to ${d(-330)}`, activities: "Initial visits at Oak House — extended given K.B.'s age and attachment needs." },
      { phase: "Phase 2 — Outings", dates: `${d(-329)} to ${d(-318)}`, activities: "Days out together. K.B. introduced to adoptive sibling gradually." },
      { phase: "Phase 3 — Overnight stays", dates: `${d(-317)} to ${d(-305)}`, activities: "Series of overnight stays building to weekend visits." },
      { phase: "Phase 4 — Move", dates: d(-304), activities: "Move to adoptive family. Goodbye ceremony held with whole home community." },
    ],
    preparationActivities: [
      "Extensive life story work over 14 months",
      "Therapeutic preparation via CAMHS",
      "Co-authored life story book with key worker",
      "Memory box and digital photo album",
      "Pre-placement visits and sleepovers",
    ],
    lifeStoryCompleted: true,
    laterLifeLetter: true,
    goodbyeRitualsPlanned: [
      "Goodbye ceremony with peers and staff",
      "Tree-planting in Oak House garden",
      "Memory wall handprint",
      "Personalised note from each staff member",
    ],
    supportProvidedPostPlacement: [
      "Six-month post-placement visit (with adopter consent)",
      "Quarterly phone contact with adopters during first year",
      "Annual letter exchange — K.B. continues to receive birthday card from Oak House (with adopter consent)",
      "Specialist therapeutic support transferred to local provider",
      "Continued letterbox contact with birth grandparents arranged via adoption agency",
    ],
    contactArrangements: "Letterbox contact twice yearly with birth grandparents. No direct contact with birth parents (risk-assessed). Indirect contact reviewed annually.",
    homeKeyWorkerInvolvement: "Anna remained involved during first year post-placement. Adopters reported this continuity helped K.B. settle. Adoption order granted six months ago. Final celebratory phone call with Anna last month.",
    adoptionSupportPlan: [
      "Adoption Support Fund — therapy continuing",
      "Attachment-focused parenting programme attended by adopters",
      "School in new area receiving ongoing support from Virtual School",
      "Annual review of letterbox arrangements",
    ],
    childContribution: "K.B. wrote her own page for her life story book and chose photos to include. Asked to keep in touch with Anna — agreed via adopters and reviewed regularly. Has sent two letters to Oak House since placement.",
    socialWorker: "Fiona Brennan — Millbrook County",
    adoptionSocialWorker: "Helen Ashcroft — Regional Adoption Agency South",
    internalLead: "staff_anna",
    reviewDate: d(120),
    lastUpdate: d(-30),
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function AdoptionSupportRecordsPage() {
  const [data] = useState<AdoptionRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.childInitials.toLowerCase().includes(s) ||
        r.localAuthority.toLowerCase().includes(s) ||
        r.adoptionStatus.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.adoptionStatus === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "initials": return a.childInitials.localeCompare(b.childInitials);
        case "review": return a.reviewDate.localeCompare(b.reviewDate);
        case "arrival": return a.arrivalDate.localeCompare(b.arrivalDate);
        default: {
          const ord: AdoptionStatus[] = [
            "Introductions", "Matched", "Family-finding", "Placement order granted",
            "Plan being explored", "Placed for adoption", "Adopted", "Plan changed",
          ];
          return ord.indexOf(a.adoptionStatus) - ord.indexOf(b.adoptionStatus);
        }
      }
    });
    return out;
  }, [data, search, statusFilter, sortBy]);

  const activeCases = data.filter(r => r.adoptionStatus !== "Adopted" && r.adoptionStatus !== "Plan changed").length;
  const withFamily = data.filter(r => r.adoptionStatus === "Placed for adoption" || r.adoptionStatus === "Introductions").length;
  const lifeStories = data.filter(r => r.lifeStoryCompleted).length;
  const awaitingMatching = data.filter(r => r.adoptionStatus === "Family-finding" || r.adoptionStatus === "Placement order granted").length;

  const exportCols: ExportColumn<AdoptionRecord>[] = useMemo(() => [
    { header: "Child", accessor: (r: AdoptionRecord) => r.childInitials },
    { header: "Age", accessor: (r: AdoptionRecord) => r.age },
    { header: "Arrival Date", accessor: (r: AdoptionRecord) => r.arrivalDate },
    { header: "Adoption Status", accessor: (r: AdoptionRecord) => r.adoptionStatus },
    { header: "Local Authority", accessor: (r: AdoptionRecord) => r.localAuthority },
    { header: "Placement Order Date", accessor: (r: AdoptionRecord) => r.placementOrderDate },
    { header: "Matching Panel Date", accessor: (r: AdoptionRecord) => r.matchingPanelDate },
    { header: "Adoptive Family", accessor: (r: AdoptionRecord) => r.adoptionFamilyInfo },
    { header: "Life Story Completed", accessor: (r: AdoptionRecord) => r.lifeStoryCompleted ? "Yes" : "No" },
    { header: "Later Life Letter", accessor: (r: AdoptionRecord) => r.laterLifeLetter ? "Yes" : "No" },
    { header: "Contact Arrangements", accessor: (r: AdoptionRecord) => r.contactArrangements },
    { header: "Internal Lead", accessor: (r: AdoptionRecord) => getStaffName(r.internalLead) },
    { header: "Social Worker", accessor: (r: AdoptionRecord) => r.socialWorker },
    { header: "Adoption Social Worker", accessor: (r: AdoptionRecord) => r.adoptionSocialWorker },
    { header: "Review Date", accessor: (r: AdoptionRecord) => r.reviewDate },
    { header: "Last Update", accessor: (r: AdoptionRecord) => r.lastUpdate },
  ], []);

  return (
    <PageShell
      title="Adoption Support Records"
      subtitle="Tracking children whose care plan is adoption — preparation, introductions, post-placement support"
      actions={[
        <PrintButton key="p" title="Adoption Support Records" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="adoption-support-records" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* sensitivity note */}
        <div className="rounded-lg border border-pink-200 bg-pink-50 p-4 text-sm text-pink-900 flex items-start gap-3">
          <Heart className="h-5 w-5 text-pink-600 mt-0.5" />
          <div>
            <p className="font-semibold">A positive permanence outcome</p>
            <p className="text-xs mt-1">Adoption is one of several routes to permanence and, when it is the right plan, can offer a child a lifelong family. Oak House&apos;s role is to prepare each child carefully — emotionally, practically and through life story work — so they arrive at their adoptive family with their history understood, their attachments honoured, and their voice heard. We hold transitions with care and continue to support the child where adopters welcome our involvement.</p>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Cases", value: activeCases, icon: Users, colour: "text-blue-600" },
            { label: "Currently With Adoptive Family", value: withFamily, icon: Home, colour: "text-teal-600" },
            { label: "Life Stories Complete", value: `${lifeStories}/${data.length}`, icon: BookOpen, colour: "text-purple-600" },
            { label: "Awaiting Matching", value: awaitingMatching, icon: Sparkles, colour: "text-amber-600" },
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

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Initials, local authority, status…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-52">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(STATUS_CLR) as AdoptionStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Stage priority</SelectItem>
                    <SelectItem value="initials">Initials</SelectItem>
                    <SelectItem value="arrival">Arrival date</SelectItem>
                    <SelectItem value="review">Review date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* expandable cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.adoptionStatus])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.childInitials}</CardTitle>
                        <Badge className={cn("text-xs", STATUS_CLR[r.adoptionStatus])}>{r.adoptionStatus}</Badge>
                        {r.lifeStoryCompleted && <Badge className="text-xs bg-purple-100 text-purple-800">Life Story Complete</Badge>}
                        {r.laterLifeLetter && <Badge className="text-xs bg-indigo-100 text-indigo-800">Later Life Letter</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Lead: {getStaffName(r.internalLead)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Key dates</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Arrived at Oak House:</span> <strong>{r.arrivalDate}</strong></li>
                          <li><span className="text-muted-foreground">Placement order:</span> <strong>{r.placementOrderDate || "—"}</strong></li>
                          <li><span className="text-muted-foreground">Matching panel:</span> <strong>{r.matchingPanelDate || "—"}</strong></li>
                          <li><span className="text-muted-foreground">Local authority:</span> <strong>{r.localAuthority}</strong></li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Home className="h-3 w-3" />Adoptive family</p>
                        <p className="text-sm">{r.adoptionFamilyInfo}</p>
                      </div>
                    </div>

                    {/* introductions */}
                    {r.introductionPlan.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Users className="h-3 w-3" />Introduction Plan</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Phase</th>
                              <th className="text-left p-2 font-medium">Dates</th>
                              <th className="text-left p-2 font-medium">Activities</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.introductionPlan.map((p, i) => (
                              <tr key={i} className="border-t align-top">
                                <td className="p-2 font-medium">{p.phase}</td>
                                <td className="p-2 whitespace-nowrap">{p.dates}</td>
                                <td className="p-2">{p.activities}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* preparation & goodbye */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1"><BookOpen className="h-3 w-3" />Preparation Activities</p>
                        <ul className="text-sm text-blue-900 list-disc list-inside space-y-0.5">{r.preparationActivities.map((a, i) => <li key={i}>{a}</li>)}</ul>
                      </div>
                      {r.goodbyeRitualsPlanned.length > 0 && (
                        <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                          <p className="text-xs font-semibold text-pink-800 mb-1 flex items-center gap-1"><Heart className="h-3 w-3" />Goodbye Rituals</p>
                          <ul className="text-sm text-pink-900 list-disc list-inside space-y-0.5">{r.goodbyeRitualsPlanned.map((g, i) => <li key={i}>{g}</li>)}</ul>
                        </div>
                      )}
                    </div>

                    {/* post-placement & support plan */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {r.supportProvidedPostPlacement.length > 0 && (
                        <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                          <p className="text-xs font-semibold text-teal-800 mb-1">Post-Placement Support Provided</p>
                          <ul className="text-sm text-teal-900 list-disc list-inside space-y-0.5">{r.supportProvidedPostPlacement.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                      )}
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1"><FileText className="h-3 w-3" />Adoption Support Plan</p>
                        <ul className="text-sm text-purple-900 list-disc list-inside space-y-0.5">{r.adoptionSupportPlan.map((s, i) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1"><MessageCircle className="h-3 w-3" />Child&apos;s contribution & voice</p>
                      <p className="text-sm text-amber-900">{r.childContribution}</p>
                    </div>

                    {/* contact / key worker involvement */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1">Contact arrangements</p>
                        <p className="text-muted-foreground">{r.contactArrangements}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Home key worker involvement</p>
                        <p className="text-muted-foreground">{r.homeKeyWorkerInvolvement}</p>
                      </div>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Internal lead: <strong>{getStaffName(r.internalLead)}</strong></span>
                      <span>Social worker: <strong>{r.socialWorker}</strong></span>
                      <span>Adoption social worker: <strong>{r.adoptionSocialWorker}</strong></span>
                      <span>Review: <strong>{r.reviewDate}</strong></span>
                      <span>Last update: <strong>{r.lastUpdate}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Adoption and Children Act 2002 — sets the legal framework for adoption in England, including welfare paramountcy, placement orders, contact and adoption support services. Adoption Support Services Regulations 2005 — entitlement of adopted children and adoptive families to assessment for adoption support. Children&apos;s Homes (England) Regulations 2015 — the home must promote the welfare of each child, support permanence planning and prepare children for transitions in line with their care plan. Adoption Statutory Guidance 2013 — life story work, later life letters and well-planned introductions are core practice expectations. Records must be retained securely; later life information must be available to the child in adulthood.</p>
        </div>
      </div>
    </PageShell>
  );
}
