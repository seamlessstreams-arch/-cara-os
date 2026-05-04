"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SANCTIONS & REWARDS
// Records positive reinforcement (rewards, praise, achievements) and
// consequences (sanctions, boundaries) for each young person. Supports
// Reg 11 (Positive Relationships), Reg 12 (Protection), and Quality
// Standards 5 (Positive relationships) evidence.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Plus, Star, ThumbsDown,
  CheckCircle2, AlertTriangle, User, Calendar,
  ChevronDown, ChevronUp, Shield, Award, Heart,
  Smile, Frown, TrendingUp, Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type EntryDirection = "reward" | "sanction";
type RewardType = "verbal_praise" | "written_praise" | "activity_reward" | "token" | "achievement" | "privilege" | "other_reward";
type SanctionType = "loss_of_privilege" | "verbal_reminder" | "time_out" | "earlier_bedtime" | "extra_chore" | "restorative_conversation" | "other_sanction";

interface SanctionRewardEntry {
  id: string;
  child_id: string;
  date: string;
  time: string;
  direction: EntryDirection;
  reward_type: RewardType | null;
  sanction_type: SanctionType | null;
  title: string;
  description: string;
  context: string;
  child_response: string;
  outcome: string;
  proportionate: boolean;
  recorded_by: string;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const REWARD_LABELS: Record<RewardType, string> = {
  verbal_praise: "Verbal Praise", written_praise: "Written Praise", activity_reward: "Activity Reward",
  token: "Token / Points", achievement: "Achievement", privilege: "Privilege", other_reward: "Other",
};

const SANCTION_LABELS: Record<SanctionType, string> = {
  loss_of_privilege: "Loss of Privilege", verbal_reminder: "Verbal Reminder", time_out: "Time Out",
  earlier_bedtime: "Earlier Bedtime", extra_chore: "Extra Chore", restorative_conversation: "Restorative Conversation",
  other_sanction: "Other",
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: SanctionRewardEntry[] = [
  {
    id: "sr_001", child_id: "yp_jordan", date: d(-1), time: "16:30",
    direction: "reward", reward_type: "achievement", sanction_type: null,
    title: "PE Student of the Week",
    description: "Jordan received Student of the Week award for PE. Displayed excellent teamwork and leadership during inter-house football.",
    context: "Jordan has been attending PE regularly and engaging more positively with peers.",
    child_response: "Jordan was visibly proud. Brought certificate home and asked to display it in the lounge.",
    outcome: "Certificate displayed. Achievement shared at house meeting. Positive feedback sent to social worker.",
    proportionate: true, recorded_by: "staff_anna", created_at: d(-1) + "T16:30:00Z",
  },
  {
    id: "sr_002", child_id: "yp_casey", date: d(-1), time: "19:00",
    direction: "reward", reward_type: "verbal_praise", sanction_type: null,
    title: "Helped new young person settle in",
    description: "Casey voluntarily spent time with a visiting young person, showing them around the house and making them feel welcome.",
    context: "A young person was visiting for an assessment day. Casey remembered their own experience and wanted to help.",
    child_response: "Casey smiled and said 'I know what it feels like to be new.' Appeared proud of being helpful.",
    outcome: "Verbal praise from staff. Casey's kindness noted in daily log. Discussed at handover as positive behaviour.",
    proportionate: true, recorded_by: "staff_chervelle", created_at: d(-1) + "T19:00:00Z",
  },
  {
    id: "sr_003", child_id: "yp_alex", date: d(-2), time: "20:15",
    direction: "sanction", reward_type: null, sanction_type: "loss_of_privilege",
    title: "Xbox time reduced — language towards staff",
    description: "Alex used aggressive and offensive language towards a staff member during a disagreement about screen time limits. Despite de-escalation attempts, Alex continued for several minutes.",
    context: "Alex had been asked to come off the Xbox as it was approaching bedtime routine. Initial refusal escalated to verbal aggression.",
    child_response: "Alex was initially angry but calmed down after 15 minutes. Accepted the consequence and said 'I know I shouldn't have said that.'",
    outcome: "Xbox time reduced by 30 minutes for the following day. Restorative conversation completed the next morning. Alex apologised to the staff member.",
    proportionate: true, recorded_by: "staff_edward", created_at: d(-2) + "T20:15:00Z",
  },
  {
    id: "sr_004", child_id: "yp_jordan", date: d(-3), time: "17:00",
    direction: "reward", reward_type: "activity_reward", sanction_type: null,
    title: "Extra community time — consistent good behaviour",
    description: "Jordan earned an additional hour of community time at the weekend due to a week of consistent positive behaviour, completing homework, and helping with communal chores.",
    context: "Jordan has been working towards earning additional privileges as part of their individual behaviour plan.",
    child_response: "Jordan was excited and immediately started planning what to do with the extra time. Asked to go to the park with a friend.",
    outcome: "Extra hour approved for Saturday afternoon. Jordan plans to visit the local park. Staff to escort.",
    proportionate: true, recorded_by: "staff_anna", created_at: d(-3) + "T17:00:00Z",
  },
  {
    id: "sr_005", child_id: "yp_casey", date: d(-4), time: "21:00",
    direction: "sanction", reward_type: null, sanction_type: "earlier_bedtime",
    title: "Earlier bedtime — refused to complete evening routine",
    description: "Casey refused to complete evening routine tasks (shower, teeth, prepare uniform) despite multiple reminders over 45 minutes.",
    context: "Casey had a difficult day at school and was tired and irritable by evening. Staff acknowledged this but explained the routine still needed to happen.",
    child_response: "Casey initially protested the earlier bedtime but accepted it after a calm conversation about choices and consequences.",
    outcome: "Bedtime brought forward by 20 minutes. Casey completed partial routine. Staff made hot chocolate as comfort. Discussed approach for tomorrow.",
    proportionate: true, recorded_by: "staff_diane", created_at: d(-4) + "T21:00:00Z",
  },
  {
    id: "sr_006", child_id: "yp_alex", date: d(-5), time: "15:30",
    direction: "reward", reward_type: "written_praise", sanction_type: null,
    title: "Excellent creative writing piece",
    description: "Alex produced an outstanding creative writing piece in English class. Teacher sent home a written note praising Alex's imagination and emotional depth in the story.",
    context: "Alex has been struggling with engagement at school, so this was a significant achievement.",
    child_response: "Alex seemed surprised but pleased. Read the teacher's note twice and kept it in their room.",
    outcome: "Teacher's note filed in education records. Positive feedback shared with social worker. Alex encouraged to enter a local writing competition.",
    proportionate: true, recorded_by: "staff_edward", created_at: d(-5) + "T15:30:00Z",
  },
  {
    id: "sr_007", child_id: "yp_alex", date: d(-6), time: "18:00",
    direction: "sanction", reward_type: null, sanction_type: "restorative_conversation",
    title: "Restorative conversation — damage to communal area",
    description: "Alex threw a cushion across the lounge which knocked over a lamp. The lamp shade was dented but not broken. Alex was upset about a phone call with family.",
    context: "Alex had just finished a difficult phone call with a family member and was visibly upset. Staff were already monitoring.",
    child_response: "Alex initially refused to engage but after 30 minutes accepted a restorative conversation. Acknowledged that throwing things wasn't okay even when upset.",
    outcome: "Alex helped staff straighten the lamp shade. Agreed to use the calm room when feeling overwhelmed instead of the communal area. No further consequence — emotional context considered.",
    proportionate: true, recorded_by: "staff_ryan", created_at: d(-6) + "T18:00:00Z",
  },
  {
    id: "sr_008", child_id: "yp_jordan", date: d(-7), time: "08:30",
    direction: "reward", reward_type: "token", sanction_type: null,
    title: "Morning routine completed independently",
    description: "Jordan completed the full morning routine (wash, dress, breakfast, uniform, bag ready) without any prompting for the third consecutive day.",
    context: "Independence in morning routine has been a key target on Jordan's placement plan. Previously required multiple prompts.",
    child_response: "Jordan was pleased to have the points added to their chart. Said 'I didn't even need reminding!'",
    outcome: "3 tokens added to reward chart. Jordan approaching the 20-token goal for a chosen activity. Progress noted in placement plan review.",
    proportionate: true, recorded_by: "staff_anna", created_at: d(-7) + "T08:30:00Z",
  },
  {
    id: "sr_009", child_id: "yp_casey", date: d(0), time: "12:00",
    direction: "reward", reward_type: "privilege", sanction_type: null,
    title: "Cooking choice for dinner — week of positive engagement",
    description: "Casey earned the privilege of choosing Friday night dinner and helping to cook it. Had a positive week across school and home.",
    context: "Casey has shown consistent improvement in engagement and communication over the past week.",
    child_response: "Casey chose to make pasta carbonara. Very enthusiastic about the cooking session.",
    outcome: "Cooking session planned for Friday evening with key worker. Ingredients to be bought on Thursday shopping trip.",
    proportionate: true, recorded_by: "staff_chervelle", created_at: d(0) + "T12:00:00Z",
  },
  {
    id: "sr_010", child_id: "yp_alex", date: d(0), time: "10:00",
    direction: "reward", reward_type: "verbal_praise", sanction_type: null,
    title: "Apologised independently to staff member",
    description: "Alex approached a staff member independently to apologise for yesterday's verbal aggression. Apologised sincerely and asked if they could 'start fresh today.'",
    context: "Follow-up from the sanction recorded on the previous day (SR-003). Staff did not prompt the apology.",
    child_response: "Alex appeared relieved after apologising. Staff noted improved mood and positive engagement for the rest of the morning.",
    outcome: "Verbal praise given. Apology acknowledged. Alex's emotional growth noted in key worker session. Positive reinforcement of repair skills.",
    proportionate: true, recorded_by: "staff_edward", created_at: d(0) + "T10:00:00Z",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SanctionsRewardsPage() {
  const { currentUser } = useAuthContext();

  const [entries, setEntries] = useState<SanctionRewardEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [dirFilter, setDirFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "rewards" | "sanctions">("all");

  // new form
  const [nChild, setNChild] = useState("");
  const [nDir, setNDir] = useState<EntryDirection | "">("");
  const [nRewardType, setNRewardType] = useState<RewardType | "">("");
  const [nSanctionType, setNSanctionType] = useState<SanctionType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nContext, setNContext] = useState("");
  const [nChildResp, setNChildResp] = useState("");
  const [nOutcome, setNOutcome] = useState("");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "rewards") list = list.filter(e => e.direction === "reward");
    if (tab === "sanctions") list = list.filter(e => e.direction === "sanction");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (dirFilter !== "all") list = list.filter(e => e.direction === dirFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, dirFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const rewards = entries.filter(e => e.direction === "reward");
    const sanctions = entries.filter(e => e.direction === "sanction");
    return {
      total: entries.length,
      rewards: rewards.length,
      sanctions: sanctions.length,
      ratio: sanctions.length > 0 ? (rewards.length / sanctions.length).toFixed(1) : "∞",
      thisWeek: entries.filter(e => {
        const diff = (Date.now() - new Date(e.date).getTime()) / 86400000;
        return diff >= 0 && diff <= 7;
      }).length,
    };
  }, [entries]);

  /* ── per-child ratios ───────────────────────────────────────────────────── */
  const childRatios = useMemo(() => {
    const map = new Map<string, { rewards: number; sanctions: number }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { rewards: 0, sanctions: 0 };
      if (e.direction === "reward") cur.rewards++;
      else cur.sanctions++;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<SanctionRewardEntry>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Date", accessor: r => r.date },
    { header: "Time", accessor: r => r.time },
    { header: "Direction", accessor: r => r.direction === "reward" ? "Reward" : "Sanction" },
    { header: "Type", accessor: r => r.reward_type ? REWARD_LABELS[r.reward_type] : r.sanction_type ? SANCTION_LABELS[r.sanction_type] : "" },
    { header: "Title", accessor: r => r.title },
    { header: "Description", accessor: r => r.description },
    { header: "Context", accessor: r => r.context },
    { header: "Child Response", accessor: r => r.child_response },
    { header: "Outcome", accessor: r => r.outcome },
    { header: "Proportionate", accessor: r => r.proportionate ? "Yes" : "No" },
    { header: "Recorded By", accessor: r => getStaffName(r.recorded_by) },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nDir || !nTitle || !nDesc) return;
    const entry: SanctionRewardEntry = {
      id: `sr_${Date.now()}`,
      child_id: nChild,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      direction: nDir as EntryDirection,
      reward_type: nDir === "reward" && nRewardType ? (nRewardType as RewardType) : null,
      sanction_type: nDir === "sanction" && nSanctionType ? (nSanctionType as SanctionType) : null,
      title: nTitle,
      description: nDesc,
      context: nContext,
      child_response: nChildResp,
      outcome: nOutcome,
      proportionate: true,
      recorded_by: currentUser?.id || "staff_darren",
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    setShowNew(false);
    setNChild(""); setNDir(""); setNRewardType(""); setNSanctionType("");
    setNTitle(""); setNDesc(""); setNContext(""); setNChildResp(""); setNOutcome("");
  };

  return (
    <PageShell
      title="Sanctions & Rewards"
      subtitle="Positive reinforcement and proportionate consequences"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Sanctions & Rewards" subtitle="Oak House — Behaviour Management" />
          <ExportButton data={filtered} columns={exportCols} filename="sanctions-rewards" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Entries", value: stats.total, icon: Award, c: "text-blue-600" },
          { label: "Rewards",       value: stats.rewards, icon: Star, c: "text-green-600" },
          { label: "Sanctions",     value: stats.sanctions, icon: ThumbsDown, c: "text-amber-600" },
          { label: "Reward Ratio",  value: `${stats.ratio}:1`, icon: TrendingUp, c: "text-purple-600" },
          { label: "This Week",     value: stats.thisWeek, icon: Calendar, c: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Ratio guidance ───────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3 mb-6 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Best practice: aim for at least a <strong>4:1 ratio</strong> of rewards to sanctions. Current ratio: <strong>{stats.ratio}:1</strong>
        </p>
      </div>

      {/* ── Per-child ratio cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const r = childRatios.get(cid)!;
          const ratio = r.sanctions > 0 ? (r.rewards / r.sanctions).toFixed(1) : "∞";
          const good = r.sanctions === 0 || r.rewards / r.sanctions >= 4;
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{getYPName(cid)}</p>
                <Badge variant="outline" className={cn("text-xs", good ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                  {ratio}:1 ratio
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Smile className="h-3 w-3 text-green-600" />{r.rewards} rewards</span>
                <span className="flex items-center gap-1"><Frown className="h-3 w-3 text-amber-600" />{r.sanctions} sanctions</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All", count: entries.length },
          { key: "rewards", label: "Rewards", count: stats.rewards },
          { key: "sanctions", label: "Sanctions", count: stats.sanctions },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label} <span className="text-xs ml-1 text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
        {(search || childFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Entry Cards ───────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="sanctions-rewards-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No entries found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const isReward = entry.direction === "reward";
          const typeLabel = isReward && entry.reward_type ? REWARD_LABELS[entry.reward_type]
            : !isReward && entry.sanction_type ? SANCTION_LABELS[entry.sanction_type] : "";

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-card overflow-hidden",
              isReward ? "border-l-4 border-l-green-400" : "border-l-4 border-l-amber-400"
            )}>
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0",
                  isReward ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isReward ? <Star className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.title}</span>
                    <Badge variant="outline" className={cn("text-xs",
                      isReward ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {isReward ? "Reward" : "Sanction"}
                    </Badge>
                    {typeLabel && <Badge variant="outline" className="text-xs">{typeLabel}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(entry.child_id)} · {formatDate(entry.date)} at {entry.time} · {getStaffName(entry.recorded_by)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-sm">{entry.description}</p>
                  </div>
                  {entry.context && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Context</p>
                      <p className="text-sm">{entry.context}</p>
                    </div>
                  )}
                  {entry.child_response && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Child&apos;s Response</p>
                      <p className="text-sm italic">{entry.child_response}</p>
                    </div>
                  )}
                  {entry.outcome && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outcome</p>
                      <p className="text-sm">{entry.outcome}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.recorded_by)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(entry.date)}</span>
                    {!isReward && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3.5 w-3.5", entry.proportionate ? "text-green-600" : "text-red-600")} />
                        {entry.proportionate ? "Proportionate" : "Review needed"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 11 (Positive Relationships)</strong> requires staff to use positive relationships to
              encourage desirable behaviour. <strong>Regulation 12</strong> states that measures of control must be
              proportionate, necessary, and in the best interests of the child. <strong>Quality Standard 5</strong>
              expects a culture where positive behaviour is recognised and rewarded more frequently than sanctions are imposed.
              A minimum 4:1 reward-to-sanction ratio is considered best practice.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Sanction or Reward</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type *</label>
              <Select value={nDir} onValueChange={v => { setNDir(v as EntryDirection); setNRewardType(""); setNSanctionType(""); }}>
                <SelectTrigger><SelectValue placeholder="Reward or Sanction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reward">Reward</SelectItem>
                  <SelectItem value="sanction">Sanction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {nDir === "reward" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Reward Type</label>
                <Select value={nRewardType} onValueChange={v => setNRewardType(v as RewardType)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REWARD_LABELS) as [RewardType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {nDir === "sanction" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Sanction Type</label>
                <Select value={nSanctionType} onValueChange={v => setNSanctionType(v as SanctionType)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(SANCTION_LABELS) as [SanctionType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="Brief title" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea placeholder="What happened..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Context</label>
              <Textarea placeholder="What led to this..." value={nContext} onChange={e => setNContext(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Child&apos;s Response</label>
              <Textarea placeholder="How did the child react..." value={nChildResp} onChange={e => setNChildResp(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Outcome</label>
              <Textarea placeholder="Result and next steps..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nDir || !nTitle || !nDesc}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
