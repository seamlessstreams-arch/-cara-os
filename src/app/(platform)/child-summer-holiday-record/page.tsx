"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Sun,
  MapPin,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Camera,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HolidayRecord {
  id: string;
  youngPerson: string;
  holidayPeriod:
    | "Summer"
    | "Easter"
    | "Christmas"
    | "October half-term"
    | "February half-term"
    | "May half-term"
    | "Bank holiday"
    | "Other";
  year: string;
  durationDays: number;
  destinations: string[];
  highlights: string[];
  withWhom: string[];
  costSpent: number;
  fundingSource: string;
  childChoseDestination: boolean;
  challengesNoted: string[];
  photosTaken: boolean;
  photosLocation?: string;
  childMemoryHeadline: string;
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  recordedBy: string;
}

const records: HolidayRecord[] = [
  {
    id: "hol_001",
    youngPerson: "yp_casey",
    holidayPeriod: "Summer",
    year: "2025",
    durationDays: 7,
    destinations: [
      "Polzeath, Cornwall (self-catering cottage)",
      "Padstow harbour",
      "Tintagel Castle (just the outside — gentle visit)",
      "Bodmin Moor pony ride",
    ],
    highlights: [
      "First time seeing the sea up close — Casey ran in fully clothed twice",
      "Daily ice cream from the same little van — Casey befriended the seller",
      "Sandcastle competition with Ellie — Casey won 'most creative'",
      "Quiet evenings reading on the cottage porch with Linda",
      "Sensory-friendly cottage — soft furnishings, no overhead strip lights",
    ],
    withWhom: [
      "Anna (key worker, full week)",
      "Casey",
      "Ellie (sibling, joined for full week — supported by family-time funding)",
      "Linda (Ellie's foster carer, full week)",
    ],
    costSpent: 1840,
    fundingSource: "Holiday & leisure budget + sibling-time grant (£300)",
    childChoseDestination: true,
    challengesNoted: [
      "Crowded Padstow on day 3 — Casey overwhelmed, returned to cottage early (managed well)",
      "First night unsettled — new bed, new sounds (resolved by night 2 with familiar blanket from home)",
    ],
    photosTaken: true,
    photosLocation: "Casey's life-story album + shared family folder (Ellie's copy printed for Linda)",
    childMemoryHeadline:
      "The week I met the sea and Ellie won't forget my sandcastle.",
    childVoice:
      "I want to go back. The sea was loud but good loud. Ellie laughed so much. I want this every summer please.",
    staffObservation:
      "Genuinely restorative week. Casey's regulation visibly improved by day 4. Sibling bond strengthened — Linda commented Ellie talked about Casey for weeks afterwards. Sensory-friendly cottage choice was the right call. Recommend repeating venue.",
    reviewDate: "2025-09-12",
    recordedBy: "staff_anna",
  },
  {
    id: "hol_002",
    youngPerson: "yp_jordan",
    holidayPeriod: "Summer",
    year: "2025",
    durationDays: 14,
    destinations: [
      "Lahore, Pakistan (paternal grandmother's home)",
      "Day trip to Murree hill station",
      "Shalimar Gardens",
      "Local mosque for Jumu'ah with brother",
    ],
    highlights: [
      "First reunion with brother since entering care (4 years)",
      "Met paternal grandmother for the first time — she had kept Jordan's baby photos",
      "Cooked sheer khurma alongside grandmother — recipe now Jordan's own",
      "Brother gave Jordan a bracelet that had been their father's",
      "Jordan led prayers at family meal on day 9 — described as 'the proudest moment of my life'",
    ],
    withWhom: [
      "Anna (accompanied first 4 days — settling, identity-document handover, family meet)",
      "Brother Bilal (host for full 14 days)",
      "Paternal grandmother",
      "Extended family (uncles, cousins — large warm gathering)",
      "Jordan independent with family from day 5 onward",
    ],
    costSpent: 2380,
    fundingSource:
      "Family-time travel grant (LA contribution £1,400) + holiday budget (£980)",
    childChoseDestination: true,
    challengesNoted: [
      "Significant pre-trip anxiety (managed via three planning sessions with Anna and CAMHS check-in)",
      "Day 6 hard — Jordan called Anna in tears missing the home; resolved overnight",
      "Heat (38C) — extra hydration plan agreed with Anna before departure",
      "Re-entry support needed — first 2 weeks back at home gentle, no school pressure",
    ],
    photosTaken: true,
    photosLocation:
      "Jordan's life-story album, identity work folder, and shared with brother via WhatsApp (consent recorded)",
    childMemoryHeadline:
      "I went home and home was still there waiting for me.",
    childVoice:
      "I was scared they wouldn't recognise me or I wouldn't recognise them. But Bilal looked just like dad. Nani had my baby photos in a box. I prayed with my brother. I came back different — I know who I am now.",
    staffObservation:
      "Transformational. Identity work that no amount of office-based sessions could replicate. The two-stage model (Anna for 4 days, then Jordan independent) worked exactly as planned. Re-entry plan honoured — Jordan was quiet for a fortnight which was right. CAMHS reflected this trip in their July review as a major protective factor.",
    reviewDate: "2025-09-05",
    recordedBy: "staff_anna",
  },
  {
    id: "hol_003",
    youngPerson: "yp_alex",
    holidayPeriod: "Easter",
    year: "2025",
    durationDays: 3,
    destinations: [
      "Proud Trust queer-affirming youth retreat (rural Derbyshire)",
      "Moorland walk and campfire night",
    ],
    highlights: [
      "First time in a space where Alex was 'one of many' rather than 'the only one'",
      "Met two other LGBTQ+ care-experienced young people — exchanged numbers (still in contact)",
      "Open-mic night — Alex read a poem they'd written (their choice to share)",
      "Workshop on chosen names and self-advocacy",
      "Anna's drop-off support meant Alex felt safely held into the space without being chaperoned through it",
    ],
    withWhom: [
      "Anna (drop-off and collection only — Alex's clear preference)",
      "Alex (independent for the retreat itself)",
      "Proud Trust facilitators (DBS-checked, briefed on Alex's plan)",
    ],
    costSpent: 285,
    fundingSource: "Holiday budget + Proud Trust bursary (£100)",
    childChoseDestination: true,
    challengesNoted: [
      "Pre-trip wobble the night before — Anna sat with Alex; offered exit plan; Alex chose to go",
      "Alex's birth mum unaware of trip (Alex's choice — recorded with social worker)",
    ],
    photosTaken: true,
    photosLocation:
      "Alex's personal phone (Alex's choice — not added to home album per their preference)",
    childMemoryHeadline:
      "The weekend I wasn't the only one.",
    childVoice:
      "I read my poem and people listened like it mattered. I have two new friends who actually get it. I want to go again. Maybe lead a workshop next time.",
    staffObservation:
      "Exactly the right level of staff presence — close enough to be safe, distant enough to let Alex be themselves. The friendships formed have been sustained — Alex has video-called both peers monthly since. Significant identity-affirmation outcome.",
    reviewDate: "2025-05-02",
    recordedBy: "staff_anna",
  },
  {
    id: "hol_004",
    youngPerson: "yp_casey",
    holidayPeriod: "October half-term",
    year: "2024",
    durationDays: 1,
    destinations: ["Lego Discovery Centre, Manchester"],
    highlights: [
      "Casey built a working drawbridge and refused to dismantle it for 40 minutes",
      "Quiet hour ticket booked — sensory-friendly entry slot",
      "Lunch at the cafe — Casey chose what they wanted independently",
      "Photo with the giraffe figure that Casey now keeps on their bedroom shelf (printed)",
    ],
    withWhom: ["Casey", "Darren (key worker for the day)"],
    costSpent: 88,
    fundingSource: "Holiday & leisure budget",
    childChoseDestination: true,
    challengesNoted: [
      "Tram on the way back delayed 30 mins — Casey managed with snacks and headphones",
    ],
    photosTaken: true,
    photosLocation: "Casey's bedroom shelf + life-story album",
    childMemoryHeadline:
      "The day I made a drawbridge that actually went up and down.",
    childVoice:
      "I didn't want to leave. The quiet hour was good because I could hear myself think. Can we go again?",
    staffObservation:
      "Small day, big impact. Quiet-hour booking critical — would not have worked at general entry. Casey's pride in the build was sustained for weeks afterwards.",
    reviewDate: "2024-11-04",
    recordedBy: "staff_darren",
  },
  {
    id: "hol_005",
    youngPerson: "yp_jordan",
    holidayPeriod: "Christmas",
    year: "2024",
    durationDays: 12,
    destinations: [
      "Home (planned-at-home Christmas — see religious-festival-celebrations for festival side)",
      "Boxing Day walk in Mam Tor",
      "Local mosque (Jumu'ah and Christmas-week community meal)",
    ],
    highlights: [
      "All three children chose to be home rather than away — first time as a settled trio",
      "Jordan helped prepare separate halal Christmas meal alongside main meal (his choice — wanted to join the day his way)",
      "Casey's grandad joined for lunch — first time meeting Jordan",
      "Boxing Day walk with all three children, Anna, and Darren",
      "New Year's Eve fireworks watched from upstairs window (Casey's preference, sensory)",
    ],
    withWhom: [
      "Casey, Jordan, Alex (all three children)",
      "Anna (Christmas Day shift)",
      "Darren (Christmas Day shift)",
      "Casey's grandad (lunch only)",
    ],
    costSpent: 940,
    fundingSource: "Christmas budget (£600) + activities budget (£340)",
    childChoseDestination: true,
    challengesNoted: [
      "Alex's birth mum declined invitation — managed with dignity (Casey's grandad called her on Alex's behalf)",
      "Quiet morning on Christmas Day for Alex — gentle check-in by Anna",
      "Jordan's family contact call ran long — meal pushed back 30 mins (no issue)",
    ],
    photosTaken: true,
    photosLocation:
      "Shared home album + each child's personal album (consent recorded individually)",
    childMemoryHeadline:
      "The Christmas we all chose to be home together.",
    childVoice:
      "Jordan: 'I cooked my own food and no-one made me feel weird about it.' // Casey: 'GRANDAD CAME!!!' // Alex: 'Mum didn't come but I was okay. Casey's grandad called her. That was kind.'",
    staffObservation:
      "The first Christmas all three felt like a unit. Decision to keep at home rather than splinter for activities was right — children needed the security of place. Jordan's halal preparation respected without fuss. Alex's mum's absence handled with care. Memory side recorded here; festival/observance side in religious-festival-celebrations.",
    reviewDate: "2025-01-08",
    recordedBy: "staff_darren",
  },
];

