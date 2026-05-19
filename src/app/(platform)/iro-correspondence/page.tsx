"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ArrowUpDown, ArrowDownLeft, ArrowUpRight, AlertTriangle, Clock,
  ChevronDown, ChevronUp, Mail, Inbox, Send, Shield, FileText,
  CheckCircle2, Paperclip, User, Calendar, Scale, Eye, Loader2,
} from "lucide-react";
import { useIroCorrespondences } from "@/hooks/use-iro-correspondences";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { IroCorrespondence, IroCorrespondenceType, IroActionStatus, IroRequiredAction } from "@/types/extended";
import { IRO_CORRESPONDENCE_TYPE_LABEL, IRO_ACTION_STATUS_LABEL, IRO_DIRECTION_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ──────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── colour maps ──────────────────────────────────────────────────────── */

const TYPE_COLOUR: Record<IroCorrespondenceType, string> = {
  pre_lac_review:       "bg-blue-100 text-blue-700",
  post_lac_review:      "bg-green-100 text-green-700",
  formal_dispute:       "bg-red-100 text-red-700",
  information_request:  "bg-amber-100 text-amber-700",
  concern_raised:       "bg-orange-100 text-orange-700",
  update_from_home:     "bg-indigo-100 text-indigo-700",
  mid_review_check_in:  "bg-purple-100 text-purple-700",
  statutory_action:     "bg-rose-100 text-rose-700",
};

const STATUS_COLOUR: Record<IroActionStatus, string> = {
  outstanding:  "bg-red-100 text-red-700",
  in_progress:  "bg-amber-100 text-amber-700",
  complete:     "bg-green-100 text-green-700",
};

/* ── component ────────────────────────────────────────────────────────── */

export default function IroCorrespondencePage() {
  const { data: res, isLoading } = useIroCorrespondences();
  const records: IroCorrespondence[] = res?.data ?? [];
  const [ypFilter, setYpFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── filtering & sorting ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (ypFilter !== "all") list = list.filter(r => r.child_id === ypFilter);
    if (typeFilter !== "all") list = list.filter(r => r.correspondence_type === typeFilter);
    if (directionFilter !== "all") list = list.filter(r => r.direction === directionFilter);
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.date.localeCompare(a.date);
        case "oldest": return a.date.localeCompare(b.date);
        case "deadline": {
          const ad = a.response_required && !a.response_sent ? a.response_deadline : "9999-12-31";
          const bd = b.response_required && !b.response_sent ? b.response_deadline : "9999-12-31";
          return ad.localeCompare(bd);
        }
        default: return 0;
      }
    });
    return list;
  }, [records, ypFilter, typeFilter, directionFilter, sortBy]);

  /* ── stats ────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = d(0);
    const ninetyAgo = d(-90);
    return {
      active: records.filter(r => !r.filed).length,
      awaiting: records.filter(r => r.response_required && !r.response_sent).length,
      disputes: records.filter(r => r.formal_dispute).length,
      thisQuarter: records.filter(r => r.date >= ninetyAgo && r.date <= today).length,
    };
  }, [records]);

  /* ── overdue alert ────────────────────────────────────────────────────── */
  const overdue = useMemo(
    () => records.filter(r => r.response_required && !r.response_sent && r.response_deadline < d(0)),
    [records]
  );

  /* ── unique children for filter ──────────────────────────────────────── */
  const childIds = useMemo(() => [...new Set(records.map(r => r.child_id))], [records]);

  /* ── export ───────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<IroCorrespondence>[] = [
    { header: "ID",                  accessor: (r: IroCorrespondence) => r.id },
    { header: "Date",                accessor: (r: IroCorrespondence) => r.date },
    { header: "Young Person",        accessor: (r: IroCorrespondence) => getYPName(r.child_id) },
    { header: "IRO Name",            accessor: (r: IroCorrespondence) => r.iro_name },
    { header: "Local Authority",     accessor: (r: IroCorrespondence) => r.iro_local_authority },
    { header: "Direction",           accessor: (r: IroCorrespondence) => IRO_DIRECTION_LABEL[r.direction] },
    { header: "Type",                accessor: (r: IroCorrespondence) => IRO_CORRESPONDENCE_TYPE_LABEL[r.correspondence_type] },
    { header: "Subject",             accessor: (r: IroCorrespondence) => r.subject },
    { header: "Summary",             accessor: (r: IroCorrespondence) => r.summary },
    { header: "Key Points",          accessor: (r: IroCorrespondence) => r.key_points.join(" | ") },
    { header: "Actions Required",    accessor: (r: IroCorrespondence) => r.actions_required.map((a: IroRequiredAction) => `${a.action} [${a.owner} — ${a.deadline} — ${IRO_ACTION_STATUS_LABEL[a.status]}]`).join(" | ") },
    { header: "Response Required",   accessor: (r: IroCorrespondence) => r.response_required ? "Yes" : "No" },
    { header: "Response Deadline",   accessor: (r: IroCorrespondence) => r.response_deadline || "" },
    { header: "Response Sent",       accessor: (r: IroCorrespondence) => r.response_sent ? "Yes" : "No" },
    { header: "Response Sent Date",  accessor: (r: IroCorrespondence) => r.response_sent_date || "" },
    { header: "Attachments",         accessor: (r: IroCorrespondence) => r.attachments.join(" | ") },
    { header: "Formal Dispute",      accessor: (r: IroCorrespondence) => r.formal_dispute ? "Yes" : "No" },
    { header: "Authored By",         accessor: (r: IroCorrespondence) => r.authored_by ? getStaffName(r.authored_by) : "" },
    { header: "Received By",         accessor: (r: IroCorrespondence) => r.received_by ? getStaffName(r.received_by) : "" },
    { header: "Copied To",           accessor: (r: IroCorrespondence) => r.copied_to.join(" | ") },
    { header: "Filed",               accessor: (r: IroCorrespondence) => r.filed ? "Yes" : "No" },
  ];

  if (isLoading) return <PageShell title="IRO Correspondence" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="IRO Correspondence"
      subtitle="Letters, emails, and formal escalations with Independent Reviewing Officers"
      ariaContext={{ pageTitle: "IRO Correspondence", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="IRO Correspondence" />
          <ExportButton data={filtered} columns={exportCols} filename="iro-correspondence" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active correspondence", value: stats.active,      icon: Mail,           c: "text-blue-600"   },
          { label: "Awaiting response",     value: stats.awaiting,    icon: Clock,          c: "text-amber-600"  },
          { label: "Formal disputes",       value: stats.disputes,    icon: Scale,          c: "text-red-600"    },
          { label: "This quarter",          value: stats.thisQuarter, icon: FileText,       c: "text-indigo-600" },
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

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold">
              {overdue.length} response{overdue.length !== 1 ? "s" : ""} overdue
            </p>
            <p className="text-xs mt-0.5">
              Statutory IRO correspondence with passed response deadlines. Prioritise these to avoid escalation.
            </p>
          </div>
        </div>
      )}

      {stats.disputes > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mb-6 flex items-start gap-3">
          <Scale className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">
              {stats.disputes} formal dispute resolution{stats.disputes !== 1 ? "s" : ""} on file
            </p>
            <p className="text-xs mt-0.5">
              Formal disputes are statutory escalations under the IRO Handbook 2010. All correspondence must be retained for the duration of the placement.
            </p>
          </div>
        </div>
      )}

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={ypFilter} onValueChange={setYpFilter}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Young person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All young people</SelectItem>
            {childIds.map(id => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.entries(IRO_CORRESPONDENCE_TYPE_LABEL) as [IroCorrespondenceType, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Direction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="from_iro">From IRO</SelectItem>
            <SelectItem value="to_iro">To IRO</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="deadline">Response deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(ypFilter !== "all" || typeFilter !== "all" || directionFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Cards ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No IRO correspondence matches the current filters</p>
          </div>
        )}

        {filtered.map(r => {
          const isOpen = expandedId === r.id;
          const fromIro = r.direction === "from_iro";
          const Icon = fromIro ? Inbox : Send;
          const overdueResp = r.response_required && !r.response_sent && r.response_deadline < d(0);

          return (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                fromIro ? "border-l-4 border-l-purple-400" : "border-l-4 border-l-blue-400",
                r.formal_dispute && "ring-1 ring-red-200"
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  "rounded-full p-1.5 shrink-0",
                  fromIro ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                )}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{r.subject}</span>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                      fromIro ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {fromIro
                        ? <><ArrowDownLeft className="h-3 w-3" /> From IRO</>
                        : <><ArrowUpRight className="h-3 w-3" /> To IRO</>}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", TYPE_COLOUR[r.correspondence_type])}>
                      {IRO_CORRESPONDENCE_TYPE_LABEL[r.correspondence_type]}
                    </span>
                    {r.formal_dispute && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        <Scale className="h-3 w-3" /> Formal dispute
                      </span>
                    )}
                    {overdueResp && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Response overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getYPName(r.child_id)} · {r.iro_name} ({r.iro_local_authority}) · {r.date}
                    {r.attachments.length > 0 && (
                      <> · <Paperclip className="inline h-3 w-3 mx-0.5" />{r.attachments.length}</>
                    )}
                  </p>
                </div>

                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                  {/* Meta grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Young person</p>
                      <p className="font-medium">{getYPName(r.child_id)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IRO</p>
                      <p className="font-medium">{r.iro_name}</p>
                      <p className="text-muted-foreground">{r.iro_local_authority}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{fromIro ? "Received by" : "Authored by"}</p>
                      <p className="font-medium">
                        {fromIro
                          ? (r.received_by ? getStaffName(r.received_by) : "—")
                          : (r.authored_by ? getStaffName(r.authored_by) : "—")}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                    <p className="text-sm">{r.summary}</p>
                  </div>

                  {/* Key points */}
                  {r.key_points.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key points</p>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {r.key_points.map((kp, i) => <li key={i}>{kp}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {r.actions_required.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Actions required</p>
                      <div className="space-y-1.5">
                        {r.actions_required.map((a: IroRequiredAction, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm rounded border bg-card p-2">
                            <CheckCircle2 className={cn(
                              "h-4 w-4 shrink-0 mt-0.5",
                              a.status === "complete" ? "text-green-600" :
                              a.status === "in_progress" ? "text-amber-600" : "text-red-600"
                            )} />
                            <div className="flex-1">
                              <p>{a.action}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {getStaffName(a.owner)} · due {a.deadline}
                              </p>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs h-fit", STATUS_COLOUR[a.status])}>
                              {IRO_ACTION_STATUS_LABEL[a.status]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response tracking */}
                  <div className="grid grid-cols-2 gap-3 text-xs rounded-md border bg-card p-3">
                    <div>
                      <p className="text-muted-foreground">Response required</p>
                      <p className="font-medium">{r.response_required ? "Yes" : "No"}</p>
                    </div>
                    {r.response_required && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Response deadline</p>
                          <p className={cn("font-medium", overdueResp && "text-red-600")}>
                            {r.response_deadline || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Response sent</p>
                          <p className="font-medium">{r.response_sent ? "Yes" : "No"}</p>
                        </div>
                        {r.response_sent && (
                          <div>
                            <p className="text-muted-foreground">Sent on</p>
                            <p className="font-medium">{r.response_sent_date}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Attachments / copies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Attachments</p>
                      {r.attachments.length === 0
                        ? <p className="text-muted-foreground italic">None</p>
                        : (
                          <ul className="space-y-1">
                            {r.attachments.map((a, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <Paperclip className="h-3 w-3 text-muted-foreground" /> {a}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Copied to</p>
                      {r.copied_to.length === 0
                        ? <p className="text-muted-foreground italic">None</p>
                        : (
                          <ul className="space-y-1">
                            {r.copied_to.map((c, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-muted-foreground" /> {c}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {r.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {r.filed ? "Filed in case record" : "Open — not yet filed"}
                    </span>
                  </div>

                  <SmartLinkPanel sourceType="iro-correspondences" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">IRO independence and statutory role</p>
            <p>
              The Independent Reviewing Officer is a statutory safeguard for every looked-after child.
              Under the <strong>IRO Handbook 2010</strong> and <strong>Quality Standard 4 (Care Planning)</strong>,
              the IRO must act independently of the local authority and the placement, monitor the child&apos;s
              care plan, ensure the child&apos;s wishes and feelings are reflected in decisions, and challenge
              any drift or delay. A clear correspondence trail evidences the home&apos;s openness to that
              independent oversight.
            </p>
            <p>
              All written communication with the IRO — pre- and post-review, mid-review check-ins,
              information requests, concerns, and formal dispute resolution — must be retained on the
              child&apos;s case file for the duration of the placement and made available to Ofsted on request.
              Concerns raised by the IRO and any formal dispute resolution steps must be acknowledged
              promptly and acted on within agreed timescales.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Professional Contact"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="IRO Correspondence — Independent Reviewing Officer, LAC review oversight, IRO challenges, care plan disputes, statutory reviews, consultation responses, Annex A evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
