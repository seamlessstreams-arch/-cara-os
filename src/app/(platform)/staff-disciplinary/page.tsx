"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gavel,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
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

type DisciplinaryCategory = "misconduct" | "gross_misconduct" | "performance" | "attendance" | "policy_breach" | "safeguarding" | "professional_boundaries" | "substance_misuse" | "other";
type DisciplinaryStage = "informal_warning" | "investigation" | "first_written" | "final_written" | "dismissal_hearing" | "dismissed" | "resigned" | "no_case" | "appeal";
type Severity = "minor" | "serious" | "gross";

interface TimelineEntry {
  date: string;
  action: string;
  by: string;
  notes: string;
}

interface DisciplinaryRecord {
  id: string;
  staffMember: string;
  dateRaised: string;
  category: DisciplinaryCategory;
  severity: Severity;
  stage: DisciplinaryStage;
  allegation: string;
  investigator: string | null;
  investigationStartDate: string | null;
  investigationEndDate: string | null;
  suspended: boolean;
  suspensionDate: string | null;
  suspensionReviewDates: string[];
  hearingDate: string | null;
  hearingPanel: string[];
  outcome: string;
  sanctionExpiryDate: string | null;
  appealLodged: boolean;
  appealDate: string | null;
  appealOutcome: string;
  timeline: TimelineEntry[];
  supportOffered: string[];
  laDoNotified: boolean;
  dBSReferral: boolean;
  ofstedNotified: boolean;
  confidentialityLevel: "standard" | "restricted" | "highly_restricted";
  tradeUnionRep: string | null;
  lessonsLearned: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABELS: Record<DisciplinaryCategory, string> = {
  misconduct: "Misconduct", gross_misconduct: "Gross Misconduct", performance: "Performance",
  attendance: "Attendance", policy_breach: "Policy Breach", safeguarding: "Safeguarding",
  professional_boundaries: "Professional Boundaries", substance_misuse: "Substance Misuse", other: "Other",
};

const STAGE_LABELS: Record<DisciplinaryStage, string> = {
  informal_warning: "Informal Warning", investigation: "Investigation",
  first_written: "First Written Warning", final_written: "Final Written Warning",
  dismissal_hearing: "Dismissal Hearing", dismissed: "Dismissed",
  resigned: "Resigned", no_case: "No Case to Answer", appeal: "Appeal",
};
const STAGE_COLOURS: Record<DisciplinaryStage, string> = {
  informal_warning: "bg-blue-100 text-blue-800", investigation: "bg-purple-100 text-purple-800",
  first_written: "bg-amber-100 text-amber-800", final_written: "bg-orange-100 text-orange-800",
  dismissal_hearing: "bg-red-100 text-red-800", dismissed: "bg-red-200 text-red-900",
  resigned: "bg-gray-100 text-gray-700", no_case: "bg-green-100 text-green-800", appeal: "bg-indigo-100 text-indigo-800",
};

const SEV_LABELS: Record<Severity, string> = { minor: "Minor", serious: "Serious", gross: "Gross" };
const SEV_COLOURS: Record<Severity, string> = {
  minor: "bg-amber-100 text-amber-800", serious: "bg-orange-100 text-orange-800", gross: "bg-red-100 text-red-800",
};

const SEED: DisciplinaryRecord[] = [
  {
    id: "dp1", staffMember: "staff_diane", dateRaised: d(-40), category: "attendance",
    severity: "minor", stage: "first_written",
    allegation: "Persistent lateness — 8 occasions of arriving more than 15 minutes late for shift in a 3-month period, impacting handover quality and colleague workload.",
    investigator: "staff_ryan", investigationStartDate: d(-38), investigationEndDate: d(-28),
    suspended: false, suspensionDate: null, suspensionReviewDates: [],
    hearingDate: d(-25), hearingPanel: ["staff_darren"],
    outcome: "First written warning issued. Valid for 6 months. Attendance management plan put in place with fortnightly reviews. Any recurrence within 6 months will trigger escalation to final written warning.",
    sanctionExpiryDate: d(140), appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-40), action: "Lateness pattern identified by deputy", by: "staff_ryan", notes: "8 occasions in 12 weeks — all documented in rota system" },
      { date: d(-38), action: "Investigation meeting with staff member", by: "staff_ryan", notes: "Diane acknowledged pattern. Cited childcare issues." },
      { date: d(-35), action: "Informal support meeting", by: "staff_ryan", notes: "Explored flexible start times — not possible due to handover requirements" },
      { date: d(-28), action: "Investigation report completed", by: "staff_ryan", notes: "Recommended formal hearing" },
      { date: d(-25), action: "Disciplinary hearing held", by: "staff_darren", notes: "Diane attended with union rep. Full mitigation heard." },
      { date: d(-23), action: "Outcome letter sent", by: "staff_darren", notes: "First written warning. Attendance plan attached." },
    ],
    supportOffered: ["Flexible shift pattern explored", "Childcare signposting", "Attendance management plan with regular reviews", "Union representation at hearing"],
    laDoNotified: false, dBSReferral: false, ofstedNotified: false,
    confidentialityLevel: "restricted", tradeUnionRep: "UNISON — Mark Fielding",
    lessonsLearned: "Need earlier informal intervention when attendance patterns emerge. Rota system should flag patterns automatically.",
    notes: "Diane responding well to attendance plan. First 2 reviews showed improvement. Next review in 2 weeks.",
  },
  {
    id: "dp2", staffMember: "staff_lackson", dateRaised: d(-90), category: "policy_breach",
    severity: "serious", stage: "no_case",
    allegation: "Alleged failure to follow medication administration procedure — administering medication without a second witness check on one occasion.",
    investigator: "staff_darren", investigationStartDate: d(-88), investigationEndDate: d(-70),
    suspended: false, suspensionDate: null, suspensionReviewDates: [],
    hearingDate: null, hearingPanel: [],
    outcome: "No case to answer. Investigation found that the second checker was present but had not signed the MAR chart at the time of the audit. Both staff members confirmed the dual check occurred. Process issue rather than safety concern. MAR chart signing procedure clarified with all staff.",
    sanctionExpiryDate: null, appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-90), action: "Concern raised during medication audit", by: "staff_darren", notes: "Missing second signature on MAR chart" },
      { date: d(-88), action: "Investigation commenced", by: "staff_darren", notes: "Both staff members interviewed separately" },
      { date: d(-80), action: "Witness statement obtained", by: "staff_darren", notes: "Confirmed dual check did occur — signing oversight" },
      { date: d(-70), action: "Investigation concluded — no case to answer", by: "staff_darren", notes: "Outcome letter sent to Lackson with full explanation" },
    ],
    supportOffered: ["Reassurance that no case found", "Medication refresher offered (voluntary)", "Support during investigation period"],
    laDoNotified: false, dBSReferral: false, ofstedNotified: false,
    confidentialityLevel: "standard", tradeUnionRep: null,
    lessonsLearned: "MAR chart signing procedure needed clarifying — 'sign at time of administration, not later.' Team briefing delivered. Audit process updated to check signatures within 24 hours to prevent escalation of administrative gaps.",
    notes: "Lackson appreciated the thorough but fair investigation. Voluntarily completed medication refresher.",
  },
  {
    id: "dp3", staffMember: "staff_edward", dateRaised: d(-15), category: "professional_boundaries",
    severity: "serious", stage: "investigation",
    allegation: "Concern raised that staff member shared personal mobile number with a young person. Alleged breach of professional boundaries policy.",
    investigator: "staff_darren", investigationStartDate: d(-13), investigationEndDate: null,
    suspended: false, suspensionDate: null, suspensionReviewDates: [],
    hearingDate: null, hearingPanel: [],
    outcome: "",
    sanctionExpiryDate: null, appealLodged: false, appealDate: null, appealOutcome: "",
    timeline: [
      { date: d(-15), action: "Concern raised by colleague", by: "staff_anna", notes: "Overheard YP reference having Edward's number" },
      { date: d(-14), action: "RM consulted — decision to investigate", by: "staff_darren", notes: "Low risk assessment — no suspension required" },
      { date: d(-13), action: "Investigation commenced", by: "staff_darren", notes: "Edward informed of allegation" },
      { date: d(-10), action: "Edward's initial response taken", by: "staff_darren", notes: "Edward states number was given in an emergency situation when transport broke down. Acknowledges policy breach." },
      { date: d(-7), action: "YP interviewed (age-appropriate)", by: "staff_darren", notes: "YP confirms context. No concerning communications found." },
    ],
    supportOffered: ["Continued normal duties (no suspension)", "Union representation offered", "Supervision support from RM"],
    laDoNotified: false, dBSReferral: false, ofstedNotified: false,
    confidentialityLevel: "restricted", tradeUnionRep: null,
    lessonsLearned: "",
    notes: "Investigation ongoing. Preliminary findings suggest low-risk context but policy breach occurred. Need to ensure emergency communication procedure is clear to all staff so this situation doesn't recur.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  staffMember: string; dateRaised: string; category: string; severity: string;
  stage: string; allegation: string; investigator: string; outcome: string;
  suspended: string; sanctionExpiry: string; appeal: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Staff Member",    accessor: (r: FlatRow) => r.staffMember },
  { header: "Date Raised",     accessor: (r: FlatRow) => r.dateRaised },
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Severity",        accessor: (r: FlatRow) => r.severity },
  { header: "Stage",           accessor: (r: FlatRow) => r.stage },
  { header: "Allegation",      accessor: (r: FlatRow) => r.allegation },
  { header: "Investigator",    accessor: (r: FlatRow) => r.investigator },
  { header: "Outcome",         accessor: (r: FlatRow) => r.outcome },
  { header: "Suspended",       accessor: (r: FlatRow) => r.suspended },
  { header: "Sanction Expiry", accessor: (r: FlatRow) => r.sanctionExpiry },
  { header: "Appeal",          accessor: (r: FlatRow) => r.appeal },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function StaffDisciplinaryPage() {
  const [data] = useState<DisciplinaryRecord[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const active = data.filter((r) => !["no_case", "dismissed", "resigned"].includes(r.stage)).length;
    const resolved = data.filter((r) => ["no_case", "dismissed", "resigned"].includes(r.stage)).length;
    const suspended = data.filter((r) => r.suspended).length;
    const underInvestigation = data.filter((r) => r.stage === "investigation").length;
    return { active, resolved, suspended, underInvestigation };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => getStaffName(r.staffMember).toLowerCase().includes(q) || r.allegation.toLowerCase().includes(q));
    }
    if (filterStage !== "all") list = list.filter((r) => r.stage === filterStage);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.dateRaised.localeCompare(a.dateRaised)); break;
      case "severity": { const o: Record<string, number> = { gross: 0, serious: 1, minor: 2 }; out.sort((a, b) => o[a.severity] - o[b.severity]); break; }
      case "stage": out.sort((a, b) => a.stage.localeCompare(b.stage)); break;
    }
    return out;
  }, [data, search, filterStage, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    data.map((r) => ({
      staffMember: getStaffName(r.staffMember), dateRaised: r.dateRaised,
      category: CAT_LABELS[r.category], severity: SEV_LABELS[r.severity],
      stage: STAGE_LABELS[r.stage], allegation: r.allegation,
      investigator: r.investigator ? getStaffName(r.investigator) : "—",
      outcome: r.outcome || "Pending", suspended: r.suspended ? "Yes" : "No",
      sanctionExpiry: r.sanctionExpiryDate ?? "—",
      appeal: r.appealLodged ? `Yes — ${r.appealOutcome || "Pending"}` : "No",
      notes: r.notes,
    })), [data]);

  return (
    <PageShell
      title="Staff Disciplinary"
      subtitle="Confidential disciplinary procedure — investigation, hearing and outcomes"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Disciplinary" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="staff-disciplinary" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Case
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Cases", value: stats.active, icon: Gavel, colour: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, colour: "text-green-600" },
          { label: "Suspended", value: stats.suspended, icon: Shield, colour: stats.suspended > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Under Investigation", value: stats.underInvestigation, icon: Clock, colour: stats.underInvestigation > 0 ? "text-purple-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {stats.underInvestigation > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-purple-300 bg-purple-50 p-4">
          <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-semibold text-purple-800">Active Investigation(s)</p>
            <p className="text-sm text-purple-700">{stats.underInvestigation} case(s) currently under investigation. Ensure timescales are being met and staff are being supported.</p>
          </div>
        </div>
      )}

      <div id="disciplinary-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff or allegations…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Gavel className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getStaffName(r.staffMember)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STAGE_COLOURS[r.stage])}>{STAGE_LABELS[r.stage]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SEV_COLOURS[r.severity])}>{SEV_LABELS[r.severity]}</span>
                    {r.confidentialityLevel !== "standard" && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white flex items-center gap-1"><Shield className="h-3 w-3" />{r.confidentialityLevel.replace("_"," ")}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.dateRaised} · {CAT_LABELS[r.category]}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Allegation</h4>
                    <p className="text-sm">{r.allegation}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Investigator:</span> <span className="font-medium">{r.investigator ? getStaffName(r.investigator) : "Pending"}</span></div>
                    {r.hearingDate && <div><span className="text-gray-500">Hearing:</span> <span className="font-medium">{r.hearingDate}</span></div>}
                    {r.sanctionExpiryDate && <div><span className="text-gray-500">Sanction Expires:</span> <span className="font-medium">{r.sanctionExpiryDate}</span></div>}
                    {r.tradeUnionRep && <div><span className="text-gray-500">TU Rep:</span> <span className="font-medium">{r.tradeUnionRep}</span></div>}
                  </div>

                  {r.suspended && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Suspension Active</h4>
                      <p className="text-sm text-red-800">Suspended since {r.suspensionDate}. Reviews: {r.suspensionReviewDates.join(", ") || "None yet"}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {r.laDoNotified && <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">LADO Notified</span>}
                    {r.dBSReferral && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">DBS Referral Made</span>}
                    {r.ofstedNotified && <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">Ofsted Notified</span>}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Timeline</h4>
                    <div className="space-y-2 ml-3 border-l-2 border-gray-200 pl-4">
                      {r.timeline.map((t, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                          <p className="text-sm font-medium">{t.action}</p>
                          <p className="text-xs text-gray-500">{t.date} — {getStaffName(t.by)}</p>
                          {t.notes && <p className="text-xs text-gray-600 italic">{t.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.outcome && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Outcome</h4>
                      <p className="text-sm text-green-800">{r.outcome}</p>
                    </div>
                  )}

                  {r.supportOffered.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Support Offered</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.supportOffered.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {r.lessonsLearned && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Lessons Learned</h4>
                      <p className="text-sm text-purple-800">{r.lessonsLearned}</p>
                    </div>
                  )}

                  {r.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Disciplinary Procedure:</strong> All disciplinary matters must follow ACAS code of practice. Staff have the right to be accompanied by a trade union representative or colleague. Allegations involving children must be reported to the LADO and may require Ofsted notification. Suspensions must be reviewed at least every 2 weeks. All outcomes must be proportionate, documented, and subject to right of appeal. DBS referral is required when a staff member is dismissed or resigns during investigation for harm or risk to children.
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Disciplinary Case</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Staff Member</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{["staff_darren","staff_ryan","staff_edward","staff_anna","staff_chervelle","staff_diane","staff_lackson","staff_mirela"].map((id) => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(SEV_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Allegation</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Details of the allegation…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Case</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
