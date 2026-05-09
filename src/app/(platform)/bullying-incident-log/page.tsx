"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Heart, ShieldAlert, MessageCircle, School, Globe, MapPin,
  Users, CheckCircle2, AlertTriangle, Sparkles, Activity, Megaphone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type {
  BullyingContext,
  BullyingPerpetratorType,
  BullyingType,
  BullyingStatus,
  BullyingIncident,
} from "@/types/extended";
import { useBullyingIncidents } from "@/hooks/use-bullying-incidents";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── label maps ───────────────────────────────────────────────────────────── */

const CONTEXT_LABEL: Record<BullyingContext, string> = {
  in_the_home: "In the home",
  school: "School",
  online: "Online",
  community: "Community",
  travel: "Travel",
};

const PERPETRATOR_TYPE_LABEL: Record<BullyingPerpetratorType, string> = {
  peer_in_home: "Peer in home",
  peer_at_school: "Peer at school",
  older_child: "Older child",
  online_stranger: "Online stranger",
  group_of_peers: "Group of peers",
  online_peer: "Online peer",
  adult: "Adult",
};

const BULLYING_TYPE_LABEL: Record<BullyingType, string> = {
  verbal: "Verbal",
  physical: "Physical",
  online_cyber: "Online/Cyber",
  exclusion_social: "Exclusion/Social",
  damage_to_property: "Damage to property",
  sexualised: "Sexualised",
  discriminatory: "Discriminatory",
};

const BULLYING_STATUS_LABEL: Record<BullyingStatus, string> = {
  open_investigating: "Open - investigating",
  closed_resolved: "Closed - resolved",
  monitoring: "Monitoring",
  escalated: "Escalated",
};

/* ── helpers ───────────────────────────────────────────────────────────────── */

const CONTEXT_CLR: Record<BullyingContext, string> = {
  in_the_home: "bg-amber-100 text-amber-800",
  school: "bg-blue-100 text-blue-800",
  online: "bg-purple-100 text-purple-800",
  community: "bg-green-100 text-green-800",
  travel: "bg-orange-100 text-orange-800",
};

const CONTEXT_ICON: Record<BullyingContext, typeof Heart> = {
  in_the_home: Heart,
  school: School,
  online: Globe,
  community: MapPin,
  travel: MapPin,
};

const TYPE_CLR: Record<BullyingType, string> = {
  verbal: "bg-yellow-100 text-yellow-800",
  physical: "bg-red-100 text-red-800",
  online_cyber: "bg-purple-100 text-purple-800",
  exclusion_social: "bg-pink-100 text-pink-800",
  damage_to_property: "bg-orange-100 text-orange-800",
  sexualised: "bg-rose-100 text-rose-800",
  discriminatory: "bg-fuchsia-100 text-fuchsia-800",
};

const STATUS_CLR: Record<BullyingStatus, string> = {
  open_investigating: "bg-blue-100 text-blue-800",
  closed_resolved: "bg-green-100 text-green-800",
  monitoring: "bg-amber-100 text-amber-800",
  escalated: "bg-red-100 text-red-800",
};

const BORDER_STATUS: Record<BullyingStatus, string> = {
  open_investigating: "border-l-blue-400",
  closed_resolved: "border-l-green-500",
  monitoring: "border-l-amber-400",
  escalated: "border-l-red-600",
};

