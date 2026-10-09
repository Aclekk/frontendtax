import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = (
  process.env.AUTH_GATEWAY_BASE_URL ??
  process.env.NEXT_PUBLIC_TAX_REFUND_API_URL ??
  "https://api-gateway.delamibrands.com/api"
).replace(/\/$/, "");
const GATEWAY_CREATE_INVOICE_URL = `${GATEWAY_BASE}/invoice`;

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const role = req.cookies.get("role")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak valid." },
      { status: 401 }
    );
  }

  // Defense in depth: meskipun backend Delami sudah validasi role,
  // kita tolak juga di sini supaya request Tax (read-only) gak usah
  // sampai ke Gateway kalau memang bukan haknya.
  if (role !== "sa" && role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Anda tidak memiliki akses untuk aksi ini." },
      { status: 403 }
    );
  }

  const body = await req.json();

  const upstreamRes = await fetch(GATEWAY_CREATE_INVOICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await upstreamRes.json();

  return NextResponse.json(payload, { status: upstreamRes.status });
}