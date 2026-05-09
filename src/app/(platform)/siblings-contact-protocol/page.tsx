"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Users, Heart, Gavel, CalendarClock, MapPin, Shield, Sparkles,
  Phone, Video, Mail, MessageSquare, Cake, Gift, AlertTriangle,
  CheckCircle2, Eye, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useSiblingContactProtocolRecords } from "@/hooks/use-sibling-contact-protocol-records";
import type { SiblingContactProtocolRecord } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (icons are React.ElementType — cannot serialize) ───────── */

const QUALITY_CLR: Record<string, string> = {
  "Strong": "bg-green-100 text-green-800",
  "Good": "bg-emerald-100 text-emerald-800",
  "Developing": "bg-blue-100 text-blue-800",
  "Fragile": "bg-amber-100 text-amber-800",
  "Strained": "bg-red-100 text-red-800",
};

const MOOD_CLR: Record<string, string> = {
  "Settled": "bg-emerald-100 text-emerald-800",
  "Happy": "bg-green-100 text-green-800",
  "Reflective": "bg-blue-100 text-blue-800",
  "Mixed": "bg-amber-100 text-amber-800",
  "Unsettled": "bg-orange-100 text-orange-800",
  "Distressed": "bg-red-100 text-red-800",
};

const TYPE_ICON: Record<string, typeof Phone> = {
  "Visit": Users,
  "Phone": Phone,
  "Video": Video,
  "Letterbox": Mail,
  "Social media": MessageSquare,
  "Indirect": Mail,
};

/* ── component ────────────────────────────────────────────────────────────── */

