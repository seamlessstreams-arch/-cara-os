"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName }    from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type Proficiency = "not_started" | "emerging" | "developing" | "competent" | "independent";
type Category = "cooking" | "budgeting" | "hygiene" | "laundry" | "travel" | "health" | "communication" | "safety" | "digital" | "housing";

interface Skill {
  id: string;
  name: string;
  category: Category;
  proficiency: Proficiency;
  targetDate: string;
  lastAssessed: string;
  assessedBy: string;
  evidence: string;
  nextStep: string;
}

interface IndependenceRecord {
  id: string;
  youngPersonId: string;
  reviewDate: string;
  reviewer: string;
  overallReadiness: number; // 1-5
  skills: Skill[];
  strengths: string[];
  areasForDevelopment: string[];
  childView: string;
  pathwayNotes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: IndependenceRecord[] = [
  {
    id: "is1", youngPersonId: "yp_alex", reviewDate: d(-14), reviewer: "staff_anna",
    overallReadiness: 3,
    skills: [
      { id: "s1", name: "Prepare a simple meal", category: "cooking", proficiency: "developing", targetDate: d(30), lastAssessed: d(-14), assessedBy: "staff_anna", evidence: "Alex made beans on toast independently; needs support with using the hob safely for frying.", nextStep: "Practice making a stir-fry with staff supervision." },
      { id: "s2", name: "Manage weekly budget", category: "budgeting", proficiency: "emerging", targetDate: d(60), lastAssessed: d(-14), assessedBy: "staff_anna", evidence: "Understands concept of income vs spending; struggled to plan a weekly shop within budget during practice session.", nextStep: "Use budgeting app to track pocket money for 4 weeks." },
      { id: "s3", name: "Personal hygiene routine", category: "hygiene", proficiency: "competent", targetDate: d(0), lastAssessed: d(-14), assessedBy: "staff_anna", evidence: "Maintains daily routine consistently without prompting. Manages own toiletries and knows when to repurchase.", nextStep: "Discuss GP registration and booking appointments independently." },
      { id: "s4", name: "Use public transport", category: "travel", proficiency: "developing", targetDate: d(45), lastAssessed: d(-14), assessedBy: "staff_anna", evidence: "Can plan bus route using app; has completed 3 solo journeys to college. Needs practice with trains.", nextStep: "Plan and complete a train journey to nearby town with staff nearby." },
      { id: "s5", name: "Laundry and ironing", category: "laundry", proficiency: "emerging", targetDate: d(30), lastAssessed: d(-14), assessedBy: "staff_anna", evidence: "Can load washing machine but puts colours with whites. Does not yet use correct temperature settings.", nextStep: "Practice sorting laundry and learn temperature guide." },
      { id: "s6", name: "Online safety", category: "digital", proficiency: "competent", targetDate: d(0), lastAssessed: d(-14), assessedBy: "staff_anna", evidence: "Good understanding of privacy settings, phishing scams, and age-appropriate content. Completed CEOP awareness.", nextStep: "Maintain awareness; review annually." },
    ],
    strengths: ["Strong motivation to learn cooking skills", "Excellent digital literacy", "Good personal hygiene established"],
    areasForDevelopment: ["Budgeting and financial literacy", "Laundry skills", "Expanding travel independence to trains"],
    childView: "I want to learn to cook proper meals so I can look after myself. I'm a bit nervous about managing money but I want to try the app thing.",
    pathwayNotes: "Alex is on a semi-independence pathway with a target move date within 12 months. Good engagement with skills sessions; responds well to practical, hands-on learning.",
  },
  {
    id: "is2", youngPersonId: "yp_jordan", reviewDate: d(-7), reviewer: "staff_ryan",
    overallReadiness: 2,
    skills: [
      { id: "s7", name: "Prepare a simple meal", category: "cooking", proficiency: "not_started", targetDate: d(90), lastAssessed: d(-7), assessedBy: "staff_ryan", evidence: "Jordan has expressed no interest in cooking. Refuses to engage in kitchen activities currently.", nextStep: "Explore cooking interests through favourite foods — start with making a sandwich or wrap." },
      { id: "s8", name: "Register with a GP", category: "health", proficiency: "not_started", targetDate: d(60), lastAssessed: d(-7), assessedBy: "staff_ryan", evidence: "Does not understand the process. Currently relies entirely on staff for all health appointments.", nextStep: "Walk-through of GP registration process; visit local surgery together." },
      { id: "s9", name: "Communicate with professionals", category: "communication", proficiency: "emerging", targetDate: d(45), lastAssessed: d(-7), assessedBy: "staff_ryan", evidence: "Will speak to known adults but struggles with unfamiliar professionals. Anxiety around phone calls.", nextStep: "Role-play phone call to book an appointment. Build confidence with known contacts first." },
      { id: "s10", name: "Fire safety in the home", category: "safety", proficiency: "developing", targetDate: d(30), lastAssessed: d(-7), assessedBy: "staff_ryan", evidence: "Knows to call 999 and basic evacuation. Needs to learn about smoke alarms, testing, and kitchen fire prevention.", nextStep: "Complete fire safety worksheet and practice testing smoke alarm." },
      { id: "s11", name: "Understanding a tenancy", category: "housing", proficiency: "not_started", targetDate: d(120), lastAssessed: d(-7), assessedBy: "staff_ryan", evidence: "No current understanding of tenancy agreements, rent, or housing responsibilities.", nextStep: "Introduction session on what a tenancy is; visit local housing office." },
    ],
    strengths: ["Willing to engage in safety discussions", "Good relationship with key worker enables honest conversations"],
    areasForDevelopment: ["Most practical life skills are at early stage", "Anxiety around unfamiliar adults", "No engagement with cooking", "Housing knowledge gap"],
    childView: "I don't really think about this stuff. I know I need to learn but it feels ages away. I don't want to cook.",
    pathwayNotes: "Jordan requires significant support across most independence domains. Pathway is supported living with intensive floating support. Focus on building motivation and reducing anxiety around new experiences.",
  },
  {
    id: "is3", youngPersonId: "yp_casey", reviewDate: d(-3), reviewer: "staff_darren",
    overallReadiness: 4,
    skills: [
      { id: "s12", name: "Prepare a full meal", category: "cooking", proficiency: "competent", targetDate: d(0), lastAssessed: d(-3), assessedBy: "staff_darren", evidence: "Casey can prepare a range of meals including pasta dishes, jacket potatoes, and basic roast dinner. Understands food hygiene and storage.", nextStep: "Explore meal planning for a full week including shopping list." },
      { id: "s13", name: "Manage monthly budget", category: "budgeting", proficiency: "developing", targetDate: d(30), lastAssessed: d(-3), assessedBy: "staff_darren", evidence: "Has opened a bank account and uses online banking. Can plan a weekly shop but struggles with larger monthly budget planning.", nextStep: "Practice creating a monthly budget including bills, food, and leisure." },
      { id: "s14", name: "Do own laundry", category: "laundry", proficiency: "independent", targetDate: d(0), lastAssessed: d(-3), assessedBy: "staff_darren", evidence: "Fully independent — washes, dries, irons, and puts away own clothes without prompting. Knows fabric care labels.", nextStep: "Skill maintained — no further action." },
      { id: "s15", name: "Navigate public transport", category: "travel", proficiency: "independent", targetDate: d(0), lastAssessed: d(-3), assessedBy: "staff_darren", evidence: "Uses buses and trains independently. Can plan multi-leg journeys. Has own travel card. Confident travelling to unfamiliar areas with map support.", nextStep: "Skill maintained." },
      { id: "s16", name: "Manage health appointments", category: "health", proficiency: "competent", targetDate: d(0), lastAssessed: d(-3), assessedBy: "staff_darren", evidence: "Registered with GP and dentist. Books own appointments via phone. Collects own prescriptions.", nextStep: "Discuss mental health self-referral pathways." },
      { id: "s17", name: "Understand tenancy basics", category: "housing", proficiency: "developing", targetDate: d(45), lastAssessed: d(-3), assessedBy: "staff_darren", evidence: "Has visited housing office and understands basic tenancy rights. Completed Centrepoint housing course online.", nextStep: "Practice reading and understanding a sample tenancy agreement." },
    ],
    strengths: ["Highly motivated and proactive", "Excellent practical cooking and laundry skills", "Confident traveller", "Good self-advocacy"],
    areasForDevelopment: ["Monthly budget management", "Understanding tenancy agreements in detail", "Mental health self-referral awareness"],
    childView: "I feel quite ready to move on. I know I need to get better with money but I'm working on it. I'm proud of how much I've learned cooking.",
    pathwayNotes: "Casey is the most independent young person in the home. Target is own tenancy within 6 months. PA support will continue post-placement. Excellent progress across all domains.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const PROF_META: Record<Proficiency, { label: string; colour: string; order: number }> = {
  not_started: { label: "Not Started", colour: "bg-gray-100 text-gray-700", order: 0 },
  emerging:    { label: "Emerging",    colour: "bg-red-100 text-red-700",   order: 1 },
  developing:  { label: "Developing",  colour: "bg-amber-100 text-amber-700", order: 2 },
  competent:   { label: "Competent",   colour: "bg-blue-100 text-blue-700", order: 3 },
  independent: { label: "Independent", colour: "bg-green-100 text-green-700", order: 4 },
};

const CAT_LABELS: Record<Category, string> = {
  cooking: "Cooking & Nutrition", budgeting: "Budgeting & Finance", hygiene: "Personal Hygiene",
  laundry: "Laundry & Clothing", travel: "Travel & Transport", health: "Health Management",
  communication: "Communication", safety: "Safety Awareness", digital: "Digital Skills", housing: "Housing & Tenancy",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function IndependenceSkillsPage() {
  const [data] = useState<IndependenceRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterProf, setFilterProf] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDialog, setShowDialog] = useState(false);

  /* ── per-child summary stats ─────────────────────────────────────────── */
  const ypSummaries = useMemo(() => data.map((r) => {
    const total = r.skills.length;
    const independent = r.skills.filter((s) => s.proficiency === "independent").length;
    const competent   = r.skills.filter((s) => s.proficiency === "competent").length;
    const notStarted  = r.skills.filter((s) => s.proficiency === "not_started").length;
    return { ...r, total, independent, competent, notStarted };
  }), [data]);

  /* ── overall stats ────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const allSkills = data.flatMap((r) => r.skills);
    return {
      total: allSkills.length,
      independent: allSkills.filter((s) => s.proficiency === "independent").length,
      competent:   allSkills.filter((s) => s.proficiency === "competent").length,
      developing:  allSkills.filter((s) => s.proficiency === "developing").length,
      emerging:    allSkills.filter((s) => s.proficiency === "emerging").length,
      notStarted:  allSkills.filter((s) => s.proficiency === "not_started").length,
    };
  }, [data]);

  /* ── filtered skills across all YP ───────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data.flatMap((r) => r.skills.map((s) => ({ ...s, youngPersonId: r.youngPersonId, reviewDate: r.reviewDate })));
    if (filterYP !== "all") list = list.filter((s) => s.youngPersonId === filterYP);
    if (filterProf !== "all") list = list.filter((s) => s.proficiency === filterProf);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.evidence.toLowerCase().includes(q) || CAT_LABELS[s.category].toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "proficiency": return PROF_META[a.proficiency].order - PROF_META[b.proficiency].order;
        case "category":    return CAT_LABELS[a.category].localeCompare(CAT_LABELS[b.category]);
        case "target":      return a.targetDate.localeCompare(b.targetDate);
        default:            return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [data, filterYP, filterProf, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportData = useMemo(() => data.flatMap((r) => r.skills.map((s) => ({
    youngPerson: getYPName(r.youngPersonId),
    skill: s.name,
    category: CAT_LABELS[s.category],
    proficiency: PROF_META[s.proficiency].label,
    targetDate: s.targetDate,
    lastAssessed: s.lastAssessed,
    evidence: s.evidence,
    nextStep: s.nextStep,
    overallReadiness: r.overallReadiness,
    childView: r.childView,
    strengths: r.strengths.join("; "),
    areasForDevelopment: r.areasForDevelopment.join("; "),
    pathwayNotes: r.pathwayNotes,
  }))), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",      accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Skill",             accessor: (r: typeof exportData[number]) => r.skill },
    { header: "Category",          accessor: (r: typeof exportData[number]) => r.category },
    { header: "Proficiency",       accessor: (r: typeof exportData[number]) => r.proficiency },
    { header: "Target Date",       accessor: (r: typeof exportData[number]) => r.targetDate },
    { header: "Last Assessed",     accessor: (r: typeof exportData[number]) => r.lastAssessed },
    { header: "Evidence",          accessor: (r: typeof exportData[number]) => r.evidence },
    { header: "Next Step",         accessor: (r: typeof exportData[number]) => r.nextStep },
    { header: "Overall Readiness", accessor: (r: typeof exportData[number]) => String(r.overallReadiness) },
    { header: "Child View",        accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Strengths",         accessor: (r: typeof exportData[number]) => r.strengths },
    { header: "Areas for Dev",     accessor: (r: typeof exportData[number]) => r.areasForDevelopment },
    { header: "Pathway Notes",     accessor: (r: typeof exportData[number]) => r.pathwayNotes },
  ];

  /* ── readiness colour ────────────────────────────────────────────────── */
  const readinessColour = (n: number) =>
    n >= 4 ? "text-green-600" : n >= 3 ? "text-amber-600" : "text-red-600";

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <PageShell
      title="Independence Skills Tracker"
      subtitle="Pathway to Independence — practical life skills assessment and tracking"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="independence-skills" />
          <PrintButton title="Independence Skills Tracker" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Skill
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { l: "Total Skills", v: stats.total, icon: Star, c: "text-gray-700" },
            { l: "Independent",  v: stats.independent, icon: CheckCircle2, c: "text-green-600" },
            { l: "Competent",    v: stats.competent, icon: TrendingUp, c: "text-blue-600" },
            { l: "Developing",   v: stats.developing, icon: Clock, c: "text-amber-600" },
            { l: "Emerging",     v: stats.emerging, icon: AlertCircle, c: "text-red-600" },
            { l: "Not Started",  v: stats.notStarted, icon: AlertCircle, c: "text-gray-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── per-child readiness cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ypSummaries.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
                <span className={cn("text-lg font-bold", readinessColour(r.overallReadiness))}>
                  {r.overallReadiness}/5
                </span>
              </div>
              {/* proficiency bar */}
              <div className="flex h-3 rounded-full overflow-hidden border">
                {(["independent","competent","developing","emerging","not_started"] as Proficiency[]).map((p) => {
                  const count = r.skills.filter((s) => s.proficiency === p).length;
                  if (!count) return null;
                  const pct = (count / r.total) * 100;
                  return <div key={p} className={cn("h-full", PROF_META[p].colour.split(" ")[0])} style={{ width: `${pct}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                {(["independent","competent","developing","emerging","not_started"] as Proficiency[]).map((p) => {
                  const count = r.skills.filter((s) => s.proficiency === p).length;
                  if (!count) return null;
                  return <span key={p} className={cn("rounded-full px-2 py-0.5", PROF_META[p].colour)}>{count} {PROF_META[p].label}</span>;
                })}
              </div>
              <p className="text-xs text-muted-foreground">{r.total} skills tracked · Reviewed {r.reviewDate}</p>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Children" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {data.map((r) => <SelectItem key={r.youngPersonId} value={r.youngPersonId}>{getYPName(r.youngPersonId)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterProf} onValueChange={setFilterProf}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Proficiency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Object.entries(PROF_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="name">Skill Name</option>
              <option value="proficiency">Proficiency</option>
              <option value="category">Category</option>
              <option value="target">Target Date</option>
            </select>
          </div>
        </div>

        {/* ── expandable cards per YP ───────────────────────────────────── */}
        {data.filter((r) => filterYP === "all" || r.youngPersonId === filterYP).map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <h3 className="font-semibold">{getYPName(rec.youngPersonId)}</h3>
                  <p className="text-xs text-muted-foreground">{rec.skills.length} skills · Readiness {rec.overallReadiness}/5 · Reviewed {rec.reviewDate}</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                {/* skills table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Skill</th>
                        <th className="pb-2 pr-3">Category</th>
                        <th className="pb-2 pr-3">Proficiency</th>
                        <th className="pb-2 pr-3">Target</th>
                        <th className="pb-2 pr-3">Evidence</th>
                        <th className="pb-2">Next Step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.skills.map((sk) => (
                        <tr key={sk.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium">{sk.name}</td>
                          <td className="py-2 pr-3">{CAT_LABELS[sk.category]}</td>
                          <td className="py-2 pr-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PROF_META[sk.proficiency].colour)}>{PROF_META[sk.proficiency].label}</span></td>
                          <td className="py-2 pr-3 whitespace-nowrap">{sk.targetDate}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[250px]">{sk.evidence}</td>
                          <td className="py-2 text-xs max-w-[200px]">{sk.nextStep}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* strengths / areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                      {rec.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Development</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                      {rec.areasForDevelopment.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>

                {/* child view */}
                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900 italic">&ldquo;{rec.childView}&rdquo;</p>
                </div>

                {/* pathway notes */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Pathway Notes</h4>
                  <p className="text-sm text-blue-900">{rec.pathwayNotes}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 5 / Reg 12 / Reg 13</strong> — Children&apos;s homes must help children develop skills, confidence, and independence for adult life. The independence skills tracker supports pathway planning and evidences how the home prepares young people for leaving care.
        </div>
      </div>

      {/* ── dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Independence Skill</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Select Young Person…</option>{data.map((r) => <option key={r.youngPersonId} value={r.youngPersonId}>{getYPName(r.youngPersonId)}</option>)}</select>
            <input placeholder="Skill name" className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm"><option value="">Select Category…</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Select Proficiency…</option>{Object.entries(PROF_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <input type="date" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Evidence" rows={2} className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Next step" className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Add Skill</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
