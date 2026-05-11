"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA DECISION SUPPORT
// Per-child formulations + ranked recommended actions. ARIA drafts.
// Managers accept, modify, defer or reject before any record is updated.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Brain, RefreshCw, CheckCircle2, XCircle, Clock, Edit3 } from "lucide-react";
import {
  useDecisionSupport,
  useRunDecisionSupport,
  useUpdateRecommendation,
  useUpdateFormulation,
} from "@/hooks/use-aria-decision-support";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToAriaRole } from "@/lib/aria/aria-permissions";
import type {
  AriaFormulation,
  AriaDecisionRecommendation,
  AriaDecisionPriority,
  AriaFormulationFactorType,
} from "@/types/aria-studio";

const HOME_ID = "home_oak";

const PRIORITY_TONE: Record<AriaDecisionPriority, string> = {
  p1: "bg-rose-50 text-rose-800 border-rose-300",
  p2: "bg-orange-50 text-orange-800 border-orange-300",
  p3: "bg-amber-50 text-amber-800 border-amber-300",
  p4: "bg-slate-50 text-slate-700 border-slate-300",
};

const PRIORITY_LABEL: Record<AriaDecisionPriority, string> = {
  p1: "P1 · Urgent",
  p2: "P2 · High",
  p3: "P3 · Medium",
  p4: "P4 · Routine",
};

const FACTOR_TONE: Record<AriaFormulationFactorType, string> = {
  predisposing: "border-l-slate-400",
  precipitating: "border-l-orange-400",
  perpetuating: "border-l-rose-400",
  protective: "border-l-emerald-500",
};