export default function SiblingsContactProtocolPage() {
  const { data: records = [], isLoading } = useSiblingContactProtocolRecords();
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterQuality, setFilterQuality] = useState("all");
  const [filterCourt, setFilterCourt] = useState("all");
  const [sortBy, setSortBy] = useState("review-asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);
  const qualities = useMemo(() => Array.from(new Set(records.map((r) => r.current_relationship_quality))), [records]);

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterYP !== "all" && r.child_id !== filterYP) return false;
      if (filterQuality !== "all" && r.current_relationship_quality !== filterQuality) return false;
      if (filterCourt === "yes" && !r.court_ordered_contact) return false;
      if (filterCourt === "no" && r.court_ordered_contact) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.sibling_name.toLowerCase().includes(q) ||
          r.sibling_placement.toLowerCase().includes(q) ||
          r.sibling_location.toLowerCase().includes(q) ||
          r.agreed_contact_plan.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "review-asc": return a.review_date.localeCompare(b.review_date);
        case "review-desc": return b.review_date.localeCompare(a.review_date);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "quality": return a.current_relationship_quality.localeCompare(b.current_relationship_quality);
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterYP, filterQuality, filterCourt, sortBy]);

  const childrenWithSiblings = new Set(records.map((r) => r.child_id)).size;
  const activeContacts = records.filter((r) => r.contact_types.length > 0).length;
  const courtOrderedCount = records.filter((r) => r.court_ordered_contact).length;
  const reviewsDue = useMemo(() => {
    const today = new Date();
    const in30 = new Date();
    in30.setDate(today.getDate() + 30);
    return records.filter((r) => {
      const rd = new Date(r.review_date);
      return rd <= in30;
    }).length;
  }, [records]);

  const exportCols: ExportColumn<SiblingContactProtocolRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Sibling", accessor: (r) => r.sibling_name },
    { header: "Sibling Placement", accessor: (r) => r.sibling_placement },
    { header: "Location", accessor: (r) => r.sibling_location },
    { header: "Pre-Oak House Relationship", accessor: (r) => r.relationship_pre_oak_house },
    { header: "Current Quality", accessor: (r) => r.current_relationship_quality },
    { header: "Frequency", accessor: (r) => r.contact_frequency },
    { header: "Contact Types", accessor: (r) => r.contact_types.join("; ") },
    { header: "Agreed Plan", accessor: (r) => r.agreed_contact_plan },
    { header: "Child's Preferences", accessor: (r) => r.child_preferences },
    { header: "Sibling's Preferences", accessor: (r) => r.sibling_preferences },
    { header: "Risk Factors", accessor: (r) => r.risk_factors_to_contact.join("; ") },
    { header: "Protective Factors", accessor: (r) => r.protective_factors_to_contact.join("; ") },
    { header: "Supervision Required", accessor: (r) => r.supervision_required ? "Yes" : "No" },
    { header: "Supervision Level", accessor: (r) => r.supervision_level },
    { header: "Transport", accessor: (r) => r.transport_arrangements },
    { header: "Budget", accessor: (r) => r.contact_costs_budget },
    { header: "Locations", accessor: (r) => r.locations_for_contact.join("; ") },
    { header: "Favourite Activities", accessor: (r) => r.favourite_sibling_activities.join("; ") },
    { header: "Birthday Plan", accessor: (r) => r.birthday_celebration_plan },
    { header: "Christmas Arrangements", accessor: (r) => r.christmas_arrangements },
    { header: "Court Ordered", accessor: (r) => r.court_ordered_contact ? "Yes" : "No" },
    { header: "Court Order Terms", accessor: (r) => r.court_order_terms },
    { header: "Recent Contacts", accessor: (r) => r.recent_contacts.map((c) => `${c.date} ${c.type}: ${c.observations} [mood: ${c.child_mood_after}]`).join(" || ") },
    { header: "Ongoing Themes", accessor: (r) => r.ongoing_sibling_themes.join("; ") },
    { header: "Review Date", accessor: (r) => r.review_date },
    { header: "Reviewed By", accessor: (r) => getStaffName(r.reviewed_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Siblings Contact Protocol" subtitle="Children Act 1989 s23(7) — sibling duty · Quality Standard 9 (Care Planning)">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Siblings Contact Protocol"
      subtitle="Children Act 1989 s23(7) — sibling duty · Quality Standard 9 (Care Planning)"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Siblings Contact Protocol" />
          <ExportButton data={filtered} columns={exportCols} filename="siblings-contact-protocol" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Children with Siblings", value: childrenWithSiblings, icon: Users, clr: "text-blue-600" },
            { label: "Active Contacts", value: activeContacts, icon: Heart, clr: "text-rose-600" },
            { label: "Court-Ordered", value: courtOrderedCount, icon: Gavel, clr: "text-indigo-600" },
            { label: "Reviews Due (30d)", value: reviewsDue, icon: CalendarClock, clr: reviewsDue > 0 ? "text-amber-600" : "text-emerald-600" },
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

        {/* ── enduring relationships banner ────────────────────────────────── */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-900">Sibling relationships often outlast every placement.</p>
            <p className="text-rose-800 mt-1">
              Brothers and sisters are usually the longest relationships in a child&apos;s life — outlasting carers, schools, social workers, and homes. Section 23(7) of the Children Act 1989 places a duty on the local authority to enable separated siblings to live together so far as is reasonably practicable, and where they cannot, to support meaningful contact. Quality Standard 9 requires us to actively promote those bonds. This protocol is not a contact log — it is the agreed shape of an enduring relationship we are entrusted to protect and grow.
            </p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sibling, placement, plan…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {childIds.map((y) => (<SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterQuality} onValueChange={setFilterQuality}>
            <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Qualities</SelectItem>
              {qualities.map((q) => (<SelectItem key={q} value={q}>{q}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterCourt} onValueChange={setFilterCourt}>
            <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Court status: any</SelectItem>
              <SelectItem value="yes">Court ordered</SelectItem>
              <SelectItem value="no">Not court ordered</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review-asc">Review: soonest</SelectItem>
              <SelectItem value="review-desc">Review: latest</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
              <SelectItem value="quality">By Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const lastContact = r.recent_contacts[0];
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  r.court_ordered_contact ? "border-l-indigo-500" : "border-l-rose-300",
                )}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <span className="text-muted-foreground font-normal">↔</span>
                        <span className="font-medium">{r.sibling_name}</span>
                        <Badge variant="outline" className={QUALITY_CLR[r.current_relationship_quality] ?? "bg-slate-100 text-slate-800"}>
                          {r.current_relationship_quality}
                        </Badge>
                        {r.court_ordered_contact && (
                          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 gap-1">
                            <Gavel className="h-3 w-3" /> Court Ordered
                          </Badge>
                        )}
                        {r.supervision_required && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 gap-1">
                            <Shield className="h-3 w-3" /> Supervised
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.sibling_placement}</span>
                        <span>·</span>
                        <span>{r.sibling_location}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Review {r.review_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {r.contact_types.map((t) => {
                          const Icon = TYPE_ICON[t] ?? MessageSquare;
                          return (
                            <Badge key={t} variant="outline" className="bg-slate-50 text-slate-700 gap-1 font-normal">
                              <Icon className="h-3 w-3" /> {t}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
                  </div>
                </CardHeader>

                {open && (
                  <CardContent className="pt-0 space-y-5 text-sm">
                    {/* Pre-Oak House */}
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Relationship before Oak House</h4>
                      <p className="text-slate-700 leading-relaxed">{r.relationship_pre_oak_house}</p>
                    </section>

                    {/* Frequency + Plan */}
                    <section className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Contact frequency</h4>
                        <p className="text-slate-700">{r.contact_frequency}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Supervision</h4>
                        <p className="text-slate-700">{r.supervision_level}</p>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Agreed contact plan</h4>
                      <p className="text-slate-700 leading-relaxed">{r.agreed_contact_plan}</p>
                    </section>

                    {/* Court order */}
                    {r.court_ordered_contact && r.court_order_terms && (
                      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-indigo-800 mb-1 flex items-center gap-1">
                          <Gavel className="h-3.5 w-3.5" /> Court order terms
                        </h4>
                        <p className="text-indigo-900 text-sm">{r.court_order_terms}</p>
                      </section>
                    )}

                    {/* Voices */}
                    <section className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-blue-800 mb-1">Child&apos;s preferences</h4>
                        <p className="text-blue-900">{r.child_preferences}</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-purple-800 mb-1">Sibling&apos;s preferences</h4>
                        <p className="text-purple-900">{r.sibling_preferences}</p>
                      </div>
                    </section>

                    {/* Risk + Protective */}
                    <section className="grid md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Risks to contact
                        </h4>
                        <ul className="space-y-1 text-amber-900 list-disc list-inside text-xs">
                          {r.risk_factors_to_contact.map((f, i) => (<li key={i}>{f}</li>))}
                        </ul>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Protective factors
                        </h4>
                        <ul className="space-y-1 text-emerald-900 list-disc list-inside text-xs">
                          {r.protective_factors_to_contact.map((f, i) => (<li key={i}>{f}</li>))}
                        </ul>
                      </div>
                    </section>

                    {/* Logistics */}
                    <section className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Transport</h4>
                        <p className="text-slate-700 text-xs">{r.transport_arrangements}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Budget</h4>
                        <p className="text-slate-700 text-xs">{r.contact_costs_budget}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Locations</h4>
                        <ul className="text-slate-700 text-xs space-y-0.5">
                          {r.locations_for_contact.map((l, i) => (<li key={i} className="flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {l}</li>))}
                        </ul>
                      </div>
                    </section>

                    {/* Favourite activities */}
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">What they love doing together</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {r.favourite_sibling_activities.map((a, i) => (
                          <Badge key={i} variant="outline" className="bg-pink-50 text-pink-800 font-normal">{a}</Badge>
                        ))}
                      </div>
                    </section>

                    {/* Birthday + Christmas */}
                    <section className="grid md:grid-cols-2 gap-4">
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1">
                          <Cake className="h-3.5 w-3.5" /> Birthday celebration plan
                        </h4>
                        <p className="text-rose-900 text-xs">{r.birthday_celebration_plan}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                          <Gift className="h-3.5 w-3.5" /> Christmas arrangements
                        </h4>
                        <p className="text-emerald-900 text-xs">{r.christmas_arrangements}</p>
                      </div>
                    </section>

                    {/* Recent contacts */}
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Recent contacts ({r.recent_contacts.length})
                      </h4>
                      <div className="space-y-2">
                        {r.recent_contacts.map((c, i) => {
                          const Icon = TYPE_ICON[c.type] ?? MessageSquare;
                          return (
                            <div key={i} className="border border-slate-200 rounded-lg p-3 bg-white">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="bg-slate-50 text-slate-700 gap-1 font-normal">
                                  <Icon className="h-3 w-3" /> {c.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{c.date}</span>
                                <Badge variant="outline" className={MOOD_CLR[c.child_mood_after] ?? "bg-slate-100 text-slate-700"}>
                                  Mood after: {c.child_mood_after}
                                </Badge>
                              </div>
                              <p className="text-slate-700 text-xs leading-relaxed">{c.observations}</p>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Themes */}
                    <section>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ongoing sibling themes</h4>
                      <ul className="space-y-1 text-slate-700 list-disc list-inside text-xs">
                        {r.ongoing_sibling_themes.map((t, i) => (<li key={i}>{t}</li>))}
                      </ul>
                    </section>

                    {/* Review */}
                    <section className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Next review: <span className="font-medium text-slate-700">{r.review_date}</span></span>
                      <span>Reviewed by <span className="font-medium text-slate-700">{getStaffName(r.reviewed_by)}</span></span>
                      {lastContact && (
                        <span>Last contact: <span className="font-medium text-slate-700">{lastContact.date}</span></span>
                      )}
                    </section>

                    <SmartLinkPanel sourceType="siblings-contact-protocol" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sibling protocols match the current filters.</p>
            </div>
          )}
        </div>

        {/* ── regulatory note ──────────────────────────────────────────────── */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700">
          <p className="font-semibold text-slate-900 mb-1">Regulatory framework</p>
          <p className="leading-relaxed">
            This protocol gives effect to <strong>Children Act 1989, s23(7)</strong> (the duty to place siblings together so far as reasonably practicable, and to support contact where they are separated) and <strong>Quality Standard 9</strong> of the Children&apos;s Homes (England) Regulations 2015 (Care Planning), which requires the home to actively promote contact with siblings where this is consistent with the child&apos;s welfare. Cross-references: Care Plan, Family Contact log, Contact Plans, Life-Story Work, and the placing authority&apos;s Sibling Assessment. Each protocol must be reviewed at every LAC review and at any change in either child&apos;s placement.
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
