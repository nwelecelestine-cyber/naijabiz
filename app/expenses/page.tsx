"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Expense = {
  id: number;
  businessId: number;
  description: string;
  category: string | null;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const categories = [
  "Fuel",
  "Transport",
  "Utilities",
  "Rent",
  "Salary",
  "Supplies",
  "Maintenance",
  "Marketing",
  "Internet",
  "Other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  async function loadExpenses() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/expenses", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not load expenses.");
        return;
      }

      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Expenses loading error:", error);
      setMessage("Could not connect to the expenses service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  function formatMoney(amountInKobo: number) {
    return `₦${(amountInKobo / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function isToday(date: string) {
    const value = new Date(date);
    const today = new Date();

    return (
      value.getFullYear() === today.getFullYear() &&
      value.getMonth() === today.getMonth() &&
      value.getDate() === today.getDate()
    );
  }

  const todayTotal = useMemo(() => {
    return expenses
      .filter((expense) => isToday(expense.createdAt))
      .reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const allTimeTotal = useMemo(() => {
    return expenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
  }, [expenses]);

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const nairaAmount = Number(amount);

    if (!description.trim()) {
      setMessage("Please enter an expense description.");
      return;
    }

    if (!Number.isFinite(nairaAmount) || nairaAmount <= 0) {
      setMessage("Please enter a valid expense amount.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
          category: category || null,
          amount: Math.round(nairaAmount * 100),
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not add expense.");
        return;
      }

      setExpenses((current) => [data.expense, ...current]);

      setDescription("");
      setCategory("");
      setAmount("");
      setNotes("");

      setMessage("Expense added successfully.");
    } catch (error) {
      console.error("Add expense error:", error);
      setMessage("Something went wrong while adding the expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Business expenses
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Expenses
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Record and keep track of money spent by your business.
            </p>
          </div>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              message.toLowerCase().includes("success")
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard
            label="Today's Expenses"
            value={formatMoney(todayTotal)}
            description="Expenses recorded today"
            icon="₦"
            iconClass="bg-amber-50 text-amber-600"
          />

          <SummaryCard
            label="Total Expenses"
            value={formatMoney(allTimeTotal)}
            description="All recorded business expenses"
            icon="↗"
            iconClass="bg-red-50 text-red-600"
          />
        </div>

        {/* MAIN GRID */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          {/* ADD EXPENSE */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Add Expense
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Record money spent by the business.
              </p>
            </div>

            <form onSubmit={addExpense} className="space-y-5">
              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="e.g. Generator fuel"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">Select category</option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Amount
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    ₦
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Enter the amount in Nigerian Naira.
                </p>
              </div>

              {/* NOTES */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Notes
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Add additional information..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Adding Expense..." : "Add Expense"}
              </button>
            </form>
          </section>

          {/* EXPENSE HISTORY */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
              <h2 className="font-bold text-slate-900">
                Expense History
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Recent expenses recorded for your business.
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-400">
                  ₦
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-800">
                  No expenses recorded
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Add your first business expense using the form.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Expense
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Category
                      </th>

                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {expense.description}
                          </p>

                          {expense.notes && (
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                              {expense.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {expense.category || "Uncategorized"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(expense.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                          {formatMoney(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
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