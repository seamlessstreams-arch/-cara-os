"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Calendar, AlertTriangle, CheckCircle2, BookOpen, Target, Star, Clock,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AttainmentLevel = "above" | "at" | "below" | "significantly_below";
type PepStatus = "current" | "review_due" | "overdue" | "draft";

interface PepTarget {
  subject: string;
  currentLevel: string;
  targetLevel: string;
  attainment: AttainmentLevel;
  progress: "on_track" | "some_progress" | "limited_progress" | "exceeded";
  notes: string;
}

interface PupilPremium {
  annualAllocation: number;
  spentToDate: number;
  items: { description: string; amount: number; impact: string }[];
}

interface PEP {
  id: string;
  youngPersonId: string;
  school: string;
  yearGroup: number;
  keyStage: string;
  designatedTeacher: string;
  virtualSchoolContact: string;
  pepDate: string;
  nextReviewDate: string;
  status: PepStatus;
  attendance: number;
  exclusions: number;
  exclusionDays: number;
  senStatus: "none" | "sen_support" | "ehcp";
  senDetails: string;
  targets: PepTarget[];
  pupilPremium: PupilPremium;
  childViews: string;
  carerViews: string;
  socialWorkerViews: string;
  strengths: string[];
  barriers: string[];
  keyWorker: string;
  actions: { action: string; owner: string; deadline: string; status: "pending" | "completed" }[];
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_META: Record<PepStatus, { label: string; color: string }> = {
  current: { label: "Current", color: "bg-green-100 text-green-800" },
  review_due: { label: "Review Due", color: "bg-amber-100 text-amber-800" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
};

const ATT_META: Record<AttainmentLevel, { label: string; color: string }> = {
  above: { label: "Above Expected", color: "text-green-700 bg-green-100" },
  at: { label: "At Expected", color: "text-blue-700 bg-blue-100" },
  below: { label: "Below Expected", color: "text-amber-700 bg-amber-100" },
  significantly_below: { label: "Significantly Below", color: "text-red-700 bg-red-100" },
};

const PROGRESS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  exceeded: { label: "Exceeded", color: "text-green-700", icon: TrendingUp },
  on_track: { label: "On Track", color: "text-green-600", icon: TrendingUp },
  some_progress: { label: "Some Progress", color: "text-amber-600", icon: Minus },
  limited_progress: { label: "Limited Progress", color: "text-red-600", icon: TrendingDown },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: PEP[] = [
  {
    id: "pep_001", youngPersonId: "yp_alex", school: "Eastbrook Academy", yearGroup: 9, keyStage: "KS4",
    designatedTeacher: "Mrs Sarah Jenkins", virtualSchoolContact: "James Worthington (Virtual School Head)",
    pepDate: d(-21), nextReviewDate: d(70), status: "current",
    attendance: 91, exclusions: 0, exclusionDays: 0,
    senStatus: "none", senDetails: "",
    targets: [
      { subject: "English", currentLevel: "Grade 5", targetLevel: "Grade 6", attainment: "at", progress: "on_track", notes: "Alex is making steady progress in English. Reading comprehension has improved significantly. Creative writing is a strength — teacher praised his short story in the autumn term." },
      { subject: "Maths", currentLevel: "Grade 4", targetLevel: "Grade 5", attainment: "below", progress: "some_progress", notes: "Maths remains challenging. Struggling with algebra but improving in statistics and geometry. After-school revision club started — attending consistently." },
      { subject: "Science", currentLevel: "Grade 5", targetLevel: "Grade 6", attainment: "at", progress: "on_track", notes: "Good engagement in science. Particularly enjoys biology. Completed a strong coursework piece on ecosystems." },
      { subject: "PE", currentLevel: "Exceeding", targetLevel: "Exceeding", attainment: "above", progress: "exceeded", notes: "Outstanding in PE. Football team captain. Excellent sportsmanship and leadership. Potential for sports scholarship discussed with school." },
    ],
    pupilPremium: {
      annualAllocation: 2530,
      spentToDate: 1680,
      items: [
        { description: "1:1 maths tutoring (weekly, 30 mins)", amount: 780, impact: "Maths grade improved from 3 to 4. Confidence increasing." },
        { description: "Football coaching — external academy sessions", amount: 450, impact: "Technical skills developing. Selected for county trials." },
        { description: "School trip — geography field trip", amount: 185, impact: "Full participation. Enhanced learning and social inclusion." },
        { description: "Revision guides and materials", amount: 95, impact: "Using regularly. Staff supporting homework time." },
        { description: "Laptop for homework (chromebook)", amount: 170, impact: "Homework completion rate improved to 85%." },
      ],
    },
    childViews: "Alex said school is 'alright' and he likes most of his teachers. He wants to do better in maths and knows the tutoring is helping. He's proud of being football captain and wants to try out for the county team. He said he sometimes finds it hard to concentrate when he's worried about family stuff but 'it's getting better.' He wants to be a PE teacher or sports coach when he's older.",
    carerViews: "Alex's school attendance has been excellent. He's motivated by football and this positive engagement extends to other subjects. Homework is completed with minimal prompting. The maths tutoring has been a good investment. We ensure he has a quiet space for study. The main barrier is occasional emotional unsettlement around family contact days — school is aware and supportive.",
    socialWorkerViews: "Alex is making good educational progress. Placement stability has had a direct positive impact on school engagement. PEP targets are realistic and pupil premium is being used effectively. The maths gap is narrowing. Support the recommendation for county football trials — this is a significant protective factor.",
    strengths: ["Excellent attendance (91%)", "Strong in PE and sports", "Good peer relationships at school", "Homework completion improving", "Engaged with extra-curricular activities"],
    barriers: ["Maths attainment gap", "Emotional unsettlement around contact days", "Limited academic support before care", "Missed schooling in Year 7 (6 weeks)"],
    keyWorker: "staff_ryan",
    actions: [
      { action: "Continue weekly maths tutoring — review impact at next PEP", owner: "Virtual School", deadline: d(70), status: "pending" },
      { action: "Support Alex to attend county football trials", owner: "staff_ryan", deadline: d(30), status: "pending" },
      { action: "Discuss GCSE options with Alex and school — careers interview", owner: "Mrs Sarah Jenkins", deadline: d(45), status: "pending" },
      { action: "Inform school of contact dates to enable pastoral support", owner: "staff_darren", deadline: d(7), status: "completed" },
    ],
  },
  {
    id: "pep_002", youngPersonId: "yp_jordan", school: "Meadowbank School (specialist provision)", yearGroup: 8, keyStage: "KS3",
    designatedTeacher: "Mr David Chen", virtualSchoolContact: "James Worthington (Virtual School Head)",
    pepDate: d(-14), nextReviewDate: d(77), status: "current",
    attendance: 62, exclusions: 0, exclusionDays: 0,
    senStatus: "ehcp", senDetails: "EHCP in place for ASD. Annual review completed February. Provision includes: speech and language therapy (weekly), occupational therapy (fortnightly), 1:1 TA support for all lessons, sensory breaks built into timetable, reduced class sizes (max 8). Currently on a part-time timetable (mornings only) — plan to increase to full-time by September.",
    targets: [
      { subject: "English", currentLevel: "Working Towards Y8", targetLevel: "Y8 Expected", attainment: "below", progress: "some_progress", notes: "Jordan engages well with structured literacy activities. Comprehension is stronger than expression. Uses visual aids and sentence starters effectively. Creative writing is challenging due to imagination and abstract thinking difficulties linked to ASD." },
      { subject: "Maths", currentLevel: "Y8 Expected", targetLevel: "Y8 Expected+", attainment: "at", progress: "on_track", notes: "Maths is a relative strength. Jordan excels at pattern recognition and logical problems. Enjoys times tables and number work. Finds word problems difficult — visual representations help." },
      { subject: "Art", currentLevel: "Exceeding", targetLevel: "Exceeding", attainment: "above", progress: "exceeded", notes: "Exceptional talent in visual art. Jordan's artwork has been displayed in the school reception. Art is a key motivator and a source of genuine pride. Teacher recommending art therapy referral." },
      { subject: "Life Skills", currentLevel: "Developing", targetLevel: "Secure", attainment: "below", progress: "some_progress", notes: "Life skills curriculum covers cooking, money, travel training. Jordan can follow a visual recipe with support. Money skills improving with concrete resources." },
    ],
    pupilPremium: {
      annualAllocation: 2530,
      spentToDate: 2100,
      items: [
        { description: "Specialist art materials", amount: 280, impact: "Significant positive impact on engagement and self-esteem. Jordan's art has been recognised by school." },
        { description: "Speech and language therapy (additional session)", amount: 650, impact: "Communication skills improving. Using PECS less, verbal communication increasing." },
        { description: "Sensory equipment for school", amount: 320, impact: "Weighted lap pad and fidget tools reduce anxiety during lessons. Fewer sensory overload incidents." },
        { description: "Social skills group (lunch club)", amount: 400, impact: "Jordan attending regularly. Beginning to interact with 2 peers. Staff-facilitated." },
        { description: "iPad with communication apps", amount: 450, impact: "Used as backup communication tool. Also supports independent learning in literacy." },
      ],
    },
    childViews: "Jordan communicated views through a visual scale and with support from their advocate. Jordan pointed to 'happy face' for art and maths. 'Sad face' for English writing. 'Worried face' for lunchtimes (noise in dining hall). Jordan drew a picture of the school with their favourite teacher (Mr Chen) and the art room highlighted. When asked what would make school better, Jordan wrote: 'More art. Less writing. Quiet lunch.'",
    carerViews: "Jordan's relationship with school has improved significantly since moving to Meadowbank. The specialist provision is appropriate and the staff understand Jordan's needs. The part-time timetable is working well but Jordan is becoming more anxious about the plan to increase hours. We recommend a very gradual approach. Jordan thrives in the mornings but fatigue and sensory overload increase after lunch. Art remains a vital outlet.",
    socialWorkerViews: "The EHCP provision is being delivered well. Attendance on the part-time timetable is good (62% looks low but reflects the agreed reduced hours, not absence). The transition to full-time needs careful planning with all professionals. Pupil premium is being used creatively and effectively. Jordan's progress in communication is encouraging.",
    strengths: ["Exceptional art ability", "Strong maths skills", "Good relationship with designated teacher", "EHCP provision well-matched", "Improving communication skills"],
    barriers: ["Part-time timetable (plan to increase)", "Sensory processing challenges", "Social communication difficulties", "Anxiety around transitions", "Writing and literacy gap"],
    keyWorker: "staff_anna",
    actions: [
      { action: "Develop graduated timetable increase plan — start with one afternoon per week", owner: "Mr David Chen", deadline: d(30), status: "pending" },
      { action: "Quiet lunch provision — request access to art room during lunch", owner: "staff_anna", deadline: d(14), status: "completed" },
      { action: "Art therapy referral — liaise with CAMHS and school", owner: "Virtual School", deadline: d(45), status: "pending" },
      { action: "EHCP annual review — ensure carers and home views included", owner: "staff_darren", deadline: d(60), status: "pending" },
      { action: "Visual transition schedule for timetable increase", owner: "staff_anna", deadline: d(21), status: "pending" },
    ],
  },
  {
    id: "pep_003", youngPersonId: "yp_casey", school: "Riverside College (16+)", yearGroup: 12, keyStage: "KS5",
    designatedTeacher: "Ms Priya Sharma", virtualSchoolContact: "James Worthington (Virtual School Head)",
    pepDate: d(-7), nextReviewDate: d(84), status: "review_due",
    attendance: 34, exclusions: 1, exclusionDays: 2,
    senStatus: "sen_support", senDetails: "SEN Support for SEMH (Social, Emotional and Mental Health). Support includes: designated safe space, flexible deadlines, pastoral mentor (weekly), exam access arrangements (25% extra time, separate room).",
    targets: [
      { subject: "Health & Social Care (BTEC)", currentLevel: "Pass", targetLevel: "Merit", attainment: "below", progress: "limited_progress", notes: "Casey was on track for Merit before attendance dropped. 2 assignments outstanding. College willing to accept late submissions with supporting evidence from home. Casey has ability but engagement has been severely disrupted." },
      { subject: "Art & Design", currentLevel: "Merit", targetLevel: "Distinction", attainment: "at", progress: "some_progress", notes: "Art is Casey's strongest subject. Portfolio work is excellent when she engages. The coursework she has submitted is at Distinction level. However, 3 pieces are missing due to non-attendance." },
      { subject: "English GCSE Resit", currentLevel: "Grade 3", targetLevel: "Grade 4", attainment: "below", progress: "limited_progress", notes: "Casey needs Grade 4 to progress. Currently predicted Grade 3. Attendance at English classes has been particularly poor. College has offered 1:1 catch-up sessions." },
    ],
    pupilPremium: {
      annualAllocation: 2530,
      spentToDate: 890,
      items: [
        { description: "Art materials for coursework", amount: 340, impact: "When attending, Casey produces excellent work. Materials available at home and college." },
        { description: "Counselling sessions (college-based)", amount: 350, impact: "Casey attended 4 of 8 booked sessions. Engaged well when present. Cancelled others due to non-attendance." },
        { description: "Bus pass (termly)", amount: 200, impact: "Eliminates transport as a barrier. Casey has the pass but is not using it consistently." },
      ],
    },
    childViews: "Casey said she 'can't be bothered with college anymore' and feels like 'everyone's given up on me.' When explored further, Casey acknowledged she likes art and 'wouldn't mind finishing that.' She doesn't see the point of the English resit. Casey said she feels judged by other students because 'they know I'm in care.' She became upset when discussing the future and said she doesn't know what she wants to do. Casey did say she'd consider going back if she could 'just do art.'",
    carerViews: "Casey's non-attendance at college is now in its 4th week. We have tried morning encouragement, adjusted routines, and offered to accompany her. The exploitation concerns and LADO investigation have had a significant impact on Casey's emotional state and motivation. Casey is not refusing education outright — she's struggling to engage with anything right now. We believe a reduced timetable focused on art could be a lifeline. The English resit can be revisited when Casey is more stable.",
    socialWorkerViews: "Casey's educational disengagement is directly linked to the current safeguarding concerns. This is not a priority compared to safety and emotional wellbeing, but education remains an important protective factor. Support a reduced timetable if it keeps Casey connected to college. The pupil premium underspend should be reviewed — consider therapeutic art sessions if college attendance remains low. Casey must not become NEET.",
    strengths: ["Talented in art and creative subjects", "Exam access arrangements in place", "College willing to be flexible", "Pupil premium available", "Casey acknowledges she'd return for art"],
    barriers: ["4 weeks non-attendance", "Exploitation concerns impacting emotional state", "LADO investigation — additional stress", "Feels stigmatised as looked-after", "Low motivation and self-worth", "Missing coursework accumulating"],
    keyWorker: "staff_chervelle",
    actions: [
      { action: "Arrange college reintegration meeting — propose art-only timetable initially", owner: "staff_chervelle", deadline: d(7), status: "pending" },
      { action: "Discuss therapeutic art sessions as alternative if college return delayed", owner: "Virtual School", deadline: d(14), status: "pending" },
      { action: "Submit supporting evidence to college for late assignment submissions", owner: "staff_darren", deadline: d(5), status: "completed" },
      { action: "Explore GCSE English distance learning options as backup", owner: "Ms Priya Sharma", deadline: d(30), status: "pending" },
      { action: "Weekly motivational check-in with Casey about college — non-pressured", owner: "staff_chervelle", deadline: d(7), status: "pending" },
      { action: "Review pupil premium allocation — redirect underspend to therapeutic art", owner: "Virtual School", deadline: d(21), status: "pending" },
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PepTrackerPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "attendance" | "name">("date");

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case "attendance": return a.attendance - b.attendance;
        case "name": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default: return b.pepDate.localeCompare(a.pepDate);
      }
    });
  }, [data, sortBy]);

  const exportData = useMemo(() => {
    return data.flatMap((p) =>
      p.targets.map((t) => ({
        youngPerson: getYPName(p.youngPersonId),
        school: p.school,
        yearGroup: p.yearGroup,
        subject: t.subject,
        currentLevel: t.currentLevel,
        targetLevel: t.targetLevel,
        attainment: ATT_META[t.attainment].label,
        progress: PROGRESS_META[t.progress].label,
        attendance: p.attendance,
        ppAllocated: p.pupilPremium.annualAllocation,
        ppSpent: p.pupilPremium.spentToDate,
        pepDate: p.pepDate,
        nextReview: p.nextReviewDate,
        status: STATUS_META[p.status].label,
      }))
    );
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => r.youngPerson },
    { header: "School", accessor: (r: ExportRow) => r.school },
    { header: "Year", accessor: (r: ExportRow) => String(r.yearGroup) },
    { header: "Subject", accessor: (r: ExportRow) => r.subject },
    { header: "Current Level", accessor: (r: ExportRow) => r.currentLevel },
    { header: "Target Level", accessor: (r: ExportRow) => r.targetLevel },
    { header: "Attainment", accessor: (r: ExportRow) => r.attainment },
    { header: "Progress", accessor: (r: ExportRow) => r.progress },
    { header: "Attendance %", accessor: (r: ExportRow) => String(r.attendance) },
    { header: "PP Allocated", accessor: (r: ExportRow) => `£${r.ppAllocated}` },
    { header: "PP Spent", accessor: (r: ExportRow) => `£${r.ppSpent}` },
    { header: "PEP Date", accessor: (r: ExportRow) => r.pepDate },
    { header: "Next Review", accessor: (r: ExportRow) => r.nextReview },
    { header: "Status", accessor: (r: ExportRow) => r.status },
  ];

  /* summary stats */
  const totalPP = data.reduce((s, p) => s + p.pupilPremium.annualAllocation, 0);
  const spentPP = data.reduce((s, p) => s + p.pupilPremium.spentToDate, 0);
  const avgAttendance = Math.round(data.reduce((s, p) => s + p.attendance, 0) / data.length);
  const overdueCount = data.filter((p) => p.status === "overdue" || p.status === "review_due").length;

  return (
    <PageShell
      title="PEP Tracker"
      subtitle="Personal Education Plans · Pupil Premium · Educational Attainment"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="PEP Tracker" />
          <ExportButton data={exportData} columns={exportCols} filename="pep-tracker" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Active PEPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{avgAttendance}%</p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">£{totalPP.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pupil Premium (Total)</p>
              <p className="text-xs text-muted-foreground">£{spentPP.toLocaleString()} spent ({Math.round((spentPP / totalPP) * 100)}%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", overdueCount > 0 ? "text-amber-600" : "text-green-600")}>{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Reviews Due / Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* attendance alert */}
        {data.some((p) => p.attendance < 70) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">Attendance Concern</p>
              <p className="text-red-700">
                {data.filter((p) => p.attendance < 70).map((p) => `${getYPName(p.youngPersonId)} (${p.attendance}%)`).join(", ")} — attendance below 70%. Virtual School Head notified. Educational engagement is a priority in care planning.
              </p>
            </div>
          </div>
        )}

        {/* sort */}
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="date">PEP Date (newest)</option>
            <option value="attendance">Attendance (lowest first)</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>

        {/* PEP cards */}
        <div className="space-y-3">
          {sorted.map((p) => {
            const isOpen = expandedId === p.id;
            const ppPercent = Math.round((p.pupilPremium.spentToDate / p.pupilPremium.annualAllocation) * 100);
            return (
              <Card key={p.id} className={cn("border-l-4", p.attendance >= 85 ? "border-l-green-400" : p.attendance >= 70 ? "border-l-amber-400" : "border-l-red-500")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : p.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        {getYPName(p.youngPersonId)}
                        <Badge variant="outline" className={STATUS_META[p.status].color}>{STATUS_META[p.status].label}</Badge>
                        {p.senStatus !== "none" && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">{p.senStatus === "ehcp" ? "EHCP" : "SEN Support"}</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {p.school} · Year {p.yearGroup} ({p.keyStage}) · Attendance: {p.attendance}% · PP: £{p.pupilPremium.spentToDate}/£{p.pupilPremium.annualAllocation} ({ppPercent}%)
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* school info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Designated Teacher</p>
                        <p className="font-medium">{p.designatedTeacher}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Virtual School</p>
                        <p className="font-medium">{p.virtualSchoolContact}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">PEP Date</p>
                        <p className="font-medium">{p.pepDate}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Next Review</p>
                        <p className="font-medium">{p.nextReviewDate}</p>
                      </div>
                    </div>

                    {/* attendance & exclusions */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className={cn("font-medium", p.attendance >= 85 ? "text-green-700" : p.attendance >= 70 ? "text-amber-700" : "text-red-700")}>
                          {p.attendance}% attendance
                        </span>
                      </div>
                      {p.exclusions > 0 && (
                        <div className="flex items-center gap-1 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{p.exclusions} exclusion(s) — {p.exclusionDays} day(s)</span>
                        </div>
                      )}
                    </div>

                    {/* SEN */}
                    {p.senStatus !== "none" && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">{p.senStatus === "ehcp" ? "EHCP" : "SEN Support"}</p>
                        <p className="text-xs text-purple-700">{p.senDetails}</p>
                      </div>
                    )}

                    {/* targets */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1"><Target className="h-4 w-4 text-blue-600" /> Academic Targets</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {p.targets.map((t, i) => {
                          const ProgressIcon = PROGRESS_META[t.progress].icon;
                          return (
                            <div key={i} className="bg-muted/40 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-xs">{t.subject}</p>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className={cn("text-[10px]", ATT_META[t.attainment].color)}>{ATT_META[t.attainment].label}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs mb-1">
                                <span>{t.currentLevel}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">{t.targetLevel}</span>
                                <div className="flex items-center gap-0.5 ml-auto">
                                  <ProgressIcon className={cn("h-3 w-3", PROGRESS_META[t.progress].color)} />
                                  <span className={cn("text-[10px]", PROGRESS_META[t.progress].color)}>{PROGRESS_META[t.progress].label}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{t.notes}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* pupil premium */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> Pupil Premium Plus (£{p.pupilPremium.annualAllocation})</p>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>£{p.pupilPremium.spentToDate} of £{p.pupilPremium.annualAllocation} spent</span>
                          <span className="font-medium">{ppPercent}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={cn("rounded-full h-2", ppPercent >= 70 ? "bg-green-500" : ppPercent >= 40 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${Math.min(ppPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {p.pupilPremium.items.map((item, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium">{item.description}</span>
                              <span className="text-muted-foreground">£{item.amount}</span>
                            </div>
                            <p className="text-muted-foreground">{item.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* strengths & barriers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {p.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-medium text-xs text-red-800 mb-1">Barriers to Learning</p>
                        <ul className="space-y-0.5">
                          {p.barriers.map((b, i) => (
                            <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* child views */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{p.childViews}</p>
                    </div>

                    {/* carer views */}
                    <div>
                      <p className="font-medium text-xs mb-1">Carer&apos;s Views</p>
                      <p className="text-xs text-muted-foreground">{p.carerViews}</p>
                    </div>

                    {/* social worker views */}
                    <div>
                      <p className="font-medium text-xs mb-1">Social Worker&apos;s Views</p>
                      <p className="text-xs text-muted-foreground">{p.socialWorkerViews}</p>
                    </div>

                    {/* actions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Clock className="h-4 w-4 text-purple-600" /> PEP Actions</p>
                      {p.actions.map((act, i) => (
                        <div key={i} className="bg-muted/40 rounded p-2 mb-1 flex items-start gap-2 text-xs">
                          {act.status === "completed" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={act.status === "completed" ? "line-through text-muted-foreground" : ""}>{act.action}</p>
                            <p className="text-muted-foreground">{act.owner} · Due: {act.deadline}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Personal Education Plans</p>
          <p>PEPs are a statutory requirement for all looked-after children under the Children Act 1989 and the Children and Young Persons Act 2008. They must be completed within 20 school days of entering care and reviewed at least termly (every school term). The PEP should be a &quot;living document&quot; that drives educational progress. The Virtual School Head has a duty to ensure PEPs are high quality. Pupil Premium Plus (currently £2,530 per child per year) must be used to address educational needs identified in the PEP. The designated teacher at each school is responsible for coordinating the PEP in partnership with the child&apos;s social worker, carer, and Virtual School. The child&apos;s views must be central to the PEP process. Educational outcomes for looked-after children are a key Ofsted focus area.</p>
        </div>
      </div>
    </PageShell>
  );
}
