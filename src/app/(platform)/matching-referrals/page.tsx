"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  Search,
  Scale,
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

type ReferralStatus = "received" | "shortlisted" | "assessment" | "panel" | "accepted" | "declined" | "withdrawn";
type MatchScore = "strong" | "moderate" | "weak" | "unsuitable";

interface MatchDomain {
  domain: string;
  score: MatchScore;
  detail: string;
}

interface ImpactOnCurrent {
  youngPersonId: string;
  risk: "low" | "medium" | "high";
  detail: string;
  mitigations: string[];
}

interface Referral {
  id: string;
  childName: string;
  age: number;
  gender: string;
  localAuthority: string;
  socialWorker: string;
  referralDate: string;
  status: ReferralStatus;
  assignedTo: string;
  overallMatch: MatchScore;
  matchDomains: MatchDomain[];
  impactOnCurrent: ImpactOnCurrent[];
  strengths: string[];
  concerns: string[];
  conditions: string[];
  decisionDate: string | null;
  decisionBy: string | null;
  decisionRationale: string;
  placementType: string;
  presentingNeeds: string[];
  riskFactors: string[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: Referral[] = [
  {
    id: "ref1", childName: "Ethan M.", age: 14, gender: "Male",
    localAuthority: "Manchester City Council", socialWorker: "Rebecca Hall",
    referralDate: d(-21), status: "panel", assignedTo: "staff_darren",
    overallMatch: "strong", placementType: "Long-term residential",
    presentingNeeds: ["ADHD", "Attachment difficulties", "Education disengagement"],
    riskFactors: ["Absconding history (3 episodes in previous placement)", "Cannabis use"],
    matchDomains: [
      { domain: "Age & peer group compatibility", score: "strong", detail: "14 years — fits within the current 13-16 age range. Would not be the oldest or youngest." },
      { domain: "Presenting needs & staff expertise", score: "strong", detail: "Team has extensive ADHD experience. Two staff trained in attachment-informed practice. PACE model embedded." },
      { domain: "Education provision", score: "moderate", detail: "Local school has space but limited SEND support. Alternative provision may be needed initially." },
      { domain: "Risk profile compatibility", score: "moderate", detail: "Absconding history noted but mitigated by home's location and current low missing-from-care rate. Cannabis use would need monitoring." },
      { domain: "Identity & cultural needs", score: "strong", detail: "White British — matches local community. No specific cultural needs requiring specialist provision." },
      { domain: "Family contact logistics", score: "strong", detail: "Family based in Greater Manchester — easy travel distance for regular contact." },
      { domain: "Room availability & configuration", score: "strong", detail: "Room 4 available from next month. Separate corridor from other YP — good for settling in." },
    ],
    impactOnCurrent: [
      { youngPersonId: "yp_alex", risk: "low", detail: "Similar age and interests. Alex has expressed wanting another peer in the home. No foreseeable conflict.", mitigations: ["Staggered introduction", "Clear expectations set with both YP"] },
      { youngPersonId: "yp_jordan", risk: "medium", detail: "Jordan may feel unsettled by new arrival. History of struggling with change. Absconding history of referral could trigger Jordan's anxiety.", mitigations: ["Pre-placement discussion with Jordan", "Additional key work sessions during transition", "Monitor Jordan's behaviour closely for 4 weeks"] },
      { youngPersonId: "yp_casey", risk: "low", detail: "Casey is most settled and would likely be a positive peer influence. No risk indicators.", mitigations: ["Ask Casey if willing to be informal buddy"] },
    ],
    strengths: ["Strong match across most domains", "Staff team has relevant expertise", "Good room availability", "Family contact logistics excellent", "Alex would welcome a peer"],
    concerns: ["Absconding history requires robust management plan", "Cannabis use needs clear boundaries and support plan", "Impact on Jordan needs careful management", "Education provision may require alternative arrangements initially"],
    conditions: ["Absconding protocol updated before placement", "Drug and substance misuse plan in place", "Transition plan agreed with SW — minimum 3 visits before placement", "Jordan given 2 weeks notice and additional support"],
    decisionDate: null, decisionBy: null,
    decisionRationale: "Proceeding to panel. Strong overall match. Conditions to be met before final acceptance.",
  },
  {
    id: "ref2", childName: "Amira K.", age: 12, gender: "Female",
    localAuthority: "Salford City Council", socialWorker: "David Nkomo",
    referralDate: d(-14), status: "declined", assignedTo: "staff_darren",
    overallMatch: "unsuitable", placementType: "Emergency placement",
    presentingNeeds: ["CSE risk (high)", "Self-harm", "PTSD diagnosis", "Selective mutism in new environments"],
    riskFactors: ["Ligature risk (active)", "Target of ongoing criminal exploitation", "Previous placement breakdown due to violence towards staff"],
    matchDomains: [
      { domain: "Age & peer group compatibility", score: "weak", detail: "At 12, would be significantly younger than current group (13-16). Developmental gap and safeguarding concerns." },
      { domain: "Presenting needs & staff expertise", score: "unsuitable", detail: "CSE specialist provision required. Staff team not trained in CSE intervention. Self-harm risk exceeds current competency without additional training." },
      { domain: "Risk profile compatibility", score: "unsuitable", detail: "Active ligature risk requires 2:1 staffing which is not available. Criminal exploitation contact risk to other YP. Violence risk to staff." },
      { domain: "Identity & cultural needs", score: "moderate", detail: "Somali heritage — limited local community but connections could be established. Halal dietary needs manageable." },
      { domain: "Gender dynamics", score: "weak", detail: "Currently all-male home. Mixed placement would require significant operational changes and risk assessment." },
      { domain: "Environment suitability", score: "unsuitable", detail: "Home has not been assessed for ligature-free environment. Significant adaptations needed." },
    ],
    impactOnCurrent: [
      { youngPersonId: "yp_alex", risk: "high", detail: "Gender dynamic change plus CSE risk factors create safeguarding complexity for Alex.", mitigations: [] },
      { youngPersonId: "yp_jordan", risk: "high", detail: "Jordan's own vulnerability and anxiety would be significantly impacted. Violence risk from referral is a major concern.", mitigations: [] },
      { youngPersonId: "yp_casey", risk: "high", detail: "Casey preparing for independence — disruption at this stage would be detrimental to pathway.", mitigations: [] },
    ],
    strengths: ["Child clearly needs support and protection urgently"],
    concerns: ["Risk profile significantly exceeds home's registration and capability", "Age incompatibility", "Gender dynamics not manageable", "CSE specialist provision required", "Ligature risk cannot be managed safely", "Impact on all current residents would be severe"],
    conditions: [],
    decisionDate: d(-10), decisionBy: "staff_darren",
    decisionRationale: "Declined. The referral does not match the home's statement of purpose, registration, or current capability. The young person requires specialist CSE provision with ligature-free environment and higher staffing ratios. Placing Amira here would not meet her needs and would create unacceptable risk for current residents. Signposted LA to specialist providers.",
  },
  {
    id: "ref3", childName: "Tyler B.", age: 15, gender: "Male",
    localAuthority: "Bolton Council", socialWorker: "Sarah Patel",
    referralDate: d(-5), status: "assessment", assignedTo: "staff_ryan",
    overallMatch: "moderate", placementType: "Planned move from foster care",
    presentingNeeds: ["ASD diagnosis", "Anxiety disorder", "Sensory processing difficulties", "Education — EHCP in place"],
    riskFactors: ["Meltdowns when overwhelmed (not directed at others)", "Property damage during distress", "Food restriction / ARFID tendencies"],
    matchDomains: [
      { domain: "Age & peer group compatibility", score: "strong", detail: "15 years — good fit within age range. Planned move allows proper introduction." },
      { domain: "Presenting needs & staff expertise", score: "moderate", detail: "Three staff have autism awareness training but no specialist ASD qualifications. Sensory processing support would need developing." },
      { domain: "Risk profile compatibility", score: "strong", detail: "Meltdowns are self-directed — low risk to others. Property damage manageable with sensory room setup." },
      { domain: "Education provision", score: "strong", detail: "EHCP in place. Local SEND school has confirmed availability. Transport arranged." },
      { domain: "Environment suitability", score: "moderate", detail: "Home is generally busy/noisy. Would need quiet retreat space for sensory regulation. Consider Room 4 (quietest)." },
      { domain: "Family contact logistics", score: "moderate", detail: "Family in Bolton — 30 min drive. Contact with grandmother weekly — transport manageable." },
    ],
    impactOnCurrent: [
      { youngPersonId: "yp_alex", risk: "low", detail: "Alex is generally accommodating. Similar interests in gaming could be a positive connection.", mitigations: ["Introduction via shared activity"] },
      { youngPersonId: "yp_jordan", risk: "medium", detail: "Jordan may react to visible distress if Tyler has a meltdown. Needs preparation and understanding.", mitigations: ["Social story about ASD for Jordan", "Clear staff response protocol so Jordan feels safe", "Jordan to have exit plan if overwhelmed"] },
      { youngPersonId: "yp_casey", risk: "low", detail: "Casey is empathetic and understanding. Would likely be supportive.", mitigations: ["Brief Casey on ASD and how to be helpful"] },
    ],
    strengths: ["Planned move allows proper transition", "EHCP and school already arranged", "Risk profile is self-directed — low impact on others", "Potential positive peer connections through gaming"],
    concerns: ["Staff ASD training needs enhancing", "Sensory environment needs adaptation", "Food restriction/ARFID requires dietitian input", "Property damage during meltdowns needs clear insurance/replacement plan", "Impact of noisy home on Tyler's sensory needs"],
    conditions: ["Staff ASD training booked before placement", "Sensory room/corner established", "Dietitian referral made for ARFID support", "Detailed sensory profile obtained from current carer", "3-visit transition plan minimum"],
    decisionDate: null, decisionBy: null,
    decisionRationale: "Currently in assessment. Moderate match with conditions. Training and environmental adaptations required before decision. Visit 1 scheduled for next week.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_META: Record<ReferralStatus, { label: string; colour: string }> = {
  received:   { label: "Received",    colour: "bg-gray-100 text-gray-700" },
  shortlisted:{ label: "Shortlisted", colour: "bg-blue-100 text-blue-700" },
  assessment: { label: "Assessment",  colour: "bg-purple-100 text-purple-700" },
  panel:      { label: "Panel",       colour: "bg-amber-100 text-amber-700" },
  accepted:   { label: "Accepted",    colour: "bg-green-100 text-green-700" },
  declined:   { label: "Declined",    colour: "bg-red-100 text-red-700" },
  withdrawn:  { label: "Withdrawn",   colour: "bg-gray-100 text-gray-500" },
};

const MATCH_META: Record<MatchScore, { label: string; colour: string }> = {
  strong:     { label: "Strong Match",     colour: "bg-green-100 text-green-700" },
  moderate:   { label: "Moderate Match",   colour: "bg-amber-100 text-amber-700" },
  weak:       { label: "Weak Match",       colour: "bg-orange-100 text-orange-700" },
  unsuitable: { label: "Unsuitable",       colour: "bg-red-100 text-red-700" },
};

const RISK_COLOUR: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function MatchingReferralsPage() {
  const [data] = useState<Referral[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMatch, setFilterMatch] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  /* ── stats ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((r) => !["declined","withdrawn","accepted"].includes(r.status)).length,
    accepted: data.filter((r) => r.status === "accepted").length,
    declined: data.filter((r) => r.status === "declined").length,
    avgAge: Math.round(data.reduce((s, r) => s + r.age, 0) / data.length),
  }), [data]);

  /* ── filtered ────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterMatch !== "all") list = list.filter((r) => r.overallMatch === filterMatch);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.childName.toLowerCase().includes(q) || r.localAuthority.toLowerCase().includes(q) || r.presentingNeeds.join(" ").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":  return a.childName.localeCompare(b.childName);
        case "match": return Object.keys(MATCH_META).indexOf(a.overallMatch) - Object.keys(MATCH_META).indexOf(b.overallMatch);
        case "age":   return a.age - b.age;
        default:      return b.referralDate.localeCompare(a.referralDate);
      }
    });
    return list;
  }, [data, filterStatus, filterMatch, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportData = useMemo(() => data.map((r) => ({
    childName: r.childName,
    age: r.age,
    gender: r.gender,
    localAuthority: r.localAuthority,
    socialWorker: r.socialWorker,
    referralDate: r.referralDate,
    status: STATUS_META[r.status].label,
    overallMatch: MATCH_META[r.overallMatch].label,
    placementType: r.placementType,
    presentingNeeds: r.presentingNeeds.join("; "),
    riskFactors: r.riskFactors.join("; "),
    strengths: r.strengths.join("; "),
    concerns: r.concerns.join("; "),
    decisionRationale: r.decisionRationale,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Child Name",       accessor: (r: typeof exportData[number]) => r.childName },
    { header: "Age",              accessor: (r: typeof exportData[number]) => String(r.age) },
    { header: "Gender",           accessor: (r: typeof exportData[number]) => r.gender },
    { header: "Local Authority",  accessor: (r: typeof exportData[number]) => r.localAuthority },
    { header: "Social Worker",    accessor: (r: typeof exportData[number]) => r.socialWorker },
    { header: "Referral Date",    accessor: (r: typeof exportData[number]) => r.referralDate },
    { header: "Status",           accessor: (r: typeof exportData[number]) => r.status },
    { header: "Overall Match",    accessor: (r: typeof exportData[number]) => r.overallMatch },
    { header: "Placement Type",   accessor: (r: typeof exportData[number]) => r.placementType },
    { header: "Presenting Needs", accessor: (r: typeof exportData[number]) => r.presentingNeeds },
    { header: "Risk Factors",     accessor: (r: typeof exportData[number]) => r.riskFactors },
    { header: "Strengths",        accessor: (r: typeof exportData[number]) => r.strengths },
    { header: "Concerns",         accessor: (r: typeof exportData[number]) => r.concerns },
    { header: "Decision Rationale",accessor: (r: typeof exportData[number]) => r.decisionRationale },
  ];

  return (
    <PageShell
      title="Matching & Referrals"
      subtitle="Reg 14 — Referral assessment, matching analysis and placement decisions"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="matching-referrals" />
          <PrintButton title="Matching & Referrals" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Referral
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals", v: stats.total, icon: UserPlus, c: "text-blue-600" },
            { l: "Active",          v: stats.active, icon: Clock, c: "text-amber-600" },
            { l: "Accepted",        v: stats.accepted, icon: CheckCircle2, c: "text-green-600" },
            { l: "Declined",        v: stats.declined, icon: XCircle, c: "text-red-600" },
            { l: "Avg Age",         v: stats.avgAge, icon: UserPlus, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search referrals…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMatch} onValueChange={setFilterMatch}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Match" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              {Object.entries(MATCH_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Referral Date</option>
              <option value="name">Name</option>
              <option value="match">Match Score</option>
              <option value="age">Age</option>
            </select>
          </div>
        </div>

        {/* ── referral cards ────────────────────────────────────────────── */}
        {filtered.map((ref) => (
          <div key={ref.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === ref.id ? null : ref.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{ref.childName}</h3>
                    <span className="text-xs text-muted-foreground">Age {ref.age} · {ref.gender}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[ref.status].colour)}>{STATUS_META[ref.status].label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MATCH_META[ref.overallMatch].colour)}>{MATCH_META[ref.overallMatch].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ref.localAuthority} · {ref.placementType} · Referred {ref.referralDate}</p>
                </div>
              </div>
              {expanded === ref.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === ref.id && (
              <div className="border-t p-4 space-y-4">
                {/* header info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Social Worker:</span> {ref.socialWorker}</div>
                  <div><span className="text-muted-foreground">Assigned To:</span> {getStaffName(ref.assignedTo)}</div>
                  <div><span className="text-muted-foreground">Placement Type:</span> {ref.placementType}</div>
                  {ref.decisionDate && <div><span className="text-muted-foreground">Decision Date:</span> {ref.decisionDate}</div>}
                </div>

                {/* presenting needs & risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Presenting Needs</h4>
                    <div className="flex flex-wrap gap-1">{ref.presentingNeeds.map((n, i) => <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{n}</span>)}</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">Risk Factors</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-red-900">{ref.riskFactors.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                </div>

                {/* matching domains */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Matching Analysis</h4>
                  <div className="space-y-2">
                    {ref.matchDomains.map((md, i) => (
                      <div key={i} className="rounded border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{md.domain}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MATCH_META[md.score].colour)}>{MATCH_META[md.score].label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{md.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* impact on current residents */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Impact on Current Residents</h4>
                  <div className="space-y-2">
                    {ref.impactOnCurrent.map((ic, i) => (
                      <div key={i} className="rounded border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{getYPName(ic.youngPersonId)}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", RISK_COLOUR[ic.risk])}>{ic.risk.charAt(0).toUpperCase() + ic.risk.slice(1)} Risk</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{ic.detail}</p>
                        {ic.mitigations.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {ic.mitigations.map((m, j) => <li key={j}>{m}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* strengths / concerns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-900">{ref.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Concerns</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">{ref.concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                  </div>
                </div>

                {/* conditions */}
                {ref.conditions.length > 0 && (
                  <div className="rounded-lg bg-purple-50 p-3">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">Conditions for Acceptance</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-purple-900">{ref.conditions.map((c, i) => <li key={i}>{c}</li>)}</ol>
                  </div>
                )}

                {/* decision rationale */}
                <div className="rounded-lg bg-gray-50 border p-3">
                  <h4 className="text-sm font-semibold mb-1">Decision / Rationale</h4>
                  <p className="text-sm text-muted-foreground">{ref.decisionRationale}</p>
                  {ref.decisionBy && <p className="text-xs text-muted-foreground mt-1">Decision by: {getStaffName(ref.decisionBy)} on {ref.decisionDate}</p>}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 14 — Admissions</strong> — Before admitting a child, the registered person must assess whether the placement is suitable, including impact on existing children. This tool documents the matching process, impact assessments, and decision rationale required by regulation.
        </div>
      </div>

      {/* ── dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <input placeholder="Child name" className="rounded border px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Age" className="rounded border px-3 py-2 text-sm" />
              <select className="rounded border px-3 py-2 text-sm"><option value="">Gender…</option><option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option></select>
            </div>
            <input placeholder="Local Authority" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Social Worker name" className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm"><option value="">Placement type…</option><option>Long-term residential</option><option>Emergency placement</option><option>Planned move from foster care</option><option>Step-down from secure</option></select>
            <textarea placeholder="Presenting needs (one per line)" rows={3} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Risk factors (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Add Referral</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
