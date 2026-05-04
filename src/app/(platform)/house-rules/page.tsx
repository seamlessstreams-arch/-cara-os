"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  BookOpen,
  Users,
  Shield,
  Clock,
  Home,
  Heart,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface HouseRule {
  id: string;
  category: "boundaries" | "routines" | "respect" | "safety" | "community" | "technology" | "visitors";
  title: string;
  description: string;
  rationale: string;
  agreedDate: string;
  reviewDate: string;
  status: "active" | "under_review" | "amended";
  childFriendlyVersion: string;
  youngPeopleConsulted: string[];
  amendments: { date: string; change: string; reason: string }[];
  consequences: string;
  linkedToRight: string;
}

/* ─── seed data ─── */
const rules: HouseRule[] = [
  {
    id: "hr_001",
    category: "routines",
    title: "Bedtime & Morning Routines",
    description: "School nights: in rooms by 9pm (under 14) or 9:30pm (14+). Lights out by 10pm/10:30pm. Weekends: 30 minutes later. Wake-up at 7am school days.",
    rationale: "Consistent sleep supports emotional regulation, physical health and educational attainment. Sleep assessments inform individual variations.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "We have set bedtimes because good sleep helps you feel better, learn more, and manage big feelings. Weekends are a bit more relaxed.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [
      { date: d(-60), change: "Weekend extension from 15min to 30min later", reason: "Young people requested and demonstrated responsible use of later times." },
    ],
    consequences: "Supportive reminder first. If repeated difficulty, 1:1 discussion about barriers to sleep. Never punitive — always explore why.",
    linkedToRight: "UNCRC Article 31 — Right to rest and leisure",
  },
  {
    id: "hr_002",
    category: "respect",
    title: "Respect for Each Other & Staff",
    description: "We speak kindly and respectfully. No name-calling, bullying, or intimidation. We listen when others are talking. We respect personal space and belongings.",
    rationale: "Everyone deserves to feel safe and valued. Respectful communication builds trust and helps the home feel like a family.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "We treat each other the way we'd like to be treated. If you're upset, staff will help you find words — shouting or name-calling hurts everyone.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [],
    consequences: "Restorative conversation. If persistent, explore underlying causes. Consider mediation between young people. Record on behaviour log if significant.",
    linkedToRight: "UNCRC Article 19 — Right to be safe from harm",
  },
  {
    id: "hr_003",
    category: "safety",
    title: "No Violence or Threatening Behaviour",
    description: "Physical aggression, threats of violence, or damage to property is not acceptable. Staff will always try to de-escalate and understand what's driving the behaviour.",
    rationale: "Everyone must feel physically safe. Violence is often communication of unmet need — we address the need, not just the behaviour.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "Hitting, kicking, or breaking things isn't OK — but we know sometimes you feel overwhelmed. Staff are here to help you find safer ways to express big feelings.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [],
    consequences: "Immediate de-escalation. TCI approach if needed. Post-incident debrief. Restorative justice where appropriate. Serious incidents reported to placing authority.",
    linkedToRight: "UNCRC Article 19 — Right to be safe from harm",
  },
  {
    id: "hr_004",
    category: "technology",
    title: "Phone & Internet Use",
    description: "Wi-Fi available until bedtime. No phones at mealtimes or during family time (7-8pm). Age-appropriate content filters in place. Staff may check devices with consent if safeguarding concern arises.",
    rationale: "Technology is important for social connection and learning. Boundaries protect from online risks while respecting privacy and independence.",
    agreedDate: d(-150),
    reviewDate: d(30),
    status: "amended",
    childFriendlyVersion: "Your phone is yours but we ask you to put it away at meals and during family time so we can connect face-to-face. Wi-Fi goes off at bedtime to help you sleep.",
    youngPeopleConsulted: ["yp_alex", "yp_casey"],
    amendments: [
      { date: d(-90), change: "Added 'family time' phone-free window", reason: "House meeting agreement — young people felt phones distracted from group activities." },
      { date: d(-30), change: "Extended Wi-Fi cut-off by 30min on weekends", reason: "Consistent with bedtime extension. Casey requested for gaming sessions." },
    ],
    consequences: "Reminder first. If phone misuse affects sleep or safety, individual plan created. Never confiscation without discussion and clear return time.",
    linkedToRight: "UNCRC Article 16 — Right to privacy; Article 17 — Right to information",
  },
  {
    id: "hr_005",
    category: "community",
    title: "Shared Spaces & Tidying Up",
    description: "Communal areas kept tidy after use. Kitchen cleaned after snacks. Bedrooms tidied daily (staff support available). Laundry day is Tuesday & Friday.",
    rationale: "A clean, organised home helps everyone feel calm and respected. Learning to maintain your space builds independence skills.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "We all share this home so we all help look after it. If you make a mess, clean it up — staff will help if you need it. Your room is your space but we ask you to keep it reasonably tidy.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [
      { date: d(-45), change: "Changed laundry from Mon/Thu to Tue/Fri", reason: "Jordan had after-school activity on Mondays making it difficult." },
    ],
    consequences: "Supportive prompts and help offered. Chore rota ensures fairness. If neglected, 1:1 chat about barriers. Never forced — explore reluctance therapeutically.",
    linkedToRight: "UNCRC Article 27 — Right to a good standard of living",
  },
  {
    id: "hr_006",
    category: "visitors",
    title: "Visitors to the Home",
    description: "Friends can visit with 24h notice and staff agreement. Visits in communal areas. All visitors sign in. Overnight stays considered on individual basis with placing authority agreement.",
    rationale: "Socialisation and friendships are vital. Visitor protocols keep everyone safe while supporting healthy relationships.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "Your friends are welcome here! Just let staff know the day before so we can make sure it works for everyone. Friends hang out in the lounge or garden, not bedrooms.",
    youngPeopleConsulted: ["yp_alex", "yp_casey"],
    amendments: [],
    consequences: "Unannounced visitors politely asked to arrange for another time. If visitor causes concern, risk-assessed before future visits.",
    linkedToRight: "UNCRC Article 15 — Right to meet with friends and join groups",
  },
  {
    id: "hr_007",
    category: "boundaries",
    title: "Leaving the Home & Whereabouts",
    description: "Tell staff where you're going, who with, and expected return time. Under 14s must have staff agreement. Over 14s have graduated freedoms based on risk assessment. Always take your phone.",
    rationale: "We need to know you're safe — not to control you. Freedoms increase as trust builds. This mirrors parental responsibility.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "Let staff know where you're going and when you'll be back — just like any family. The more trust you build, the more freedom you get. Always take your phone so we can check you're OK.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [],
    consequences: "Late return: welfare check call. If uncontactable, missing from care protocol after agreed timeframe. Graduated freedoms may be reviewed if persistent.",
    linkedToRight: "UNCRC Article 3 — Best interests; Article 5 — Parental guidance appropriate to evolving capacities",
  },
  {
    id: "hr_008",
    category: "boundaries",
    title: "Substances — Alcohol, Drugs & Smoking",
    description: "No alcohol or illegal drugs in the home. Smoking/vaping not permitted inside. Designated outdoor area for over-16s who smoke. Staff will always offer harm reduction support.",
    rationale: "Substance use harms developing brains and bodies. We don't judge but we do protect. Harm reduction is our approach — not punishment.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "under_review",
    childFriendlyVersion: "Drugs and alcohol aren't allowed here because they can seriously harm you. If you're struggling with substances, we'll help without judging. Smoking is outside only.",
    youngPeopleConsulted: ["yp_casey"],
    amendments: [
      { date: d(-10), change: "Under review: considering vaping policy update", reason: "Increasing vape use — consulting with young people and health professionals about proportionate response." },
    ],
    consequences: "Confiscation of substances (safety). 1:1 discussion. Referral to substance misuse support if needed. Never exclusion — always support.",
    linkedToRight: "UNCRC Article 33 — Right to protection from harmful drugs",
  },
  {
    id: "hr_009",
    category: "routines",
    title: "Mealtimes & Food",
    description: "Breakfast 7:30-8am. Dinner together at 5:30pm. Snacks available in kitchen. Dietary needs/preferences always accommodated. Young people help plan weekly menu.",
    rationale: "Eating together builds family bonds. Regular meals support physical and emotional health. Choice and involvement develop independence.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "We eat dinner together because it's nice to share that time. You help choose what we eat each week. Snacks are always available — you never need to go hungry here.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [],
    consequences: "No consequences for missing meals — food is always available. If eating patterns concern, gentle exploration with key worker. Referral to CAMHS if disordered eating suspected.",
    linkedToRight: "UNCRC Article 24 — Right to good food and clean water",
  },
  {
    id: "hr_010",
    category: "respect",
    title: "Privacy & Personal Space",
    description: "Staff knock before entering bedrooms. Personal possessions respected. Diaries/journals are private. Staff only search rooms with RM authorisation and young person informed.",
    rationale: "Privacy is a fundamental right. Your bedroom is your safe space. We only ever override privacy for genuine safety concerns — never casually.",
    agreedDate: d(-180),
    reviewDate: d(30),
    status: "active",
    childFriendlyVersion: "Your room is YOUR space. Staff will always knock. Your private things (like diaries) will never be read. We only ever look in your room if we're really worried about your safety — and we'll always tell you.",
    youngPeopleConsulted: ["yp_alex", "yp_jordan", "yp_casey"],
    amendments: [],
    consequences: "N/A — this rule protects young people from staff overreach. Staff breach of privacy is a disciplinary matter.",
    linkedToRight: "UNCRC Article 16 — Right to privacy",
  },
];

