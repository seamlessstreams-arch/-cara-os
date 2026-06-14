"use client";

// LadoConsultationPanel — recognises possible concerns about an adult who works
// with or cares for children, and advises a manager/RI review + LADO consideration.
// Cara NEVER decides the outcome and never advises a premature internal investigation.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserX, Loader2 } from "lucide-react";
import { useCaraLado } from "@/hooks/use-cara-practice";

interface LadoResult {
  ladoConsiderationDetected?: boolean;
  summary?: string;
  guidance?: string;
  requiresManagerReview?: boolean;
  requiresRiReview?: boolean;
  recommendations?: { title: string; detail: string; urgency: string }[];
}

export function LadoConsultationPanel({ childId, staffId, homeId }: { childId?: string; staffId?: string; homeId?: string }) {
  const [concern, setConcern] = useState("");
  const [managerAction, setManagerAction] = useState("");
  const consult = useCaraLado();
  const r = (consult.data?.data ?? null) as LadoResult | null;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-orange-50/50">
        <CardTitle className="text-sm flex items-center gap-2">
          <UserX className="h-4 w-4 text-orange-600" /> LADO consultation support
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">For concerns about an adult&apos;s conduct toward a child. <strong>Child welfare first; Cara never decides the outcome.</strong></p>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          className="w-full min-h-[80px] rounded-md border border-slate-200 p-2 text-sm"
          placeholder="Describe the concern about the adult's conduct…"
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
        />
        <Button size="sm" onClick={() => consult.mutate({ childId, staffId, concern, homeId })} disabled={consult.isPending || concern.trim().length === 0}>
          {consult.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
          Consult Cara
        </Button>
        {consult.isError && <p className="text-sm text-red-600">{(consult.error as Error)?.message}</p>}

        {r && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {r.ladoConsiderationDetected && <Badge className="bg-orange-100 text-orange-800 border-orange-300">Possible LADO consultation</Badge>}
              {r.requiresManagerReview && <Badge variant="outline">Manager review</Badge>}
              {r.requiresRiReview && <Badge variant="outline" className="border-red-300 text-red-800">RI review</Badge>}
            </div>
            {r.guidance && <p className="text-sm text-slate-700">{r.guidance}</p>}
            {r.recommendations && r.recommendations.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                {r.recommendations.map((rec, i) => <li key={i}><span className="font-medium">{rec.title}</span> — {rec.detail}</li>)}
              </ul>
            )}
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">Manager action & rationale</h4>
              <textarea className="w-full min-h-[60px] rounded-md border border-slate-200 p-2 text-sm" placeholder="Record the manager/RI action taken and the rationale…" value={managerAction} onChange={(e) => setManagerAction(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Notify the registered manager / responsible individual. Consider a LADO consultation before any internal investigation.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
