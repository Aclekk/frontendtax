"use client";

import { FileCheck2, FileSpreadsheet, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/shared/components/app-shell";
import { useRole } from "@/shared/lib/role-context";
import { clearTokens } from "@/shared/lib/auth-token";

const NAV_ITEMS = [
  {
    label: "Invoice",
    href: "/sa/transactions",
    icon: <ListChecks />,
    tint: "#2856e8",
  },
  {
    label: "Faktur Pajak",
    href: "/tax-dept/dashboard",
    icon: <FileCheck2 />,
    tint: "#16a34a",
  },
  {
    label: "Reports",
    href: "/tax-dept/reports",
    icon: <FileSpreadsheet />,
    tint: "#7c3aed",
  },
];

const ROLE_LABEL: Record<string, string> = {
  sa: "Sales Admin",
  tax: "Tax Dept",
  admin: "Admin",
};

export function TaxDeptShell({
  children,
  activeHref,
}: {
  children: React.ReactNode;
  activeHref: string;
}) {
  const router = useRouter();
  const { role, userName, clearSession } = useRole();

  const handleLogout = () => {
    clearTokens();
    clearSession();
    router.push("/login");
  };

  return (
    <AppShell
      navItems={NAV_ITEMS}
      activeHref={activeHref}
      roleLabel={role ? ROLE_LABEL[role] : "-"}
      userName={userName ?? "-"}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
