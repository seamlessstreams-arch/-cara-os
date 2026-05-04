"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ChevronDown, ChevronUp, Shield, Clock, AlertTriangle, Users, Brain, Lock, Calendar, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface AgreedAction {
  action: string;
  owner: string; // staff ID
  deadline: string; // date
}

interface SafeguardingSupervision {
  id: string;
  date: string;
  supervisee: string; // staff ID
  supervisor: string; // staff ID
  durationMinutes: number;
  casesDiscussed: string[]; // yp IDs
  riskThemes: string[];
  emotionalImpact: string;
  reflectiveQuestionsExplored: string[];
  actionsAgreed: AgreedAction[];
  supervisorObservations: string;
  parallelProcessNoted: string;
  nextSession: string;
  confidentialityNote: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SafeguardingSupervision[] = [
  {
    id: "ss1",
    date: d(-3),
    supervisee: "staff_chervelle",
    supervisor: "staff_darren",
    durationMinutes: 75,
    casesDiscussed: ["yp_alex"],
    riskThemes: ["Night-time absconding", "Attachment-driven risk taking", "Maternal preoccupation"],
    emotionalImpact: "Chervelle described feeling hyper-alert during sleep-ins since the 2am door-alarm incident. Sleep quality has been disrupted on shifts following Alex-related events. She felt this acutely but had not previously named it.",
    reflectiveQuestionsExplored: [
      "What does Alex's leaving behaviour stir in you personally?",
      "Where do you carry the worry between shifts — and what helps you put it down?",
      "Whose responsibility is Alex's safety at 2am, and what does 'good enough' look like?",
    ],
    actionsAgreed: [
      { action: "Implement comfort box near sleep-in room (photos, letter from mum, sensory items)", owner: "staff_chervelle", deadline: d(7) },
      { action: "Request clinical consultation re: Alex's night-time attachment activation", owner: "staff_darren", deadline: d(14) },
      { action: "Two debrief calls offered to Chervelle after high-arousal nights", owner: "staff_darren", deadline: d(30) },
    ],
    supervisorObservations: "Chervelle is highly attuned to Alex but is at risk of vicarious hypervigilance. Her instinctive responses on the night were sound. Strengthening team backup so she does not feel solely responsible is the key intervention here.",
    parallelProcessNoted: "Chervelle's hypervigilance during the conversation (scanning the door, half-listening for sounds in the building) mirrored Alex's own scanning behaviour at night. Named gently and held as data, not pathology.",
    nextSession: d(28),
    confidentialityNote: "Held within statutory limits. Notes stored in restricted folder. Disclosure only required if a child is at risk of significant harm or staff are unable to safeguard.",
  },
  {
    id: "ss2",
    date: d(-7),
    supervisee: "staff_ryan",
    supervisor: "staff_darren",
    durationMinutes: 60,
    casesDiscussed: ["yp_jordan", "yp_alex"],
    riskThemes: ["Online exploitation indicators", "Peer-on-peer pressure", "Hidden phone use"],
    emotionalImpact: "Ryan voiced unease about a sense that 'something is moving in the background' with Jordan that he can't quite name. He noted feeling disloyal raising it without firm evidence.",
    reflectiveQuestionsExplored: [
      "What does your gut say that the evidence does not yet support?",
      "When have you been right about a hunch like this before?",
      "What would 'speaking up too soon' cost — and what would 'speaking up too late' cost?",
    ],
    actionsAgreed: [
      { action: "Submit contextual safeguarding screening for Jordan based on observed patterns", owner: "staff_ryan", deadline: d(3) },
      { action: "Brief night staff on indicators to watch for (device use after lights out, mood shifts)", owner: "staff_ryan", deadline: d(2) },
      { action: "Schedule joint review with DSL and social worker", owner: "staff_darren", deadline: d(10) },
    ],
    supervisorObservations: "Ryan's professional curiosity is a real safeguarding asset. Validated his hunch as legitimate clinical data. Reframed 'disloyalty' as 'protective vigilance'.",
    parallelProcessNoted: "Ryan's reluctance to name his concerns mirrors Jordan's reluctance to disclose. Both are protecting a relationship at the cost of safety — explored briefly and held for next session.",
    nextSession: d(21),
    confidentialityNote: "Held within statutory limits. Information shared with DSL and social worker on a need-to-know basis only.",
  },
  {
    id: "ss3",
    date: d(-10),
    supervisee: "staff_anna",
    supervisor: "staff_darren",
    durationMinutes: 55,
    casesDiscussed: ["yp_casey"],
    riskThemes: ["Historic CSA disclosure processing", "Self-harm risk monitoring", "Trust building post-disclosure"],
    emotionalImpact: "Anna described carrying Casey's recent disclosure heavily. She has had two interrupted sleeps thinking about it. She does not regret being the trusted adult Casey chose, but is feeling the weight.",
    reflectiveQuestionsExplored: [
      "What does it mean to you that Casey chose you as the person to tell?",
      "Where does this disclosure sit alongside your own boundaries?",
      "What support do you need that you have not yet asked for?",
    ],
    actionsAgreed: [
      { action: "Anna to access EAP counselling sessions (offered, accepted)", owner: "staff_anna", deadline: d(7) },
      { action: "Reduce Casey 1:1 keywork load temporarily — co-deliver with Mirela", owner: "staff_darren", deadline: d(5) },
      { action: "Monthly safeguarding supervision (instead of bi-monthly) for next 3 months", owner: "staff_darren", deadline: d(30) },
    ],
    supervisorObservations: "Anna's containment of the disclosure was exemplary. She is at risk of secondary traumatic stress and needs proactive scaffolding, not reactive support after burnout.",
    parallelProcessNoted: "Anna's interrupted sleep mirrors Casey's documented sleep disturbance. Discussed how trauma can transmit between holder and held when containment is not shared.",
    nextSession: d(20),
    confidentialityNote: "Held within statutory limits. Casey's disclosure is recorded in safeguarding file; no new disclosure was made in this session.",
  },
  {
    id: "ss4",
    date: d(-14),
    supervisee: "staff_edward",
    supervisor: "staff_darren",
    durationMinutes: 50,
    casesDiscussed: ["yp_jordan"],
    riskThemes: ["Verbal aggression in transport", "Lone-working risk", "Boundary maintenance"],
    emotionalImpact: "Edward reported feeling 'numb' after recent verbal abuse from Jordan during a transport run. He has not raised it as it 'isn't really an incident'. He worries about being seen as unable to cope.",
    reflectiveQuestionsExplored: [
      "What stops you from naming verbal abuse as a safeguarding issue for yourself?",
      "If a colleague described what you described, how would you respond to them?",
      "What is 'numb' protecting you from feeling?",
    ],
    actionsAgreed: [
      { action: "Edward to log the transport incident retrospectively as a near-miss", owner: "staff_edward", deadline: d(2) },
      { action: "Review lone-working policy for transport with Jordan; minimum two staff for next 4 weeks", owner: "staff_darren", deadline: d(7) },
      { action: "Edward to access wellbeing check-in with HR", owner: "staff_edward", deadline: d(14) },
    ],
    supervisorObservations: "Edward minimises his own experience. Patterns suggest he absorbs aggression rather than naming it — a known risk factor for staff burnout. Containment plan agreed.",
    parallelProcessNoted: "",
    nextSession: d(14),
    confidentialityNote: "Held within statutory limits. HR informed only that wellbeing pathway has been activated, no detail shared.",
  },
  {
    id: "ss5",
    date: d(-17),
    supervisee: "staff_lackson",
    supervisor: "staff_darren",
    durationMinutes: 45,
    casesDiscussed: ["yp_casey", "yp_alex"],
    riskThemes: ["Physical intervention thresholds", "Race and power dynamics in restraint"],
    emotionalImpact: "Lackson reflected on the recent guided hold of Alex. He is comfortable with the technical aspects but is increasingly aware of how his identity as a Black male staff member intersects with the dynamics of physical intervention with white children. He wants space to think about this.",
    reflectiveQuestionsExplored: [
      "How do you experience the moment of physical contact differently because of who you are?",
      "What support would help you hold this without it becoming a burden you carry alone?",
      "What conversations do you want the team to have that we are not having?",
    ],
    actionsAgreed: [
      { action: "Anti-racist practice reflection session to be scheduled team-wide", owner: "staff_darren", deadline: d(30) },
      { action: "Lackson invited (not required) to co-facilitate or speak", owner: "staff_lackson", deadline: d(30) },
      { action: "Post-restraint debrief template to include reflection on identity dynamics", owner: "staff_darren", deadline: d(21) },
    ],
    supervisorObservations: "Lackson is raising something the home has under-attended to. His insight is a gift to the team. Care taken not to position him as the team's educator on race; structural change is the manager's responsibility.",
    parallelProcessNoted: "",
    nextSession: d(28),
    confidentialityNote: "Held within statutory limits. Lackson's reflections are not to be shared without his explicit consent; structural actions are the manager's to own.",
  },
  {
    id: "ss6",
    date: d(-21),
    supervisee: "staff_mirela",
    supervisor: "staff_darren",
    durationMinutes: 60,
    casesDiscussed: ["yp_casey"],
    riskThemes: ["Cultural and language barriers in disclosure", "Religious framing of trauma", "Family of origin contact safety"],
    emotionalImpact: "Mirela described feeling caught between Casey's family's religious framing of her trauma ('forgive and move on') and the therapeutic stance the home holds. She feels protective of Casey but does not want to disrespect the family.",
    reflectiveQuestionsExplored: [
      "Whose voice should be loudest in shaping Casey's recovery — and why?",
      "Where does cultural humility end and safeguarding begin for you?",
      "What is yours to hold, and what is the team's to hold?",
    ],
    actionsAgreed: [
      { action: "Multi-agency meeting to clarify family contact safeguards", owner: "staff_darren", deadline: d(14) },
      { action: "Cultural consultation with external advisor re: religious framing of trauma", owner: "staff_darren", deadline: d(21) },
      { action: "Mirela to lead a team learning session on culturally-attuned safeguarding", owner: "staff_mirela", deadline: d(45) },
    ],
    supervisorObservations: "Mirela holds complexity beautifully. The risk is that her thoughtfulness is mistaken for hesitation. Backed her clinical instinct that Casey's safety overrides family preference for non-disclosure pathways.",
    parallelProcessNoted: "Mirela's caught-between feeling mirrors Casey's own — wanting to honour family while needing protection from family-aligned narratives. Named and connected explicitly in the session.",
    nextSession: d(7),
    confidentialityNote: "Held within statutory limits. External cultural consultation will be anonymised; family will not be informed of supervision content.",
  },
  {
    id: "ss7",
    date: d(-28),
    supervisee: "staff_ryan",
    supervisor: "staff_darren",
    durationMinutes: 65,
    casesDiscussed: ["yp_jordan", "yp_alex", "yp_casey"],
    riskThemes: ["Whole-team safeguarding workload", "Senior staff exposure to multiple high-risk cases", "Professional identity under pressure"],
    emotionalImpact: "Ryan reflected on a stretch of three weeks where every shift contained a safeguarding concern. He described 'losing the ability to be surprised' and worried this is the start of compassion fatigue rather than professional development.",
    reflectiveQuestionsExplored: [
      "What does 'losing the ability to be surprised' tell you about what you need right now?",
      "What pieces of this work still move you — and how do we protect those pieces?",
      "Where is your line between 'experienced' and 'numb', and how will we both notice if you cross it?",
    ],
    actionsAgreed: [
      { action: "Ryan to take two consecutive rest days within next 14 days", owner: "staff_ryan", deadline: d(14) },
      { action: "Workload review — redistribute keywork for one of the three high-risk YP", owner: "staff_darren", deadline: d(7) },
      { action: "Re-enrol Ryan in clinical reflective group facilitated externally", owner: "staff_darren", deadline: d(21) },
    ],
    supervisorObservations: "Ryan is one of the strongest practitioners in the home and therefore at the highest risk of being over-relied upon. Naming the over-reliance is a manager responsibility, not a Ryan responsibility.",
    parallelProcessNoted: "Ryan's 'losing surprise' echoes Jordan's documented affective flattening when overwhelmed. Discussed as a shared signal that the system around them is asking too much.",
    nextSession: d(14),
    confidentialityNote: "Held within statutory limits. Workload concerns shared with RI as a service-level matter, anonymised where possible.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function SafeguardingSupervisionPage() {
  const [data] = useState<SafeguardingSupervision[]>(SEED);
  const [superviseeFilter, setSuperviseeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const supervisees = [...new Set(data.map(r => r.supervisee))];

  const filtered = useMemo(() => {
    let out = [...data];
    if (superviseeFilter !== "all") out = out.filter(r => r.supervisee === superviseeFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [data, superviseeFilter, sortBy]);

  const sessionsThisMonth = data.filter(r => r.date >= d(-30)).length;
  const avgDuration = data.length ? Math.round(data.reduce((sum, r) => sum + r.durationMinutes, 0) / data.length) : 0;
  const highRiskCases = new Set(data.flatMap(r => r.casesDiscussed)).size;
  const staffCovered = supervisees.length;

  const exportCols: ExportColumn<SafeguardingSupervision>[] = useMemo(() => [
    { header: "Date", accessor: (r: SafeguardingSupervision) => r.date },
    { header: "Supervisee", accessor: (r: SafeguardingSupervision) => getStaffName(r.supervisee) },
    { header: "Supervisor", accessor: (r: SafeguardingSupervision) => getStaffName(r.supervisor) },
    { header: "Duration (min)", accessor: (r: SafeguardingSupervision) => r.durationMinutes },
    { header: "Cases Discussed", accessor: (r: SafeguardingSupervision) => r.casesDiscussed.map(id => getYPName(id)).join(", ") },
    { header: "Risk Themes", accessor: (r: SafeguardingSupervision) => r.riskThemes.join("; ") },
    { header: "Emotional Impact", accessor: (r: SafeguardingSupervision) => r.emotionalImpact },
    { header: "Parallel Process Noted", accessor: (r: SafeguardingSupervision) => r.parallelProcessNoted || "—" },
    { header: "Actions Agreed", accessor: (r: SafeguardingSupervision) => r.actionsAgreed.map(a => `${a.action} (${getStaffName(a.owner)} by ${a.deadline})`).join("; ") },
    { header: "Next Session", accessor: (r: SafeguardingSupervision) => r.nextSession },
  ], []);

  return (
    <PageShell
      title="Safeguarding Supervision"
      subtitle="Specialist reflective supervision for staff working with children at high risk — distinct from line management"
      actions={[
        <PrintButton key="p" title="Safeguarding Supervision" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="safeguarding-supervision" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* info banner */}
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 flex gap-3">
          <Shield className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-indigo-900">Safeguarding supervision is a confidential reflective space</p>
            <p className="text-indigo-800">Distinct from line management, this supervision provides protected space for staff to reflect on the emotional impact of working with children at high risk. Content is held within statutory limits — disclosure is required only where a child is at risk of significant harm or where staff are unable to safeguard. Required by Working Together 2023 and Quality Standard 5.</p>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions This Month", value: sessionsThisMonth, icon: Calendar, colour: "text-indigo-600" },
            { label: "Avg Duration (min)", value: avgDuration, icon: Clock, colour: "text-blue-600" },
            { label: "High-Risk Cases Discussed", value: highRiskCases, icon: AlertTriangle, colour: "text-amber-600" },
            { label: "Staff Covered", value: staffCovered, icon: Users, colour: "text-green-600" },
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

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-56">
                <Label className="text-xs flex items-center gap-1"><Eye className="h-3 w-3" />Supervisee</Label>
                <Select value={superviseeFilter} onValueChange={setSuperviseeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {supervisees.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* session cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const hasParallel = r.parallelProcessNoted.trim().length > 0;
            return (
              <Card key={r.id} className={cn(hasParallel && "border-purple-300 ring-1 ring-purple-200")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getStaffName(r.supervisee)}</CardTitle>
                        <Badge variant="outline" className="text-xs">Supervisor: {getStaffName(r.supervisor)}</Badge>
                        <Badge variant="outline" className="text-xs">{r.durationMinutes} min</Badge>
                        {r.casesDiscussed.map(id => (
                          <Badge key={id} className="text-xs bg-amber-100 text-amber-800">{getYPName(id)}</Badge>
                        ))}
                        {hasParallel && (
                          <Badge className="text-xs bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Brain className="h-3 w-3" />Parallel process
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-1">
                      {r.riskThemes.map(t => (
                        <Badge key={t} variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">{t}</Badge>
                      ))}
                    </div>

                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-semibold text-pink-800 mb-1">Emotional impact on staff</p>
                      <p className="text-sm text-pink-900">{r.emotionalImpact}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2">Reflective questions explored</p>
                      <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
                        {r.reflectiveQuestionsExplored.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>

                    {hasParallel && (
                      <div className="rounded-lg bg-purple-50 border border-purple-300 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1">
                          <Brain className="h-3 w-3" />Parallel process noted (clinical signal)
                        </p>
                        <p className="text-sm text-purple-900">{r.parallelProcessNoted}</p>
                      </div>
                    )}

                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-800 mb-2">Actions agreed</p>
                      <ul className="text-sm text-green-900 space-y-1">
                        {r.actionsAgreed.map((a, i) => (
                          <li key={i} className="flex flex-wrap gap-2">
                            <span>•</span>
                            <span className="flex-1">{a.action}</span>
                            <span className="text-xs text-green-700">{getStaffName(a.owner)} · by {a.deadline}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Supervisor observations</p>
                      <p className="text-sm text-amber-900">{r.supervisorObservations}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Next session</p>
                          <p className="text-sm text-slate-900">{r.nextSession}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Lock className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Confidentiality</p>
                          <p className="text-sm text-slate-900">{r.confidentialityNote}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory framework</p>
          <p>Safeguarding supervision sits alongside, but is distinct from, line management supervision. It is required practice under Working Together to Safeguard Children (2023) and is a key component of meeting Quality Standard 5 — the protection of children. Specialist supervision provides reflective space focused on the emotional and clinical impact of safeguarding work, supports staff resilience, and surfaces clinical signals such as parallel process that line management is not designed to hold. Records are stored within restricted access and disclosure is governed by safeguarding statutory thresholds.</p>
        </div>
      </div>
    </PageShell>
  );
}
