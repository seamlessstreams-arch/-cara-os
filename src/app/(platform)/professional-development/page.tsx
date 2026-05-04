"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  Shield,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CPDType = "qualification" | "training" | "conference" | "reflective_account" | "mentoring" | "shadowing";
type CPDStatus = "completed" | "in_progress" | "planned";

interface CPDRecord {
  id: string;
  staffId: string;
  title: string;
  type: CPDType;
  provider: string;
  startDate: string;
  completedDate: string | null;
  duration: string;
  status: CPDStatus;
  cpdHours: number;
  certificateObtained: boolean;
  impactOnPractice: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<CPDType, string> = {
  qualification: "Qualification",
  training: "Training",
  conference: "Conference",
  reflective_account: "Reflective Account",
  mentoring: "Mentoring",
  shadowing: "Shadowing",
};

const TYPE_COLOUR: Record<CPDType, string> = {
  qualification: "bg-purple-100 text-purple-800",
  training: "bg-blue-100 text-blue-800",
  conference: "bg-amber-100 text-amber-800",
  reflective_account: "bg-green-100 text-green-800",
  mentoring: "bg-indigo-100 text-indigo-800",
  shadowing: "bg-pink-100 text-pink-800",
};

const STATUS_LABEL: Record<CPDStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  planned: "Planned",
};

