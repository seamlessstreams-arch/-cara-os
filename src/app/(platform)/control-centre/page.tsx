"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Radar } from "lucide-react";

export default function ControlCentrePage() {
  return (
    <PageShell title="Control Centre" subtitle="Cross-home action & oversight board">
      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-[var(--cs-cara-gold)]" />
              Control Centre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--cs-surface)]">
              <AlertCircle className="h-5 w-5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <p className="font-medium text-[var(--cs-navy)] mb-1">Coming soon</p>
                <p className="text-[var(--cs-text-secondary)]">
                  Centralised action & oversight board for keyworker sessions, risk reviews, and welfare checks across homes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
