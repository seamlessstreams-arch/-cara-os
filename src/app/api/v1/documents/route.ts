import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const requiresSign = searchParams.get("requires_read_sign");

  let docs = db.documents.findAll();
  if (category) docs = docs.filter((d) => d.category === category);
  if (requiresSign === "true") docs = docs.filter((d) => d.requires_read_sign);

  const receipts = db.documentReadReceipts.findAll();
  const expiringSoon = docs.filter((d) => {
    if (!d.expiry_date) return false;
    const days = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  });

  return NextResponse.json({
    data: docs,
    receipts,
    meta: {
      total: docs.length,
      requires_sign: docs.filter((d) => d.requires_read_sign).length,
      expiring_soon: expiringSoon.length,
      expired: docs.filter((d) => d.expiry_date && d.expiry_date < new Date().toISOString().slice(0, 10)).length,
    },
  });
}
