"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useRole } from "@/shared/lib/role-context";
import { authApi } from "@/shared/lib/axios";
import {
  getActiveStoreCode,
  setActiveStoreCode,
  setTokens,
} from "@/shared/lib/auth-token";
import type { LoginApiResponse } from "@/features/auth/types/auth.type";
import {
  resolveActiveStoreFromLogin,
  resolveAppRoleFromList,
} from "@/features/auth/types/auth.type";

const TARGET_APP_NAME = "Tax Refund";

const REDIRECT_BY_ROLE: Record<string, string> = {
  sa: "/sa",
  tax: "/tax-dept/dashboard",
  admin: "/sa",
};

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useRole();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("username") as string;
    const password = formData.get("password") as string;
try {
  console.log("LOGIN SUBMIT", {
    email,
    passwordLength: password.length,
  });

  const res = await authApi.post<LoginApiResponse>("/auth/login", {
    email,
    password,
  });

  console.log("LOGIN RESPONSE", res.data);

  const payload = res.data;
  const loginData = payload?.data ?? payload;

      if (!payload.success) {
        setError(payload.message || "Login gagal.");
        return;
      }

      const { application, role, accessToken, refreshToken, user, store } =
        loginData;
      const directStoreCode =
        (loginData as { storeCode?: string | null; activeStoreCode?: string | null })
          ?.storeCode ??
        (loginData as { user?: { storeCode?: string | null; storeId?: string | number | null } })
          ?.user?.storeCode ??
        (loginData as { user?: { storeCode?: string | null; storeId?: string | number | null } })
          ?.user?.storeId?.toString() ??
        null;

      const hasAccess = application.some(
        (app) => app.applicationName === TARGET_APP_NAME
      );
      if (!hasAccess) {
        setError("Akun ini tidak memiliki akses ke aplikasi Tax Refund.");
        return;
      }

      const appRole = resolveAppRoleFromList(role);
      if (!appRole) {
        setError("Role pengguna tidak dikenali.");
        return;
      }

      const selectedStore = resolveActiveStoreFromLogin(
        store,
        getActiveStoreCode(),
        directStoreCode
      );

      setTokens(accessToken, refreshToken);
      setActiveStoreCode(
        selectedStore?.storeCode ?? null,
        selectedStore?.storeName ?? null,
        selectedStore?.email ?? null
      );
      setSession(appRole, user.userName);
      router.push(REDIRECT_BY_ROLE[appRole] ?? "/login");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? "Username atau password salah.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // PENTING: pastikan komponen ini dipanggil LANGSUNG di page.tsx,
    // tanpa dibungkus <div className="container max-w-..."> atau layout
    // dengan padding besar. Itu penyebab utama tampilan "menciut".
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFC] flex flex-col items-center">
      {/* ===== LAMP POSITION WRAPPER =====
          Wrapper ini jadi titik acuan (anchor) untuk lampu DAN spotlight,
          supaya posisi keduanya selalu sinkron secara presisi. */}
      <div className="relative flex flex-col items-center pt-0">
        {/* ===== LAMPU: navy geometric ceiling lamp =====
            - kabel vertikal dari atas
            - housing trapesium navy (#0B2347), ukuran nyata (bukan icon)
            - opening horizontal di bawah housing
            - sumber cahaya warm gold (#FFD98A) di dalam opening
            - ukuran: mobile 70px, tablet 80px, desktop 90px */}
        <svg
          className="animate-in fade-in zoom-in-95 relative z-20 h-[76px] w-[76px] duration-700 sm:h-[86px] sm:w-[86px] md:h-[96px] md:w-[96px]"
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* kabel/rod vertikal */}
          <line x1="48" y1="0" x2="48" y2="22" stroke="#0B2347" strokeWidth="2.5" />

          {/* mount kecil penghubung kabel ke housing */}
          <rect x="43" y="20" width="10" height="7" rx="1.5" fill="#0B2347" />

          {/* housing utama: bentuk trapesium geometris (lamp shade) */}
          <path
            d="M 20 48 L 39 28 L 57 28 L 76 48 L 71 57 L 25 57 Z"
            fill="#0B2347"
          />

          {/* opening horizontal di bagian bawah housing */}
          <path
            d="M 27 57 L 69 57 L 64 64 L 32 64 Z"
            fill="#0B2347"
          />

          {/* sumber cahaya warm gold di dalam opening */}
          <ellipse cx="48" cy="63" rx="17" ry="5" fill="#FFD98A" />
          <ellipse cx="48" cy="63" rx="10" ry="2.8" fill="#FFEFC9" />
        </svg>

        {/* ===== SPOTLIGHT BEAM (cone, bulging/cembung) =====
            Bukan segitiga lurus lagi — tambah titik kontrol di sisi kiri & kanan
            (35% tinggi) yang melebar lebih jauh dari garis lurus, sehingga
            bentuknya mengembung seperti cahaya lampu sungguhan. */}
        {/* ===== SPOTLIGHT BEAM (natural light falloff) =====
            Cahaya lampu asli meredup mengikuti hukum inverse-square: sangat
            terang dekat sumber, lalu meredup CEPAT, baru melambat di
            ujung. Gradient linear biasa terasa "rata"/flat, jadi di sini
            dipakai lebih banyak stop dengan kurva non-linear supaya falloff-nya
            natural. Edge juga dibuat 2 layer: satu tajam dekat lampu (blur kecil),
            satu lembut jauh dari lampu (blur besar) — meniru cara cahaya nyata
            menyebar dan "berbulu" di ujungnya, bukan berhenti tegas. */}

        {/* Layer A: beam utama, tajam di dekat lampu */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-full z-0 h-[620px] w-[980px] -translate-x-1/2 sm:h-[700px] sm:w-[1100px] md:h-[760px] md:w-[1220px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,225,170,0.55) 0%, rgba(255,218,155,0.36) 10%, rgba(255,210,140,0.22) 22%, rgba(255,205,130,0.13) 36%, rgba(255,200,125,0.075) 52%, rgba(255,200,125,0.04) 68%, rgba(255,200,125,0.018) 82%, transparent 96%)",
            clipPath:
              "polygon(46% 0%, 54% 0%, 66% 18%, 76% 38%, 84% 62%, 92% 85%, 100% 100%, 0% 100%, 8% 85%, 16% 62%, 24% 38%, 34% 18%)",
            filter: "blur(8px)",
          }}
        />

        {/* Layer B: lapisan lembut tambahan, hanya di bagian bawah/jauh dari
            lampu, agar transisi ke "transparent" tidak terasa terpotong tegas */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[280px] z-0 h-[420px] w-[900px] -translate-x-1/2 sm:top-[320px] sm:h-[480px] sm:w-[1020px] md:top-[360px] md:h-[520px] md:w-[1140px]"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 50% 30%, rgba(255,205,130,0.10) 0%, rgba(255,205,130,0.05) 40%, transparent 75%)",
            filter: "blur(36px)",
          }}
        />

        {/* bright core tepat di mulut lampu — titik paling terang, warna lebih
            putih/hangat (bukan kuning pekat) meniru filament lampu asli */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-full z-0 h-[130px] w-[190px] -translate-x-1/2 -translate-y-4 blur-md"
          style={{
            background:
              "radial-gradient(ellipse 55% 100% at 50% 0%, rgba(255,238,205,0.85) 0%, rgba(255,225,175,0.5) 35%, rgba(255,215,155,0.22) 60%, transparent 82%)",
          }}
        />

        {/* pool of light bulat besar yang mengelilingi seluruh area card,
            supaya card terlihat "duduk" di dalam kolam cahaya, sesuai referensi */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[420px] z-0 h-[520px] w-[880px] -translate-x-1/2 rounded-full blur-3xl sm:top-[480px] sm:h-[580px] sm:w-[960px] md:top-[540px] md:h-[640px] md:w-[1040px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,214,140,0.24) 0%, rgba(255,214,140,0.12) 40%, transparent 75%)",
          }}
        />
      </div>

      {/* ---------- Spotlight zone (logo + heading) ---------- */}
      <div className="relative flex w-full flex-col items-center">
        {/* ---------- Logo ---------- */}
        <div className="animate-in fade-in slide-in-from-bottom-2 relative z-10 mt-16 flex w-full max-w-md flex-col items-center px-6 duration-700 [animation-delay:75ms] [animation-fill-mode:backwards] sm:mt-20">
          <Image
            src="/delami-logo.png"
            alt="Delami Brands"
            width={280}
            height={50}
            className="h-10 w-auto sm:h-11"
            priority
          />
        </div>

        {/* ---------- Heading ---------- */}
        <div className="animate-in fade-in slide-in-from-bottom-2 relative z-10 mt-8 flex w-full max-w-md flex-col items-center px-6 text-center duration-700 [animation-delay:150ms] [animation-fill-mode:backwards]">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#0B1B3B] sm:text-[2.75rem]">
            Selamat Datang
          </h1>
          <p className="mt-2 text-lg font-medium text-[#0B1B3B]/75">
            Tax Refund Module
          </p>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Masuk untuk mengakses dashboard dan melanjutkan pekerjaan Anda.
          </p>
        </div>
      </div>

      {/* ---------- Card ---------- */}
      <div className="animate-in fade-in slide-in-from-bottom-3 relative z-10 mt-10 w-full max-w-[440px] px-6 pb-16 duration-700 [animation-delay:225ms] [animation-fill-mode:backwards]">
        <div className="relative">
          {/* glow di belakang card — menyatu dengan pool of light dari atas,
              opacity dinaikkan agar card benar-benar terasa "disinari" */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-20 -top-24 -bottom-20 -z-10 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse 80% 95% at 50% 15%, rgba(255,214,140,0.26) 0%, rgba(255,214,140,0.13) 38%, transparent 74%)",
            }}
          />
          <div className="relative w-full rounded-[24px] border border-[#0B1B3B]/[0.06] bg-white p-8 shadow-[0_20px_50px_-12px_rgb(11,27,59,0.12)] transition-shadow duration-300 hover:shadow-[0_24px_60px_-12px_rgb(11,27,59,0.16)] sm:p-10">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A468]/60 to-transparent" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-[#0B1B3B]">
                  Username
                </Label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#0B1B3B]" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="Masukkan username"
                    autoComplete="username"
                    required
                    className="h-[50px] rounded-[14px] border-[#0B1B3B]/10 bg-[#FAFAFC] pl-10 shadow-sm transition-all duration-200 focus-visible:border-[#0B1B3B]/30 focus-visible:bg-white focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-[#0B1B3B]/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-[#0B1B3B]">
                  Password
                </Label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-[#0B1B3B]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    required
                    className="h-[50px] rounded-[14px] border-[#0B1B3B]/10 bg-[#FAFAFC] pl-10 pr-10 shadow-sm transition-all duration-200 focus-visible:border-[#0B1B3B]/30 focus-visible:bg-white focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-[#0B1B3B]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  className="animate-in fade-in slide-in-from-top-1 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive duration-300"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="group/btn mt-2 h-[50px] rounded-[14px] bg-gradient-to-b from-[#16295C] to-[#0B1B3B] text-sm font-semibold text-white shadow-[0_8px_20px_-4px_rgb(11,27,59,0.35)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_10px_26px_-4px_rgb(11,27,59,0.45)] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Masuk
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>©2026 Delamibrands. All Rights Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}