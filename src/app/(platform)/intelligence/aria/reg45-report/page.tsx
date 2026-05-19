"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA REG 45 REPORT BUILDER
// Composes a draft Regulation 45 report from manager-accepted evidence.
// ARIA drafts; the manager reviews, edits, approves and locks. Locked
// reports are immutable and feed Annex A Section 9 evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  FileText, RefreshCw, Lock, CheckCircle2, ClipboardList, Send, Save,
} from "lucide-react";
import {
  useReg45Reports,
  useBuildReg45Report,
  useEditReg45Report,
  useSetReg45ReportStatus,
} from "@/hooks/use-aria-reg45-report";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToAriaRole } from "@/lib/aria/aria-permissions";
import type { AriaReg45Report, AriaReg45Theme } from "@/types/aria-studio";

const HOME_ID = "home_oak";

const STATUS_TONE: Record<AriaReg45Report["status"], string> = {
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  locked: "bg-indigo-100 text-indigo-800",
};

export default function Reg45ReportPage() {
  const { currentUser } = useAuthContext();
  const ariaRole = appRoleToAriaRole(currentUser?.role ?? "registered_manager");

  const query = useReg45Reports(HOME_ID);
  const build = useBuildReg45Report();
  const edit = useEditReg45Report();
  const setStatus = useSetReg45ReportStatus();

  const reports = query.data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? reports[0] ?? null,
    [reports, selectedId],
  );

  // Local edit buffers
  const [title, setTitle] = useState("");
  const [exec, setExec] = useState("");
  const [sectionText, setSectionText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setExec(current.executive_summary);
      const map: Record<string, string> = {};
      for (const s of current.sections) map[s.theme] = s.narrative;
      setSectionText(map);
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuild = () => {
    build.mutate(
      {
        home_id: HOME_ID,
        actor_id: currentUser?.id,
        actor_role: ariaRole,
      },
      {
        onSuccess: (res) => setSelectedId(res.data.id),
      },
    );
  };

  const handleSave = () => {
    if (!current) return;
    const narratives: Partial<Record<AriaReg45Theme, string>> = {};
    for (const s of current.sections) {
      narratives[s.theme] = sectionText[s.theme] ?? s.narrative;
    }
    edit.mutate({
      id: current.id,
      title,
      executive_summary: exec,
      section_narratives: narratives,
      actor_id: currentUser?.id,
      actor_role: ariaRole,
    });
  };

  const handleStatus = (status: AriaReg45Report["status"]) => {
    if (!current) return;
    setStatus.mutate({
      id: current.id,
      status,
      actor_id: currentUser?.id,
      actor_role: ariaRole,
    });
  };

  const isLocked = current?.status === "locked";

  return (
    <PageShell
      title="Regulation 45 — Report Builder"
      subtitle="ARIA composes a draft report from manager-accepted evidence. The Registered Manager reviews, edits, approves and locks the final report."
      actions={
        <Button onClick={handleBuild} disabled={build.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${build.isPending ? "animate-spin" : ""}`} />
          {build.isPending ? "Building…" : "Build new draft"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="h-4 w-4" /> Reports
            </CardTitle>
            <CardDescription className="text-xs">
              {reports.length} report{reports.length === 1 ? "" : "s"} on file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {reports.length === 0 && (
              <div className="text-muted-foreground">
                No reports yet. Click "Build new draft".
              </div>
            )}
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full rounded border p-2 text-left ${
                  current?.id === r.id ? "border-primary" : ""
                }`}
              >
                <div className="font-medium">{r.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className={STATUS_TONE[r.status]}>
                    {r.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-muted-foreground">
                    {r.total_evidence} item{r.total_evidence === 1 ? "" : "s"}
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!current ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Build a draft to begin. ARIA will pull all manager-accepted
                Reg 45 evidence into a themed report you can review and edit.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isLocked ? (
                        <CardTitle className="text-base">{current.title}</CardTitle>
                      ) : (
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full rounded border px-2 py-1 text-base font-semibold"
                        />
                      )}
                      <CardDescription className="mt-1 text-xs">
                        {current.period_start} → {current.period_end} · drafted{" "}
                        {new Date(current.generated_at).toLocaleString()} by{" "}
                        {current.generated_by}
                        {current.locked_at && (
                          <>
                            {" "}· locked {new Date(current.locked_at).toLocaleString()}{" "}
                            by {current.locked_by}
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={STATUS_TONE[current.status]}>
                      {current.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded border bg-slate-50 p-2 text-slate-700">
                    <div className="font-medium">Evidence</div>
                    <div className="text-lg">{current.total_evidence}</div>
                  </div>
                  <div className="rounded border bg-rose-50 p-2 text-rose-800">
                    <div className="font-medium">Concerns</div>
                    <div className="text-lg">{current.total_concerns}</div>
                  </div>
                  <div className="rounded border bg-emerald-50 p-2 text-emerald-800">
                    <div className="font-medium">Positives</div>
                    <div className="text-lg">{current.total_positives}</div>
                  </div>
                  <div className="rounded border bg-indigo-50 p-2 text-indigo-800">
                    <div className="font-medium">Sections</div>
                    <div className="text-lg">{current.sections.length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" /> Executive summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLocked ? (
                    <div className="whitespace-pre-wrap text-sm">{current.executive_summary}</div>
                  ) : (
                    <Textarea
                      value={exec}
                      onChange={(e) => setExec(e.target.value)}
                      rows={5}
                    />
                  )}
                </CardContent>
              </Card>

              {current.sections.map((s) => (
                <Card key={s.theme}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm">{s.label}</CardTitle>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {s.evidence_item_ids.length} item(s)
                        </Badge>
                        {s.concerns > 0 && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-800 text-[10px]">
                            {s.concerns} concern(s)
                          </Badge>
                        )}
                        {s.positives > 0 && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 text-[10px]">
                            {s.positives} positive(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLocked ? (
                      <div className="whitespace-pre-wrap text-sm">{s.narrative}</div>
                    ) : (
                      <Textarea
                        value={sectionText[s.theme] ?? s.narrative}
                        onChange={(e) =>
                          setSectionText((prev) => ({ ...prev, [s.theme]: e.target.value }))
                        }
                        rows={6}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}

              {!isLocked && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleSave} disabled={edit.isPending}>
                    <Save className="mr-1 h-4 w-4" />
                    {edit.isPending ? "Saving…" : "Save edits"}
                  </Button>
                  {current.status === "draft" && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatus("in_review")}
                      disabled={setStatus.isPending}
                    >
                      <Send className="mr-1 h-4 w-4" /> Send for review
                    </Button>
                  )}
                  {(current.status === "draft" || current.status === "in_review") && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatus("approved")}
                      disabled={setStatus.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  )}
                  {current.status === "approved" && (
                    <Button
                      onClick={() => handleStatus("locked")}
                      disabled={setStatus.isPending}
                    >
                      <Lock className="mr-1 h-4 w-4" /> Lock report
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
