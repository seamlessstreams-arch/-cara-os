"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ShieldCheck,
  Shield,
  XCircle,
  Award,
  Users,
  BarChart3,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }        from "@/components/ui/badge";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type CompetencyLevel = "competent" | "developing" | "not_assessed" | "expired";

interface CompetencyEntry {
  id: string;
  area: string;
  level: CompetencyLevel;
  assessedDate: string | null;
  assessedBy: string | null;
  expiryDate: string | null;
  notes: string;
}

interface StaffCompetency {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  entries: CompetencyEntry[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const COMPETENCY_AREAS = [
  "Safeguarding (Level 3)",
  "Medication Administration",
  "TCI/Restraint",
  "First Aid",
  "Fire Safety",
  "Record Keeping",
  "Key Working",
  "Lone Working",
  "ASD Awareness",
  "Exploitation Awareness",
] as const;

const SEED: StaffCompetency[] = [
  {
    id: "sc1", staffId: "staff_ryan", staffName: "Ryan Forsythe", role: "Deputy Manager",
    entries: [
      { id: "sc1-1", area: "Safeguarding (Level 3)", level: "competent", assessedDate: d(-90), assessedBy: "staff_darren", expiryDate: d(275), notes: "Level 3 safeguarding assessed. Strong understanding of thresholds and referral pathways." },
      { id: "sc1-2", area: "Medication Administration", level: "competent", assessedDate: d(-60), assessedBy: "staff_darren", expiryDate: d(305), notes: "Observed three rounds. Accurate and methodical." },
      { id: "sc1-3", area: "TCI/Restraint", level: "competent", assessedDate: d(-45), assessedBy: "staff_darren", expiryDate: d(320), notes: "Team Teach refresher completed. Practical competency demonstrated." },
      { id: "sc1-4", area: "First Aid", level: "competent", assessedDate: d(-120), assessedBy: "staff_darren", expiryDate: d(245), notes: "3-day First Aid at Work certificate valid." },
      { id: "sc1-5", area: "Fire Safety", level: "competent", assessedDate: d(-30), assessedBy: "staff_darren", expiryDate: null, notes: "Led fire drill. Full procedural knowledge confirmed." },
      { id: "sc1-6", area: "Record Keeping", level: "competent", assessedDate: d(-50), assessedBy: "staff_darren", expiryDate: null, notes: "Consistent high-quality daily logs and reports." },
      { id: "sc1-7", area: "Key Working", level: "competent", assessedDate: d(-70), assessedBy: "staff_darren", expiryDate: null, notes: "Effective key working relationship with all YP. Person-centred approach evident." },
      { id: "sc1-8", area: "Lone Working", level: "competent", assessedDate: d(-80), assessedBy: "staff_darren", expiryDate: null, notes: "Lone working risk assessment completed and signed off." },
      { id: "sc1-9", area: "ASD Awareness", level: "competent", assessedDate: d(-40), assessedBy: "staff_darren", expiryDate: null, notes: "ASD awareness training completed. Good understanding of sensory needs and communication adaptations." },
      { id: "sc1-10", area: "Exploitation Awareness", level: "competent", assessedDate: d(-55), assessedBy: "staff_darren", expiryDate: null, notes: "CE/CSE awareness training completed. Can identify indicators and knows NRM referral process." },
    ],
  },
  {
    id: "sc2", staffId: "staff_anna", staffName: "Anna Lingolo", role: "Residential Care Worker",
    entries: [
      { id: "sc2-1", area: "Safeguarding (Level 3)", level: "competent", assessedDate: d(-85), assessedBy: "staff_darren", expiryDate: d(280), notes: "Safeguarding competent. Strong disclosure handling demonstrated." },
      { id: "sc2-2", area: "Medication Administration", level: "competent", assessedDate: d(-75), assessedBy: "staff_ryan", expiryDate: d(290), notes: "Competent across all MAR procedures. PRN protocol understood." },
      { id: "sc2-3", area: "TCI/Restraint", level: "competent", assessedDate: d(-50), assessedBy: "staff_darren", expiryDate: d(315), notes: "Team Teach refresher passed. De-escalation skills strong." },
      { id: "sc2-4", area: "First Aid", level: "competent", assessedDate: d(-100), assessedBy: "staff_darren", expiryDate: d(265), notes: "Emergency First Aid certificate valid." },
      { id: "sc2-5", area: "Fire Safety", level: "competent", assessedDate: d(-35), assessedBy: "staff_ryan", expiryDate: null, notes: "Participated in fire drill. Evacuation procedure fully understood." },
      { id: "sc2-6", area: "Record Keeping", level: "competent", assessedDate: d(-55), assessedBy: "staff_darren", expiryDate: null, notes: "Recording practice is detailed and timely." },
      { id: "sc2-7", area: "Key Working", level: "competent", assessedDate: d(-65), assessedBy: "staff_darren", expiryDate: null, notes: "Key worker for Jordan. Good relationship built." },
      { id: "sc2-8", area: "Lone Working", level: "competent", assessedDate: d(-70), assessedBy: "staff_ryan", expiryDate: null, notes: "Lone working assessment completed. Note: LADO restrictions may affect some unsupervised tasks — review with RM." },
      { id: "sc2-9", area: "ASD Awareness", level: "developing", assessedDate: d(-20), assessedBy: "staff_darren", expiryDate: null, notes: "Attended introductory session. Needs further practical observation with ASD-specific scenarios. Booked onto advanced module." },
      { id: "sc2-10", area: "Exploitation Awareness", level: "competent", assessedDate: d(-60), assessedBy: "staff_darren", expiryDate: null, notes: "Good awareness of CE/CSE indicators. Contributed well to contextual safeguarding mapping." },
    ],
  },
  {
    id: "sc3", staffId: "staff_chervelle", staffName: "Chervelle Kinina", role: "Residential Care Worker",
    entries: [
      { id: "sc3-1", area: "Safeguarding (Level 3)", level: "competent", assessedDate: d(-70), assessedBy: "staff_darren", expiryDate: d(295), notes: "Level 3 safeguarding assessed. Clear on thresholds." },
      { id: "sc3-2", area: "Medication Administration", level: "competent", assessedDate: d(-65), assessedBy: "staff_ryan", expiryDate: d(300), notes: "Competent. Observed administering all routes correctly." },
      { id: "sc3-3", area: "TCI/Restraint", level: "competent", assessedDate: d(-40), assessedBy: "staff_darren", expiryDate: d(325), notes: "Team Teach certified. Used holds appropriately during recent incident." },
      { id: "sc3-4", area: "First Aid", level: "competent", assessedDate: d(-110), assessedBy: "staff_darren", expiryDate: d(255), notes: "First Aid at Work certificate valid." },
      { id: "sc3-5", area: "Fire Safety", level: "competent", assessedDate: d(-25), assessedBy: "staff_ryan", expiryDate: null, notes: "Fire warden trained. Can lead evacuation." },
      { id: "sc3-6", area: "Record Keeping", level: "competent", assessedDate: d(-45), assessedBy: "staff_darren", expiryDate: null, notes: "Consistently thorough. Good narrative recording style." },
      { id: "sc3-7", area: "Key Working", level: "competent", assessedDate: d(-50), assessedBy: "staff_darren", expiryDate: null, notes: "Key worker for Casey. Building strong therapeutic relationship." },
      { id: "sc3-8", area: "Lone Working", level: "developing", assessedDate: d(-15), assessedBy: "staff_ryan", expiryDate: null, notes: "Initial assessment completed. Needs two further observed lone shifts before full sign-off. Scheduled for next fortnight." },
      { id: "sc3-9", area: "ASD Awareness", level: "competent", assessedDate: d(-30), assessedBy: "staff_darren", expiryDate: null, notes: "Completed ASD awareness module. Applied learning well with sensory-sensitive YP." },
      { id: "sc3-10", area: "Exploitation Awareness", level: "competent", assessedDate: d(-35), assessedBy: "staff_darren", expiryDate: null, notes: "Specialist knowledge. Completed multi-agency exploitation awareness course. Leads contextual safeguarding mapping." },
    ],
  },
  {
    id: "sc4", staffId: "staff_edward", staffName: "Edward Fitzpatrick", role: "Residential Care Worker",
    entries: [
      { id: "sc4-1", area: "Safeguarding (Level 3)", level: "competent", assessedDate: d(-95), assessedBy: "staff_darren", expiryDate: d(270), notes: "Safeguarding competent. Good understanding of disclosure protocol." },
      { id: "sc4-2", area: "Medication Administration", level: "expired", assessedDate: d(-380), assessedBy: "staff_ryan", expiryDate: d(-15), notes: "Competency expired. Re-assessment required before resuming medication rounds. Booked for re-assessment next week." },
      { id: "sc4-3", area: "TCI/Restraint", level: "developing", assessedDate: d(-10), assessedBy: "staff_darren", expiryDate: null, notes: "Attended refresher but practical component needs repeat. Some hesitation in hold transitions. Booked for follow-up session." },
      { id: "sc4-4", area: "First Aid", level: "expired", assessedDate: d(-400), assessedBy: "staff_darren", expiryDate: d(-35), notes: "Certificate expired. Must complete renewal before next shift pattern. Course booked." },
      { id: "sc4-5", area: "Fire Safety", level: "competent", assessedDate: d(-40), assessedBy: "staff_ryan", expiryDate: null, notes: "Fire safety knowledge confirmed during drill." },
      { id: "sc4-6", area: "Record Keeping", level: "developing", assessedDate: d(-20), assessedBy: "staff_darren", expiryDate: null, notes: "Improving but entries still lack sufficient detail. Action plan in place — supervised recording practice." },
      { id: "sc4-7", area: "Key Working", level: "competent", assessedDate: d(-60), assessedBy: "staff_darren", expiryDate: null, notes: "Key worker for Alex. Good rapport established." },
      { id: "sc4-8", area: "Lone Working", level: "developing", assessedDate: d(-25), assessedBy: "staff_ryan", expiryDate: null, notes: "Not yet fully signed off. Needs more experience before lone shift approval." },
      { id: "sc4-9", area: "ASD Awareness", level: "developing", assessedDate: d(-15), assessedBy: "staff_darren", expiryDate: null, notes: "Attended introductory session. Needs to demonstrate practical application." },
      { id: "sc4-10", area: "Exploitation Awareness", level: "developing", assessedDate: d(-18), assessedBy: "staff_darren", expiryDate: null, notes: "Basic awareness confirmed. Needs multi-agency course completion for full sign-off." },
    ],
  },
  {
    id: "sc5", staffId: "staff_mirela", staffName: "Mirela Tshawa Kalongo", role: "Residential Care Worker",
    entries: [
      { id: "sc5-1", area: "Safeguarding (Level 3)", level: "competent", assessedDate: d(-19), assessedBy: "staff_darren", expiryDate: d(346), notes: "Completed Level 3 safeguarding during induction. Score 92%. Good understanding demonstrated." },
      { id: "sc5-2", area: "Medication Administration", level: "not_assessed", assessedDate: null, assessedBy: null, expiryDate: null, notes: "Awaiting competency assessment. Currently observing medication rounds only — not administering independently." },
      { id: "sc5-3", area: "TCI/Restraint", level: "not_assessed", assessedDate: null, assessedBy: null, expiryDate: null, notes: "PRICE training course booked. Cannot participate in physical interventions until certified." },
      { id: "sc5-4", area: "First Aid", level: "competent", assessedDate: d(-21), assessedBy: "staff_darren", expiryDate: d(344), notes: "Emergency First Aid certificate obtained during induction week." },
      { id: "sc5-5", area: "Fire Safety", level: "competent", assessedDate: d(-18), assessedBy: "staff_ryan", expiryDate: null, notes: "Participated in live fire drill on third day. Procedure understood." },
      { id: "sc5-6", area: "Record Keeping", level: "developing", assessedDate: d(-10), assessedBy: "staff_darren", expiryDate: null, notes: "Learning recording standards. Entries reviewed daily by senior. Quality improving." },
      { id: "sc5-7", area: "Key Working", level: "not_assessed", assessedDate: null, assessedBy: null, expiryDate: null, notes: "Not yet assigned as primary key worker. Supporting Jordan as secondary worker." },
      { id: "sc5-8", area: "Lone Working", level: "not_assessed", assessedDate: null, assessedBy: null, expiryDate: null, notes: "Cannot complete until all shadow shifts are done. Still in induction period." },
      { id: "sc5-9", area: "ASD Awareness", level: "not_assessed", assessedDate: null, assessedBy: null, expiryDate: null, notes: "Module scheduled for month 3 of induction." },
      { id: "sc5-10", area: "Exploitation Awareness", level: "not_assessed", assessedDate: null, assessedBy: null, expiryDate: null, notes: "Training booked as part of induction programme." },
    ],
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const LEVEL_META: Record<CompetencyLevel, { label: string; colour: string; icon: typeof CheckCircle2 }> = {
  competent:    { label: "Competent",     colour: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  developing:   { label: "Developing",    colour: "bg-blue-100 text-blue-700",    icon: Clock },
  not_assessed: { label: "Not Assessed",  colour: "bg-gray-100 text-gray-700",    icon: Circle },
  expired:      { label: "Expired",       colour: "bg-red-100 text-red-700",      icon: XCircle },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function StaffCompetencyPage() {
  const [data] = useState<StaffCompetency[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDialog, setShowDialog] = useState(false);

  /* ── stats ────────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const allEntries = data.flatMap((s) => s.entries);
    const total = allEntries.length;
    const competent = allEntries.filter((e) => e.level === "competent").length;
    const developing = allEntries.filter((e) => e.level === "developing").length;
    const notAssessed = allEntries.filter((e) => e.level === "not_assessed").length;
    const expired = allEntries.filter((e) => e.level === "expired").length;

    const expiringSoon = allEntries.filter((e) => {
      if (!e.expiryDate || e.level === "expired") return false;
      const days = Math.ceil((new Date(e.expiryDate).getTime() - Date.now()) / 86400000);
      return days > 0 && days <= 90;
    }).length;

    const compliancePct = total > 0 ? Math.round((competent / total) * 100) : 0;
    const fullyCompetent = data.filter((s) => s.entries.every((e) => e.level === "competent")).length;

    return { total, competent, developing, notAssessed, expired, expiringSoon, compliancePct, fullyCompetent };
  }, [data]);

  /* ── alerts ───────────────────────────────────────────────────────────── */

  const alerts = useMemo(() => {
    const items: { staffName: string; area: string; type: "expired" | "expiring"; expiryDate: string }[] = [];
    data.forEach((s) => {
      s.entries.forEach((e) => {
        if (e.level === "expired") {
          items.push({ staffName: s.staffName, area: e.area, type: "expired", expiryDate: e.expiryDate || "" });
        } else if (e.expiryDate) {
          const days = Math.ceil((new Date(e.expiryDate).getTime() - Date.now()) / 86400000);
          if (days > 0 && days <= 90) {
            items.push({ staffName: s.staffName, area: e.area, type: "expiring", expiryDate: e.expiryDate });
          }
        }
      });
    });
    return items;
  }, [data]);

  /* ── filter + sort ────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterLevel !== "all") {
      list = list.filter((s) => s.entries.some((e) => e.level === filterLevel));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.staffName.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.entries.some((e) => e.area.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "compliance": {
          const aPct = a.entries.filter((e) => e.level === "competent").length / a.entries.length;
          const bPct = b.entries.filter((e) => e.level === "competent").length / b.entries.length;
          return aPct - bPct;
        }
        case "issues": {
          const aIssues = a.entries.filter((e) => e.level === "expired" || e.level === "not_assessed").length;
          const bIssues = b.entries.filter((e) => e.level === "expired" || e.level === "not_assessed").length;
          return bIssues - aIssues;
        }
        default: return a.staffName.localeCompare(b.staffName);
      }
    });
    return list;
  }, [data, filterLevel, search, sortBy]);

  /* ── export ───────────────────────────────────────────────────────────── */

  const exportData = useMemo(() => data.flatMap((s) => s.entries.map((e) => ({
    staffName: s.staffName,
    role: s.role,
    area: e.area,
    level: LEVEL_META[e.level].label,
    assessedDate: e.assessedDate || "",
    assessedBy: e.assessedBy ? getStaffName(e.assessedBy) : "",
    expiryDate: e.expiryDate || "",
    notes: e.notes,
  }))), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Staff Name",    accessor: (r: typeof exportData[number]) => r.staffName },
    { header: "Role",          accessor: (r: typeof exportData[number]) => r.role },
    { header: "Competency",    accessor: (r: typeof exportData[number]) => r.area },
    { header: "Level",         accessor: (r: typeof exportData[number]) => r.level },
    { header: "Assessed",      accessor: (r: typeof exportData[number]) => r.assessedDate },
    { header: "Assessed By",   accessor: (r: typeof exportData[number]) => r.assessedBy },
    { header: "Expiry",        accessor: (r: typeof exportData[number]) => r.expiryDate },
    { header: "Notes",         accessor: (r: typeof exportData[number]) => r.notes },
  ];

  return (
    <PageShell
      title="Staff Competency Assessments"
      subtitle="Reg 32/33 — skills sign-offs, practical competency checks, and professional development benchmarks"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="staff-competency" />
          <PrintButton title="Staff Competency Assessments" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Assessment
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── summary stats ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {[
            { l: "Competencies",     v: stats.total, icon: ClipboardCheck, c: "text-blue-600" },
            { l: "Competent",        v: stats.competent, icon: CheckCircle2, c: "text-green-600" },
            { l: "Developing",       v: stats.developing, icon: Clock, c: "text-blue-600" },
            { l: "Not Assessed",     v: stats.notAssessed, icon: Circle, c: "text-gray-500" },
            { l: "Expired",          v: stats.expired, icon: XCircle, c: stats.expired > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Expiring Soon",    v: stats.expiringSoon, icon: AlertTriangle, c: stats.expiringSoon > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Fully Competent",  v: `${stats.fullyCompetent}/${data.length}`, icon: Award, c: "text-green-600" },
            { l: "Compliance",       v: `${stats.compliancePct}%`, icon: BarChart3, c: stats.compliancePct >= 80 ? "text-green-600" : stats.compliancePct >= 60 ? "text-amber-600" : "text-red-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── compliance bar ─────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Overall Competency Compliance
            </span>
            <span className={cn(
              "font-bold tabular-nums",
              stats.compliancePct >= 80 ? "text-green-600" : stats.compliancePct >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {stats.compliancePct}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                stats.compliancePct >= 80 ? "bg-green-500" : stats.compliancePct >= 60 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${stats.compliancePct}%` }}
            />
          </div>
        </div>

        {/* ── alerts ─────────────────────────────────────────────────────── */}

        {alerts.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4" />
              {alerts.filter((a) => a.type === "expired").length > 0 && (
                <span>{alerts.filter((a) => a.type === "expired").length} expired competenc{alerts.filter((a) => a.type === "expired").length === 1 ? "y" : "ies"}</span>
              )}
              {alerts.filter((a) => a.type === "expired").length > 0 && alerts.filter((a) => a.type === "expiring").length > 0 && <span>·</span>}
              {alerts.filter((a) => a.type === "expiring").length > 0 && (
                <span className="text-amber-700">{alerts.filter((a) => a.type === "expiring").length} expiring within 90 days</span>
              )}
            </div>
            <div className="space-y-1">
              {alerts.map((a, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-2 text-xs rounded px-2 py-1",
                  a.type === "expired" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800",
                )}>
                  {a.type === "expired" ? <XCircle className="h-3 w-3 flex-shrink-0" /> : <Clock className="h-3 w-3 flex-shrink-0" />}
                  <span className="font-medium">{a.staffName}</span> — {a.area}
                  {a.expiryDate && <span className="text-muted-foreground ml-auto">{a.type === "expired" ? "Expired" : "Expires"}: {a.expiryDate}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── filters ────────────────────────────────────────────────────── */}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff or competency area..." className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="competent">Competent</SelectItem>
              <SelectItem value="developing">Developing</SelectItem>
              <SelectItem value="not_assessed">Not Assessed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="name">Name</option>
              <option value="compliance">Compliance (low first)</option>
              <option value="issues">Issues (most first)</option>
            </select>
          </div>
        </div>

        {/* ── competency matrix overview ──────────────────────────────────── */}

        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              Competency Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground w-[180px] sticky left-0 bg-gray-50 z-10">Staff</th>
                    {COMPETENCY_AREAS.map((area) => (
                      <th key={area} className="py-2 px-1 text-center text-[10px] font-medium text-muted-foreground min-w-[80px]">
                        <div className="truncate max-w-[75px] mx-auto" title={area}>{area.replace(" (Level 3)", "").replace("TCI/", "")}</div>
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((staff) => {
                    const comp = staff.entries.filter((e) => e.level === "competent").length;
                    const pct = Math.round((comp / staff.entries.length) * 100);
                    return (
                      <tr key={staff.id} className="border-b hover:bg-gray-50/50">
                        <td className="py-2 px-4 sticky left-0 bg-white z-10">
                          <div className="text-xs font-medium">{staff.staffName}</div>
                          <div className="text-[10px] text-muted-foreground">{staff.role}</div>
                        </td>
                        {COMPETENCY_AREAS.map((area) => {
                          const entry = staff.entries.find((e) => e.area === area);
                          if (!entry) return <td key={area} className="py-2 px-1 text-center"><span className="text-[10px] text-gray-300">--</span></td>;
                          const meta = LEVEL_META[entry.level];
                          const Icon = meta.icon;
                          return (
                            <td key={area} className="py-2 px-1 text-center">
                              <div className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium", meta.colour)} title={`${entry.area}: ${meta.label}`}>
                                <Icon className="h-3 w-3" />
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center">
                          <span className={cn(
                            "text-xs font-bold tabular-nums",
                            pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-600" : "text-red-600",
                          )}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── expandable staff cards ─────────────────────────────────────── */}

        {filtered.map((staff) => {
          const comp = staff.entries.filter((e) => e.level === "competent").length;
          const total = staff.entries.length;
          const pct = Math.round((comp / total) * 100);
          const hasExpired = staff.entries.some((e) => e.level === "expired");
          const hasDeveloping = staff.entries.some((e) => e.level === "developing");
          const hasNotAssessed = staff.entries.some((e) => e.level === "not_assessed");

          return (
            <div key={staff.id} className={cn(
              "rounded-lg border bg-white overflow-hidden",
              hasExpired ? "border-red-200" : "",
            )}>
              <button onClick={() => setExpanded(expanded === staff.id ? null : staff.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("h-5 w-5", pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-500" : "text-red-500")} />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{staff.staffName}</h3>
                      <span className="text-xs text-muted-foreground">{staff.role}</span>
                      {hasExpired && <Badge variant="destructive" className="text-[10px] h-5">Expired</Badge>}
                      {hasDeveloping && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">Developing</span>}
                      {hasNotAssessed && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">Gaps</span>}
                      {pct === 100 && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700">Fully Competent</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{comp}/{total} competencies ({pct}%) · Assessed by {getStaffName("staff_darren")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                    <div className={cn("h-full rounded-full", pct === 100 ? "bg-green-400" : pct >= 70 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${pct}%` }} />
                  </div>
                  {expanded === staff.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expanded === staff.id && (
                <div className="border-t p-4 space-y-2">
                  {staff.entries.map((entry) => {
                    const meta = LEVEL_META[entry.level];
                    const Icon = meta.icon;
                    const isExpired = entry.level === "expired";
                    const isExpiring = entry.expiryDate && entry.level !== "expired" && Math.ceil((new Date(entry.expiryDate).getTime() - Date.now()) / 86400000) <= 90 && Math.ceil((new Date(entry.expiryDate).getTime() - Date.now()) / 86400000) > 0;

                    return (
                      <div key={entry.id} className={cn(
                        "rounded border p-3",
                        isExpired ? "border-red-200 bg-red-50" : isExpiring ? "border-amber-200 bg-amber-50" : "",
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0",
                              isExpired ? "text-red-600" :
                              entry.level === "competent" ? "text-green-600" :
                              entry.level === "developing" ? "text-blue-600" :
                              "text-gray-400"
                            )} />
                            <div>
                              <p className="text-sm font-medium">{entry.area}</p>
                              {entry.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>}
                              {entry.assessedBy && entry.assessedDate && (
                                <p className="text-xs text-muted-foreground mt-0.5">Assessed by {getStaffName(entry.assessedBy)} on {entry.assessedDate}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", meta.colour)}>{meta.label}</span>
                            {entry.expiryDate && (
                              <p className={cn("text-xs mt-0.5", isExpired ? "text-red-600 font-medium" : isExpiring ? "text-amber-600" : "text-muted-foreground")}>
                                {isExpired ? "Expired" : "Expires"}: {entry.expiryDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── regulatory note ────────────────────────────────────────────── */}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <p>
            <strong>Reg 32 — Fitness of Workers</strong> — The registered person must not employ a person to work at the home unless that person is fit to do so, with the qualifications, competence, skills, and experience necessary for the work they are to perform.
          </p>
          <p>
            <strong>Reg 33 — Employment of Staff</strong> — The registered person must ensure that all employees receive appropriate training, professional development, and supervision to enable them to fulfil their roles effectively.
          </p>
          <p>
            <strong>Quality Standards — Workforce Development</strong> — Staff must be equipped to meet children&apos;s needs through ongoing competency assessment, reflective practice, and evidenced professional development aligned to care standards.
          </p>
        </div>
      </div>

      {/* ── new assessment dialog ─────────────────────────────────────────── */}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Competency Assessment</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm">
              <option value="">Select staff member...</option>
              <option value="staff_ryan">{getStaffName("staff_ryan")}</option>
              <option value="staff_anna">{getStaffName("staff_anna")}</option>
              <option value="staff_chervelle">{getStaffName("staff_chervelle")}</option>
              <option value="staff_edward">{getStaffName("staff_edward")}</option>
              <option value="staff_mirela">{getStaffName("staff_mirela")}</option>
              <option value="staff_lackson">{getStaffName("staff_lackson")}</option>
            </select>
            <select className="rounded border px-3 py-2 text-sm">
              <option value="">Competency area...</option>
              {COMPETENCY_AREAS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select className="rounded border px-3 py-2 text-sm">
              <option value="">Competency level...</option>
              <option value="competent">Competent</option>
              <option value="developing">Developing</option>
              <option value="not_assessed">Not Assessed</option>
              <option value="expired">Expired</option>
            </select>
            <input type="date" className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm">
              <option value="">Assessed by...</option>
              <option value="staff_darren">{getStaffName("staff_darren")}</option>
              <option value="staff_ryan">{getStaffName("staff_ryan")}</option>
            </select>
            <input type="date" placeholder="Expiry date (if applicable)" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Assessment notes..." rows={3} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Save Assessment</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
