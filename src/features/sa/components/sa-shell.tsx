"use client";

import { FileSpreadsheet, History, ListChecks, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/shared/components/app-shell";
import { useRole } from "@/shared/lib/role-context";
import { clearTokens } from "@/shared/lib/auth-token";

const NAV_ITEMS = [
  {
    label: "Customer",
    href: "/sa",
    icon: <Users />,
    tint: "#0f766e",
  },
  {
    label: "History",
    href: "/sa/history",
    icon: <History />,
    tint: "#f59e0b",
  },
  {
    label: "Invoice",
    href: "/sa/transactions",
    icon: <ListChecks />,
    tint: "#2856e8",
  },
  {
    label: "Reports",
    href: "/sa/reports",
    icon: <FileSpreadsheet />,
    tint: "#7c3aed",
  },
];

const ROLE_LABEL: Record<string, string> = {
  sa: "Sales Admin",
  tax: "Tax Dept",
  admin: "Admin",
};

export function SaShell({
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
