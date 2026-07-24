"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Building2 } from "lucide-react";

export default function OperationsPage() {
  return (
    <PageShell title="Operations" subtitle="Manager governance, compliance, and operational intelligence">
      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--cs-cara-gold)]" />
              Operations Centre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--cs-surface)]">
              <AlertCircle className="h-5 w-5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <p className="font-medium text-[var(--cs-navy)] mb-1">Coming soon</p>
                <p className="text-[var(--cs-text-secondary)]">
                  Manager+ governance, compliance oversight, and operational intelligence dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
