"use client";

// ThresholdConsultationPanel — manager safeguarding-threshold consultation tool.
// Cara structures the thinking and drafts the formulation; the MANAGER records the
// statutory decision and rationale. Cara never decides.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, AlertTriangle } from "lucide-react";
import { useCaraThreshold, useCaraReview } from "@/hooks/use-cara-practice";

interface ThresholdResult {
  consultationId?: string | null;
  summary?: string;
  note?: string;
  requiresManagerReview?: boolean;
  threshold?: {
    immediateSafetyQuestion?: string;
    strategyDiscussionRecommended?: boolean;
    ladoConsultationRecommended?: boolean;
    emergencyActionRecommended?: boolean;
    managerSummary?: string;
  } | null;
  recommendations?: { title: string; detail: string; urgency: string }[];
}

export function ThresholdConsultationPanel({ childId, homeId }: { childId?: string; homeId?: string }) {
  const [concern, setConcern] = useState("");
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  const consult = useCaraThreshold();
  const review = useCaraReview();
  const r = (consult.data?.data ?? null) as ThresholdResult | null;
  const t = r?.threshold ?? null;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-red-50/50">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-600" /> Safeguarding threshold consultation
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Cara structures the consultation and drafts the formulation. <strong>You make the statutory decision.</strong></p>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="w-full min-h-[80px] rounded-md border border-slate-200 p-2 text-sm"
          placeholder="Describe the concern (what the child disclosed, the harm, the evidence)…"
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
        />
        <Button size="sm" onClick={() => consult.mutate({ childId, concern, homeId })} disabled={consult.isPending || concern.trim().length === 0}>
          {consult.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldAlert className="h-4 w-4 mr-1" />}
          Consult Cara
        </Button>
        {consult.isError && <p className="text-sm text-red-600">{(consult.error as Error)?.message}</p>}

        {r && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {t?.emergencyActionRecommended && <Badge className="bg-red-100 text-red-800 border-red-300"><AlertTriangle className="h-3 w-3 mr-1" />Emergency action — act first</Badge>}
              {t?.strategyDiscussionRecommended && <Badge variant="outline">Consider strategy discussion</Badge>}
              {t?.ladoConsultationRecommended && <Badge variant="outline">LADO relevance</Badge>}
              {r.requiresManagerReview && <Badge variant="outline" className="border-orange-300 text-orange-800">Manager review</Badge>}
            </div>
            {t?.immediateSafetyQuestion && <p className="text-sm font-medium text-red-700">{t.immediateSafetyQuestion}</p>}
            {t?.managerSummary && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Draft formulation (edit before use)</h4>
                <textarea className="w-full min-h-[180px] rounded-md border border-slate-200 p-2 text-sm font-mono" defaultValue={t.managerSummary} />
              </div>
            )}
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">Manager decision (Cara does not decide this)</h4>
              <input className="w-full rounded-md border border-slate-200 p-2 text-sm" placeholder="Decision (e.g. threshold met / not met; strategy discussion requested)" value={decision} onChange={(e) => setDecision(e.target.value)} />
              <textarea className="w-full min-h-[60px] rounded-md border border-slate-200 p-2 text-sm" placeholder="Rationale for the decision…" value={rationale} onChange={(e) => setRationale(e.target.value)} />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!r.consultationId || review.isPending || !decision.trim() || !rationale.trim()}
                  onClick={() => r.consultationId && review.mutate({ entity: "threshold", id: r.consultationId, decision, rationale })}
                >
                  {review.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save decision
                </Button>
                {review.isSuccess && <span className="text-[11px] text-emerald-700">Decision saved to record.</span>}
                {review.isError && <span className="text-[11px] text-red-600">{(review.error as Error)?.message}</span>}
                {!r.consultationId && <span className="text-[11px] text-muted-foreground">Provide a childId to persist the decision.</span>}
              </div>
              <p className="text-[11px] text-muted-foreground">{r.note}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
