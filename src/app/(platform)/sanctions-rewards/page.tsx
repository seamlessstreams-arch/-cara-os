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
import { useSanctionRewards, useCreateSanctionReward } from "@/hooks/use-sanction-rewards";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Plus, Star, ThumbsDown,
  CheckCircle2, AlertTriangle, User, Calendar,
  ChevronDown, ChevronUp, Shield, Award, Heart,
  Smile, Frown, TrendingUp, Sparkles, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { SanctionRewardEntry, SRDirection, SRRewardType, SRSanctionType } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";



// ── Config ────────────────────────────────────────────────────────────────────

const REWARD_LABELS: Record<SRRewardType, string> = {
  verbal_praise: "Verbal Praise", written_praise: "Written Praise", activity_reward: "Activity Reward",
  token: "Token / Points", achievement: "Achievement", privilege: "Privilege", other_reward: "Other",
};

const SANCTION_LABELS: Record<SRSanctionType, string> = {
  loss_of_privilege: "Loss of Privilege", verbal_reminder: "Verbal Reminder", time_out: "Time Out",
  earlier_bedtime: "Earlier Bedtime", extra_chore: "Extra Chore", restorative_conversation: "Restorative Conversation",
  other_sanction: "Other",
};


// ── Component ─────────────────────────────────────────────────────────────────

export default function SanctionsRewardsPage() {
  const { currentUser } = useAuthContext();
  const { data: srData, isLoading } = useSanctionRewards();
  const createSR = useCreateSanctionReward();
  const entries = srData?.data ?? [];
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [dirFilter, setDirFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "rewards" | "sanctions">("all");

  // new form
  const [nChild, setNChild] = useState("");
  const [nDir, setNDir] = useState<SRDirection | "">("");
  const [nRewardType, setNRewardType] = useState<SRRewardType | "">("");
  const [nSanctionType, setNSanctionType] = useState<SRSanctionType | "">("");
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
    createSR.mutate({
      child_id: nChild,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      direction: nDir as SRDirection,
      reward_type: nDir === "reward" && nRewardType ? (nRewardType as SRRewardType) : null,
      sanction_type: nDir === "sanction" && nSanctionType ? (nSanctionType as SRSanctionType) : null,
      title: nTitle,
      description: nDesc,
      context: nContext,
      child_response: nChildResp,
      outcome: nOutcome,
      proportionate: true,
      recorded_by: currentUser?.id || "staff_darren",
      created_at: new Date().toISOString(),
    } as Partial<SanctionRewardEntry>, {
      onSuccess: () => {
        toast.success("Entry saved");
        setShowNew(false);
        setNChild(""); setNDir(""); setNRewardType(""); setNSanctionType("");
        setNTitle(""); setNDesc(""); setNContext(""); setNChildResp(""); setNOutcome("");
      },
      onError: () => toast.error("Failed to save entry"),
    });
  };

  return (
    <PageShell
      title="Sanctions & Rewards"
      subtitle="Positive reinforcement and proportionate consequences"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
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
                aria-expanded={isOpen}
                aria-label={`Expand ${entry.direction} details: ${entry.title} for ${getYPName(entry.child_id)}`}
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
                  <SmartLinkPanel sourceType="sanction" sourceId={entry.id} childId={entry.child_id} compact />
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

      </>
      )}

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Sanction or Reward</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="sr-child" className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger id="sr-child"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="sr-direction" className="text-sm font-medium mb-1 block">Type *</label>
              <Select value={nDir} onValueChange={v => { setNDir(v as SRDirection); setNRewardType(""); setNSanctionType(""); }}>
                <SelectTrigger id="sr-direction"><SelectValue placeholder="Reward or Sanction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reward">Reward</SelectItem>
                  <SelectItem value="sanction">Sanction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {nDir === "reward" && (
              <div>
                <label htmlFor="sr-reward-type" className="text-sm font-medium mb-1 block">Reward Type</label>
                <Select value={nRewardType} onValueChange={v => setNRewardType(v as SRRewardType)}>
                  <SelectTrigger id="sr-reward-type"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REWARD_LABELS) as [SRRewardType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {nDir === "sanction" && (
              <div>
                <label htmlFor="sr-sanction-type" className="text-sm font-medium mb-1 block">Sanction Type</label>
                <Select value={nSanctionType} onValueChange={v => setNSanctionType(v as SRSanctionType)}>
                  <SelectTrigger id="sr-sanction-type"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(SANCTION_LABELS) as [SRSanctionType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label htmlFor="sr-title" className="text-sm font-medium mb-1 block">Title *</label>
              <Input id="sr-title" placeholder="Brief title" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="sr-desc" className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea id="sr-desc" placeholder="What happened..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label htmlFor="sr-context" className="text-sm font-medium mb-1 block">Context</label>
              <Textarea id="sr-context" placeholder="What led to this..." value={nContext} onChange={e => setNContext(e.target.value)} rows={2} />
            </div>
            <div>
              <label htmlFor="sr-child-response" className="text-sm font-medium mb-1 block">Child&apos;s Response</label>
              <Textarea id="sr-child-response" placeholder="How did the child react..." value={nChildResp} onChange={e => setNChildResp(e.target.value)} rows={2} />
            </div>
            <div>
              <label htmlFor="sr-outcome" className="text-sm font-medium mb-1 block">Outcome</label>
              <Textarea id="sr-outcome" placeholder="Result and next steps..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nDir || !nTitle || !nDesc || createSR.isPending}>{createSR.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Entry"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        category="behaviour"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
