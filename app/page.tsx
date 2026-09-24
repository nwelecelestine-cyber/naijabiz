"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
};

type Sale = {
  id: number;
  customerId: number | null;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  createdAt: string;
};

type DashboardData = {
  todaySales: number;
  todayExpenses: number;
  moneyOwed: number;
  estimatedProfit: number;
  productCount: number;
  products: Product[];
  recentSales: Sale[];
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not load dashboard.");
        return;
      }

      setDashboard(data.dashboard);
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setMessage("Could not connect to the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatMoney = (amount: number) => {
    return `₦${(amount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const lowStockProducts = useMemo(() => {
    return (
      dashboard?.products.filter((product) => product.quantity <= 5) ?? []
    );
  }, [dashboard]);

  const totalUnits = useMemo(() => {
    return (
      dashboard?.products.reduce(
        (total, product) => total + product.quantity,
        0
      ) ?? 0
    );
  }, [dashboard]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Good to see you
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Here is what is happening with your business today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <a
              href="/sales"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              + Record Sale
            </a>
          </div>
        </div>

        {/* ERROR */}
        {message && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{message}</span>

            <button
              type="button"
              onClick={loadDashboard}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            label="Today's Revenue"
            value={
              loading
                ? "—"
                : formatMoney(dashboard?.todaySales ?? 0)
            }
            description="Total sales recorded today"
            icon="₦"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <DashboardCard
            label="Today's Expenses"
            value={
              loading
                ? "—"
                : formatMoney(dashboard?.todayExpenses ?? 0)
            }
            description="Business expenses today"
            icon="↗"
            iconClass="bg-amber-50 text-amber-600"
          />

          <DashboardCard
            label="Money Owed"
            value={
              loading
                ? "—"
                : formatMoney(dashboard?.moneyOwed ?? 0)
            }
            description="Outstanding customer balances"
            icon="◉"
            iconClass="bg-red-50 text-red-600"
          />

          <DashboardCard
            label="Estimated Profit"
            value={
              loading
                ? "—"
                : formatMoney(dashboard?.estimatedProfit ?? 0)
            }
            description="Revenue minus expenses"
            icon="✓"
            iconClass="bg-blue-50 text-blue-600"
          />
        </div>

        {/* SECONDARY SUMMARY */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Products
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {loading ? "—" : dashboard?.productCount ?? 0}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Products in your inventory
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600">
                ▣
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Stock Units
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {loading ? "—" : totalUnits.toLocaleString("en-NG")}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Total units currently in stock
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600">
                #
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {/* RECENT SALES */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Recent Sales
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Your latest transactions
                </p>
              </div>

              <a
                href="/sales"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Record sale →
              </a>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Loading recent sales...
              </div>
            ) : dashboard?.recentSales.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Sale
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.recentSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            Sale #{sale.id}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {sale.customerId
                              ? "Customer sale"
                              : "Walk-in customer"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={sale.paymentStatus} />
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                          {formatMoney(sale.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon="₦"
                title="No sales yet"
                text="Your recent sales will appear here."
                href="/sales"
                linkText="Record your first sale"
              />
            )}
          </section>

          {/* INVENTORY HEALTH */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Inventory Health
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Products that need attention
                </p>
              </div>

              <a
                href="/inventory"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                View all →
              </a>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Loading inventory...
              </div>
            ) : lowStockProducts.length ? (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {product.category || "Uncategorized"}
                      </p>
                    </div>

                    <StockBadge quantity={product.quantity} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="✓"
                title="Stock looks healthy"
                text="No products are currently low on stock."
                href="/inventory"
                linkText="Manage inventory"
              />
            )}
          </section>
        </div>

        {/* QUICK ACTIONS */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Common tasks for your business
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/sales"
              icon="₦"
              title="Record Sale"
              text="Create a new sale"
            />

            <QuickAction
              href="/inventory"
              icon="▣"
              title="Add Product"
              text="Update your inventory"
            />

            <QuickAction
              href="/customers"
              icon="♙"
              title="Add Customer"
              text="Create a customer record"
            />

            <QuickAction
              href="/debts"
              icon="◉"
              title="Manage Debts"
              text="View outstanding balances"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const isPaid = normalized === "PAID";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPaid
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return (
      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Out of stock
      </span>
    );
  }

  if (quantity <= 5) {
    return (
      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        {quantity} left
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      {quantity} in stock
    </span>
  );
}

function EmptyState({
  icon,
  title,
  text,
  href,
  linkText,
}: {
  icon: string;
  title: string;
  text: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500">
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
        {text}
      </p>

      <a
        href={href}
        className="mt-4 text-sm font-semibold text-slate-700 hover:text-slate-900"
      >
        {linkText} →
      </a>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
        {icon}
      </div>

      <p className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {text}
      </p>
    </a>
  );
}