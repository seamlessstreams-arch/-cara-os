import { NextResponse } from "next/server";
import {
  listComplianceCertificates,
  createComplianceCertificate,
} from "@/lib/services/compliance-certificate-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "";
  const result = await listComplianceCertificates(homeId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createComplianceCertificate(body);
  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
