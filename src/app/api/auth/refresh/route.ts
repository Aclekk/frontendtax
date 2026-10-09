import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE =
  process.env.AUTH_GATEWAY_BASE_URL ??
  process.env.NEXT_PUBLIC_TAX_REFUND_API_URL ??
  "https://api-gateway.delamibrands.com/api";
const REFRESH_URL = `${GATEWAY_BASE.replace(/\/$/, "")}/auth/refresh`;

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "Refresh token tidak ditemukan." },
      { status: 401 }
    );
  }

  const upstreamRes = await fetch(REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await upstreamRes.json();

  if (!upstreamRes.ok || !payload.success) {
    return NextResponse.json(
      { success: false, message: "Refresh token gagal / kadaluarsa." },
      { status: 401 }
    );
  }

  const { accessToken, refreshToken: newRefreshToken, expiresIn } = payload.data;

  const response = NextResponse.json({
    success: true,
    data: { accessToken, refreshToken: newRefreshToken, expiresIn },
  });

  response.cookies.set("accessToken", accessToken, {
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