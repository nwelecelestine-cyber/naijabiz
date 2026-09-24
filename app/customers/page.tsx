"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function formatDateTime(date?: string) {
  if (!date) return "—";

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
  });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [deletingCustomer, setDeletingCustomer] =
    useState<Customer | null>(null);

  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);

      const response = await fetch("/api/customers");
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers);
      } else {
        setMessage(data.error || "Could not load customers.");
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      setMessage("Could not load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setEditingCustomer(null);
    setShowForm(false);
  }

  function openAddForm() {
    setMessage("");
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setShowForm(true);
  }

  function openEditForm(customer: Customer) {
    setMessage("");
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setEmail(customer.email ?? "");
    setAddress(customer.address ?? "");
    setShowForm(true);
  }

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

      resetForm();
      setMessage("Customer added successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while adding the customer.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCustomer() {
    if (!editingCustomer) return;

    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter the customer name.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/customers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCustomer.id,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not update customer.");
        return;
      }

      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.id === editingCustomer.id
            ? data.customer
            : customer
        )
      );

      resetForm();
      setMessage("Customer updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while updating the customer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer() {
    if (!deletingCustomer) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deletingCustomer.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.error || "Could not delete customer.");
        setDeletingCustomer(null);
        return;
      }

      setCustomers((currentCustomers) =>
        currentCustomers.filter(
          (customer) => customer.id !== deletingCustomer.id
        )
      );

      setDeletingCustomer(null);
      setMessage("Customer deleted successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while deleting the customer.");
    } finally {
      setSaving(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
        String(customer.id),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [customers, search]);

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
            onClick={openAddForm}
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            + Add Customer
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-sm">
            {message}
          </div>
        )}

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="mb-8 rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add New Customer"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCustomer
                    ? "Update the customer's information."
                    : "Enter the customer's information."}
                </p>
              </div>

              <button
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-black disabled:opacity-50"
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  editingCustomer
                    ? updateCustomer
                    : addCustomer
                }
                disabled={saving}
                className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? editingCustomer
                    ? "Saving Changes..."
                    : "Adding Customer..."
                  : editingCustomer
                    ? "Save Changes"
                    : "Add Customer"}
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Customers
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  All customers currently registered in your business.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                ♙
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                {search
                  ? "No matching customers"
                  : "No customers yet"}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {search
                  ? "Try a different search term."
                  : "Add your first customer to start building your customer list."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
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

                    <th className="px-6 py-4 font-medium">
                      Created
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Updated
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
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

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDateTime(customer.createdAt)}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDateTime(customer.updatedAt)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openEditForm(customer)
                            }
                            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setDeletingCustomer(customer)
                            }
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DELETE CONFIRMATION */}
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold">
                Delete Customer?
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{deletingCustomer.name}</strong>?
                This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setDeletingCustomer(null)}
                  disabled={saving}
                  className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={deleteCustomer}
                  disabled={saving}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete Customer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}