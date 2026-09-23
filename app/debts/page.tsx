"use client";

import { useEffect, useState } from "react";

type Debt = {
  saleId: number;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  totalAmount: number;
  amountPaid: number;
  amountOwed: number;
  paymentStatus: string;
  createdAt: string;
};

type CustomerDebt = {
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  totalOwed: number;
};

type UnassignedDebt = {
  saleId: number;
  totalAmount: number;
  amountPaid: number;
  amountOwed: number;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
};

type Customer = {
  id: number;
  name: string;
  phone: string | null;
};

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customerDebts, setCustomerDebts] = useState<CustomerDebt[]>([]);
  const [unassignedDebts, setUnassignedDebts] = useState<
    UnassignedDebt[]
  >([]);

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [totalDebt, setTotalDebt] = useState(0);
  const [totalCustomerDebt, setTotalCustomerDebt] = useState(0);
  const [totalUnassignedDebt, setTotalUnassignedDebt] = useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  /*
   * Individual payment
   */
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  /*
   * Customer payment
   * Allows the user to see all debts belonging to one customer
   * and optionally pay the customer's complete outstanding balance.
   */
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDebt | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [assigningSaleId, setAssigningSaleId] = useState<number | null>(
    null
  );

  const [selectedCustomerForSale, setSelectedCustomerForSale] =
    useState<Record<number, string>>({});

  const [assigningCustomer, setAssigningCustomer] = useState(false);

  /*
   * Money is stored in kobo.
   * The UI displays naira.
   */
  const formatMoney = (amount: number) => {
    return `₦${(amount / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  /*
   * Load debts and customers.
   */
  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [debtsResponse, customersResponse] = await Promise.all([
        fetch("/api/debts"),
        fetch("/api/customers"),
      ]);

      const debtsData = await debtsResponse.json();
      const customersData = await customersResponse.json();

      if (!debtsResponse.ok || !debtsData.success) {
        setMessage(
          debtsData.error || "Could not load debts."
        );
        return;
      }

      if (!customersResponse.ok || !customersData.success) {
        setMessage(
          customersData.error || "Could not load customers."
        );
        return;
      }

      setDebts(debtsData.debts || []);
      setCustomerDebts(debtsData.customerDebts || []);
      setUnassignedDebts(debtsData.unassignedDebts || []);

      setTotalDebt(debtsData.totalDebt || 0);
      setTotalCustomerDebt(debtsData.totalCustomerDebt || 0);
      setTotalUnassignedDebt(
        debtsData.totalUnassignedDebt || 0
      );

      setCustomers(customersData.customers || []);
    } catch (error) {
      console.error(error);
      setMessage(
        "Something went wrong while loading debt information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * Find all outstanding sales belonging to a customer.
   */
  function getCustomerSales(customerId: number) {
    return debts.filter(
      (debt) => debt.customerId === customerId
    );
  }

  /*
   * Open customer's complete debt.
   */
  function openCustomerDebt(customer: CustomerDebt) {
    setSelectedCustomer(customer);
    setPaymentAmount("");
    setMessage("");
  }

  /*
   * Close customer debt modal.
   */
  function closeCustomerDebt() {
    if (savingPayment) {
      return;
    }

    setSelectedCustomer(null);
    setPaymentAmount("");
  }

  /*
   * Open payment for one individual sale.
   */
  function openPaymentForm(debt: Debt) {
    setSelectedDebt(debt);
    setPaymentAmount("");
    setMessage("");
    setShowPaymentForm(true);
  }

  /*
   * Close individual payment form.
   */
  function closePaymentForm() {
    if (savingPayment) {
      return;
    }

    setShowPaymentForm(false);
    setSelectedDebt(null);
    setPaymentAmount("");
  }

  /*
   * Record payment against one sale.
   */
  async function recordPayment() {
    setMessage("");

    if (!selectedDebt) {
      setMessage("Please select a debt.");
      return;
    }

    const nairaAmount = Number(paymentAmount);

    if (!Number.isFinite(nairaAmount) || nairaAmount <= 0) {
      setMessage("Please enter a valid payment amount.");
      return;
    }

    /*
     * Convert naira to kobo.
     */
    const paymentInKobo = Math.round(nairaAmount * 100);

    if (paymentInKobo > selectedDebt.amountOwed) {
      setMessage(
        `Payment cannot be greater than the outstanding balance of ${formatMoney(
          selectedDebt.amountOwed
        )}.`
      );
      return;
    }

    setSavingPayment(true);

    try {
      const response = await fetch(
        "/api/debts/payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            saleId: selectedDebt.saleId,
            paymentAmount: paymentInKobo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.error || "Could not record payment."
        );
        return;
      }

      const customerName = selectedDebt.customerName;

      setShowPaymentForm(false);
      setSelectedDebt(null);
      setPaymentAmount("");

      await loadData();

      if (data.newBalance === 0) {
        setMessage(
          `Payment recorded successfully. ${customerName}'s sale has been fully paid.`
        );
      } else {
        setMessage(
          `Payment recorded successfully. ${customerName} now owes ${formatMoney(
            data.newBalance
          )}.`
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(
        "Something went wrong while recording the payment."
      );
    } finally {
      setSavingPayment(false);
    }
  }

  /*
   * Pay the customer's complete outstanding balance.
   *
   * Example:
   *
   * John owes:
   * Sale #6 = ₦39
   * Sale #4 = ₦2,800
   * Sale #2 = ₦116,000
   * Sale #7 = ₦33
   * Sale #9 = ₦59,999
   *
   * Total = ₦178,871
   *
   * We process each outstanding sale separately because
   * the database Payment record belongs to a specific sale.
   */
  async function payCustomerFullBalance() {
    if (!selectedCustomer) {
      return;
    }

    const customerSales = getCustomerSales(
      selectedCustomer.customerId
    );

    if (customerSales.length === 0) {
      setMessage("This customer has no outstanding debt.");
      return;
    }

    const total = customerSales.reduce(
      (sum, sale) => sum + sale.amountOwed,
      0
    );

    setSavingPayment(true);
    setMessage("");

    try {
      /*
       * Process each sale one by one.
       *
       * We intentionally do NOT send one giant payment to the API,
       * because the payment API records a payment against saleId.
       */
      for (const sale of customerSales) {
        const response = await fetch(
          "/api/debts/payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              saleId: sale.saleId,
              paymentAmount: sale.amountOwed,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              `Could not pay Sale #${sale.saleId}`
          );
        }
      }

      const customerName = selectedCustomer.customerName;

      setSelectedCustomer(null);
      setPaymentAmount("");

      await loadData();

      setMessage(
        `${customerName}'s full outstanding balance of ${formatMoney(
          total
        )} has been paid successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not complete the full payment."
      );

      /*
       * Reload because some sales may already have been
       * successfully paid before an error occurred.
       */
      await loadData();
    } finally {
      setSavingPayment(false);
    }
  }

  /*
   * Pay a custom amount from the customer's total balance.
   *
   * This distributes the payment across the customer's
   * outstanding sales starting with the oldest sales.
   */
  async function payCustomerCustomAmount() {
    if (!selectedCustomer) {
      return;
    }

    const nairaAmount = Number(paymentAmount);

    if (!Number.isFinite(nairaAmount) || nairaAmount <= 0) {
      setMessage("Please enter a valid payment amount.");
      return;
    }

    const paymentInKobo = Math.round(nairaAmount * 100);

    if (paymentInKobo > selectedCustomer.totalOwed) {
      setMessage(
        `Payment cannot be greater than ${formatMoney(
          selectedCustomer.totalOwed
        )}.`
      );
      return;
    }

    const customerSales = getCustomerSales(
      selectedCustomer.customerId
    ).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

    setSavingPayment(true);
    setMessage("");

    try {
      let remainingPayment = paymentInKobo;

      for (const sale of customerSales) {
        if (remainingPayment <= 0) {
          break;
        }

        const amountForThisSale = Math.min(
          remainingPayment,
          sale.amountOwed
        );

        const response = await fetch(
          "/api/debts/payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              saleId: sale.saleId,
              paymentAmount: amountForThisSale,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              `Could not record payment for Sale #${sale.saleId}`
          );
        }

        remainingPayment -= amountForThisSale;
      }

      const customerName = selectedCustomer.customerName;

      setSelectedCustomer(null);
      setPaymentAmount("");

      await loadData();

      setMessage(
        `${customerName} paid ${formatMoney(
          paymentInKobo
        )} successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not complete the payment."
      );

      await loadData();
    } finally {
      setSavingPayment(false);
    }
  }

  /*
   * Assign customer to an unassigned sale.
   */
  async function assignCustomer(saleId: number) {
    const customerId = Number(
      selectedCustomerForSale[saleId]
    );

    if (!customerId) {
      setMessage("Please select a customer first.");
      return;
    }

    setAssigningSaleId(saleId);
    setAssigningCustomer(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/debts/assign-customer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            saleId,
            customerId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.error || "Could not assign customer."
        );
        return;
      }

      setSelectedCustomerForSale((previous) => {
        const updated = { ...previous };
        delete updated[saleId];
        return updated;
      });

      await loadData();

      setMessage(
        `Customer assigned successfully. ${data.customer.name} now has this debt attached to their account.`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "Something went wrong while assigning the customer."
      );
    } finally {
      setAssigningSaleId(null);
      setAssigningCustomer(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 border-r bg-white md:flex md:flex-col">
          <div className="border-b px-6 py-6">
            <h1 className="text-2xl font-bold">
              NaijaBiz
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Your AI business assistant
            </p>
          </div>

          <nav className="flex-1 p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Main Menu
            </p>

            <div className="space-y-1">
              <a
                href="/"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <span className="w-5 text-center">
                  ⌂
                </span>
                Dashboard
              </a>

              <a
                href="/sales"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <span className="w-5 text-center">
                  ₦
                </span>
                Sales
              </a>

              <a
                href="/inventory"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <span className="w-5 text-center">
                  ▣
                </span>
                Inventory
              </a>

              <a
                href="/customers"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <span className="w-5 text-center">
                  ♙
                </span>
                Customers
              </a>

              <a
                href="/debts"
                className="flex w-full items-center gap-3 rounded-lg bg-gray-100 px-3 py-3 text-sm font-semibold text-black"
              >
                <span className="w-5 text-center">
                  ◉
                </span>
                Debts
              </a>

              <a
                href="#"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <span className="w-5 text-center">
                  ▥
                </span>
                Reports
              </a>
            </div>

            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              AI
            </p>

            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100">
              <span>✦</span>
              AI Assistant
            </button>
          </nav>

          <div className="border-t p-4">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-600 hover:bg-gray-100">
              ⚙
              Settings
            </button>

            <div className="mt-3 rounded-lg bg-gray-100 p-3">
              <p className="text-xs text-gray-500">
                Business account
              </p>

              <p className="mt-1 text-sm font-semibold">
                My Business
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-5 py-4 md:px-8">
            <div>
              <p className="text-sm text-gray-500">
                Business dashboard
              </p>

              <h2 className="text-lg font-semibold">
                Debts
              </h2>
            </div>

            <a
              href="/sales"
              className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              + Add Transaction
            </a>
          </header>

          <div className="p-5 md:p-8">

            <div className="mb-8">
              <h1 className="text-3xl font-bold">
                Customer Debts
              </h1>

              <p className="mt-2 text-gray-500">
                Track money customers owe your business.
              </p>
            </div>

            {/* MESSAGE */}
            {message && (
              <div className="mb-6 rounded-lg border bg-white px-4 py-3 text-sm">
                {message}
              </div>
            )}

            {/* SUMMARY */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <SummaryCard
                title="Total Money Owed"
                value={
                  loading
                    ? "Loading..."
                    : formatMoney(totalDebt)
                }
                description="All outstanding balances"
              />

              <SummaryCard
                title="Customer Debt"
                value={
                  loading
                    ? "Loading..."
                    : formatMoney(totalCustomerDebt)
                }
                description="Already linked to customers"
              />

              <SummaryCard
                title="Unassigned Debt"
                value={
                  loading
                    ? "Loading..."
                    : formatMoney(totalUnassignedDebt)
                }
                description="Needs customer details"
              />

              <SummaryCard
                title="Customers With Debt"
                value={
                  loading
                    ? "Loading..."
                    : customerDebts.length.toString()
                }
                description="Customers who currently owe money"
              />

            </div>

            {/* UNASSIGNED DEBTS */}
            <div className="mt-8 rounded-xl border bg-white p-6">

              <div>
                <h2 className="text-xl font-semibold">
                  Unassigned Debts
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  These sales have outstanding money but no
                  customer was recorded.
                </p>
              </div>

              {loading ? (
                <p className="mt-6 text-sm text-gray-500">
                  Loading...
                </p>
              ) : unassignedDebts.length === 0 ? (
                <div className="mt-6 rounded-lg bg-gray-100 p-5">
                  <p className="font-medium">
                    No unassigned debts
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    All outstanding sales are connected to customers.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">

                  {unassignedDebts.map((debt) => (
                    <div
                      key={debt.saleId}
                      className="rounded-xl border p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                          <p className="font-semibold">
                            Sale #{debt.saleId}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {new Date(
                              debt.createdAt
                            ).toLocaleString("en-NG", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <span>
                              Total:{" "}
                              <strong>
                                {formatMoney(
                                  debt.totalAmount
                                )}
                              </strong>
                            </span>

                            <span>
                              Paid:{" "}
                              <strong>
                                {formatMoney(
                                  debt.amountPaid
                                )}
                              </strong>
                            </span>

                            <span className="font-semibold text-red-600">
                              Owed:{" "}
                              {formatMoney(
                                debt.amountOwed
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="w-full lg:w-80">

                          <label className="mb-2 block text-sm font-medium">
                            Who owes this money?
                          </label>

                          <select
                            value={
                              selectedCustomerForSale[
                                debt.saleId
                              ] || ""
                            }
                            onChange={(event) =>
                              setSelectedCustomerForSale(
                                (previous) => ({
                                  ...previous,
                                  [debt.saleId]:
                                    event.target.value,
                                })
                              )
                            }
                            className="w-full rounded-lg border px-3 py-3 text-sm outline-none focus:border-black"
                          >
                            <option value="">
                              Select customer
                            </option>

                            {customers.map((customer) => (
                              <option
                                key={customer.id}
                                value={customer.id}
                              >
                                {customer.name}
                                {customer.phone
                                  ? ` — ${customer.phone}`
                                  : ""}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() =>
                              assignCustomer(
                                debt.saleId
                              )
                            }
                            disabled={
                              assigningCustomer &&
                              assigningSaleId ===
                                debt.saleId
                            }
                            className="mt-3 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {assigningCustomer &&
                            assigningSaleId ===
                              debt.saleId
                              ? "Assigning..."
                              : "Assign Customer"}
                          </button>

                        </div>

                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* CUSTOMER BALANCES */}
            <div className="mt-8 rounded-xl border bg-white p-6">

              <div>
                <h2 className="text-xl font-semibold">
                  Customer Balances
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Click a customer's total to see all their
                  outstanding sales and make a payment.
                </p>
              </div>

              {loading ? (
                <p className="mt-6 text-sm text-gray-500">
                  Loading...
                </p>
              ) : customerDebts.length === 0 ? (
                <p className="mt-6 text-sm text-gray-500">
                  No customers currently owe money.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto">

                  <table className="w-full min-w-[650px] text-left">

                    <thead>
                      <tr className="border-b text-sm text-gray-500">
                        <th className="pb-3 font-medium">
                          Customer
                        </th>

                        <th className="pb-3 font-medium">
                          Phone
                        </th>

                        <th className="pb-3 text-right font-medium">
                          Amount Owed
                        </th>

                        <th className="pb-3 text-right font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {customerDebts.map((customer) => (
                        <tr
                          key={customer.customerId}
                          className="border-b last:border-0"
                        >
                          <td className="py-4 font-medium">
                            {customer.customerName}
                          </td>

                          <td className="py-4 text-sm text-gray-500">
                            {customer.customerPhone ||
                              "—"}
                          </td>

                          {/* CLICKABLE TOTAL */}
                          <td className="py-4 text-right">
                            <button
                              onClick={() =>
                                openCustomerDebt(
                                  customer
                                )
                              }
                              className="font-bold text-red-600 underline decoration-dotted underline-offset-4 hover:text-red-800"
                            >
                              {formatMoney(
                                customer.totalOwed
                              )}
                            </button>
                          </td>

                          <td className="py-4 text-right">
                            <button
                              onClick={() =>
                                openCustomerDebt(
                                  customer
                                )
                              }
                              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                              View Debt
                            </button>
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* OUTSTANDING SALES */}
            <div className="mt-8 rounded-xl border bg-white p-6">

              <div>
                <h2 className="text-xl font-semibold">
                  Outstanding Sales
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Individual customer-linked sales with
                  outstanding balances.
                </p>
              </div>

              {loading ? (
                <p className="mt-6 text-sm text-gray-500">
                  Loading...
                </p>
              ) : debts.length === 0 ? (
                <p className="mt-6 text-sm text-gray-500">
                  No outstanding customer sales.
                </p>
              ) : (
                <div className="mt-6 space-y-4">

                  {debts.map((debt) => (
                    <div
                      key={debt.saleId}
                      className="rounded-xl border p-5"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>
                          <p className="font-semibold">
                            {debt.customerName}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Sale #{debt.saleId}
                            {debt.customerPhone
                              ? ` • ${debt.customerPhone}`
                              : ""}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {new Date(
                              debt.createdAt
                            ).toLocaleString("en-NG", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm">

                            <span>
                              Total:{" "}
                              <strong>
                                {formatMoney(
                                  debt.totalAmount
                                )}
                              </strong>
                            </span>

                            <span>
                              Paid:{" "}
                              <strong>
                                {formatMoney(
                                  debt.amountPaid
                                )}
                              </strong>
                            </span>

                            <span className="font-semibold text-red-600">
                              Owed:{" "}
                              {formatMoney(
                                debt.amountOwed
                              )}
                            </span>

                            <span className="font-medium">
                              {debt.paymentStatus}
                            </span>

                          </div>
                        </div>

                        <button
                          onClick={() =>
                            openPaymentForm(debt)
                          }
                          className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                          Record Payment
                        </button>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>

          </div>
        </section>
      </div>

      {/* ===================================================== */}
      {/* CUSTOMER COMPLETE DEBT MODAL */}
      {/* ===================================================== */}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="sticky top-0 border-b bg-white px-6 py-5">

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedCustomer.customerName}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedCustomer.customerPhone ||
                      "No phone number"}
                  </p>
                </div>

                <button
                  onClick={closeCustomerDebt}
                  disabled={savingPayment}
                  className="text-2xl text-gray-400 hover:text-black"
                >
                  ×
                </button>

              </div>

              <div className="mt-5 rounded-xl bg-gray-100 p-5">

                <p className="text-sm text-gray-500">
                  Total outstanding balance
                </p>

                <p className="mt-1 text-3xl font-bold text-red-600">
                  {formatMoney(
                    selectedCustomer.totalOwed
                  )}
                </p>

              </div>

            </div>

            {/* SALES */}
            <div className="p-6">

              <h3 className="text-lg font-semibold">
                Outstanding Sales
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                All sales currently contributing to this
                customer's balance.
              </p>

              <div className="mt-5 space-y-3">

                {getCustomerSales(
                  selectedCustomer.customerId
                ).map((sale) => (
                  <div
                    key={sale.saleId}
                    className="rounded-xl border p-4"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="font-semibold">
                          Sale #{sale.saleId}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(
                            sale.createdAt
                          ).toLocaleString("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-3 text-sm">

                          <span>
                            Total:{" "}
                            <strong>
                              {formatMoney(
                                sale.totalAmount
                              )}
                            </strong>
                          </span>

                          <span>
                            Paid:{" "}
                            <strong>
                              {formatMoney(
                                sale.amountPaid
                              )}
                            </strong>
                          </span>

                        </div>

                      </div>

                      <div className="text-left sm:text-right">

                        <p className="text-xs text-gray-500">
                          Owed
                        </p>

                        <p className="text-lg font-bold text-red-600">
                          {formatMoney(
                            sale.amountOwed
                          )}
                        </p>

                        <button
                          onClick={() => {
                            closeCustomerDebt();
                            openPaymentForm(sale);
                          }}
                          disabled={savingPayment}
                          className="mt-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                        >
                          Pay This Sale
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

              {/* PAYMENT OPTIONS */}
              <div className="mt-6 rounded-xl border bg-gray-50 p-5">

                <h3 className="font-semibold">
                  Make Payment
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  You can pay the customer's full balance
                  or enter a smaller amount.
                </p>

                <div className="mt-4">

                  <label className="mb-2 block text-sm font-medium">
                    Payment Amount (₦)
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter amount"
                    className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                  />

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">

                  {/* PAY FULL BALANCE */}
                  <button
                    onClick={() => {
                      setPaymentAmount(
                        (
                          selectedCustomer.totalOwed /
                          100
                        ).toString()
                      );
                    }}
                    disabled={savingPayment}
                    className="rounded-lg border bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-100"
                  >
                    Use Full Balance
                  </button>

                  {/* PAY CUSTOM */}
                  <button
                    onClick={payCustomerCustomAmount}
                    disabled={
                      savingPayment ||
                      !paymentAmount
                    }
                    className="rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingPayment
                      ? "Processing..."
                      : "Record Payment"}
                  </button>

                </div>

                {/* PAY EVERYTHING BUTTON */}
                <button
                  onClick={payCustomerFullBalance}
                  disabled={savingPayment}
                  className="mt-3 w-full rounded-lg bg-black px-4 py-4 text-sm font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPayment
                    ? "Processing Full Payment..."
                    : `Pay Full Balance — ${formatMoney(
                        selectedCustomer.totalOwed
                      )}`}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* INDIVIDUAL SALE PAYMENT MODAL */}
      {/* ===================================================== */}

      {showPaymentForm && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">

          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  Record Payment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedDebt.customerName}
                </p>

                <p className="text-xs text-gray-400">
                  Sale #{selectedDebt.saleId}
                </p>
              </div>

              <button
                onClick={closePaymentForm}
                disabled={savingPayment}
                className="text-xl text-gray-400 hover:text-black"
              >
                ×
              </button>

            </div>

            <div className="mt-6 rounded-lg bg-gray-100 p-4">

              <p className="text-sm text-gray-500">
                Outstanding balance
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatMoney(
                  selectedDebt.amountOwed
                )}
              </p>

            </div>

            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium">
                Payment Amount (₦)
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value
                  )
                }
                placeholder="Enter amount paid"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
              />

            </div>

            <button
              onClick={() =>
                setPaymentAmount(
                  (
                    selectedDebt.amountOwed /
                    100
                  ).toString()
                )
              }
              className="mt-3 text-sm font-medium underline"
            >
              Pay full sale balance
            </button>

            <div className="mt-6 flex gap-3">

              <button
                onClick={closePaymentForm}
                disabled={savingPayment}
                className="flex-1 rounded-lg border px-4 py-3 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={recordPayment}
                disabled={
                  savingPayment ||
                  !paymentAmount
                }
                className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPayment
                  ? "Saving..."
                  : "Record Payment"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

/* ========================================================= */
/* SUMMARY CARD */
/* ========================================================= */

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}