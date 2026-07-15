"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, PlusCircle, IdCard } from "lucide-react";

import { logout } from "@/lib/api";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/passport", label: "Passport", icon: IdCard },
  { href: "/sales/new", label: "Sell", icon: PlusCircle },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-border/40 bg-[color-mix(in_oklch,var(--background)_80%,transparent)] backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="font-heading text-2xl font-medium tracking-tight text-foreground"
          >
            MarketOS
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="ml-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Log out
            </button>
          </nav>
        </div>
      </header>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-primary/10 bg-white/95 shadow-[0_8px_30px_oklch(0.35_0.06_155/0.12)] backdrop-blur-md md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-1 py-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-medium",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-medium text-muted-foreground"
          >
            <LogOut className="size-5" />
            Out
          </button>
        </div>
      </nav>
    </>
  );
}
