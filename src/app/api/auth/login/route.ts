import { NextRequest, NextResponse } from "next/server";
import type { LoginApiResponse } from "@/features/auth/types/auth.type";
import { resolveAppRoleFromList } from "@/features/auth/types/auth.type";

const GATEWAY_BASE =
  process.env.AUTH_GATEWAY_BASE_URL ??
  process.env.NEXT_PUBLIC_TAX_REFUND_API_URL ??
  "https://api-gateway.delamibrands.com/api";
const GATEWAY_URL = `${GATEWAY_BASE.replace(/\/$/, "")}/auth/login`;
const TARGET_APP_NAME = "Tax Refund";

export async function POST(req: NextRequest) {
  const body = await req.json();

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Tidak dapat terhubung ke server autentikasi." },
      { status: 502 }
    );
  }

  const payload = (await upstreamRes.json()) as LoginApiResponse;

  if (!upstreamRes.ok || !payload.success) {
    return NextResponse.json(
      { success: false, message: payload.message || "Login gagal." },
      { status: upstreamRes.status }
    );
  }

  const { application, role, accessToken, refreshToken, expiresIn, user } =
    payload.data;

  const hasAccess = application.some(
    (app) => app.applicationName === TARGET_APP_NAME
  );

  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        message: "Akun ini tidak memiliki akses ke aplikasi Tax Refund.",
      },
      { status: 403 }
    );
  }

  const appRole = resolveAppRoleFromList(role);

  if (!appRole) {
    return NextResponse.json(
      { success: false, message: "Role pengguna tidak dikenali." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: payload.message || "Login success",
    data: {
      application,
      role,
      accessToken,
      refreshToken,
      expiresIn,
      user,
      // Forward store array from upstream payload so FE can pick active store
      store: payload.data?.store ?? [],
    },
  });

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });

  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Role disimpan sebagai cookie biasa (bukan httpOnly) — cuma dipakai untuk
  // render UI di client, BUKAN untuk validasi keamanan. Validasi asli tetap
  // di server memakai accessToken.
  response.cookies.set("role", appRole, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });
// ...kode sebelumnya tetap sama, tambahkan di bagian akhir sebelum return:

  response.cookies.set("userName", user.userName, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });

  return response;
}