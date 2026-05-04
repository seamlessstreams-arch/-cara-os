"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  PoundSterling,
  ShieldCheck,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MoneyRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  skillCategory:
    | "Weekly budget"
    | "Bank app fluency"
    | "Comparison shopping"
    | "Reading contracts"
    | "Scam recognition"
    | "Cashflow planning"
    | "Payslip reading"
    | "Debt awareness"
    | "Tax & NI literacy"
    | "Pension awareness"
    | "Buy-now-pay-later (BNPL) risks"
    | "Universal Credit / benefits literacy";
  competency: "Not yet introduced" | "Aware" | "Did with help" | "Did independently" | "Confident";
  practicalExamples: string[];
  realWorldApplication: string[];
  toolsUsed: string[];
  challengesFaced: string[];
  childMoneyValuesNotes?: string;
  childVoice: string;
  staffObservation: string;
  nextStep: string;
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const records: MoneyRecord[] = [
  {
    id: "mm_001",
    youngPerson: "yp_jordan",
    recordedDate: d(-7),
    skillCategory: "Bank app fluency",
    competency: "Confident",
    practicalExamples: [
      "Monzo split pots: Spend / Save / Mosque charity",
      "Sets up direct debit for football phone tracker app",
      "Reviews monthly summary in-app, knows top spending categories",
      "Uses round-up feature for savings",
    ],
    realWorldApplication: [
      "Football coaching wages auto-split into pots on payday",
      "Stays under spending limits set by self",
      "Used Monzo dispute feature successfully when charged twice for a takeaway",
    ],
    toolsUsed: ["Monzo app", "Notification settings", "Pots feature", "In-app summary"],
    challengesFaced: ["Initial confusion about debit card vs Apple Pay limit — Anna explained"],
    childMoneyValuesNotes:
      "Charity (Zakat) automatic from wages — Jordan's faith shapes his money values strongly. Saves 20% of wages by choice.",
    childVoice:
      "I look at the pots and I feel calm. Mum couldn't ever do this. I want to teach my brother when I see him.",
    staffObservation:
      "Jordan's banking confidence is well above peer average. Faith-anchored values give structure. Strong foundation for leaving care.",
    nextStep: "Open second account for football wages to keep tax-trackable separately (Monzo Joint or separate)",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "mm_002",
    youngPerson: "yp_jordan",
    recordedDate: d(-14),
    skillCategory: "Payslip reading",
    competency: "Aware",
    practicalExamples: [
      "Anna walked through first payslip from football coaching",
      "Identified gross pay, PAYE deduction, NI contribution",
      "Discussed personal allowance (£12,570) — Jordan currently below threshold",
      "Discussed why HMRC tax code 1257L applies",
    ],
    realWorldApplication: [
      "Knows to check tax code on first payslip of new tax year",
      "Knows to query PAYE if deductions look wrong",
    ],
    toolsUsed: ["Actual payslips from football club", "HMRC personal tax account (signed up with Anna)"],
    challengesFaced: ["Tax code logic still confusing — will revisit after first April payroll"],
    childVoice: "I get why mum always swore at HMRC now. The numbers add up but you have to look.",
    staffObservation:
      "Foundational understanding established. Will deepen as Jordan's earnings grow. HMRC personal tax account set up — important step.",
    nextStep: "Review again after April payroll with new tax year personal allowance",
    reviewDate: d(90),
    keyWorker: "staff_anna",
  },
  {
    id: "mm_003",
    youngPerson: "yp_jordan",
    recordedDate: d(-30),
    skillCategory: "Weekly budget",
    competency: "Did independently",
    practicalExamples: [
      "Splits coaching wages: 60% spend, 20% save, 10% Zakat, 10% future driving lessons",
      "Tracks spend mid-week and adjusts",
      "Built spreadsheet (Google Sheets) showing 3 months back",
    ],
    realWorldApplication: [
      "Successfully saved £540 over 3 months for new boots",
      "Adjusted spend the week of Eid (extra clothes / gifts)",
    ],
    toolsUsed: ["Google Sheets", "Monzo pots", "Anna as occasional sounding board"],
    challengesFaced: ["Tempted by FIFA points — set 'cooling-off' rule (24h before purchase)"],
    childVoice: "I'm in charge of my money. That feels good.",
    staffObservation: "Excellent independence. Cooling-off rule self-imposed — strong impulse-control work.",
    nextStep: "Move from confident-with-help to fully independent — Anna stepping back",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "mm_004",
    youngPerson: "yp_alex",
    recordedDate: d(-21),
    skillCategory: "Buy-now-pay-later (BNPL) risks",
    competency: "Aware",
    practicalExamples: [
      "Anna explained how Klarna and Clearpay work — split payments",
      "Discussed credit-file impact (Klarna now reporting to credit agencies 2024+)",
      "Walked through real example of someone Alex knows who got into £400 of BNPL debt",
      "Showed FCA scam warning page on BNPL providers",
    ],
    realWorldApplication: [
      "Has chosen NOT to use BNPL for new boxing gloves — saved up instead",
      "Knows to check terms before signing up to any 'pay in 3' option",
    ],
    toolsUsed: ["MaPS Money Helper site", "Citizens Advice BNPL guide", "Real-world peer example"],
    challengesFaced: ["Tempted by Klarna at ASOS — proud of saying no"],
    childMoneyValuesNotes: "Alex is risk-aware, having seen mum's debt cycle — strong avoidance of BNPL.",
    childVoice:
      "Klarna seems easy until it isn't. I saw what it did to a girl in my year. I'd rather wait two weeks.",
    staffObservation:
      "Mature risk awareness for age 15. Lived experience informs decision-making. Continue to model strong examples.",
    nextStep: "Comparison shopping skill — building on this risk awareness",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "mm_005",
    youngPerson: "yp_alex",
    recordedDate: d(-45),
    skillCategory: "Comparison shopping",
    competency: "Confident",
    practicalExamples: [
      "Always checks Monzo per-shop spend trend",
      "Uses honey extension for online shopping",
      "Compares unit prices in supermarket (per kg / per ml)",
      "Uses MoneySavingExpert checklist before any subscription",
    ],
    realWorldApplication: [
      "Saved £28 on Christmas shopping by waiting for Black Friday",
      "Cancelled Spotify subscription after exam to save £11/month for 3 months",
    ],
    toolsUsed: ["Monzo", "Honey", "MoneySavingExpert", "Trolley.co.uk supermarket compare"],
    challengesFaced: [],
    childVoice: "Knowing the unit price is a superpower.",
    staffObservation: "Confident, methodical, evidence-based shopper. Could teach peers.",
    nextStep: "Reading contracts — building on this analytical strength",
    reviewDate: d(90),
    keyWorker: "staff_anna",
  },
  {
    id: "mm_006",
    youngPerson: "yp_casey",
    recordedDate: d(-30),
    skillCategory: "Weekly budget",
    competency: "Aware",
    practicalExamples: [
      "Counts pocket money each Friday with Anna",
      "Splits into spend / save jars (visual)",
      "Uses cash with prompts at the local shop",
    ],
    realWorldApplication: [
      "Saved £18 over 6 weeks for Sylvanian Family figurine",
      "Realised at week 4 she'd over-spent — adjusted with Anna",
    ],
    toolsUsed: ["Visual jars", "Cash (preferred over card at age 12)", "Calendar grid for weekly tracking"],
    challengesFaced: ["Working memory difficulty — uses jars + calendar grid as external memory aid"],
    childMoneyValuesNotes:
      "Saved up for Sylvanian Family figurine independently — first big purchase by saving. Pride visible.",
    childVoice: "I waited and waited. I bought it. I felt like a grown-up.",
    staffObservation:
      "Foundational skill solid. Jars and calendar grid are working accommodations for working memory. Will progress to bank app at 13 if Casey ready.",
    nextStep: "Introduction to bank app concept (NatWest under-12 already set up)",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },
  {
    id: "mm_007",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    skillCategory: "Scam recognition",
    competency: "Aware",
    practicalExamples: [
      "Spotted a fake 'Roblox free Robux' email — flagged to Anna",
      "Visual examples of phishing shown in 1:1",
      "Knows: never click strange links, ask Anna if unsure",
      "Discussed why scammers target young people on Roblox/Animal Crossing",
    ],
    realWorldApplication: [
      "Reported a suspicious DM in Roblox to platform with Anna",
      "Knows to never share account password",
    ],
    toolsUsed: ["Visual examples", "FCA ScamSmart kids info", "1:1 with Anna"],
    challengesFaced: [],
    childVoice: "If it's free Robux it's a scam.",
    staffObservation: "Casey's developmental literacy here is solid. Will revisit at 13 with phone-related scams.",
    nextStep: "Phone-based scam awareness when Casey gets first smartphone",
    reviewDate: d(180),
    keyWorker: "staff_anna",
  },
];

