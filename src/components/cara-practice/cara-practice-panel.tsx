"use client";

// CaraPracticePanel — embeddable "Run Cara" panel for any record/assessment.
// Cara recognises weak practice and advises; managers decide. Editable text in,
// structured intelligence out (summary, scores, flags, reflective questions,
// recommendations, next-best-actions).

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, ShieldAlert, HelpCircle, ListChecks, Loader2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useCaraPracticeAnalyse, type AnalyseInput } from "@/hooks/use-cara-practice";
import { SAFEGUARDING_FLAG_TYPES } from "@/lib/cara-practice/types";
import type { CaraSeverity, PracticeSourceType } from "@/lib/cara-practice/types";

const SEV_STYLE: Record<CaraSeverity, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

export interface CaraPracticePanelProps {
  text?: string;
  sourceType: PracticeSourceType;
  sourceId?: string | null;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
  title?: string;
}

export function CaraPracticePanel(props: CaraPracticePanelProps) {
  const [text, setText] = useState(props.text ?? "");
  const analyse = useCaraPracticeAnalyse();
  const out = analyse.data?.data;

  const run = () => {
    const input: AnalyseInput = {
      text,
      sourceType: props.sourceType,
      sourceId: props.sourceId,
      childId: props.childId,
      staffId: props.staffId,
      homeId: props.homeId,
    };
    analyse.mutate(input);
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-[var(--cs-cara-gold,#f6f1e6)]/40">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span>{props.title ?? "Cara Practice Intelligence"}</span>
          {out && (
            <span className="ml-auto text-xs font-bold tabular-nums text-slate-600">
              Practice quality {formatRate(out.scores.overall)}
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Cara advises — you decide. The child&apos;s lived experience is the measure of quality.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          className="w-full min-h-[90px] rounded-md border border-slate-200 p-2 text-sm"
          placeholder="Paste or write the record, assessment or note to analyse…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={run} disabled={analyse.isPending || text.trim().length === 0}>
            {analyse.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Run Cara
          </Button>
          {out?.requiresManagerReview && (
            <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-800">
              <ClipboardCheck className="h-3 w-3 mr-1" /> Manager review required
            </Badge>
          )}
          {out?.requiresRiReview && (
            <Badge variant="outline" className="border-red-300 bg-red-50 text-red-800">RI review</Badge>
          )}
        </div>

        {analyse.isError && (
          <p className="text-sm text-red-600">{(analyse.error as Error)?.message ?? "Cara could not analyse this record."}</p>
        )}

        {out && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{out.summary}</p>

            {out.flags.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> What Cara recognised
                </h4>
                <ul className="space-y-2">
                  {out.flags.map((f, i) => (
                    <li key={i} className={cn("rounded-md border p-2 text-sm", SEV_STYLE[f.severity])}>
                      <div className="flex items-center gap-2">
                        {SAFEGUARDING_FLAG_TYPES.includes(f.flagType) && (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        <span className="font-semibold">{f.title}</span>
                        <span className="ml-auto text-[10px] uppercase font-bold">{f.severity}</span>
                      </div>
                      <p className="mt-1 opacity-90">{f.description}</p>
                      <p className="mt-1 text-xs"><span className="font-semibold">Recommended:</span> {f.recommendedAction}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {out.questions.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" /> Reflective questions
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {out.questions.slice(0, 10).map((q, i) => <li key={i}>{q.question}</li>)}
                </ul>
              </section>
            )}

            {(out.recommendations.length > 0 || out.nextBestActions.length > 0) && (
              <section>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" /> Next best actions
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                  {out.recommendations.map((r, i) => <li key={`r${i}`}><span className="font-medium">{r.title}</span> — {r.detail}</li>)}
                  {out.nextBestActions.map((a, i) => <li key={`a${i}`}>{a}</li>)}
                </ul>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
