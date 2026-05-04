"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Heart,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type RelationshipQuality = "positive" | "developing" | "strained" | "conflicted" | "neutral";
type RiskLevel = "none" | "low" | "medium" | "high";
type EntryType = "observation" | "incident" | "positive_interaction" | "mediation" | "review";

interface PeerEntry {
  id: string;
  date: string;
  type: EntryType;
  description: string;
  staffWitness: string;
  interventionUsed: string;
  outcome: string;
}

interface PeerDynamic {
  id: string;
  youngPerson1: string;
  youngPerson2: string;
  quality: RelationshipQuality;
  riskLevel: RiskLevel;
  strengths: string[];
  concerns: string[];
  strategies: string[];
  entries: PeerEntry[];
  lastReviewDate: string;
  reviewedBy: string;
  nextReviewDue: string;
  notes: string;
}

interface GroupDynamic {
  id: string;
  assessmentDate: string;
  assessedBy: string;
  overallAtmosphere: "calm" | "mixed" | "tense" | "volatile";
  groupStrengths: string[];
  groupConcerns: string[];
  currentDynamics: string;
  recommendations: string[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const QUALITY_LABELS: Record<RelationshipQuality, string> = {
  positive: "Positive", developing: "Developing", strained: "Strained",
  conflicted: "Conflicted", neutral: "Neutral",
};
const QUALITY_COLOURS: Record<RelationshipQuality, string> = {
  positive: "bg-green-100 text-green-800", developing: "bg-blue-100 text-blue-800",
  strained: "bg-amber-100 text-amber-800", conflicted: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-700",
};

const RISK_LABELS: Record<RiskLevel, string> = { none: "None", low: "Low", medium: "Medium", high: "High" };
const RISK_COLOURS: Record<RiskLevel, string> = {
  none: "bg-green-100 text-green-800", low: "bg-blue-100 text-blue-800",
  medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800",
};

const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  observation: "Observation", incident: "Incident", positive_interaction: "Positive Interaction",
  mediation: "Mediation", review: "Review",
};

const ATMOS_LABELS: Record<string, string> = { calm: "Calm", mixed: "Mixed", tense: "Tense", volatile: "Volatile" };
const ATMOS_COLOURS: Record<string, string> = {
  calm: "bg-green-100 text-green-800", mixed: "bg-amber-100 text-amber-800",
  tense: "bg-orange-100 text-orange-800", volatile: "bg-red-100 text-red-800",
};

const PEER_DYNAMICS: PeerDynamic[] = [
  {
    id: "pd1", youngPerson1: "yp_alex", youngPerson2: "yp_jordan",
    quality: "developing", riskLevel: "low",
    strengths: ["Shared interest in gaming", "Alex naturally protective of Jordan", "Mutual respect for each other's space"],
    concerns: ["Alex's boisterous behaviour can overwhelm Jordan's sensory needs", "Volume levels during gaming sessions"],
    strategies: [
      "Gaming sessions in communal area with staff oversight — max 1 hour",
      "Alex to use headphones during gaming if Jordan is nearby",
      "Staff to monitor noise levels and intervene calmly if escalating",
      "Encourage joint quiet activities (board games, art)",
    ],
    entries: [
      { id: "e1", date: d(-3), type: "positive_interaction", description: "Alex and Jordan played a cooperative Lego build for 45 minutes. Alex was patient when Jordan needed to organise pieces by colour first. Both laughing and engaged.", staffWitness: "staff_anna", interventionUsed: "None needed", outcome: "Naturally positive interaction — reinforced with praise for both" },
      { id: "e2", date: d(-10), type: "observation", description: "During evening free time, Alex's music was too loud for Jordan. Jordan became withdrawn and went to their room. Alex didn't notice.", staffWitness: "staff_edward", interventionUsed: "Spoke to Alex about volume — reminded about noise agreement. Checked on Jordan.", outcome: "Alex apologised genuinely. Jordan returned after 20 mins. Discussed using headphones." },
      { id: "e3", date: d(-20), type: "mediation", description: "Minor disagreement over TV programme choice. Both became frustrated. Jordan struggled to articulate their preference.", staffWitness: "staff_chervelle", interventionUsed: "Facilitated turn-taking discussion. Introduced visual schedule for shared TV time.", outcome: "TV schedule agreed — both contributed to it. Positive resolution." },
    ],
    lastReviewDate: d(-7), reviewedBy: "staff_anna", nextReviewDue: d(21),
    notes: "Relationship improving steadily. Alex showing increased awareness of Jordan's needs. Continue to build on shared interests while managing sensory compatibility.",
  },
  {
    id: "pd2", youngPerson1: "yp_alex", youngPerson2: "yp_casey",
    quality: "positive", riskLevel: "none",
    strengths: ["Natural friendship — age-appropriate banter", "Both enjoy outdoor activities", "Casey looks up to Alex — positive role model", "Share meals together without conflict"],
    concerns: ["Alex occasionally uses language Casey then copies", "Casey can become overexcited and boundary-push when with Alex"],
    strategies: [
      "Encourage joint outdoor activities — cycling, garden games",
      "Staff to gently address language modelling in the moment",
      "Structured activities together to channel energy positively",
    ],
    entries: [
      { id: "e4", date: d(-2), type: "positive_interaction", description: "Alex helped Casey with homework. Was patient explaining maths concepts. Casey was focused and grateful.", staffWitness: "staff_anna", interventionUsed: "None", outcome: "Great peer mentoring moment. Both praised." },
      { id: "e5", date: d(-8), type: "observation", description: "Playing football in garden together after school. Good-natured, inclusive. Alex adjusted their play to Casey's level.", staffWitness: "staff_edward", interventionUsed: "None needed", outcome: "Positive play. Both came in happy and settled." },
    ],
    lastReviewDate: d(-7), reviewedBy: "staff_anna", nextReviewDue: d(21),
    notes: "Strong positive relationship. Alex is a good influence on Casey. Continue to support and celebrate this dynamic.",
  },
  {
    id: "pd3", youngPerson1: "yp_jordan", youngPerson2: "yp_casey",
    quality: "strained", riskLevel: "medium",
    strengths: ["Both enjoy art activities", "Can co-exist calmly in structured settings"],
    concerns: [
      "Casey's high energy can trigger Jordan's sensory overload",
      "Casey doesn't always understand Jordan's need for quiet",
      "Occasional tension at mealtimes — Casey talks loudly",
      "Jordan becomes withdrawn when Casey is dysregulated",
    ],
    strategies: [
      "Staggered mealtimes if one child is dysregulated",
      "Separate spaces available during high-energy periods",
      "Joint art sessions (structured, calm) as bridge-building",
      "Staff to proactively manage transitions — prepare Jordan before Casey arrives in shared space",
      "Casey supported to understand Jordan's needs through age-appropriate conversation (not blame)",
    ],
    entries: [
      { id: "e6", date: d(-1), type: "observation", description: "Casey came in from school very excited and loud. Jordan was reading in the lounge. Jordan immediately tensed up and covered ears. Casey didn't notice.", staffWitness: "staff_anna", interventionUsed: "Redirected Casey to kitchen for snack and debrief. Checked on Jordan — offered headphones.", outcome: "Both settled within 10 minutes. No conflict, but proactive management needed." },
      { id: "e7", date: d(-7), type: "incident", description: "Casey accidentally knocked over Jordan's art project when running through the hallway. Jordan became very distressed — crying and shouting. Casey was upset about causing distress.", staffWitness: "staff_chervelle", interventionUsed: "Separated — Chervelle with Jordan, Edward with Casey. Calm-down time. Facilitated apology when both ready.", outcome: "Casey apologised sincerely. Helped Jordan rebuild project. Both needed emotional support. Running in hallway discussed." },
      { id: "e8", date: d(-14), type: "positive_interaction", description: "Structured art session — painting. Both sat at the table for 30 minutes working on individual pieces. Jordan showed Casey a painting technique. Brief positive verbal exchange.", staffWitness: "staff_chervelle", interventionUsed: "Structured setting — art activity pre-planned", outcome: "Positive shared experience. Jordan initiated the interaction which is significant." },
    ],
    lastReviewDate: d(-7), reviewedBy: "staff_darren", nextReviewDue: d(14),
    notes: "Needs active management. Neither child is at fault — their needs are simply different. Focus on structured, calm shared experiences. Avoid forced interaction. Staff proactivity is key.",
  },
];

const GROUP_DYNAMIC: GroupDynamic = {
  id: "gd1", assessmentDate: d(-7), assessedBy: "staff_darren",
  overallAtmosphere: "mixed",
  groupStrengths: [
    "Alex and Casey have a strong positive relationship that stabilises the home",
    "All three can engage positively in structured activities",
    "No bullying behaviours identified",
    "Children generally respectful of each other's bedrooms and belongings",
  ],
  groupConcerns: [
    "Sensory mismatch between Casey's energy levels and Jordan's need for calm",
    "Transitions (school return, mealtimes) are pressure points for group dynamics",
    "Jordan's withdrawal can be misread by others as rejection",
  ],
  currentDynamics: "The home operates best when there is a balance of structured and free time. Alex naturally bridges between Jordan and Casey. Morning routines are generally calm. After-school periods need most active management. Evenings settle well with individual bedtime routines.",
  recommendations: [
    "Maintain staggered activity options during peak times",
    "Continue structured group activities 2x per week (art, cooking, board games)",
    "All staff to complete sensory awareness refresher",
    "Weekly peer dynamic review in team meeting",
    "Consider therapeutic group session with external practitioner",
  ],
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  child1: string; child2: string; quality: string; riskLevel: string;
  strengths: string; concerns: string; strategies: string;
  lastReview: string; nextReview: string; recentEntry: string;
  entryType: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Child 1",       accessor: (r: FlatRow) => r.child1 },
  { header: "Child 2",       accessor: (r: FlatRow) => r.child2 },
  { header: "Quality",       accessor: (r: FlatRow) => r.quality },
  { header: "Risk Level",    accessor: (r: FlatRow) => r.riskLevel },
  { header: "Strengths",     accessor: (r: FlatRow) => r.strengths },
  { header: "Concerns",      accessor: (r: FlatRow) => r.concerns },
  { header: "Strategies",    accessor: (r: FlatRow) => r.strategies },
  { header: "Last Review",   accessor: (r: FlatRow) => r.lastReview },
  { header: "Next Review",   accessor: (r: FlatRow) => r.nextReview },
  { header: "Latest Entry",  accessor: (r: FlatRow) => r.recentEntry },
  { header: "Entry Type",    accessor: (r: FlatRow) => r.entryType },
  { header: "Notes",         accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function PeerRelationshipsPage() {
  const [dynamics] = useState<PeerDynamic[]>(PEER_DYNAMICS);
  const [group] = useState<GroupDynamic>(GROUP_DYNAMIC);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterQuality, setFilterQuality] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const positive = dynamics.filter((d) => d.quality === "positive").length;
    const concerns = dynamics.filter((d) => ["strained", "conflicted"].includes(d.quality)).length;
    const highRisk = dynamics.filter((d) => ["medium", "high"].includes(d.riskLevel)).length;
    const totalEntries = dynamics.reduce((s, d) => s + d.entries.length, 0);
    return { positive, concerns, highRisk, totalEntries };
  }, [dynamics]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = dynamics;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        getYPName(d.youngPerson1).toLowerCase().includes(q) ||
        getYPName(d.youngPerson2).toLowerCase().includes(q)
      );
    }
    if (filterQuality !== "all") list = list.filter((d) => d.quality === filterQuality);
    const out = [...list];
    switch (sortBy) {
      case "risk": {
        const o: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
        out.sort((a, b) => o[a.riskLevel] - o[b.riskLevel]);
        break;
      }
      case "quality": out.sort((a, b) => a.quality.localeCompare(b.quality)); break;
      case "recent": out.sort((a, b) => {
        const la = a.entries[0]?.date ?? ""; const lb = b.entries[0]?.date ?? "";
        return lb.localeCompare(la);
      }); break;
    }
    return out;
  }, [dynamics, search, filterQuality, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    dynamics.map((d) => ({
      child1: getYPName(d.youngPerson1),
      child2: getYPName(d.youngPerson2),
      quality: QUALITY_LABELS[d.quality],
      riskLevel: RISK_LABELS[d.riskLevel],
      strengths: d.strengths.join("; "),
      concerns: d.concerns.join("; "),
      strategies: d.strategies.join("; "),
      lastReview: d.lastReviewDate,
      nextReview: d.nextReviewDue,
      recentEntry: d.entries[0]?.description ?? "—",
      entryType: d.entries[0] ? ENTRY_TYPE_LABELS[d.entries[0].type] : "—",
      notes: d.notes,
    })), [dynamics]);

  return (
    <PageShell
      title="Peer Relationships"
      subtitle="Peer dynamic mapping, group living assessments and relationship tracking"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Peer Relationships" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="peer-relationships" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Log Entry
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Positive Dynamics", value: stats.positive, icon: Heart, colour: "text-green-600" },
          { label: "Strained/Conflicted", value: stats.concerns, icon: AlertTriangle, colour: stats.concerns > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Medium/High Risk", value: stats.highRisk, icon: ShieldAlert, colour: stats.highRisk > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Total Observations", value: stats.totalEntries, icon: TrendingUp, colour: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── group dynamic card ─────────────────────────────────────── */}
      <div className="rounded-lg border bg-white p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              Group Dynamic Assessment
            </h3>
            <p className="text-xs text-gray-500">{group.assessmentDate} — {getStaffName(group.assessedBy)}</p>
          </div>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ATMOS_COLOURS[group.overallAtmosphere])}>
            {ATMOS_LABELS[group.overallAtmosphere]}
          </span>
        </div>
        <p className="text-sm mb-3">{group.currentDynamics}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md bg-green-50 p-3">
            <h4 className="text-xs font-semibold text-green-700 mb-1">Group Strengths</h4>
            <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
              {group.groupStrengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="rounded-md bg-amber-50 p-3">
            <h4 className="text-xs font-semibold text-amber-700 mb-1">Group Concerns</h4>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
              {group.groupConcerns.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
        {group.recommendations.length > 0 && (
          <div className="mt-3 rounded-md bg-blue-50 p-3">
            <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommendations</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
              {group.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="peer-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterQuality} onValueChange={setFilterQuality}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Qualities</SelectItem>
            {Object.entries(QUALITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── pair cards ─────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((pd) => {
          const open = expanded[pd.id] ?? false;
          return (
            <div key={pd.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(pd.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(pd.youngPerson1)} ↔ {getYPName(pd.youngPerson2)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", QUALITY_COLOURS[pd.quality])}>{QUALITY_LABELS[pd.quality]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RISK_COLOURS[pd.riskLevel])}>Risk: {RISK_LABELS[pd.riskLevel]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pd.entries.length} entries · Review {pd.nextReviewDue}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* strengths / concerns */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {pd.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Concerns</h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {pd.concerns.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* strategies */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Management Strategies</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {pd.strategies.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {/* entries */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Entries &amp; Observations</h4>
                    <div className="space-y-3">
                      {pd.entries.map((e) => (
                        <div key={e.id} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                              e.type === "positive_interaction" ? "bg-green-100 text-green-800" :
                              e.type === "incident" ? "bg-red-100 text-red-800" :
                              e.type === "mediation" ? "bg-purple-100 text-purple-800" :
                              "bg-gray-100 text-gray-700"
                            )}>{ENTRY_TYPE_LABELS[e.type]}</span>
                            <span className="text-xs text-gray-500">{e.date} — {getStaffName(e.staffWitness)}</span>
                          </div>
                          <p className="text-sm mb-1">{e.description}</p>
                          {e.interventionUsed && <p className="text-xs text-gray-600"><span className="font-medium">Intervention:</span> {e.interventionUsed}</p>}
                          {e.outcome && <p className="text-xs text-gray-600"><span className="font-medium">Outcome:</span> {e.outcome}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* review info */}
                  <div className="rounded-md bg-gray-50 p-3 text-sm">
                    <span className="text-gray-500">Last reviewed:</span> {pd.lastReviewDate} by {getStaffName(pd.reviewedBy)} · <span className="text-gray-500">Next review:</span> <span className={cn(pd.nextReviewDue <= d(0) ? "text-red-600 font-medium" : "")}>{pd.nextReviewDue}</span>
                  </div>

                  {/* notes */}
                  {pd.notes && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Key Worker Notes</h4>
                      <p className="text-sm text-pink-800">{pd.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Group Living &amp; Peer Dynamics:</strong> Reg 12 requires that the registered person protects children from bullying, harassment and exploitation. Regular assessment of peer dynamics is essential for anticipating conflict, managing group living pressures, and ensuring all children feel safe. Impact assessments for new admissions should always consider existing peer relationships.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Peer Relationship Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Child 1</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Child 2</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Entry Type</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(ENTRY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Describe the interaction or observation…" />
            </div>
            <div>
              <label className="text-sm font-medium">Outcome</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="What happened as a result?" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save Entry</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
