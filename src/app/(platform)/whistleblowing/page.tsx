"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type ConcernCategory = "safeguarding" | "malpractice" | "health_safety" | "financial" | "bullying" | "data_breach" | "discrimination" | "neglect" | "policy_breach" | "other";
type ConcernStatus = "received" | "investigating" | "escalated" | "resolved" | "closed_no_action";
type Severity = "low" | "medium" | "high" | "critical";

interface TimelineEntry {
  date: string;
  action: string;
  by: string;
}

interface WhistleblowingConcern {
  id: string;
  reference: string;
  dateRaised: string;
  raisedBy: string;
  anonymous: boolean;
  category: ConcernCategory;
  severity: Severity;
  status: ConcernStatus;
  subjectOfConcern: string;
  summary: string;
  detail: string;
  evidenceProvided: string[];
  assignedTo: string;
  externalReferral: string | null;
  outcome: string;
  lessonsLearned: string;
  timeline: TimelineEntry[];
  protectionMeasures: string[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: WhistleblowingConcern[] = [
  {
    id: "wb1", reference: "WB-2025-001", dateRaised: d(-45), raisedBy: "staff_anna", anonymous: false,
    category: "safeguarding", severity: "high", status: "resolved",
    subjectOfConcern: "Agency staff member — Name withheld",
    summary: "Concern about inappropriate physical contact between agency staff and young person during restraint incident.",
    detail: "Staff member Anna reported observing an agency worker using a non-approved hold during a low-level incident with Jordan. The hold involved arm restraint that is not part of the home's approved PRICE training. The agency worker appeared frustrated and used more force than the situation warranted. Anna intervened immediately and de-escalated.",
    evidenceProvided: ["Written statement from Anna", "CCTV footage reviewed", "Incident report cross-referenced"],
    assignedTo: "staff_darren",
    externalReferral: "LADO referral made — Ref: LADO-2025-0334",
    outcome: "Investigation confirmed inappropriate restraint technique. Agency worker removed from roster and agency notified. LADO consultation confirmed no threshold for formal investigation but recommended training review. Home's agency induction process strengthened to include observed restraint competency assessment.",
    lessonsLearned: "Agency staff induction must include live observation of de-escalation and restraint competency before unsupervised work. Checklist updated.",
    timeline: [
      { date: d(-45), action: "Concern raised by Anna Kowalski verbally and in writing.", by: "staff_anna" },
      { date: d(-45), action: "RM acknowledged concern. Immediate safeguarding actions: agency worker removed from shift.", by: "staff_darren" },
      { date: d(-44), action: "CCTV reviewed — confirms concern. LADO consulted.", by: "staff_darren" },
      { date: d(-43), action: "Formal LADO referral submitted. Agency notified.", by: "staff_darren" },
      { date: d(-35), action: "LADO response — no formal investigation, training recommendation.", by: "staff_darren" },
      { date: d(-30), action: "Agency induction process updated. Concern resolved.", by: "staff_darren" },
    ],
    protectionMeasures: ["Anna thanked for raising concern", "Confidentiality maintained throughout", "No negative impact on Anna's role or shifts", "Supervision session included debrief and support"],
  },
  {
    id: "wb2", reference: "WB-2025-002", dateRaised: d(-20), raisedBy: "anonymous", anonymous: true,
    category: "policy_breach", severity: "medium", status: "investigating",
    subjectOfConcern: "Unnamed staff member",
    summary: "Anonymous concern about a staff member allegedly using personal mobile phone to photograph the rota and share on personal social media.",
    detail: "Anonymous note left in RM's pigeonhole stating that a member of staff has been taking photos of the rota on their personal phone and sharing it in a private WhatsApp group where they make negative comments about shifts and management. The note did not identify the specific staff member but mentioned it happens regularly on night shifts.",
    evidenceProvided: ["Anonymous handwritten note"],
    assignedTo: "staff_darren",
    externalReferral: null,
    outcome: "",
    lessonsLearned: "",
    timeline: [
      { date: d(-20), action: "Anonymous concern received via note in RM pigeonhole.", by: "staff_darren" },
      { date: d(-19), action: "RM reviewed concern. Data protection implications noted. All staff reminded of social media and data policy.", by: "staff_darren" },
      { date: d(-15), action: "Team meeting — general reminder about data protection, rota confidentiality, and social media policy. No individual identified.", by: "staff_darren" },
      { date: d(-10), action: "Individual supervisions used to explore understanding of data policy. Investigation ongoing.", by: "staff_darren" },
    ],
    protectionMeasures: ["Anonymous reporter's identity protected", "General team approach — no individual singled out", "Policy reminder issued to all staff"],
  },
  {
    id: "wb3", reference: "WB-2025-003", dateRaised: d(-7), raisedBy: "staff_edward", anonymous: false,
    category: "neglect", severity: "high", status: "escalated",
    subjectOfConcern: "Night shift practice",
    summary: "Concern that young people's night-time needs are not being consistently met during waking night shifts.",
    detail: "Edward reported that on two occasions when arriving for early morning shifts, he found evidence that night check records had been completed but the actual checks may not have been carried out as described. On one occasion, a young person reported they had called out during the night but nobody came. On another, the kitchen showed signs of a young person having accessed it unsupervised overnight (food wrappers, open fridge) despite the night check log showing all young people in bed.",
    evidenceProvided: ["Written statement from Edward", "Young person's verbal account", "Photographs of kitchen state", "Night check log entries"],
    assignedTo: "staff_darren",
    externalReferral: "Ofsted notified as potential Reg 40 matter — Ref: OFS-2025-NE-112",
    outcome: "",
    lessonsLearned: "",
    timeline: [
      { date: d(-7), action: "Concern raised by Edward Williams in supervision session.", by: "staff_edward" },
      { date: d(-7), action: "RM initiated immediate investigation. Night shift records reviewed for past 30 days.", by: "staff_darren" },
      { date: d(-6), action: "Young person interviewed (with advocate). Confirmed calling out once without response.", by: "staff_darren" },
      { date: d(-5), action: "Ofsted notified under Reg 40. CCTV footage from relevant nights requested.", by: "staff_darren" },
      { date: d(-3), action: "Disciplinary process initiated for identified night staff. Cover arrangements made.", by: "staff_darren" },
    ],
    protectionMeasures: ["Edward assured of whistleblower protection", "No retaliation — Edward's shifts maintained as normal", "Confidential handling throughout", "Support offered to young person who was affected"],
  },
  {
    id: "wb4", reference: "WB-2025-004", dateRaised: d(-60), raisedBy: "staff_chervelle", anonymous: false,
    category: "financial", severity: "low", status: "closed_no_action",
    subjectOfConcern: "Petty cash process",
    summary: "Concern about petty cash receipts not always being obtained for small purchases.",
    detail: "Chervelle noted that on a few occasions, small purchases (under £5) made from petty cash did not have receipts, with staff writing 'no receipt available' in the log. She was concerned this could lead to financial irregularities over time.",
    evidenceProvided: ["Petty cash log entries highlighted"],
    assignedTo: "staff_darren",
    externalReferral: null,
    outcome: "Review of petty cash log confirmed 4 entries without receipts over 3 months, all under £5, all with reasonable explanations (parking meters, market stalls). No evidence of financial irregularity. However, policy clarified: all purchases require a receipt or a signed declaration from two staff members if genuinely unavailable.",
    lessonsLearned: "Petty cash policy updated to include dual-signature declaration process for receipt-less transactions. Good practice concern — no wrongdoing found.",
    timeline: [
      { date: d(-60), action: "Concern raised by Chervelle during team meeting feedback.", by: "staff_chervelle" },
      { date: d(-58), action: "Petty cash log reviewed — 4 instances identified over 3 months.", by: "staff_darren" },
      { date: d(-55), action: "All 4 instances investigated — reasonable explanations confirmed.", by: "staff_darren" },
      { date: d(-50), action: "Policy updated with dual-signature process. Concern closed — no action.", by: "staff_darren" },
    ],
    protectionMeasures: ["Chervelle thanked for raising valid process concern", "Framed as positive quality improvement"],
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const CAT_LABELS: Record<ConcernCategory, string> = {
  safeguarding: "Safeguarding", malpractice: "Malpractice", health_safety: "Health & Safety",
  financial: "Financial", bullying: "Bullying / Harassment", data_breach: "Data Breach",
  discrimination: "Discrimination", neglect: "Neglect of Duty", policy_breach: "Policy Breach", other: "Other",
};

const STATUS_META: Record<ConcernStatus, { label: string; colour: string }> = {
  received:        { label: "Received",       colour: "bg-blue-100 text-blue-700" },
  investigating:   { label: "Investigating",  colour: "bg-amber-100 text-amber-700" },
  escalated:       { label: "Escalated",      colour: "bg-red-100 text-red-700" },
  resolved:        { label: "Resolved",       colour: "bg-green-100 text-green-700" },
  closed_no_action:{ label: "Closed",         colour: "bg-gray-100 text-gray-700" },
};

const SEV_META: Record<Severity, { label: string; colour: string }> = {
  low:      { label: "Low",      colour: "bg-green-100 text-green-700" },
  medium:   { label: "Medium",   colour: "bg-amber-100 text-amber-700" },
  high:     { label: "High",     colour: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function WhistleblowingPage() {
  const [data] = useState<WhistleblowingConcern[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((c) => ["received","investigating","escalated"].includes(c.status)).length,
    escalated: data.filter((c) => c.status === "escalated").length,
    resolved: data.filter((c) => c.status === "resolved" || c.status === "closed_no_action").length,
    anonymous: data.filter((c) => c.anonymous).length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((c) => c.status === filterStatus);
    if (filterCat !== "all") list = list.filter((c) => c.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.summary.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q) || c.subjectOfConcern.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity": return Object.keys(SEV_META).indexOf(b.severity) - Object.keys(SEV_META).indexOf(a.severity);
        case "status":   return Object.keys(STATUS_META).indexOf(a.status) - Object.keys(STATUS_META).indexOf(b.status);
        case "ref":      return a.reference.localeCompare(b.reference);
        default:         return b.dateRaised.localeCompare(a.dateRaised);
      }
    });
    return list;
  }, [data, filterStatus, filterCat, search, sortBy]);

  const exportData = useMemo(() => data.map((c) => ({
    reference: c.reference,
    dateRaised: c.dateRaised,
    raisedBy: c.anonymous ? "Anonymous" : getStaffName(c.raisedBy),
    category: CAT_LABELS[c.category],
    severity: SEV_META[c.severity].label,
    status: STATUS_META[c.status].label,
    subject: c.subjectOfConcern,
    summary: c.summary,
    assignedTo: getStaffName(c.assignedTo),
    externalReferral: c.externalReferral || "None",
    outcome: c.outcome || "Pending",
    lessonsLearned: c.lessonsLearned || "Pending",
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Reference",        accessor: (r: typeof exportData[number]) => r.reference },
    { header: "Date Raised",      accessor: (r: typeof exportData[number]) => r.dateRaised },
    { header: "Raised By",        accessor: (r: typeof exportData[number]) => r.raisedBy },
    { header: "Category",         accessor: (r: typeof exportData[number]) => r.category },
    { header: "Severity",         accessor: (r: typeof exportData[number]) => r.severity },
    { header: "Status",           accessor: (r: typeof exportData[number]) => r.status },
    { header: "Subject",          accessor: (r: typeof exportData[number]) => r.subject },
    { header: "Summary",          accessor: (r: typeof exportData[number]) => r.summary },
    { header: "Assigned To",      accessor: (r: typeof exportData[number]) => r.assignedTo },
    { header: "External Referral",accessor: (r: typeof exportData[number]) => r.externalReferral },
    { header: "Outcome",          accessor: (r: typeof exportData[number]) => r.outcome },
    { header: "Lessons Learned",  accessor: (r: typeof exportData[number]) => r.lessonsLearned },
  ];

  return (
    <PageShell
      title="Whistleblowing & Concerns"
      subtitle="Confidential concern reporting — staff protection and accountability"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="whistleblowing" />
          <PrintButton title="Whistleblowing Log" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Raise Concern
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Concerns", v: stats.total, icon: ShieldAlert, c: "text-blue-600" },
            { l: "Active",         v: stats.active, icon: Clock, c: "text-amber-600" },
            { l: "Escalated",      v: stats.escalated, icon: AlertTriangle, c: "text-red-600" },
            { l: "Resolved",       v: stats.resolved, icon: CheckCircle2, c: "text-green-600" },
            { l: "Anonymous",      v: stats.anonymous, icon: Eye, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.escalated > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>{stats.escalated} concern{stats.escalated > 1 ? "s" : ""}</strong> escalated to external bodies — requires priority management response.</p>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search concerns…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date Raised</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
              <option value="ref">Reference</option>
            </select>
          </div>
        </div>

        {/* cards */}
        {filtered.map((concern) => (
          <div key={concern.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === concern.id ? null : concern.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{concern.reference}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[concern.status].colour)}>{STATUS_META[concern.status].label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SEV_META[concern.severity].colour)}>{SEV_META[concern.severity].label}</span>
                    {concern.anonymous && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Anonymous</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{CAT_LABELS[concern.category]} · {concern.dateRaised} · {concern.summary.slice(0, 80)}…</p>
                </div>
              </div>
              {expanded === concern.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === concern.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Raised By:</span> {concern.anonymous ? "Anonymous" : getStaffName(concern.raisedBy)}</div>
                  <div><span className="text-muted-foreground">Assigned To:</span> {getStaffName(concern.assignedTo)}</div>
                  <div><span className="text-muted-foreground">Subject:</span> {concern.subjectOfConcern}</div>
                  {concern.externalReferral && <div><span className="text-muted-foreground">External:</span> {concern.externalReferral}</div>}
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Detail</h4>
                  <p className="text-sm text-muted-foreground">{concern.detail}</p>
                </div>

                {concern.evidenceProvided.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Evidence Provided</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">{concern.evidenceProvided.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}

                {/* timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Investigation Timeline</h4>
                  <div className="space-y-2 border-l-2 border-gray-200 pl-4">
                    {concern.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-brand bg-white" />
                        <p className="text-xs text-muted-foreground">{t.date} · {getStaffName(t.by)}</p>
                        <p className="text-sm">{t.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* protection */}
                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Whistleblower Protection Measures</h4>
                  <ul className="list-disc list-inside text-sm text-green-900">{concern.protectionMeasures.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>

                {concern.outcome && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Outcome</h4>
                    <p className="text-sm text-blue-900">{concern.outcome}</p>
                  </div>
                )}

                {concern.lessonsLearned && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Lessons Learned</h4>
                    <p className="text-sm text-amber-900">{concern.lessonsLearned}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Public Interest Disclosure Act 1998 / Reg 34</strong> — Staff must be able to raise concerns without fear of reprisal. The registered person must have procedures for receiving and acting on representations and complaints, including from staff. Whistleblowers are protected by law from detrimental treatment.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Raise a Concern</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anonymous" className="rounded border" />
              <label htmlFor="anonymous" className="text-sm">Raise anonymously</label>
            </div>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Category…</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Severity…</option>{Object.entries(SEV_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <input placeholder="Subject of concern" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Summary" rows={2} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Full detail" rows={4} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Evidence provided" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Submit Concern</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
