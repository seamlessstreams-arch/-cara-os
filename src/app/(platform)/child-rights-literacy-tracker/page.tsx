"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  BookOpen,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Award,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type KnowledgeLevel =
  | "Doesn't know"
  | "Has heard of"
  | "Understands basics"
  | "Confident"
  | "Can explain to others";

interface RightsRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  rightsKnowledge: { right: string; level: KnowledgeLevel }[];
  knowsHowToComplain: boolean;
  knowsAdvocateName?: string;
  knowsIndependentVisitorName?: string;
  knowsHowToContactOfsted: boolean;
  knowsRightToAccessRecords: boolean;
  knowsRightToRefuseContact: boolean;
  hasUsedRights: { what: string; date: string; outcome: string }[];
  learningPlanThisQuarter: string[];
  resourcesUsed: string[];
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  keyWorker: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const LEVEL_META: Record<KnowledgeLevel, { colour: string; weight: number }> = {
  "Doesn't know":          { colour: "bg-rose-100 text-rose-800",      weight: 0 },
  "Has heard of":          { colour: "bg-amber-100 text-amber-800",    weight: 1 },
  "Understands basics":    { colour: "bg-yellow-100 text-yellow-800",  weight: 2 },
  "Confident":             { colour: "bg-teal-100 text-teal-800",      weight: 3 },
  "Can explain to others": { colour: "bg-emerald-100 text-emerald-800", weight: 4 },
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: RightsRecord[] = [
  /* ── Jordan — high knowledge ── */
  {
    id: "rl_jordan",
    youngPerson: "yp_jordan",
    recordedDate: d(-21),
    rightsKnowledge: [
      { right: "Right to be heard (UNCRC Art. 12)",          level: "Can explain to others" },
      { right: "Right to private family life (Art. 16)",     level: "Confident" },
      { right: "Right to advocate (Reg 7, CHR 2015)",         level: "Can explain to others" },
      { right: "Right to complain (Reg 39, CHR 2015)",        level: "Can explain to others" },
      { right: "Right to refuse contact",                     level: "Confident" },
      { right: "Right to access records (DPA 2018 / GDPR)",   level: "Confident" },
      { right: "Right to education (Art. 28)",                level: "Confident" },
      { right: "Right to be free from harm (Art. 19)",        level: "Can explain to others" },
    ],
    knowsHowToComplain: true,
    knowsAdvocateName: "Priya Bhatt (NYAS)",
    knowsIndependentVisitorName: "David Owusu",
    knowsHowToContactOfsted: true,
    knowsRightToAccessRecords: true,
    knowsRightToRefuseContact: true,
    hasUsedRights: [
      {
        what: "Asked for advocate during placement disagreement at previous home",
        date: d(-240),
        outcome:
          "Advocate (NYAS) attended LAC review with Jordan, supported him to challenge a proposed move. Move was paused, alternative plan agreed.",
      },
      {
        what: "Contacted independent visitor directly when Jordan felt his views weren't being heard",
        date: d(-95),
        outcome:
          "Independent visitor met with Jordan within 48 hours, raised concern with RM. Issue resolved through key work session with revised plan.",
      },
      {
        what: "Helped Casey understand the complaints process",
        date: d(-30),
        outcome:
          "Jordan explained complaint cards to Casey during a children's meeting. Both children later used the process appropriately.",
      },
    ],
    learningPlanThisQuarter: [
      "Develop peer-mentor role — formal arrangement with the home for new admissions",
      "Attend Children's Commissioner youth panel (already shortlisted)",
      "Revisit information rights — what Subject Access actually entitles him to",
    ],
    resourcesUsed: [
      "NYAS young person's rights pack",
      "Children's Commissioner 'Help at Hand' booklet",
      "Children's Guide for Oak House (annotated by Jordan)",
      "UNCRC child-friendly version (UNICEF UK)",
      "Article 12 In Action workshop (attended off-site)",
    ],
    childVoice:
      "I want other kids in care to know what I know. Half the time grown-ups talk over you and you don't even realise you've got the right to push back. I'd rather a kid use the complaint process and get it wrong than never know they had it.",
    staffObservation:
      "Jordan demonstrates a sophisticated, age-appropriate grasp of his rights. He uses them proportionately — not as a shield against routine boundaries, but to challenge when adults aren't acting in his interests. His advocacy of Casey is strong evidence of internalised rights literacy. Suitable to take on a peer-mentor role with safeguarding scaffolding.",
    reviewDate: d(60),
    keyWorker: "staff_anna",
  },

  /* ── Alex — building ── */
  {
    id: "rl_alex",
    youngPerson: "yp_alex",
    recordedDate: d(-14),
    rightsKnowledge: [
      { right: "Right to be heard (UNCRC Art. 12)",          level: "Confident" },
      { right: "Right to private family life (Art. 16)",     level: "Understands basics" },
      { right: "Right to advocate (Reg 7, CHR 2015)",         level: "Confident" },
      { right: "Right to complain (Reg 39, CHR 2015)",        level: "Confident" },
      { right: "Right to refuse contact",                     level: "Understands basics" },
      { right: "Right to access records (DPA 2018 / GDPR)",   level: "Has heard of" },
      { right: "Right to education (Art. 28)",                level: "Understands basics" },
      { right: "Right to be free from harm (Art. 19)",        level: "Confident" },
    ],
    knowsHowToComplain: true,
    knowsAdvocateName: "Sarah Mansfield (Coram Voice)",
    knowsIndependentVisitorName: "Helen Cartwright",
    knowsHowToContactOfsted: true,
    knowsRightToAccessRecords: false,
    knowsRightToRefuseContact: true,
    hasUsedRights: [
      {
        what: "Participated in Children's Commissioner consultation on care experience",
        date: d(-45),
        outcome:
          "Travelled to regional consultation with key worker. Returned with much deeper understanding of Article 12 and how care leavers are using it. Cited this as a turning point.",
      },
      {
        what: "Asked Sarah (advocate) to attend his last LAC review",
        date: d(-30),
        outcome:
          "Advocate supported Alex to raise concerns about contact arrangements. IRO reflected views in minutes; SW agreed to a revised plan.",
      },
    ],
    learningPlanThisQuarter: [
      "Walk through Subject Access Request process — what's in his file, how to ask",
      "Visual one-pager on Ofsted complaints route (already a draft on his fridge)",
      "Direct work session on identity-based rights (Art. 8 & Art. 14)",
      "Explore peer rights group at college LGBTQ+ society",
    ],
    resourcesUsed: [
      "Coram Voice 'Always Heard' pack (advocate-led)",
      "Children's Guide for Oak House",
      "Help at Hand poster (kitchen)",
      "Children's Commissioner consultation workbook",
      "Stonewall young person's rights leaflet",
    ],
    childVoice:
      "Going to the Commissioner thing flicked a switch — I used to think rights were a school topic. Now I know they're mine, like, today. I want to learn the records one next because I don't actually know what's been written about me.",
    staffObservation:
      "Alex has moved from passive awareness to active use of his rights inside three months. The Commissioner consultation was transformative. Records access is the next clear gap — he's ready for the conversation but needs scaffolding given the emotional weight of file content. Coordinate with social worker before any SAR.",
    reviewDate: d(75),
    keyWorker: "staff_edward",
  },

  /* ── Casey — foundational ── */
  {
    id: "rl_casey",
    youngPerson: "yp_casey",
    recordedDate: d(-9),
    rightsKnowledge: [
      { right: "Right to be heard (UNCRC Art. 12)",          level: "Has heard of" },
      { right: "Right to private family life (Art. 16)",     level: "Has heard of" },
      { right: "Right to advocate (Reg 7, CHR 2015)",         level: "Has heard of" },
      { right: "Right to complain (Reg 39, CHR 2015)",        level: "Understands basics" },
      { right: "Right to refuse contact",                     level: "Doesn't know" },
      { right: "Right to access records (DPA 2018 / GDPR)",   level: "Doesn't know" },
      { right: "Right to education (Art. 28)",                level: "Has heard of" },
      { right: "Right to be free from harm (Art. 19)",        level: "Understands basics" },
    ],
    knowsHowToComplain: true,
    knowsAdvocateName: "Mark Reid (NYAS) — met once",
    knowsIndependentVisitorName: undefined,
    knowsHowToContactOfsted: false,
    knowsRightToAccessRecords: false,
    knowsRightToRefuseContact: false,
    hasUsedRights: [
      {
        what: "Used a complaint card to ask for a different bedtime routine",
        date: d(-40),
        outcome:
          "Complaint logged, RM responded within 5 working days, routine adjusted in line with Casey's preference. Casey told staff she felt 'taken seriously'.",
      },
      {
        what: "Told Anna (key worker on shift) she didn't want to speak to a visiting professional",
        date: d(-12),
        outcome:
          "Visit rearranged. Used as a teaching moment about the right to refuse — reinforced with an age-appropriate explanation.",
      },
    ],
    learningPlanThisQuarter: [
      "Re-introduce advocate Mark Reid — second meeting on neutral ground (cafe), low-pressure",
      "Age-appropriate UNCRC introduction using the UNICEF child-friendly cards",
      "Direct work on 'who you can speak to' map — Anna, social worker, advocate, IV",
      "Walk-through of complaint cards in office, including practising posting one",
      "Introduce concept of right to refuse contact (linked to her safety plan)",
    ],
    resourcesUsed: [
      "Children's Guide for Oak House (read together with Anna)",
      "Complaint cards displayed in office",
      "UNICEF child-friendly UNCRC summary cards",
      "'Who can help me?' visual map (developed in key work)",
    ],
    childVoice:
      "I know I can tell Anna or my social worker if something's wrong. I met Mark once but I forgot what he does. The cards are in the office — I've seen them. I don't really know about the rest yet.",
    staffObservation:
      "Casey is at a foundational stage and that's developmentally appropriate at 12. She has a working trust relationship with Anna and a functioning complaint route, which is the right starting point. Priority is to embed the advocate relationship — one meeting is not enough. Pace must be led by Casey; rights literacy will not be effective if it feels like another adult agenda imposed on her.",
    reviewDate: d(45),
    keyWorker: "staff_chervelle",
  },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildRightsLiteracyTrackerPage() {
  const [data] = useState<RightsRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const childrenOptions = useMemo(() => {
    const ids = Array.from(new Set(data.map((r) => r.youngPerson)));
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [data]);

  const stats = useMemo(() => {
    const withPlans = data.filter((r) => r.learningPlanThisQuarter.length > 0).length;
    const confident = data.filter((r) => {
      const avg =
        r.rightsKnowledge.reduce((sum, k) => sum + LEVEL_META[k.level].weight, 0) /
        Math.max(1, r.rightsKnowledge.length);
      return avg >= 2.5;
    }).length;
    const advocates = data.filter((r) => !!r.knowsAdvocateName).length;
    const reviewsDue60 = data.filter((r) => {
      const reviewDt = new Date(r.reviewDate).getTime();
      const todayDt = new Date(today).getTime();
      const diffDays = (reviewDt - todayDt) / (1000 * 60 * 60 * 24);
      return diffDays <= 60;
    }).length;
    return { withPlans, confident, advocates, reviewsDue60 };
  }, [data, today]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterChild !== "all") list = list.filter((r) => r.youngPerson === filterChild);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.childVoice.toLowerCase().includes(q) ||
          r.staffObservation.toLowerCase().includes(q) ||
          r.rightsKnowledge.some((k) => k.right.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "child":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "knowledge": {
          const avgA =
            a.rightsKnowledge.reduce((s, k) => s + LEVEL_META[k.level].weight, 0) /
            Math.max(1, a.rightsKnowledge.length);
          const avgB =
            b.rightsKnowledge.reduce((s, k) => s + LEVEL_META[k.level].weight, 0) /
            Math.max(1, b.rightsKnowledge.length);
          return avgB - avgA;
        }
        default:
          return b.recordedDate.localeCompare(a.recordedDate);
      }
    });
    return list;
  }, [data, filterChild, search, sortBy]);

  const exportCols: ExportColumn<RightsRecord>[] = [
    { header: "Young Person",            accessor: (r: RightsRecord) => getYPName(r.youngPerson) },
    { header: "Recorded",                accessor: (r: RightsRecord) => r.recordedDate },
    { header: "Rights Knowledge",        accessor: (r: RightsRecord) => r.rightsKnowledge.map((k) => `${k.right}: ${k.level}`).join("; ") },
    { header: "Knows How To Complain",   accessor: (r: RightsRecord) => (r.knowsHowToComplain ? "Yes" : "No") },
    { header: "Advocate",                accessor: (r: RightsRecord) => r.knowsAdvocateName || "" },
    { header: "Independent Visitor",     accessor: (r: RightsRecord) => r.knowsIndependentVisitorName || "" },
    { header: "Knows Ofsted Contact",    accessor: (r: RightsRecord) => (r.knowsHowToContactOfsted ? "Yes" : "No") },
    { header: "Knows Records Right",     accessor: (r: RightsRecord) => (r.knowsRightToAccessRecords ? "Yes" : "No") },
    { header: "Knows Refuse Contact",    accessor: (r: RightsRecord) => (r.knowsRightToRefuseContact ? "Yes" : "No") },
    { header: "Has Used Rights",         accessor: (r: RightsRecord) => r.hasUsedRights.map((h) => `${h.date} — ${h.what} (${h.outcome})`).join("; ") },
    { header: "Learning Plan",           accessor: (r: RightsRecord) => r.learningPlanThisQuarter.join("; ") },
    { header: "Resources Used",          accessor: (r: RightsRecord) => r.resourcesUsed.join("; ") },
    { header: "Child Voice",             accessor: (r: RightsRecord) => r.childVoice },
    { header: "Staff Observation",       accessor: (r: RightsRecord) => r.staffObservation },
    { header: "Review Date",             accessor: (r: RightsRecord) => r.reviewDate },
    { header: "Key Worker",              accessor: (r: RightsRecord) => getStaffName(r.keyWorker) },
  ];

  return (
    <PageShell
      title="Child Rights Literacy Tracker"
      subtitle="Per-child rights knowledge, advocacy connections and empowerment learning — UNCRC, CHR 2015, Children Act 1989"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-rights-literacy" />
          <PrintButton title="Children's Rights Literacy" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: "Children with literacy plans", v: stats.withPlans,    icon: BookOpen,    c: "text-sky-600" },
            { l: "Confident in their rights",    v: stats.confident,    icon: Award,       c: "text-teal-600" },
            { l: "Advocates assigned",           v: stats.advocates,    icon: ShieldCheck, c: "text-emerald-600" },
            { l: "Reviews due (60d)",            v: stats.reviewsDue60, icon: Scale,       c: "text-amber-600" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-teal-50 p-4 text-center shadow-sm"
            >
              <s.icon className={cn("mx-auto h-6 w-6 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, right, voice or observation…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {childrenOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Recorded date</SelectItem>
                <SelectItem value="child">Child name</SelectItem>
                <SelectItem value="review">Review date</SelectItem>
                <SelectItem value="knowledge">Knowledge level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards */}
        {filtered.map((rec) => {
          const isOpen = expanded === rec.id;
          const avg =
            rec.rightsKnowledge.reduce((s, k) => s + LEVEL_META[k.level].weight, 0) /
            Math.max(1, rec.rightsKnowledge.length);
          const headlineLevel: KnowledgeLevel =
            avg >= 3.25 ? "Can explain to others" :
            avg >= 2.5  ? "Confident" :
            avg >= 1.5  ? "Understands basics" :
            avg >= 0.75 ? "Has heard of" :
                          "Doesn't know";

          return (
            <div
              key={rec.id}
              className="rounded-lg border border-sky-100 bg-white overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-sky-50/50 transition"
              >
                <div className="flex items-start gap-3 text-left">
                  <div className="rounded-full bg-gradient-to-br from-sky-100 to-teal-100 p-2">
                    <Scale className="h-5 w-5 text-sky-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rec.youngPerson)}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          LEVEL_META[headlineLevel].colour
                        )}
                      >
                        {headlineLevel}
                      </span>
                      {rec.knowsAdvocateName && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Advocate: {rec.knowsAdvocateName}
                        </span>
                      )}
                      {rec.knowsIndependentVisitorName && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                          IV: {rec.knowsIndependentVisitorName}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          rec.knowsHowToComplain
                            ? "bg-teal-100 text-teal-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {rec.knowsHowToComplain ? "Knows how to complain" : "Complaints route gap"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recorded {rec.recordedDate} · Review {rec.reviewDate} · Key worker {getStaffName(rec.keyWorker)}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {isOpen && (
                <div className="border-t border-sky-100 bg-gradient-to-b from-sky-50/40 to-white p-5 space-y-5">
                  {/* Rights knowledge map */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-sky-700 font-semibold mb-2">
                      Rights knowledge map
                    </p>
                    <ul className="space-y-1.5">
                      {rec.rightsKnowledge.map((k, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-1.5 text-sm"
                        >
                          <span className="text-gray-900">{k.right}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                              LEVEL_META[k.level].colour
                            )}
                          >
                            {k.level}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specific knowledge flags */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { label: "Knows complaints route", val: rec.knowsHowToComplain },
                      { label: "Knows Ofsted contact",   val: rec.knowsHowToContactOfsted },
                      { label: "Knows records right",    val: rec.knowsRightToAccessRecords },
                      { label: "Knows refuse contact",   val: rec.knowsRightToRefuseContact },
                      { label: "Has advocate named",     val: !!rec.knowsAdvocateName },
                      { label: "Has IV named",           val: !!rec.knowsIndependentVisitorName },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className={cn(
                          "rounded-md border px-3 py-2 text-xs font-medium flex items-center justify-between",
                          f.val
                            ? "border-teal-200 bg-teal-50 text-teal-900"
                            : "border-rose-200 bg-rose-50 text-rose-900"
                        )}
                      >
                        <span>{f.label}</span>
                        <span>{f.val ? "Yes" : "No"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Has used rights */}
                  {rec.hasUsedRights.length > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-800 font-semibold mb-2">
                        Times rights have been used
                      </p>
                      <ul className="space-y-2 text-sm text-emerald-950">
                        {rec.hasUsedRights.map((h, i) => (
                          <li key={i} className="border-l-2 border-emerald-300 pl-3">
                            <p className="font-medium">{h.what}</p>
                            <p className="text-xs text-emerald-800">{h.date}</p>
                            <p className="text-sm">{h.outcome}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Learning plan + resources */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-sky-800 font-semibold mb-2">
                        Learning plan this quarter
                      </p>
                      {rec.learningPlanThisQuarter.length ? (
                        <ul className="space-y-1 text-sm text-sky-900">
                          {rec.learningPlanThisQuarter.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-sky-900/70">No active plan.</p>
                      )}
                    </div>

                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-teal-800 font-semibold mb-2">
                        Resources used
                      </p>
                      {rec.resourcesUsed.length ? (
                        <ul className="space-y-1 text-sm text-teal-900">
                          {rec.resourcesUsed.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span aria-hidden>•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-teal-900/70">None recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Voice + observation */}
                  <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                    <p className="text-xs uppercase tracking-wide text-rose-700 font-semibold mb-1">
                      Child voice
                    </p>
                    <p className="text-sm italic text-rose-950 leading-relaxed">
                      &ldquo;{rec.childVoice}&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg border bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                      Staff observation
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{rec.staffObservation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Regulatory footer */}
        <div className="rounded-lg border-l-4 border-sky-400 bg-gradient-to-r from-sky-50 via-white to-teal-50 p-4 text-sm text-gray-800 space-y-1">
          <p>
            <strong>UNCRC</strong> — Articles 12 (voice), 13 (expression), 14 (thought), 16 (privacy),
            17 (information), 19 (protection from harm), 25 (review of placement), 28 (education), 29
            (development of personality and abilities). Children have the right to know their rights —
            rights literacy is itself a right.
          </p>
          <p>
            <strong>Children&apos;s Homes (England) Regulations 2015</strong> — Reg 7 (children&apos;s
            views, wishes and feelings, including access to advocacy) and Reg 39 (complaints procedure
            and the duty to ensure children know how to make a complaint and to whom).
          </p>
          <p>
            <strong>Children Act 1989 s.26</strong> — duty to establish and operate a representations
            and complaints procedure for looked-after children. Coupled with{" "}
            <strong>Independent Visitor regulations</strong> (CA 1989 Sch 2 para 17 / Care Planning
            Regs 2010 Reg 47), every eligible child should know who their IV is and how to contact
            them.
          </p>
          <p>
            <strong>Ofsted complaints route</strong> — children have the right to complain directly to
            Ofsted (enquiries@ofsted.gov.uk / 0300 123 1231). The home must ensure this route is
            accessible, age-appropriate and not gate-kept by staff.
          </p>
          <p>
            <strong>Data Protection Act 2018 / UK GDPR</strong> — children have the right to access
            their own records (Subject Access Request), with appropriate scaffolding given the
            emotional weight of file content.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
