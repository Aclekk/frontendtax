import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    service: "tax-refund-frontend",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