const STATUS_COLOUR: Record<CPDStatus, string> = {
  completed: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-blue-100 text-blue-800",
  planned: "bg-slate-100 text-slate-700",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: CPDRecord[] = [
  {
    id: "cpd1",
    staffId: "staff_darren",
    title: "Level 7 Leadership & Management (in progress)",
    type: "qualification",
    provider: "University-based",
    startDate: d(-180),
    completedDate: null,
    duration: "12 months",
    status: "in_progress",
    cpdHours: 120,
    certificateObtained: false,
    impactOnPractice: "Applying strategic leadership models directly to home management. Improved governance and quality assurance frameworks.",
    notes: "Module 3 submitted. Distinction in modules 1 and 2. Applying learning directly to home management.",
  },
  {
    id: "cpd2",
    staffId: "staff_darren",
    title: "Ofsted Preparation Workshop",
    type: "conference",
    provider: "National Children's Bureau",
    startDate: d(-45),
    completedDate: d(-45),
    duration: "1 day",
    status: "completed",
    cpdHours: 7,
    certificateObtained: true,
    impactOnPractice: "Refined self-evaluation and evidence-gathering approaches aligned with SCCIF framework.",
    notes: "Excellent workshop on SCCIF framework. Key takeaway: evidence of impact over process.",
  },
  {
    id: "cpd3",
    staffId: "staff_ryan",
    title: "Level 5 Leadership (completed)",
    type: "qualification",
    provider: "Distance Learning",
    startDate: d(-365),
    completedDate: d(-90),
    duration: "9 months",
    status: "completed",
    cpdHours: 90,
    certificateObtained: true,
    impactOnPractice: "Enhanced understanding of regulatory framework and supervision practice. Now supporting with Reg 45 authorship.",
    notes: "Completed with Merit. Now supporting with Reg 45 authorship.",
  },
  {
    id: "cpd4",
    staffId: "staff_chervelle",
    title: "CSE Awareness Advanced Training",
    type: "training",
    provider: "Barnardo's",
    startDate: d(-30),
    completedDate: d(-29),
    duration: "2 days",
    status: "completed",
    cpdHours: 14,
    certificateObtained: true,
    impactOnPractice: "Strengthened ability to identify exploitation indicators early and implement disruption strategies within care planning.",
    notes: "In-depth exploitation indicators and disruption techniques. Directly applicable to work with Casey.",
  },
  {
    id: "cpd5",
    staffId: "staff_chervelle",
    title: "Senior Practitioner Pathway — Module 1",
    type: "qualification",
    provider: "In-house / TCSW",
    startDate: d(-60),
    completedDate: null,
    duration: "6 months per module",
    status: "in_progress",
    cpdHours: 30,
    certificateObtained: false,
    impactOnPractice: "Building evidenced competencies through portfolio. Developing advanced practitioner skills in key working and risk assessment.",
    notes: "First module complete. Evidencing competencies through portfolio.",
  },
  {
    id: "cpd6",
    staffId: "staff_anna",
    title: "Makaton Level 2",
    type: "training",
    provider: "Makaton Charity",
    startDate: d(-21),
    completedDate: d(-21),
    duration: "1 day",
    status: "completed",
    cpdHours: 7,
    certificateObtained: true,
    impactOnPractice: "Increased confidence and repertoire of signs used in daily communication with Jordan. Supports his communication passport goals.",
    notes: "Building on existing Level 1. Now more confident signing with Jordan.",
  },
  {
    id: "cpd7",
    staffId: "staff_edward",
    title: "TCI Refresher",
    type: "training",
    provider: "Internal (Darren Laville)",
    startDate: d(-14),
    completedDate: d(-14),
    duration: "Half day",
    status: "completed",
    cpdHours: 4,
    certificateObtained: false,
    impactOnPractice: "Reinforced verbal de-escalation techniques. Improved confidence in managing escalating situations without physical intervention.",
    notes: "Edward requested additional practice with verbal de-escalation scenarios.",
  },
  {
    id: "cpd8",
    staffId: "staff_mirela",
    title: "First Aid at Work (renewal)",
    type: "training",
    provider: "St John Ambulance",
    startDate: d(-7),
    completedDate: d(-6),
    duration: "2 days",
    status: "completed",
    cpdHours: 14,
    certificateObtained: true,
    impactOnPractice: "Certificate renewed for 3 years. Updated knowledge on paediatric emergencies and anaphylaxis management.",
    notes: "Certificate renewed for 3 years.",
  },
  {
    id: "cpd9",
    staffId: "staff_lackson",
    title: "Trauma-Informed Practice",
    type: "conference",
    provider: "TACT",
    startDate: d(-60),
    completedDate: d(-60),
    duration: "1 day",
    status: "completed",
    cpdHours: 7,
    certificateObtained: true,
    impactOnPractice: "Deepened understanding of ACEs and their physiological impact. Applied learning to daily interactions and care planning for Casey.",
    notes: "Good overview of ACEs and their impact. Lackson reflected on how this applies to Casey.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ProfessionalDevelopmentPage() {
  const [data] = useState<CPDRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);
  const staffIds = [...new Set(data.map(r => r.staffId))];

  /* ── filtering & sorting ── */
  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.title.toLowerCase().includes(s) ||
        getStaffName(r.staffId).toLowerCase().includes(s) ||
        r.provider.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") out = out.filter(r => r.type === typeFilter);
    if (staffFilter !== "all") out = out.filter(r => r.staffId === staffFilter);
    out.sort((a, b) => {
      if (sortBy === "oldest") return a.startDate.localeCompare(b.startDate);
      if (sortBy === "hours") return b.cpdHours - a.cpdHours;
      return b.startDate.localeCompare(a.startDate);
    });
    return out;
  }, [data, search, typeFilter, staffFilter, sortBy]);

  /* ── summary stats ── */
  const totalHours = useMemo(() => data.reduce((sum, r) => sum + r.cpdHours, 0), [data]);
  const avgPerStaff = useMemo(() => Math.round(totalHours / staffIds.length), [totalHours, staffIds.length]);
  const qualificationsInProgress = useMemo(() => data.filter(r => r.type === "qualification" && r.status === "in_progress").length, [data]);
  const completedThisQuarter = useMemo(() => data.filter(r => r.completedDate && r.completedDate >= d(-90)).length, [data]);

  /* ── export columns ── */
  const exportCols: ExportColumn<CPDRecord>[] = useMemo(() => [
    { header: "Staff", accessor: (r: CPDRecord) => getStaffName(r.staffId) },
    { header: "Title", accessor: (r: CPDRecord) => r.title },
    { header: "Type", accessor: (r: CPDRecord) => TYPE_LABEL[r.type] },
    { header: "Provider", accessor: (r: CPDRecord) => r.provider },
    { header: "Start Date", accessor: (r: CPDRecord) => r.startDate },
    { header: "Completed", accessor: (r: CPDRecord) => r.completedDate ?? "In progress" },
    { header: "Duration", accessor: (r: CPDRecord) => r.duration },
    { header: "Status", accessor: (r: CPDRecord) => STATUS_LABEL[r.status] },
    { header: "CPD Hours", accessor: (r: CPDRecord) => String(r.cpdHours) },
    { header: "Certificate", accessor: (r: CPDRecord) => r.certificateObtained ? "Yes" : "No" },
    { header: "Impact on Practice", accessor: (r: CPDRecord) => r.impactOnPractice },
    { header: "Notes", accessor: (r: CPDRecord) => r.notes },
  ], []);

  return (
    <PageShell
      title="Professional Development"
      subtitle="CPD records, qualifications, conferences, and learning activities"
      actions={[
        <PrintButton key="p" title="Professional Development Records" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="professional-development" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* ── summary stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total CPD Hours (Team)", value: totalHours, icon: Clock, colour: "text-blue-600" },
            { label: "Average per Staff", value: `${avgPerStaff} hrs`, icon: Users, colour: "text-indigo-600" },
            { label: "Qualifications In Progress", value: qualificationsInProgress, icon: GraduationCap, colour: "text-purple-600" },
            { label: "Completed This Quarter", value: completedThisQuarter, icon: CheckCircle2, colour: "text-emerald-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters ────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Title, staff, provider…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {(Object.entries(TYPE_LABEL) as [CPDType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Label className="text-xs">Staff</Label>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffIds.map(id => (
                      <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="hours">Most Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── results count ──────────────────────────────────────────────── */}
        {(search || typeFilter !== "all" || staffFilter !== "all") && (
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {data.length} record{data.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* ── CPD record cards ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn(r.status === "in_progress" && "border-blue-200")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <Badge className={cn("text-xs", TYPE_COLOUR[r.type])}>{TYPE_LABEL[r.type]}</Badge>
                        <Badge className={cn("text-xs", STATUS_COLOUR[r.status])}>{STATUS_LABEL[r.status]}</Badge>
                        {r.certificateObtained && <Badge className="text-xs bg-amber-100 text-amber-800"><Award className="h-3 w-3 mr-0.5" />Certificate</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.startDate} · {getStaffName(r.staffId)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{r.provider}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.duration}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{r.cpdHours} CPD hours</span>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Notes</p>
                      <p className="text-sm text-blue-900">{r.notes}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-800 mb-1">Impact on Practice</p>
                      <p className="text-sm text-green-900">{r.impactOnPractice}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-slate-600">Start Date</p>
                        <p className="text-slate-900">{r.startDate}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-slate-600">Completed</p>
                        <p className="text-slate-900">{r.completedDate ?? "Ongoing"}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-slate-600">CPD Hours</p>
                        <p className="text-slate-900">{r.cpdHours}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-slate-600">Certificate</p>
                        <p className="text-slate-900">{r.certificateObtained ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Workforce Development — Regulatory Context</p>
          <p>
            Regulation 33 (Schedule 2) requires the registered person to ensure staff receive appropriate training, professional development, and supervision. All residential care workers must hold or be working towards the Level 3 Diploma for Residential Childcare (or equivalent) within two years of starting in post. The registered manager must hold the Level 5 Diploma in Leadership and Management for Residential Childcare.
          </p>
          <p>
            CPD records should be reviewed regularly to ensure workforce development aligns with the home&apos;s Statement of Purpose and the needs of the children in placement. Evidence of impact on practice is critical — Ofsted inspectors look for how learning translates into improved outcomes for children.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
