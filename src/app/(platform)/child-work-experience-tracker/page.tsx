"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Star,
  Award,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkExpRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  type:
    | "Year 10 placement"
    | "Post-16 placement"
    | "Taster day"
    | "Career exploration meeting"
    | "Employer mentor session"
    | "Apprenticeship taster"
    | "Volunteering placement (counts as work exp)"
    | "Vocational course visit"
    | "University taster";
  employer?: string;
  industry: string;
  startDate: string;
  endDate?: string;
  daysHoursTotal: string;
  supervisorName?: string;
  supervisorRole?: string;
  tasksUndertaken: string[];
  skillsBuilt: string[];
  challengesFaced: string[];
  employerFeedback?: string;
  childReflection: string;
  linksToAspirations: string[];
  followUpOpportunity?: string;
  riskAssessmentDone: boolean;
  safeguardingChecked: boolean;
  travelBudgetUsed?: number;
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

const records: WorkExpRecord[] = [
  {
    id: "we_001",
    youngPerson: "yp_jordan",
    recordedDate: d(-45),
    type: "Year 10 placement",
    employer: "Local Junior Football Club — admin office",
    industry: "Sport / community admin",
    startDate: d(-60),
    endDate: d(-57),
    daysHoursTotal: "3 days · ~21 hours",
    supervisorName: "Marie Holdsworth",
    supervisorRole: "Club Administrator",
    tasksUndertaken: [
      "Updating fixture spreadsheets and player registration database",
      "Drafting parent communication emails (reviewed before send)",
      "Phoning referees to confirm weekend bookings",
      "Tidying kit store and stock-checking equipment",
      "Shadowing a safeguarding meeting (with consent of attendees)",
    ],
    skillsBuilt: [
      "Office software (Excel, club CRM)",
      "Professional phone manner",
      "Working to deadlines (weekend fixtures)",
      "Confidentiality awareness",
      "Adult-to-adult communication in workplace",
    ],
    challengesFaced: [
      "Sitting at a desk for long stretches felt restless on day 1",
      "Phone calls to unfamiliar adults felt awkward at first",
    ],
    employerFeedback:
      "Jordan is a credit to the home and the school. Punctual every day, polite, asked good questions and was unafraid of admin tasks most teenagers find dull. We would welcome Jordan back any time and have offered a continued informal mentoring link.",
    childReflection:
      "I thought it would be all on the pitch but it was the office side. Actually I liked it more than I thought. Marie was sound. I learned that running a club is mostly emails and spreadsheets, which I never knew.",
    linksToAspirations: [
      "Long-term aspiration: sports coaching / club management",
      "Already coaching under-9s (see Volunteering & Charity tracker)",
      "Considering Sports Coaching BTEC at college",
    ],
    followUpOpportunity:
      "Marie offered Jordan a paid Saturday admin shift once Jordan turns 16 — Jordan considering it alongside coaching role.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    travelBudgetUsed: 18,
    childVoice:
      "I was nervous on the Monday. Marie made me a cup of tea and showed me where the biscuits were. After that it was fine.",
    staffObservation:
      "Excellent placement match — leveraged Jordan's existing club connection. Real-world workplace experience without the identity disruption of an unfamiliar industry. Continuity with the volunteer coaching role builds a coherent CV narrative. Pathway Plan link recorded.",
    reviewDate: d(45),
    keyWorker: "staff_anna",
  },
  {
    id: "we_002",
    youngPerson: "yp_jordan",
    recordedDate: d(-14),
    type: "Employer mentor session",
    employer: "Local mosque — committee chair (informal mentor)",
    industry: "Community / faith-based leadership",
    startDate: d(-14),
    daysHoursTotal: "1 session · 90 minutes",
    supervisorName: "Yusuf Rahman",
    supervisorRole: "Mosque Committee Chair (also runs a wholesale business)",
    tasksUndertaken: [
      "Discussing pathways into community leadership and faith-rooted careers",
      "Reviewing Jordan's draft college personal statement",
      "Hearing about Yusuf's own career: warehouse worker → business owner",
    ],
    skillsBuilt: [
      "Receiving constructive feedback from a respected adult",
      "Articulating own goals to a non-staff adult",
      "Networking — basic professional small talk",
    ],
    challengesFaced: [
      "Hearing critical feedback on personal statement was hard at first",
    ],
    employerFeedback:
      "Jordan is a thoughtful young man with strong values and a clear sense of community. I have offered ongoing informal mentoring and would write a reference for any college or apprenticeship application.",
    childReflection:
      "He didn't sugar-coat the personal statement, said it sounded like everyone else's. Made me think harder. Felt like a proper grown-up conversation.",
    linksToAspirations: [
      "Building Jordan's adult mentor network beyond the home (chosen-family principle)",
      "Faith-rooted identity anchor — links to mosque volunteering",
      "Models a non-graduate career success story",
    ],
    followUpOpportunity:
      "Yusuf has invited Jordan to shadow him at his business for half a day during half-term.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    childVoice: "I felt taller walking out of there.",
    staffObservation:
      "Building a community of trusted adults around Jordan is one of the most protective factors we can engineer. Yusuf is a long-known, safeguarding-checked figure. Mentor relationship logged formally.",
    reviewDate: d(76),
    keyWorker: "staff_anna",
  },
  {
    id: "we_003",
    youngPerson: "yp_alex",
    recordedDate: d(-30),
    type: "Career exploration meeting",
    employer: "Local Authority Children's Services",
    industry: "Social work / public sector",
    startDate: d(-30),
    daysHoursTotal: "1 meeting · 60 minutes",
    supervisorName: "Kerry Ahmed",
    supervisorRole: "Senior Social Worker (with consent — not Alex's own SW)",
    tasksUndertaken: [
      "Q&A about social work as a career",
      "Discussion of routes in: degree, apprenticeship, Step Up to Social Work",
      "Honest conversation about what social workers find hard",
    ],
    skillsBuilt: [
      "Asking professional questions",
      "Reflecting on own care experience as potential strength",
      "Career research literacy",
    ],
    challengesFaced: [
      "Some of the conversation was emotionally heavy — went back to own SW history",
    ],
    employerFeedback:
      "Alex asked the kind of questions a third-year social work student asks. Lived experience combined with intellectual curiosity is exactly what the profession needs. Happy to be a contact point as Alex explores this.",
    childReflection:
      "I asked her if she ever feels like she got it wrong with a kid. She said yes, every week. That was the most honest answer any adult has ever given me. I think I could do this job.",
    linksToAspirations: [
      "Emerging interest in social work career",
      "Lived experience as professional asset (rather than burden) — reframe is significant",
      "Links to peer advocacy work in volunteering tracker",
    ],
    followUpOpportunity:
      "Kerry has offered to facilitate a half-day shadow placement at a Children in Care team meeting (with appropriate consent and supervision) once Alex is 17.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    childVoice:
      "Imagine. Me being the social worker. That's a head-spin.",
    staffObservation:
      "Significant career exploration moment — the reframe of care experience as professional strength is therapeutically and developmentally important. Anna debriefed afterwards as conversation surfaced own care history. Keeping watch but not pathologising.",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "we_004",
    youngPerson: "yp_alex",
    recordedDate: d(-90),
    type: "University taster",
    employer: "Local university — LGBTQ+ Studies open day",
    industry: "Higher education / academia",
    startDate: d(-90),
    daysHoursTotal: "1 day · 6 hours",
    supervisorName: "Dr. Priya Choudhury",
    supervisorRole: "Senior Lecturer, Gender & Sexuality Studies",
    tasksUndertaken: [
      "Sample lecture: 'Queer history and the welfare state'",
      "Q&A with current undergraduates",
      "Campus tour and library visit",
      "Lunch with the LGBTQ+ student society",
    ],
    skillsBuilt: [
      "University-level academic discourse exposure",
      "Confidence in a higher-education environment",
      "Recognising self as a credible future student",
    ],
    challengesFaced: [
      "Imposter feelings on arrival — felt out of place",
      "Some content was emotionally activating (welfare state critique)",
    ],
    employerFeedback:
      "Alex contributed a question in the sample lecture that the lecturer described as 'sharper than most of my second-years.' Open invitation to attend further events.",
    childReflection:
      "I walked into that lecture theatre and thought 'I don't belong here'. By the end I thought 'maybe I do'. The students were normal — some had care experience. I'm not the only one.",
    linksToAspirations: [
      "First serious consideration of university route",
      "Identity-affirming academic field",
      "Care leaver bursary route to be explored",
    ],
    followUpOpportunity:
      "On university mailing list. Anna to follow up re: care-experienced student support package and bursary at this institution.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    travelBudgetUsed: 24,
    childVoice:
      "I bought a hoodie from the campus shop. Wore it the next day. Statement.",
    staffObservation:
      "Landmark exposure for Alex. The hoodie is significant — claiming the identity 'future student'. This shifts Alex's possible-self horizon. Pathway Plan to be updated with 'higher education considered'.",
    reviewDate: d(0),
    keyWorker: "staff_anna",
  },
  {
    id: "we_005",
    youngPerson: "yp_alex",
    recordedDate: d(-21),
    type: "Post-16 placement",
    employer: "Page Turners Independent Bookshop",
    industry: "Retail / arts & literature",
    startDate: d(-26),
    endDate: d(-22),
    daysHoursTotal: "5 days · ~30 hours",
    supervisorName: "Hannah Whitaker",
    supervisorRole: "Bookshop Owner",
    tasksUndertaken: [
      "Shelving and stock rotation",
      "Till operation (with supervision)",
      "Customer recommendations on the shop floor",
      "Helping curate the LGBTQ+ display table for Pride Month",
      "Writing two short staff-pick recommendation cards",
    ],
    skillsBuilt: [
      "Customer service",
      "Cash handling and till accuracy",
      "Written recommendation craft",
      "Working a full retail day",
      "Receiving criticism from a customer with composure",
    ],
    challengesFaced: [
      "One difficult customer was rude — Alex stayed calm, debriefed with Hannah after",
      "Standing for long shifts was tiring",
    ],
    employerFeedback:
      "Alex was insightful, well-read and warm with customers. The Pride display drew compliments and increased sales. Both staff-pick cards remained on the shelves after the placement ended. We would offer Alex a Saturday job if a vacancy arises.",
    childReflection:
      "Two people bought the book I recommended. Two strangers. Because of me. That's the best feeling. Better than getting an A.",
    linksToAspirations: [
      "Consolidates interest in literature / academic English",
      "Demonstrates retail employability — fallback whilst studying",
      "Pride display links creative output to identity",
    ],
    followUpOpportunity: "Saturday job possibility flagged for September.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    travelBudgetUsed: 12,
    childVoice:
      "Hannah let me put a Sarah Waters book on the staff picks. Tingeing of the Tide. I wrote 'queer love story that won't pity you'. She left it up.",
    staffObservation:
      "Excellent micro-placement. Independent bookshop is the right scale for Alex's first paid-style work — high-trust, low-volume, identity-respecting. Hannah is a known local figure and was carefully briefed. Strong outcome.",
    reviewDate: d(50),
    keyWorker: "staff_anna",
  },
  {
    id: "we_006",
    youngPerson: "yp_casey",
    recordedDate: d(-28),
    type: "Taster day",
    employer: "Bramble Lane Veterinary Practice — half-day shadow",
    industry: "Veterinary / animal care",
    startDate: d(-28),
    daysHoursTotal: "Half day · 3.5 hours",
    supervisorName: "Emma Sutcliffe",
    supervisorRole: "Veterinary Nurse (Anna's friend — known adult)",
    tasksUndertaken: [
      "Observing morning consultations (with owner consent)",
      "Watching a routine vaccination and a nail trim",
      "Tour of kennels and surgical prep area",
      "Conversation about routes in: vet nursing apprenticeship vs vet science degree",
    ],
    skillsBuilt: [
      "Clinical observation",
      "Animal-handling environment exposure",
      "Career-route literacy (apprenticeship vs degree)",
      "Holding composure when an upset owner arrived with a poorly cat",
    ],
    challengesFaced: [
      "An older dog was put to sleep during the morning — Emma took Casey aside afterwards to talk it through",
      "Surgical area smell was strong",
    ],
    employerFeedback:
      "Casey was respectful, calm, and asked thoughtful questions about animal welfare. The euthanasia happened during the visit and Casey handled it with maturity beyond her years. Welcome back any time.",
    childReflection:
      "The dog that got put to sleep — I thought I'd cry but I didn't. Emma said it's a kindness sometimes. I want to be the person who can give that kindness. I want to be a vet nurse maybe, not a vet. The nurses do more of the actual animal stuff.",
    linksToAspirations: [
      "Vet aspiration refining → veterinary nursing as primary route",
      "Already volunteering at RSPCA shelter (see volunteering tracker)",
      "Vet nursing apprenticeship is achievable from Level 2/3 — rather than vet science requiring A*A*A",
    ],
    followUpOpportunity:
      "Emma offered a longer shadow placement during summer holidays. RSPCA volunteering continues.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    travelBudgetUsed: 8,
    childVoice:
      "Emma was so calm with that dog at the end. She just said good boy and stroked his ear. I want to be that.",
    staffObservation:
      "Critical career-clarifying moment. The shift from 'vet' (highly competitive, A-level dependent) to 'veterinary nurse' (apprenticeship route, equally meaningful work) is realistic and protective. Emma was excellent at framing the euthanasia experience. Identity-affirming.",
    reviewDate: d(62),
    keyWorker: "staff_anna",
  },
  {
    id: "we_007",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    type: "Career exploration meeting",
    employer: "School careers adviser (in-school session)",
    industry: "Careers guidance",
    startDate: d(-7),
    daysHoursTotal: "1 meeting · 45 minutes",
    supervisorName: "Mr. Davies",
    supervisorRole: "Careers Lead, Casey's school",
    tasksUndertaken: [
      "Reviewing Casey's interest profile",
      "Mapping options: GCSE choices → vet nursing route",
      "Looking at local college Animal Care Level 2 course",
    ],
    skillsBuilt: [
      "Self-assessment of interests and strengths",
      "Understanding qualifications pathways",
      "Asking targeted questions about routes",
    ],
    challengesFaced: [
      "Felt overwhelmed by amount of choice at first",
    ],
    employerFeedback:
      "Casey arrived prepared, having reflected on the vet practice taster. Conversation was unusually focused for a Year 9 student.",
    childReflection:
      "Mr. Davies showed me the college Animal Care course. You start at 14. I might be able to do it next year as part of school.",
    linksToAspirations: [
      "Animal Care Level 2 at local college — viable from Year 10",
      "Coheres with vet nurse aspiration and RSPCA volunteering",
      "First step on a clear apprenticeship pipeline",
    ],
    followUpOpportunity:
      "Casey to attend the college open evening with Anna next month.",
    riskAssessmentDone: true,
    safeguardingChecked: true,
    childVoice:
      "It's not a dream anymore. It's a plan.",
    staffObservation:
      "The phrase 'it's a plan' is what we are working toward for every child in care. Strong continuity with the vet practice taster. Gatsby Benchmark 8 (personal guidance) evidenced. Linking to Aspirations tracker.",
    reviewDate: d(30),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<WorkExpRecord>[] = [
  { header: "Young Person", accessor: (r: WorkExpRecord) => getYPName(r.youngPerson) },
  { header: "Type", accessor: (r: WorkExpRecord) => r.type },
  { header: "Employer", accessor: (r: WorkExpRecord) => r.employer ?? "—" },
  { header: "Industry", accessor: (r: WorkExpRecord) => r.industry },
  { header: "Start", accessor: (r: WorkExpRecord) => r.startDate },
  { header: "End", accessor: (r: WorkExpRecord) => r.endDate ?? "—" },
  { header: "Days/Hours", accessor: (r: WorkExpRecord) => r.daysHoursTotal },
  { header: "Supervisor", accessor: (r: WorkExpRecord) => r.supervisorName ?? "—" },
  { header: "Supervisor Role", accessor: (r: WorkExpRecord) => r.supervisorRole ?? "—" },
  { header: "Tasks", accessor: (r: WorkExpRecord) => r.tasksUndertaken.join("; ") },
  { header: "Skills Built", accessor: (r: WorkExpRecord) => r.skillsBuilt.join("; ") },
  { header: "Challenges", accessor: (r: WorkExpRecord) => r.challengesFaced.join("; ") },
  { header: "Employer Feedback", accessor: (r: WorkExpRecord) => r.employerFeedback ?? "—" },
  { header: "Child Reflection", accessor: (r: WorkExpRecord) => r.childReflection },
  { header: "Links to Aspirations", accessor: (r: WorkExpRecord) => r.linksToAspirations.join("; ") },
  { header: "Follow-up", accessor: (r: WorkExpRecord) => r.followUpOpportunity ?? "—" },
  { header: "Risk Assessed", accessor: (r: WorkExpRecord) => (r.riskAssessmentDone ? "Yes" : "No") },
  { header: "Safeguarding Checked", accessor: (r: WorkExpRecord) => (r.safeguardingChecked ? "Yes" : "No") },
  { header: "Travel Budget", accessor: (r: WorkExpRecord) => (r.travelBudgetUsed != null ? `£${r.travelBudgetUsed.toFixed(2)}` : "—") },
  { header: "Child Voice", accessor: (r: WorkExpRecord) => r.childVoice },
  { header: "Staff Observation", accessor: (r: WorkExpRecord) => r.staffObservation },
  { header: "Review", accessor: (r: WorkExpRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: WorkExpRecord) => getStaffName(r.keyWorker) },
];

const typeColour: Record<WorkExpRecord["type"], string> = {
  "Year 10 placement": "bg-sky-100 text-sky-800 border-sky-200",
  "Post-16 placement": "bg-blue-100 text-blue-800 border-blue-200",
  "Taster day": "bg-amber-100 text-amber-800 border-amber-200",
  "Career exploration meeting": "bg-violet-100 text-violet-800 border-violet-200",
  "Employer mentor session": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Apprenticeship taster": "bg-teal-100 text-teal-800 border-teal-200",
  "Volunteering placement (counts as work exp)": "bg-pink-100 text-pink-800 border-pink-200",
  "Vocational course visit": "bg-orange-100 text-orange-800 border-orange-200",
  "University taster": "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ChildWorkExperienceTrackerPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "type">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        (rec.employer ?? "").toLowerCase().includes(search.toLowerCase()) ||
        rec.industry.toLowerCase().includes(search.toLowerCase()) ||
        rec.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || rec.type === typeFilter;
      return matchesSearch && matchesType;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "type") return a.type.localeCompare(b.type);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sixtyAgo = d(-60);
    const activeOrRecent = records.filter(
      (r) =>
        (r.endDate ?? r.startDate) >= sixtyAgo ||
        (r.startDate <= today && (r.endDate == null || r.endDate >= today)),
    ).length;
    const totalDaysHours = records.map((r) => r.daysHoursTotal).join(" · ");
    const mentorConnections = records.filter(
      (r) => r.type === "Employer mentor session" || r.followUpOpportunity != null,
    ).length;
    const ninety = d(90);
    const reviewsDue = records.filter((r) => r.reviewDate <= ninety && r.reviewDate >= today).length;
    return { activeOrRecent, totalDaysHours, mentorConnections, reviewsDue };
  }, []);

  return (
    <PageShell
      title="Work Experience & Career Exposure"
      subtitle="Per-child work experience and career exposure — Year 10 placements, post-16 work experience, taster days, career exploration meetings, employer mentors. Children in care need broader networks and richer careers exposure than peers — this tracker evidences both. Skills, employer feedback, child reflection and links to aspirations are all surfaced."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-work-experience-tracker" />
          <PrintButton title="Work Experience & Career Exposure" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Briefcase className="h-4 w-4" />
            <span>Active / recent placements</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.activeOrRecent}</div>
          <div className="text-xs text-slate-500 mt-1">Last 60 days or in progress</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Total exposure (records)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{records.length}</div>
          <div className="text-xs text-slate-500 mt-1">Across all children</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Star className="h-4 w-4" />
            <span>Employer mentor connections</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.mentorConnections}</div>
          <div className="text-xs text-slate-500 mt-1">Including follow-up offers</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Award className="h-4 w-4" />
            <span>Reviews due (90d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewsDue}</div>
          <div className="text-xs text-slate-500 mt-1">Plan check-ins coming up</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, employer, industry, type..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Year 10 placement">Year 10 placement</SelectItem>
            <SelectItem value="Post-16 placement">Post-16 placement</SelectItem>
            <SelectItem value="Taster day">Taster day</SelectItem>
            <SelectItem value="Career exploration meeting">Career exploration meeting</SelectItem>
            <SelectItem value="Employer mentor session">Employer mentor session</SelectItem>
            <SelectItem value="Apprenticeship taster">Apprenticeship taster</SelectItem>
            <SelectItem value="Volunteering placement (counts as work exp)">Volunteering (counts)</SelectItem>
            <SelectItem value="Vocational course visit">Vocational course visit</SelectItem>
            <SelectItem value="University taster">University taster</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A→Z</SelectItem>
            <SelectItem value="type">Type</SelectItem>
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
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.youngPerson)}</span>
                    <span className="text-slate-700">{r.employer ?? r.industry}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", typeColour[r.type])}>
                      {r.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                      {r.industry}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                      {r.daysHoursTotal}
                    </span>
                    {r.followUpOpportunity ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Follow-up offered
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    {r.startDate}
                    {r.endDate ? ` → ${r.endDate}` : ""} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Placement / session details</div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div><span className="text-slate-500">Employer:</span> {r.employer ?? "—"}</div>
                        <div><span className="text-slate-500">Industry:</span> {r.industry}</div>
                        <div><span className="text-slate-500">Supervisor:</span> {r.supervisorName ?? "—"}</div>
                        <div><span className="text-slate-500">Role:</span> {r.supervisorRole ?? "—"}</div>
                        <div><span className="text-slate-500">Started:</span> {r.startDate}</div>
                        <div><span className="text-slate-500">Ended:</span> {r.endDate ?? "—"}</div>
                        <div><span className="text-slate-500">Days/hours:</span> {r.daysHoursTotal}</div>
                        <div><span className="text-slate-500">Travel budget:</span> {r.travelBudgetUsed != null ? `£${r.travelBudgetUsed.toFixed(2)}` : "—"}</div>
                        <div><span className="text-slate-500">Risk assessed:</span> {r.riskAssessmentDone ? "Yes" : "No"}</div>
                        <div><span className="text-slate-500">Safeguarding checked:</span> {r.safeguardingChecked ? "Yes" : "No"}</div>
                        <div><span className="text-slate-500">Review:</span> {r.reviewDate}</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                      <div className="text-xs font-semibold text-sky-700 uppercase mb-2">Tasks undertaken</div>
                      <ul className="text-sm text-sky-900 space-y-1">
                        {r.tasksUndertaken.map((t, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{t}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Skills built</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.skillsBuilt.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>+</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-rose-700 uppercase mb-2">Challenges faced</div>
                      <ul className="text-sm text-rose-900 space-y-1">
                        {r.challengesFaced.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>

                    {r.employerFeedback ? (
                      <div className="rounded-md border-2 border-amber-300 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Employer feedback</div>
                        <p className="text-sm text-amber-900">&ldquo;{r.employerFeedback}&rdquo;</p>
                      </div>
                    ) : null}

                    <div className="rounded-md border border-violet-200 bg-violet-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-violet-700 uppercase mb-2">Child reflection</div>
                      <p className="text-sm text-violet-900 italic">&ldquo;{r.childReflection}&rdquo;</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Links to aspirations</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.linksToAspirations.map((s, i) => (
                          <li key={i} className="flex gap-2"><span>→</span><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Follow-up opportunity</div>
                      <p className="text-sm text-slate-700">{r.followUpOpportunity ?? "None recorded yet"}</p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Work experience and career exposure are protective factors that reduce care leaver NEET risk.
          Practice is grounded in Pathway Plan duty (Care Leavers Regulations 2010) for children 16+,
          Quality Standard 5 (Education) and Quality Standard 6 (Enjoyment & Achievement),
          the Gatsby Benchmarks for career education (especially 5: encounters with employers and 6: experience of workplaces),
          HSE Young Workers guidance on workplace risk, KCSIE 2024 safeguarding for off-site activity,
          and UNCRC Articles 28 (right to education) and 29 (development of personality and talents).
          Every placement is risk-assessed, the host setting safeguarding-checked, travel costs covered
          from the home budget, and child reflection captured alongside employer feedback.
        </p>
      </div>
    </PageShell>
  );
}
