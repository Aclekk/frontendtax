import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STORE_API_BASE_URL = (
  process.env.STORE_API_BASE_URL ??
  process.env.AUTH_GATEWAY_BASE_URL ??
  process.env.NEXT_PUBLIC_TAX_REFUND_API_URL ??
  "https://api-gateway.delamibrands.com/api"
).replace(/\/$/, "");
const REFRESH_URL = `${STORE_API_BASE_URL}/auth/refresh`;

async function fetchStoreApi(searchParams: URLSearchParams, accessToken?: string) {
  const params = new URLSearchParams(searchParams.toString());
  if (!params.has("isTaxRefund")) {
    params.set("isTaxRefund", "true");
  }
  return fetch(`${STORE_API_BASE_URL}/Store?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

// Helper aman: baca body sebagai text dulu, baru coba parse —
// supaya kalau kosong/invalid, kita tau isinya persis, bukan cuma
// "Unexpected end of JSON input" yang tidak jelas asalnya.
async function safeParseJson(res: Response, label: string) {
  const text = await res.text();
  console.log(`DEBUG [${label}] status=${res.status} body=`, JSON.stringify(text));
  if (!text) {
    throw new Error(`${label} returned empty body (status ${res.status})`);
  }
  return JSON.parse(text);
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const accessToken = headerToken || cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const searchParams = request.nextUrl.searchParams;

  let res = await fetchStoreApi(searchParams, accessToken);

  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch(REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshPayload = await safeParseJson(refreshRes, "refresh");

    if (refreshRes.ok && refreshPayload.success) {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } =
        refreshPayload.data;

      res = await fetchStoreApi(searchParams, newAccessToken);
      const data = await safeParseJson(res, "store-retry");
      const response = NextResponse.json(data, { status: res.status });

      response.cookies.set("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn,
      });
      response.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Sesi berakhir, silakan login ulang." },
      { status: 401 }
    );
  }

  const data = await safeParseJson(res, "store-first");
  return NextResponse.json(data, { status: res.status });
}