"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ReflectionType = "daily" | "incident" | "training" | "supervision" | "personal_development" | "critical_event" | "positive_practice";
type Mood = "positive" | "neutral" | "challenging" | "difficult";

interface StaffReflection {
  id: string;
  staffId: string;
  date: string;
  type: ReflectionType;
  mood: Mood;
  title: string;
  whatHappened: string;
  whatIFelt: string;
  whatILearned: string;
  whatIWouldDoDifferently: string;
  linkedToYp: string[];
  linkedIncident: string | null;
  sharedWithManager: boolean;
  managerFeedback: string;
  developmentGoal: string;
  isPrivate: boolean;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RT_LABEL: Record<ReflectionType, string> = { daily: "Daily Reflection", incident: "Incident Reflection", training: "Training Reflection", supervision: "Post-Supervision", personal_development: "Personal Development", critical_event: "Critical Event", positive_practice: "Positive Practice" };
const RT_CLR: Record<ReflectionType, string> = { daily: "bg-blue-100 text-blue-800", incident: "bg-red-100 text-red-800", training: "bg-green-100 text-green-800", supervision: "bg-purple-100 text-purple-800", personal_development: "bg-indigo-100 text-indigo-800", critical_event: "bg-red-200 text-red-900", positive_practice: "bg-emerald-100 text-emerald-800" };
const MOOD_CLR: Record<Mood, string> = { positive: "bg-green-100 text-green-800", neutral: "bg-gray-100 text-gray-800", challenging: "bg-amber-100 text-amber-800", difficult: "bg-red-100 text-red-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: StaffReflection[] = [
  {
    id: "sr1", staffId: "staff_darren", date: d(-1), type: "incident", mood: "challenging",
    title: "Reflecting on Jordan's meltdown",
    whatHappened: "Jordan had a meltdown in the kitchen caused by multiple noise sources running simultaneously. I wasn't in the room when it started — Ryan managed the initial response well.",
    whatIFelt: "Frustrated that we haven't yet implemented a kitchen noise protocol despite identifying this as a trigger previously. Also proud of Ryan's de-escalation approach — he's really developed in this area.",
    whatILearned: "We need to be more proactive about environmental triggers. The BSP identifies kitchen noise as a risk but we haven't embedded this into daily routines. Knowing isn't the same as doing.",
    whatIWouldDoDifferently: "Implement a visual traffic light system for the kitchen — green means one appliance at a time, amber means two, red means stop and check who's nearby.",
    linkedToYp: ["yp_jordan"], linkedIncident: "INC-2345",
    sharedWithManager: false, managerFeedback: "",
    developmentGoal: "Complete environmental adaptation plan for all common areas by end of month.",
    isPrivate: false,
  },
  {
    id: "sr2", staffId: "staff_anna", date: d(-2), type: "positive_practice", mood: "positive",
    title: "Casey's art therapy breakthrough",
    whatHappened: "Casey completed her best art therapy session yet. She produced a painting about her feelings and was genuinely proud of it. She asked for it to be framed and hung in her room.",
    whatIFelt: "Genuinely moved by Casey's progress. When she first arrived, she would barely make eye contact. Seeing her express herself through art and feel proud of what she created was emotional.",
    whatILearned: "Art therapy is a powerful medium for Casey. Non-verbal expression removes the pressure of having to articulate trauma. The therapeutic relationship with Sarah is clearly strong.",
    whatIWouldDoDifferently: "Nothing specific — this was a good outcome. But I want to build on this by providing art materials in Casey's room for independent expression.",
    linkedToYp: ["yp_casey"], linkedIncident: null,
    sharedWithManager: true, managerFeedback: "Great observation Anna. Let's invest in a proper art set for Casey and consider increasing therapy frequency.",
    developmentGoal: "Learn more about therapeutic approaches for trauma through art.",
    isPrivate: false,
  },
  {
    id: "sr3", staffId: "staff_ryan", date: d(-3), type: "training", mood: "positive",
    title: "PACE training day reflection",
    whatHappened: "Completed advanced PACE (Playfulness, Acceptance, Curiosity, Empathy) training. Focused on applying PACE principles during high-stress moments.",
    whatIFelt: "Energised and validated. Much of what we already do aligns with PACE, but the training gave me language and framework to be more intentional. The scenario exercises were especially useful.",
    whatILearned: "Curiosity is the most underused element. When Jordan is escalating, I tend to jump to acceptance ('I can see this is hard') but skipping curiosity ('I wonder what's happening inside right now?'). Curiosity before acceptance gives the child more agency.",
    whatIWouldDoDifferently: "Start with curiosity statements more often. 'I wonder if…' before 'I understand that…'. Practice this specifically with Jordan this week.",
    linkedToYp: [], linkedIncident: null,
    sharedWithManager: true, managerFeedback: "Excellent reflection Ryan. Let's discuss in supervision how to cascade this learning to the wider team.",
    developmentGoal: "Practice curiosity-first approach for 2 weeks and review with Darren in supervision.",
    isPrivate: false,
  },
  {
    id: "sr4", staffId: "staff_chervelle", date: d(-5), type: "critical_event", mood: "difficult",
    title: "Alex's attempt to leave at 2am",
    whatHappened: "During my sleep-in, Alex attempted to leave the building at 2am. The door alarm triggered and I found him fully dressed at the front door. The de-escalation took 90 minutes. I called Darren for guidance.",
    whatIFelt: "Scared initially — the alarm going off at 2am is jarring. Then focused on Alex's safety. Afterwards, exhausted and a bit shaky. I questioned whether I handled it correctly. The 90 minutes felt much longer.",
    whatILearned: "Alex's desire to go to mum's house is a recurring theme. His attachment needs intensify at night. My instinct to follow at a distance was correct — crowding him at the door would have escalated things. Calling Darren was the right decision, not a weakness.",
    whatIWouldDoDifferently: "Keep a comfort box near the sleep-in room with items that help Alex feel connected to mum — photos, a letter, his favourite blanket. If I can offer these before he reaches the door, it might help.",
    linkedToYp: ["yp_alex"], linkedIncident: "INC-2298",
    sharedWithManager: true, managerFeedback: "You handled this brilliantly Chervelle. Your instincts were spot-on. The comfort box is an excellent idea — let's implement it. Please take your compensatory rest as discussed.",
    developmentGoal: "Build night-time emotional support toolkit. Discuss with therapist about Alex's attachment interventions.",
    isPrivate: false,
  },
  {
    id: "sr5", staffId: "staff_darren", date: d(-7), type: "supervision", mood: "neutral",
    title: "Post-supervision reflection — leadership style",
    whatHappened: "Had my monthly supervision with the Responsible Individual. Discussed the team's development, my leadership approach, and upcoming Ofsted preparation. RI challenged me on delegation — I tend to take too much on.",
    whatIFelt: "Slightly defensive initially about the delegation feedback, but on reflection, it's accurate. I do struggle to let go of tasks because I want them done to a certain standard.",
    whatILearned: "Delegation isn't about lowering standards — it's about developing others. Ryan, Anna, and Chervelle are all capable of taking more responsibility. My micromanaging may actually be limiting their growth.",
    whatIWouldDoDifferently: "Identify 3 tasks currently on my list that I can delegate this month. Check in on outcomes rather than processes.",
    linkedToYp: [], linkedIncident: null,
    sharedWithManager: false, managerFeedback: "",
    developmentGoal: "Delegate medication audit, vehicle check schedule, and weekly report to senior staff this month.",
    isPrivate: true,
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function StaffReflectionsPage() {
  const [data] = useState<StaffReflection[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const staffIds = [...new Set(data.map(r => r.staffId))];

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.title.toLowerCase().includes(s) || getStaffName(r.staffId).toLowerCase().includes(s)); }
    if (typeFilter !== "all") out = out.filter(r => r.type === typeFilter);
    if (staffFilter !== "all") out = out.filter(r => r.staffId === staffFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [data, search, typeFilter, staffFilter, sortBy]);

  const exportCols: ExportColumn<StaffReflection>[] = useMemo(() => [
    { header: "Date", accessor: (r: StaffReflection) => r.date },
    { header: "Staff", accessor: (r: StaffReflection) => getStaffName(r.staffId) },
    { header: "Type", accessor: (r: StaffReflection) => RT_LABEL[r.type] },
    { header: "Mood", accessor: (r: StaffReflection) => r.mood },
    { header: "Title", accessor: (r: StaffReflection) => r.title },
    { header: "What Happened", accessor: (r: StaffReflection) => r.whatHappened },
    { header: "What I Learned", accessor: (r: StaffReflection) => r.whatILearned },
    { header: "Development Goal", accessor: (r: StaffReflection) => r.developmentGoal },
    { header: "Shared", accessor: (r: StaffReflection) => r.sharedWithManager ? "Yes" : "No" },
    { header: "Linked YP", accessor: (r: StaffReflection) => r.linkedToYp.map(id => getYPName(id)).join(", ") || "—" },
  ], []);

  return (
    <PageShell
      title="Staff Reflective Logs"
      subtitle="Individual reflections on practice, incidents, and professional development"
      actions={[
        <PrintButton key="p" title="Staff Reflective Logs" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="staff-reflections" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Reflection</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reflections", value: data.length, icon: BookOpen, colour: "text-blue-600" },
            { label: "Shared with Manager", value: data.filter(r => r.sharedWithManager).length, icon: CheckCircle2, colour: "text-green-600" },
            { label: "This Month", value: data.filter(r => r.date >= d(-30)).length, icon: Clock, colour: "text-indigo-600" },
            { label: "Staff Contributing", value: staffIds.length, icon: BookOpen, colour: "text-purple-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Title, staff…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-44"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(RT_LABEL) as [ReflectionType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-40"><Label className="text-xs">Staff</Label><Select value={staffFilter} onValueChange={setStaffFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Staff</SelectItem>{staffIds.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* reflection cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <Badge className={cn("text-xs", RT_CLR[r.type])}>{RT_LABEL[r.type]}</Badge>
                        <Badge className={cn("text-xs", MOOD_CLR[r.mood])}>{r.mood}</Badge>
                        {r.isPrivate && <Badge className="text-xs bg-slate-800 text-white">Private</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.date} · {getStaffName(r.staffId)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">What Happened</p>
                      <p className="text-sm text-blue-900">{r.whatHappened}</p>
                    </div>
                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-semibold text-pink-800 mb-1">What I Felt</p>
                      <p className="text-sm text-pink-900">{r.whatIFelt}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-800 mb-1">What I Learned</p>
                      <p className="text-sm text-green-900">{r.whatILearned}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">What I Would Do Differently</p>
                      <p className="text-sm text-amber-900">{r.whatIWouldDoDifferently}</p>
                    </div>
                    {r.developmentGoal && (
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1">Development Goal</p>
                        <p className="text-sm text-purple-900">{r.developmentGoal}</p>
                      </div>
                    )}
                    {r.linkedToYp.length > 0 && <div className="flex gap-1 flex-wrap"><span className="text-xs text-muted-foreground">Linked YP:</span>{r.linkedToYp.map(id => <Badge key={id} variant="outline" className="text-xs">{getYPName(id)}</Badge>)}</div>}
                    {r.linkedIncident && <p className="text-xs text-muted-foreground">Linked incident: {r.linkedIncident}</p>}
                    {r.sharedWithManager && r.managerFeedback && (
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1">Manager Feedback</p>
                        <p className="text-sm text-indigo-900">{r.managerFeedback}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Professional Development</p>
          <p>Reflective practice is a cornerstone of professional development in residential child care. Staff are encouraged to reflect regularly on practice, incidents, and learning. Reflections shared with managers contribute to supervision discussions and appraisal evidence.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Reflection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input placeholder="Title of reflection" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(RT_LABEL) as [ReflectionType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Mood</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["positive", "neutral", "challenging", "difficult"] as Mood[]).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>What Happened</Label><Textarea rows={3} /></div>
            <div><Label>What I Felt</Label><Textarea rows={2} /></div>
            <div><Label>What I Learned</Label><Textarea rows={2} /></div>
            <div><Label>What I Would Do Differently</Label><Textarea rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
