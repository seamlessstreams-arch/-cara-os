import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listProfiles,
  createProfile,
  updateProfile,
  listTransactions,
  createTransaction,
  listAudits,
  createAudit,
  TRANSACTION_TYPES,
  SPENDING_CATEGORIES,
  ACCOUNT_TYPES,
  FINANCIAL_LITERACY_LEVELS,
  AUDIT_STATUSES,
} from "@/lib/services/pocket-money-service";
import type {
  TransactionType,
  AccountType,
  AuditStatus,
} from "@/lib/services/pocket-money-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "transaction_types") {
    return NextResponse.json({ ok: true, data: TRANSACTION_TYPES });
  }
  if (type === "spending_categories") {
    return NextResponse.json({ ok: true, data: SPENDING_CATEGORIES });
  }
  if (type === "account_types") {
    return NextResponse.json({ ok: true, data: ACCOUNT_TYPES });
  }
  if (type === "financial_literacy_levels") {
    return NextResponse.json({ ok: true, data: FINANCIAL_LITERACY_LEVELS });
  }
  if (type === "audit_statuses") {
    return NextResponse.json({ ok: true, data: AUDIT_STATUSES });
  }

  // Transactions
  if (type === "transactions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listTransactions(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      transactionType: (searchParams.get("transactionType") ?? undefined) as TransactionType | undefined,
      accountType: (searchParams.get("accountType") ?? undefined) as AccountType | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Audits
  if (type === "audits") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAudits(homeId, {
      status: (searchParams.get("status") ?? undefined) as AuditStatus | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Profiles (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listProfiles(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_profile") {
    const result = await createProfile(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_profile") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateProfile(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_transaction") {
    const result = await createTransaction(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_audit") {
    const result = await createAudit(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
