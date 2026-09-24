import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing-code", request.url)
      );
    }

    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("AUTH CALLBACK EXCHANGE ERROR:", error);

      return NextResponse.redirect(
        new URL("/auth/login?error=confirmation-failed", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/auth/finish", request.url)
    );
  } catch (error) {
    console.error("AUTH CALLBACK ERROR:", error);

    return NextResponse.redirect(
      new URL("/auth/login?error=callback-failed", request.url)
    );
  }
}
