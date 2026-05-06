"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
import { cn } from "@/lib/utils";
import { useKeyworkSessions, useCreateKeyworkSession, type KeyworkSession } from "@/hooks/use-keywork-sessions";
import { type KeyworkerSessionFormat, KEYWORKER_SESSION_FORMAT_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const FORMAT_CLR: Record<string, string> = {
  one_to_one_at_home: "bg-rose-100 text-rose-800",
  one_to_one_walk: "bg-emerald-100 text-emerald-800",
  one_to_one_cafe: "bg-amber-100 text-amber-800",
  one_to_one_driving: "bg-sky-100 text-sky-800",
  one_to_one_cooking_together: "bg-orange-100 text-orange-800",
  one_to_one_boxing_sport: "bg-red-100 text-red-800",
  brief_check_in: "bg-slate-100 text-slate-800",
  crisis_check_in: "bg-fuchsia-100 text-fuchsia-800",
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ChildKeyworker1to1SessionsPage() {
  const createSession = useCreateKeyworkSession();
  const { data: queryData, isLoading } = useKeyworkSessions();
  const items = queryData?.data ?? [];
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

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const childIds = [...new Set(items.map(r => r.child_id))];

  const filtered = useMemo(() => {
    let out = [...items];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.child_id).toLowerCase().includes(s) ||
        getStaffName(r.staff_id).toLowerCase().includes(s) ||
        r.themes_covered.some(t => t.toLowerCase().includes(s)) ||
        r.what_child_brought_up.toLowerCase().includes(s)
      );
    }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (formatFilter !== "all") out = out.filter(r => r.format === formatFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.session_date.localeCompare(b.session_date) : b.session_date.localeCompare(a.session_date));
    return out;
  }, [items, search, childFilter, formatFilter, sortBy]);

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
  const sessionsThisMonth = items.filter(r => r.session_date >= thirtyDaysAgoStr).length;
  const avgSatisfaction = items.length
    ? (items.reduce((sum, r) => sum + r.child_satisfaction, 0) / items.length).toFixed(1)
    : "—";
  const childChosePct = items.length
    ? Math.round((items.filter(r => r.child_chose_format).length / items.length) * 100)
    : 0;
  const flagsThisMonth = items.filter(r => r.session_date >= thirtyDaysAgoStr && r.flags_raised.length > 0).length;

  const exportCols: ExportColumn<KeyworkSession>[] = useMemo(() => [
    { header: "Date", accessor: (r: KeyworkSession) => r.session_date },
    { header: "Young Person", accessor: (r: KeyworkSession) => getYPName(r.child_id) },
    { header: "Key Worker", accessor: (r: KeyworkSession) => getStaffName(r.staff_id) },
    { header: "Format", accessor: (r: KeyworkSession) => KEYWORKER_SESSION_FORMAT_LABEL[r.format as KeyworkerSessionFormat] ?? r.format },
    { header: "Duration (min)", accessor: (r: KeyworkSession) => r.duration_minutes },
    { header: "Child Chose Format", accessor: (r: KeyworkSession) => r.child_chose_format ? "Yes" : "No" },
    { header: "Themes", accessor: (r: KeyworkSession) => r.themes_covered.join("; ") },
    { header: "Child Brought Up", accessor: (r: KeyworkSession) => r.what_child_brought_up },
    { header: "Staff Brought Up", accessor: (r: KeyworkSession) => r.what_staff_brought_up },
    { header: "Walked In With", accessor: (r: KeyworkSession) => r.child_went_in_with },
    { header: "Walked Out With", accessor: (r: KeyworkSession) => r.child_walked_out_with },
    { header: "Actions for Staff", accessor: (r: KeyworkSession) => r.agreed_actions_staff.join("; ") },
    { header: "Actions for Child", accessor: (r: KeyworkSession) => r.agreed_actions_child.join("; ") },
    { header: "Child Satisfaction (1–5)", accessor: (r: KeyworkSession) => r.child_satisfaction },
    { header: "Follow-up Date", accessor: (r: KeyworkSession) => r.follow_up_date },
    { header: "Flags Raised", accessor: (r: KeyworkSession) => r.flags_raised.join("; ") || "—" },
    { header: "Notes", accessor: (r: KeyworkSession) => r.notes ?? "" },
  ], []);

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

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
      actions={[
        <PrintButton key="p" title="1:1 Keyworker Sessions" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="keyworker-1to1-sessions" />,
        <Button key="n" size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Session</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions This Month", value: sessionsThisMonth, icon: Users, colour: "text-rose-600" },
            { label: "Average Satisfaction", value: avgSatisfaction, icon: Heart, colour: "text-pink-600" },
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
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Child, theme, content…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs">Child</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    {childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs">Format</Label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <button className="w-full text-left" onClick={() => toggle(r.id)} aria-expanded={open} aria-label={`Expand session details for ${getYPName(r.child_id)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)} with {getStaffName(r.staff_id)}</CardTitle>
                        <Badge className={cn("text-xs", FORMAT_CLR[r.format])}>{KEYWORKER_SESSION_FORMAT_LABEL[r.format as KeyworkerSessionFormat] ?? r.format}</Badge>
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
                        <p className="text-sm text-rose-900">{r.child_went_in_with}</p>
                      </div>
                      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                        <p className="text-xs font-semibold text-sky-800 mb-1">What child walked out with</p>
                        <p className="text-sm text-sky-900">{r.child_walked_out_with}</p>
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
                      <span>Follow-up: <span className="font-medium text-foreground">{r.follow_up_date}</span></span>
                      {r.flags_raised.length > 0 && (
                        <span className="flex items-center gap-1">
                          Flags:
                          {r.flags_raised.map(f => <Badge key={f} className="text-xs bg-amber-100 text-amber-800">{f}</Badge>)}
                        </span>
                      )}
                    </div>

                    {r.notes && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-800 mb-1">Notes</p>
                        <p className="text-sm text-slate-900">{r.notes}</p>
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
                  {[...new Set(items.map(r => r.child_id))].map(id => (
                    <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            </div>
            <div>
              <Label htmlFor="session-staff-brought-up">What staff brought up</Label>
              <Textarea id="session-staff-brought-up" placeholder="Record what staff raised..." value={nStaffBroughtUp} onChange={e => setNStaffBroughtUp(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button disabled={!nChild || !nFormat} onClick={() => {
              const followUp = new Date(); followUp.setDate(followUp.getDate() + 7);
              createSession.mutate({
                child_id: nChild,
                staff_id: "staff_anna",
                session_date: new Date().toISOString().slice(0, 10),
                duration_minutes: 45,
                format: nFormat,
                child_chose_format: true,
                themes_covered: nThemes.split(",").map(t => t.trim()).filter(Boolean),
                what_child_brought_up: nChildBroughtUp,
                what_staff_brought_up: nStaffBroughtUp,
                agreed_actions_staff: [],
                agreed_actions_child: [],
                child_satisfaction: 4,
                follow_up_date: followUp.toISOString().slice(0, 10),
                flags_raised: [],
              }, { onSuccess: () => toast.success("Session saved"), onError: () => toast.error("Failed to save session") });
              setShowNew(false);
              setNChild(""); setNFormat(""); setNThemes(""); setNChildBroughtUp(""); setNStaffBroughtUp("");
            }}>{createSession.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Session"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
