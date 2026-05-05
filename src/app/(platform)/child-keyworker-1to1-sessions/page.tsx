"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Clock, MessageCircle, ChevronUp, ChevronDown, ArrowUpDown, Search, Heart, CheckCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateKeyworkSession } from "@/hooks/use-keywork-sessions";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type SessionFormat =
  | "1:1 at home"
  | "1:1 walk"
  | "1:1 cafe"
  | "1:1 driving"
  | "1:1 cooking together"
  | "1:1 boxing/sport"
  | "Brief check-in"
  | "Crisis check-in";

interface SessionRecord {
  id: string;
  youngPerson: string;
  keyWorker: string;
  sessionDate: string;
  duration: number;
  format: SessionFormat;
  childChoseFormat: boolean;
  themesCovered: string[];
  childWentInWith: string;
  childWalkedOutWith: string;
  whatChildBroughtUp: string;
  whatStaffBroughtUp: string;
  agreedActionsForStaff: string[];
  agreedActionsForChild: string[];
  childSatisfaction: 1 | 2 | 3 | 4 | 5;
  followUpDate: string;
  flagsRaised: string[];
  notes?: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const FORMAT_CLR: Record<SessionFormat, string> = {
  "1:1 at home": "bg-rose-100 text-rose-800",
  "1:1 walk": "bg-emerald-100 text-emerald-800",
  "1:1 cafe": "bg-amber-100 text-amber-800",
  "1:1 driving": "bg-sky-100 text-sky-800",
  "1:1 cooking together": "bg-orange-100 text-orange-800",
  "1:1 boxing/sport": "bg-red-100 text-red-800",
  "Brief check-in": "bg-slate-100 text-slate-800",
  "Crisis check-in": "bg-fuchsia-100 text-fuchsia-800",
};

const FORMATS: SessionFormat[] = [
  "1:1 at home",
  "1:1 walk",
  "1:1 cafe",
  "1:1 driving",
  "1:1 cooking together",
  "1:1 boxing/sport",
  "Brief check-in",
  "Crisis check-in",
];

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SessionRecord[] = [
  {
    id: "s1",
    youngPerson: "yp_casey",
    keyWorker: "staff_anna",
    sessionDate: d(-2),
    duration: 55,
    format: "1:1 at home",
    childChoseFormat: true,
    themesCovered: ["Friendship with Ellie", "School worry", "Butterflies"],
    childWentInWith: "Quiet, a bit flat after school. Said she didn't want to talk much but wanted to do dot painting together.",
    childWalkedOutWith: "Smiling, more relaxed. Asked if we could do this again next week. Took the painting up to her room.",
    whatChildBroughtUp: "Ellie has been sitting with someone else at lunch and Casey doesn't know if they've fallen out. Casey also mentioned she feels watched in maths and the teacher 'never picks her' but also 'always picks her'.",
    whatStaffBroughtUp: "Gently asked about how she's been sleeping (she'd mentioned bad dreams to Chervelle). Reflected back what I'd noticed — she'd been spending more time in her room this week.",
    agreedActionsForStaff: [
      "Email school to ask if anything has changed in maths group dynamics",
      "Check in with Chervelle about night-time pattern this week",
    ],
    agreedActionsForChild: [
      "Try one open question with Ellie ('do you want to sit together tomorrow?') if it feels okay",
    ],
    childSatisfaction: 5,
    followUpDate: d(5),
    flagsRaised: [],
    notes: "Did the whole session at the kitchen table doing dot painting. Casey opens up most when her hands are busy.",
  },
  {
    id: "s2",
    youngPerson: "yp_jordan",
    keyWorker: "staff_anna",
    sessionDate: d(-3),
    duration: 40,
    format: "1:1 driving",
    childChoseFormat: true,
    themesCovered: ["Football coaching wages", "Mum's WhatsApp", "Eid plans"],
    childWentInWith: "Wound up about money. Coach hadn't paid him yet for the two Saturdays he assisted.",
    childWalkedOutWith: "Calmer, had a plan. Felt heard about Eid.",
    whatChildBroughtUp: "He's owed £40 from the football coaching and feels embarrassed to chase it. Also mentioned mum sent a long WhatsApp last night and he 'didn't know what to say back'.",
    whatStaffBroughtUp: "Reminded him Eid is in just under a fortnight and asked what he'd like to do — to pray at the mosque, or have something at home, or both.",
    agreedActionsForStaff: [
      "Help draft a polite chasing message to the coach if Jordan wants",
      "Speak to Darren about taking Jordan to the mosque on Eid morning",
      "Coordinate Eid food shop — Jordan wants to help cook",
    ],
    agreedActionsForChild: [
      "Read mum's WhatsApp again with Anna present, then decide if/how to reply",
    ],
    childSatisfaction: 5,
    followUpDate: d(11),
    flagsRaised: [],
    notes: "Driving sessions work for Jordan — no eye contact pressure. Drove the long way back from Tesco.",
  },
  {
    id: "s3",
    youngPerson: "yp_alex",
    keyWorker: "staff_anna",
    sessionDate: d(-4),
    duration: 35,
    format: "1:1 boxing/sport",
    childChoseFormat: true,
    themesCovered: ["Identity", "Mum", "Boxing"],
    childWentInWith: "Edgy, hood up. Hadn't slept well. Wanted to hit pads, not talk.",
    childWalkedOutWith: "Sweaty, more grounded. A bit more eye contact. Said 'thanks Anna' on the way back to the car.",
    whatChildBroughtUp: "Between rounds said 'I don't even know who I am sometimes'. Didn't elaborate, but said it twice.",
    whatStaffBroughtUp: "Asked how the contact call with mum on Sunday had landed. He shrugged but said it was 'alright'.",
    agreedActionsForStaff: [
      "Pass identity comment to therapist (with Alex's knowledge)",
      "Book another boxing session for next week",
    ],
    agreedActionsForChild: [],
    childSatisfaction: 4,
    followUpDate: d(3),
    flagsRaised: ["Identity distress comment — share with therapist"],
    notes: "Pad work first, talking second. Alex is opening up more in this format than at home.",
  },
  {
    id: "s4",
    youngPerson: "yp_casey",
    keyWorker: "staff_anna",
    sessionDate: d(-9),
    duration: 50,
    format: "1:1 at home",
    childChoseFormat: true,
    themesCovered: ["Grandad anniversary planning", "Memory box", "Butterflies"],
    childWentInWith: "Tearful before we started — anniversary of her grandad's death is coming up.",
    childWalkedOutWith: "Calmer. Had a plan for the day. Said she felt 'less alone with it'.",
    whatChildBroughtUp: "Wants to do something on the day — light a candle, plant something. Worried no-one will remember it's the anniversary.",
    whatStaffBroughtUp: "Suggested we put the date in the staff handover so the team can be especially mindful that day. Asked if she'd like to make a memory box.",
    agreedActionsForStaff: [
      "Add anniversary date to handover with sensitive note",
      "Buy butterfly bush plant and small terracotta pot for the day",
      "Speak to therapist about anniversary support",
    ],
    agreedActionsForChild: [
      "Choose a photo of grandad for the memory box if she wants",
    ],
    childSatisfaction: 5,
    followUpDate: d(-2),
    flagsRaised: ["Anniversary date — sensitive support needed"],
  },
  {
    id: "s5",
    youngPerson: "yp_alex",
    keyWorker: "staff_anna",
    sessionDate: d(-11),
    duration: 60,
    format: "1:1 cafe",
    childChoseFormat: false,
    themesCovered: ["College taster day", "RSD work", "Mum"],
    childWentInWith: "Distracted, on his phone a lot at first. Resistant to the cafe choice — said he'd rather have stayed at home.",
    childWalkedOutWith: "More engaged by the end. Asked questions about the college taster.",
    whatChildBroughtUp: "Mum said she'd 'try to come' to the college taster but he doesn't believe her. Said 'she always says she'll come and never does'.",
    whatStaffBroughtUp: "Talked through what RSD (Rejection Sensitive Dysphoria) feels like in his body — work the therapist has been doing. Asked if the mum thing felt like that.",
    agreedActionsForStaff: [
      "Confirm taster day logistics — pick-up, what to bring",
      "Speak to mum directly to get a clear yes/no about attending",
      "Have a back-up plan ready if mum doesn't show",
    ],
    agreedActionsForChild: [
      "Try the breathing technique therapist taught if RSD hits hard at the taster",
    ],
    childSatisfaction: 3,
    followUpDate: d(2),
    flagsRaised: [],
    notes: "Cafe was a stretch — he prefers the car. Will offer driving format next time. He stayed though, which is a win.",
  },
  {
    id: "s6",
    youngPerson: "yp_jordan",
    keyWorker: "staff_anna",
    sessionDate: d(-14),
    duration: 45,
    format: "1:1 cooking together",
    childChoseFormat: true,
    themesCovered: ["Advocate work", "School", "Football coaching"],
    childWentInWith: "Pleased — his advocate had visited that morning and he'd asked for things he wanted.",
    childWalkedOutWith: "Proud. Felt listened to. Took photos of the curry to send to his mum.",
    whatChildBroughtUp: "Told me what he'd asked his advocate for — more contact with his cousin, and to be allowed to walk to football coaching by himself.",
    whatStaffBroughtUp: "Affirmed how well he'd used the advocate. Asked what felt different about asking through her vs. asking us directly.",
    agreedActionsForStaff: [
      "Meet with advocate to align on Jordan's asks",
      "Risk-assess walking to football coaching independently",
    ],
    agreedActionsForChild: [],
    childSatisfaction: 5,
    followUpDate: d(0),
    flagsRaised: [],
    notes: "Made chicken curry together. Jordan's confidence in the kitchen has grown massively.",
  },
  {
    id: "s7",
    youngPerson: "yp_alex",
    keyWorker: "staff_anna",
    sessionDate: d(-18),
    duration: 30,
    format: "Brief check-in",
    childChoseFormat: true,
    themesCovered: ["Mum", "Sleep"],
    childWentInWith: "Subdued. Said he'd had a bad night.",
    childWalkedOutWith: "A little lighter. Agreed to a longer session at the weekend.",
    whatChildBroughtUp: "Bad dream about mum. Didn't want to give detail. Asked if I thought she was 'okay'.",
    whatStaffBroughtUp: "Reassured we'd had recent contact and she was alright. Didn't push the dream.",
    agreedActionsForStaff: [
      "Schedule longer session Saturday — boxing format",
      "Note in handover Alex had a dream-related disturbance",
    ],
    agreedActionsForChild: [],
    childSatisfaction: 4,
    followUpDate: d(-13),
    flagsRaised: [],
  },
  {
    id: "s8",
    youngPerson: "yp_casey",
    keyWorker: "staff_anna",
    sessionDate: d(-16),
    duration: 50,
    format: "1:1 at home",
    childChoseFormat: true,
    themesCovered: ["Ellie", "Friendship", "School worry"],
    childWentInWith: "Anxious — said her stomach hurt thinking about school in the morning.",
    childWalkedOutWith: "Less anxious. Had a plan for the morning.",
    whatChildBroughtUp: "Worried Ellie didn't want to be her friend any more. Worried about presenting in English.",
    whatStaffBroughtUp: "Asked what would help in the morning. Offered the comfort routine — slow start, breakfast, walk in.",
    agreedActionsForStaff: [
      "Slow morning tomorrow — Anna in early",
      "Email English teacher — ask if Casey can present to a smaller group",
    ],
    agreedActionsForChild: [
      "Try sitting next to Ellie at registration",
    ],
    childSatisfaction: 5,
    followUpDate: d(-9),
    flagsRaised: [],
    notes: "Dot painting again. She always asks for it now.",
  },
  {
    id: "s9",
    youngPerson: "yp_jordan",
    keyWorker: "staff_anna",
    sessionDate: d(-26),
    duration: 50,
    format: "1:1 driving",
    childChoseFormat: true,
    themesCovered: ["Cousin contact", "School report", "Mum's WhatsApp"],
    childWentInWith: "Wanting to talk. Had been waiting for our session.",
    childWalkedOutWith: "Settled. Felt his asks were taken seriously.",
    whatChildBroughtUp: "Misses his cousin. Hasn't seen him since coming into care 5 months ago. School report came back good — wanted to share.",
    whatStaffBroughtUp: "Celebrated the school report. Asked permission to raise cousin contact at LAC review next week.",
    agreedActionsForStaff: [
      "Add cousin contact ask to LAC review prep",
      "Print school report to put on Jordan's wall",
    ],
    agreedActionsForChild: [],
    childSatisfaction: 5,
    followUpDate: d(-12),
    flagsRaised: [],
  },
  {
    id: "s10",
    youngPerson: "yp_alex",
    keyWorker: "staff_anna",
    sessionDate: d(-25),
    duration: 50,
    format: "1:1 walk",
    childChoseFormat: true,
    themesCovered: ["Identity", "RSD work", "Friendships"],
    childWentInWith: "Quiet but willing. Suggested the walk himself.",
    childWalkedOutWith: "More open. Said the walk had 'helped his head'.",
    whatChildBroughtUp: "He'd had a difficult moment at school the day before — felt 'left out' at lunch. Linked it to the RSD work.",
    whatStaffBroughtUp: "Praised him for naming it as RSD rather than acting on it. Asked what he did instead.",
    agreedActionsForStaff: [
      "Feedback to therapist that RSD framework is landing",
    ],
    agreedActionsForChild: [
      "Keep using the 'name it' technique when RSD hits at school",
    ],
    childSatisfaction: 4,
    followUpDate: d(-18),
    flagsRaised: [],
    notes: "Walked the canal path. Alex talks more when we're side-by-side.",
  },
  {
    id: "s11",
    youngPerson: "yp_casey",
    keyWorker: "staff_anna",
    sessionDate: d(-23),
    duration: 45,
    format: "1:1 at home",
    childChoseFormat: true,
    themesCovered: ["Butterflies", "Family memories", "Self-image"],
    childWentInWith: "Curious. Wanted to show me a butterfly drawing.",
    childWalkedOutWith: "Proud. Asked to put the drawing in the hallway.",
    whatChildBroughtUp: "Why butterflies feel important — connected to her grandad's garden. First time she's spoken about him without crying.",
    whatStaffBroughtUp: "Reflected back how meaningful the butterflies are. Asked if she'd like a butterfly-themed corner in her room.",
    agreedActionsForStaff: [
      "Look at butterfly wall stickers / soft furnishings with Casey budget",
    ],
    agreedActionsForChild: [],
    childSatisfaction: 5,
    followUpDate: d(-16),
    flagsRaised: [],
  },
  {
    id: "s12",
    youngPerson: "yp_jordan",
    keyWorker: "staff_anna",
    sessionDate: d(-40),
    duration: 30,
    format: "Brief check-in",
    childChoseFormat: false,
    themesCovered: ["Friend group at school"],
    childWentInWith: "Reluctant — wanted to play FIFA.",
    childWalkedOutWith: "Brief but okay. Got back to FIFA happy.",
    whatChildBroughtUp: "Not much — said everything was 'fine'.",
    whatStaffBroughtUp: "Wanted to mark we hadn't had a proper sit-down for a while. Floated next session being a driving one.",
    agreedActionsForStaff: [
      "Book proper session next week — driving format",
    ],
    agreedActionsForChild: [],
    childSatisfaction: 3,
    followUpDate: d(-33),
    flagsRaised: [],
    notes: "Sometimes a short check-in is all that's needed. Don't force depth.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ChildKeyworker1to1SessionsPage() {
  const createSession = useCreateKeyworkSession();
  const [data, setData] = useState<SessionRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [nChild, setNChild] = useState("");
  const [nFormat, setNFormat] = useState("");
  const [nThemes, setNThemes] = useState("");
  const [nChildBroughtUp, setNChildBroughtUp] = useState("");
  const [nStaffBroughtUp, setNStaffBroughtUp] = useState("");

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const childIds = [...new Set(data.map(r => r.youngPerson))];

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.youngPerson).toLowerCase().includes(s) ||
        getStaffName(r.keyWorker).toLowerCase().includes(s) ||
        r.themesCovered.some(t => t.toLowerCase().includes(s)) ||
        r.whatChildBroughtUp.toLowerCase().includes(s)
      );
    }
    if (childFilter !== "all") out = out.filter(r => r.youngPerson === childFilter);
    if (formatFilter !== "all") out = out.filter(r => r.format === formatFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.sessionDate.localeCompare(b.sessionDate) : b.sessionDate.localeCompare(a.sessionDate));
    return out;
  }, [data, search, childFilter, formatFilter, sortBy]);

  const sessionsThisMonth = data.filter(r => r.sessionDate >= d(-30)).length;
  const avgSatisfaction = data.length
    ? (data.reduce((sum, r) => sum + r.childSatisfaction, 0) / data.length).toFixed(1)
    : "—";
  const childChosePct = data.length
    ? Math.round((data.filter(r => r.childChoseFormat).length / data.length) * 100)
    : 0;
  const flagsThisMonth = data.filter(r => r.sessionDate >= d(-30) && r.flagsRaised.length > 0).length;

  const exportCols: ExportColumn<SessionRecord>[] = useMemo(() => [
    { header: "Date", accessor: (r: SessionRecord) => r.sessionDate },
    { header: "Young Person", accessor: (r: SessionRecord) => getYPName(r.youngPerson) },
    { header: "Key Worker", accessor: (r: SessionRecord) => getStaffName(r.keyWorker) },
    { header: "Format", accessor: (r: SessionRecord) => r.format },
    { header: "Duration (min)", accessor: (r: SessionRecord) => r.duration },
    { header: "Child Chose Format", accessor: (r: SessionRecord) => r.childChoseFormat ? "Yes" : "No" },
    { header: "Themes", accessor: (r: SessionRecord) => r.themesCovered.join("; ") },
    { header: "Child Brought Up", accessor: (r: SessionRecord) => r.whatChildBroughtUp },
    { header: "Staff Brought Up", accessor: (r: SessionRecord) => r.whatStaffBroughtUp },
    { header: "Walked In With", accessor: (r: SessionRecord) => r.childWentInWith },
    { header: "Walked Out With", accessor: (r: SessionRecord) => r.childWalkedOutWith },
    { header: "Actions for Staff", accessor: (r: SessionRecord) => r.agreedActionsForStaff.join("; ") },
    { header: "Actions for Child", accessor: (r: SessionRecord) => r.agreedActionsForChild.join("; ") },
    { header: "Child Satisfaction (1–5)", accessor: (r: SessionRecord) => r.childSatisfaction },
    { header: "Follow-up Date", accessor: (r: SessionRecord) => r.followUpDate },
    { header: "Flags Raised", accessor: (r: SessionRecord) => r.flagsRaised.join("; ") || "—" },
    { header: "Notes", accessor: (r: SessionRecord) => r.notes ?? "" },
  ], []);

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <PageShell
      title="1:1 Keyworker Sessions"
      subtitle="Protected weekly/fortnightly time between key worker and young person — themes, voice, agreed actions, follow-up"
      actions={[
        <PrintButton key="p" title="1:1 Keyworker Sessions" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="keyworker-1to1-sessions" />,
        <Button key="n" size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Session</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions This Month", value: sessionsThisMonth, icon: Users, colour: "text-rose-600" },
            { label: "Average Satisfaction", value: avgSatisfaction, icon: Heart, colour: "text-pink-600" },
            { label: "Child Chose Format", value: `${childChosePct}%`, icon: CheckCircle, colour: "text-sky-600" },
            { label: "Flags Raised (Month)", value: flagsThisMonth, icon: MessageCircle, colour: "text-amber-600" },
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

        {/* filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Child, theme, content…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs">Child</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    {childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs">Format</Label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* session cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className="border-rose-100">
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.youngPerson)} with {getStaffName(r.keyWorker)}</CardTitle>
                        <Badge className={cn("text-xs", FORMAT_CLR[r.format])}>{r.format}</Badge>
                        <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{r.duration} min</Badge>
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">{stars(r.childSatisfaction)}</Badge>
                        {r.childChoseFormat && <Badge className="text-xs bg-sky-100 text-sky-800">Child chose</Badge>}
                        {r.flagsRaised.length > 0 && <Badge className="text-xs bg-amber-100 text-amber-800">Flag raised</Badge>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{r.sessionDate}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    {r.themesCovered.length > 0 && (
                      <div className="flex gap-1 flex-wrap items-center">
                        <span className="text-xs text-muted-foreground mr-1">Themes:</span>
                        {r.themesCovered.map(t => <Badge key={t} variant="outline" className="text-xs border-rose-200 text-rose-700">{t}</Badge>)}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                        <p className="text-xs font-semibold text-rose-800 mb-1">What child went in with</p>
                        <p className="text-sm text-rose-900">{r.childWentInWith}</p>
                      </div>
                      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                        <p className="text-xs font-semibold text-sky-800 mb-1">What child walked out with</p>
                        <p className="text-sm text-sky-900">{r.childWalkedOutWith}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">What child brought up</p>
                        <p className="text-sm text-pink-900">{r.whatChildBroughtUp}</p>
                      </div>
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1">What staff brought up</p>
                        <p className="text-sm text-indigo-900">{r.whatStaffBroughtUp}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1">Agreed actions — staff</p>
                        {r.agreedActionsForStaff.length > 0 ? (
                          <ul className="text-sm text-emerald-900 list-disc pl-4 space-y-1">
                            {r.agreedActionsForStaff.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        ) : <p className="text-sm text-emerald-900 italic">None</p>}
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Agreed actions — child</p>
                        {r.agreedActionsForChild.length > 0 ? (
                          <ul className="text-sm text-amber-900 list-disc pl-4 space-y-1">
                            {r.agreedActionsForChild.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        ) : <p className="text-sm text-amber-900 italic">None</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Follow-up: <span className="font-medium text-foreground">{r.followUpDate}</span></span>
                      {r.flagsRaised.length > 0 && (
                        <span className="flex items-center gap-1">
                          Flags:
                          {r.flagsRaised.map(f => <Badge key={f} className="text-xs bg-amber-100 text-amber-800">{f}</Badge>)}
                        </span>
                      )}
                    </div>

                    {r.notes && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-800 mb-1">Notes</p>
                        <p className="text-sm text-slate-900">{r.notes}</p>
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
          <p className="font-semibold">Regulatory framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015 — Quality Standard 5 (Education and Positive Relationships) and Quality Standard 7 (Leadership and Management). Regulation 7 sets out the keyworker duty: each child must have a designated key worker who builds a positive, trusting relationship and advocates for their needs.</p>
          <p>UNCRC Article 12: every child has the right to express their views in matters affecting them and to have those views given due weight. 1:1 sessions are a primary route through which child voice is captured, evidenced and acted on.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New 1:1 Session</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Young Person</Label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {[...new Set(data.map(r => r.youngPerson))].map(id => (
                    <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select value={nFormat} onValueChange={setNFormat}>
                <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Themes Covered</Label>
              <Input placeholder="Comma-separated themes" value={nThemes} onChange={e => setNThemes(e.target.value)} />
            </div>
            <div>
              <Label>What child brought up</Label>
              <Textarea placeholder="Record what the child raised..." value={nChildBroughtUp} onChange={e => setNChildBroughtUp(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>What staff brought up</Label>
              <Textarea placeholder="Record what staff raised..." value={nStaffBroughtUp} onChange={e => setNStaffBroughtUp(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button disabled={!nChild || !nFormat} onClick={() => {
              const session: SessionRecord = {
                id: `s_${Date.now()}`,
                youngPerson: nChild,
                keyWorker: "staff_anna",
                sessionDate: new Date().toISOString().slice(0, 10),
                duration: 45,
                format: nFormat as SessionFormat,
                childChoseFormat: true,
                themesCovered: nThemes.split(",").map(t => t.trim()).filter(Boolean),
                childWentInWith: "",
                childWalkedOutWith: "",
                whatChildBroughtUp: nChildBroughtUp,
                whatStaffBroughtUp: nStaffBroughtUp,
                agreedActionsForStaff: [],
                agreedActionsForChild: [],
                childSatisfaction: 4,
                followUpDate: d(7),
                flagsRaised: [],
              };
              setData(prev => [session, ...prev]);
              createSession.mutate({
                child_id: nChild,
                staff_id: "staff_anna",
                session_date: new Date().toISOString().slice(0, 10),
                duration_minutes: 45,
                format: nFormat,
                child_chose_format: true,
                themes_covered: nThemes.split(",").map(t => t.trim()).filter(Boolean),
                what_child_brought_up: nChildBroughtUp,
                what_staff_brought_up: nStaffBroughtUp,
                agreed_actions_staff: [],
                agreed_actions_child: [],
                child_satisfaction: 4,
                follow_up_date: d(7),
                flags_raised: [],
              });
              setShowNew(false);
              setNChild(""); setNFormat(""); setNThemes(""); setNChildBroughtUp(""); setNStaffBroughtUp("");
            }}>Save Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
