"use client";

import { useEffect, useState } from "react";

type ReportData = {
  success: boolean;
  error?: string;

  summary: {
    totalRevenue: number;
    totalCollected: number;
    totalExpenses: number;
    outstandingDebt: number;

    totalCogs: number;
    grossProfit: number;
    netProfit: number;

    customerCount: number;
    productCount: number;
    inventoryValue: number;
    inventorySellingValue: number;
  };

  paymentStatus: {
    paid: number;
    partial: number;
    unpaid: number;
  };

  dailySales: {
    date: string;
    revenue: number;
    collected: number;
    transactions: number;
  }[];

  revenueByProduct: {
    productId: number;
    productName: string;
    unitsSold: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
  }[];

  expenseByCategory: {
    category: string;
    amount: number;
    transactions: number;
  }[];

  recentSales: {
    id: number;
    totalAmount: number;
    amountPaid: number;
    paymentStatus: string;
    createdAt: string;
  }[];

  recentExpenses: {
    id: number;
    description: string;
    category: string | null;
    amount: number;
    createdAt: string;
  }[];

  lowStockProducts: {
    id: number;
    name: string;
    quantity: number;
    sellingPrice: number;
  }[];
};

type Preset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "year"
  | "custom";

const LAGOS_TIME_ZONE = "Africa/Lagos";

