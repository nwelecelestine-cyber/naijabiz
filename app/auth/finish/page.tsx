"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthFinishPage() {
  const router = useRouter();

  const [message, setMessage] = useState(
    "Finishing your account setup..."
  );

  useEffect(() => {
    let active = true;

    async function finishSetup() {
      try {
        const response = await fetch("/api/account/setup", {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            setMessage(
              data.error ||
                "Your account was confirmed, but business setup failed."
            );
          }

          return;
        }

        router.replace("/");
        router.refresh();
      } catch (error) {
        console.error("ACCOUNT FINISH ERROR:", error);

        if (active) {
          setMessage(
            "Something went wrong while finishing your account setup."
          );
        }
      }
    }

    finishSetup();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
          N
        </div>

        <h1 className="mt-5 text-xl font-bold text-slate-900">
          Setting up NaijaBiz
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {message}
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
        </div>
      </div>
    </main>
  );
}
