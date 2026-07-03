import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAllowances,
  createAllowance,
  updateAllowance,
  listTransactions,
  createTransaction,
  listSavingsAccounts,
  createSavingsAccount,
  updateSavingsBalance,
  ALLOWANCE_TYPES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/lib/services/finance-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "allowance_types") {
    return NextResponse.json({ ok: true, data: ALLOWANCE_TYPES });
  }
  if (type === "transaction_categories") {
    return NextResponse.json({ ok: true, data: TRANSACTION_CATEGORIES });
  }
  if (type === "transaction_types") {
    return NextResponse.json({ ok: true, data: TRANSACTION_TYPES });
  }

  // Transactions
  if (type === "transactions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listTransactions(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      transactionType: searchParams.get("transactionType") as "credit" | "debit" | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Savings accounts
  if (type === "savings") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listSavingsAccounts(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Allowances (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listAllowances(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    allowanceType: searchParams.get("allowanceType") ?? undefined,
    active: searchParams.get("active") === "true" ? true : searchParams.get("active") === "false" ? false : undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_allowance") {
      const result = await createAllowance({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        allowance_type: body.allowanceType,
        amount: body.amount,
        frequency: body.frequency,
        start_date: body.startDate,
        end_date: body.endDate,
        active: body.active ?? true,
        approved_by: body.approvedBy ?? "",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_allowance") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateAllowance(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_transaction") {
      const result = await createTransaction({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        transaction_type: body.transactionType,
        category: body.category,
        amount: body.amount,
        description: body.description ?? "",
        date: body.date,
        recorded_by: body.recordedBy,
        receipt_reference: body.receiptReference,
        child_consulted: body.childConsulted ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_savings") {
      const result = await createSavingsAccount({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        account_reference: body.accountReference,
        balance: body.balance ?? 0,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_savings_balance") {
      const { id, balance } = body;
      if (!id || balance === undefined) return NextResponse.json({ error: "id and balance required" }, { status: 400 });
      const result = await updateSavingsBalance(id, balance);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_allowance, update_allowance, create_transaction, create_savings, or update_savings_balance" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
