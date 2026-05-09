"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Gamepad2,
  Headphones,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOnlineGamingRecords } from "@/hooks/use-online-gaming-records";
import type { OnlineGamingRecord, PegiRating } from "@/types/extended";
import { PEGI_RATING_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const pegiColour: Record<string, string> = {
  "3": "bg-green-100 text-green-800",
  "7": "bg-lime-100 text-lime-800",
  "12": "bg-amber-100 text-amber-800",
  "16": "bg-orange-100 text-orange-800",
  "18": "bg-red-100 text-red-800",
};

export default function OnlineGamingTrackerPage() {
  const [search, setSearch] = useState("");
  const [filterAgeAppropriate, setFilterAgeAppropriate] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: res, isLoading } = useOnlineGamingRecords();
  const data: OnlineGamingRecord[] = res?.data ?? [];

  const exportCols: ExportColumn<OnlineGamingRecord>[] = [
    { header: "Young Person", accessor: (r: OnlineGamingRecord) => getYPName(r.child_id) },
    { header: "Review Date", accessor: (r: OnlineGamingRecord) => r.review_date },
    { header: "Console", accessor: (r: OnlineGamingRecord) => r.console },
    { header: "Primary Games", accessor: (r: OnlineGamingRecord) => r.primary_games.map((g) => `${g.title} (PEGI ${g.pegi_rating})`).join("; ") },
    { header: "Weekly Hours", accessor: (r: OnlineGamingRecord) => `${r.weekly_hours}` },
    { header: "Voice Chat", accessor: (r: OnlineGamingRecord) => r.voice_chat_used ? "Yes" : "No" },
    { header: "Friends (in person)", accessor: (r: OnlineGamingRecord) => `${r.online_friends_known_in_person}` },
    { header: "Friends (online only)", accessor: (r: OnlineGamingRecord) => `${r.online_friends_known_only}` },
    { header: "In-game spend (£)", accessor: (r: OnlineGamingRecord) => `£${r.in_game_spend_this_month} / £${r.spend_cap} cap` },
    { header: "Parental controls", accessor: (r: OnlineGamingRecord) => r.parental_controls_active ? "Active" : "Off" },
    { header: "Flags", accessor: (r: OnlineGamingRecord) => r.flags_concerns.join("; ") },
    { header: "Key Worker", accessor: (r: OnlineGamingRecord) => getStaffName(r.key_worker) },
    { header: "Next Review", accessor: (r: OnlineGamingRecord) => r.next_review },
  ];

  const filtered = useMemo(() => {
    let items = [...data];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.console.toLowerCase().includes(q) ||
          r.primary_games.some((g) => g.title.toLowerCase().includes(q))
      );
    }
    if (filterAgeAppropriate === "yes") {
      items = items.filter((r) => r.primary_games.every((g) => g.age_appropriate));
    } else if (filterAgeAppropriate === "no") {
      items = items.filter((r) => r.primary_games.some((g) => !g.age_appropriate));
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return b.review_date.localeCompare(a.review_date);
        case "hours":
          return b.weekly_hours - a.weekly_hours;
        case "flags":
          return b.flags_concerns.length - a.flags_concerns.length;
        case "spend":
          return b.in_game_spend_this_month - a.in_game_spend_this_month;
        default:
          return 0;
      }
    });
    return items;
  }, [data, search, filterAgeAppropriate, sortBy]);

  if (isLoading) return <PageShell title="Online Gaming Tracker" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  const activeGamers = data.length;
  const weeklyHoursTotal = data.reduce((sum, r) => sum + r.weekly_hours, 0);
  const onlineOnlyFriendsTotal = data.reduce((sum, r) => sum + r.online_friends_known_only, 0);
  const flagsTotal = data.reduce((sum, r) => sum + r.flags_concerns.length, 0);

  return (
    <PageShell
      title="Online Gaming Tracker"
      subtitle="Per-child gaming activity — child-led with safeguarding lens. Console, games, online interactions, time, spend, and online safety."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="online-gaming-tracker" />
          <PrintButton title="Online Gaming Tracker" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{activeGamers}</p>
          <p className="text-xs text-muted-foreground">Active Gamers</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{weeklyHoursTotal}</p>
          <p className="text-xs text-muted-foreground">Total Weekly Hours</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{onlineOnlyFriendsTotal}</p>
          <p className="text-xs text-muted-foreground">Online-Only Friends</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", flagsTotal > 0 ? "text-red-600" : "text-green-600")}>{flagsTotal}</p>
          <p className="text-xs text-muted-foreground">Active Flags</p>
        </div>
      </div>

      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 mb-6 flex items-start gap-2">
        <Gamepad2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-800">
          Gaming is a legitimate part of childhood (UNCRC Article 31 — right to play and leisure).
          We track to keep children safe online, not to police their fun. Child-led, safeguarding-aware.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search child, console, or game"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-white text-sm"
          />
        </div>
        <Select value={filterAgeAppropriate} onValueChange={setFilterAgeAppropriate}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Age-appropriate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Age Ratings</SelectItem>
            <SelectItem value="yes">All age-appropriate</SelectItem>
            <SelectItem value="no">Has unsuitable game</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review">By Review Date</SelectItem>
              <SelectItem value="hours">By Weekly Hours</SelectItem>
              <SelectItem value="flags">By Flags</SelectItem>
              <SelectItem value="spend">By Monthly Spend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const overSpend = r.in_game_spend_this_month > r.spend_cap;
          const hasFlags = r.flags_concerns.length > 0;

          return (
            <div key={r.id} className={cn("rounded-xl border bg-white overflow-hidden", hasFlags && "border-red-200")}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Gamepad2 className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reviewed {r.review_date} &middot; Key worker {getStaffName(r.key_worker)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-800">
                    {r.console.split(" ")[0]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-800">
                    {r.weekly_hours} hrs/wk
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1", r.voice_chat_used ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700")}>
                    <Headphones className="h-3 w-3" />
                    {r.voice_chat_used ? "Voice" : "No voice"}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1", r.parental_controls_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                    <ShieldCheck className="h-3 w-3" />
                    {r.parental_controls_active ? "Controls on" : "No controls"}
                  </span>
                  {hasFlags && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {r.flags_concerns.length} flag{r.flags_concerns.length === 1 ? "" : "s"}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Console</p>
                      <p className="font-medium">{r.console}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Weekly Hours</p>
                      <p className="font-medium">{r.weekly_hours}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Friends (in-person)</p>
                      <p className="font-medium">{r.online_friends_known_in_person}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Friends (online-only)</p>
                      <p className="font-medium">{r.online_friends_known_only}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Gamepad2 className="h-3 w-3 inline mr-1" />Primary Games
                    </p>
                    <ul className="space-y-1">
                      {r.primary_games.map((g, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <span className={cn("text-xs px-1.5 py-0.5 rounded font-bold", pegiColour[g.pegi_rating])}>
                            PEGI {g.pegi_rating}
                          </span>
                          <span>{g.title}</span>
                          {!g.age_appropriate && (
                            <span className="text-xs text-red-600 font-medium inline-flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Above age
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child&apos;s Voice</p>
                    <p className="text-sm italic">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  <div className={cn("rounded-lg p-3 border", overSpend ? "bg-red-50 border-red-200" : "bg-white")}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">In-Game Spending (this month)</p>
                    <p className="text-sm">
                      <strong>£{r.in_game_spend_this_month.toFixed(2)}</strong> spent of <strong>£{r.spend_cap.toFixed(2)}</strong> monthly cap
                      {overSpend && (
                        <span className="ml-2 text-red-700 inline-flex items-center gap-1 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Over cap
                        </span>
                      )}
                    </p>
                  </div>

                  {r.protective_factors.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <ShieldCheck className="h-3 w-3 inline mr-1" />Protective Factors
                      </p>
                      <ul className="space-y-1">
                        {r.protective_factors.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.flags_concerns.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {r.flags_concerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-violet-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">Screen-Time Balance</p>
                    <p className="text-sm">{r.screen_time_balance_note}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Reviewed: {r.review_date}</span>
                    <span>Next review: {r.next_review}</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                    <span>Voice chat: {r.voice_chat_used ? "Yes" : "No"}</span>
                    <span>Parental controls: {r.parental_controls_active ? "Active" : "Off"}</span>
                  </div>

                  <SmartLinkPanel sourceType="online_gaming_record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Online gaming oversight aligns with KCSIE 2024 (online safety),
          UK GDPR Age Appropriate Design Code (children&apos;s data online), Quality Standard 9 (Protection of
          Children), Online Safety Act 2023 (illegal and harmful content duties on platforms), and UNCRC
          Articles 17 (access to information), 19 (protection from harm) and 31 (right to play and leisure).
          Linked to Safeguarding, Risk Assessments, Pocket Money, and Child Voice pages.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
