"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  HandCoins,
  Users,
  ReceiptText,
  FileDown,
  Landmark,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/lib/auth-actions";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/verifications", label: "Verifications", icon: UserCheck },
  { href: "/admin/loans", label: "Loans", icon: HandCoins },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/admin/reports", label: "Reports", icon: FileDown },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-[var(--admin-sidebar-bg)] text-[var(--admin-sidebar-fg)] sm:flex">
        <div className="flex items-center gap-2 px-4 py-5">
          <Landmark className="h-5 w-5" />
          <span className="font-semibold">Admin Panel</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--admin-sidebar-active)] text-white"
                    : "text-[var(--admin-sidebar-fg)]/80 hover:bg-white/5",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-2 truncate text-xs text-[var(--admin-sidebar-fg)]/60">
            {userName}
          </p>
          <form action={logoutUser}>
            <button
              type="submit"
              className="flex items-center gap-2 text-xs text-[var(--admin-sidebar-fg)]/80 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:hidden">
          <span className="font-semibold">Admin Panel</span>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
