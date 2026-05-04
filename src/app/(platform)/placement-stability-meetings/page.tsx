"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  Home,
  AlertTriangle,
  CheckCircle2,
  Users,
  Shield,
  ArrowUpDown,
  TrendingUp,
  Heart,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface StabilityMeeting {
  id: string;
  youngPersonId: string;
  meetingDate: string;
  chairperson: string;
  attendees: string[];
  trigger: string;
  riskLevel: "high" | "medium" | "low";
  status: "placement_stable" | "at_risk" | "stabilised" | "ended";
  concerns: string[];
  strengths: string[];
  childView: string;
  agreementsReached: { agreement: string; owner: string; deadline: string; status: string }[];
  outcome: string;
  reviewDate: string | null;
  notes: string;
}

/* ─── seed data ─── */
const meetings: StabilityMeeting[] = [
  {
    id: "psm_001",
    youngPersonId: "yp_casey",
    meetingDate: d(-75),
    chairperson: "IRO (Samantha Green)",
    attendees: ["staff_darren", "staff_chervelle", "Casey's SW (Mark)", "IRO", "Casey (for part)"],
    trigger: "3 missing episodes in 2 weeks. Escalating behaviour. Casey saying 'I don't want to be here.' Staff concern that placement may break down.",
    riskLevel: "high",
    status: "stabilised",
    concerns: [
      "3 missing episodes in 14 days — pattern escalating",
      "Casey verbalising wanting to leave",
      "Conflict with staff over boundaries — Casey experiencing as controlling",
      "Exploitation concerns during missing episodes",
      "Risk of unplanned placement ending if trajectory continues",
    ],
    strengths: [
      "Casey has a strong relationship with Chervelle (key worker)",
      "Casey is attending school consistently",
      "Casey's relationship with mum improving",
      "Casey engages when not in crisis — articulate and insightful",
      "Home has capacity and commitment to work through this",
    ],
    childView: "Casey attended for 15 minutes. Said: 'I don't hate it here. I just hate being told what to do all the time. I'm 15, not 5. If people backed off a bit I'd be fine.' When asked what would help: 'Let me have some freedom. Trust me a bit. Stop making everything into a big deal.' Casey left meeting voluntarily — said they'd said enough.",
    agreementsReached: [
      { agreement: "Review all boundaries — identify which are negotiable vs non-negotiable", owner: "staff_darren", deadline: d(-68), status: "completed" },
      { agreement: "Increase Casey's autonomy: self-managed bedtime, independent travel to school", owner: "staff_chervelle", deadline: d(-65), status: "completed" },
      { agreement: "Cool-off space created in conservatory (Casey's request)", owner: "staff_darren", deadline: d(-60), status: "completed" },
      { agreement: "Weekly check-in between Casey and Chervelle (not formal key work — just a chat)", owner: "staff_chervelle", deadline: d(-70), status: "completed" },
      { agreement: "Exploitation multi-agency meeting — separate but parallel", owner: "staff_darren", deadline: d(-60), status: "completed" },
      { agreement: "Placement not to end without full disruption meeting process", owner: "IRO", deadline: d(-75), status: "completed" },
    ],
    outcome: "Placement stabilised within 3 weeks. Casey's feedback was the turning point — staff recognised that boundaries were disproportionate for a 15-year-old. The autonomy increase (self-managed bedtime, independent travel) dramatically reduced conflict. Missing episodes stopped. Casey said 2 weeks later: 'It's actually alright now. People listen.'",
    reviewDate: d(-45),
    notes: "This is an excellent example of listening to the child. Casey's 'difficult behaviour' was communication that the environment was too restrictive. When the environment changed, the behaviour changed. The placement was saved by being willing to adapt, not by doubling down on control.",
  },
  {
    id: "psm_002",
    youngPersonId: "yp_jordan",
    meetingDate: d(-150),
    chairperson: "staff_darren",
    attendees: ["staff_darren", "staff_anna", "Jordan's SW (Priya)", "Jordan's therapist (Dr. Khan)", "Jordan (via advocate)"],
    trigger: "Jordan's behaviour escalating following contact with birth mum. Physical aggression toward staff (biting, kicking). Staff feeling unable to manage safely. Therapist concerned about placement viability.",
    riskLevel: "medium",
    status: "stabilised",
    concerns: [
      "Physical aggression increasing in frequency (3 incidents in 1 week)",
      "Contact with mum causing severe dysregulation lasting 48+ hours",
      "Staff confidence affected — one staff member requested to not work with Jordan",
      "Jordan's distress clearly increasing — not malicious behaviour but pain-driven",
      "Risk of placement breakdown if staff can't manage safely",
    ],
    strengths: [
      "Anna has excellent relationship with Jordan — not targeted by aggression",
      "Jordan clearly attached to the home — says 'I want to stay'",
      "Therapeutic relationship with Dr. Khan is strong",
      "Team generally committed to Jordan — understand behaviour as communication",
      "Home experienced in trauma-informed practice",
    ],
    childView: "Jordan's advocate reported: Jordan is frightened of being moved. Jordan said 'I don't mean to hurt people. My body does things when I'm scared.' Jordan wants to stay and wants to see mum but 'mum makes me feel confused.' Jordan asked for more time with Anna and for people to 'not shout when I'm upset.'",
    agreementsReached: [
      { agreement: "Suspend mum contact temporarily — therapeutic work to prepare for reintroduction", owner: "Jordan's SW", deadline: d(-140), status: "completed" },
      { agreement: "Additional TCI refresher for all staff — focus on de-escalation for Jordan's profile", owner: "staff_darren", deadline: d(-135), status: "completed" },
      { agreement: "Increase therapy to twice weekly during crisis period", owner: "Dr. Khan", deadline: d(-145), status: "completed" },
      { agreement: "Anna allocated additional time with Jordan (2 extra key work sessions/week)", owner: "staff_anna", deadline: d(-148), status: "completed" },
      { agreement: "Sensory room/space created for Jordan's regulation", owner: "staff_darren", deadline: d(-130), status: "completed" },
      { agreement: "Staff member who requested not to work with Jordan — supported conversation + training", owner: "staff_darren", deadline: d(-140), status: "completed" },
    ],
    outcome: "Contact suspension + increased therapy significantly reduced aggression. Jordan's behaviour improved within 2 weeks of contact stopping. Sensory space became Jordan's go-to regulation tool. Staff confidence rebuilt through training and debriefs. The staff member who struggled was supported (not blamed) and now works well with Jordan. Placement is stable.",
    reviewDate: d(-120),
    notes: "Jordan's aggression was directly trauma-linked to contact. The decision to suspend contact was hard (Jordan wants to see mum) but necessary for immediate safety. The therapeutic reintroduction plan means contact will resume in a more contained way. Key learning: the placement wasn't at risk because of Jordan — it was at risk because the environment hadn't yet adapted enough to Jordan's needs.",
  },
  {
    id: "psm_003",
    youngPersonId: "yp_alex",
    meetingDate: d(-250),
    chairperson: "staff_darren",
    attendees: ["staff_darren", "staff_ryan", "Alex's SW (Helen)", "Mum (Karen, for part)"],
    trigger: "Alex saying 'I want to go home to mum.' Mum requesting discharge. Alex unsettled after weekend contact. Not a crisis but needs proactive management.",
    riskLevel: "low",
    status: "placement_stable",
    concerns: [
      "Alex expressing wish to return to mum — needs to be heard and explored",
      "Mum making promises about 'having Alex back soon' that aren't realistic",
      "Alex somewhat unsettled after contacts — takes 24h to resettle",
      "Risk of Alex disengaging from placement if feels not listened to",
    ],
    strengths: [
      "Alex is thriving at school — best attendance ever",
      "Strong friendship with Kieran — positive peer relationship",
      "Alex happy day-to-day — comments only after contact",
      "Nan is a stabilising influence — reinforces that placement is right for now",
      "Alex's stated wish is understandable and normal — not a crisis",
    ],
    childView: "Alex said: 'I love mum and I miss her. But I also like it here. I just wish I could see her more.' When asked if they want to move: 'Not really. I just feel sad sometimes after seeing mum because she cries.' Alex's wish is about contact frequency and mum's emotional presentation, not about placement quality.",
    agreementsReached: [
      { agreement: "Increase contact frequency from monthly to fortnightly (face-to-face)", owner: "Alex's SW", deadline: d(-240), status: "completed" },
      { agreement: "Work with mum about managing emotions during contact (SW to support)", owner: "Alex's SW", deadline: d(-230), status: "completed" },
      { agreement: "Key work with Alex about divided loyalties — it's OK to love mum AND like it here", owner: "staff_anna", deadline: d(-245), status: "completed" },
      { agreement: "Post-contact routine: something nice planned for evening after seeing mum", owner: "staff_anna", deadline: d(-248), status: "completed" },
    ],
    outcome: "Contact increase resolved Alex's sadness. The real issue was missing mum, not wanting to leave. Mum supported to manage her own emotions better (stops crying in front of Alex now). Alex settled quickly. Key learning: children saying 'I want to go home' doesn't always mean the placement is failing — sometimes it means the contact plan needs adjusting.",
    reviewDate: null,
    notes: "This was a proactive meeting — not a crisis response. We didn't wait for things to escalate. Alex's feelings were valid and the fix was straightforward: more contact. The placement was never truly at risk but it was right to address Alex's feelings formally rather than dismiss them.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<StabilityMeeting>[] = [
  { header: "Young Person", accessor: (r: StabilityMeeting) => getYPName(r.youngPersonId) },
  { header: "Date", accessor: (r: StabilityMeeting) => r.meetingDate },
  { header: "Chair", accessor: (r: StabilityMeeting) => r.chairperson },
  { header: "Trigger", accessor: (r: StabilityMeeting) => r.trigger },
  { header: "Risk Level", accessor: (r: StabilityMeeting) => r.riskLevel },
  { header: "Status", accessor: (r: StabilityMeeting) => r.status.replace(/_/g, " ") },
  { header: "Agreements", accessor: (r: StabilityMeeting) => r.agreementsReached.length.toString() },
  { header: "Outcome", accessor: (r: StabilityMeeting) => r.outcome },
  { header: "Child View", accessor: (r: StabilityMeeting) => r.childView },
];

/* ─── component ─── */
export default function PlacementStabilityMeetingsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...meetings];
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.meetingDate.localeCompare(a.meetingDate);
        case "risk": {
          const rOrder = { high: 0, medium: 1, low: 2 };
          return rOrder[a.riskLevel] - rOrder[b.riskLevel];
        }
        default:
          return 0;
      }
    });
    return list;
  }, [filterYP, sortBy]);

  const stats = useMemo(() => {
    const total = meetings.length;
    const stabilised = meetings.filter((m) => m.status === "stabilised" || m.status === "placement_stable").length;
    const ended = meetings.filter((m) => m.status === "ended").length;
    const avgAgreements = Math.round(meetings.reduce((s, m) => s + m.agreementsReached.length, 0) / total);
    return { total, stabilised, ended, avgAgreements };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "placement_stable":
        return <Badge className="bg-green-100 text-green-800">Stable</Badge>;
      case "stabilised":
        return <Badge className="bg-blue-100 text-blue-800">Stabilised</Badge>;
      case "at_risk":
        return <Badge className="bg-red-100 text-red-800">At Risk</Badge>;
      case "ended":
        return <Badge className="bg-gray-100 text-gray-800">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const riskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 text-xs">High Risk</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800 text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <PageShell
      title="Placement Stability Meetings"
      subtitle="Multi-agency meetings to prevent placement breakdown and keep children in the right home"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={meetings} columns={exportCols} filename="stability-meetings" />
          <PrintButton title="Placement Stability Meetings" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Meetings Held</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.stabilised}</p>
            <p className="text-xs text-muted-foreground">Placements Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.ended}</p>
            <p className="text-xs text-muted-foreground">Ended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.avgAgreements}</p>
            <p className="text-xs text-muted-foreground">Avg Agreements/Meeting</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── success note ─── */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">100% Placement Stability</p>
            <p className="text-xs text-green-700 mt-1">
              All placements at Oak House have been maintained. Where stability was at risk,
              proactive multi-agency intervention and genuine listening to children&apos;s voices
              resolved concerns. Zero unplanned endings in 12 months.
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterYP}
          onChange={(e) => setFilterYP(e.target.value)}
        >
          <option value="all">All Young People</option>
          <option value="yp_alex">Alex</option>
          <option value="yp_jordan">Jordan</option>
          <option value="yp_casey">Casey</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="risk">Risk Level</option>
          </select>
        </div>
      </div>

      {/* ─── meeting cards ─── */}
      <div className="space-y-4">
        {filtered.map((meeting) => {
          const expanded = expandedId === meeting.id;

          return (
            <Card key={meeting.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(meeting.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      meeting.status === "stabilised" || meeting.status === "placement_stable" ? "bg-green-100" : "bg-red-100"
                    )}>
                      <Home className={cn(
                        "h-5 w-5",
                        meeting.status === "stabilised" || meeting.status === "placement_stable" ? "text-green-600" : "text-red-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(meeting.youngPersonId)} — {meeting.meetingDate}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(meeting.status)}
                        {riskBadge(meeting.riskLevel)}
                      </div>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* trigger */}
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm font-medium text-amber-800">Trigger</p>
                    <p className="text-sm text-amber-700 mt-1">{meeting.trigger}</p>
                  </div>

                  {/* attendees */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Attendees</p>
                    <div className="flex flex-wrap gap-1">
                      {meeting.attendees.map((att, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {att.startsWith("staff_") ? getStaffName(att) : att}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* concerns & strengths */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Concerns
                      </p>
                      <ul className="space-y-1">
                        {meeting.concerns.map((c, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-1.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {meeting.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-400 mt-1.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* child view */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" /> Child&apos;s View
                    </p>
                    <p className="text-sm text-blue-700">{meeting.childView}</p>
                  </div>

                  {/* agreements */}
                  <div>
                    <p className="text-sm font-medium mb-2">Agreements Reached</p>
                    <div className="space-y-2">
                      {meeting.agreementsReached.map((agr, i) => (
                        <div key={i} className="border rounded-md p-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm">{agr.agreement}</p>
                            <p className="text-xs text-muted-foreground">
                              {agr.owner.startsWith("staff_") ? getStaffName(agr.owner) : agr.owner} · by {agr.deadline}
                            </p>
                          </div>
                          <Badge className={cn(
                            "text-xs",
                            agr.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {agr.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* outcome */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-1">Outcome</p>
                    <p className="text-sm text-green-700">{meeting.outcome}</p>
                  </div>

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Reflective Notes</p>
                    <p className="text-sm text-muted-foreground">{meeting.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Chaired By</p>
                      <p className="text-sm font-medium">{meeting.chairperson}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review Date</p>
                      <p className="text-sm font-medium">{meeting.reviewDate ?? "No further review needed"}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Placement stability is a key outcome measure for Ofsted. The SCCIF examines whether the
          home works proactively to maintain placements and prevents unplanned endings. Quality
          Standard 1 requires that children experience stable, consistent care. Where placements
          are at risk, Regulation 7 requires that the registered person takes all reasonable steps
          to address concerns. Multi-agency stability meetings demonstrate professional
          accountability, partnership working, and commitment to keeping children in the right home.
        </p>
      </div>
    </PageShell>
  );
}