const CONTEXTS: BullyingContext[] = ["in_the_home", "school", "online", "community", "travel"];
const TYPES: BullyingType[] = [
  "verbal", "physical", "online_cyber", "exclusion_social",
  "damage_to_property", "sexualised", "discriminatory",
];
const STATUSES: BullyingStatus[] = ["open_investigating", "closed_resolved", "monitoring", "escalated"];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function BullyingIncidentLogPage() {
  const { data: biData, isLoading } = useBullyingIncidents();
  const data = biData?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterContext, setFilterContext] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterContext !== "all" && r.context !== filterContext) return false;
      if (filterType !== "all" && r.bullying_type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterYP !== "all" && r.child_id !== filterYP) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.description.toLowerCase().includes(q) ||
          r.child_impact_observed.toLowerCase().includes(q) ||
          r.child_words_used.toLowerCase().includes(q) ||
          r.pattern_indicator.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "status": {
          const order: BullyingStatus[] = ["escalated", "open_investigating", "monitoring", "closed_resolved"];
          return order.indexOf(a.status) - order.indexOf(b.status);
        }
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterContext, filterType, filterStatus, filterYP, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const thisTermCount = data.length;

  const topContext = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => { counts[r.context] = (counts[r.context] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? CONTEXT_LABEL[sorted[0][0] as BullyingContext] : "—";
  }, [data]);

  const resolvedPct = useMemo(() => {
    if (data.length === 0) return 0;
    const resolved = data.filter((r) => r.status === "closed_resolved").length;
    return Math.round((resolved / data.length) * 100);
  }, [data]);

  const patternsIdentified = useMemo(() => {
    return data.filter((r) =>
      r.pattern_indicator.toLowerCase().includes("pattern") ||
      r.pattern_indicator.toLowerCase().includes("second") ||
      r.pattern_indicator.toLowerCase().includes("twice") ||
      r.pattern_indicator.toLowerCase().includes("cumulative"),
    ).length;
  }, [data]);

  const yps = Array.from(new Set(data.map((r) => r.child_id)));

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<BullyingIncident>[] = [
    { header: "Date", accessor: (r: BullyingIncident) => r.date },
    { header: "Time", accessor: (r: BullyingIncident) => r.time },
    { header: "Child Affected", accessor: (r: BullyingIncident) => getYPName(r.child_id) },
    { header: "Context", accessor: (r: BullyingIncident) => CONTEXT_LABEL[r.context] },
    { header: "Perpetrator Type", accessor: (r: BullyingIncident) => PERPETRATOR_TYPE_LABEL[r.perpetrator_type] },
    { header: "Bullying Type", accessor: (r: BullyingIncident) => BULLYING_TYPE_LABEL[r.bullying_type] },
    { header: "Description", accessor: (r: BullyingIncident) => r.description },
    { header: "Impact Observed", accessor: (r: BullyingIncident) => r.child_impact_observed },
    { header: "Child's Words", accessor: (r: BullyingIncident) => r.child_words_used },
    { header: "Reported By", accessor: (r: BullyingIncident) => r.reported_by === "Child disclosed" ? "Child disclosed" : getStaffName(r.reported_by) },
    { header: "Child Wanted Reporting", accessor: (r: BullyingIncident) => r.child_wanted_reporting ? "Yes" : "No" },
    { header: "External Agencies Notified", accessor: (r: BullyingIncident) => r.external_agencies_notified.join("; ") },
    { header: "School Notified", accessor: (r: BullyingIncident) => r.school_notified ? "Yes" : "No" },
    { header: "Police Notified", accessor: (r: BullyingIncident) => r.police_notified ? "Yes" : "No" },
    { header: "Parents Informed", accessor: (r: BullyingIncident) => r.parents_informed ? "Yes" : "No" },
    { header: "Restorative Approach", accessor: (r: BullyingIncident) => r.restorative_approach_attempted },
    { header: "Support Provided", accessor: (r: BullyingIncident) => r.support_provided.join("; ") },
    { header: "Perpetrator Outcome", accessor: (r: BullyingIncident) => r.perpetrator_outcome },
    { header: "Wellbeing Post-Incident", accessor: (r: BullyingIncident) => r.wellbeing_post_incident },
    { header: "Follow-Up Date", accessor: (r: BullyingIncident) => r.follow_up_date },
    { header: "Status", accessor: (r: BullyingIncident) => BULLYING_STATUS_LABEL[r.status] },
    { header: "Pattern Indicator", accessor: (r: BullyingIncident) => r.pattern_indicator },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <PageShell title="Bullying Incident Log" subtitle="Quality Standard 5 (Care planning) · Anti-bullying response · Sensitive record">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Bullying Incident Log"
      subtitle="Quality Standard 5 (Care planning) · Anti-bullying response · Sensitive record"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Bullying Incident Log" />
          <ExportButton data={filtered} columns={exportCols} filename="bullying-incident-log" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "This Term", value: thisTermCount, icon: Activity, clr: "text-blue-600" },
            { label: "Top Context", value: topContext, icon: MapPin, clr: "text-purple-600" },
            { label: "Resolved", value: `${resolvedPct}%`, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Patterns Identified", value: patternsIdentified, icon: AlertTriangle, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── philosophy banner ────────────────────────────────────────────── */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-800 mb-1">Our anti-bullying philosophy</p>
            <p className="text-rose-700">
              Every child has the right to feel safe, valued and listened to. We take all bullying — peer-on-peer (in or out of the home), online,
              or directed at our children from outside — seriously and respond proportionately. The child&apos;s voice leads our response: we ask what
              they want to happen, support their choices wherever it is safe to do so, and keep them informed at every step. We use restorative
              approaches by default, escalate where needed, and never minimise what a child has experienced. Records here are sensitive and
              shared only with those who need to know.
            </p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search description, child, words used…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {yps.map((y) => (<SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterContext} onValueChange={setFilterContext}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contexts</SelectItem>
              {CONTEXTS.map((c) => (<SelectItem key={c} value={c}>{CONTEXT_LABEL[c]}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map((t) => (<SelectItem key={t} value={t}>{BULLYING_TYPE_LABEL[t]}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (<SelectItem key={s} value={s}>{BULLYING_STATUS_LABEL[s]}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const ContextIcon = CONTEXT_ICON[r.context];
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  BORDER_STATUS[r.status],
                )}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={CONTEXT_CLR[r.context]}>
                          <ContextIcon className="h-3 w-3 mr-1" /> {CONTEXT_LABEL[r.context]}
                        </Badge>
                        <Badge variant="outline" className={TYPE_CLR[r.bullying_type]}>{BULLYING_TYPE_LABEL[r.bullying_type]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{BULLYING_STATUS_LABEL[r.status]}</Badge>
                        {r.child_wanted_reporting && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Megaphone className="h-3 w-3 mr-1" /> Child-led
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {PERPETRATOR_TYPE_LABEL[r.perpetrator_type]} · {r.date} at {r.time}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* child voice highlight */}
                    {r.child_words_used && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                        <p className="font-semibold text-rose-800 flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" /> In the child&apos;s own words
                        </p>
                        <p className="italic text-rose-700 mt-1">&ldquo;{r.child_words_used}&rdquo;</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">What happened</p>
                        <p className="text-muted-foreground">{r.description}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Activity className="h-4 w-4" /> Impact observed</p>
                        <p className="text-muted-foreground">{r.child_impact_observed}</p>
                      </div>
                    </div>

                    {/* response strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Child wanted reporting</p>
                        <p className="text-xs text-muted-foreground">{r.child_wanted_reporting ? "Yes" : "No — child-led pause"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">School notified</p>
                        <p className="text-xs text-muted-foreground">{r.school_notified ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Police notified</p>
                        <p className="text-xs text-muted-foreground">{r.police_notified ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Parents informed</p>
                        <p className="text-xs text-muted-foreground">{r.parents_informed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Users className="h-4 w-4" /> Restorative approach</p>
                        <p className="text-muted-foreground">{r.restorative_approach_attempted}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Sparkles className="h-4 w-4" /> Wellbeing post-incident</p>
                        <p className="text-muted-foreground">{r.wellbeing_post_incident}</p>
                      </div>
                    </div>

                    {/* support tags */}
                    {r.support_provided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Support provided</p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.support_provided.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* perpetrator outcome (anonymised) */}
                    <div>
                      <p className="font-medium mb-1">Perpetrator outcome (anonymised)</p>
                      <p className="text-muted-foreground">{r.perpetrator_outcome}</p>
                    </div>

                    {/* pattern indicator */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="font-semibold text-amber-800 flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4" /> Pattern review
                      </p>
                      <p className="text-amber-700 text-xs mt-1">{r.pattern_indicator}</p>
                    </div>

                    {/* external agencies */}
                    {r.external_agencies_notified.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-muted-foreground">Agencies notified:</span>
                        {r.external_agencies_notified.map((a, i) => (
                          <Badge key={i} variant="outline" className="bg-slate-50">{a}</Badge>
                        ))}
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>
                        Reported by: {r.reported_by === "Child disclosed" ? "Child disclosed" : getStaffName(r.reported_by)}
                      </span>
                      <span>Follow-up: {r.follow_up_date}</span>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="bullying_incident" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Quality Standard 5 (Care planning) and Standard 4 (Protection) — children must be helped to
            understand bullying, supported to disclose, and protected from harm. This log captures peer-on-peer bullying inside or outside the home,
            online bullying, and bullying directed at our children from outside. Records align with the home&apos;s Anti-Bullying Policy, Behaviour Support Plans,
            and Contextual Safeguarding considerations. Cross-reference with Behaviour Log, Online Safety records, and Key Work entries. Where a pattern,
            severity, or risk threshold is met, escalate to the Registered Manager and consider a safeguarding referral under Working Together to Safeguard
            Children 2018. Records are sensitive — access is limited to those with a legitimate need to know — and retained until the child&apos;s 25th birthday
            (or 75 years for looked-after children, per Reg 37).
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