const exportCols: ExportColumn<HolidayRecord>[] = [
  { header: "Young Person", accessor: (r: HolidayRecord) => getYPName(r.youngPerson) },
  { header: "Period", accessor: (r: HolidayRecord) => r.holidayPeriod },
  { header: "Year", accessor: (r: HolidayRecord) => r.year },
  { header: "Duration (days)", accessor: (r: HolidayRecord) => r.durationDays.toString() },
  { header: "Destinations", accessor: (r: HolidayRecord) => r.destinations.join("; ") },
  { header: "With Whom", accessor: (r: HolidayRecord) => r.withWhom.join("; ") },
  { header: "Cost Spent", accessor: (r: HolidayRecord) => `£${r.costSpent.toFixed(2)}` },
  { header: "Funding", accessor: (r: HolidayRecord) => r.fundingSource },
  { header: "Child Chose", accessor: (r: HolidayRecord) => (r.childChoseDestination ? "Yes" : "No") },
  { header: "Highlights", accessor: (r: HolidayRecord) => r.highlights.join("; ") },
  { header: "Challenges", accessor: (r: HolidayRecord) => r.challengesNoted.join("; ") },
  { header: "Photos Kept", accessor: (r: HolidayRecord) => (r.photosTaken ? "Yes" : "No") },
  { header: "Photos Location", accessor: (r: HolidayRecord) => r.photosLocation ?? "—" },
  { header: "Child Memory Headline", accessor: (r: HolidayRecord) => r.childMemoryHeadline },
  { header: "Child Voice", accessor: (r: HolidayRecord) => r.childVoice },
  { header: "Staff Observation", accessor: (r: HolidayRecord) => r.staffObservation },
  { header: "Review Date", accessor: (r: HolidayRecord) => r.reviewDate },
  { header: "Recorded By", accessor: (r: HolidayRecord) => getStaffName(r.recordedBy) },
];