function FactorRow({
  factor,
}: {
  factor: AriaFormulation["factors"][number];
}) {
  return (
    <div className={`border-l-4 pl-3 ${FACTOR_TONE[factor.factor_type]}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {factor.factor_type} · {(factor.confidence * 100).toFixed(0)}% conf.
      </div>
      <div className="text-sm font-medium">{factor.label}</div>
      <div className="text-xs text-muted-foreground">{factor.detail}</div>
    </div>
  );
}

function FormulationCard({
  formulation,
  onAction,
}: {
  formulation: AriaFormulation;
  onAction: (id: string, status: AriaFormulation["status"]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{formulation.title}</CardTitle>
            <CardDescription>
              Status: {formulation.status} · drafted{" "}
              {new Date(formulation.generated_at).toLocaleString()}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {formulation.factors.length} factor
            {formulation.factors.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {formulation.factors.map((f, i) => (
            <FactorRow key={i} factor={f} />
          ))}
        </div>
        {formulation.hypotheses.length > 0 && (
          <div className="rounded border bg-muted/40 p-3 text-xs">
            <div className="font-medium mb-1">Working hypotheses</div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              {formulation.hypotheses.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
        {formulation.recommended_focus.length > 0 && (
          <div className="rounded border p-3 text-xs">
            <div className="font-medium mb-1">Recommended focus</div>
            <ul className="list-disc pl-4 space-y-1">
              {formulation.recommended_focus.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {formulation.status !== "approved" && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onAction(formulation.id, "approved")}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(formulation.id, "in_review")}
            >
              <Edit3 className="mr-1 h-3 w-3" /> Mark in review
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(formulation.id, "rejected")}
            >
              <XCircle className="mr-1 h-3 w-3" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({
  recommendation,
  onAction,
}: {
  recommendation: AriaDecisionRecommendation;
  onAction: (
    id: string,
    status: AriaDecisionRecommendation["status"],
  ) => void;
}) {
  return (
    <Card className={`border ${PRIORITY_TONE[recommendation.priority]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{recommendation.title}</CardTitle>
            <CardDescription>
              {PRIORITY_LABEL[recommendation.priority]} ·{" "}
              {(recommendation.confidence * 100).toFixed(0)}% conf. · due{" "}
              {recommendation.due_date ?? "—"} · status: {recommendation.status}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-background">
            {recommendation.action.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs font-medium">Why ARIA suggests this</div>
          <div className="text-sm text-muted-foreground">
            {recommendation.rationale}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium">Expected impact</div>
          <div className="text-sm text-muted-foreground">
            {recommendation.expected_impact}
          </div>
        </div>
        {recommendation.status !== "completed" &&
          recommendation.status !== "rejected" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => onAction(recommendation.id, "accepted")}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(recommendation.id, "modified")}
              >
                <Edit3 className="mr-1 h-3 w-3" /> Modify
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(recommendation.id, "deferred")}
              >
                <Clock className="mr-1 h-3 w-3" /> Defer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(recommendation.id, "completed")}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(recommendation.id, "rejected")}
              >
                <XCircle className="mr-1 h-3 w-3" /> Reject
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

export default function DecisionSupportPage() {
  const { currentUser } = useAuthContext();
  const ariaRole = appRoleToAriaRole(
    currentUser?.role ?? "registered_manager",
  );

  const query = useDecisionSupport(HOME_ID);
  const run = useRunDecisionSupport();
  const updateRec = useUpdateRecommendation();
  const updateForm = useUpdateFormulation();

  const snapshot = query.data?.data;

  const handleRun = () => {
    run.mutate({
      home_id: HOME_ID,
      actor_id: currentUser?.id,
      actor_role: ariaRole,
    });
  };

  const handleRecAction = (
    id: string,
    status: AriaDecisionRecommendation["status"],
  ) => {
    updateRec.mutate({
      id,
      status,
      actor_id: currentUser?.id,
      actor_role: ariaRole,
    });
  };

  const handleFormAction = (id: string, status: AriaFormulation["status"]) => {
    updateForm.mutate({
      id,
      status,
      actor_id: currentUser?.id,
      actor_role: ariaRole,
    });
  };

  const sortedRecs = (snapshot?.recommendations ?? [])
    .slice()
    .sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) || b.confidence - a.confidence,
    );

  return (
    <PageShell
      title="ARIA Decision Support"
      subtitle="Drafted formulations and prioritised recommended actions. ARIA suggests — managers decide what becomes part of the official record."
      actions={
        <Button onClick={handleRun} disabled={run.isPending}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${run.isPending ? "animate-spin" : ""}`}
          />
          {run.isPending ? "Running…" : "Run engine"}
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Snapshot
                </CardTitle>
                <CardDescription>
                  {snapshot
                    ? `${snapshot.summary.formulations} formulation(s) · ${snapshot.summary.recommendations} recommendation(s) · ${snapshot.summary.high_confidence} high confidence`
                    : "Loading…"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          {snapshot && (
            <CardContent className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              <div className="rounded border bg-rose-50 p-2 text-rose-800">
                <div className="font-medium">P1</div>
                <div className="text-lg">{snapshot.summary.p1}</div>
              </div>
              <div className="rounded border bg-orange-50 p-2 text-orange-800">
                <div className="font-medium">P2</div>
                <div className="text-lg">{snapshot.summary.p2}</div>
              </div>
              <div className="rounded border bg-amber-50 p-2 text-amber-800">
                <div className="font-medium">P3</div>
                <div className="text-lg">{snapshot.summary.p3}</div>
              </div>
              <div className="rounded border bg-slate-50 p-2 text-slate-700">
                <div className="font-medium">P4</div>
                <div className="text-lg">{snapshot.summary.p4}</div>
              </div>
              <div className="rounded border bg-emerald-50 p-2 text-emerald-800">
                <div className="font-medium">High conf.</div>
                <div className="text-lg">{snapshot.summary.high_confidence}</div>
              </div>
            </CardContent>
          )}
        </Card>

        <section>
          <h2 className="text-sm font-semibold mb-2">Recommendations</h2>
          {sortedRecs.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No recommendations. Run the engine to draft a fresh set.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sortedRecs.map((r) => (
                <RecommendationCard
                  key={r.id}
                  recommendation={r}
                  onAction={handleRecAction}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-2">Formulations</h2>
          {(snapshot?.formulations.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No active formulations.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {snapshot!.formulations.map((f) => (
                <FormulationCard
                  key={f.id}
                  formulation={f}
                  onAction={handleFormAction}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
