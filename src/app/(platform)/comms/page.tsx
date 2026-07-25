"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { CommsCentre } from "@/components/comms/comms-centre";
import { StaffTrustNoticePanel } from "@/components/comms/staff-trust-notice-panel";
import { SensitiveSurface } from "@/components/security/capture-deterrence";
import { api } from "@/hooks/use-api";

export default function CommsCentrePage() {
  const { data: notice, isLoading } = useQuery({
    queryKey: ["comms", "trust-notice"],
    queryFn: async () =>
      (await api.get<{ data: { version: string; acknowledged: boolean; acknowledged_at: string | null } }>("/comms/trust-notice")).data,
    staleTime: 60_000,
  });
  const [showNotice, setShowNotice] = useState(false);

  const mustAcknowledge = !isLoading && notice && !notice.acknowledged;

  return (
    <PageShell
      title="Comms Centre"
      subtitle="Secure internal messaging — replaces WhatsApp & personal email. Role-based, shift-aware, auditable."
      actions={
        notice?.acknowledged ? (
          <button onClick={() => setShowNotice((v) => !v)} className="inline-flex items-center gap-1.5 text-xs text-[var(--cs-teal)] hover:underline">
            <Info className="h-3.5 w-3.5" />{showNotice ? "Hide" : "View"} Trust Notice
          </button>
        ) : undefined
      }
    >
      {mustAcknowledge ? (
        <div className="py-6">
          <p className="text-center text-sm text-[var(--cs-text-secondary)] mb-4">
            Please read and acknowledge the Staff Trust Notice before using the Comms Centre.
          </p>
          <StaffTrustNoticePanel />
        </div>
      ) : showNotice ? (
        <div className="py-4">
          <StaffTrustNoticePanel compact />
        </div>
      ) : (
        <SensitiveSurface>
          <CommsCentre />
        </SensitiveSurface>
      )}
    </PageShell>
  );
}
