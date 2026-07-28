"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT SIGN-OFF TRACKER
// Dashboard widget showing documents requiring staff to read and sign.
// Critical for compliance — policies, procedures, and risk assessments
// must have evidence that all staff have read them.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/hooks/use-api";
import { careToast } from "@/lib/toast";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, formatRelative } from "@/lib/utils";
import {
  FileText, FileCheck, AlertTriangle, CheckCircle2,
  Loader2, ChevronRight, Clock, Pen, Shield,
} from "lucide-react";
import type { Document, DocumentReadReceipt } from "@/types";

// ── Documents hooks (inlined from deleted src/hooks/use-documents.ts) ────────
// useDocuments is also used, byte-identical, in app/(platform)/documents/page.tsx.
// useSignDocument is single-call-site here.

interface DocumentsResponse {
  data: Document[];
  receipts: DocumentReadReceipt[];
  meta: { total: number; requires_sign: number; expiring_soon: number; expired: number };
}

function useDocuments(params?: { category?: string; requires_read_sign?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.requires_read_sign) query.set("requires_read_sign", "true");
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => api.get<DocumentsResponse>(`/documents?${query}`),
  });
}

function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, staffId }: { docId: string; staffId: string }) =>
      api.post(`/documents/${docId}/sign`, { staff_id: staffId }),
    onSuccess: () => {
      careToast.formSaved();
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: () => careToast.actionFailed("Sign document"),
  });
}

// ── Category colours ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  policy:           { color: "text-blue-600",    bgColor: "bg-blue-100" },
  procedure:        { color: "text-indigo-600",  bgColor: "bg-indigo-100" },
  risk_assessment:  { color: "text-orange-600",  bgColor: "bg-orange-100" },
  regulation:       { color: "text-purple-600",  bgColor: "bg-purple-100" },
  guidance:         { color: "text-teal-600",    bgColor: "bg-teal-100" },
  training:         { color: "text-emerald-600", bgColor: "bg-emerald-100" },
  report:           { color: "text-[var(--cs-text-secondary)]",   bgColor: "bg-[var(--cs-surface)]" },
};

// ── Document row ────────────────────────────────────────────────────────────

function DocRow({
  doc,
  receipts,
  currentUserId,
  onSign,
  signing,
}: {
  doc: Document;
  receipts: DocumentReadReceipt[];
  currentUserId: string;
  onSign: (docId: string) => void;
  signing: boolean;
}) {
  const docReceipts = receipts.filter((r) => r.document_id === doc.id);
  const hasSigned = docReceipts.some((r) => r.staff_id === currentUserId);
  const totalRequired = 10; // Approximate staff count
  const signedCount = docReceipts.length;
  const pct = Math.min(100, Math.round((signedCount / totalRequired) * 100));

  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
  const isExpiring = doc.expiry_date && !isExpired &&
    (new Date(doc.expiry_date).getTime() - Date.now()) < 30 * 86400000;

  const catConfig = CATEGORY_CONFIG[doc.category] ?? { color: "text-[var(--cs-text-secondary)]", bgColor: "bg-[var(--cs-surface)]" };

  return (
    <div className="flex items-start gap-3 px-3 py-3 hover:bg-[var(--cs-surface)] transition-colors group">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5", catConfig.bgColor)}>
        <FileText className={cn("h-4 w-4", catConfig.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href="/documents"
            className="text-[13px] font-medium text-[var(--cs-navy)] truncate hover:text-blue-600 transition-colors"
          >
            {doc.title}
          </Link>
          {isExpired && (
            <Badge className="bg-[--cs-risk-bg] text-[--cs-risk] border-0 text-[9px] rounded-full shrink-0">
              Expired
            </Badge>
          )}
          {isExpiring && !isExpired && (
            <Badge className="bg-[--cs-warning-bg] text-[--cs-warning] border-0 text-[9px] rounded-full shrink-0">
              Expiring
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-[var(--cs-text-muted)] capitalize">
            {doc.category.replace(/_/g, " ")}
          </span>
          {doc.expiry_date && (
            <span className={cn(
              "text-[10px]",
              isExpired ? "text-red-600 font-semibold" : "text-[var(--cs-text-muted)]",
            )}>
              {isExpired ? "Expired" : "Expires"} {formatRelative(doc.expiry_date)}
            </span>
          )}
        </div>
        {/* Sign progress */}
        <div className="mt-2 flex items-center gap-2">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums shrink-0">
            {signedCount}/{totalRequired}
          </span>
        </div>
      </div>

      {/* Sign button */}
      {!hasSigned ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSign(doc.id)}
          disabled={signing}
          className="shrink-0 h-7 text-[10px] gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <Pen className="h-3 w-3" />
          Sign
        </Button>
      ) : (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] rounded-full shrink-0 flex items-center gap-0.5">
          <CheckCircle2 className="h-3 w-3" />
          Signed
        </Badge>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function DocumentSignOff() {
  const { currentUser } = useAuthContext();
  const { data, isLoading } = useDocuments({ requires_read_sign: true });
  const signMutation = useSignDocument();

  const docs = data?.data ?? [];
  const receipts = data?.receipts ?? [];
  const meta = data?.meta;

  const handleSign = (docId: string) => {
    if (!currentUser?.id) return;
    signMutation.mutate({ docId, staffId: currentUser.id });
  };

  // Filter to docs that need signing
  const needsAction = docs.filter((doc) => {
    const signed = receipts.some(
      (r) => r.document_id === doc.id && r.staff_id === currentUser?.id,
    );
    return !signed;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <FileCheck className="h-4 w-4 text-blue-500" />
            Documents — Read & Sign
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <FileCheck className="h-4 w-4 text-blue-500" />
            Documents — Read & Sign
          </CardTitle>
          <div className="flex items-center gap-2">
            {needsAction.length > 0 && (
              <Badge className="bg-[--cs-warning-bg] text-[--cs-warning] border-0 text-[10px] rounded-full">
                {needsAction.length} to sign
              </Badge>
            )}
            {(meta?.expired ?? 0) > 0 && (
              <Badge className="bg-[--cs-risk-bg] text-[--cs-risk] border-0 text-[10px] rounded-full">
                {meta!.expired} expired
              </Badge>
            )}
            <Link href="/documents" className="text-[11px] text-blue-600 hover:underline">
              All docs →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {docs.length === 0 ? (
          <div className="py-8 text-center">
            <FileCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">No documents requiring sign-off</p>
          </div>
        ) : needsAction.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">All documents signed</p>
            <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">
              {docs.length} document{docs.length !== 1 ? "s" : ""} in your read-and-sign queue — all acknowledged
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--cs-border-subtle)] max-h-[360px] overflow-y-auto">
            {needsAction.slice(0, 6).map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                receipts={receipts}
                currentUserId={currentUser?.id ?? ""}
                onSign={handleSign}
                signing={signMutation.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
