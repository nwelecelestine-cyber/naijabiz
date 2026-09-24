"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const mainNavigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "⌂" },
  { label: "Sales", href: "/sales", icon: "₦" },
  { label: "Inventory", href: "/inventory", icon: "▣" },
  { label: "Customers", href: "/customers", icon: "♙" },
  { label: "Debts", href: "/debts", icon: "◉" },
  { label: "Expenses", href: "/expenses", icon: "↗" },
];

const otherNavigation: NavItem[] = [
  { label: "Reports", href: "/reports", icon: "▥" },
  { label: "AI Assistant", href: "/ai", icon: "✦" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Authentication pages use their own clean layout.
  if (pathname.startsWith("/auth/")) {
    return <>{children}</>;
  }

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function navigate(href: string) {
    setMobileMenuOpen(false);
    router.push(href);
  }

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Logout request failed.");
      }

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);

      router.push("/auth/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      setMobileMenuOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f2] text-[#253029]">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#1f2923] lg:flex">
        {/* BRAND */}
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a9e7e] text-lg font-bold text-white shadow-sm">
              N
            </div>

            <div className="text-left">
              <p className="text-lg font-bold tracking-tight text-white">
                NaijaBiz
              </p>

              <p className="text-[11px] font-medium uppercase tracking-wider text-[#aebbb0]">
                Business Manager
              </p>
            </div>
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#91a094]">
            Main Menu
          </p>

          <nav className="space-y-1">
            {mainNavigation.map((item) => (
              <NavigationButton
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => navigate(item.href)}
              />
            ))}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#91a094]">
            Tools
          </p>

          <nav className="space-y-1">
            {otherNavigation.map((item) => (
              <NavigationButton
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => navigate(item.href)}
              />
            ))}
          </nav>
        </div>

        {/* ACCOUNT */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#91a094]">
              Business Account
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              My Business
            </p>

            <p className="mt-0.5 text-xs text-[#9eaaa1]">
              Active business
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#b8c2ba] transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-base">↪</span>
            <span>{loggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e1e7e1] bg-[#fafbf8]/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-[#344139] transition hover:bg-[#e8f0e7]"
          aria-label="Open navigation"
        >
          ☰
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7a9e7e] text-sm font-bold text-white">
            N
          </div>

          <span className="font-bold tracking-tight text-[#253029]">
            NaijaBiz
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6b756e] transition hover:bg-[#e8f0e7]"
          aria-label="Go to dashboard"
        >
          ◉
        </button>
      </header>

      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#1f2923]/50 lg:hidden"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#1f2923] shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* MOBILE BRAND */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a9e7e] text-lg font-bold text-white">
              N
            </div>

            <div className="text-left">
              <p className="font-bold tracking-tight text-white">
                NaijaBiz
              </p>

              <p className="text-[10px] uppercase tracking-wider text-[#aebbb0]">
                Business Manager
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#aebbb0] transition hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#91a094]">
            Main Menu
          </p>

          <nav className="space-y-1">
            {mainNavigation.map((item) => (
              <NavigationButton
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => navigate(item.href)}
              />
            ))}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#91a094]">
            Tools
          </p>

          <nav className="space-y-1">
            {otherNavigation.map((item) => (
              <NavigationButton
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => navigate(item.href)}
              />
            ))}
          </nav>
        </div>

        {/* MOBILE ACCOUNT */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#91a094]">
              Business Account
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              My Business
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#b8c2ba] transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
          >
            <span>↪</span>
            <span>{loggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>

      {/* MAIN APPLICATION AREA */}
      <div className="min-h-screen lg:pl-64">
        {/* DESKTOP TOP BAR */}
        <header className="hidden h-20 items-center justify-between border-b border-[#e1e7e1] bg-[#fafbf8] px-8 lg:flex">
          <div>
            <p className="text-sm font-medium text-[#7b857e]">
              Business workspace
            </p>

            <p className="text-sm font-semibold text-[#253029]">
              My Business
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e1e7e1] bg-white text-[#6b756e] transition hover:border-[#c7d3c7] hover:bg-[#e8f0e7] hover:text-[#5f8065]"
              aria-label="Notifications"
            >
              ♧
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-[#e1e7e1] bg-white px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7a9e7e] text-xs font-bold text-white">
                MB
              </div>

              <div className="hidden xl:block">
                <p className="text-xs font-semibold text-[#253029]">
                  My Business
                </p>

                <p className="text-[10px] text-[#7b857e]">
                  Business account
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] bg-[#f5f7f2]">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavigationButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
        active
          ? "bg-[#7a9e7e] text-white shadow-sm"
          : "text-[#b8c2ba] hover:bg-white/10 hover:text-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
          active
            ? "bg-white/15 text-white"
            : "bg-white/5 text-[#aebbb0]"
        }`}
      >
        {item.icon}
      </span>

      <span>{item.label}</span>
    </button>
  );
}