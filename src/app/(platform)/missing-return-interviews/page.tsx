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
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  Shield,
  ArrowUpDown,
  UserCheck,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface ReturnInterview {
  id: string;
  youngPersonId: string;
  missingEpisodeDate: string;
  returnDate: string;
  interviewDate: string | null;
  interviewedBy: string;
  independentOfHome: boolean;
  interviewStatus: "completed" | "offered_declined" | "pending" | "not_yet_due";
  declinedReason: string | null;
  duration: string | null;
  location: string;
  pushFactors: string[];
  pullFactors: string[];
  whereWent: string;
  whoWith: string;
  risksIdentified: string[];
  exploitationConcerns: boolean;
  exploitationDetails: string | null;
  childViewOnSafety: string;
  whatWouldHelp: string;
  actionsAgreed: { action: string; owner: string; deadline: string; status: string }[];
  sharedWith: string[];
  notes: string;
}

/* ─── seed data ─── */
const interviews: ReturnInterview[] = [
  {
    id: "ri_001",
    youngPersonId: "yp_casey",
    missingEpisodeDate: d(-21),
    returnDate: d(-21),
    interviewDate: d(-20),
    interviewedBy: "staff_chervelle",
    independentOfHome: false,
    interviewStatus: "completed",
    declinedReason: null,
    duration: "35 minutes",
    location: "Casey's bedroom (Casey's choice)",
    pushFactors: [
      "Argument with another young person earlier that day",
      "Feeling overwhelmed by school pressure",
      "Wanted space that the home couldn't provide in that moment",
    ],
    pullFactors: [
      "Older peers in town centre — sense of belonging",
      "Access to vaping materials",
      "Freedom and perceived independence",
    ],
    whereWent: "Town centre, then to a friend's flat (known associate — Mark, age 19)",
    whoWith: "Initially alone, then met up with Mark and another unknown male",
    risksIdentified: [
      "Association with older males — exploitation indicators",
      "Unknown location (friend's flat) — unable to safeguard",
      "No phone contact for 4 hours",
      "Returned smelling of cannabis",
    ],
    exploitationConcerns: true,
    exploitationDetails: "Mark (19) has been flagged in previous exploitation screenings. Casey minimises the relationship. Multi-agency discussion required. NRM referral being considered.",
    childViewOnSafety: "Casey says they felt safe and 'it wasn't a big deal.' Doesn't understand why staff worry. Says Mark is 'just a friend' and they were 'just chilling.'",
    whatWouldHelp: "Casey asked for a 'cool-off space' in the home — somewhere to go when feeling overwhelmed without it being a big deal. Also wants staff to 'not make it into a thing' when they need space.",
    actionsAgreed: [
      { action: "Create cool-off space in conservatory with Casey's input", owner: "staff_darren", deadline: d(-14), status: "completed" },
      { action: "Multi-agency meeting re: Mark — exploitation concerns", owner: "staff_darren", deadline: d(-7), status: "completed" },
      { action: "Update Casey's risk assessment re: exploitation", owner: "staff_chervelle", deadline: d(-18), status: "completed" },
      { action: "Refer to independent return interview service for future episodes", owner: "staff_ryan", deadline: d(-14), status: "completed" },
    ],
    sharedWith: ["Social worker", "Police (Operation Encompass)", "Virtual school head"],
    notes: "Casey engaged well with Chervelle — trusted relationship. Key concern is the association with Mark. Casey's request for a cool-off space is reasonable and has been actioned. The exploitation element requires ongoing multi-agency response.",
  },
  {
    id: "ri_002",
    youngPersonId: "yp_casey",
    missingEpisodeDate: d(-7),
    returnDate: d(-7),
    interviewDate: null,
    interviewedBy: "staff_chervelle",
    independentOfHome: false,
    interviewStatus: "offered_declined",
    declinedReason: "Casey said 'I literally just went to the shop and my phone died. I wasn't missing.' Episode was 90 minutes. Staff offered interview within 72 hours — Casey declined twice but agreed to informal chat.",
    duration: null,
    location: "N/A — declined formal interview",
    pushFactors: ["None identified — Casey states phone died and lost track of time"],
    pullFactors: ["Wanted snacks from shop"],
    whereWent: "Local shop (confirmed by CCTV check with police)",
    whoWith: "Alone",
    risksIdentified: ["Phone not charged — unable to contact", "Returned 60 minutes past expected time"],
    exploitationConcerns: false,
    exploitationDetails: null,
    childViewOnSafety: "Casey frustrated at being categorised as 'missing' — felt it was disproportionate. In informal chat said 'I was literally at the shop.'",
    whatWouldHelp: "Casey suggested keeping a portable charger. Staff agreed this is proportionate.",
    actionsAgreed: [
      { action: "Purchase portable phone charger for Casey", owner: "staff_anna", deadline: d(-3), status: "completed" },
      { action: "Review missing threshold with team — is 90 min proportionate?", owner: "staff_darren", deadline: d(7), status: "in_progress" },
    ],
    sharedWith: ["Social worker (informed — low level)"],
    notes: "This was a low-risk episode. Casey's frustration at being 'missing' is understandable — the threshold may need review for older YP with good track record. Informal conversation captured key information. Casey's rights under Article 15 (freedom of movement) must be balanced with duty of care.",
  },
  {
    id: "ri_003",
    youngPersonId: "yp_jordan",
    missingEpisodeDate: d(-45),
    returnDate: d(-45),
    interviewDate: d(-44),
    interviewedBy: "staff_anna",
    independentOfHome: false,
    interviewStatus: "completed",
    declinedReason: null,
    duration: "20 minutes",
    location: "Quiet room with Anna — Jordan's safe space",
    pushFactors: [
      "Overwhelmed after contact phone call with birth mum",
      "Mum made promises about coming to visit — Jordan dysregulated",
      "Sensory overload — too many people in communal areas",
    ],
    pullFactors: ["None — Jordan went to the garden/field behind the home"],
    whereWent: "Field behind the home (within 200m). Jordan visible from upstairs window for part of the time.",
    whoWith: "Alone",
    risksIdentified: [
      "Emotional vulnerability after contact",
      "Cold weather — left without coat",
      "Did not respond to staff calling for 25 minutes",
    ],
    exploitationConcerns: false,
    exploitationDetails: null,
    childViewOnSafety: "Jordan said 'I just needed to be alone. I wasn't going anywhere. I could still see the house.' Jordan felt safe but acknowledged not responding to staff was 'not fair on them.'",
    whatWouldHelp: "Jordan asked if they could have a 'signal' with staff — a way to say 'I need space but I'm OK' without having to talk. Also asked for post-contact quiet time to be built into routine.",
    actionsAgreed: [
      { action: "Agree signal system with Jordan (thumbs up from window = I'm OK)", owner: "staff_anna", deadline: d(-42), status: "completed" },
      { action: "Build 30-min quiet time into Jordan's post-contact routine", owner: "staff_anna", deadline: d(-42), status: "completed" },
      { action: "Review whether this should be categorised as 'missing' or 'absent'", owner: "staff_darren", deadline: d(-40), status: "completed" },
    ],
    sharedWith: ["Social worker"],
    notes: "This was recategorised to 'absent' (not 'missing') following RM review — Jordan was in sight of the home, not at risk, and returned voluntarily within 30 min. The signal system is working well. Jordan's need for post-contact decompression is valid and has been built into care plan.",
  },
  {
    id: "ri_004",
    youngPersonId: "yp_alex",
    missingEpisodeDate: d(-90),
    returnDate: d(-90),
    interviewDate: d(-89),
    interviewedBy: "staff_ryan",
    independentOfHome: true,
    interviewStatus: "completed",
    declinedReason: null,
    duration: "25 minutes",
    location: "Garden bench — Alex's choice (wanted fresh air)",
    pushFactors: [
      "Fell out with Jordan over TV remote — felt it was unfair",
      "Staff sided with Jordan (Alex's perception)",
      "Built-up frustration about school homework",
    ],
    pullFactors: ["Wanted to see school friend (Kieran) — went to Kieran's house"],
    whereWent: "Kieran's house (known friend, parents aware and welcoming)",
    whoWith: "Kieran (same age, school friend, no concerns)",
    risksIdentified: [
      "Didn't tell staff where going",
      "Crossed a busy road without permission",
      "Missed evening medication (antihistamine — low risk)",
    ],
    exploitationConcerns: false,
    exploitationDetails: null,
    childViewOnSafety: "Alex said 'I was completely fine. I was at Kieran's mum's house. She gave me dinner. I just needed to get away from Jordan.' Alex understands the worry but felt the response was disproportionate.",
    whatWouldHelp: "Alex asked if they could have Kieran's mum's number logged so staff can call and check rather than escalating. Also asked for a 'time out' card they can show staff when frustrated.",
    actionsAgreed: [
      { action: "Add Kieran's mum (Sarah) to approved contacts with phone number", owner: "staff_ryan", deadline: d(-87), status: "completed" },
      { action: "Create time-out card system with Alex", owner: "staff_ryan", deadline: d(-85), status: "completed" },
      { action: "Discuss conflict resolution between Alex and Jordan in key work", owner: "staff_anna", deadline: d(-80), status: "completed" },
    ],
    sharedWith: ["Social worker"],
    notes: "Low-risk episode with clear, understandable trigger. Alex went somewhere safe and was with a known, trusted family. The episode highlighted the need for better conflict resolution in the home and more nuanced 'missing' thresholds. Alex's suggestions were practical and have been implemented.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<ReturnInterview>[] = [
  { header: "Young Person", accessor: (r: ReturnInterview) => getYPName(r.youngPersonId) },
  { header: "Missing Date", accessor: (r: ReturnInterview) => r.missingEpisodeDate },
  { header: "Return Date", accessor: (r: ReturnInterview) => r.returnDate },
  { header: "Interview Date", accessor: (r: ReturnInterview) => r.interviewDate ?? "N/A" },
  { header: "Interviewed By", accessor: (r: ReturnInterview) => getStaffName(r.interviewedBy) },
  { header: "Status", accessor: (r: ReturnInterview) => r.interviewStatus.replace(/_/g, " ") },
  { header: "Independent", accessor: (r: ReturnInterview) => r.independentOfHome ? "Yes" : "No" },
  { header: "Exploitation Concerns", accessor: (r: ReturnInterview) => r.exploitationConcerns ? "Yes" : "No" },
  { header: "Push Factors", accessor: (r: ReturnInterview) => r.pushFactors.join("; ") },
  { header: "Pull Factors", accessor: (r: ReturnInterview) => r.pullFactors.join("; ") },
  { header: "Actions", accessor: (r: ReturnInterview) => r.actionsAgreed.length.toString() },
];

/* ─── component ─── */
export default function MissingReturnInterviewsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...interviews];
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    if (filterStatus !== "all") list = list.filter((r) => r.interviewStatus === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.missingEpisodeDate.localeCompare(a.missingEpisodeDate);
        case "name":
          return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "status":
          return a.interviewStatus.localeCompare(b.interviewStatus);
        default:
          return 0;
      }
    });
    return list;
  }, [filterYP, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = interviews.length;
    const completed = interviews.filter((r) => r.interviewStatus === "completed").length;
    const declined = interviews.filter((r) => r.interviewStatus === "offered_declined").length;
    const exploitationFlags = interviews.filter((r) => r.exploitationConcerns).length;
    const within72h = interviews.filter((r) => {
      if (!r.interviewDate) return false;
      const ret = new Date(r.returnDate).getTime();
      const inter = new Date(r.interviewDate).getTime();
      return (inter - ret) <= 72 * 60 * 60 * 1000;
    }).length;
    return { total, completed, declined, exploitationFlags, within72h };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "offered_declined":
        return <Badge className="bg-amber-100 text-amber-800">Declined</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      case "not_yet_due":
        return <Badge variant="outline">Not Yet Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageShell
      title="Missing — Return Home Interviews"
      subtitle="Statutory interviews within 72 hours of return from missing episodes"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={interviews} columns={exportCols} filename="return-interviews" />
          <PrintButton title="Missing — Return Home Interviews" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Episodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Interviews Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.within72h}</p>
            <p className="text-xs text-muted-foreground">Within 72hrs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={cn("text-2xl font-bold", stats.exploitationFlags > 0 ? "text-red-700" : "text-green-700")}>
              {stats.exploitationFlags}
            </p>
            <p className="text-xs text-muted-foreground">Exploitation Flags</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── exploitation alert ─── */}
      {stats.exploitationFlags > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Exploitation Concerns Identified</p>
              <p className="text-xs text-red-700 mt-1">
                {interviews
                  .filter((r) => r.exploitationConcerns)
                  .map((r) => `${getYPName(r.youngPersonId)} (${r.missingEpisodeDate})`)
                  .join("; ")}{" "}
                — multi-agency response active. See exploitation screening for full details.
              </p>
            </div>
          </div>
        </div>
      )}

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

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="offered_declined">Declined</option>
          <option value="pending">Pending</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* ─── interview cards ─── */}
      <div className="space-y-4">
        {filtered.map((interview) => {
          const expanded = expandedId === interview.id;

          return (
            <Card key={interview.id} className={cn("overflow-hidden", interview.exploitationConcerns && "border-red-200")}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(interview.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      interview.exploitationConcerns ? "bg-red-100" :
                      interview.interviewStatus === "completed" ? "bg-green-100" : "bg-amber-100"
                    )}>
                      <MapPin className={cn(
                        "h-5 w-5",
                        interview.exploitationConcerns ? "text-red-600" :
                        interview.interviewStatus === "completed" ? "text-green-600" : "text-amber-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(interview.youngPersonId)} — {interview.missingEpisodeDate}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(interview.interviewStatus)}
                        {interview.exploitationConcerns && (
                          <Badge className="bg-red-100 text-red-800">Exploitation Concern</Badge>
                        )}
                        {interview.independentOfHome && (
                          <Badge variant="outline" className="text-xs">Independent</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Interviewer</p>
                      <p className="text-sm">{getStaffName(interview.interviewedBy)}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* declined reason */}
                  {interview.declinedReason && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-sm font-medium text-amber-800">Reason Declined</p>
                      <p className="text-sm text-amber-700 mt-1">{interview.declinedReason}</p>
                    </div>
                  )}

                  {/* episode summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Where They Went</p>
                      <p className="text-sm">{interview.whereWent}</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Who With</p>
                      <p className="text-sm">{interview.whoWith}</p>
                    </div>
                  </div>

                  {interview.duration && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" /> Duration: {interview.duration}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> Location: {interview.location}
                      </span>
                    </div>
                  )}

                  {/* push/pull factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Push Factors (away from home)
                      </p>
                      <ul className="space-y-1">
                        {interview.pushFactors.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-1.5">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Pull Factors (toward destination)
                      </p>
                      <ul className="space-y-1">
                        {interview.pullFactors.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-400 mt-1.5">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* risks */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Shield className="h-4 w-4 text-orange-600" /> Risks Identified
                    </p>
                    <ul className="space-y-1">
                      {interview.risksIdentified.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-orange-400 mt-1.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* exploitation */}
                  {interview.exploitationConcerns && interview.exploitationDetails && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Exploitation Concerns
                      </p>
                      <p className="text-sm text-red-700 mt-1">{interview.exploitationDetails}</p>
                    </div>
                  )}

                  {/* child's voice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" /> Child&apos;s View on Safety
                    </p>
                    <p className="text-sm text-blue-700 mt-1">{interview.childViewOnSafety}</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> What Would Help
                    </p>
                    <p className="text-sm text-green-700 mt-1">{interview.whatWouldHelp}</p>
                  </div>

                  {/* actions */}
                  {interview.actionsAgreed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Actions Agreed</p>
                      <div className="space-y-2">
                        {interview.actionsAgreed.map((act, i) => (
                          <div key={i} className="border rounded-md p-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm">{act.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {getStaffName(act.owner)} · by {act.deadline}
                              </p>
                            </div>
                            <Badge className={cn(
                              "text-xs",
                              act.status === "completed" ? "bg-green-100 text-green-800" :
                              act.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            )}>
                              {act.status.replace("_", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* shared with */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shared With</p>
                    <div className="flex flex-wrap gap-1">
                      {interview.sharedWith.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{interview.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Missing</p>
                      <p className="text-sm font-medium">{interview.missingEpisodeDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Returned</p>
                      <p className="text-sm font-medium">{interview.returnDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Interview</p>
                      <p className="text-sm font-medium">{interview.interviewDate ?? "N/A"}</p>
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
          Statutory guidance on children who run away or go missing from home or care (2014) requires
          that all children are offered an independent return home interview within 72 hours of their
          return. Regulation 34 of the Children&apos;s Homes Regulations 2015 requires the registered
          person to take steps to locate missing children and report to appropriate persons. The
          interview explores push/pull factors, assesses exploitation risk, and ensures the child&apos;s
          voice informs safety planning. Where a child declines, this is recorded with efforts made
          to engage. Information is shared with police (Operation Encompass) and placing authority.
        </p>
      </div>
    </PageShell>
  );
}
