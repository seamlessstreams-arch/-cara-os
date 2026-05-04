"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Search, ArrowUpDown, Filter,
  CheckCircle2, Clock, Accessibility, Globe,
  ChevronDown, ChevronUp, User, Phone, Video,
  FileText, Brain,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
type ContactMethod = "Face-to-face" | "Written" | "Phone" | "Teams/Video";
type FeedbackStyle = "Direct" | "Sandwiched" | "Written follow-up";

interface StaffCommsPref {
  id: string;
  staffId: string;
  lastReviewDate: string;
  preferredContactMethod: ContactMethod;
  meetingPreferences: string;
  feedbackStyle: FeedbackStyle;
  supervisionAdjustments: string;
  neurodivergentNeeds: string;
  languageNeeds: string;
  bestTimeForDiscussions: string;
  stressIndicators: string[];
  deEscalationPreferences: string;
  confidentialNotes: string;
  reviewedBy: string;
}

const CONTACT_ICONS: Record<ContactMethod, typeof User> = {
  "Face-to-face": User,
  "Written": FileText,
  "Phone": Phone,
  "Teams/Video": Video,
};

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: StaffCommsPref[] = [
  {
    id: "scp_1",
    staffId: "staff_darren",
    lastReviewDate: d(-14),
    preferredContactMethod: "Face-to-face",
    meetingPreferences: "Agenda in advance, no surprises. Prefer structured 1:1s with written follow-up of actions agreed.",
    feedbackStyle: "Direct",
    supervisionAdjustments: "Prefer walking supervisions when weather allows — helps process information while moving.",
    neurodivergentNeeds: "",
    languageNeeds: "",
    bestTimeForDiscussions: "Morning (before 11am) or end of day after handover",
    stressIndicators: ["Becoming quieter than usual", "Working through breaks", "Shortened responses in messages"],
    deEscalationPreferences: "Give space for 10 minutes, then a calm check-in. Do not push for immediate responses when visibly stressed.",
    confidentialNotes: "Manages stress well externally but can internalise. Benefits from deputy proactively checking in during high-pressure weeks.",
    reviewedBy: "staff_ryan",
  },
  {
    id: "scp_2",
    staffId: "staff_ryan",
    lastReviewDate: d(-21),
    preferredContactMethod: "Face-to-face",
    meetingPreferences: "Relaxed style, happy with ad-hoc conversations. Prefers bullet-point summaries over long emails.",
    feedbackStyle: "Direct",
    supervisionAdjustments: "No specific adjustments needed. Happy with standard format but prefers actions written down rather than verbal agreement only.",
    neurodivergentNeeds: "",
    languageNeeds: "",
    bestTimeForDiscussions: "Flexible — avoid first hour of shift when completing handover review",
    stressIndicators: ["Pacing", "Increased humour or deflection", "Volunteering to do physical tasks to avoid desk work"],
    deEscalationPreferences: "Humour works well. Brief acknowledgement of pressure then practical problem-solving approach.",
    confidentialNotes: "Responds well to feeling trusted with responsibility. Autonomy is important — micro-management is counterproductive.",
    reviewedBy: "staff_darren",
  },
  {
    id: "scp_3",
    staffId: "staff_edward",
    lastReviewDate: d(-45),
    preferredContactMethod: "Written",
    meetingPreferences: "Agenda at least 24 hours in advance. Needs time to process before responding — do not expect immediate answers to complex questions.",
    feedbackStyle: "Written follow-up",
    supervisionAdjustments: "Written questions shared before supervision. Allow pauses — silence means thinking, not disengagement. Provide written summary after.",
    neurodivergentNeeds: "ADHD diagnosis. Benefits from written instructions, chunked tasks, and reminders for deadlines. Finds open-ended questions difficult without preparation time.",
    languageNeeds: "",
    bestTimeForDiscussions: "Mid-morning (10am-12pm) after medication has taken effect",
    stressIndicators: ["Task-switching rapidly without completing anything", "Forgetting agreed actions", "Arriving late or missing handover details"],
    deEscalationPreferences: "Do not add more tasks when overwhelmed. Help prioritise the top 2-3 things. Written list rather than verbal instructions.",
    confidentialNotes: "Disclosed ADHD to manager. Occupational health referral completed. Reasonable adjustments in place and reviewed quarterly.",
    reviewedBy: "staff_darren",
  },
  {
    id: "scp_4",
    staffId: "staff_anna",
    lastReviewDate: d(-30),
    preferredContactMethod: "Face-to-face",
    meetingPreferences: "Prefers quiet space, one-to-one. Finds group settings harder to contribute in. Appreciates being asked directly for her view rather than expected to volunteer.",
    feedbackStyle: "Sandwiched",
    supervisionAdjustments: "Allow time for reflection — may ask to come back with thoughts next day. Do not rush. Values feeling heard.",
    neurodivergentNeeds: "",
    languageNeeds: "French first language. English fluent but complex written policies may need verbal explanation alongside. Appreciates checking understanding without patronising.",
    bestTimeForDiscussions: "Afternoon (after 2pm) once children are in school",
    stressIndicators: ["Becoming very quiet", "Withdrawing from communal staff areas", "Increased politeness masking frustration"],
    deEscalationPreferences: "Gentle, warm approach. Acknowledge feelings first. Do not challenge publicly — always private.",
    confidentialNotes: "Has shared that direct confrontation triggers anxiety linked to past experiences. Always approach with warmth and patience.",
    reviewedBy: "staff_darren",
  },
  {
    id: "scp_5",
    staffId: "staff_chervelle",
    lastReviewDate: d(-10),
    preferredContactMethod: "Teams/Video",
    meetingPreferences: "Happy with informal check-ins. Prefers shorter, more frequent catch-ups over long monthly sessions.",
    feedbackStyle: "Direct",
    supervisionAdjustments: "Fortnightly 30-minute sessions rather than monthly hour-long. Responds well to specific, actionable feedback.",
    neurodivergentNeeds: "",
    languageNeeds: "",
    bestTimeForDiscussions: "Early shift (before 9am) or during quiet periods on sleep-in mornings",
    stressIndicators: ["Taking on too many tasks without delegating", "Skipping breaks", "Being overly self-critical in handover notes"],
    deEscalationPreferences: "Validation of effort first, then collaborative problem-solving. Appreciates being asked what support looks like rather than being told.",
    confidentialNotes: "Highly self-motivated but can set unrealistic expectations of herself. Needs reminding that good enough is acceptable.",
    reviewedBy: "staff_ryan",
  },
  {
    id: "scp_6",
    staffId: "staff_lackson",
    lastReviewDate: d(-60),
    preferredContactMethod: "Phone",
    meetingPreferences: "Prefers informal approach. Formal meetings can feel uncomfortable — relaxed conversational style works best.",
    feedbackStyle: "Sandwiched",
    supervisionAdjustments: "Outdoor walking supervisions preferred. Finds sitting in an office with a closed door anxiety-provoking. Activity-based sessions work well.",
    neurodivergentNeeds: "",
    languageNeeds: "Bemba and English bilingual. No adjustments needed for work communication but appreciates patience if searching for a specific English word in pressured situations.",
    bestTimeForDiscussions: "Late morning or early afternoon",
    stressIndicators: ["Going very quiet", "Increased physical restlessness", "Offering to do errands or tasks outside the home"],
    deEscalationPreferences: "Informal approach — cup of tea and a chat rather than formal sit-down. Outdoor space helps. Do not label emotions directly.",
    confidentialNotes: "Cultural background means direct emotional language can feel exposing. Indirect approaches to wellbeing conversations work better.",
    reviewedBy: "staff_darren",
  },
  {
    id: "scp_7",
    staffId: "staff_mirela",
    lastReviewDate: d(-90),
    preferredContactMethod: "Written",
    meetingPreferences: "Agenda in advance. Appreciates having questions to prepare for. Values structured approach with clear outcomes.",
    feedbackStyle: "Written follow-up",
    supervisionAdjustments: "Written summary of key points after each session. Prefers specific examples when discussing development areas. Benefits from visual aids or diagrams for complex processes.",
    neurodivergentNeeds: "Dyslexia — diagnosed in adulthood. Written communications should be clear, short sentences. Avoid dense policy documents without verbal walkthrough. Extra time for written tasks.",
    languageNeeds: "Lingala first language, English second language. Combined with dyslexia, written English tasks take additional time. Verbal briefings alongside written materials are essential.",
    bestTimeForDiscussions: "Morning (9am-11am) when concentration is highest",
    stressIndicators: ["Avoiding paperwork tasks", "Asking the same question multiple times", "Becoming frustrated with technology"],
    deEscalationPreferences: "Patient, calm approach. Break tasks into smaller steps. Offer to sit alongside and work through things together rather than sending away to complete alone.",
    confidentialNotes: "Intersection of dyslexia and English as second language means written tasks take significantly longer. Reasonable adjustments include verbal handovers, extra time for recording, and buddy system for complex paperwork.",
    reviewedBy: "staff_ryan",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function StaffCommunicationPreferencesPage() {
  const [records] = useState<StaffCommsPref[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getStaffName(r.staffId).toLowerCase().includes(q) ||
          r.meetingPreferences.toLowerCase().includes(q) ||
          r.neurodivergentNeeds.toLowerCase().includes(q) ||
          r.languageNeeds.toLowerCase().includes(q) ||
          r.supervisionAdjustments.toLowerCase().includes(q)
      );
    }
    if (filterMethod !== "all") list = list.filter((r) => r.preferredContactMethod === filterMethod);

    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return getStaffName(a.staffId).localeCompare(getStaffName(b.staffId));
        case "review": return a.lastReviewDate.localeCompare(b.lastReviewDate);
        case "method": return a.preferredContactMethod.localeCompare(b.preferredContactMethod);
        case "feedback": return a.feedbackStyle.localeCompare(b.feedbackStyle);
        default: return 0;
      }
    });
    return list;
  }, [records, search, filterMethod, sortBy]);

  /* ── summary stats ── */
  const profilesComplete = records.length;
  const dueForReview = records.filter((r) => {
    const reviewDate = new Date(r.lastReviewDate);
    const now = new Date();
    const diffDays = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 60;
  }).length;
  const adjustmentsInPlace = records.filter(
    (r) => r.neurodivergentNeeds || r.supervisionAdjustments !== "" || r.languageNeeds
  ).length;
  const languagesSupported = new Set(
    records
      .filter((r) => r.languageNeeds)
      .flatMap((r) => {
        const langs: string[] = [];
        if (r.languageNeeds.toLowerCase().includes("french")) langs.push("French");
        if (r.languageNeeds.toLowerCase().includes("bemba")) langs.push("Bemba");
        if (r.languageNeeds.toLowerCase().includes("lingala")) langs.push("Lingala");
        return langs;
      })
  ).size;

  const exportCols: ExportColumn<StaffCommsPref>[] = [
    { header: "Staff Member", accessor: (r: StaffCommsPref) => getStaffName(r.staffId) },
    { header: "Last Review", accessor: (r: StaffCommsPref) => r.lastReviewDate },
    { header: "Preferred Contact", accessor: (r: StaffCommsPref) => r.preferredContactMethod },
    { header: "Meeting Preferences", accessor: (r: StaffCommsPref) => r.meetingPreferences },
    { header: "Feedback Style", accessor: (r: StaffCommsPref) => r.feedbackStyle },
    { header: "Supervision Adjustments", accessor: (r: StaffCommsPref) => r.supervisionAdjustments },
    { header: "Neurodivergent Needs", accessor: (r: StaffCommsPref) => r.neurodivergentNeeds },
    { header: "Language Needs", accessor: (r: StaffCommsPref) => r.languageNeeds },
    { header: "Best Time", accessor: (r: StaffCommsPref) => r.bestTimeForDiscussions },
    { header: "Stress Indicators", accessor: (r: StaffCommsPref) => r.stressIndicators.join("; ") },
    { header: "De-escalation", accessor: (r: StaffCommsPref) => r.deEscalationPreferences },
    { header: "Confidential Notes", accessor: (r: StaffCommsPref) => r.confidentialNotes },
    { header: "Reviewed By", accessor: (r: StaffCommsPref) => getStaffName(r.reviewedBy) },
  ];

  return (
    <PageShell
      title="Staff Communication Preferences"
      subtitle="Recording individual communication needs and reasonable adjustments for all team members"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Communication Preferences" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-communication-preferences" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Profiles Complete", value: profilesComplete, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Due for Review", value: dueForReview, icon: Clock, colour: dueForReview > 0 ? "text-amber-600" : "text-slate-400" },
            { label: "Adjustments in Place", value: adjustmentsInPlace, icon: Accessibility, colour: "text-blue-600" },
            { label: "Languages Supported", value: languagesSupported, icon: Globe, colour: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters / sort ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, adjustments, needs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Contact method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Face-to-face">Face-to-face</SelectItem>
                <SelectItem value="Written">Written</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Teams/Video">Teams/Video</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="review">Last Review</SelectItem>
                <SelectItem value="method">Contact Method</SelectItem>
                <SelectItem value="feedback">Feedback Style</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── card list ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const Icon = CONTACT_ICONS[rec.preferredContactMethod];
            const reviewDate = new Date(rec.lastReviewDate);
            const now = new Date();
            const daysSinceReview = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
            const overdue = daysSinceReview > 60;

            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MessageSquare className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-sm truncate">{getStaffName(rec.staffId)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Icon className="h-3 w-3" />
                      {rec.preferredContactMethod}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rec.feedbackStyle}
                    </Badge>
                    {rec.neurodivergentNeeds && (
                      <Badge className="text-xs bg-violet-100 text-violet-800 hover:bg-violet-100">
                        <Brain className="h-3 w-3 mr-1" />
                        ND adjustments
                      </Badge>
                    )}
                    {rec.languageNeeds && (
                      <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Globe className="h-3 w-3 mr-1" />
                        Language
                      </Badge>
                    )}
                    {overdue && (
                      <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Review overdue
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Meeting Preferences</p>
                        <p className="text-sm">{rec.meetingPreferences}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Best Time for Discussions</p>
                        <p className="text-sm">{rec.bestTimeForDiscussions}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Supervision Adjustments</p>
                        <p className="text-sm">{rec.supervisionAdjustments}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">De-escalation Preferences</p>
                        <p className="text-sm">{rec.deEscalationPreferences}</p>
                      </div>
                    </div>

                    {rec.neurodivergentNeeds && (
                      <div className="rounded-lg bg-violet-50 p-3">
                        <p className="text-xs font-medium text-violet-800 mb-1">Neurodivergent Needs & Adjustments</p>
                        <p className="text-sm text-violet-900">{rec.neurodivergentNeeds}</p>
                      </div>
                    )}

                    {rec.languageNeeds && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-800 mb-1">Language Needs</p>
                        <p className="text-sm text-blue-900">{rec.languageNeeds}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Stress Indicators</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.stressIndicators.map((indicator, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Confidential Notes</p>
                      <p className="text-sm">{rec.confidentialNotes}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Last reviewed: {rec.lastReviewDate} by {getStaffName(rec.reviewedBy)}</span>
                      <span className={cn(overdue && "text-amber-600 font-medium")}>
                        {overdue ? `${daysSinceReview} days since review — overdue` : `${daysSinceReview} days since review`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ──────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">Regulatory Framework</p>
          <p className="text-sm text-blue-800">
            This record supports compliance with the <strong>Equality Act 2010</strong> duty to make reasonable adjustments for staff with disabilities or specific needs, including neurodivergent conditions. It also aligns with <strong>Quality Standard 13 (Leadership and Management)</strong>, which requires that leaders create an environment where staff feel supported, their individual needs are understood, and communication is adapted to promote effective team working.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
