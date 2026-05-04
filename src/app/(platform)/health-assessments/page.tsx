"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Heart,
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

type AssessmentType = "iha" | "rha" | "dental" | "optician" | "sdq";
type AssessmentStatus = "completed" | "scheduled" | "overdue" | "referred";

interface SDQScores {
  emotional: number;
  conduct: number;
  hyperactivity: number;
  peer: number;
  prosocial: number;
  total: number;
  band: "normal" | "borderline" | "abnormal";
}

interface FollowUp {
  action: string;
  owner: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue";
}

interface HealthAssessment {
  id: string;
  youngPersonId: string;
  type: AssessmentType;
  status: AssessmentStatus;
  date: string;
  nextDue: string;
  conductedBy: string;
  location: string;
  keyFindings: string[];
  recommendations: string[];
  followUps: FollowUp[];
  sdqScores: SDQScores | null;
  healthNeeds: { need: string; howMet: string }[];
  consent: string;
  childView: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: HealthAssessment[] = [
  {
    id: "ha1", youngPersonId: "yp_alex", type: "rha", status: "completed",
    date: d(-30), nextDue: d(335), conductedBy: "Dr Sarah Collins (LAC Nurse)",
    location: "Bridgewater Community Health Centre",
    keyFindings: [
      "Overall health good. BMI within normal range.",
      "ADHD medication (Methylphenidate) well-tolerated — no side effects reported.",
      "Immunisations up to date including HPV course complete.",
      "Mild acne — self-managing with over-the-counter treatment.",
      "Dental health satisfactory — next check due in 6 months.",
      "Emotional wellbeing improved since last assessment. CAMHS engagement positive.",
    ],
    recommendations: [
      "Continue current ADHD medication — no dose adjustment needed.",
      "Annual blood pressure check due to stimulant medication.",
      "Encourage regular physical activity — Alex enjoys football.",
      "Review acne at next RHA — consider GP referral if worsens.",
      "Continue CAMHS — next review at 6 months.",
    ],
    followUps: [
      { action: "Book BP check with GP", owner: "staff_anna", dueDate: d(30), status: "pending" },
      { action: "Register Alex with local football club", owner: "staff_edward", dueDate: d(14), status: "completed" },
    ],
    sdqScores: { emotional: 4, conduct: 3, hyperactivity: 6, peer: 3, prosocial: 7, total: 16, band: "borderline" },
    healthNeeds: [
      { need: "ADHD management", howMet: "Methylphenidate prescribed, administered daily by staff. CAMHS monitoring fortnightly." },
      { need: "Emotional wellbeing", howMet: "CAMHS sessions fortnightly. Key work sessions weekly. Staff trained in PACE model." },
      { need: "Physical fitness", howMet: "Football club registered. Access to garden and local park. PE at college." },
    ],
    consent: "Alex consented to assessment. SW consent as corporate parent on file. Mother informed via SW.",
    childView: "Alex said the health check was 'fine, not as bad as I thought.' He was pleased his medication is working well and asked the nurse about spots on his face. He said he wants to join a gym when he turns 16.",
    notes: "Positive assessment. Alex engaged throughout and asked appropriate questions. Good understanding of his own health needs. LAC nurse commended the home's health support.",
  },
  {
    id: "ha2", youngPersonId: "yp_jordan", type: "rha", status: "completed",
    date: d(-14), nextDue: d(170), conductedBy: "Dr Sarah Collins (LAC Nurse)",
    location: "Oak House (home visit)",
    keyFindings: [
      "Height and weight within expected range for age.",
      "No current prescribed medication.",
      "Immunisations — one booster overdue (MenACWY). GP to arrange.",
      "Sleep pattern disrupted — averaging 6 hours per night. Anxiety-related.",
      "Sensory processing difficulties noted — referral to OT recommended.",
      "Dental check overdue by 3 months — needs booking urgently.",
      "SDQ scores indicate elevated emotional difficulties.",
    ],
    recommendations: [
      "Arrange overdue MenACWY booster with GP — priority.",
      "Refer to Occupational Therapy for sensory processing assessment.",
      "Sleep hygiene programme — consistent bedtime routine, reduce screen time before bed.",
      "Book dental appointment within 2 weeks.",
      "Continue play therapy — supporting emotional regulation.",
      "Consider melatonin referral if sleep does not improve within 4 weeks.",
    ],
    followUps: [
      { action: "Book MenACWY booster with GP", owner: "staff_ryan", dueDate: d(7), status: "pending" },
      { action: "Submit OT referral", owner: "staff_ryan", dueDate: d(14), status: "pending" },
      { action: "Book dental appointment", owner: "staff_ryan", dueDate: d(7), status: "pending" },
      { action: "Implement sleep hygiene programme", owner: "staff_anna", dueDate: d(3), status: "completed" },
    ],
    sdqScores: { emotional: 7, conduct: 4, hyperactivity: 5, peer: 6, prosocial: 5, total: 22, band: "abnormal" },
    healthNeeds: [
      { need: "Emotional wellbeing", howMet: "Play therapy weekly. Additional key work sessions. PACE-informed staff approach." },
      { need: "Sleep difficulties", howMet: "Structured bedtime routine established. Screen-free time from 9pm. Calm environment." },
      { need: "Sensory processing", howMet: "Soft fabrics for clothing. Quiet retreat space available. OT referral in progress." },
      { need: "Dental health", howMet: "Appointment being booked. Staff to supervise brushing routine." },
    ],
    consent: "SW consented as corporate parent. Jordan assented to home visit format — more comfortable than clinic.",
    childView: "Jordan was quiet during the assessment but responded to direct questions. Said 'I don't like going to the doctor' but was okay with the nurse visiting at home. Jordan nodded when asked if sleep is a problem and said 'I can't switch my brain off at night.'",
    notes: "Home visit format worked well for Jordan — significantly less anxious than clinic setting. Several follow-up actions needed. SDQ scores are concerning — elevated emotional and peer domains. Play therapy is critical. The home is managing health needs well but dental and immunisations need urgent attention.",
  },
  {
    id: "ha3", youngPersonId: "yp_casey", type: "rha", status: "completed",
    date: d(-45), nextDue: d(320), conductedBy: "Dr Sarah Collins (LAC Nurse)",
    location: "Bridgewater Community Health Centre",
    keyFindings: [
      "Overall health excellent. Physically active and well-nourished.",
      "No medication. No ongoing health conditions.",
      "Immunisations fully up to date.",
      "Dental health good — attends independently.",
      "Sexual health discussed — age-appropriate advice given. Contraception awareness.",
      "Mental health — some anxiety about leaving care but managing well with counselling.",
      "Registered with GP and dentist independently.",
    ],
    recommendations: [
      "Continue counselling at 42nd Street.",
      "Discuss mental health self-referral pathways as part of independence prep.",
      "Ensure Casey knows how to access sexual health services post-placement.",
      "Register with new GP when moves to semi-independence.",
      "Healthy eating and cooking skills — linked to independence pathway.",
    ],
    followUps: [
      { action: "Provide Casey with local sexual health service info card", owner: "staff_darren", dueDate: d(-30), status: "completed" },
      { action: "Add GP re-registration to transition checklist", owner: "staff_darren", dueDate: d(-40), status: "completed" },
    ],
    sdqScores: { emotional: 3, conduct: 1, hyperactivity: 2, peer: 2, prosocial: 9, total: 8, band: "normal" },
    healthNeeds: [
      { need: "Anxiety management", howMet: "Weekly counselling at 42nd Street. Key work sessions. Independence pathway reducing anxiety through preparation." },
      { need: "Health independence", howMet: "Casey manages own GP and dental appointments. Staff supporting knowledge of post-18 health access." },
    ],
    consent: "Casey consented independently (Gillick competent, age 16+). SW informed.",
    childView: "Casey said 'I feel healthy and I know how to look after myself. The only thing I worry about is not having staff around when I'm on my own — what if something goes wrong?' Staff reassured Casey about GP access and 111/999 processes.",
    notes: "Excellent health assessment. Casey is highly independent in managing health. LAC nurse impressed with Casey's self-advocacy and knowledge. Anxiety about leaving care is the main health concern — being well-managed through counselling.",
  },
  {
    id: "ha4", youngPersonId: "yp_jordan", type: "dental", status: "overdue",
    date: d(-180), nextDue: d(-90), conductedBy: "Mr Khan (Dentist)",
    location: "Riverside Dental Practice",
    keyFindings: [
      "Last check: one small filling needed (completed same visit).",
      "Brushing technique needs improvement — electric toothbrush recommended.",
      "No orthodontic concerns at this stage.",
    ],
    recommendations: [
      "Electric toothbrush provided by home.",
      "Supervised brushing twice daily until technique improves.",
      "6-monthly check-up — NOW OVERDUE.",
    ],
    followUps: [
      { action: "Book follow-up dental appointment — OVERDUE", owner: "staff_ryan", dueDate: d(-90), status: "overdue" },
    ],
    sdqScores: null,
    healthNeeds: [
      { need: "Dental health", howMet: "Electric toothbrush provided. Staff supervising brushing morning and evening. Appointment being rebooked." },
    ],
    consent: "SW consent on file.",
    childView: "Jordan said 'I don't like the dentist but the filling didn't hurt.' Jordan has been using the electric toothbrush but needs reminding.",
    notes: "Follow-up appointment overdue. Must be booked as priority — flagged in RHA.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<AssessmentType, string> = {
  iha: "Initial Health Assessment", rha: "Review Health Assessment",
  dental: "Dental Check", optician: "Eye Test", sdq: "SDQ Assessment",
};

const STATUS_META: Record<AssessmentStatus, { label: string; colour: string }> = {
  completed: { label: "Completed",  colour: "bg-green-100 text-green-700" },
  scheduled: { label: "Scheduled",  colour: "bg-blue-100 text-blue-700" },
  overdue:   { label: "Overdue",    colour: "bg-red-100 text-red-700" },
  referred:  { label: "Referred",   colour: "bg-amber-100 text-amber-700" },
};

const SDQ_BAND_COLOUR: Record<string, string> = {
  normal: "bg-green-100 text-green-700", borderline: "bg-amber-100 text-amber-700", abnormal: "bg-red-100 text-red-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function HealthAssessmentsPage() {
  const [data] = useState<HealthAssessment[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    completed: data.filter((a) => a.status === "completed").length,
    overdue: data.filter((a) => a.status === "overdue").length,
    pendingActions: data.flatMap((a) => a.followUps).filter((f) => f.status === "pending" || f.status === "overdue").length,
    avgSDQ: (() => {
      const scores = data.filter((a) => a.sdqScores).map((a) => a.sdqScores!.total);
      return scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    })(),
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((a) => a.type === filterType);
    if (filterYP !== "all") list = list.filter((a) => a.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.conductedBy.toLowerCase().includes(q) || a.keyFindings.join(" ").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type]);
        case "yp":   return a.youngPersonId.localeCompare(b.youngPersonId);
        case "next": return a.nextDue.localeCompare(b.nextDue);
        default:     return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((a) => ({
    youngPerson: getYPName(a.youngPersonId),
    type: TYPE_LABELS[a.type],
    status: STATUS_META[a.status].label,
    date: a.date,
    nextDue: a.nextDue,
    conductedBy: a.conductedBy,
    location: a.location,
    keyFindings: a.keyFindings.join("; "),
    recommendations: a.recommendations.join("; "),
    sdqTotal: a.sdqScores ? String(a.sdqScores.total) : "N/A",
    sdqBand: a.sdqScores ? a.sdqScores.band : "N/A",
    healthNeeds: a.healthNeeds.map((h) => `${h.need}: ${h.howMet}`).join("; "),
    childView: a.childView,
    notes: a.notes,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",   accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Type",           accessor: (r: typeof exportData[number]) => r.type },
    { header: "Status",         accessor: (r: typeof exportData[number]) => r.status },
    { header: "Date",           accessor: (r: typeof exportData[number]) => r.date },
    { header: "Next Due",       accessor: (r: typeof exportData[number]) => r.nextDue },
    { header: "Conducted By",   accessor: (r: typeof exportData[number]) => r.conductedBy },
    { header: "Location",       accessor: (r: typeof exportData[number]) => r.location },
    { header: "Key Findings",   accessor: (r: typeof exportData[number]) => r.keyFindings },
    { header: "Recommendations",accessor: (r: typeof exportData[number]) => r.recommendations },
    { header: "SDQ Total",      accessor: (r: typeof exportData[number]) => r.sdqTotal },
    { header: "SDQ Band",       accessor: (r: typeof exportData[number]) => r.sdqBand },
    { header: "Health Needs",   accessor: (r: typeof exportData[number]) => r.healthNeeds },
    { header: "Child View",     accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Notes",          accessor: (r: typeof exportData[number]) => r.notes },
  ];

  const ypIds = [...new Set(data.map((a) => a.youngPersonId))];

  return (
    <PageShell
      title="Health Assessments"
      subtitle="LAC health assessments — IHA, RHA, dental, optician and SDQ tracking"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="health-assessments" />
          <PrintButton title="Health Assessments" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Assessment
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total",           v: stats.total, icon: Stethoscope, c: "text-blue-600" },
            { l: "Completed",       v: stats.completed, icon: CheckCircle2, c: "text-green-600" },
            { l: "Overdue",         v: stats.overdue, icon: AlertTriangle, c: stats.overdue > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Pending Actions", v: stats.pendingActions, icon: Clock, c: stats.pendingActions > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Avg SDQ",         v: stats.avgSDQ, icon: Heart, c: stats.avgSDQ > 17 ? "text-red-600" : "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.overdue > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>{stats.overdue} assessment{stats.overdue > 1 ? "s" : ""}</strong> overdue — book immediately.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assessments…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date</option>
              <option value="type">Type</option>
              <option value="yp">Young Person</option>
              <option value="next">Next Due</option>
            </select>
          </div>
        </div>

        {filtered.map((assessment) => (
          <div key={assessment.id} className={cn("rounded-lg border bg-white overflow-hidden", assessment.status === "overdue" ? "border-l-4 border-l-red-400" : "")}>
            <button onClick={() => setExpanded(expanded === assessment.id ? null : assessment.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(assessment.youngPersonId)}</h3>
                    <span className="text-sm text-muted-foreground">— {TYPE_LABELS[assessment.type]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[assessment.status].colour)}>{STATUS_META[assessment.status].label}</span>
                    {assessment.sdqScores && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SDQ_BAND_COLOUR[assessment.sdqScores.band])}>SDQ: {assessment.sdqScores.total} ({assessment.sdqScores.band})</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{assessment.date} · {assessment.conductedBy} · Next due: {assessment.nextDue}</p>
                </div>
              </div>
              {expanded === assessment.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === assessment.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Location:</span> {assessment.location}</div>
                  <div><span className="text-muted-foreground">Conducted By:</span> {assessment.conductedBy}</div>
                  <div><span className="text-muted-foreground">Next Due:</span> <span className={assessment.nextDue < d(0) ? "text-red-600 font-medium" : ""}>{assessment.nextDue}</span></div>
                  <div><span className="text-muted-foreground">Consent:</span> {assessment.consent.slice(0, 40)}…</div>
                </div>

                {assessment.sdqScores && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-2">SDQ Scores</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { l: "Emotional", v: assessment.sdqScores.emotional },
                        { l: "Conduct", v: assessment.sdqScores.conduct },
                        { l: "Hyperactivity", v: assessment.sdqScores.hyperactivity },
                        { l: "Peer", v: assessment.sdqScores.peer },
                        { l: "Prosocial", v: assessment.sdqScores.prosocial },
                        { l: "Total", v: assessment.sdqScores.total },
                      ].map((s) => (
                        <div key={s.l} className="text-center">
                          <p className="text-lg font-bold">{s.v}</p>
                          <p className="text-xs text-muted-foreground">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2">Band: <span className={cn("rounded-full px-2 py-0.5 font-medium", SDQ_BAND_COLOUR[assessment.sdqScores.band])}>{assessment.sdqScores.band.charAt(0).toUpperCase() + assessment.sdqScores.band.slice(1)}</span></p>
                  </div>
                )}

                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Key Findings</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">{assessment.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-900">{assessment.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>

                {assessment.healthNeeds.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Health Needs</h4>
                    <div className="space-y-2">
                      {assessment.healthNeeds.map((h, i) => (
                        <div key={i} className="rounded border p-2">
                          <p className="text-sm font-medium">{h.need}</p>
                          <p className="text-xs text-muted-foreground">{h.howMet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.followUps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Follow-Up Actions</h4>
                    <div className="space-y-1">
                      {assessment.followUps.map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded border p-2">
                          <div>
                            <p className="text-sm">{f.action}</p>
                            <p className="text-xs text-muted-foreground">{f.owner} · Due {f.dueDate}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                            f.status === "completed" ? "bg-green-100 text-green-700" :
                            f.status === "overdue" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          )}>{f.status.charAt(0).toUpperCase() + f.status.slice(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900">{assessment.childView}</p>
                </div>

                {assessment.notes && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Promoting the Health of Looked After Children (2015) / Reg 10</strong> — Every looked-after child must receive an Initial Health Assessment within 20 working days of becoming looked after, and Review Health Assessments annually (6-monthly for under-5s). The SDQ must be completed alongside health assessments to monitor emotional wellbeing.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Health Assessment</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Assessment type…</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input type="date" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Conducted by" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Location" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Key findings" rows={3} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Recommendations" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Log Assessment</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