const exportCols: ExportColumn<MoneyRecord>[] = [
  { header: "Young Person", accessor: (r: MoneyRecord) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: MoneyRecord) => r.recordedDate },
  { header: "Skill Category", accessor: (r: MoneyRecord) => r.skillCategory },
  { header: "Competency", accessor: (r: MoneyRecord) => r.competency },
  { header: "Examples", accessor: (r: MoneyRecord) => r.practicalExamples.join("; ") },
  { header: "Real-world", accessor: (r: MoneyRecord) => r.realWorldApplication.join("; ") },
  { header: "Tools", accessor: (r: MoneyRecord) => r.toolsUsed.join("; ") },
  { header: "Challenges", accessor: (r: MoneyRecord) => r.challengesFaced.join("; ") },
  { header: "Money Values", accessor: (r: MoneyRecord) => r.childMoneyValuesNotes ?? "—" },
  { header: "Child Voice", accessor: (r: MoneyRecord) => r.childVoice },
  { header: "Next Step", accessor: (r: MoneyRecord) => r.nextStep },
  { header: "Review", accessor: (r: MoneyRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: MoneyRecord) => getStaffName(r.keyWorker) },
];

const competencyColour: Record<MoneyRecord["competency"], string> = {
  "Not yet introduced": "bg-slate-100 text-slate-800 border-slate-200",
  Aware: "bg-blue-100 text-blue-800 border-blue-200",
  "Did with help": "bg-sky-100 text-sky-800 border-sky-200",
  "Did independently": "bg-emerald-100 text-emerald-800 border-emerald-200",
  Confident: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function ChildMoneyManagementBudgetingPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "category" | "competency">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.youngPerson).toLowerCase().includes(search.toLowerCase()) ||
        rec.skillCategory.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || rec.skillCategory === categoryFilter;
      return matchesSearch && matchesCat;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
      if (sortBy === "category") return a.skillCategory.localeCompare(b.skillCategory);
      if (sortBy === "competency") return a.competency.localeCompare(b.competency);
      return b.recordedDate.localeCompare(a.recordedDate);
    });
    return r;
  }, [search, categoryFilter, sortBy]);

  const stats = useMemo(() => {
    const skillsTracked = records.length;
    const confidentCount = records.filter((r) => r.competency === "Confident" || r.competency === "Did independently").length;
    const reviewsDue = records.filter((r) => r.reviewDate <= d(60)).length;
    const realWorldApps = records.reduce((acc, r) => acc + r.realWorldApplication.length, 0);
    return { skillsTracked, confidentCount, reviewsDue, realWorldApps };
  }, []);

  return (
    <PageShell
      title="Money Management & Budgeting"
      subtitle="Per-child practical money management — bank app fluency, weekly budget, payslip reading, scam recognition, BNPL risks, comparison shopping, debt awareness. Critical preparation for leaving care."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="child-money-management-budgeting" />
          <PrintButton title="Money Management & Budgeting" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Skills tracked</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.skillsTracked}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Confident / independent</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.confidentCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>Real-world applications</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.realWorldApps}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Reviews due (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.reviewsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person or skill..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Skill category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            <SelectItem value="Weekly budget">Weekly budget</SelectItem>
            <SelectItem value="Bank app fluency">Bank app fluency</SelectItem>
            <SelectItem value="Comparison shopping">Comparison shopping</SelectItem>
            <SelectItem value="Reading contracts">Reading contracts</SelectItem>
            <SelectItem value="Scam recognition">Scam recognition</SelectItem>
            <SelectItem value="Cashflow planning">Cashflow planning</SelectItem>
            <SelectItem value="Payslip reading">Payslip reading</SelectItem>
            <SelectItem value="Debt awareness">Debt awareness</SelectItem>
            <SelectItem value="Tax & NI literacy">Tax & NI literacy</SelectItem>
            <SelectItem value="Pension awareness">Pension awareness</SelectItem>
            <SelectItem value="Buy-now-pay-later (BNPL) risks">BNPL risks</SelectItem>
            <SelectItem value="Universal Credit / benefits literacy">UC / benefits</SelectItem>
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
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="competency">Competency</SelectItem>
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
                    <span className="text-slate-700">{r.skillCategory}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", competencyColour[r.competency])}>
                      {r.competency}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.recordedDate} · Review {r.reviewDate} · {getStaffName(r.keyWorker)}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child Voice</div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staffObservation}</p>
                    </div>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Practical examples</div>
                      <ul className="text-sm text-emerald-900 space-y-1">
                        {r.practicalExamples.map((p, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                      <div className="text-xs font-semibold text-blue-800 uppercase mb-2">Real-world application</div>
                      <ul className="text-sm text-blue-900 space-y-1">
                        {r.realWorldApplication.map((p, i) => (
                          <li key={i} className="flex gap-2"><span>·</span><span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                    {r.toolsUsed.length ? (
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Tools used</div>
                        <div className="flex flex-wrap gap-1.5">
                          {r.toolsUsed.map((t, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full border bg-violet-100 text-violet-800 border-violet-200">{t}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {r.challengesFaced.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Challenges</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.challengesFaced.map((c, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{c}</span></li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.childMoneyValuesNotes ? (
                      <div className="rounded-md border border-pink-200 bg-pink-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-pink-700 uppercase mb-2">Child money values</div>
                        <p className="text-sm text-pink-900">{r.childMoneyValuesNotes}</p>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-sky-800 uppercase mb-2">Next step</div>
                      <p className="text-sm text-sky-900">{r.nextStep}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Practice is grounded in the Pathway Plan duty (Care Leavers (England) Regulations 2010), Quality Standard 6
          (Enjoyment & Achievement), Money & Pensions Service (MaPS) financial education guidance, FCA ScamSmart,
          HMRC tax literacy resources, and UNCRC Articles 12 (voice) and 28 (education). Critical preparation for
          leaving care: financial literacy is one of the strongest protective factors against post-care debt and
          exploitation.
        </p>
      </div>
    </PageShell>
  );
}
