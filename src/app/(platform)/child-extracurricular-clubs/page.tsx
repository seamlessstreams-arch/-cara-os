"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Users,
  Star,
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClubRecord {
  id: string;
  youngPerson: string;
  clubName: string;
  category:
    | "Sport"
    | "Music"
    | "Drama / theatre"
    | "Faith / community"
    | "Academic / debate"
    | "Coding / tech"
    | "Art / craft"
    | "Volunteering"
    | "Youth advocacy"
    | "Other";
  joined: string;
  ongoing: boolean;
  ended?: string;
  frequency: string;
  venue: string;
  transportArrangement: string;
  weeklyCost: number;
  fundingSource: string;
  childInitiated: boolean;
  socialFit:
    | "Building"
    | "Settled"
    | "Strong friendships"
    | "Mixed"
    | "Stepping back";
  skillsBuilt: string[];
  attendanceRate: number;
  flagsConcerns: string[];
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ClubRecord[] = [
  {
    id: "ecc-001",
    youngPerson: "yp_jordan",
    clubName: "Riverside FC — Junior Coaching Volunteer Programme",
    category: "Volunteering",
    joined: "2025-01-18",
    ongoing: true,
    frequency: "Saturdays 09:00-11:00 (weekly during season)",
    venue: "Riverside FC training ground",
    transportArrangement: "Edward drives — same trip as Jordan's own training",
    weeklyCost: 0,
    fundingSource: "Free (volunteer role)",
    childInitiated: true,
    socialFit: "Strong friendships",
    skillsBuilt: [
      "Coaching and instruction",
      "Working with younger children",
      "Communication and patience",
      "Leadership in structured setting",
    ],
    attendanceRate: 96,
    flagsConcerns: [],
    childVoice:
      "Coaching the under-9s is the best. Coach Mike trusts me to run drills now.",
    staffObservation:
      "Cross-linked to Volunteering & Charity tracker — same activity, complementary lens. Jordan's identity as captain and mentor is being reinforced. Strong protective factor.",
    reviewDate: d(-12),
    keyWorker: "staff_chervelle",
  },
  {
    id: "ecc-002",
    youngPerson: "yp_jordan",
    clubName: "Mosque Youth Committee — Riverside Central Mosque",
    category: "Faith / community",
    joined: "2024-11-02",
    ongoing: true,
    frequency: "Fortnightly Friday evenings 18:30-20:30",
    venue: "Riverside Central Mosque community room",
    transportArrangement: "Chervelle drops and collects; cousin Devon attends",
    weeklyCost: 0,
    fundingSource: "Free",
    childInitiated: true,
    socialFit: "Settled",
    skillsBuilt: [
      "Community organising",
      "Faith literacy",
      "Public speaking (delivered short reflection)",
      "Cultural identity grounding",
    ],
    attendanceRate: 92,
    flagsConcerns: [],
    childVoice:
      "It's where I figure out who I am as a Muslim and a young Black man. No need to translate myself.",
    staffObservation:
      "Faith and cultural anchor. Imam knows our team and contacts us proactively. Pairs with Cultural Heritage Saturday Club for layered identity work.",
    reviewDate: d(-25),
    keyWorker: "staff_chervelle",
  },
  {
    id: "ecc-003",
    youngPerson: "yp_jordan",
    clubName: "Riverside Academy — School Football Team (Year 9)",
    category: "Sport",
    joined: "2024-09-04",
    ongoing: true,
    frequency: "Wednesdays training, Saturday fixtures (school)",
    venue: "Riverside Academy playing fields and away schools",
    transportArrangement: "School-organised mini-bus to away matches",
    weeklyCost: 0,
    fundingSource: "School-funded",
    childInitiated: true,
    socialFit: "Strong friendships",
    skillsBuilt: [
      "Tactical football",
      "School representation pride",
      "Cross-peer-group friendships at school",
    ],
    attendanceRate: 100,
    flagsConcerns: [
      "Occasional fixture clash with Riverside FC academy taster — needs careful diary management",
    ],
    childVoice: "Captain at club, captain at school. Football is my lane.",
    staffObservation:
      "Distinct from Riverside FC commitment but mutually reinforcing. School pride and visible success a powerful identity protective factor.",
    reviewDate: d(-9),
    keyWorker: "staff_edward",
  },
  {
    id: "ecc-004",
    youngPerson: "yp_alex",
    clubName: "Riverside Boxing Club — Junior Programme",
    category: "Sport",
    joined: "2024-09-12",
    ongoing: true,
    frequency: "Tuesdays + Thursdays 18:00-20:00",
    venue: "Riverside Boxing Club gym",
    transportArrangement: "Lackson drives + collects; staff escort consistent",
    weeklyCost: 12,
    fundingSource: "Home budget (subs + kit replacement)",
    childInitiated: true,
    socialFit: "Strong friendships",
    skillsBuilt: [
      "Discipline and ritual",
      "Physical regulation under stress",
      "Mentor relationship with Coach James",
      "Squad captain modelling",
    ],
    attendanceRate: 96,
    flagsConcerns: [
      "Emotional dysregulation occasionally surfaces post-session — staff debrief routine in place",
    ],
    childVoice:
      "Coach actually believes in me. The gym is the only place that makes sense some weeks.",
    staffObservation:
      "Identity-defining engagement. Cross-linked to After-School Club Tracker for full attendance/cost detail.",
    reviewDate: d(-21),
    keyWorker: "staff_anna",
  },
  {
    id: "ecc-005",
    youngPerson: "yp_alex",
    clubName: "The Proud Trust — LGBTQ+ Youth Group",
    category: "Youth advocacy",
    joined: "2025-02-06",
    ongoing: true,
    frequency: "Thursdays 17:30-19:00 (alternates with boxing weeks)",
    venue: "The Proud Trust drop-in centre, town centre",
    transportArrangement: "Lackson drops; Alex texts on arrival; pickup at 19:15",
    weeklyCost: 0,
    fundingSource: "Free (charity-funded)",
    childInitiated: true,
    socialFit: "Building",
    skillsBuilt: [
      "Self-advocacy",
      "Identity exploration in safe peer space",
      "Awareness of rights (questioned a youth worker about pronouns policy)",
    ],
    attendanceRate: 78,
    flagsConcerns: [
      "Two missed sessions — anxiety about being recognised in town; worked through with key worker",
    ],
    childVoice: "First place I felt I didn't have to explain myself before talking.",
    staffObservation:
      "Major step. Alex disclosed identity exploration to staff in November; this group is part of supported next steps. Confidentiality protocols agreed with Alex in writing.",
    reviewDate: d(-18),
    keyWorker: "staff_anna",
  },
  {
    id: "ecc-006",
    youngPerson: "yp_alex",
    clubName: "Riverside Academy — Debate Club",
    category: "Academic / debate",
    joined: "2024-10-10",
    ongoing: false,
    ended: "2025-01-23",
    frequency: "Wednesdays 15:30-16:30 (lunchtime extension)",
    venue: "Riverside Academy English department",
    transportArrangement: "After-school; school transport home",
    weeklyCost: 0,
    fundingSource: "School-funded",
    childInitiated: false,
    socialFit: "Mixed",
    skillsBuilt: [
      "Structured argument",
      "Listening to opposing views",
      "Public speaking confidence (initial)",
    ],
    attendanceRate: 64,
    flagsConcerns: [
      "Format favoured a different peer group; Alex felt judged on word choice",
    ],
    childVoice: "Tried it. Not my room. Boxing is my room.",
    staffObservation:
      "Trialled at teacher's encouragement. Healthy stepping back — choice respected. Skills carried into other areas.",
    reviewDate: "2025-01-30",
    keyWorker: "staff_anna",
  },
  {
    id: "ecc-007",
    youngPerson: "yp_casey",
    clubName: "Reach Out Arts CIC — Wednesday After-School Art Club",
    category: "Art / craft",
    joined: "2023-09-20",
    ongoing: true,
    frequency: "Wednesdays 16:00-18:00",
    venue: "Reach Out Arts studio (sensory-considered space)",
    transportArrangement: "Anna drives — quiet route, no surprises, pre-prep",
    weeklyCost: 11,
    fundingSource: "Home budget (term subscription)",
    childInitiated: true,
    socialFit: "Strong friendships",
    skillsBuilt: [
      "Mixed media confidence",
      "Articulating creative intent verbally",
      "First sustained friendship (Ellie)",
      "Public exhibition of own work",
    ],
    attendanceRate: 100,
    flagsConcerns: [],
    childVoice: "It's where my brain goes quiet. Sarah and Ellie are my people there.",
    staffObservation:
      "Cross-linked to After-School Club Tracker (sensory-friendly arts strand). Critical therapeutic engagement — continued at all costs.",
    reviewDate: d(-7),
    keyWorker: "staff_anna",
  },
  {
    id: "ecc-008",
    youngPerson: "yp_casey",
    clubName: "1st Riverside Brownies",
    category: "Other",
    joined: "2024-09-18",
    ongoing: true,
    frequency: "Mondays 17:30-19:00 (term-time)",
    venue: "Riverside Methodist Hall",
    transportArrangement: "Anna walks Casey — short familiar route",
    weeklyCost: 4,
    fundingSource: "Home budget (subs + badges)",
    childInitiated: false,
    socialFit: "Settled",
    skillsBuilt: [
      "Working in a small unit (six)",
      "Earned three badges this term",
      "Promise ceremony attended (key milestone)",
    ],
    attendanceRate: 88,
    flagsConcerns: [
      "Large-group games occasionally overwhelming — leader Brown Owl agreed quiet-corner option",
    ],
    childVoice: "I like the badges. Brown Owl knows I need a quiet spot sometimes.",
    staffObservation:
      "Suggested by Anna; Casey now self-identifies as a Brownie. Leadership is informed and accommodating. Pairs with art club for community-belonging strand.",
    reviewDate: d(-30),
    keyWorker: "staff_anna",
  },
];

const categoryColour: Record<ClubRecord["category"], string> = {
  Sport: "bg-sky-100 text-sky-800",
  Music: "bg-violet-100 text-violet-800",
  "Drama / theatre": "bg-violet-100 text-violet-800",
  "Faith / community": "bg-amber-100 text-amber-800",
  "Academic / debate": "bg-blue-100 text-blue-800",
  "Coding / tech": "bg-cyan-100 text-cyan-800",
  "Art / craft": "bg-pink-100 text-pink-800",
  Volunteering: "bg-emerald-100 text-emerald-800",
  "Youth advocacy": "bg-rose-100 text-rose-800",
  Other: "bg-slate-100 text-slate-800",
};

const socialFitColour: Record<ClubRecord["socialFit"], string> = {
  Building: "bg-blue-100 text-blue-800",
  Settled: "bg-sky-100 text-sky-800",
  "Strong friendships": "bg-emerald-100 text-emerald-800",
  Mixed: "bg-amber-100 text-amber-800",
  "Stepping back": "bg-slate-100 text-slate-800",
};

const exportCols: ExportColumn<ClubRecord>[] = [
  { header: "Young Person", accessor: (r: ClubRecord) => getYPName(r.youngPerson) },
  { header: "Club", accessor: (r: ClubRecord) => r.clubName },
  { header: "Category", accessor: (r: ClubRecord) => r.category },
  { header: "Joined", accessor: (r: ClubRecord) => r.joined },
  { header: "Ongoing", accessor: (r: ClubRecord) => (r.ongoing ? "Yes" : "No") },
  { header: "Ended", accessor: (r: ClubRecord) => r.ended ?? "" },
  { header: "Frequency", accessor: (r: ClubRecord) => r.frequency },
  { header: "Venue", accessor: (r: ClubRecord) => r.venue },
  { header: "Transport", accessor: (r: ClubRecord) => r.transportArrangement },
  { header: "Weekly Cost £", accessor: (r: ClubRecord) => `£${r.weeklyCost.toFixed(2)}` },
  { header: "Funding", accessor: (r: ClubRecord) => r.fundingSource },
  { header: "Child Initiated", accessor: (r: ClubRecord) => (r.childInitiated ? "Yes" : "No") },
  { header: "Social Fit", accessor: (r: ClubRecord) => r.socialFit },
  { header: "Skills Built", accessor: (r: ClubRecord) => r.skillsBuilt.join("; ") },
  { header: "Attendance %", accessor: (r: ClubRecord) => `${r.attendanceRate}%` },
  { header: "Flags / Concerns", accessor: (r: ClubRecord) => r.flagsConcerns.join("; ") },
  { header: "Child Voice", accessor: (r: ClubRecord) => r.childVoice },
  { header: "Staff Observation", accessor: (r: ClubRecord) => r.staffObservation },
  { header: "Review Date", accessor: (r: ClubRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: ClubRecord) => getStaffName(r.keyWorker) },
];

const parseFreqHours = (frequency: string): number => {
  const match = frequency.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) return 1.5;
  const start = parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
  const end = parseInt(match[3], 10) + parseInt(match[4], 10) / 60;
  const span = Math.max(0.5, end - start);
  if (/fortnight/i.test(frequency)) return span / 2;
  return span;
};

export default function ChildExtracurricularClubsPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterCategory !== "all") items = items.filter((r) => r.category === filterCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.clubName.toLowerCase().includes(q) ||
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.venue.toLowerCase().includes(q) ||
          r.skillsBuilt.some((s) => s.toLowerCase().includes(q))
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
        case "attendance":
          return b.attendanceRate - a.attendanceRate;
        case "child":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "joined":
          return new Date(b.joined).getTime() - new Date(a.joined).getTime();
        default:
          return 0;
      }
    });
    return items;
  }, [search, filterCategory, sortBy]);

  const today = new Date();
  const in60 = new Date();
  in60.setDate(in60.getDate() + 60);

  const activeClubs = data.filter((r) => r.ongoing).length;
  const weeklyHours = data
    .filter((r) => r.ongoing)
    .reduce((sum, r) => sum + parseFreqHours(r.frequency), 0)
    .toFixed(1);
  const weeklyCost = data
    .filter((r) => r.ongoing)
    .reduce((sum, r) => sum + r.weeklyCost, 0)
    .toFixed(2);
  const reviewsDue = data.filter((r) => {
    const next = new Date(r.reviewDate);
    next.setDate(next.getDate() + 90);
    return next >= today && next <= in60;
  }).length;

  const categories: ClubRecord["category"][] = [
    "Sport",
    "Music",
    "Drama / theatre",
    "Faith / community",
    "Academic / debate",
    "Coding / tech",
    "Art / craft",
    "Volunteering",
    "Youth advocacy",
    "Other",
  ];

  return (
    <PageShell
      title="Extracurricular Clubs & Societies"
      subtitle="Per-child clubs, societies and after-school activities — attendance, social fit, skill building, transport and cost"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="extracurricular-clubs" />
          <PrintButton title="Extracurricular Clubs & Societies" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-700">{activeClubs}</p>
          <p className="text-xs text-muted-foreground">Active Clubs</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-violet-700">{weeklyHours}h</p>
          <p className="text-xs text-muted-foreground">Weekly Hours (active)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-700">£{weeklyCost}</p>
          <p className="text-xs text-muted-foreground">Weekly Cost (active)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-violet-700">{reviewsDue}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (60d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <Star className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-900">
          Each child&apos;s clubs and societies are tracked individually — one row per engagement.
          Cross-links to Volunteering & Charity and Aspirations trackers preserve a single source
          of truth for overlapping commitments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs, child, venue, skills..."
            className="w-full rounded-md border bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">By Last Review</SelectItem>
              <SelectItem value="attendance">By Attendance %</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="joined">By Date Joined</SelectItem>
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
                  <Users className="h-5 w-5 text-sky-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.clubName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(c.youngPerson)} &middot; Joined {c.joined}
                      {c.ended ? ` · Ended ${c.ended}` : ""} &middot; {c.frequency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      categoryColour[c.category]
                    )}
                  >
                    {c.category}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      c.ongoing
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {c.ongoing ? "Ongoing" : "Ended"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-800">
                    {c.attendanceRate}% att.
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium hidden md:inline",
                      socialFitColour[c.socialFit]
                    )}
                  >
                    {c.socialFit}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Venue & Transport
                      </p>
                      <p className="text-sm font-medium">{c.venue}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.transportArrangement}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">
                        Cost & Funding
                      </p>
                      <p className="text-sm font-medium">
                        £{c.weeklyCost.toFixed(2)}/week
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.fundingSource} &middot;{" "}
                        {c.childInitiated ? "Child-initiated" : "Adult-suggested"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="font-medium">{c.attendanceRate}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Social Fit</p>
                      <p className="font-medium">{c.socialFit}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Last Review</p>
                      <p className="font-medium">{c.reviewDate}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Key Worker</p>
                      <p className="font-medium">{getStaffName(c.keyWorker)}</p>
                    </div>
                  </div>

                  <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                    <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Skills Built
                    </p>
                    <ul className="space-y-1">
                      {c.skillsBuilt.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-violet-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {c.flagsConcerns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {c.flagsConcerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                    <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">
                      Child&apos;s Voice
                    </p>
                    <p className="text-sm italic">&ldquo;{c.childVoice}&rdquo;</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm">{c.staffObservation}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {c.frequency}
                    </span>
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {c.socialFit}
                    </span>
                    <span>{c.category}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Quality Standard 6 (Enjoyment & Achievement)
          places a duty on the home to support each child&apos;s engagement in interests, hobbies
          and clubs. UNCRC Article 31 affirms the right to rest, play, leisure and cultural
          life. Pathway Plan duty (for relevant young people) requires recording activities
          that support identity, skills and post-care transition. This page cross-links to the
          Volunteering & Charity, Child Aspirations and After-School Club Tracker pages — each
          engagement is captured once and surfaced where relevant.
        </p>
      </div>
    </PageShell>
  );
}
