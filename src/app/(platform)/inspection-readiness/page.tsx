"use client";

import { PageShell } from "@/components/layout/page-shell";
import { api } from "@/hooks/use-api";
import { useQuery } from "@tanstack/react-query";
import { daysFromNow, todayStr } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnnexASection {
  key: string;
  label: string;
  evidence_count: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
}

interface AnnexAData {
  readiness_score: number;
  total_evidence: number;
  approved_evidence: number;
  pending_evidence: number;
  sections: AnnexASection[];
}

interface Reg45Item {
  id: string;
  manager_decision: string;
  suggested_theme: string;
}

interface AnnexAItem {
  id: string;
  manager_decision: string;
  annex_section: string;
}

interface ManagementOversightItem {
  id: string;
  status: string;
  priority: string;
}

interface Reg40Item {
  id: string;
  triage_status: string;
  priority: string;
}

interface CareEvent {
  id: string;
  status: string;
  category: string;
  is_significant: boolean;
  requires_manager_review: boolean;
  contributes_to_reg45: boolean;
  contributes_to_annex_a: boolean;
  event_date: string;
}

interface FilingItem {
  id: string;
  is_verified: boolean;
  category: string;
}

interface SavedTimeMeta {
  total_minutes: number;
  total_hours: number;
  total_entries: number;
  estimated_value_gbp: number;
  by_staff: Record<string, { minutes: number; count: number; name: string }>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useAnnexAReadiness() {
  return useQuery<{ data: AnnexAData }>({
    queryKey: ["annex-a-readiness"],
    queryFn: () => api.get("/api/v1/annex-a-readiness"),
    staleTime: 60_000,
  });
}

function useReg45Evidence() {
  return useQuery<{ data: Reg45Item[]; meta: { total: number; pending: number; approved: number } }>({
    queryKey: ["reg45-evidence"],
    queryFn: () => api.get("/api/v1/reg45-evidence"),
    staleTime: 60_000,
  });
}

function useManagementOversight() {
  return useQuery<{ data: ManagementOversightItem[]; meta: { total: number; pending: number } }>({
    queryKey: ["management-oversight"],
    queryFn: () => api.get("/api/v1/management-oversight"),
    staleTime: 60_000,
  });
}

function useReg40Triage() {
  return useQuery<{ data: Reg40Item[]; meta: { total: number; pending: number } }>({
    queryKey: ["reg40-triage"],
    queryFn: () => api.get("/api/v1/reg40-triage"),
    staleTime: 60_000,
  });
}

function useCareEventsSummary() {
  const thirtyDaysAgo = daysFromNow(-30);
  return useQuery<{ data: CareEvent[]; meta: { total: number } }>({
    queryKey: ["care-events-inspection", thirtyDaysAgo],
    queryFn: () => api.get(`/api/v1/care-events?from_date=${thirtyDaysAgo}`),
    staleTime: 60_000,
  });
}

function useFilingCabinetSummary() {
  return useQuery<{ data: FilingItem[]; meta: { total: number; verified: number; unverified: number; category_counts: Record<string, number> } }>({
    queryKey: ["filing-cabinet-inspection"],
    queryFn: () => api.get("/api/v1/filing-cabinet"),
    staleTime: 60_000,
  });
}

function useSavedTimeSummary() {
  return useQuery<{ metrics: unknown[]; meta: SavedTimeMeta }>({
    queryKey: ["saved-time-inspection"],
    queryFn: () => api.get("/api/v1/saved-time"),
    staleTime: 60_000,
  });
}

// ── Status badge helpers ──────────────────────────────────────────────────────

function ReadinessScore({ score }: { score: number }) {
  const colour =
    score >= 80 ? "text-green-700 bg-green-50 border-green-200" :
    score >= 60 ? "text-yellow-700 bg-yellow-50 border-yellow-200" :
    "text-red-700 bg-red-50 border-red-200";
  const label = score >= 80 ? "Ready" : score >= 60 ? "Needs Attention" : "Action Required";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${colour}`}>
      <span className="text-2xl font-bold">{score}%</span>
      <span>{label}</span>
    </div>
  );
}

function StatusPill({ label, colour }: { label: string; colour: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colour}`}>
      {label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  sub,
  colour,
  href,
}: {
  title: string;
  value: string | number;
  sub?: string;
  colour: "green" | "yellow" | "red" | "blue" | "purple" | "neutral";
  href?: string;
}) {
  const colours = {
    green: "border-l-4 border-l-green-400 bg-green-50",
    yellow: "border-l-4 border-l-yellow-400 bg-yellow-50",
    red: "border-l-4 border-l-red-400 bg-red-50",
    blue: "border-l-4 border-l-blue-400 bg-blue-50",
    purple: "border-l-4 border-l-purple-400 bg-purple-50",
    neutral: "border-l-4 border-l-slate-300 bg-slate-50",
  }[colour];

  return (
    <div className={`rounded-lg p-4 ${colours}`}>
      <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {href && (
        <a href={href} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          View →
        </a>
      )}
    </div>
  );
}

