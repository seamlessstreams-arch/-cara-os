"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Clock, MessageCircle, ChevronUp, ChevronDown, ArrowUpDown, Search, Heart, CheckCircle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, todayStr } from "@/lib/utils";
// The record shape lives in @/types/extended, beside the projection that reads
// it out of cs_key_work_sessions. It used to be duplicated here, which is why
// this page kept compiling while the fields underneath it changed meaning.
export type KeyworkSession = KeyworkerSessionRecord;

type ListResponse = { data: KeyworkSession[]; meta: { total: number; this_month: number } };
type SingleResponse = { data: KeyworkSession };
import { WritingAssistantInline } from "@/components/writing-assistant/writing-assistant-inline";
import { InlinePracticeReasoning } from "@/components/cara-reasoning/inline-practice-reasoning";
import { type KeyworkerSessionFormat, type KeyworkerSessionRecord, KEYWORKER_SESSION_FORMAT_LABEL } from "@/types/extended";
import { useAuthContext } from "@/contexts/auth-context";
import { childDisplayName } from "@/lib/people/child-display-name";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const FORMAT_CLR: Record<string, string> = {
  one_to_one_at_home: "bg-rose-100 text-rose-800",
  one_to_one_walk: "bg-emerald-100 text-emerald-800",
  one_to_one_cafe: "bg-amber-100 text-amber-800",
  one_to_one_driving: "bg-sky-100 text-sky-800",
  one_to_one_cooking_together: "bg-orange-100 text-orange-800",
  one_to_one_boxing_sport: "bg-red-100 text-red-800",
  brief_check_in: "bg-slate-100 text-[var(--cs-navy)]",
  crisis_check_in: "bg-fuchsia-100 text-fuchsia-800",
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ChildKeyworker1to1SessionsPage() {
  const qc = useQueryClient();

  // Inlined: useCreateKeyworkSession
  const createSession = useMutation({
    mutationFn: (data: Partial<KeyworkSession>) =>
      api.post<SingleResponse>("/keywork-sessions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywork-sessions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Inlined: useKeyworkSessions
  const { data: queryData, isLoading } = useQuery({
    queryKey: ["keywork-sessions", undefined],
    queryFn: () => {
      const qs = new URLSearchParams();
      return api.get<ListResponse>(`/keywork-sessions?${qs.toString()}`);
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => queryData?.data ?? [], [queryData]);

  // Who is recording. staff_id used to be the literal "staff_anna", a demo seed
  // id, so every session on a live tenant was attributed to someone who is not
  // on the staff list.
  const { currentUser, identityUnresolved } = useAuthContext();

  // The children and staff of this home, from the API. The child dropdown used
  // to be built from the children already appearing in saved sessions, so on a
  // home with no sessions yet it was empty and a first 1:1 could not be
  // recorded at all. Names came from the demo seed and read "Unknown" on live.
  const { data: ypData } = useQuery({
    queryKey: ["young-people"],
    queryFn: () => api.get<{ data: { id: string; preferred_name?: string | null; first_name?: string | null; last_name?: string | null; full_name?: string | null; status?: string }[] }>("/young-people"),
    staleTime: 5 * 60_000,
  });
  const { data: staffData } = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.get<{ data: { id: string; full_name?: string | null; first_name?: string | null; last_name?: string | null }[] }>("/staff"),
    staleTime: 5 * 60_000,
  });
  const youngPeople = useMemo(() => ypData?.data ?? [], [ypData]);
  const ypName = useMemo(() => {
    const byId = new Map(youngPeople.map((c) => [c.id, c]));
    return (id: string) => childDisplayName(byId.get(id));
  }, [youngPeople]);
  const staffName = useMemo(() => {
    const byId = new Map((staffData?.data ?? []).map((m) => [m.id, m]));
    return (id: string) => {
      const m = byId.get(id);
      if (!m) return "Unknown staff member";
      return m.full_name?.trim() || [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || "Unnamed staff member";
    };
  }, [staffData]);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [nChild, setNChild] = useState("");
  const [nFormat, setNFormat] = useState("");
  const [nThemes, setNThemes] = useState("");
  const [nChildBroughtUp, setNChildBroughtUp] = useState("");
  const [nStaffBroughtUp, setNStaffBroughtUp] = useState("");
  // Everything below used to be sent as a constant the form never asked for:
  // 45 minutes, "the child chose this", a satisfaction of 4, a follow-up seven
  // days out, and empty action lists. A key-work session is evidence, so the
  // form asks and an unanswered field stays unanswered.
  const [nDuration, setNDuration] = useState("");
  const [nChoseFormat, setNChoseFormat] = useState("");
  const [nMoodIn, setNMoodIn] = useState("");
  const [nMoodOut, setNMoodOut] = useState("");
  const [nActionsStaff, setNActionsStaff] = useState("");
  const [nActionsChild, setNActionsChild] = useState("");
  const [nSatisfaction, setNSatisfaction] = useState("");
  const [nFollowUp, setNFollowUp] = useState("");
  const [nFlags, setNFlags] = useState("");
  const [nNotes, setNNotes] = useState("");
  const RATINGS = ["1", "2", "3", "4", "5"];

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const childIds = [...new Set(items.map(r => r.child_id))];

  const filtered = useMemo(() => {
    let out = [...items];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        ypName(r.child_id).toLowerCase().includes(s) ||
        staffName(r.staff_id).toLowerCase().includes(s) ||
        r.themes_covered.some(t => t.toLowerCase().includes(s)) ||
        r.what_child_brought_up.toLowerCase().includes(s)
      );
    }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (formatFilter !== "all") out = out.filter(r => r.format === formatFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.session_date.localeCompare(b.session_date) : b.session_date.localeCompare(a.session_date));
    return out;
  }, [items, search, childFilter, formatFilter, sortBy, ypName, staffName]);

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
  const sessionsThisMonth = items.filter(r => r.session_date >= thirtyDaysAgoStr).length;
  // Averaged over the sessions where the child was actually asked. Sessions
  // that did not ask are not zeros, and counting them as such would drag a
  // number presented as the child's voice toward a figure nobody gave.
  const rated = items.filter(r => r.child_satisfaction != null);
  const avgSatisfaction = rated.length
    ? (rated.reduce((sum, r) => sum + (r.child_satisfaction ?? 0), 0) / rated.length).toFixed(1)
    : "—";
  // Same for "did the child choose the format" - asked, and answered no, is
  // not the same as never asked.
  const choseAnswered = items.filter(r => r.child_chose_format != null);
  const childChosePct = choseAnswered.length
    ? Math.round((choseAnswered.filter(r => r.child_chose_format).length / choseAnswered.length) * 100)
    : 0;
  const flagsThisMonth = items.filter(r => r.session_date >= thirtyDaysAgoStr && r.flags_raised.length > 0).length;

  const exportCols: ExportColumn<KeyworkSession>[] = useMemo(() => [
    { header: "Date", accessor: (r: KeyworkSession) => r.session_date },
    { header: "Young Person", accessor: (r: KeyworkSession) => ypName(r.child_id) },
    { header: "Key Worker", accessor: (r: KeyworkSession) => staffName(r.staff_id) },
    { header: "Format", accessor: (r: KeyworkSession) => r.format ? KEYWORKER_SESSION_FORMAT_LABEL[r.format] : "Not recorded" },
    { header: "Duration (min)", accessor: (r: KeyworkSession) => r.duration_minutes },
    { header: "Child Chose Format", accessor: (r: KeyworkSession) => r.child_chose_format == null ? "Not asked" : r.child_chose_format ? "Yes" : "No" },
    { header: "Themes", accessor: (r: KeyworkSession) => r.themes_covered.join("; ") },
    { header: "Child Brought Up", accessor: (r: KeyworkSession) => r.what_child_brought_up },
    { header: "Staff Brought Up", accessor: (r: KeyworkSession) => r.what_staff_brought_up },
    { header: "Walked In With (1-5)", accessor: (r: KeyworkSession) => r.child_went_in_with ?? "Not recorded" },
    { header: "Walked Out With (1-5)", accessor: (r: KeyworkSession) => r.child_walked_out_with ?? "Not recorded" },
    { header: "Actions for Staff", accessor: (r: KeyworkSession) => r.agreed_actions_staff.join("; ") },
    { header: "Actions for Child", accessor: (r: KeyworkSession) => r.agreed_actions_child.join("; ") },
    { header: "Child Satisfaction (1–5)", accessor: (r: KeyworkSession) => r.child_satisfaction ?? "Not asked" },
    { header: "Follow-up Date", accessor: (r: KeyworkSession) => r.follow_up_date ?? "None set" },
    { header: "Flags Raised", accessor: (r: KeyworkSession) => r.flags_raised.join("; ") || "—" },
    { header: "Notes", accessor: (r: KeyworkSession) => r.notes ?? "" },
  ], [ypName, staffName]);

  const stars = (n: number | null) => n == null ? "Not asked" : "★".repeat(n) + "☆".repeat(5 - n);

  if (isLoading) {
    return (
      <PageShell title="1:1 Keyworker Sessions" subtitle="Protected weekly/fortnightly time between key worker and young person — themes, voice, agreed actions, follow-up">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="1:1 Keyworker Sessions"
      subtitle="Protected weekly/fortnightly time between key worker and young person — themes, voice, agreed actions, follow-up"
      caraContext={{ pageTitle: "1:1 Keyworker Sessions", sourceType: "child_record" }}
      actions={[
        <PrintButton key="p" title="1:1 Keyworker Sessions" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="keyworker-1to1-sessions" />,
        <CaraStudioQuickActionButton key="a" context={{ record_type: "keywork", record_id: "home_oak", home_id: "home_oak" }} />,
        <Button
          key="n"
          size="sm"
          disabled={identityUnresolved || !currentUser}
          title={identityUnresolved ? "Your sign-in is not linked to a staff record, so a session cannot be attributed to you." : undefined}
          onClick={() => setShowNew(true)}
        ><Plus className="h-4 w-4 mr-1" /> New Session</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions This Month", value: sessionsThisMonth, icon: Users, colour: "text-rose-600" },
            { label: `Average Satisfaction (asked in ${rated.length} of ${items.length})`, value: avgSatisfaction, icon: Heart, colour: "text-pink-600" },
            { label: "Child Chose Format", value: `${childChosePct}%`, icon: CheckCircle, colour: "text-sky-600" },
            { label: "Flags Raised (Month)", value: flagsThisMonth, icon: MessageCircle, colour: "text-amber-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="56b9-search" className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="56b9-search" className="pl-8" placeholder="Child, theme, content…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label htmlFor="56b9-child" className="text-xs">Child</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger id="56b9-child"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    {childIds.map(id => <SelectItem key={id} value={id}>{ypName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label htmlFor="56b9-format" className="text-xs">Format</Label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger id="56b9-format"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    {Object.entries(KEYWORKER_SESSION_FORMAT_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* session cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className="border-rose-100">
                <button className="w-full text-left" onClick={() => toggle(r.id)} aria-expanded={open} aria-label={`Expand session details for ${ypName(r.child_id)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{ypName(r.child_id)} with {staffName(r.staff_id)}</CardTitle>
                        <Badge className={cn("text-xs", r.format ? FORMAT_CLR[r.format] : undefined)}>{r.format ? KEYWORKER_SESSION_FORMAT_LABEL[r.format] : "Format not recorded"}</Badge>
                        <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{r.duration_minutes} min</Badge>
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">{stars(r.child_satisfaction)}</Badge>
                        {r.child_chose_format && <Badge className="text-xs bg-sky-100 text-sky-800">Child chose</Badge>}
                        {r.flags_raised.length > 0 && <Badge className="text-xs bg-amber-100 text-amber-800">Flag raised</Badge>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{r.session_date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    {r.themes_covered.length > 0 && (
                      <div className="flex gap-1 flex-wrap items-center">
                        <span className="text-xs text-muted-foreground mr-1">Themes:</span>
                        {r.themes_covered.map(t => <Badge key={t} variant="outline" className="text-xs border-rose-200 text-rose-700">{t}</Badge>)}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                        <p className="text-xs font-semibold text-rose-800 mb-1">What child went in with</p>
                        <p className="text-sm text-rose-900">{r.child_went_in_with == null ? "Not recorded" : stars(r.child_went_in_with)}</p>
                      </div>
                      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                        <p className="text-xs font-semibold text-sky-800 mb-1">What child walked out with</p>
                        <p className="text-sm text-sky-900">{r.child_walked_out_with == null ? "Not recorded" : stars(r.child_walked_out_with)}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">What child brought up</p>
                        <p className="text-sm text-pink-900">{r.what_child_brought_up}</p>
                      </div>
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1">What staff brought up</p>
                        <p className="text-sm text-indigo-900">{r.what_staff_brought_up}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1">Agreed actions — staff</p>
                        {r.agreed_actions_staff.length > 0 ? (
                          <ul className="text-sm text-emerald-900 list-disc pl-4 space-y-1">
                            {r.agreed_actions_staff.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        ) : <p className="text-sm text-emerald-900 italic">None</p>}
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Agreed actions — child</p>
                        {r.agreed_actions_child.length > 0 ? (
                          <ul className="text-sm text-amber-900 list-disc pl-4 space-y-1">
                            {r.agreed_actions_child.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        ) : <p className="text-sm text-amber-900 italic">None</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Follow-up: <span className="font-medium text-foreground">{r.follow_up_date ?? "none set"}</span></span>
                      {r.flags_raised.length > 0 && (
                        <span className="flex items-center gap-1">
                          Flags:
                          {r.flags_raised.map(f => <Badge key={f} className="text-xs bg-amber-100 text-amber-800">{f}</Badge>)}
                        </span>
                      )}
                    </div>

                    {r.notes && (
                      <div className="rounded-lg bg-slate-50 border border-[var(--cs-border)] p-3">
                        <p className="text-xs font-semibold text-[var(--cs-navy)] mb-1">Notes</p>
                        <p className="text-sm text-[var(--cs-navy)]">{r.notes}</p>
                      </div>
                    )}

                    <SmartLinkPanel sourceType="key_work" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015 — Quality Standard 5 (Education and Positive Relationships) and Quality Standard 7 (Leadership and Management). Regulation 7 sets out the keyworker duty: each child must have a designated key worker who builds a positive, trusting relationship and advocates for their needs.</p>
          <p>UNCRC Article 12: every child has the right to express their views in matters affecting them and to have those views given due weight. 1:1 sessions are a primary route through which child voice is captured, evidenced and acted on.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New 1:1 Session</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="session-child">Young Person</Label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger id="session-child"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {youngPeople
                    .filter(c => c.status === undefined || c.status === "current")
                    .map(c => (
                      <SelectItem key={c.id} value={c.id}>{childDisplayName(c)}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {nChild && <InlinePracticeReasoning childId={nChild} childName={ypName(nChild)} />}
            <div>
              <Label htmlFor="session-format">Format</Label>
              <Select value={nFormat} onValueChange={setNFormat}>
                <SelectTrigger id="session-format"><SelectValue placeholder="Select format" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(KEYWORKER_SESSION_FORMAT_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="session-themes">Themes Covered</Label>
              <Input id="session-themes" placeholder="Comma-separated themes" value={nThemes} onChange={e => setNThemes(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="session-child-brought-up">What child brought up</Label>
              <Textarea id="session-child-brought-up" placeholder="Record what the child raised..." value={nChildBroughtUp} onChange={e => setNChildBroughtUp(e.target.value)} rows={3} />
              <WritingAssistantInline value={nChildBroughtUp} onApplyText={setNChildBroughtUp} recordType="key_work" fieldName="child_brought_up" childId={nChild || undefined} mode="standard" />
            </div>
            <div>
              <Label htmlFor="session-staff-brought-up">What staff brought up</Label>
              <Textarea id="session-staff-brought-up" placeholder="Record what staff raised..." value={nStaffBroughtUp} onChange={e => setNStaffBroughtUp(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="session-duration">Duration (minutes)</Label>
                <Input id="session-duration" type="number" min={1} placeholder="e.g. 45" value={nDuration} onChange={e => setNDuration(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="session-chose-format">Did the child choose the format?</Label>
                <Select value={nChoseFormat} onValueChange={setNChoseFormat}>
                  <SelectTrigger id="session-chose-format"><SelectValue placeholder="Not asked" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="session-mood-in">Walked in with (1–5)</Label>
                <Select value={nMoodIn} onValueChange={setNMoodIn}>
                  <SelectTrigger id="session-mood-in"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                  <SelectContent>{RATINGS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="session-mood-out">Walked out with (1–5)</Label>
                <Select value={nMoodOut} onValueChange={setNMoodOut}>
                  <SelectTrigger id="session-mood-out"><SelectValue placeholder="Not recorded" /></SelectTrigger>
                  <SelectContent>{RATINGS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="session-actions-staff">Actions agreed — staff</Label>
              <Textarea id="session-actions-staff" placeholder="One action per line" value={nActionsStaff} onChange={e => setNActionsStaff(e.target.value)} rows={2} />
            </div>
            <div>
              <Label htmlFor="session-actions-child">Actions agreed — child</Label>
              <Textarea id="session-actions-child" placeholder="One action per line" value={nActionsChild} onChange={e => setNActionsChild(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="session-satisfaction">How the child rated the session (1–5)</Label>
                <Select value={nSatisfaction} onValueChange={setNSatisfaction}>
                  <SelectTrigger id="session-satisfaction"><SelectValue placeholder="Not asked" /></SelectTrigger>
                  <SelectContent>{RATINGS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Leave blank if you did not ask. It is recorded as the child&apos;s own rating.</p>
              </div>
              <div>
                <Label htmlFor="session-follow-up">Follow-up date</Label>
                <Input id="session-follow-up" type="date" value={nFollowUp} onChange={e => setNFollowUp(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="session-flags">Flags raised</Label>
              <Input id="session-flags" placeholder="Comma-separated — anything needing follow-up elsewhere" value={nFlags} onChange={e => setNFlags(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="session-notes">Notes</Label>
              <Textarea id="session-notes" placeholder="Anything else worth recording..." value={nNotes} onChange={e => setNNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button disabled={!nChild || !nFormat || !currentUser} onClick={() => {
              const lines = (v: string) => v.split("\n").map(t => t.trim()).filter(Boolean);
              const list = (v: string) => v.split(",").map(t => t.trim()).filter(Boolean);
              const rating = (v: string) => v ? (Number(v) as 1 | 2 | 3 | 4 | 5) : null;
              createSession.mutate({
                child_id: nChild,
                // The signed-in key worker, not a seeded id.
                staff_id: currentUser!.id,
                session_date: todayStr(),
                duration_minutes: nDuration ? Number(nDuration) : 0,
                format: nFormat as KeyworkerSessionFormat,
                child_chose_format: nChoseFormat ? nChoseFormat === "yes" : null,
                themes_covered: list(nThemes),
                child_went_in_with: rating(nMoodIn),
                child_walked_out_with: rating(nMoodOut),
                what_child_brought_up: nChildBroughtUp,
                what_staff_brought_up: nStaffBroughtUp,
                agreed_actions_staff: lines(nActionsStaff),
                agreed_actions_child: lines(nActionsChild),
                // Null when the child was not asked. Never a stand-in number.
                child_satisfaction: rating(nSatisfaction),
                follow_up_date: nFollowUp || null,
                flags_raised: list(nFlags),
                notes: nNotes || undefined,
              }, { onSuccess: () => toast.success("Session saved"), onError: () => toast.error("Failed to save session") });
              setShowNew(false);
              setNChild(""); setNFormat(""); setNThemes(""); setNChildBroughtUp(""); setNStaffBroughtUp("");
              setNDuration(""); setNChoseFormat(""); setNMoodIn(""); setNMoodOut("");
              setNActionsStaff(""); setNActionsChild(""); setNSatisfaction("");
              setNFollowUp(""); setNFlags(""); setNNotes("");
            }}>{createSession.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Session"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="1:1 Keyworker Sessions — keywork records, session notes, emotional check-in, care plan review, goals, wishes and feelings, direct work, LAC review preparation, Reg 45 evidence"
        recordType="keywork"
        className="mt-6"
      />
    </PageShell>
  );
}
