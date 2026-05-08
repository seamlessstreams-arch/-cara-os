"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Phone, Video, Mail, Users, FileText, PenLine,
  CheckCircle2, AlertTriangle, Clock, Heart, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useParentPartnershipRecords } from "@/hooks/use-parent-partnership-records";
import type {
  ParentPartnershipRecord,
  ParentContactType,
  ParentEngagementLevel,
  ParentRelationshipType,
  ParentContactInitiator,
} from "@/types/extended";
import {
  PARENT_CONTACT_TYPE_LABEL,
  PARENT_ENGAGEMENT_LEVEL_LABEL,
  PARENT_RELATIONSHIP_TYPE_LABEL,
  PARENT_CONTACT_INITIATOR_LABEL,
} from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const CT_ICON: Record<ParentContactType, typeof Phone> = {
  phone_call: Phone, visit: Users, email: Mail,
  meeting: Users, letter: FileText, video_call: Video,
};

const ENG_CLR: Record<ParentEngagementLevel, string> = {
  positive: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-100 text-slate-800",
  difficult: "bg-amber-100 text-amber-800",
  disengaged: "bg-orange-100 text-orange-800",
  hostile: "bg-red-100 text-red-800",
};
const ENG_BORDER: Record<ParentEngagementLevel, string> = {
  positive: "border-l-emerald-400",
  neutral: "border-l-slate-300",
  difficult: "border-l-amber-400",
  disengaged: "border-l-orange-400",
  hostile: "border-l-red-500",
};

/* ── export columns ────────────────────────────────────────────────────────── */