function SectionBar({ label, approved, pending, total }: { label: string; approved: number; pending: number; total: number }) {
  const approvedPct = total > 0 ? (approved / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700 truncate max-w-xs">{label}</span>
        <span className="text-slate-500 ml-2 shrink-0">{approved}/{total}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
        <div className="h-full bg-green-500 transition-all" style={{ width: `${approvedPct}%` }} />
        <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pendingPct}%` }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InspectionReadinessPage() {
  const annexA = useAnnexAReadiness();
  const reg45 = useReg45Evidence();
  const oversight = useManagementOversight();
  const reg40 = useReg40Triage();
  const careEvents = useCareEventsSummary();
  const filingCabinet = useFilingCabinetSummary();
  const savedTime = useSavedTimeSummary();

  const annexAData = annexA.data?.data;
  const reg45Data = reg45.data;
  const oversightData = oversight.data;
  const reg40Data = reg40.data;
  const ceData = careEvents.data;
  const filingData = filingCabinet.data;
  const savedTimeData = savedTime.data;

  // Derive care event stats
  const events30 = ceData?.data ?? [];
  const verifiedEvents = events30.filter((e) => e.status === "verified" || e.status === "locked").length;
  const pendingReviewEvents = events30.filter((e) => e.status === "manager_review_required").length;
  const returnedEvents = events30.filter((e) => e.status === "returned").length;
  const significantEvents = events30.filter((e) => e.is_significant).length;
  const reg45Contributing = events30.filter((e) => e.contributes_to_reg45).length;
  const annexAContributing = events30.filter((e) => e.contributes_to_annex_a).length;

  const readinessScore = annexAData?.readiness_score ?? 0;
  const overallColour =
    readinessScore >= 80 ? "green" :
    readinessScore >= 60 ? "yellow" : "red";

  const isLoading =
    annexA.isLoading ||
    reg45.isLoading ||
    oversight.isLoading ||
    reg40.isLoading ||
    careEvents.isLoading ||
    filingCabinet.isLoading ||
    savedTime.isLoading;

  return (
    <PageShell
      title="Inspection Readiness"
      subtitle="Live connected view of compliance status — Annex A, Regulation 45, Management Oversight, Reg 40, Filing and Saved Time"
      ariaContext={{ pageTitle: "Inspection Readiness", sourceType: "document" }}
      actions={<AriaStudioQuickActionButton context={{ record_type: "annex_a", record_id: "home_oak", home_id: "home_oak" }} />}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading readiness data…</div>
      ) : (
        <div className="space-y-8">

          {/* ── Overall Readiness Score ── */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Overall Inspection Readiness</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Based on {annexAData?.total_evidence ?? 0} evidence items across {annexAData?.sections?.length ?? 0} Annex A sections.
                  Snapshot as of {todayStr()}.
                </p>
              </div>
              <ReadinessScore score={readinessScore} />
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              <StatusPill
                label={`${annexAData?.approved_evidence ?? 0} Annex A approved`}
                colour="bg-green-100 text-green-800"
              />
              <StatusPill
                label={`${annexAData?.pending_evidence ?? 0} Annex A pending`}
                colour="bg-yellow-100 text-yellow-800"
              />
              <StatusPill
                label={`${reg45Data?.meta?.approved ?? 0} Reg 45 approved`}
                colour="bg-blue-100 text-blue-800"
              />
              <StatusPill
                label={`${reg45Data?.meta?.pending ?? 0} Reg 45 awaiting review`}
                colour={reg45Data?.meta?.pending ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-600"}
              />
              <StatusPill
                label={`${oversightData?.meta?.pending ?? 0} oversight items outstanding`}
                colour={oversightData?.meta?.pending ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"}
              />
              <StatusPill
                label={`${reg40Data?.meta?.pending ?? 0} Reg 40 pending`}
                colour={reg40Data?.meta?.pending ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}
              />
            </div>
          </section>

          {/* ── Four Quadrant Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Care Events (last 30 days) */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Care Events — Last 30 Days</h2>
                <a href="/care-events" className="text-xs text-blue-600 hover:underline">View all →</a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard title="Total Events" value={events30.length} colour="neutral" />
                <MetricCard title="Verified" value={verifiedEvents} colour="green" />
                <MetricCard title="Pending Review" value={pendingReviewEvents} colour={pendingReviewEvents > 0 ? "yellow" : "neutral"} />
                <MetricCard title="Returned" value={returnedEvents} colour={returnedEvents > 0 ? "red" : "neutral"} />
                <MetricCard title="Significant" value={significantEvents} colour="purple" />
                <MetricCard title="Reg 45 Contributing" value={reg45Contributing} colour="blue" />
              </div>
            </section>

            {/* Annex A Readiness */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Annex A Readiness</h2>
                <a href="/annex-a" className="text-xs text-blue-600 hover:underline">View Annex A →</a>
              </div>
              {annexAData?.sections && annexAData.sections.length > 0 ? (
                <div className="space-y-3">
                  {annexAData.sections.map((s) => (
                    <SectionBar
                      key={s.key}
                      label={s.label}
                      approved={s.approved_count}
                      pending={s.pending_count}
                      total={s.evidence_count}
                    />
                  ))}
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Approved</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Pending</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4">No Annex A evidence yet.</p>
              )}
            </section>

            {/* Regulation 45 */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Regulation 45 Evidence</h2>
                <a href="/regulation-45" className="text-xs text-blue-600 hover:underline">View Reg 45 →</a>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MetricCard title="Total" value={reg45Data?.meta?.total ?? 0} colour="neutral" />
                <MetricCard title="Approved" value={reg45Data?.meta?.approved ?? 0} colour="green" />
                <MetricCard title="Pending" value={reg45Data?.meta?.pending ?? 0} colour={reg45Data?.meta?.pending ? "yellow" : "neutral"} />
              </div>
              {reg45Contributing > 0 && (
                <p className="text-xs text-slate-500">
                  {reg45Contributing} care event{reg45Contributing !== 1 ? "s" : ""} from the last 30 days contribute to Regulation 45.
                </p>
              )}
              {reg45Data?.data && reg45Data.data.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {reg45Data.data.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-1.5">
                      <span className="capitalize">{item.suggested_theme || "General"}</span>
                      <StatusPill
                        label={item.manager_decision}
                        colour={
                          item.manager_decision === "approved" ? "bg-green-100 text-green-700" :
                          item.manager_decision === "rejected" ? "bg-red-100 text-red-700" :
                          item.manager_decision === "deferred" ? "bg-orange-100 text-orange-700" :
                          "bg-yellow-100 text-yellow-700"
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Management Oversight + Reg 40 */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Management Queues</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Management Oversight</span>
                    <a href="/management-oversight" className="text-xs text-blue-600 hover:underline">View →</a>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard title="Total items" value={oversightData?.meta?.total ?? 0} colour="neutral" />
                    <MetricCard title="Pending" value={oversightData?.meta?.pending ?? 0} colour={oversightData?.meta?.pending ? "yellow" : "green"} />
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Regulation 40 Triage</span>
                    <a href="/regulation-40" className="text-xs text-blue-600 hover:underline">View →</a>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard title="Total items" value={reg40Data?.meta?.total ?? 0} colour="neutral" />
                    <MetricCard
                      title="Pending"
                      value={reg40Data?.meta?.pending ?? 0}
                      colour={reg40Data?.meta?.pending ? "red" : "green"}
                      sub={reg40Data?.meta?.pending ? "Action required" : undefined}
                    />
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* ── Filing Cabinet + Saved Time ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Filing Cabinet</h2>
                <a href="/filing-cabinet" className="text-xs text-blue-600 hover:underline">View →</a>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard title="Total filed" value={filingData?.meta?.total ?? 0} colour="neutral" />
                <MetricCard title="Verified" value={filingData?.meta?.verified ?? 0} colour="green" />
                <MetricCard title="Unverified" value={filingData?.meta?.unverified ?? 0} colour={filingData?.meta?.unverified ? "yellow" : "neutral"} />
                <MetricCard
                  title="Categories"
                  value={Object.keys(filingData?.meta?.category_counts ?? {}).length}
                  colour="blue"
                />
              </div>
              {filingData?.meta?.category_counts && Object.keys(filingData.meta.category_counts).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(filingData.meta.category_counts).map(([cat, count]) => (
                    <span key={cat} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full capitalize">
                      {cat.replace(/_/g, " ")} ({count})
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Time Saved by Routing</h2>
                <a href="/saved-time" className="text-xs text-blue-600 hover:underline">View →</a>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard
                  title="Total hours saved"
                  value={savedTimeData?.meta ? `${savedTimeData.meta.total_hours}h` : "0h"}
                  colour="purple"
                />
                <MetricCard
                  title="Estimated value"
                  value={savedTimeData?.meta ? `£${Math.round(savedTimeData.meta.estimated_value_gbp)}` : "£0"}
                  colour="green"
                />
                <MetricCard
                  title="Routing events"
                  value={savedTimeData?.meta?.total_entries ?? 0}
                  colour="neutral"
                />
                <MetricCard
                  title="Staff benefiting"
                  value={Object.keys(savedTimeData?.meta?.by_staff ?? {}).length}
                  colour="blue"
                />
              </div>
              {savedTimeData?.meta && (
                <p className="text-xs text-slate-500">
                  Auto-routing has saved an estimated {savedTimeData.meta.total_minutes} minutes of administrative time
                  across {Object.keys(savedTimeData.meta.by_staff ?? {}).length} staff members.
                </p>
              )}
            </section>

          </div>

          {/* ── Quick Links ── */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Care Events", href: "/care-events" },
                { label: "Management Oversight", href: "/management-oversight" },
                { label: "Reg 40 Triage", href: "/regulation-40" },
                { label: "Reg 45 Evidence", href: "/regulation-45" },
                { label: "Annex A", href: "/annex-a" },
                { label: "Filing Cabinet", href: "/filing-cabinet" },
                { label: "Saved Time", href: "/saved-time" },
                { label: "Audit Trail", href: "/audit-trail" },
                { label: "Child Summaries", href: "/child-daily-summaries" },
                { label: "Inspection Pack", href: "/inspection-readiness-pack" },
                { label: "Inspection", href: "/inspection" },
                { label: "Activity Feed", href: "/activity-log" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-center text-center text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>

        </div>
      )}
      <CareEventsPanel
        title="Care Events — Compliance Evidence"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Inspection Readiness — Annex A completeness, Reg 45, management oversight, Reg 40, filing, Ofsted evidence, compliance gaps, readiness score, documentation status"
        recordType="annex_a"
        className="mt-6"
      />
    </PageShell>
  );
}
