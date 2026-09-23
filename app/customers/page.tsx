"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  async function loadCustomers() {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function addCustomer() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter the customer name.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not add customer.");
        return;
      }

      setCustomers((currentCustomers) => [
        ...currentCustomers,
        data.customer,
      ]);

      setName("");
      setPhone("");
      setEmail("");
      setAddress("");

      setMessage("Customer added successfully.");
      setShowForm(false);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while adding the customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-black"
            >
              ← Back to Dashboard
            </a>

            <h1 className="mt-4 text-3xl font-bold">
              Customers
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your customers and their contact information.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(true);
              setMessage("");
            }}
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Add Customer
          </button>

        </div>

        {/* ADD CUSTOMER FORM */}
        {showForm && (
          <div className="mb-8 rounded-xl border bg-white p-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Add New Customer
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the customer's information.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-black"
              >
                ✕
              </button>

            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Customer Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="e.g. customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Address
                </label>

                <input
                  type="text"
                  placeholder="e.g. Port Harcourt"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 outline-none focus:border-black"
                />
              </div>

            </div>

            {message && (
              <div className="mt-5 rounded-lg bg-gray-100 p-4 text-sm">
                {message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={addCustomer}
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Adding Customer..." : "Add Customer"}
              </button>

            </div>

          </div>
        )}

        {/* SUMMARY */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Total Customers
            </p>

            <p className="mt-3 text-3xl font-bold">
              {customers.length}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Registered customers
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Customers With Phone
            </p>

            <p className="mt-3 text-3xl font-bold">
              {customers.filter((customer) => customer.phone).length}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Customers with contact numbers
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Customer Records
            </p>

            <p className="mt-3 text-3xl font-bold">
              {customers.length}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Records stored in your business
            </p>
          </div>

        </div>

        {/* CUSTOMER TABLE */}
        <div className="mt-8 rounded-xl border bg-white">

          <div className="border-b p-6">
            <h2 className="text-lg font-semibold">
              Customers
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              All customers currently registered in your business.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                ♙
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No customers yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add your first customer to start building your customer list.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="border-b bg-gray-50 text-sm text-gray-500">

                  <tr>
                    <th className="px-6 py-4 font-medium">
                      Customer
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Phone
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Email
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Address
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {customers.map((customer) => (

                    <tr
                      key={customer.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >

                      <td className="px-6 py-5">

                        <p className="font-semibold">
                          {customer.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Customer #{customer.id}
                        </p>

                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {customer.email || "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {customer.address || "—"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}