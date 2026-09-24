"use client";

import { FormEvent, useEffect, useState } from "react";

type Business = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

type Account = {
  id: string;
  email: string | null;
};

type SettingsResponse = {
  success: boolean;
  error?: string;
  business?: Business;
  account?: Account;
};

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/business", {
        cache: "no-store",
      });

      const result: SettingsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Could not load settings."
        );
      }

      if (result.business) {
        setBusiness(result.business);
        setName(result.business.name || "");
        setPhone(result.business.phone || "");
        setEmail(result.business.email || "");
        setAddress(result.business.address || "");
      }

      if (result.account) {
        setAccount(result.account);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          address,
        }),
      });

      const result: SettingsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Could not save settings."
        );
      }

      if (result.business) {
        setBusiness(result.business);
        setName(result.business.name || "");
        setPhone(result.business.phone || "");
        setEmail(result.business.email || "");
        setAddress(result.business.address || "");
      }

      setMessage("Business information saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-400">
            Workspace
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your business information and account details.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Business Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These details identify your business throughout NaijaBiz.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-5 md:p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Business Name"
                value={name}
                onChange={setName}
                placeholder="My Business"
                required
              />

              <Field
                label="Phone Number"
                value={phone}
                onChange={setPhone}
                placeholder="08012345678"
              />

              <Field
                label="Business Email"
                value={email}
                onChange={setEmail}
                placeholder="business@example.com"
                type="email"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Business ID
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {business?.id ?? "—"}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Business Address
              </label>

              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter your business address"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your authenticated NaijaBiz account.
            </p>
          </div>

          <div className="space-y-4 p-5 md:p-6">
            <InfoRow
              label="Account email"
              value={account?.email || "Not available"}
            />

            <InfoRow
              label="Account ID"
              value={account?.id || "Not available"}
            />

            <InfoRow
              label="Business created"
              value={
                business?.createdAt
                  ? new Date(
                      business.createdAt
                    ).toLocaleDateString("en-NG", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not available"
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="p-5 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Account Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign out of your NaijaBiz account on this device.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/auth/logout";
              }}
              className="mt-5 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Log Out
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="break-all text-sm font-medium text-slate-800 sm:text-right">
        {value}
      </span>
    </div>
  );
}