function formatMoney(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00+01:00`).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: LAGOS_TIME_ZONE,
    }
  );
}

function formatDateTime(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: LAGOS_TIME_ZONE,
  });
}

function getLagosDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatLagosDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateFromDaysAgo(days: number) {
  const today = new Date(
    `${getLagosDate()}T00:00:00+01:00`
  );

  today.setDate(today.getDate() - days);

  return formatLagosDate(today);
}

function getDateRange(
  preset: Exclude<Preset, "custom">
) {
  const today = getLagosDate();

  if (preset === "today") {
    return {
      from: today,
      to: today,
    };
  }

  if (preset === "yesterday") {
    const yesterday = dateFromDaysAgo(1);

    return {
      from: yesterday,
      to: yesterday,
    };
  }

  const todayDate = new Date(
    `${today}T00:00:00+01:00`
  );

  if (preset === "week") {
    const day = todayDate.getDay();

    const difference =
      day === 0 ? 6 : day - 1;

    todayDate.setDate(
      todayDate.getDate() - difference
    );

    return {
      from: formatLagosDate(todayDate),
      to: today,
    };
  }

  if (preset === "month") {
    return {
      from: `${today.slice(0, 7)}-01`,
      to: today,
    };
  }

  return {
    from: `${today.slice(0, 4)}-01-01`,
    to: today,
  };
}

function getDefaultFrom() {
  return dateFromDaysAgo(30);
}

function getToday() {
  return getLagosDate();
}

export default function ReportsPage() {
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getToday);

  const [preset, setPreset] =
    useState<Preset>("custom");

  const [data, setData] =
    useState<ReportData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  async function loadReports(
    selectedFrom = from,
    selectedTo = to
  ) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/reports?from=${selectedFrom}&to=${selectedTo}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Could not load reports."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function applyPreset(
    selectedPreset: Preset
  ) {
    setPreset(selectedPreset);

    if (selectedPreset === "custom") {
      return;
    }

    const range =
      getDateRange(selectedPreset);

    setFrom(range.from);
    setTo(range.to);

    loadReports(
      range.from,
      range.to
    );
  }

  function handleApply() {
    setPreset("custom");
    loadReports();
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-[#5f8065]">
              Business Analytics
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#253029] sm:text-3xl">
              Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#6b756e]">
              Review historical revenue, costs,
              expenses, debts, products and profit.
            </p>
          </div>

          <div className="rounded-xl border border-[#dfe7df] bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7b857e]">
              Reporting Period
            </p>

            <p className="mt-1 text-sm font-semibold text-[#253029]">
              {from} → {to}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <section className="rounded-2xl border border-[#e1e7e1] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <PeriodButton
              label="Today"
              active={preset === "today"}
              onClick={() =>
                applyPreset("today")
              }
            />

            <PeriodButton
              label="Yesterday"
              active={
                preset === "yesterday"
              }
              onClick={() =>
                applyPreset("yesterday")
              }
            />

            <PeriodButton
              label="This Week"
              active={preset === "week"}
              onClick={() =>
                applyPreset("week")
              }
            />

            <PeriodButton
              label="This Month"
              active={preset === "month"}
              onClick={() =>
                applyPreset("month")
              }
            />

            <PeriodButton
              label="This Year"
              active={preset === "year"}
              onClick={() =>
                applyPreset("year")
              }
            />

            <PeriodButton
              label="Custom"
              active={preset === "custom"}
              onClick={() =>
                applyPreset("custom")
              }
            />
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-[#edf0ec] pt-5 md:flex-row md:items-end">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#344139]">
                From
              </label>

              <input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPreset("custom");
                }}
                className="rounded-xl border border-[#d7dfd7] bg-[#fafbf8] px-3 py-2.5 text-sm text-[#253029] outline-none transition focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#344139]">
                To
              </label>

              <input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPreset("custom");
                }}
                className="rounded-xl border border-[#d7dfd7] bg-[#fafbf8] px-3 py-2.5 text-sm text-[#253029] outline-none transition focus:border-[#7a9e7e] focus:ring-2 focus:ring-[#7a9e7e]/15"
              />
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={loading}
              className="rounded-xl bg-[#1f2923] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#344139] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Apply Date Range"}
            </button>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-[#e1e7e1] bg-white p-10 text-center text-sm text-[#6b756e] shadow-sm">
            Loading reports...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">
              Could not load reports
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadReports()
              }
              className="mt-3 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Main financial cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <ReportCard
                title="Revenue"
                value={formatMoney(
                  data.summary.totalRevenue
                )}
                icon="₦"
                tone="sage"
              />

              <ReportCard
                title="Collected"
                value={formatMoney(
                  data.summary.totalCollected
                )}
                icon="✓"
                tone="green"
              />

              <ReportCard
                title="COGS"
                value={formatMoney(
                  data.summary.totalCogs
                )}
                icon="▣"
                tone="slate"
              />

              <ReportCard
                title="Expenses"
                value={formatMoney(
                  data.summary.totalExpenses
                )}
                icon="↗"
                tone="amber"
              />

              <ReportCard
                title="Debt"
                value={formatMoney(
                  data.summary.outstandingDebt
                )}
                icon="◉"
                tone="red"
              />

              <ReportCard
                title="Net Profit"
                value={formatMoney(
                  data.summary.netProfit
                )}
                icon="↑"
                tone="profit"
              />
            </section>

            {/* Profit breakdown */}
            <section className="grid gap-4 md:grid-cols-3">
              <SmallCard
                title="Gross Profit"
                value={formatMoney(
                  data.summary.grossProfit
                )}
                description="Revenue minus historical product cost"
              />

              <SmallCard
                title="Customers"
                value={data.summary.customerCount.toString()}
                description="Customers in this business"
              />

              <SmallCard
                title="Products"
                value={data.summary.productCount.toString()}
                description="Products currently in inventory"
              />
            </section>

            {/* Inventory values */}
            <section className="grid gap-4 md:grid-cols-2">
              <ValuePanel
                title="Inventory Cost Value"
                value={formatMoney(
                  data.summary.inventoryValue
                )}
                description="Current stock at recorded cost price"
              />

              <ValuePanel
                title="Inventory Selling Value"
                value={formatMoney(
                  data.summary.inventorySellingValue
                )}
                description="Current stock at selling price"
              />
            </section>

            {/* Daily sales + payment status */}
            <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-[#e1e7e1] bg-white shadow-sm">
                <div className="border-b border-[#edf0ec] p-5">
                  <h2 className="font-bold text-[#253029]">
                    Daily Sales
                  </h2>

                  <p className="mt-1 text-xs text-[#7b857e]">
                    Revenue grouped by Nigerian calendar day
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-[#f7f9f5] text-[#6b756e]">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                          Date
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                          Revenue
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                          Collected
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                          Sales
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.dailySales.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-10 text-center text-[#8a938d]"
                          >
                            No sales for this period.
                          </td>
                        </tr>
                      ) : (
                        data.dailySales.map(
                          (day) => (
                            <tr
                              key={day.date}
                              className="border-t border-[#edf0ec]"
                            >
                              <td className="px-5 py-3 font-medium text-[#344139]">
                                {formatDate(
                                  day.date
                                )}
                              </td>

                              <td className="px-5 py-3 font-semibold text-[#253029]">
                                {formatMoney(
                                  day.revenue
                                )}
                              </td>

                              <td className="px-5 py-3 text-[#6b756e]">
                                {formatMoney(
                                  day.collected
                                )}
                              </td>

                              <td className="px-5 py-3 text-[#6b756e]">
                                {day.transactions}
                              </td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e1e7e1] bg-white p-5 shadow-sm">
                <h2 className="font-bold text-[#253029]">
                  Payment Status
                </h2>

                <p className="mt-1 text-xs text-[#7b857e]">
                  Number of transactions by payment state
                </p>

                <div className="mt-5 space-y-3">
                  <StatusRow
                    label="Paid"
                    value={
                      data.paymentStatus.paid
                    }
                    tone="green"
                  />

                  <StatusRow
                    label="Partial"
                    value={
                      data.paymentStatus.partial
                    }
                    tone="amber"
                  />

                  <StatusRow
                    label="Unpaid"
                    value={
                      data.paymentStatus.unpaid
                    }
                    tone="red"
                  />
                </div>
              </div>
            </section>

            {/* Revenue by product */}
            <section className="overflow-hidden rounded-2xl border border-[#e1e7e1] bg-white shadow-sm">
              <div className="border-b border-[#edf0ec] p-5">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <h2 className="font-bold text-[#253029]">
                      Revenue by Product
                    </h2>

                    <p className="mt-1 text-xs text-[#7b857e]">
                      Revenue, historical cost and gross profit for each product.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-[#e8f0e7] px-3 py-1 text-xs font-semibold text-[#5f8065]">
                    {data.revenueByProduct.length} products
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#f7f9f5]">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Product
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Units Sold
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Revenue
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        COGS
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Gross Profit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.revenueByProduct.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-10 text-center text-[#8a938d]"
                        >
                          No product sales for this period.
                        </td>
                      </tr>
                    ) : (
                      data.revenueByProduct.map(
                        (product) => (
                          <tr
                            key={
                              product.productId
                            }
                            className="border-t border-[#edf0ec]"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-[#253029]">
                                {product.productName}
                              </p>

                              <p className="mt-0.5 text-xs text-[#8a938d]">
                                Product #
                                {product.productId}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-right font-medium text-[#344139]">
                              {product.unitsSold.toLocaleString(
                                "en-NG"
                              )}
                            </td>

                            <td className="px-5 py-4 text-right font-semibold text-[#253029]">
                              {formatMoney(
                                product.revenue
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-[#6b756e]">
                              {formatMoney(
                                product.cogs
                              )}
                            </td>

                            <td
                              className={`px-5 py-4 text-right font-bold ${
                                product.grossProfit >=
                                0
                                  ? "text-[#5f8065]"
                                  : "text-[#c96a6a]"
                              }`}
                            >
                              {formatMoney(
                                product.grossProfit
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#edf0ec] bg-[#fafbf8] px-5 py-3">
                <p className="text-xs text-[#7b857e]">
                  COGS is calculated using the cost recorded on each sale item at the time of sale. Changing a product's current cost price will not change historical sales.
                </p>
              </div>
            </section>

            {/* Expense breakdown */}
            <section className="overflow-hidden rounded-2xl border border-[#e1e7e1] bg-white shadow-sm">
              <div className="border-b border-[#edf0ec] p-5">
                <h2 className="font-bold text-[#253029]">
                  Expenses by Category
                </h2>

                <p className="mt-1 text-xs text-[#7b857e]">
                  Where business expenses went during this period
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-[#f7f9f5]">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Category
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Transactions
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b756e]">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.expenseByCategory.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-10 text-center text-[#8a938d]"
                        >
                          No expenses for this period.
                        </td>
                      </tr>
                    ) : (
                      data.expenseByCategory.map(
                        (expense) => (
                          <tr
                            key={
                              expense.category
                            }
                            className="border-t border-[#edf0ec]"
                          >
                            <td className="px-5 py-4 font-semibold text-[#344139]">
                              {expense.category}
                            </td>

                            <td className="px-5 py-4 text-right text-[#6b756e]">
                              {
                                expense.transactions
                              }
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-[#c96a6a]">
                              {formatMoney(
                                expense.amount
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent activity */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-[#e1e7e1] bg-white shadow-sm">
                <div className="border-b border-[#edf0ec] p-5">
                  <h2 className="font-bold text-[#253029]">
                    Recent Sales
                  </h2>

                  <p className="mt-1 text-xs text-[#7b857e]">
                    Latest transactions in the selected period
                  </p>
                </div>

                <div className="divide-y divide-[#edf0ec]">
                  {data.recentSales.length ===
                  0 ? (
                    <p className="p-5 text-sm text-[#8a938d]">
                      No sales found.
                    </p>
                  ) : (
                    data.recentSales.map(
                      (sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between gap-4 p-5"
                        >
                          <div>
                            <p className="font-semibold text-[#253029]">
                              Sale #{sale.id}
                            </p>

                            <p className="mt-1 text-xs text-[#7b857e]">
                              {formatDateTime(
                                sale.createdAt
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-[#253029]">
                              {formatMoney(
                                sale.totalAmount
                              )}
                            </p>

                            <p
                              className={`mt-1 text-xs font-semibold ${
                                sale.paymentStatus ===
                                "PAID"
                                  ? "text-[#5f8065]"
                                  : sale.paymentStatus ===
                                    "PARTIAL"
                                  ? "text-[#c99a3d]"
                                  : "text-[#c96a6a]"
                              }`}
                            >
                              {
                                sale.paymentStatus
                              }
                            </p>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#e1e7e1] bg-white shadow-sm">
                <div className="border-b border-[#edf0ec] p-5">
                  <h2 className="font-bold text-[#253029]">
                    Recent Expenses
                  </h2>

                  <p className="mt-1 text-xs text-[#7b857e]">
                    Latest business expenses in the selected period
                  </p>
                </div>

                <div className="divide-y divide-[#edf0ec]">
                  {data.recentExpenses.length ===
                  0 ? (
                    <p className="p-5 text-sm text-[#8a938d]">
                      No expenses found.
                    </p>
                  ) : (
                    data.recentExpenses.map(
                      (expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between gap-4 p-5"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#253029]">
                              {
                                expense.description
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#7b857e]">
                              {expense.category ||
                                "Other"}{" "}
                              •{" "}
                              {formatDateTime(
                                expense.createdAt
                              )}
                            </p>
                          </div>

                          <p className="shrink-0 font-bold text-[#c96a6a]">
                            {formatMoney(
                              expense.amount
                            )}
                          </p>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </section>

            {/* Inventory health */}
            <section className="overflow-hidden rounded-2xl border border-[#e1e7e1] bg-white shadow-sm">
              <div className="border-b border-[#edf0ec] p-5">
                <h2 className="font-bold text-[#253029]">
                  Inventory Health
                </h2>

                <p className="mt-1 text-sm text-[#7b857e]">
                  Products with 5 or fewer units remaining.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-[#f7f9f5] text-[#6b756e]">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                        Product
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                        Quantity
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Selling Price
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.lowStockProducts.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-10 text-center text-[#8a938d]"
                        >
                          No low-stock products.
                        </td>
                      </tr>
                    ) : (
                      data.lowStockProducts.map(
                        (product) => (
                          <tr
                            key={product.id}
                            className="border-t border-[#edf0ec]"
                          >
                            <td className="px-5 py-3 font-semibold text-[#253029]">
                              {product.name}
                            </td>

                            <td className="px-5 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  product.quantity ===
                                  0
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {product.quantity}
                              </span>
                            </td>

                            <td className="px-5 py-3 text-right font-medium text-[#344139]">
                              {formatMoney(
                                product.sellingPrice
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function PeriodButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[#7a9e7e] text-white shadow-sm"
          : "border border-[#dfe6df] bg-[#fafbf8] text-[#344139] hover:border-[#b9cbb9] hover:bg-[#e8f0e7]"
      }`}
    >
      {label}
    </button>
  );
}

function ReportCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: string;
  tone:
    | "sage"
    | "green"
    | "amber"
    | "red"
    | "slate"
    | "profit";
}) {
  const toneClasses = {
    sage: "bg-[#e8f0e7] text-[#5f8065]",
    green: "bg-[#edf5ed] text-[#5f8065]",
    amber: "bg-[#fbf3e3] text-[#a47725]",
    red: "bg-[#fbeeee] text-[#b85d5d]",
    slate: "bg-[#eef1ef] text-[#526057]",
    profit: "bg-[#dfeee0] text-[#4f7355]",
  };

  return (
    <div className="rounded-2xl border border-[#e1e7e1] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#6b756e]">
          {title}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${toneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xl font-bold tracking-tight text-[#253029]">
        {value}
      </p>
    </div>
  );
}

function SmallCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e7e1] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#6b756e]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-[#253029]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#8a938d]">
        {description}
      </p>
    </div>
  );
}

function ValuePanel({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e7e1] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#6b756e]">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#253029]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#8a938d]">
        {description}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "red";
}) {
  const classes = {
    green: "bg-[#edf5ed] text-[#5f8065]",
    amber: "bg-[#fbf3e3] text-[#a47725]",
    red: "bg-[#fbeeee] text-[#b85d5d]",
  };

  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f7f9f5] px-4 py-3">
      <span className="text-sm font-medium text-[#526057]">
        {label}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-sm font-bold ${classes[tone]}`}
      >
        {value}
      </span>
    </div>
  );
}