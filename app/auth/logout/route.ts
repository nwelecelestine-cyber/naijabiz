import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("LOGOUT ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Could not log out.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL("/auth/login", request.url),
      303
    );
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not log out.",
      },
      { status: 500 }
    );
  }
}
