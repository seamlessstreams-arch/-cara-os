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
  MessageCircle,
  CheckCircle2,
  Star,
  Users,
  ArrowUpDown,
  Lightbulb,
  Heart,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface ParticipationEntry {
  id: string;
  date: string;
  context: string;
  category: "care_planning" | "house_rules" | "activities" | "environment" | "staffing" | "complaints" | "menu" | "policy";
  childrenInvolved: string[];
  howConsulted: string;
  whatChildSaid: string;
  decisionMade: string;
  childInfluenced: boolean;
  influenceDescription: string;
  feedbackGiven: string;
  recordedBy: string;
  evidenceType: "house_meeting" | "key_work" | "1_to_1" | "survey" | "reg44_interview" | "lac_review" | "informal";
}

/* ─── seed data ─── */
const entries: ParticipationEntry[] = [
  {
    id: "part_001",
    date: d(-7),
    context: "House Meeting — Weekly Menu Planning",
    category: "menu",
    childrenInvolved: ["yp_alex", "yp_jordan", "yp_casey"],
    howConsulted: "House meeting discussion. Each child asked what meals they'd like. Voted on Friday treat meal.",
    whatChildSaid: "Alex requested 'spaghetti bolognese at least once a week.' Jordan asked for 'no spicy food on school nights because it hurts my tummy.' Casey wanted 'a burger night on Fridays.'",
    decisionMade: "Menu updated: spaghetti bolognese on Wednesdays, Jordan's meals clearly marked as mild, Friday designated as burger/takeaway night (alternating).",
    childInfluenced: true,
    influenceDescription: "All three children's preferences directly incorporated into the weekly menu. Jordan's sensory needs accommodated. Friday treat night agreed unanimously.",
    feedbackGiven: "Menu displayed in kitchen with children's choices highlighted. Children told 'you chose this week's meals' at dinner.",
    recordedBy: "staff_anna",
    evidenceType: "house_meeting",
  },
  {
    id: "part_002",
    date: d(-14),
    context: "House Meeting — Bedtime Extensions Request",
    category: "house_rules",
    childrenInvolved: ["yp_alex", "yp_casey"],
    howConsulted: "Alex and Casey raised request at house meeting. Staff facilitated discussion about pros/cons. Jordan did not wish to participate (happy with current bedtime).",
    whatChildSaid: "Casey: 'We should be allowed to stay up later at weekends — we don't have school.' Alex: 'Even just 30 minutes would be fair. Other kids my age stay up later.'",
    decisionMade: "Weekend bedtimes extended by 30 minutes for both Alex and Casey. Trial period of 4 weeks. Staff to review impact on morning routines.",
    childInfluenced: true,
    influenceDescription: "Children's request granted in full. Their argument about weekend flexibility was reasonable and proportionate. Change implemented the following weekend.",
    feedbackGiven: "Children told at next house meeting that their request was approved. House rules document updated and displayed. Children acknowledged this felt fair.",
    recordedBy: "staff_darren",
    evidenceType: "house_meeting",
  },
  {
    id: "part_003",
    date: d(-21),
    context: "Key Work Session — Casey's Contact Arrangements",
    category: "care_planning",
    childrenInvolved: ["yp_casey"],
    howConsulted: "1:1 key work session with Chervelle. Direct question about contact wishes. Used talking mat to support expression.",
    whatChildSaid: "Casey said: 'I want to call mum when I want to, not when it's scheduled. I'm 15, I can decide when I want to talk to my mum.' Also: 'I don't need someone listening in.'",
    decisionMade: "Contact plan updated: Casey now calls mum at their own discretion rather than at set times. Supervision removed from phone calls (assessed as safe). Face-to-face contact remains monthly but Casey can request additional visits.",
    childInfluenced: true,
    influenceDescription: "Casey's request for autonomy over contact was granted. Assessment confirmed phone supervision unnecessary. Casey now manages own contact — a significant step toward independence.",
    feedbackGiven: "Chervelle told Casey their contact plan had been updated. Casey said 'finally' and seemed relieved. Social worker informed and agreed.",
    recordedBy: "staff_chervelle",
    evidenceType: "key_work",
  },
  {
    id: "part_004",
    date: d(-28),
    context: "Jordan's Bedroom — Sensory Modifications",
    category: "environment",
    childrenInvolved: ["yp_jordan"],
    howConsulted: "1:1 discussion with Anna during key work. Jordan shown options catalogue. OT recommendations incorporated. Jordan chose specific items.",
    whatChildSaid: "Jordan requested: night light to stay on always ('the dark scares me'), weighted blanket in blue ('my favourite colour'), soft carpet instead of hard floor, and a 'Do Not Disturb' sign for the door.",
    decisionMade: "All requests granted. Night light installed (warm amber, Jordan's choice). Blue 5kg weighted blanket purchased. Carpet tiles fitted. DND sign made together in art session.",
    childInfluenced: true,
    influenceDescription: "Every environmental modification was led by Jordan's expressed wishes. OT recommendations aligned with Jordan's preferences, reinforcing that professional advice and child choice can work together.",
    feedbackGiven: "Jordan shown each item as it arrived. Jordan involved in fitting carpet tiles. Jordan said the room 'feels like mine now.'",
    recordedBy: "staff_anna",
    evidenceType: "1_to_1",
  },
  {
    id: "part_005",
    date: d(-35),
    context: "Reg 44 Visit — Children's Views",
    category: "care_planning",
    childrenInvolved: ["yp_alex", "yp_jordan", "yp_casey"],
    howConsulted: "Independent Reg 44 visitor spoke to each child separately. Used age-appropriate questioning. Children knew they could say anything confidentially.",
    whatChildSaid: "Alex: 'I'm happy here. Staff are nice. I wish we could have a dog.' Jordan: 'I like Anna. Sometimes it's too loud.' Casey: 'It's alright. Better than before. I just wish people would stop treating me like a kid.'",
    decisionMade: "Dog: explored but not feasible (allergies, staffing). Noise: quiet hours reinforced (already in house rules). Casey: review of language used — staff briefed on age-appropriate expectations.",
    childInfluenced: true,
    influenceDescription: "Noise concern led to reinforcement of quiet hours. Casey's feedback about being 'treated like a kid' directly informed staff briefing on promoting age-appropriate independence. Dog request explored genuinely but declined with explanation to Alex.",
    feedbackGiven: "Reg 44 visitor feedback letter given to each child explaining what was heard and what action taken. Children given right of reply.",
    recordedBy: "staff_darren",
    evidenceType: "reg44_interview",
  },
  {
    id: "part_006",
    date: d(-42),
    context: "Activity Planning — Half-Term Programme",
    category: "activities",
    childrenInvolved: ["yp_alex", "yp_jordan", "yp_casey"],
    howConsulted: "Planning session at house meeting. Each child given 3 'votes' to allocate across suggestions. Staff added options but children could suggest own.",
    whatChildSaid: "Alex: cinema + bowling. Jordan: aquarium (quiet day) + baking day. Casey: laser tag + 'nothing day' (just chill at home). All three voted for pizza making together.",
    decisionMade: "Half-term plan: Monday cinema, Tuesday aquarium, Wednesday pizza + baking, Thursday laser tag, Friday chill day. Accommodates all preferences.",
    childInfluenced: true,
    influenceDescription: "Programme entirely shaped by children's choices. Each child got at least 2 of their preferred activities. Casey's 'nothing day' valued equally — rest is important.",
    feedbackGiven: "Plan displayed in kitchen with children's names next to their choices. Jordan drew pictures for each day's activity.",
    recordedBy: "staff_anna",
    evidenceType: "house_meeting",
  },
  {
    id: "part_007",
    date: d(-50),
    context: "Complaint Resolution — Wi-Fi Speed",
    category: "complaints",
    childrenInvolved: ["yp_casey"],
    howConsulted: "Casey submitted formal complaint via complaints box. Meeting held with Casey to understand issue. Casey suggested solutions.",
    whatChildSaid: "Casey complained: 'The Wi-Fi is so slow I can't even play online games without lag. It's not fair.' Casey suggested: 'Can we get a better router or at least a wired connection for the games console?'",
    decisionMade: "Broadband upgraded from 100Mbps to 500Mbps. Wired ethernet connection installed for the gaming console in the lounge. Cost: £15/month extra — approved by RM.",
    childInfluenced: true,
    influenceDescription: "Casey's complaint was resolved with their suggested solution. Demonstrated that complaints are taken seriously and can lead to real change. Casey told 'your complaint made this happen.'",
    feedbackGiven: "Written response to complaint within 5 working days. Casey told 'you were right, it wasn't good enough. We've fixed it.' Casey acknowledged satisfied.",
    recordedBy: "staff_ryan",
    evidenceType: "1_to_1",
  },
  {
    id: "part_008",
    date: d(-10),
    context: "New Staff Recruitment — Children's Panel",
    category: "staffing",
    childrenInvolved: ["yp_alex", "yp_casey"],
    howConsulted: "Children invited to participate in recruitment panel. Given guidance on appropriate questions. Their feedback weighted in decision. Jordan declined (too anxious) — views sought separately via key worker.",
    whatChildSaid: "Alex asked candidates: 'What would you do if I was upset?' and 'Do you like gaming?' Casey asked: 'Have you worked in a children's home before?' and 'What would you do if someone was rude to you?' Alex preferred Candidate B. Casey preferred Candidate B. Jordan (via Anna): 'I want someone calm and quiet.'",
    decisionMade: "Candidate B offered the position — aligned with children's preferences and professional assessment. Children's feedback formed part of the decision rationale.",
    childInfluenced: true,
    influenceDescription: "Children's panel feedback was a genuine deciding factor. Both children preferred the same candidate, whose qualities also aligned with Jordan's stated preference for 'calm and quiet.' Recruitment panel noted children's insight was valuable.",
    feedbackGiven: "Children told their preferred candidate was offered the job. Alex said 'yes!' Casey said 'good, they seemed normal.' Children told their opinions mattered in the decision.",
    recordedBy: "staff_darren",
    evidenceType: "1_to_1",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<ParticipationEntry>[] = [
  { header: "Date", accessor: (r: ParticipationEntry) => r.date },
  { header: "Context", accessor: (r: ParticipationEntry) => r.context },
  { header: "Category", accessor: (r: ParticipationEntry) => r.category.replace(/_/g, " ") },
  { header: "Children Involved", accessor: (r: ParticipationEntry) => r.childrenInvolved.map((c) => getYPName(c)).join(", ") },
  { header: "How Consulted", accessor: (r: ParticipationEntry) => r.howConsulted },
  { header: "Child Said", accessor: (r: ParticipationEntry) => r.whatChildSaid },
  { header: "Decision", accessor: (r: ParticipationEntry) => r.decisionMade },
  { header: "Influenced", accessor: (r: ParticipationEntry) => r.childInfluenced ? "Yes" : "No" },
  { header: "Influence Description", accessor: (r: ParticipationEntry) => r.influenceDescription },
  { header: "Recorded By", accessor: (r: ParticipationEntry) => getStaffName(r.recordedBy) },
];

/* ─── component ─── */
export default function ChildParticipationLogPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...entries];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterChild !== "all") list = list.filter((r) => r.childrenInvolved.includes(filterChild));
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "category":
          return a.category.localeCompare(b.category);
        case "context":
          return a.context.localeCompare(b.context);
        default:
          return 0;
      }
    });
    return list;
  }, [filterCategory, filterChild, sortBy]);

  const stats = useMemo(() => {
    const total = entries.length;
    const influenced = entries.filter((e) => e.childInfluenced).length;
    const pct = Math.round((influenced / total) * 100);
    const categories = [...new Set(entries.map((e) => e.category))].length;
    return { total, influenced, pct, categories };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      care_planning: "Care Planning",
      house_rules: "House Rules",
      activities: "Activities",
      environment: "Environment",
      staffing: "Staffing",
      complaints: "Complaints",
      menu: "Menu",
      policy: "Policy",
    };
    return labels[cat] ?? cat;
  };

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      care_planning: "bg-blue-100 text-blue-800",
      house_rules: "bg-purple-100 text-purple-800",
      activities: "bg-green-100 text-green-800",
      environment: "bg-amber-100 text-amber-800",
      staffing: "bg-indigo-100 text-indigo-800",
      complaints: "bg-red-100 text-red-800",
      menu: "bg-pink-100 text-pink-800",
      policy: "bg-slate-100 text-slate-800",
    };
    return colors[cat] ?? "bg-gray-100 text-gray-800";
  };

  const evidenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      house_meeting: "House Meeting",
      key_work: "Key Work",
      "1_to_1": "1:1 Discussion",
      survey: "Survey",
      reg44_interview: "Reg 44 Interview",
      lac_review: "LAC Review",
      informal: "Informal",
    };
    return labels[type] ?? type;
  };

  return (
    <PageShell
      title="Child Participation Log"
      subtitle="Recording how children's views influence decisions — demonstrating genuine participation"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={entries} columns={exportCols} filename="child-participation-log" />
          <PrintButton title="Child Participation Log" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Participation Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.pct}%</p>
            <p className="text-xs text-muted-foreground">Child Influenced Outcome</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.influenced}</p>
            <p className="text-xs text-muted-foreground">Decisions Changed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.categories}</p>
            <p className="text-xs text-muted-foreground">Areas Covered</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── participation note ─── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Star className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Genuine Participation</p>
            <p className="text-xs text-emerald-700 mt-1">
              This log evidences that children&apos;s voices genuinely influence decisions at Oak House.
              Participation goes beyond &apos;being asked&apos; — children are shown how their views
              shaped outcomes. Where requests can&apos;t be met, honest explanations are given.
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="care_planning">Care Planning</option>
          <option value="house_rules">House Rules</option>
          <option value="activities">Activities</option>
          <option value="environment">Environment</option>
          <option value="staffing">Staffing</option>
          <option value="complaints">Complaints</option>
          <option value="menu">Menu</option>
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterChild}
          onChange={(e) => setFilterChild(e.target.value)}
        >
          <option value="all">All Children</option>
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
            <option value="category">Category</option>
            <option value="context">Context</option>
          </select>
        </div>
      </div>

      {/* ─── entry cards ─── */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const expanded = expandedId === entry.id;

          return (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(entry.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-100">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{entry.context}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", categoryColor(entry.category))}>
                          {categoryLabel(entry.category)}
                        </Badge>
                        {entry.childInfluenced && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Influenced
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex -space-x-1">
                      {entry.childrenInvolved.map((cId) => (
                        <div key={cId} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-800">
                            {getYPName(cId).charAt(0)}
                          </span>
                        </div>
                      ))}
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
                <CardContent className="pt-0 pb-4 space-y-4">
                  {/* how consulted */}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Users className="h-4 w-4" /> How Were Children Consulted?
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.howConsulted}</p>
                  </div>

                  {/* what child said */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-1 mb-1">
                      <MessageCircle className="h-4 w-4" /> What Children Said
                    </p>
                    <p className="text-sm text-blue-700">{entry.whatChildSaid}</p>
                  </div>

                  {/* decision made */}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" /> Decision Made
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.decisionMade}</p>
                  </div>

                  {/* how did child influence */}
                  {entry.childInfluenced && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="h-4 w-4" /> How Did Children Influence This?
                      </p>
                      <p className="text-sm text-green-700">{entry.influenceDescription}</p>
                    </div>
                  )}

                  {/* feedback given */}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" /> Feedback Given to Children
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.feedbackGiven}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Evidence Type</p>
                      <p className="text-sm font-medium">{evidenceLabel(entry.evidenceType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recorded By</p>
                      <p className="text-sm font-medium">{getStaffName(entry.recordedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Children</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {entry.childrenInvolved.map((cId) => (
                          <Badge key={cId} variant="outline" className="text-xs">{getYPName(cId)}</Badge>
                        ))}
                      </div>
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
          Quality Standard 1 (Child-Centred Care) requires that children are consulted about
          decisions that affect them and that their views are given due weight according to their
          age and understanding (Children Act 1989 s.22). Regulation 7 requires that the child&apos;s
          views, wishes and feelings are ascertained regularly. UNCRC Article 12 establishes the
          right to be heard. Ofsted&apos;s SCCIF specifically examines evidence that children
          genuinely influence life in the home — not just that they are asked, but that their
          views lead to tangible changes. This log provides that evidence.
        </p>
      </div>
    </PageShell>
  );
}
