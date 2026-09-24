"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const trimmedBusinessName = businessName.trim();

    if (!trimmedBusinessName) {
      setMessage("Please enter your business name.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const redirectUrl =
      window.location.origin + "/auth/callback";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: trimmedBusinessName,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessage("Account could not be created.");
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage(
        "Account created. Please check your email and click the confirmation link to continue."
      );
      setLoading(false);
      return;
    }

    const setupResponse = await fetch("/api/account/setup", {
      method: "POST",
    });

    const setupData = await setupResponse.json();

    if (!setupResponse.ok || !setupData.success) {
      setMessage(
        setupData.error ||
          "Account was created, but business setup failed."
      );
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f5f7f2]">
      <div className="flex min-h-screen">

        {/* LEFT BRANDING PANEL */}
        <section className="relative hidden overflow-hidden bg-[#1f2923] lg:flex lg:w-1/2">

          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#7a9e7e]/20 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#9eb59f]/15 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* BRAND */}
            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  <img
                    src="/naijabiz-logo.png"
                    alt="NaijaBiz"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    NaijaBiz
                  </h1>

                  <p className="text-xs text-[#aebbb0]">
                    Business Management
                  </p>
                </div>

              </div>
            </div>

            {/* MAIN MESSAGE */}
            <div className="max-w-xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#c5cec7] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#9eb59f]" />
                Start managing your business
              </div>

              <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Everything your business
                <span className="block text-[#9eb59f]">
                  needs in one place.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-lg leading-8 text-[#aebbb0]">
                Create your NaijaBiz account and manage your products,
                customers, sales, payments and business finances from
                one simple workspace.
              </p>

              {/* FEATURES */}
              <div className="mt-10 grid grid-cols-2 gap-4">

                <Feature
                  icon="✓"
                  title="Inventory"
                  text="Track your products"
                />

                <Feature
                  icon="₦"
                  title="Sales"
                  text="Monitor your revenue"
                />

                <Feature
                  icon="◉"
                  title="Customers"
                  text="Manage customer records"
                />

                <Feature
                  icon="↗"
                  title="Insights"
                  text="Understand your business"
                />

              </div>

            </div>

            {/* FOOTER */}
            <p className="text-sm text-[#7f8d82]">
              © {new Date().getFullYear()} NaijaBiz. Built for Nigerian businesses.
            </p>

          </div>
        </section>

        {/* RIGHT SIGNUP PANEL */}
        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2">

          <div className="w-full max-w-md">

            {/* MOBILE BRAND */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                <img
                  src="/naijabiz-logo.png"
                  alt="NaijaBiz"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h1 className="font-bold text-[#253029]">
                  NaijaBiz
                </h1>

                <p className="text-xs text-[#7b857e]">
                  Business Management
                </p>
              </div>

            </div>

            {/* HEADING */}
            <div className="mb-8">

              <p className="mb-3 text-sm font-semibold tracking-wide text-[#5f8065]">
                GET STARTED
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#253029]">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7b857e]">
                Set up your business workspace and start managing your
                business with NaijaBiz.
              </p>

            </div>

            {/* SIGNUP CARD */}
            <div className="rounded-3xl border border-[#dfe6df] bg-white p-6 shadow-xl shadow-[#253029]/5 sm:p-8">

              <form onSubmit={handleSignup} className="space-y-5">

                {/* BUSINESS NAME */}
                <div>

                  <label
                    htmlFor="businessName"
                    className="mb-2 block text-sm font-semibold text-[#344139]"
                  >
                    Business Name
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9aa69d]">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
                        <path d="M4 21h16" />
                        <path d="M8 7h2" />
                        <path d="M14 7h2" />
                        <path d="M8 11h2" />
                        <path d="M14 11h2" />
                        <path d="M8 15h2" />
                        <path d="M14 15h2" />
                      </svg>
                    </div>

                    <input
                      id="businessName"
                      type="text"
                      required
                      autoComplete="organization"
                      value={businessName}
                      onChange={(event) =>
                        setBusinessName(event.target.value)
                      }
                      className="w-full rounded-xl border border-[#dfe6df] bg-[#f7f9f6] py-3.5 pl-11 pr-4 text-sm text-[#253029] outline-none transition placeholder:text-[#a4afa7] focus:border-[#7a9e7e] focus:bg-white focus:ring-4 focus:ring-[#7a9e7e]/10"
                      placeholder="Your business name"
                    />

                  </div>

                </div>

                {/* EMAIL */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#344139]"
                  >
                    Email address
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9aa69d]">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </div>

                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-[#dfe6df] bg-[#f7f9f6] py-3.5 pl-11 pr-4 text-sm text-[#253029] outline-none transition placeholder:text-[#a4afa7] focus:border-[#7a9e7e] focus:bg-white focus:ring-4 focus:ring-[#7a9e7e]/10"
                      placeholder="you@example.com"
                    />

                  </div>

                </div>

                {/* PASSWORD */}
                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#344139]"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9aa69d]">
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="10"
                          rx="2"
                        />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>

                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-[#dfe6df] bg-[#f7f9f6] py-3.5 pl-11 pr-4 text-sm text-[#253029] outline-none transition placeholder:text-[#a4afa7] focus:border-[#7a9e7e] focus:bg-white focus:ring-4 focus:ring-[#7a9e7e]/10"
                      placeholder="Create a password"
                    />

                  </div>

                  <p className="mt-2 text-xs text-[#8b968e]">
                    Password must be at least 6 characters.
                  </p>

                </div>

                {/* MESSAGE */}
                {message && (
                  <div className="rounded-xl border border-[#d6e5d6] bg-[#eef5ed] p-4 text-sm text-[#496a50]">
                    {message}
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a9e7e] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7a9e7e]/20 transition hover:bg-[#6d9272] hover:shadow-xl hover:shadow-[#7a9e7e]/25 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>

                      Creating account...
                    </>
                  ) : (
                    <>
                      Create NaijaBiz Account

                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>

              {/* LOGIN LINK */}
              <div className="mt-7 flex items-center justify-center gap-2 text-sm text-[#7b857e]">

                <span>Already have an account?</span>

                <a
                  href="/auth/login"
                  className="font-semibold text-[#5f8065] transition hover:text-[#496a50] hover:underline"
                >
                  Sign in
                </a>

              </div>

            </div>

            {/* SECURITY NOTE */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#9aa69d]">

              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              Your account information is securely protected.

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">

      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#7a9e7e]/20 text-sm font-bold text-[#b8cbb9]">
        {icon}
      </div>

      <p className="text-sm font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#9eaaa1]">
        {text}
      </p>

    </div>
  );
}