const exportCols: ExportColumn<ParentPartnershipRecord>[] = [
  { header: "Date", accessor: (r: ParentPartnershipRecord) => r.date },
  { header: "Young Person", accessor: (r: ParentPartnershipRecord) => getYPName(r.child_id) },
  { header: "Family Member", accessor: (r: ParentPartnershipRecord) => r.family_member_name },
  { header: "Relationship", accessor: (r: ParentPartnershipRecord) => PARENT_RELATIONSHIP_TYPE_LABEL[r.relationship_type] },
  { header: "Contact Type", accessor: (r: ParentPartnershipRecord) => PARENT_CONTACT_TYPE_LABEL[r.contact_type] },
  { header: "Engagement", accessor: (r: ParentPartnershipRecord) => PARENT_ENGAGEMENT_LEVEL_LABEL[r.engagement_level] },
  { header: "Initiated By", accessor: (r: ParentPartnershipRecord) => PARENT_CONTACT_INITIATOR_LABEL[r.initiated_by] },
  { header: "Duration (mins)", accessor: (r: ParentPartnershipRecord) => String(r.duration) },
  { header: "Staff", accessor: (r: ParentPartnershipRecord) => getStaffName(r.staff_member_id) },
  { header: "Summary", accessor: (r: ParentPartnershipRecord) => r.summary },
  { header: "Concerns", accessor: (r: ParentPartnershipRecord) => r.concerns },
  { header: "SW Informed", accessor: (r: ParentPartnershipRecord) => r.sw_informed ? "Yes" : "No" },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ParentPartnershipPage() {
  const { data: res, isLoading } = useParentPartnershipRecords();
  const data = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [engFilter, setEngFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.child_id).toLowerCase().includes(s) ||
        r.family_member_name.toLowerCase().includes(s) ||
        r.summary.toLowerCase().includes(s)
      );
    }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (engFilter !== "all") out = out.filter(r => r.engagement_level === engFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [data, search, childFilter, engFilter, sortBy]);

  /* stats */
  const totalContacts = data.length;
  const positiveCount = data.filter(r => r.engagement_level === "positive").length;
  const difficultCount = data.filter(r => r.engagement_level === "difficult" || r.engagement_level === "hostile").length;
  const disengagedCount = data.filter(r => r.engagement_level === "disengaged").length;
  const withConcerns = data.filter(r => r.concerns.trim().length > 0).length;
  const pendingFollowUps = data.reduce((n, r) => n + r.follow_up_actions.length, 0);

  if (isLoading) {
    return (
      <PageShell
        title="Parent &amp; Carer Partnership"
        subtitle="Family engagement, contact quality and partnership working — Children Act 1989"
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Parent &amp; Carer Partnership"
      subtitle="Family engagement, contact quality and partnership working — Children Act 1989"
      actions={[
        <PrintButton key="p" title="Parent Partnership Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="parent-partnership-log" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Contact</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* ── stat strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Contacts", value: totalContacts, icon: Phone, colour: "text-blue-600" },
            { label: "Positive", value: positiveCount, icon: Heart, colour: "text-emerald-600" },
            { label: "Difficult / Hostile", value: difficultCount, icon: AlertTriangle, colour: difficultCount > 0 ? "text-amber-600" : "text-slate-400" },
            { label: "Disengaged", value: disengagedCount, icon: Clock, colour: disengagedCount > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "With Concerns", value: withConcerns, icon: AlertTriangle, colour: withConcerns > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Follow-Up Actions", value: pendingFollowUps, icon: CheckCircle2, colour: "text-indigo-600" },
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

        {/* ── filter bar ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name, family member, summary…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-40">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Young Person</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Young People</SelectItem>
                    {childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs">Engagement</Label>
                <Select value={engFilter} onValueChange={setEngFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {(Object.entries(PARENT_ENGAGEMENT_LEVEL_LABEL) as [ParentEngagementLevel, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
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

        {/* ── contact cards ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const Icon = CT_ICON[r.contact_type];
            return (
              <Card key={r.id} className={cn("border-l-4", ENG_BORDER[r.engagement_level])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900">{getYPName(r.child_id)}</span>
                          <span className="text-slate-400 text-xs">&middot;</span>
                          <span className="text-sm text-slate-700">{r.family_member_name}</span>
                          <Badge variant="outline" className="text-xs">{PARENT_RELATIONSHIP_TYPE_LABEL[r.relationship_type]}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{r.date}</span>
                          <span className="text-xs text-muted-foreground">{PARENT_CONTACT_TYPE_LABEL[r.contact_type]}</span>
                          {r.duration > 0 && <span className="text-xs text-muted-foreground">{r.duration} mins</span>}
                          <span className="text-xs text-muted-foreground">Staff: {getStaffName(r.staff_member_id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.concerns && (
                        <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                          <AlertTriangle className="w-3 h-3" /> Concern
                        </Badge>
                      )}
                      <Badge className={cn("text-xs", ENG_CLR[r.engagement_level])}>{PARENT_ENGAGEMENT_LEVEL_LABEL[r.engagement_level]}</Badge>
                      {r.sw_informed && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">SW Informed</Badge>
                      )}
                      {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </button>

                {open && (
                  <CardContent className="space-y-4 pt-0 border-t">
                    {/* Summary */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{r.summary}</p>
                    </div>

                    {/* Contact details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Initiated By</p>
                        <p className="font-medium">{PARENT_CONTACT_INITIATOR_LABEL[r.initiated_by]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{r.duration > 0 ? `${r.duration} minutes` : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Staff Member</p>
                        <p className="font-medium">{getStaffName(r.staff_member_id)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SW Informed</p>
                        <p className="font-medium">{r.sw_informed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* Concerns */}
                    {r.concerns && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Concerns
                        </p>
                        <p className="text-sm text-red-900">{r.concerns}</p>
                      </div>
                    )}

                    {/* Positive outcomes */}
                    {r.positive_outcomes.length > 0 && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Positive Outcomes
                        </p>
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {r.positive_outcomes.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Follow-up actions */}
                    {r.follow_up_actions.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                          <PenLine className="w-3.5 h-3.5" /> Follow-Up Actions
                        </p>
                        <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                          {r.follow_up_actions.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    {r.notes && (
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Notes</p>
                        <p className="text-sm text-blue-900">{r.notes}</p>
                      </div>
                    )}

                    {/* Smart Link Panel */}
                    <SmartLinkPanel sourceType="parent_partnership" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No contacts match filters.</p>
          )}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children Act 1989 — duty to promote contact and partnership with parents. Children&apos;s Homes Regulations 2015, Reg 7 — contact arrangements between children and their parents, relatives and friends. Working Together to Safeguard Children 2023 — multi-agency working and engagement with families. All contacts must be recorded accurately and made available for Ofsted inspection.</p>
        </div>
      </div>

      {/* ── new entry dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Family Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Young Person</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select young person" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Family Member Name</Label>
              <Input placeholder="e.g. Mark (birth father)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Relationship</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PARENT_RELATIONSHIP_TYPE_LABEL) as [ParentRelationshipType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Type</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PARENT_CONTACT_TYPE_LABEL) as [ParentContactType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" placeholder="e.g. 30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Engagement Level</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PARENT_ENGAGEMENT_LEVEL_LABEL) as [ParentEngagementLevel, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Initiated By</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PARENT_CONTACT_INITIATOR_LABEL) as [ParentContactInitiator, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea rows={3} placeholder="Describe the contact, how it went, and the quality of engagement…" />
            </div>
            <div>
              <Label>Concerns</Label>
              <Textarea rows={2} placeholder="Any concerns arising from this contact (leave blank if none)…" />
            </div>
            <div>
              <Label>Positive Outcomes</Label>
              <Textarea rows={2} placeholder="One per line…" />
            </div>
            <div>
              <Label>Follow-Up Actions</Label>
              <Textarea rows={2} placeholder="One per line…" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Additional notes…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
