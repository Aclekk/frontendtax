"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  tint: string;
};

export function AppShell({
  children,
  navItems,
  activeHref,
  roleLabel,
  userName,
  onLogout,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  activeHref: string;
  roleLabel: string;
  userName: string;
  onLogout: () => void;
}) {
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex flex-col justify-center gap-1 px-6 py-4">
          <Image
            src="/delami-logo.png"
            alt="Delami Brands"
            width={140}
            height={24}
            className="h-5 w-auto"
            priority
          />
          <span className="text-xs font-medium text-muted-foreground">Tax Refund System</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-active text-sidebar-active-foreground"
                    : "text-foreground/70 hover:bg-muted"
                )}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-4"
                  style={{
                    backgroundColor: isActive ? "transparent" : `${item.tint}1a`,
                    color: isActive ? "#2856e8" : item.tint,
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-muted hover:text-red-700"
          >
            <LogOut className="size-4" />
            LogOut
          </button>
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <p className="flex items-center justify-between px-3 text-[11px] text-muted-foreground">
            <span>Version</span>
            <span>V. 1.1.0</span>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="hidden text-sm font-medium text-muted-foreground lg:block">{roleLabel}</div>

          <div className="flex items-center gap-3 lg:ml-auto">
            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="hidden text-sm font-medium text-foreground sm:block">{userName}</div>
          </div>
        </header>

        <main className="flex-1 bg-background px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>

        <footer className="border-t border-border bg-background px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          ©2026 Delamibrands. All Rights Reserved
        </footer>

        <nav className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(navItems.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {navItems.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                    isActive
                      ? "bg-[#E8F1FF] text-[#0F3FD6]"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-md [&_svg]:size-4"
                    style={{
                      backgroundColor: isActive ? "transparent" : `${item.tint}1a`,
                      color: isActive ? "#2856e8" : item.tint,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