/* ─── category meta ─── */
const categoryConfig: Record<string, { label: string; color: string; icon: typeof BookOpen }> = {
  boundaries: { label: "Boundaries", color: "bg-blue-100 text-blue-800", icon: Shield },
  routines: { label: "Routines", color: "bg-purple-100 text-purple-800", icon: Clock },
  respect: { label: "Respect", color: "bg-pink-100 text-pink-800", icon: Heart },
  safety: { label: "Safety", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  community: { label: "Community", color: "bg-green-100 text-green-800", icon: Home },
  technology: { label: "Technology", color: "bg-indigo-100 text-indigo-800", icon: BookOpen },
  visitors: { label: "Visitors", color: "bg-amber-100 text-amber-800", icon: Users },
};

/* ─── export columns ─── */
const exportCols: ExportColumn<HouseRule>[] = [
  { header: "Rule", accessor: (r: HouseRule) => r.title },
  { header: "Category", accessor: (r: HouseRule) => categoryConfig[r.category]?.label ?? r.category },
  { header: "Status", accessor: (r: HouseRule) => r.status.replace("_", " ") },
  { header: "Agreed", accessor: (r: HouseRule) => r.agreedDate },
  { header: "Review Due", accessor: (r: HouseRule) => r.reviewDate },
  { header: "Description", accessor: (r: HouseRule) => r.description },
  { header: "Child-Friendly Version", accessor: (r: HouseRule) => r.childFriendlyVersion },
  { header: "Rationale", accessor: (r: HouseRule) => r.rationale },
  { header: "Linked Right", accessor: (r: HouseRule) => r.linkedToRight },
  { header: "Amendments", accessor: (r: HouseRule) => r.amendments.length.toString() },
];

/* ─── component ─── */
export default function HouseRulesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("category");

  /* ─── computed ─── */
  const filtered = useMemo(() => {
    let list = [...rules];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "category":
          return a.category.localeCompare(b.category);
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return list;
  }, [filterCategory, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const active = rules.filter((r) => r.status === "active").length;
    const underReview = rules.filter((r) => r.status === "under_review").length;
    const amended = rules.filter((r) => r.status === "amended").length;
    const totalAmendments = rules.reduce((sum, r) => sum + r.amendments.length, 0);
    return { active, underReview, amended, totalAmendments };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  /* ─── status badge ─── */
  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "under_review":
        return <Badge className="bg-amber-100 text-amber-800">Under Review</Badge>;
      case "amended":
        return <Badge className="bg-blue-100 text-blue-800">Amended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageShell
      title="House Rules & Boundaries"
      subtitle="Co-produced expectations — agreed with young people, linked to rights, regularly reviewed"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={rules} columns={exportCols} filename="house-rules" />
          <PrintButton title="House Rules & Boundaries" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.underReview}</p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.amended}</p>
            <p className="text-xs text-muted-foreground">Recently Amended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.totalAmendments}</p>
            <p className="text-xs text-muted-foreground">Total Amendments</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── co-production note ─── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Co-Produced with Young People</p>
            <p className="text-xs text-emerald-700 mt-1">
              All house rules are discussed and agreed at house meetings. Young people can request
              amendments at any time. Rules are reviewed monthly and linked to UNCRC rights to
              ensure they are proportionate and child-centred.
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
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under Review</option>
          <option value="amended">Amended</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="category">Category</option>
            <option value="review">Review Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* ─── rule cards ─── */}
      <div className="space-y-3">
        {filtered.map((rule) => {
          const expanded = expandedId === rule.id;
          const cfg = categoryConfig[rule.category];
          const Icon = cfg?.icon ?? BookOpen;

          return (
            <Card key={rule.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(rule.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-md", cfg?.color?.split(" ")[0] ?? "bg-gray-100")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rule.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-xs", cfg?.color)}>
                          {cfg?.label}
                        </Badge>
                        {statusBadge(rule.status)}
                        {rule.amendments.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {rule.amendments.length} amendment{rule.amendments.length > 1 ? "s" : ""}
                          </span>
                        )}
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
                <CardContent className="pt-0 pb-4 space-y-4">
                  {/* description */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">The Rule</p>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>

                  {/* child-friendly version */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">Child-Friendly Version</p>
                    <p className="text-sm text-blue-700">{rule.childFriendlyVersion}</p>
                  </div>

                  {/* rationale */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Why We Have This Rule</p>
                    <p className="text-sm text-muted-foreground">{rule.rationale}</p>
                  </div>

                  {/* consequences */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">What Happens If Broken</p>
                    <p className="text-sm text-muted-foreground">{rule.consequences}</p>
                  </div>

                  {/* linked right */}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">{rule.linkedToRight}</span>
                  </div>

                  {/* consulted */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Young People Consulted</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.youngPeopleConsulted.map((ypId) => (
                        <Badge key={ypId} variant="outline" className="text-xs">
                          {getYPName(ypId)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* amendments */}
                  {rule.amendments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Amendment History</p>
                      <div className="space-y-2">
                        {rule.amendments.map((am, idx) => (
                          <div key={idx} className="border rounded-md p-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{am.change}</span>
                              <span className="text-xs text-muted-foreground">{am.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Reason: {am.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* dates */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Agreed</p>
                      <p className="text-sm font-medium">{rule.agreedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Review</p>
                      <p className="text-sm font-medium">{rule.reviewDate}</p>
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
          Regulation 19 of the Children&apos;s Homes Regulations 2015 requires that children are
          aware of and understand the home&apos;s rules. Rules must be proportionate, clearly
          communicated, and take account of children&apos;s views. The Quality Standards (Standard 3)
          emphasise that boundaries should be applied consistently, fairly, and with reference to the
          child&apos;s care plan. House rules are co-produced at house meetings, reviewed monthly,
          presented in child-friendly language, and linked to UNCRC rights to demonstrate
          proportionality.
        </p>
      </div>
    </PageShell>
  );
}
