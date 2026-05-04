"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  Heart,
  Star,
  MapPin,
  GraduationCap,
  Palette,
  Activity,
  Globe,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface CommunityEngagement {
  id: string;
  date: string;
  youngPeople: string[];
  activityType: "Sports/Fitness" | "Arts/Culture" | "Volunteering" | "Education" | "Religious/Spiritual" | "Social" | "Civic" | "Environmental";
  activity: string;
  location: string;
  organisation: string;
  durationMinutes: number;
  staffPresent: string[];
  outcomes: string[];
  childFeedback: string;
  buildsConnections: boolean;
  ongoingCommitment: boolean;
  recordedBy: string;
  notes: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: CommunityEngagement[] = [
  {
    id: "ce-001",
    date: d(-1),
    youngPeople: ["yp_alex"],
    activityType: "Sports/Fitness",
    activity: "Boxing club training session",
    location: "Riverside Boxing Gym, High Street",
    organisation: "Riverside Boxing Club",
    durationMinutes: 90,
    staffPresent: ["staff_lackson"],
    outcomes: [
      "Built relationship with coach",
      "Practised emotional regulation through physical exertion",
      "Met 3 other young people from local area",
    ],
    childFeedback: "Best session yet. Coach said I'm getting really good at the footwork. I made a friend.",
    buildsConnections: true,
    ongoingCommitment: true,
    recordedBy: "staff_lackson",
    notes: "Coach reports excellent progress. Alex now attends twice weekly. Coach gave Alex own gloves as recognition.",
  },
  {
    id: "ce-002",
    date: d(-3),
    youngPeople: ["yp_casey"],
    activityType: "Arts/Culture",
    activity: "Art therapy group at community centre",
    location: "Riverside Community Centre",
    organisation: "Reach Out Arts CIC",
    durationMinutes: 120,
    staffPresent: ["staff_anna"],
    outcomes: [
      "Created artwork for upcoming local exhibition",
      "Engaged positively with neurodiverse peer group",
      "Therapeutic benefit — reduced anxiety post-session",
    ],
    childFeedback: "I like it because everyone gets it there. No-one tells me to look at them.",
    buildsConnections: true,
    ongoingCommitment: true,
    recordedBy: "staff_anna",
    notes: "Casey's piece was selected for community exhibition. Builds positive identity and social connection in low-demand environment.",
  },
  {
    id: "ce-003",
    date: d(-5),
    youngPeople: ["yp_jordan"],
    activityType: "Sports/Fitness",
    activity: "Football team match (away)",
    location: "Riverside Recreation Ground",
    organisation: "Riverside FC Under-13s",
    durationMinutes: 180,
    staffPresent: ["staff_edward"],
    outcomes: [
      "Played as captain — leadership demonstrated",
      "Team won 3-1, Jordan scored",
      "Post-match tea with team builds belonging",
    ],
    childFeedback: "Got the man of the match thing. Coach said I led the lads well.",
    buildsConnections: true,
    ongoingCommitment: true,
    recordedBy: "staff_edward",
    notes: "Jordan's identity as 'footballer' is hugely protective. Coach is positive male role model. Team families now know us.",
  },
  {
    id: "ce-004",
    date: d(-7),
    youngPeople: ["yp_alex", "yp_jordan", "yp_casey"],
    activityType: "Environmental",
    activity: "Beach clean volunteering",
    location: "Riverside Beach",
    organisation: "Surfers Against Sewage local chapter",
    durationMinutes: 150,
    staffPresent: ["staff_darren", "staff_chervelle"],
    outcomes: [
      "Collected 12kg of beach waste",
      "Worked alongside ~20 community volunteers",
      "Public recognition by event organiser",
    ],
    childFeedback: "Felt good doing something useful. The lady said we worked harder than the adults.",
    buildsConnections: true,
    ongoingCommitment: false,
    recordedBy: "staff_darren",
    notes: "All three engaged well. Discussed seasonal repeat. Photos in local newspaper (with consent). Powerful for sense of agency and contribution.",
  },
  {
    id: "ce-005",
    date: d(-9),
    youngPeople: ["yp_jordan"],
    activityType: "Religious/Spiritual",
    activity: "Heritage cultural event at community centre",
    location: "Riverside Community Centre",
    organisation: "African-Caribbean Heritage Group",
    durationMinutes: 180,
    staffPresent: ["staff_mirela"],
    outcomes: [
      "Connection with cultural community",
      "Met older mentor figure who shared heritage stories",
      "Took home cultural recipe to try cooking",
    ],
    childFeedback: "It was good to be around people who get my background. The food was unreal.",
    buildsConnections: true,
    ongoingCommitment: true,
    recordedBy: "staff_mirela",
    notes: "Jordan invited to next month's event. Cultural identity work continues. Linked to identity domain in care plan.",
  },
  {
    id: "ce-006",
    date: d(-12),
    youngPeople: ["yp_casey"],
    activityType: "Education",
    activity: "Library reading club (sensory-friendly session)",
    location: "Riverside Public Library",
    organisation: "Riverside Library Service",
    durationMinutes: 60,
    staffPresent: ["staff_anna"],
    outcomes: [
      "Completed second book in series",
      "Engaged with librarian who knows Casey by name",
      "Positive low-stimulation peer engagement",
    ],
    childFeedback: "The librarian remembered my book. She's nice.",
    buildsConnections: true,
    ongoingCommitment: true,
    recordedBy: "staff_anna",
    notes: "Library now part of weekly routine. Sensory-friendly hour is ideal. Casey has own library card and reading log.",
  },
  {
    id: "ce-007",
    date: d(-14),
    youngPeople: ["yp_alex"],
    activityType: "Volunteering",
    activity: "Helping at local foodbank",
    location: "St Mary's Church Hall",
    organisation: "Riverside Foodbank",
    durationMinutes: 120,
    staffPresent: ["staff_chervelle"],
    outcomes: [
      "Sorted donations and packed bags",
      "Met other young volunteers",
      "Strong sense of purpose and contribution",
    ],
    childFeedback: "I felt grown up doing it. The lady in charge said I was really helpful.",
    buildsConnections: true,
    ongoingCommitment: false,
    recordedBy: "staff_chervelle",
    notes: "Alex requested to return monthly. Coordinator open to ongoing volunteering. Building empathy and citizenship.",
  },
  {
    id: "ce-008",
    date: d(-18),
    youngPeople: ["yp_alex", "yp_jordan"],
    activityType: "Civic",
    activity: "Youth voice forum — local council consultation",
    location: "Riverside Town Hall",
    organisation: "Riverside Youth Council",
    durationMinutes: 90,
    staffPresent: ["staff_darren"],
    outcomes: [
      "Contributed views on local park redevelopment",
      "Met councillors and other young people",
      "Voice formally recorded in consultation",
    ],
    childFeedback: "It was a bit boring at first but they actually listened. Jordan said something proper good.",
    buildsConnections: true,
    ongoingCommitment: false,
    recordedBy: "staff_darren",
    notes: "Both young people contributed meaningfully. Council noted their input in minutes. Youth Council invited them back for follow-up.",
  },
  {
    id: "ce-009",
    date: d(-22),
    youngPeople: ["yp_casey"],
    activityType: "Social",
    activity: "Cinema with art group friend",
    location: "Riverside Cinema",
    organisation: "Independent friendship",
    durationMinutes: 180,
    staffPresent: ["staff_anna"],
    outcomes: [
      "First independent friendship outing",
      "Casey arranged via art group connection",
      "Completed activity with success and pride",
    ],
    childFeedback: "I planned it and it worked. We're going to do it again next month.",
    buildsConnections: true,
    ongoingCommitment: true,
    recordedBy: "staff_anna",
    notes: "Significant milestone for Casey. Independent peer relationship beyond placement. Confidence boost.",
  },
  {
    id: "ce-010",
    date: d(-25),
    youngPeople: ["yp_jordan", "yp_alex"],
    activityType: "Social",
    activity: "Bowling with peer group from school",
    location: "Strikes Bowling Centre",
    organisation: "Friendship-led",
    durationMinutes: 150,
    staffPresent: ["staff_lackson"],
    outcomes: [
      "Peer relationships from school maintained outside",
      "Pro-social peer modelling",
      "Positive memories shared",
    ],
    childFeedback: "Was sick. The lads from school are alright.",
    buildsConnections: true,
    ongoingCommitment: false,
    recordedBy: "staff_lackson",
    notes: "Important peer normalisation. Both children maintained appropriate behaviour. Friends invited them to next outing.",
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const typeIcons: Record<string, typeof Users> = {
  "Sports/Fitness": Activity,
  "Arts/Culture": Palette,
  "Volunteering": Heart,
  "Education": GraduationCap,
  "Religious/Spiritual": Globe,
  "Social": Users,
  "Civic": MapPin,
  "Environmental": Globe,
};

const typeColour: Record<string, string> = {
  "Sports/Fitness": "bg-blue-100 text-blue-800",
  "Arts/Culture": "bg-purple-100 text-purple-800",
  "Volunteering": "bg-pink-100 text-pink-800",
  "Education": "bg-amber-100 text-amber-800",
  "Religious/Spiritual": "bg-indigo-100 text-indigo-800",
  "Social": "bg-green-100 text-green-800",
  "Civic": "bg-slate-100 text-slate-800",
  "Environmental": "bg-emerald-100 text-emerald-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<CommunityEngagement>[] = [
  { header: "Date", accessor: (r: CommunityEngagement) => r.date },
  { header: "Young People", accessor: (r: CommunityEngagement) => r.youngPeople.map(getYPName).join("; ") },
  { header: "Activity Type", accessor: (r: CommunityEngagement) => r.activityType },
  { header: "Activity", accessor: (r: CommunityEngagement) => r.activity },
  { header: "Location", accessor: (r: CommunityEngagement) => r.location },
  { header: "Organisation", accessor: (r: CommunityEngagement) => r.organisation },
  { header: "Duration (mins)", accessor: (r: CommunityEngagement) => String(r.durationMinutes) },
  { header: "Builds Connections", accessor: (r: CommunityEngagement) => r.buildsConnections ? "Yes" : "No" },
  { header: "Ongoing", accessor: (r: CommunityEngagement) => r.ongoingCommitment ? "Yes" : "No" },
  { header: "Child Feedback", accessor: (r: CommunityEngagement) => r.childFeedback },
];

// ── component ───────────────────────────────────────────────────────────────
export default function CommunityEngagementLogPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((e) => e.activityType === filterType);
    if (filterYP !== "all") items = items.filter((e) => e.youngPeople.includes(filterYP));

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.durationMinutes - a.durationMinutes;
        case "type":
          return a.activityType.localeCompare(b.activityType);
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, filterYP, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalActivities = data.length;
  const ongoingCommitments = data.filter((e) => e.ongoingCommitment).length;
  const buildingConnections = data.filter((e) => e.buildsConnections).length;
  const totalHours = Math.round(data.reduce((sum, e) => sum + e.durationMinutes, 0) / 60);

  return (
    <PageShell
      title="Community Engagement Log"
      subtitle="Recording integration into the local community — building belonging, connections, and citizenship"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="community-engagement-log" />
          <PrintButton title="Community Engagement Log" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalActivities}</p>
          <p className="text-xs text-muted-foreground">Total Activities</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{ongoingCommitments}</p>
          <p className="text-xs text-muted-foreground">Ongoing Commitments</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{buildingConnections}</p>
          <p className="text-xs text-muted-foreground">Building Connections</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total Hours</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Globe className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Children grow through belonging. Every entry here represents a relationship, a memory, or a connection
          that exists beyond the home — building the foundation for adulthood and citizenship.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Sports/Fitness">Sports/Fitness</SelectItem>
            <SelectItem value="Arts/Culture">Arts/Culture</SelectItem>
            <SelectItem value="Volunteering">Volunteering</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Religious/Spiritual">Religious/Spiritual</SelectItem>
            <SelectItem value="Social">Social</SelectItem>
            <SelectItem value="Civic">Civic</SelectItem>
            <SelectItem value="Environmental">Environmental</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── activity cards ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No activities match your filters.</div>
        )}
        {filtered.map((evt) => {
          const isExpanded = expandedId === evt.id;
          const TypeIcon = typeIcons[evt.activityType] || Users;

          return (
            <div key={evt.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <TypeIcon className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{evt.activity}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evt.date} &middot; {evt.youngPeople.map(getYPName).join(", ")} &middot; {evt.organisation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[evt.activityType])}>
                    {evt.activityType}
                  </span>
                  {evt.ongoingCommitment && <Star className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcomes</p>
                    <ul className="space-y-1">
                      {evt.outcomes.map((o, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Feedback</p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{evt.childFeedback}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm">{evt.notes}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><MapPin className="h-3 w-3 inline mr-1" />{evt.location}</span>
                    <span>Duration: {evt.durationMinutes} mins</span>
                    <span>Staff: {evt.staffPresent.map(getStaffName).join(", ")}</span>
                    {evt.buildsConnections && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Builds Connections</span>
                    )}
                    {evt.ongoingCommitment && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Ongoing</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Community engagement supports Quality Standard 6 (positive
          relationships), Quality Standard 8 (education), and Quality Standard 10 (positive relationships).
          The home actively supports children&apos;s integration into the local community per Children&apos;s
          Homes Regulations 2015 Regulation 8 (educational achievement) and Regulation 11 (contact and
          relationships). Activities link to placement plan goals.
        </p>
      </div>
    </PageShell>
  );
}
