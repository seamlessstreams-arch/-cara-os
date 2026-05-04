"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Plus,
  ArrowUpDown,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
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

type TherapyType = "camhs" | "play_therapy" | "counselling" | "art_therapy" | "cbt" | "emdr" | "family_therapy" | "speech_language" | "occupational" | "psychotherapy";
type ReferralStatus = "pending" | "accepted" | "active" | "on_hold" | "completed" | "discharged" | "declined";
type Engagement = "excellent" | "good" | "variable" | "reluctant" | "disengaged";

interface Session {
  date: string;
  attended: boolean;
  summary: string;
  engagement: Engagement;
  homeActions: string[];
}

interface TherapeuticRecord {
  id: string;
  youngPersonId: string;
  therapyType: TherapyType;
  provider: string;
  therapist: string;
  referralDate: string;
  startDate: string | null;
  frequency: string;
  status: ReferralStatus;
  referralReason: string;
  goals: string[];
  recentSessions: Session[];
  waitingWeeks: number | null;
  homeKeyWorker: string;
  consent: string;
  nextAppointment: string | null;
  reviewDate: string | null;
  progressNotes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: TherapeuticRecord[] = [
  {
    id: "th1", youngPersonId: "yp_alex", therapyType: "camhs",
    provider: "Pennine Care NHS Foundation Trust", therapist: "Dr Aisha Patel",
    referralDate: d(-180), startDate: d(-150), frequency: "Fortnightly",
    status: "active", referralReason: "Anxiety, low mood, attachment difficulties. Recommended by previous social worker following placement move.",
    goals: ["Develop coping strategies for anxiety", "Process feelings about family separation", "Build emotional regulation skills", "Improve self-esteem"],
    recentSessions: [
      { date: d(-7), attended: true, summary: "Explored Alex's feelings about mother's inconsistent contact. Used timeline activity. Alex identified three key moments that trigger anxiety. Good session.", engagement: "good", homeActions: ["Staff to validate Alex's feelings about mum without making promises about contact", "Key worker to complete worry box activity before next session"] },
      { date: d(-21), attended: true, summary: "CBT techniques for managing anxiety at college. Introduced breathing exercise and grounding technique. Alex practised both and found grounding more helpful.", engagement: "excellent", homeActions: ["Staff to prompt grounding technique when Alex shows anxiety signs", "Print grounding cards for Alex's room and school bag"] },
      { date: d(-35), attended: false, summary: "Alex refused to attend — said he didn't want to talk about 'heavy stuff' today. Rescheduled.", engagement: "reluctant", homeActions: ["Key worker to explore what triggered reluctance in next key work session", "Do not pressure — normalise that some weeks are harder"] },
    ],
    waitingWeeks: null, homeKeyWorker: "staff_anna",
    consent: "Alex consented verbally and in writing. SW consent on file. Mother consented via SW.",
    nextAppointment: d(7), reviewDate: d(30),
    progressNotes: "Alex has made good progress with anxiety management techniques. CBT approach works well. The relationship with Dr Patel is established and trusting. Attendance is generally good with occasional reluctance — usually linked to emotional content in previous session. Home team excellent at supporting between sessions.",
  },
  {
    id: "th2", youngPersonId: "yp_jordan", therapyType: "play_therapy",
    provider: "Creative Minds Therapy CIC", therapist: "Maria Santos",
    referralDate: d(-90), startDate: d(-60), frequency: "Weekly",
    status: "active", referralReason: "Trauma processing following ABE interview. Play therapy recommended due to Jordan's age and communication preferences. Non-directive approach.",
    goals: ["Safe space to process traumatic experiences", "Develop emotional vocabulary", "Build trust in adult relationships", "Reduce hypervigilance"],
    recentSessions: [
      { date: d(-3), attended: true, summary: "Jordan spent the session in the sand tray. Created a scene with 'safe' and 'unsafe' areas. Therapist observed clear symbolic processing. Verbal content minimal but non-verbal communication rich.", engagement: "good", homeActions: ["Continue providing calm, predictable routines", "Do not ask Jordan about therapy content — let them share voluntarily"] },
      { date: d(-10), attended: true, summary: "Drew pictures of 'before' and 'now'. Jordan identified Oak House as a safe place. Drew staff members. Did not include any family figures. Important session for attachment work.", engagement: "good", homeActions: ["Staff mentioned in drawings to be informed (positively) — Ryan, Anna", "Continue to be consistently available for Jordan"] },
      { date: d(-17), attended: true, summary: "Music and movement session. Jordan was more relaxed than usual. Initiated conversation about school — first unprompted verbal exchange in therapy. Therapist encouraged gently.", engagement: "excellent", homeActions: ["Note increased verbal confidence — continue to provide opportunities for Jordan to talk without pressure"] },
    ],
    waitingWeeks: null, homeKeyWorker: "staff_ryan",
    consent: "SW consent as corporate parent. Jordan assented to attend. LA has parental responsibility.",
    nextAppointment: d(4), reviewDate: d(20),
    progressNotes: "Jordan is engaging well with play therapy. Non-directive approach is appropriate — Jordan is processing at their own pace. The therapist reports increasing trust and more symbolic communication about traumatic experiences. Home team's consistency is cited as a key protective factor supporting therapeutic progress.",
  },
  {
    id: "th3", youngPersonId: "yp_casey", therapyType: "counselling",
    provider: "42nd Street (Youth Mental Health)", therapist: "James Okonkwo",
    referralDate: d(-120), startDate: d(-100), frequency: "Weekly",
    status: "active", referralReason: "Self-referred via 42nd Street drop-in. Identity exploration, anxiety about leaving care, relationship difficulties with peers.",
    goals: ["Explore identity and sense of self", "Manage anxiety about independence", "Develop healthy relationship skills", "Build resilience for leaving care transition"],
    recentSessions: [
      { date: d(-5), attended: true, summary: "Focused on Casey's feelings about leaving Oak House. Mixed emotions — excitement about independence but grief about losing daily contact with staff team. Healthy processing.", engagement: "excellent", homeActions: ["Key worker to create 'staying connected' plan with Casey — how to maintain relationships post-placement"] },
      { date: d(-12), attended: true, summary: "Discussed a conflict with a friend at college. Explored assertiveness vs aggression. Casey identified patterns from childhood. Good insight.", engagement: "good", homeActions: ["Support Casey in practising assertive communication — staff to model"] },
    ],
    waitingWeeks: null, homeKeyWorker: "staff_darren",
    consent: "Casey self-referred and consented independently (aged 16+). Gillick competent. SW informed.",
    nextAppointment: d(2), reviewDate: d(14),
    progressNotes: "Casey is highly engaged and motivated. Self-referral shows strong self-awareness. The counselling is well-timed ahead of the transition to independence. Casey is processing complex emotions about leaving care with good insight. Therapist impressed with Casey's emotional intelligence.",
  },
  {
    id: "th4", youngPersonId: "yp_jordan", therapyType: "speech_language",
    provider: "Manchester Community Health NHS Trust", therapist: "Lucy Brightman",
    referralDate: d(-45), startDate: null, frequency: "TBC",
    status: "pending", referralReason: "School SENCo flagged concerns about Jordan's receptive language — may be affecting academic progress and social communication. Assessment requested.",
    goals: ["Full speech and language assessment", "Identify any underlying communication needs", "Inform EHCP application if warranted"],
    recentSessions: [],
    waitingWeeks: 6, homeKeyWorker: "staff_ryan",
    consent: "SW consent obtained. Jordan informed — expressed mild anxiety about assessment.",
    nextAppointment: null, reviewDate: d(15),
    progressNotes: "Referral submitted 6 weeks ago. Current wait time estimated 8-12 weeks. School providing interim support. Home team using visual supports and simplified language as recommended by SENCo.",
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<TherapyType, string> = {
  camhs: "CAMHS", play_therapy: "Play Therapy", counselling: "Counselling",
  art_therapy: "Art Therapy", cbt: "CBT", emdr: "EMDR",
  family_therapy: "Family Therapy", speech_language: "Speech & Language",
  occupational: "Occupational Therapy", psychotherapy: "Psychotherapy",
};

const STATUS_META: Record<ReferralStatus, { label: string; colour: string }> = {
  pending:    { label: "Pending",     colour: "bg-amber-100 text-amber-700" },
  accepted:   { label: "Accepted",    colour: "bg-blue-100 text-blue-700" },
  active:     { label: "Active",      colour: "bg-green-100 text-green-700" },
  on_hold:    { label: "On Hold",     colour: "bg-gray-100 text-gray-700" },
  completed:  { label: "Completed",   colour: "bg-purple-100 text-purple-700" },
  discharged: { label: "Discharged",  colour: "bg-gray-100 text-gray-500" },
  declined:   { label: "Declined",    colour: "bg-red-100 text-red-700" },
};

const ENG_META: Record<Engagement, { label: string; colour: string }> = {
  excellent:  { label: "Excellent",  colour: "bg-green-100 text-green-700" },
  good:       { label: "Good",      colour: "bg-blue-100 text-blue-700" },
  variable:   { label: "Variable",  colour: "bg-amber-100 text-amber-700" },
  reluctant:  { label: "Reluctant", colour: "bg-orange-100 text-orange-700" },
  disengaged: { label: "Disengaged",colour: "bg-red-100 text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function TherapeuticInputPage() {
  const [data] = useState<TherapeuticRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((r) => r.status === "active").length,
    pending: data.filter((r) => r.status === "pending").length,
    totalSessions: data.reduce((s, r) => s + r.recentSessions.length, 0),
    attendanceRate: (() => {
      const sessions = data.flatMap((r) => r.recentSessions);
      if (!sessions.length) return 0;
      return Math.round((sessions.filter((s) => s.attended).length / sessions.length) * 100);
    })(),
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.therapyType === filterType);
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.therapist.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q) || TYPE_LABELS[r.therapyType].toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return TYPE_LABELS[a.therapyType].localeCompare(TYPE_LABELS[b.therapyType]);
        case "yp":   return a.youngPersonId.localeCompare(b.youngPersonId);
        default:     return b.referralDate.localeCompare(a.referralDate);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((r) => ({
    youngPerson: getYPName(r.youngPersonId),
    therapyType: TYPE_LABELS[r.therapyType],
    provider: r.provider,
    therapist: r.therapist,
    status: STATUS_META[r.status].label,
    referralDate: r.referralDate,
    startDate: r.startDate || "Pending",
    frequency: r.frequency,
    referralReason: r.referralReason,
    goals: r.goals.join("; "),
    sessionsAttended: r.recentSessions.filter((s) => s.attended).length,
    nextAppointment: r.nextAppointment || "TBC",
    homeKeyWorker: getStaffName(r.homeKeyWorker),
    progressNotes: r.progressNotes,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",    accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Therapy Type",    accessor: (r: typeof exportData[number]) => r.therapyType },
    { header: "Provider",        accessor: (r: typeof exportData[number]) => r.provider },
    { header: "Therapist",       accessor: (r: typeof exportData[number]) => r.therapist },
    { header: "Status",          accessor: (r: typeof exportData[number]) => r.status },
    { header: "Referral Date",   accessor: (r: typeof exportData[number]) => r.referralDate },
    { header: "Start Date",      accessor: (r: typeof exportData[number]) => r.startDate },
    { header: "Frequency",       accessor: (r: typeof exportData[number]) => r.frequency },
    { header: "Referral Reason", accessor: (r: typeof exportData[number]) => r.referralReason },
    { header: "Goals",           accessor: (r: typeof exportData[number]) => r.goals },
    { header: "Sessions Attended",accessor: (r: typeof exportData[number]) => String(r.sessionsAttended) },
    { header: "Next Appointment",accessor: (r: typeof exportData[number]) => r.nextAppointment },
    { header: "Home Key Worker", accessor: (r: typeof exportData[number]) => r.homeKeyWorker },
    { header: "Progress Notes",  accessor: (r: typeof exportData[number]) => r.progressNotes },
  ];

  const ypIds = [...new Set(data.map((r) => r.youngPersonId))];

  return (
    <PageShell
      title="Therapeutic Input"
      subtitle="Therapy referrals, sessions and progress tracking — CAMHS, play therapy, counselling and specialist input"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="therapeutic-input" />
          <PrintButton title="Therapeutic Input" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Referral
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals", v: stats.total, icon: Heart, c: "text-pink-600" },
            { l: "Active",          v: stats.active, icon: CheckCircle2, c: "text-green-600" },
            { l: "Pending",         v: stats.pending, icon: Clock, c: "text-amber-600" },
            { l: "Sessions Logged", v: stats.totalSessions, icon: Calendar, c: "text-blue-600" },
            { l: "Attendance",      v: `${stats.attendanceRate}%`, icon: CheckCircle2, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.pending > 0 && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800"><strong>{stats.pending} referral{stats.pending > 1 ? "s" : ""}</strong> awaiting allocation or assessment.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search therapists, providers…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Therapy Type" /></SelectTrigger>
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
              <option value="date">Referral Date</option>
              <option value="type">Therapy Type</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-500" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{TYPE_LABELS[rec.therapyType]}</h3>
                    <span className="text-sm text-muted-foreground">— {getYPName(rec.youngPersonId)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[rec.status].colour)}>{STATUS_META[rec.status].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.therapist} · {rec.provider} · {rec.frequency}</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Referred:</span> {rec.referralDate}</div>
                  <div><span className="text-muted-foreground">Started:</span> {rec.startDate || "Awaiting"}</div>
                  <div><span className="text-muted-foreground">Key Worker:</span> {getStaffName(rec.homeKeyWorker)}</div>
                  <div><span className="text-muted-foreground">Next:</span> {rec.nextAppointment || "TBC"}</div>
                </div>

                {rec.waitingWeeks !== null && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm text-amber-800"><Clock className="inline h-4 w-4 mr-1" />On waiting list — <strong>{rec.waitingWeeks} weeks</strong> since referral.</p>
                  </div>
                )}

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Referral Reason</h4>
                  <p className="text-sm text-muted-foreground">{rec.referralReason}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Therapeutic Goals</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">{rec.goals.map((g, i) => <li key={i}>{g}</li>)}</ol>
                </div>

                <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Consent:</span> {rec.consent}</div>

                {rec.recentSessions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recent Sessions</h4>
                    <div className="space-y-3">
                      {rec.recentSessions.map((s, i) => (
                        <div key={i} className={cn("rounded border p-3", s.attended ? "" : "bg-red-50")}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{s.date}</span>
                              {s.attended ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-xs text-red-600 font-medium">Did Not Attend</span>}
                            </div>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ENG_META[s.engagement].colour)}>{ENG_META[s.engagement].label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{s.summary}</p>
                          {s.homeActions.length > 0 && (
                            <div className="rounded bg-blue-50 p-2">
                              <p className="text-xs font-semibold text-blue-800 mb-1">Home Actions:</p>
                              <ul className="list-disc list-inside text-xs text-blue-900">{s.homeActions.map((a, j) => <li key={j}>{a}</li>)}</ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Progress Notes</h4>
                  <p className="text-sm text-green-900">{rec.progressNotes}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 5 / Reg 10 / NICE CG158</strong> — The home must ensure children receive appropriate therapeutic support to address their emotional and mental health needs. Progress and engagement must be monitored and the home team should actively support therapeutic goals between sessions.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Therapy Referral</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Therapy type…</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input placeholder="Provider organisation" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Therapist name" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Referral reason" rows={3} className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Goals (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Submit Referral</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
