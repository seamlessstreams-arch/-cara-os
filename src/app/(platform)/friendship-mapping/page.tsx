"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Heart,
  Shield,
  CalendarClock,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type AgeCategory =
  | "Same age (peer)"
  | "Older (1-2 yrs)"
  | "Older (3+ yrs)"
  | "Younger"
  | "Adult";

type FriendContext =
  | "School"
  | "Sport club"
  | "Care system peer"
  | "Cultural community"
  | "Online"
  | "Neighbourhood"
  | "Family network";

type Quality =
  | "Strong/positive"
  | "Developing"
  | "Casual"
  | "Some concerns"
  | "Significant concerns";

type ContactType = "In-person" | "Online" | "Both";

type IsolationRisk = "Low" | "Medium" | "High";

interface Friend {
  friendInitial: string;
  ageCategory: AgeCategory;
  context: FriendContext;
  durationOfFriendship: string;
  qualityOfRelationship: Quality;
  contextualSafeguardingNotes: string;
  friendsParentsKnown: boolean;
  contactType: ContactType;
  frequency: string;
  supportNeeded: string;
}

interface FriendshipMap {
  id: string;
  youngPerson: string;
  mapDate: string;
  friends: Friend[];
  friendshipStrengths: string[];
  friendshipChallenges: string[];
  isolationRisk: IsolationRisk;
  lonelinessFactors: string;
  supportToBuildFriendships: string[];
  reviewedDate: string;
  reviewedBy: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const QUALITY_COLOURS: Record<Quality, string> = {
  "Strong/positive": "bg-green-100 text-green-800",
  "Developing": "bg-blue-100 text-blue-800",
  "Casual": "bg-gray-100 text-gray-700",
  "Some concerns": "bg-amber-100 text-amber-800",
  "Significant concerns": "bg-red-100 text-red-800",
};

const RISK_COLOURS: Record<IsolationRisk, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

const CONTEXT_COLOURS: Record<FriendContext, string> = {
  "School": "bg-blue-50 text-blue-700",
  "Sport club": "bg-emerald-50 text-emerald-700",
  "Care system peer": "bg-purple-50 text-purple-700",
  "Cultural community": "bg-pink-50 text-pink-700",
  "Online": "bg-indigo-50 text-indigo-700",
  "Neighbourhood": "bg-teal-50 text-teal-700",
  "Family network": "bg-amber-50 text-amber-700",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: FriendshipMap[] = [
  {
    id: "fm1",
    youngPerson: "yp_alex",
    mapDate: d(-25),
    friends: [
      {
        friendInitial: "M.",
        ageCategory: "Same age (peer)",
        context: "Sport club",
        durationOfFriendship: "14 months",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Boxing club peer. Coach (DBS-checked) supervises sessions. Stable home, parents engaged with the club.",
        friendsParentsKnown: true,
        contactType: "Both",
        frequency: "3x weekly at training, occasional weekends",
        supportNeeded: "None — established positive friendship. Continue to support attendance.",
      },
      {
        friendInitial: "J.",
        ageCategory: "Same age (peer)",
        context: "School",
        durationOfFriendship: "8 months",
        qualityOfRelationship: "Developing",
        contextualSafeguardingNotes: "Classmate in college. Has visited Oak House twice with prior agreement. No known concerns.",
        friendsParentsKnown: false,
        contactType: "Both",
        frequency: "Daily at college, weekly socially",
        supportNeeded: "Encourage Alex to invite J. to a planned activity. Introductions to J.'s parents would be helpful.",
      },
      {
        friendInitial: "T.",
        ageCategory: "Older (1-2 yrs)",
        context: "Sport club",
        durationOfFriendship: "10 months",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Older boxing peer. Acts as informal mentor. Coach speaks well of T. Lives with grandparents.",
        friendsParentsKnown: true,
        contactType: "In-person",
        frequency: "2x weekly training",
        supportNeeded: "Positive influence. Maintain the connection — especially through transition to semi-independence.",
      },
      {
        friendInitial: "K.",
        ageCategory: "Same age (peer)",
        context: "Care system peer",
        durationOfFriendship: "6 months",
        qualityOfRelationship: "Casual",
        contextualSafeguardingNotes: "Met at a Children in Care Council event. Contact mostly online via Snapchat. K. is in a foster placement nearby.",
        friendsParentsKnown: false,
        contactType: "Online",
        frequency: "Weekly online messaging",
        supportNeeded: "Monitor online contact. Encourage occasional in-person meet-ups (at council events, supervised).",
      },
    ],
    friendshipStrengths: [
      "Boxing club provides a stable, supervised peer group with positive role models",
      "College friendship is broadening Alex's social circle beyond the home",
      "Alex shows loyalty and reliability in friendships once trust is established",
      "Older mentor figure (T.) provides aspirational positive influence",
    ],
    friendshipChallenges: [
      "Slow to invest in new friendships — avoidant attachment pattern shows here",
      "Tendency to keep friendships compartmentalised (boxing vs college vs care)",
      "Limited contact with friends' parents — reduces adult oversight network",
    ],
    isolationRisk: "Low",
    lonelinessFactors:
      "Alex copes well alone but can be slow to reach out when struggling. Boxing schedule provides protective routine. Watch for isolation around exam periods or transitions.",
    supportToBuildFriendships: [
      "Continue funding boxing club — it is the bedrock of Alex's positive peer network",
      "Support inviting J. (college friend) to Oak House for tea/study sessions",
      "Introduce Alex's keyworker (Anna) to friends' parents where possible",
      "Plan friendship continuity into semi-independent transition planning",
    ],
    reviewedDate: d(-25),
    reviewedBy: "staff_anna",
  },
  {
    id: "fm2",
    youngPerson: "yp_jordan",
    mapDate: d(-15),
    friends: [
      {
        friendInitial: "L.",
        ageCategory: "Same age (peer)",
        context: "School",
        durationOfFriendship: "2 years",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Best friend from school. Knows about Jordan being in care. Family welcoming and supportive.",
        friendsParentsKnown: true,
        contactType: "Both",
        frequency: "Daily at school, weekends regularly",
        supportNeeded: "Maintain. L.'s family is a key protective network.",
      },
      {
        friendInitial: "P.",
        ageCategory: "Same age (peer)",
        context: "School",
        durationOfFriendship: "18 months",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Part of Jordan's friendship group. Met parents at a school event. No concerns.",
        friendsParentsKnown: true,
        contactType: "Both",
        frequency: "Daily at school, weekly socially",
        supportNeeded: "Continue to facilitate sleepovers and visits.",
      },
      {
        friendInitial: "R.",
        ageCategory: "Same age (peer)",
        context: "Cultural community",
        durationOfFriendship: "3 years",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Long-standing friendship from Jordan's mosque community. Family well-known to social work team.",
        friendsParentsKnown: true,
        contactType: "Both",
        frequency: "Weekly at Friday prayers, monthly socially",
        supportNeeded: "Cultural community is a vital protective factor — continue to facilitate transport and attendance.",
      },
      {
        friendInitial: "B.",
        ageCategory: "Younger",
        context: "Family network",
        durationOfFriendship: "Lifetime",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Younger cousin. Regular family contact. Jordan takes a caring older-cousin role.",
        friendsParentsKnown: true,
        contactType: "In-person",
        frequency: "Monthly family contact",
        supportNeeded: "Support through family contact arrangements.",
      },
      {
        friendInitial: "C.",
        ageCategory: "Same age (peer)",
        context: "School",
        durationOfFriendship: "6 months",
        qualityOfRelationship: "Some concerns",
        contextualSafeguardingNotes: "Newer friend. C. has been involved in some low-level antisocial behaviour at school. School pastoral lead aware. Watch for influence.",
        friendsParentsKnown: false,
        contactType: "Both",
        frequency: "Daily at school, occasional socially",
        supportNeeded: "Liaise with school pastoral team. Discuss healthy friendships with Jordan in keywork. Avoid prohibition — discuss judgement.",
      },
      {
        friendInitial: "S.",
        ageCategory: "Same age (peer)",
        context: "Online",
        durationOfFriendship: "4 months",
        qualityOfRelationship: "Casual",
        contextualSafeguardingNotes: "Met through online gaming. Lives in another city — never met in person. Voice chat only via known platform. Discussed online safety with Jordan.",
        friendsParentsKnown: false,
        contactType: "Online",
        frequency: "Several times weekly via gaming",
        supportNeeded: "Continue online safety conversations. No plans to meet in person — would require risk assessment.",
      },
    ],
    friendshipStrengths: [
      "Broad, well-supervised peer network across school, mosque, and family",
      "Long-standing friendships providing emotional stability",
      "Cultural community connection is central to Jordan's identity and wellbeing",
      "Mostly know friends' parents — extended adult oversight in place",
      "Strong sibling-like bond with younger cousin",
    ],
    friendshipChallenges: [
      "One newer school friendship (C.) requires monitoring",
      "Online friendships need ongoing safety conversations",
      "Friendship group sometimes excludes Jordan during placement-related disruptions",
    ],
    isolationRisk: "Low",
    lonelinessFactors:
      "Jordan has a healthy network and rarely reports loneliness. Risk factors are post-contact dysregulation periods and any future placement instability.",
    supportToBuildFriendships: [
      "Maintain transport to mosque on Fridays — non-negotiable",
      "Continue facilitating sleepovers with L. and P.",
      "Use friendship group as part of care planning — they are protective",
      "Have regular check-in conversations about C. and choice of company",
      "Reinforce online safety habits during keywork sessions",
    ],
    reviewedDate: d(-15),
    reviewedBy: "staff_chervelle",
  },
  {
    id: "fm3",
    youngPerson: "yp_casey",
    mapDate: d(-10),
    friends: [
      {
        friendInitial: "Ellie",
        ageCategory: "Same age (peer)",
        context: "School",
        durationOfFriendship: "11 months",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Casey's closest friend. Ellie's mum is warm and welcoming, has met Anna (keyworker). Supervised playdates established.",
        friendsParentsKnown: true,
        contactType: "Both",
        frequency: "Daily at school, weekly playdates and sleepovers",
        supportNeeded: "Protect this friendship — it is the most important non-family relationship in Casey's life. Maintain regular contact during reunification transition.",
      },
      {
        friendInitial: "H.",
        ageCategory: "Same age (peer)",
        context: "School",
        durationOfFriendship: "8 months",
        qualityOfRelationship: "Developing",
        contextualSafeguardingNotes: "School classmate. Mostly group friendship. Have met H.'s parent at school pickup once.",
        friendsParentsKnown: false,
        contactType: "In-person",
        frequency: "Daily at school",
        supportNeeded: "Encourage one-to-one playdate to deepen the friendship beyond group settings.",
      },
      {
        friendInitial: "G.",
        ageCategory: "Adult",
        context: "Family network",
        durationOfFriendship: "Lifetime",
        qualityOfRelationship: "Strong/positive",
        contextualSafeguardingNotes: "Maternal grandmother. The most consistent adult relationship in Casey's life. Calls every Wednesday without fail.",
        friendsParentsKnown: true,
        contactType: "Both",
        frequency: "Weekly phone, monthly visits",
        supportNeeded: "Protect grandmother contact at all costs — it is Casey's secure base.",
      },
    ],
    friendshipStrengths: [
      "One deep, mutually caring friendship with Ellie — quality over quantity",
      "Ellie's family provides an extended protective network for Casey",
      "Strong, consistent attachment to grandmother — anchor relationship",
      "Casey is warm and well-liked at school",
    ],
    friendshipChallenges: [
      "Limited friendship breadth — overly reliant on Ellie",
      "Anxious-ambivalent attachment pattern can intensify in close friendships",
      "Casey's clinginess can occasionally overwhelm peers",
      "Reunification transition risks disrupting school-based friendships",
    ],
    isolationRisk: "Medium",
    lonelinessFactors:
      "Casey expresses loneliness when Ellie is unavailable. Heightened separation anxiety means that friendship absences feel more acute. Periods after family contact can leave Casey emotionally unavailable to friends.",
    supportToBuildFriendships: [
      "Plan friendship continuity carefully into reunification — keep Casey at same school if possible",
      "Encourage broadening of friendships (H. and others) so reliance is not solely on Ellie",
      "Support Ellie's mum to remain a reliable adult connection through transition",
      "Keywork conversations about healthy interdependence — caring for friends without overwhelming them",
      "Maintain grandmother's Wednesday call as an immovable anchor through any change",
    ],
    reviewedDate: d(-10),
    reviewedBy: "staff_anna",
  },
];

/* ── export ───────────────────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<FriendshipMap>[] = [
  { header: "Young Person",          accessor: (r: FriendshipMap) => getYPName(r.youngPerson) },
  { header: "Map Date",               accessor: (r: FriendshipMap) => r.mapDate },
  { header: "Friends Mapped",         accessor: (r: FriendshipMap) => r.friends.length },
  { header: "Strong Friendships",     accessor: (r: FriendshipMap) => r.friends.filter((f) => f.qualityOfRelationship === "Strong/positive").length },
  { header: "Concerns Flagged",       accessor: (r: FriendshipMap) => r.friends.filter((f) => f.qualityOfRelationship === "Some concerns" || f.qualityOfRelationship === "Significant concerns").length },
  { header: "Isolation Risk",         accessor: (r: FriendshipMap) => r.isolationRisk },
  { header: "Loneliness Factors",     accessor: (r: FriendshipMap) => r.lonelinessFactors },
  { header: "Strengths",              accessor: (r: FriendshipMap) => r.friendshipStrengths.join("; ") },
  { header: "Challenges",             accessor: (r: FriendshipMap) => r.friendshipChallenges.join("; ") },
  { header: "Support Plan",           accessor: (r: FriendshipMap) => r.supportToBuildFriendships.join("; ") },
  { header: "Reviewed Date",          accessor: (r: FriendshipMap) => r.reviewedDate },
  { header: "Reviewed By",            accessor: (r: FriendshipMap) => getStaffName(r.reviewedBy) },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function FriendshipMappingPage() {
  const [data] = useState<FriendshipMap[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const childrenMapped = data.length;
    const strongFriendships = data.reduce(
      (s, m) => s + m.friends.filter((f) => f.qualityOfRelationship === "Strong/positive").length,
      0
    );
    const concernsFlagged = data.reduce(
      (s, m) =>
        s +
        m.friends.filter(
          (f) =>
            f.qualityOfRelationship === "Some concerns" ||
            f.qualityOfRelationship === "Significant concerns"
        ).length,
      0
    );
    // "Reviews due in next 30 days" = last reviewed >= 11 months ago (335 days)
    const reviewsDue = data.filter((m) => m.reviewedDate <= d(-335)).length;
    return { childrenMapped, strongFriendships, concernsFlagged, reviewsDue };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          getYPName(m.youngPerson).toLowerCase().includes(q) ||
          m.friends.some((f) => f.friendInitial.toLowerCase().includes(q))
      );
    }
    if (filterRisk !== "all") list = list.filter((m) => m.isolationRisk === filterRisk);
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) => getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson)));
        break;
      case "risk": {
        const order: Record<IsolationRisk, number> = { High: 0, Medium: 1, Low: 2 };
        out.sort((a, b) => order[a.isolationRisk] - order[b.isolationRisk]);
        break;
      }
      case "friends":
        out.sort((a, b) => b.friends.length - a.friends.length);
        break;
      case "review":
        out.sort((a, b) => a.reviewedDate.localeCompare(b.reviewedDate));
        break;
    }
    return out;
  }, [data, search, filterRisk, sortBy]);

  return (
    <PageShell
      title="Friendship Mapping"
      subtitle="Mapping each child's friendship network — quality, context, and contextual safeguarding considerations"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Friendship Mapping" />
          <ExportButton data={data} columns={EXPORT_COLS} filename="friendship-mapping" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Children Mapped", value: stats.childrenMapped, icon: Users, colour: "text-blue-600" },
          { label: "Strong Friendships", value: stats.strongFriendships, icon: Heart, colour: "text-green-600" },
          { label: "Concerns Flagged", value: stats.concernsFlagged, icon: AlertTriangle, colour: stats.concernsFlagged > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Reviews Due (30 d)", value: stats.reviewsDue, icon: CalendarClock, colour: stats.reviewsDue > 0 ? "text-red-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── filters / sort ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children or friend initials…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Isolation Risks</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="risk">Isolation Risk</SelectItem>
              <SelectItem value="friends"># of Friends</SelectItem>
              <SelectItem value="review">Reviewed Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((m) => {
          const open = expandedId === m.id;
          const strong = m.friends.filter((f) => f.qualityOfRelationship === "Strong/positive").length;
          const concerns = m.friends.filter(
            (f) => f.qualityOfRelationship === "Some concerns" || f.qualityOfRelationship === "Significant concerns"
          ).length;
          return (
            <div key={m.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(m.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(m.youngPerson)}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        RISK_COLOURS[m.isolationRisk]
                      )}
                    >
                      Isolation: {m.isolationRisk}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {m.friends.length} friends
                    </span>
                    {strong > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {strong} strong
                      </span>
                    )}
                    {concerns > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {concerns} concern{concerns === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mapped {m.mapDate} · Last reviewed {m.reviewedDate} by {getStaffName(m.reviewedBy)}
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* friends list */}
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Friendship Network</h4>
                    <div className="space-y-3">
                      {m.friends.map((f, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{f.friendInitial}</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                QUALITY_COLOURS[f.qualityOfRelationship]
                              )}
                            >
                              {f.qualityOfRelationship}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                CONTEXT_COLOURS[f.context]
                              )}
                            >
                              {f.context}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {f.ageCategory}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {f.contactType}
                            </span>
                            {f.friendsParentsKnown ? (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 inline-flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Parents known
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                                Parents not known
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-500">Duration:</span>{" "}
                              <span className="font-medium text-gray-700">{f.durationOfFriendship}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span>{" "}
                              <span className="font-medium text-gray-700">{f.frequency}</span>
                            </div>
                          </div>
                          <div className="mt-2 rounded bg-amber-50 p-2">
                            <p className="text-xs font-medium text-amber-700 mb-0.5">
                              Contextual safeguarding notes
                            </p>
                            <p className="text-xs text-amber-800">{f.contextualSafeguardingNotes}</p>
                          </div>
                          <div className="mt-2 rounded bg-blue-50 p-2">
                            <p className="text-xs font-medium text-blue-700 mb-0.5">Support needed</p>
                            <p className="text-xs text-blue-800">{f.supportNeeded}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* strengths / challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">
                        Friendship Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {m.friendshipStrengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">
                        Friendship Challenges
                      </h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {m.friendshipChallenges.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* loneliness / isolation */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">
                      Loneliness &amp; Isolation Factors
                    </h4>
                    <p className="text-sm">{m.lonelinessFactors}</p>
                  </div>

                  {/* support plan */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">
                      Support to Build &amp; Sustain Friendships
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {m.supportToBuildFriendships.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* review meta */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Map date:</span>{" "}
                      <span className="font-medium">{m.mapDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reviewed:</span>{" "}
                      <span className="font-medium">{m.reviewedDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reviewed by:</span>{" "}
                      <span className="font-medium">{getStaffName(m.reviewedBy)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Quality Standard 9 — Positive Relationships:</strong> Children in care must be
        supported to develop and sustain positive relationships with peers and trusted adults.
        Friendship mapping helps the home understand each child&apos;s social network, identify
        contextual safeguarding considerations (per Carlene Firmin&apos;s contextual safeguarding
        framework), and plan support that nurtures belonging while reducing isolation. Maps should
        be reviewed at least annually, after any significant change in the child&apos;s social
        world, and as part of placement and transition planning.
      </div>
    </PageShell>
  );
}
