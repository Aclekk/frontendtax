"use client";

import * as React from "react";
import type { AppRole } from "@/features/auth/types/auth.type";

export type UserRole = AppRole;

type RoleContextValue = {
  role: UserRole | null;
  userName: string | null;
  setSession: (role: UserRole, userName: string) => void;
  clearSession: () => void;
};

const RoleContext = React.createContext<RoleContextValue | undefined>(
  undefined
);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  // maxAge cocokin sama expiresIn accessToken di route handler login.
  // Ini cookie non-httpOnly, jadi expiry-nya gak krusial secara keamanan,
  // hanya soal kapan UI perlu re-fetch/re-login.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  // Inisialisasi dari cookie biasa (di-set oleh /api/auth/login).
  // Ini cuma dipakai buat render UI (label role, nama, filter menu) —
  // BUKAN sumber kebenaran untuk otorisasi. Validasi akses sesungguhnya
  // selalu terjadi di middleware.ts (server) dan di setiap route handler,
  // berbasis accessToken httpOnly yang tidak bisa dibaca/diubah dari sini.
  const [role, setRoleState] = React.useState<UserRole | null>(null);
  const [userName, setUserNameState] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cookieRole = readCookie("role") as UserRole | null;
    const cookieUserName = readCookie("userName");
    if (cookieRole) setRoleState(cookieRole);
    if (cookieUserName) setUserNameState(cookieUserName);
  }, []);

  const setSession = React.useCallback((newRole: UserRole, name: string) => {
    setRoleState(newRole);
    setUserNameState(name);
    writeCookie("role", newRole);
    writeCookie("userName", name);
  }, []);

  const clearSession = React.useCallback(() => {
    setRoleState(null);
    setUserNameState(null);
    deleteCookie("role");
    deleteCookie("userName");
  }, []);

  const value = React.useMemo(
    () => ({ role, userName, setSession, clearSession }),
    [role, userName, setSession, clearSession]
  );

  return (
    <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}