const periodColour: Record<HolidayRecord["holidayPeriod"], string> = {
  Summer: "bg-amber-100 text-amber-800 border-amber-200",
  Easter: "bg-pink-100 text-pink-800 border-pink-200",
  Christmas: "bg-red-100 text-red-800 border-red-200",
  "October half-term": "bg-orange-100 text-orange-800 border-orange-200",
  "February half-term": "bg-sky-100 text-sky-800 border-sky-200",
  "May half-term": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Bank holiday": "bg-slate-100 text-slate-800 border-slate-200",
  Other: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ChildSummerHolidayRecordPage() {
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "duration" | "child">("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.destinations.some((d) => d.toLowerCase().includes(search.toLowerCase())) ||
        rec.childMemoryHeadline.toLowerCase().includes(search.toLowerCase());
      const matchesPeriod = periodFilter === "all" || rec.holidayPeriod === periodFilter;
      return matchesSearch && matchesPeriod;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "duration") return b.durationDays - a.durationDays;
      if (sortBy === "child") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      return b.reviewDate.localeCompare(a.reviewDate);
    });
    return r;
  }, [search, periodFilter, sortBy]);

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const ytd = records.filter((r) => r.year === currentYear).length;
    const photosKept = records.filter((r) => r.photosTaken).length;
    const childChose = records.filter((r) => r.childChoseDestination).length;
    const totalSpent = records.reduce((acc, r) => acc + r.costSpent, 0);
    return { ytd, photosKept, childChose, totalSpent };
  }, []);

  return (
    <PageShell
      title="Child Summer / Holiday Record"
      subtitle="The annual narrative — trips, places, friends, photos, what worked and what didn't. Child-led memory keeping, distinct from operational holiday planning."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-summer-holiday-record" />
          <PrintButton title="Holiday Records" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm mb-1">
            <Sun className="h-4 w-4" />
            <span>Holidays YTD</span>
          </div>
          <div className="text-2xl font-semibold text-amber-900">{stats.ytd}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-800 text-sm mb-1">
            <Camera className="h-4 w-4" />
            <span>Photos kept</span>
          </div>
          <div className="text-2xl font-semibold text-sky-900">{stats.photosKept}</div>
        </div>
        <div className="rounded-lg border border-pink-200 bg-pink-50 p-4">
          <div className="flex items-center gap-2 text-pink-800 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>Child-chose destination</span>
          </div>
          <div className="text-2xl font-semibold text-pink-900">{stats.childChose}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Total spent</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">£{stats.totalSpent.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, destination or memory..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All periods</SelectItem>
            <SelectItem value="Summer">Summer</SelectItem>
            <SelectItem value="Easter">Easter</SelectItem>
            <SelectItem value="Christmas">Christmas</SelectItem>
            <SelectItem value="October half-term">October half-term</SelectItem>
            <SelectItem value="February half-term">February half-term</SelectItem>
            <SelectItem value="May half-term">May half-term</SelectItem>
            <SelectItem value="Bank holiday">Bank holiday</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="duration">Longest first</SelectItem>
            <SelectItem value="child">Child A→Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-amber-50/40 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.youngPerson)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", periodColour[r.holidayPeriod])}>
                      {r.holidayPeriod}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      {r.year}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-100 text-sky-800 border-sky-200">
                      {r.durationDays} day{r.durationDays === 1 ? "" : "s"}
                    </span>
                    {r.childChoseDestination ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-pink-100 text-pink-800 border-pink-200">
                        Child chose
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-700 italic">&ldquo;{r.childMemoryHeadline}&rdquo;</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.destinations[0]}
                    {r.destinations.length > 1 ? ` +${r.destinations.length - 1} more` : ""}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-amber-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-1">
                        <Star className="h-3 w-3" /> Child memory headline
                      </div>
                      <p className="text-base text-amber-900 font-medium">&ldquo;{r.childMemoryHeadline}&rdquo;</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Destinations</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.destinations.map((d, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full border bg-sky-50 text-sky-800 border-sky-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">With whom</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.withWhom.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-pink-500">·</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Highlights</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.highlights.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <Heart className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Cost & funding</div>
                      <div className="text-sm text-slate-700">
                        <div>
                          <span className="font-semibold">£{r.costSpent.toFixed(2)}</span> spent
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{r.fundingSource}</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Photos
                      </div>
                      {r.photosTaken ? (
                        <div className="text-sm text-slate-700">
                          <div className="font-medium text-emerald-700">Kept</div>
                          {r.photosLocation ? (
                            <div className="text-xs text-slate-500 mt-1">{r.photosLocation}</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No photos kept for this record</div>
                      )}
                    </div>

                    {r.challengesNoted.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">
                          What was harder / what we learned
                        </div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.challengesNoted.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>→</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="rounded-md border border-pink-200 bg-pink-50 p-3">
                      <div className="text-xs font-semibold text-pink-800 uppercase mb-2">Child voice</div>
                      <p className="text-sm text-pink-900 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                      <div className="text-xs text-slate-500 mt-2">
                        Recorded by {getStaffName(r.recordedBy)} · reviewed {r.reviewDate}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Holiday memories are part of a child&rsquo;s life-story and identity. Practice is grounded in Quality
          Standard 6 (Enjoyment & Achievement) and Quality Standard 7 (Health & Wellbeing), the home&rsquo;s
          Statement of Purpose, and Working Together to Safeguard Children 2023. Children&rsquo;s right to leisure,
          play and cultural participation (UNCRC Article 31) and to be heard in matters affecting them (UNCRC
          Article 12) shape every entry — destinations are child-chosen wherever possible, photos are kept with
          consent, and the child&rsquo;s own headline of the memory is recorded in their words.
        </p>
      </div>
    </PageShell>
  );
}
